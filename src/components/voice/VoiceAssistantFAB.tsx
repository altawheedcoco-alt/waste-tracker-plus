import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, Ear, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistant, VoiceState } from '@/hooks/useVoiceAssistant';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAssistantFABProps {
  userRole?: string;
}

const stateConfig: Record<VoiceState, { color: string; icon: any; label: string; pulse: boolean }> = {
  idle: { color: 'bg-primary', icon: Mic, label: 'اضغط للتحدث', pulse: false },
  wake_listening: { color: 'bg-emerald-500', icon: Ear, label: 'أقول "يا نظام"...', pulse: true },
  listening: { color: 'bg-red-500', icon: Mic, label: 'بسمعك...', pulse: true },
  thinking: { color: 'bg-amber-500', icon: Loader2, label: 'بفكر...', pulse: false },
  speaking: { color: 'bg-blue-500', icon: Volume2, label: 'بتكلم...', pulse: true },
};

export default function VoiceAssistantFAB({ userRole }: VoiceAssistantFABProps) {
  const [expanded, setExpanded] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const {
    state,
    transcript,
    lastResponse,
    isSupported,
    startListening,
    stopListening,
    toggleWakeWord,
  } = useVoiceAssistant({ userRole, wakeWordEnabled: wakeEnabled });

  // Load wake word preference
  useEffect(() => {
    const saved = localStorage.getItem('voice_wake_enabled');
    if (saved === 'true') {
      setWakeEnabled(true);
      toggleWakeWord(true);
    }
  }, []);

  const handleWakeToggle = (enabled: boolean) => {
    setWakeEnabled(enabled);
    localStorage.setItem('voice_wake_enabled', String(enabled));
    toggleWakeWord(enabled);
  };

  const handleMainPress = () => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'idle' || state === 'wake_listening') {
      startListening();
    } else if (state === 'speaking') {
      stopListening();
    }
  };

  if (!isSupported) return null;

  const config = stateConfig[state];
  const IconComponent = config.icon;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2" dir="rtl">
      {/* Expanded Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl w-72 mb-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">🤖 المساعد الصوتي</h3>
              <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* State indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('w-2 h-2 rounded-full', config.pulse && 'animate-pulse',
                state === 'idle' ? 'bg-muted-foreground' : 
                state === 'listening' ? 'bg-red-500' :
                state === 'thinking' ? 'bg-amber-500' :
                state === 'speaking' ? 'bg-blue-500' :
                'bg-emerald-500'
              )} />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="bg-muted/50 rounded-lg p-2 mb-2">
                <p className="text-xs text-muted-foreground mb-0.5">أنت قلت:</p>
                <p className="text-sm text-foreground">{transcript}</p>
              </div>
            )}

            {/* Response */}
            {lastResponse && (
              <div className="bg-primary/10 rounded-lg p-2 mb-3">
                <p className="text-xs text-primary mb-0.5">النظام:</p>
                <p className="text-sm text-foreground">{lastResponse}</p>
              </div>
            )}

            {/* Wake Word Toggle */}
            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <Ear className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">كلمة التنبيه</p>
                  <p className="text-[10px] text-muted-foreground">قول "يا نظام" للتفعيل</p>
                </div>
              </div>
              <Switch checked={wakeEnabled} onCheckedChange={handleWakeToggle} />
            </div>

            {/* Quick commands */}
            <div className="mt-3 space-y-1">
              <p className="text-[10px] text-muted-foreground font-medium">أوامر سريعة:</p>
              <div className="flex flex-wrap gap-1">
                {['افتح الشحنات', 'شحنات النهارده', 'روح للحسابات'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => {
                      // Simulate voice command
                    }}
                    className="text-[10px] bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-full transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <div className="flex items-center gap-2">
        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMainPress}
          onDoubleClick={() => setExpanded(!expanded)}
          className={cn(
            'relative h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
            config.color,
            'text-white',
          )}
        >
          {/* Pulse rings */}
          {config.pulse && (
            <>
              <span className={cn('absolute inset-0 rounded-full animate-ping opacity-20', config.color)} />
              <span className={cn('absolute inset-[-4px] rounded-full animate-pulse opacity-10', config.color)} />
            </>
          )}

          <IconComponent className={cn('h-6 w-6 relative z-10', state === 'thinking' && 'animate-spin')} />
        </motion.button>

        {/* Expand toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center"
        >
          {expanded ? <X className="h-3.5 w-3.5 text-muted-foreground" /> : <Ear className="h-3.5 w-3.5 text-muted-foreground" />}
        </motion.button>
      </div>
    </div>
  );
}
