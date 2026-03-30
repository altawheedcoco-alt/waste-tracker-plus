import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic, MicOff, Loader2, Volume2, VolumeX, Trash2, AlertCircle, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceChat, VoiceChatState } from '@/hooks/useVoiceChat';
import ReactMarkdown from 'react-markdown';

const STATE_CONFIG: Record<VoiceChatState, { label: string; color: string; icon: React.ReactNode }> = {
  idle: { label: 'انقر للتحدث', color: 'from-emerald-500 to-teal-600', icon: <Mic className="h-8 w-8 text-white" /> },
  listening: { label: 'أتحدث الآن...', color: 'from-red-500 to-rose-600', icon: <MicOff className="h-8 w-8 text-white" /> },
  thinking: { label: 'جارٍ التفكير...', color: 'from-amber-500 to-orange-600', icon: <Loader2 className="h-8 w-8 text-white animate-spin" /> },
  speaking: { label: 'يتحدث المدرب...', color: 'from-blue-500 to-indigo-600', icon: <Volume2 className="h-8 w-8 text-white" /> },
};

const HealthLiveTab = () => {
  const {
    state,
    messages,
    currentTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    cancel,
    clearHistory,
    stopSpeaking,
  } = useVoiceChat();

  const config = STATE_CONFIG[state];

  const handleMicClick = () => {
    if (state === 'idle') {
      startListening();
    } else if (state === 'listening') {
      stopListening();
    } else if (state === 'speaking') {
      stopSpeaking();
    } else if (state === 'thinking') {
      cancel();
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-6 text-center space-y-3">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="font-bold text-sm">المتصفح غير مدعوم</h3>
        <p className="text-xs text-muted-foreground">
          يرجى استخدام متصفح Chrome أو Edge لتفعيل المحادثة الصوتية
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">المحادثة الصوتية الحية</h2>
            <p className="text-[10px] text-muted-foreground">تحدث مع المدرب الصحي AI صوتياً</p>
          </div>
        </CardContent>
      </Card>

      {/* Mic Button */}
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleMicClick}
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300',
            `bg-gradient-to-br ${config.color}`,
            state === 'listening' && 'animate-pulse scale-110 ring-4 ring-red-300/50',
            state === 'speaking' && 'ring-4 ring-blue-300/50',
            state === 'idle' && 'hover:scale-105 active:scale-95',
          )}
          disabled={state === 'thinking'}
        >
          {config.icon}
        </button>
        <p className="text-xs font-medium text-muted-foreground">{config.label}</p>

        {/* Live transcript while listening */}
        {state === 'listening' && currentTranscript && (
          <div className="bg-muted/60 rounded-xl px-4 py-2 max-w-[90%] text-center">
            <p className="text-xs text-foreground" dir="rtl">{currentTranscript}</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
          <p className="text-[11px] text-destructive">{error}</p>
        </div>
      )}

      {/* Conversation history */}
      {messages.length > 0 && (
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-between px-3 pt-3">
            <p className="text-[10px] text-muted-foreground font-medium">سجل المحادثة</p>
            <Button variant="ghost" size="sm" onClick={clearHistory} className="h-6 text-[10px] gap-1 text-muted-foreground">
              <Trash2 className="h-3 w-3" />
              مسح
            </Button>
          </div>
          <ScrollArea className="h-[250px] p-3">
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
          </ScrollArea>
        </Card>
      )}

      {/* Quick voice prompts when idle and no messages */}
      {messages.length === 0 && state === 'idle' && (
        <div className="text-center space-y-2 py-2">
          <p className="text-[10px] text-muted-foreground">أو اضغط على سؤال سريع:</p>
          {[
            'كيف أتجنب الإرهاق أثناء العمل؟',
            'ما نصائحك لحماية الجهاز التنفسي؟',
            'أشعر بصداع مستمر، ماذا أفعل؟',
          ].map(q => (
            <button
              key={q}
              onClick={() => {
                // Simulate sending text directly
                const event = new CustomEvent('voice-quick-prompt', { detail: q });
                window.dispatchEvent(event);
              }}
              className="block w-full text-right text-[11px] p-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-foreground"
              dir="rtl"
            >
              🎙️ {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthLiveTab;
