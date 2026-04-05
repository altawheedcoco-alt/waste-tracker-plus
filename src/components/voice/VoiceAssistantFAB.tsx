import { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, Ear, X, ChevronDown, GraduationCap, Fingerprint, Heart, Smile, Frown, AlertTriangle, HelpCircle, Zap, Trash2, MessageCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistant, VoiceState, SentimentEmotion } from '@/hooks/useVoiceAssistant';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { TRAINING_LESSONS, getOverallProgress, type TrainingLesson } from '@/lib/voiceTrainingMode';
import { enrollVoice, getVoiceProfiles, extractVoiceFeatures } from '@/lib/voiceFingerprint';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface VoiceAssistantFABProps {
  userRole?: string;
}

const stateConfig: Record<VoiceState, { color: string; icon: any; label: string; pulse: boolean }> = {
  idle: { color: 'bg-primary', icon: Mic, label: 'اضغط للتحدث', pulse: false },
  wake_listening: { color: 'bg-emerald-500', icon: Ear, label: 'قول "يا نظام"...', pulse: true },
  listening: { color: 'bg-destructive', icon: Mic, label: 'بسمعك...', pulse: true },
  thinking: { color: 'bg-accent', icon: Loader2, label: 'بفكر...', pulse: false },
  speaking: { color: 'bg-primary', icon: Volume2, label: 'بتكلم...', pulse: true },
};

const sentimentIcons: Record<SentimentEmotion, { icon: any; color: string; label: string }> = {
  neutral: { icon: Smile, color: 'text-muted-foreground', label: 'محايد' },
  happy: { icon: Heart, color: 'text-green-500', label: 'سعيد' },
  satisfied: { icon: Smile, color: 'text-emerald-500', label: 'راضي' },
  frustrated: { icon: Frown, color: 'text-orange-500', label: 'محبط' },
  angry: { icon: Frown, color: 'text-destructive', label: 'غاضب' },
  urgent: { icon: Zap, color: 'text-amber-500', label: 'مستعجل' },
  confused: { icon: HelpCircle, color: 'text-purple-500', label: 'مرتبك' },
};

const QUICK_COMMANDS = [
  { label: '📦 الشحنات', command: 'افتح الشحنات' },
  { label: '📦 شحنات النهارده', command: 'عايز شحنات النهارده' },
  { label: '💰 الحسابات', command: 'روح للحسابات' },
  { label: '➕ شحنة جديدة', command: 'أنشئ شحنة جديدة' },
  { label: '📊 التقارير', command: 'افتح التقارير' },
  { label: '🚛 الأسطول', command: 'افتح الأسطول' },
  { label: '💬 المراسلات', command: 'افتح الشات' },
  { label: '🔔 الإشعارات', command: 'افتح الإشعارات' },
];

type TabType = 'main' | 'training' | 'fingerprint';

