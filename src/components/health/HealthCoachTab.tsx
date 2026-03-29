import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Send, Loader2, Sparkles, Heart, Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'ما نصائحك لتقليل التوتر أثناء العمل؟',
  'كيف أحسّن جودة نومي؟',
  'ما هي تمارين التنفس للاسترخاء؟',
  'أشعر بإرهاق شديد، ما الحل؟',
];

const SYSTEM_PROMPT = `أنت مدرب صحي ذكي متخصص في صحة العاملين في قطاع إدارة النفايات وإعادة التدوير.
- قدم نصائح عملية ومخصصة بناءً على طبيعة عمل المستخدم (سائق، عامل ميداني، موظف مكتبي).
- ركز على: الصحة المهنية، التوتر، الإرهاق، الترطيب، الحماية من المواد الخطرة، تمارين الإطالة.
- أجب بالعربية دائماً. كن ودوداً ومختصراً (3-5 جمل).
- لا تشخّص أمراضاً — انصح بزيارة الطبيب عند الحاجة.`;

const HealthCoachTab = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-unified-gateway', {
        body: {
          action: 'chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...allMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        },
      });

      if (error) throw error;
      const reply = data?.result || data?.choices?.[0]?.message?.content || 'عذراً، حدث خطأ. حاول مرة أخرى.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">المدرب الصحي الذكي</h2>
            <p className="text-[10px] text-muted-foreground">نصائح مخصصة لصحة العاملين في إدارة النفايات</p>
          </div>
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="border-0 shadow-sm">
        <ScrollArea className="h-[350px] p-3" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <Bot className="h-12 w-12 text-primary/30 mx-auto" />
              <p className="text-xs text-muted-foreground">اسألني عن أي موضوع صحي!</p>
              <div className="space-y-2">
                {QUICK_PROMPTS.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-right text-[11px] p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-foreground"
                  >
                    <Sparkles className="h-3 w-3 inline-block ml-1 text-primary" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn('flex mb-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-foreground text-[12px] leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[12px]">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-3">
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-[11px] text-muted-foreground">جارٍ التفكير...</span>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="اكتب سؤالك الصحي..."
            className="text-[12px]"
            dir="rtl"
            disabled={isLoading}
          />
          <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HealthCoachTab;
