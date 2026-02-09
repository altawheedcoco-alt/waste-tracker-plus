import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles, X, Send, Loader2, Bot, User,
  FileText, BarChart3, Calendar, ClipboardList,
  Download, Copy, Upload, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type TaskType = 'general' | 'plan' | 'document' | 'analysis' | 'schedule';

const TASK_PRESETS: { type: TaskType; label: string; icon: any; description: string }[] = [
  { type: 'plan', label: 'خطة عمل', icon: ClipboardList, description: 'إنشاء خطط سنوية/شهرية/أسبوعية' },
  { type: 'document', label: 'مستند رسمي', icon: FileText, description: 'إقرارات وشهادات وخطابات' },
  { type: 'analysis', label: 'تحليل بيانات', icon: BarChart3, description: 'تحليل ومقارنة وتوصيات' },
  { type: 'schedule', label: 'جدولة عمليات', icon: Calendar, description: 'توزيع أحمال وتخصيص موارد' },
];

const AIOperationsAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskType>('general');
  const [showPresets, setShowPresets] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { organization } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (allMessages: Message[], taskType: TaskType) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-operations-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            taskType: taskType !== 'general' ? taskType : undefined,
            dbContext: { organizationId: organization?.id },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "فشل في الاتصال");
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      toast.error(message);
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setShowPresets(false);
    await streamChat(newMessages, activeTask);
  };

  const handlePresetClick = (type: TaskType) => {
    setActiveTask(type);
    setShowPresets(false);
    const preset = TASK_PRESETS.find(p => p.type === type);
    toast.info(`وضع: ${preset?.label}`, { description: preset?.description });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const truncated = content.slice(0, 3000);
      setInput(prev => prev + `\n\n[محتوى الملف: ${file.name}]\n${truncated}`);
      toast.success(`تم تحميل: ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const copyLastResponse = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content);
      toast.success('تم النسخ');
    }
  };

  const exportAsPDF = () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant) return;
    // Create a printable window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl"><head><title>تقرير النظام الشخصي السريع</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;line-height:1.8;direction:rtl}
      table{border-collapse:collapse;width:100%;margin:16px 0}
      td,th{border:1px solid #ddd;padding:8px;text-align:right}
      th{background:#f5f5f5}h1,h2,h3{color:#1a5632}</style></head>
      <body><h1>تقرير النظام الشخصي السريع</h1>
      <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p><hr/>
      <div>${lastAssistant.content.replace(/\n/g, '<br/>')}</div>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setActiveTask('general');
    setShowPresets(true);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center touch-manipulation"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          color: 'hsl(var(--primary-foreground))',
        }}
        title="النظام الشخصي السريع"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Full Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -400 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-y-0 left-0 z-[60] w-full sm:w-[480px] bg-card border-r border-border shadow-2xl flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-l from-primary/10 to-accent/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">النظام الشخصي السريع</h3>
                    <p className="text-xs text-muted-foreground">
                      {activeTask !== 'general'
                        ? TASK_PRESETS.find(p => p.type === activeTask)?.label
                        : 'مساعد تشغيلي ذكي'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <>
                      <Button variant="ghost" size="icon" onClick={copyLastResponse} title="نسخ آخر رد">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={exportAsPDF} title="تصدير PDF">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={startNewChat} title="محادثة جديدة">
                        <ClipboardList className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Task Mode Selector */}
              {activeTask !== 'general' && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {TASK_PRESETS.find(p => p.type === activeTask)?.label}
                  </Badge>
                  <button
                    onClick={() => { setActiveTask('general'); setShowPresets(true); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    تغيير الوضع
                  </button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {/* Presets */}
                {showPresets && messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      اختر نوع المهمة أو اكتب طلبك مباشرة
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {TASK_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        return (
                          <button
                            key={preset.type}
                            onClick={() => handlePresetClick(preset.type)}
                            className="p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-right"
                          >
                            <Icon className="w-5 h-5 text-primary mb-1" />
                            <p className="font-semibold text-sm text-foreground">{preset.label}</p>
                            <p className="text-xs text-muted-foreground">{preset.description}</p>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">أمثلة سريعة:</p>
                      {[
                        'اعملي خطة سنوية لـ 6 شركات بإجمالي 100 طن خشب',
                        'صيغ لي إقرار استلام شحنة بلاستيك',
                        'حلل لي بيانات الشحنات لهذا الشهر',
                        'جدول لي عمليات الجمع للأسبوع القادم',
                      ].map((example, i) => (
                        <button
                          key={i}
                          onClick={() => { setInput(example); setShowPresets(false); }}
                          className="w-full text-right text-xs p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-foreground"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Chat Messages */}
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-primary' : 'bg-accent/20'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-3.5 h-3.5 text-primary-foreground" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                    <div className={`max-w-[85%] rounded-xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <div className="prose prose-sm max-w-none text-inherit [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-xl p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-border bg-background/80">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.xlsx,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="رفع ملف"
                  className="shrink-0"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب طلبك... مثال: اعملي خطة شهرية"
                  className="flex-1"
                  disabled={isLoading}
                  dir="rtl"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm sm:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AIOperationsAssistant;