export default function VoiceAssistantFAB({ userRole }: VoiceAssistantFABProps) {
  const [expanded, setExpanded] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [activeLesson, setActiveLesson] = useState<TrainingLesson | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const {
    state,
    transcript,
    lastResponse,
    lastSentiment,
    followUpSuggestion,
    isSupported,
    conversationActive,
    conversationHistory,
    startListening,
    stopListening,
    toggleWakeWord,
    clearHistory,
    sendTextCommand,
  } = useVoiceAssistant({ userRole, wakeWordEnabled: wakeEnabled });

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, transcript]);

  useEffect(() => {
    const saved = localStorage.getItem('voice_wake_enabled');
    if (saved === 'true') { setWakeEnabled(true); toggleWakeWord(true); }
  }, []);

  const handleWakeToggle = (enabled: boolean) => {
    setWakeEnabled(enabled);
    localStorage.setItem('voice_wake_enabled', String(enabled));
    toggleWakeWord(enabled);
  };

  const handleMainPress = () => {
    if (state === 'listening' || conversationActive) stopListening();
    else if (state === 'idle' || state === 'wake_listening') startListening();
    else if (state === 'speaking') stopListening();
  };

  const handleTextSend = () => {
    if (!textInput.trim()) return;
    sendTextCommand(textInput.trim());
    setTextInput('');
  };

  const handleQuickCommand = (command: string) => {
    sendTextCommand(command);
  };

  const handleEnrollVoice = useCallback(async () => {
    setEnrolling(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      toast.info('🎤 اتكلم لمدة 3 ثواني لتسجيل بصمتك...');
      const features = await extractVoiceFeatures(stream, 3000);
      stream.getTracks().forEach(t => t.stop());
      const name = `مستخدم ${getVoiceProfiles().length + 1}`;
      enrollVoice(name, features);
      toast.success('✅ تم تسجيل البصمة الصوتية بنجاح!');
    } catch { toast.error('فشل في تسجيل البصمة الصوتية'); }
    finally { setEnrolling(false); }
  }, []);

  if (!isSupported) return null;

  const config = stateConfig[state];
  const IconComponent = config.icon;
  const trainingProgress = getOverallProgress();
  const profiles = getVoiceProfiles();
  const SentimentIcon = lastSentiment ? sentimentIcons[lastSentiment.emotion] : null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2" dir="rtl">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-2xl w-80 mb-2 max-h-[70vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">🤖 المساعد الذكي</h3>
                {conversationActive && (
                  <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                    نشط
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {conversationHistory.length > 0 && (
                  <button onClick={clearHistory} className="text-muted-foreground hover:text-destructive p-1 rounded" title="مسح">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-3 bg-muted/30 rounded-lg p-1">
              {([
                { id: 'main' as TabType, label: '🎤 رئيسي' },
                { id: 'training' as TabType, label: '🎓 تدريب' },
                { id: 'fingerprint' as TabType, label: '🔐 بصمة' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 text-[10px] py-1.5 rounded-md transition-colors font-medium',
                    activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Main Tab */}
            {activeTab === 'main' && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Conversation Mode Banner */}
                {conversationActive && (
                  <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] text-primary font-medium">
                      بسمعك — قول &quot;خلاص&quot; للإنهاء
                    </span>
                  </div>
                )}

                {/* State + Sentiment */}
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', config.pulse && 'animate-pulse',
                      state === 'idle' ? 'bg-muted-foreground' :
                      state === 'listening' ? 'bg-destructive' :
                      state === 'thinking' ? 'bg-accent' :
                      state === 'speaking' ? 'bg-primary' : 'bg-emerald-500'
                    )} />
                    <span className="text-xs text-muted-foreground">{config.label}</span>
                  </div>
                  {SentimentIcon && (
                    <div className={cn('flex items-center gap-1', SentimentIcon.color)}>
                      <SentimentIcon.icon className="h-3.5 w-3.5" />
                      <span className="text-[10px]">{SentimentIcon.label}</span>
                    </div>
                  )}
                </div>

                {/* Conversation History */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-1.5 mb-2 min-h-0 max-h-36">
                  {conversationHistory.length > 0 ? (
                    <>
                      {conversationHistory.slice(-8).map((msg, i) => (
                        <div
                          key={i}
                          className={cn(
                            'rounded-lg p-2 text-xs',
                            msg.role === 'user' ? 'bg-muted/50 text-foreground' : 'bg-primary/10 text-foreground'
                          )}
                        >
                          <span className="text-[10px] text-muted-foreground mb-0.5 block">
                            {msg.role === 'user' ? '🗣️ أنت' : '🤖 نظام'}
                          </span>
                          {msg.content}
                        </div>
                      ))}
                      {state === 'listening' && transcript && (
                        <div className="rounded-lg p-2 text-xs bg-muted/30 border border-dashed border-muted-foreground/30">
                          <span className="text-[10px] text-muted-foreground block">🎤 ...</span>
                          <span className="text-foreground/70">{transcript}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {transcript && (
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground mb-0.5">أنت قلت:</p>
                          <p className="text-sm text-foreground">{transcript}</p>
                        </div>
                      )}
                      {lastResponse && (
                        <div className="bg-primary/10 rounded-lg p-2">
                          <p className="text-xs text-primary mb-0.5">النظام:</p>
                          <p className="text-sm text-foreground">{lastResponse}</p>
                        </div>
                      )}
                      {!transcript && !lastResponse && (
                        <div className="text-center py-4 text-muted-foreground">
                          <Mic className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">اضغط الزر أو قول "يا نظام" للبدء</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Follow-up suggestion */}
                {followUpSuggestion && (
                  <button
                    onClick={() => sendTextCommand(followUpSuggestion)}
                    className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-right w-full shrink-0"
                  >
                    <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground">{followUpSuggestion}</span>
                  </button>
                )}

                {/* Text Input */}
                {showTextInput && (
                  <div className="flex gap-1.5 mb-2 shrink-0">
                    <Input
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTextSend()}
                      placeholder="اكتب أمرك هنا..."
                      className="h-8 text-xs"
                      dir="rtl"
                    />
                    <button
                      onClick={handleTextSend}
                      disabled={!textInput.trim()}
                      className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Quick Commands */}
                <div className="space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium">أوامر سريعة:</p>
                    <button
                      onClick={() => setShowTextInput(!showTextInput)}
                      className="text-[10px] text-primary hover:underline"
                    >
                      {showTextInput ? 'إخفاء' : '⌨️ كتابة'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_COMMANDS.map(cmd => (
                      <button
                        key={cmd.command}
                        onClick={() => handleQuickCommand(cmd.command)}
                        disabled={state === 'thinking'}
                        className="text-[10px] bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wake Word Toggle */}
                <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2 mt-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Ear className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">كلمة التنبيه</p>
                      <p className="text-[10px] text-muted-foreground">قول "يا نظام"</p>
                    </div>
                  </div>
                  <Switch checked={wakeEnabled} onCheckedChange={handleWakeToggle} />
                </div>
              </div>
            )}

            {/* Training Tab */}
            {activeTab === 'training' && (
              <div className="space-y-3 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">تقدمك في التدريب</span>
                    <span className="text-xs text-primary font-bold">{trainingProgress.percentage}%</span>
                  </div>
                  <Progress value={trainingProgress.percentage} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">
                    {trainingProgress.completed}/{trainingProgress.total} دروس مكتملة
                  </p>
                </div>

                {activeLesson ? (
                  <div className="bg-primary/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">{activeLesson.title}</h4>
                      <button onClick={() => setActiveLesson(null)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{activeLesson.description}</p>
                    <div className="bg-card rounded-md p-2">
                      <p className="text-[10px] text-muted-foreground">💡 تلميح:</p>
                      <p className="text-xs text-foreground font-medium">{activeLesson.hint}</p>
                    </div>
                    <button onClick={startListening} className="w-full text-xs bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90">
                      🎤 جرب الآن
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {TRAINING_LESSONS.map(lesson => {
                      const lessonDone = localStorage.getItem('voice_training_progress')
                        ? JSON.parse(localStorage.getItem('voice_training_progress') || '[]').find((p: any) => p.lessonId === lesson.id)?.completed
                        : false;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(lesson)}
                          className={cn('w-full flex items-center gap-2 p-2 rounded-lg text-right transition-colors', lessonDone ? 'bg-emerald-500/10' : 'bg-muted/30 hover:bg-muted/50')}
                        >
                          <span className="text-sm">{lessonDone ? '✅' : '📝'}</span>
                          <div className="flex-1 text-right">
                            <p className="text-xs font-medium text-foreground">{lesson.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {lesson.difficulty === 'easy' ? '⭐ سهل' : lesson.difficulty === 'medium' ? '⭐⭐ متوسط' : '⭐⭐⭐ متقدم'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Fingerprint Tab */}
            {activeTab === 'fingerprint' && (
              <div className="space-y-3 overflow-y-auto flex-1">
                <div className="bg-muted/30 rounded-lg p-3 text-center space-y-2">
                  <Fingerprint className="h-8 w-8 text-primary mx-auto" />
                  <h4 className="text-xs font-bold text-foreground">البصمة الصوتية</h4>
                  <p className="text-[10px] text-muted-foreground">سجل بصمتك لتأكيد العمليات الحساسة</p>
                </div>

                {profiles.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">البصمات المسجلة:</p>
                    {profiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.samples} عينات</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-500">✓ مسجل</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleEnrollVoice}
                  disabled={enrolling}
                  className={cn(
                    'w-full text-xs py-2.5 rounded-lg font-medium transition-all',
                    enrolling ? 'bg-muted text-muted-foreground cursor-wait' : 'bg-primary text-primary-foreground hover:opacity-90'
                  )}
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      جاري التسجيل...
                    </span>
                  ) : (
                    `🎤 ${profiles.length > 0 ? 'إضافة بصمة جديدة' : 'سجل بصمتك الصوتية'}`
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleMainPress}
          onDoubleClick={() => setExpanded(!expanded)}
          className={cn(
            'relative h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
            conversationActive ? 'bg-destructive' : config.color,
            'text-white',
          )}
        >
          {(config.pulse || conversationActive) && (
            <>
              <span className={cn('absolute inset-0 rounded-full animate-ping opacity-20', conversationActive ? 'bg-destructive' : config.color)} />
              <span className={cn('absolute inset-[-4px] rounded-full animate-pulse opacity-10', conversationActive ? 'bg-destructive' : config.color)} />
            </>
          )}
          {conversationActive && state !== 'listening' ? (
            <MicOff className="h-6 w-6 relative z-10" />
          ) : (
            <IconComponent className={cn('h-6 w-6 relative z-10', state === 'thinking' && 'animate-spin')} />
          )}

          {/* Sentiment badge */}
          {lastSentiment && lastSentiment.emotion !== 'neutral' && state === 'idle' && !conversationActive && (
            <span className={cn(
              'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-card border border-border shadow-sm',
              sentimentIcons[lastSentiment.emotion].color
            )}>
              {lastSentiment.emotion === 'happy' ? '😊' :
               lastSentiment.emotion === 'frustrated' ? '😤' :
               lastSentiment.emotion === 'angry' ? '😠' :
               lastSentiment.emotion === 'urgent' ? '⚡' :
               lastSentiment.emotion === 'confused' ? '🤔' :
               lastSentiment.emotion === 'satisfied' ? '😌' : ''}
            </span>
          )}

          {/* Conversation count badge */}
          {conversationActive && conversationHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full border-2 border-background">
              {Math.ceil(conversationHistory.length / 2)}
            </span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />}
        </motion.button>
      </div>
    </div>
  );
}
