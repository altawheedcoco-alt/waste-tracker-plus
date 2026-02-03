import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, MapPin, Loader2, X, Sparkles, 
  Navigation, Copy, Maximize2, Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LocationResult {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  type?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  locations?: LocationResult[];
  isLoading?: boolean;
}

interface AILocationChatProps {
  onLocationSelect: (location: LocationResult) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const AILocationChat = ({ onLocationSelect, isExpanded = false, onToggleExpand }: AILocationChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي للبحث عن المواقع. أخبرني عن أي موقع تريد البحث عنه وسأعرضه لك مباشرة على الخريطة. 🗺️\n\nمثال: "أين يقع مصنع الحديد والصلب في حلوان؟"',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractLocationsFromResponse = (content: string): LocationResult[] => {
    const locations: LocationResult[] = [];
    
    // Try to parse JSON locations from the response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed)) {
          return parsed.filter(loc => loc.lat && loc.lng);
        } else if (parsed.lat && parsed.lng) {
          return [parsed];
        }
      } catch {}
    }
    
    // Also look for inline JSON arrays
    const inlineJsonMatch = content.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (inlineJsonMatch) {
      try {
        const parsed = JSON.parse(inlineJsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.filter(loc => loc.lat && loc.lng);
        }
      } catch {}
    }

    return locations;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      isLoading: true
    }]);

    try {
      const systemPrompt = `أنت مساعد ذكي متخصص في البحث عن المواقع والعناوين في مصر.

مهمتك الرئيسية:
1. فهم استفسار المستخدم عن الموقع
2. البحث عن الموقع وإرجاع إحداثياته الدقيقة
3. إعطاء معلومات مفيدة عن الموقع

قواعد مهمة:
- أجب دائماً باللغة العربية
- عند إيجاد موقع، أرجع الإحداثيات بصيغة JSON
- إذا وجدت مواقع متعددة، أرجع قائمة بها
- أضف وصفاً موجزاً للموقع
- إذا لم تجد الموقع، اقترح مواقع مشابهة

صيغة الإحداثيات (أضف هذا في نهاية ردك):
\`\`\`json
[{"name": "اسم الموقع", "lat": 30.0444, "lng": 31.2357, "address": "العنوان الكامل", "type": "factory|zone|city|area"}]
\`\`\`

المصانع والمناطق الصناعية المصرية المعروفة:
- مصنع الحديد والصلب - حلوان: lat: 29.8400, lng: 31.3167
- المنطقة الصناعية بالعاشر من رمضان: lat: 30.2500, lng: 31.7500
- المنطقة الصناعية بالسادس من أكتوبر: lat: 29.9375, lng: 30.9278
- المنطقة الصناعية ببرج العرب: lat: 30.8333, lng: 29.6667
- مدينة السادات الصناعية: lat: 30.3667, lng: 30.5333
- المنطقة الصناعية بالعين السخنة: lat: 29.6333, lng: 32.3500
- مدينة بدر الصناعية: lat: 30.1167, lng: 31.7000
- منطقة شبرا الخيمة الصناعية: lat: 30.1167, lng: 31.2500
- المنطقة الصناعية بالمحلة الكبرى: lat: 30.9667, lng: 31.1667
- أسمنت طره - حلوان: lat: 29.9167, lng: 31.2833
- مصنع التوحيد للأخشاب - 6 أكتوبر: lat: 29.9375, lng: 30.9278`;

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'assistant' || !m.isLoading).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: input.trim() }
          ]
        }
      });

      if (response.error) throw response.error;

      // Handle streaming response
      const reader = response.data.getReader?.();
      let fullContent = '';
      
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                fullContent += content;
                
                // Update message with partial content
                setMessages(prev => prev.map(m => 
                  m.id === loadingId 
                    ? { ...m, content: fullContent, isLoading: false }
                    : m
                ));
              } catch {}
            }
          }
        }
      } else {
        // Non-streaming fallback
        fullContent = response.data?.result || response.data?.choices?.[0]?.message?.content || '';
      }

      // Extract locations from the response
      const locations = extractLocationsFromResponse(fullContent);
      
      // Update final message with locations
      setMessages(prev => prev.map(m => 
        m.id === loadingId 
          ? { ...m, content: fullContent, locations, isLoading: false }
          : m
      ));

      // Auto-select first location if found
      if (locations.length > 0) {
        onLocationSelect(locations[0]);
        toast.success(`تم تحديد موقع: ${locations[0].name}`);
      }

    } catch (error) {
      console.error('AI Location Chat error:', error);
      setMessages(prev => prev.map(m => 
        m.id === loadingId 
          ? { ...m, content: 'عذراً، حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.', isLoading: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    // Clean content by removing JSON blocks for display
    const displayContent = message.content
      .replace(/```json\n?[\s\S]*?\n?```/g, '')
      .replace(/\[\s*\{[\s\S]*?\}\s*\]/g, '')
      .trim();
    
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex gap-2',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-purple-500/20 text-purple-600'
        )}>
          {isUser ? (
            <span className="text-xs font-bold">أنت</span>
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>
        
        <div className={cn(
          'flex-1 max-w-[85%]',
          isUser ? 'text-left' : 'text-right'
        )}>
          <div className={cn(
            'rounded-xl px-3 py-2 text-sm',
            isUser 
              ? 'bg-primary text-primary-foreground rounded-tr-none' 
              : 'bg-muted rounded-tl-none'
          )}>
            {message.isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري البحث...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{displayContent || message.content}</div>
            )}
          </div>
          
          {/* Location Results */}
          {message.locations && message.locations.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.locations.map((loc, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{loc.name}</p>
                        {loc.address && (
                          <p className="text-xs text-muted-foreground">{loc.address}</p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono mt-1" dir="ltr">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          onLocationSelect(loc);
                          toast.success('تم تحديد الموقع على الخريطة');
                        }}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`${loc.lat}, ${loc.lng}`);
                          toast.success('تم نسخ الإحداثيات');
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          window.open(`https://www.google.com/maps?q=${loc.lat},${loc.lng}`, '_blank');
                        }}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'bg-background border rounded-xl shadow-lg overflow-hidden flex flex-col',
        isExpanded ? 'h-[500px]' : 'h-[350px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-l from-purple-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">مساعد المواقع الذكي</h4>
            <p className="text-xs text-muted-foreground">اسألني عن أي موقع</p>
          </div>
        </div>
        <div className="flex gap-1">
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleExpand}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map(renderMessage)}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="اسألني عن موقع... (مثال: أين مصنع الحديد والصلب؟)"
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
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['أين مصنع الحديد والصلب؟', 'المنطقة الصناعية بالعاشر', 'مصانع بالسادس من أكتوبر'].map((suggestion) => (
            <Badge
              key={suggestion}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 text-xs"
              onClick={() => {
                setInput(suggestion);
                inputRef.current?.focus();
              }}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AILocationChat;
