import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, Loader2, Volume2, Ear, X, ChevronUp, GraduationCap, Fingerprint, Heart, Smile, Frown, AlertTriangle, HelpCircle, Zap, Trash2, MessageCircle, Send, Clock, Keyboard, Star, History, StarOff, Sparkles, Radio, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceAssistant, VoiceState, SentimentEmotion } from '@/hooks/useVoiceAssistant';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { TRAINING_LESSONS, getOverallProgress, type TrainingLesson } from '@/lib/voiceTrainingMode';
import { enrollVoice, getVoiceProfiles, extractVoiceFeatures } from '@/lib/voiceFingerprint';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { getContextualCommands } from '@/lib/voiceContextCommands';
import { getFavorites, addFavorite, removeFavorite, getCommandHistory, clearCommandHistory, getMostUsedCommands, type VoiceFavorite } from '@/lib/voiceFavorites';

interface VoiceAssistantFABProps {
  userRole?: string;
}

const sentimentIcons: Record<SentimentEmotion, { icon: any; color: string; label: string; emoji: string }> = {
  neutral: { icon: Smile, color: 'text-muted-foreground', label: 'محايد', emoji: '' },
  happy: { icon: Heart, color: 'text-green-500', label: 'سعيد', emoji: '😊' },
  satisfied: { icon: Smile, color: 'text-emerald-500', label: 'راضي', emoji: '😌' },
  frustrated: { icon: Frown, color: 'text-orange-500', label: 'محبط', emoji: '😤' },
  angry: { icon: Frown, color: 'text-destructive', label: 'غاضب', emoji: '😠' },
  urgent: { icon: Zap, color: 'text-amber-500', label: 'مستعجل', emoji: '⚡' },
  confused: { icon: HelpCircle, color: 'text-purple-500', label: 'مرتبك', emoji: '🤔' },
};

type TabType = 'main' | 'training' | 'fingerprint' | 'favorites' | 'history';

// Animated waveform component
function AudioWave({ active, color = 'bg-primary' }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-[2px] h-4">
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className={cn('w-[3px] rounded-full', color)}
          animate={active ? {
            height: [4, 12 + Math.random() * 6, 6, 16, 4],
          } : { height: 4 }}
          transition={{
            duration: 0.6,
            repeat: active ? Infinity : 0,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Pulse ring around FAB
function PulseRings({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  return (
    <>
      <motion.span
        className={cn('absolute inset-0 rounded-full', color)}
        animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.span
        className={cn('absolute inset-0 rounded-full', color)}
        animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
      />
    </>
  );
}

export default function VoiceAssistantFAB({ userRole }: VoiceAssistantFABProps) {
  const [expanded, setExpanded] = useState(false);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [activeLesson, setActiveLesson] = useState<TrainingLesson | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [favorites, setFavorites] = useState<VoiceFavorite[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const {
    state,
    transcript,
    interimTranscript,
    lastResponse,
    lastSentiment,
    followUpSuggestion,
    isSupported,
    conversationActive,
    conversationHistory,
    sessionDuration,
    startListening,
    stopListening,
    toggleWakeWord,
    clearHistory,
    sendTextCommand,
    actionEngineState,
    currentQuestion,
    currentOptions,
    nextSuggestion,
    isActionActive,
  } = useVoiceAssistant({ userRole, wakeWordEnabled: wakeEnabled });

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [conversationHistory, transcript, interimTranscript]);

  useEffect(() => {
    const saved = localStorage.getItem('voice_wake_enabled');
    if (saved === 'true') { setWakeEnabled(true); toggleWakeWord(true); }
  }, []);

  useEffect(() => { setFavorites(getFavorites()); }, [activeTab]);
  useEffect(() => { if (conversationActive && !expanded) setExpanded(true); }, [conversationActive]);

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

  const handleAddFavorite = (command: string, label: string) => {
    addFavorite(command, label, '⭐');
    setFavorites(getFavorites());
    toast.success('تم إضافته للمفضلة!');
  };

  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
  };

  const handleEnrollVoice = useCallback(async () => {
    setEnrolling(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      toast.info('اتكلم لمدة 3 ثواني لتسجيل بصمتك...');
      const features = await extractVoiceFeatures(stream, 3000);
      stream.getTracks().forEach(t => t.stop());
      const name = `مستخدم ${getVoiceProfiles().length + 1}`;
      enrollVoice(name, features);
      toast.success('تم تسجيل البصمة الصوتية بنجاح!');
    } catch { toast.error('فشل في تسجيل البصمة الصوتية'); }
    finally { setEnrolling(false); }
  }, []);

  if (!isSupported) return null;

  const SentimentIcon = lastSentiment ? sentimentIcons[lastSentiment.emotion] : null;
  const contextualCommands = getContextualCommands(location.pathname, userRole);
  const commandHistoryList = getCommandHistory();
  const mostUsed = getMostUsedCommands(5);
  const profiles = getVoiceProfiles();
  const trainingProgress = getOverallProgress();

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}ث`;
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'دلوقتي';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعة`;
    return `${Math.floor(diff / 86400000)} يوم`;
  };

  const stateLabel = state === 'idle' ? 'اضغط للتحدث' : state === 'wake_listening' ? 'بستنى "يا نظام"...' : state === 'listening' ? 'بسمعك...' : state === 'thinking' ? 'بفكر...' : 'بتكلم...';
  const isActive = state === 'listening' || state === 'speaking' || state === 'thinking' || conversationActive;

  const fabColor = conversationActive
    ? 'from-red-500 to-rose-600'
    : state === 'listening'
    ? 'from-red-500 to-rose-600'
    : state === 'thinking'
    ? 'from-amber-400 to-orange-500'
    : state === 'speaking'
    ? 'from-primary to-emerald-500'
    : state === 'wake_listening'
    ? 'from-emerald-400 to-teal-500'
    : 'from-primary to-primary/80';

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'main', label: 'محادثة', icon: MessageCircle },
    { id: 'favorites', label: 'مفضلة', icon: Star },
    { id: 'history', label: 'سجل', icon: History },
    { id: 'training', label: 'تدريب', icon: GraduationCap },
    { id: 'fingerprint', label: 'بصمة', icon: Fingerprint },
  ];

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2" dir="rtl">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.85 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl w-[320px] mb-3 max-h-[72vh] overflow-hidden flex flex-col"
            style={{ boxShadow: '0 20px 60px -12px hsl(var(--primary) / 0.15), 0 8px 20px -8px rgba(0,0,0,0.1)' }}
          >
            {/* ─── Header ─── */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md',
                    fabColor
                  )}>
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-tight">نظام</h3>
                    <div className="flex items-center gap-1.5">
                      {conversationActive ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            نشط · {formatDuration(sessionDuration)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{stateLabel}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {conversationHistory.length > 0 && (
                    <button onClick={clearHistory} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="مسح">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Session progress bar */}
              {conversationActive && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  className="mt-2 h-0.5 bg-muted/30 rounded-full overflow-hidden origin-right"
                >
                  <motion.div
                    className="h-full bg-gradient-to-l from-primary to-emerald-500 rounded-full"
                    style={{ width: `${Math.min((sessionDuration / 120) * 100, 100)}%` }}
                    transition={{ duration: 1 }}
                  />
                </motion.div>
              )}
            </div>

            {/* ─── Tabs ─── */}
            <div className="px-3 pb-2">
              <div className="flex gap-0.5 bg-muted/20 rounded-xl p-1">
                {tabs.map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg transition-all font-medium',
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      )}
                    >
                      <TabIcon className="h-3 w-3" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Main Tab ─── */}
            {activeTab === 'main' && (
              <div className="flex flex-col flex-1 min-h-0 px-3 pb-3">
                {/* Active state visualization */}
                {(state === 'listening' || state === 'speaking') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center justify-center gap-3 py-2 mb-2 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10"
                  >
                    <AudioWave active={state === 'listening' || state === 'speaking'} color={state === 'listening' ? 'bg-destructive' : 'bg-primary'} />
                    <span className="text-xs font-medium text-foreground">
                      {state === 'listening' ? 'بسمعك...' : 'بتكلم...'}
                    </span>
                    <AudioWave active={state === 'listening' || state === 'speaking'} color={state === 'listening' ? 'bg-destructive' : 'bg-primary'} />
                  </motion.div>
                )}

                {/* Sentiment indicator */}
                {SentimentIcon && lastSentiment?.emotion !== 'neutral' && (
                  <div className={cn('flex items-center gap-1.5 mb-1.5 px-2 py-1 rounded-lg bg-muted/20', SentimentIcon.color)}>
                    <SentimentIcon.icon className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{SentimentIcon.label}</span>
                  </div>
                )}

                {/* Chat area */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2 mb-2 min-h-0 max-h-44 scrollbar-thin">
                  {conversationHistory.length > 0 ? (
                    <>
                      {conversationHistory.slice(-10).map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2, delay: i * 0.03 }}
                          className={cn(
                            'rounded-2xl px-3 py-2 text-xs max-w-[90%] group relative',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground mr-auto rounded-br-sm'
                              : 'bg-muted/40 text-foreground ml-auto rounded-bl-sm border border-border/30'
                          )}
                        >
                          {msg.content}
                          {msg.role === 'user' && (
                            <button
                              onClick={() => handleAddFavorite(msg.content, msg.content.slice(0, 20))}
                              className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-card border border-border shadow-sm flex items-center justify-center"
                              title="أضف للمفضلة"
                            >
                              <Star className="h-2.5 w-2.5 text-amber-500" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                      {state === 'listening' && (transcript || interimTranscript) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-2xl px-3 py-2 text-xs bg-primary/20 text-foreground mr-auto rounded-br-sm border border-dashed border-primary/30"
                        >
                          <span className="text-foreground/70">{interimTranscript || transcript}</span>
                          <span className="inline-block w-1 h-3 bg-primary animate-pulse mr-1 rounded" />
                        </motion.div>
                      )}
                      {state === 'thinking' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-2xl px-3 py-2 text-xs bg-muted/40 ml-auto rounded-bl-sm border border-border/30 flex items-center gap-2"
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                          <span className="text-muted-foreground">بفكر...</span>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10"
                      >
                        <Bot className="h-8 w-8 text-primary/40" />
                      </motion.div>
                      <p className="text-xs text-foreground font-medium mb-1">أهلاً بيك!</p>
                      <p className="text-[10px] text-muted-foreground">اضغط الميكروفون أو قول "يا نظام"</p>
                    </div>
                  )}
                </div>

                {/* Action Engine Status */}
                {(actionEngineState === 'active' || actionEngineState === 'waiting_input') && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/20 shrink-0"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] text-foreground font-medium">
                        {actionEngineState === 'active' ? 'جاري التنفيذ...' : 'في انتظار ردك...'}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Action Options */}
                {currentOptions.length > 0 && actionEngineState === 'waiting_input' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2 shrink-0"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {currentOptions.map((opt) => (
                        <motion.button
                          key={opt.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendTextCommand(opt.label)}
                          className="text-[11px] bg-primary/10 hover:bg-primary/20 text-foreground px-3 py-1.5 rounded-xl transition-colors border border-primary/15 font-medium"
                        >
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Next suggestion after completion */}
                {actionEngineState === 'completed' && nextSuggestion && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => sendTextCommand(nextSuggestion)}
                    className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-emerald-500/10 hover:from-primary/15 hover:to-emerald-500/15 transition-colors text-right w-full shrink-0 border border-primary/15"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[11px] text-foreground font-medium">التالي: {nextSuggestion}</span>
                  </motion.button>
                )}

                {/* Follow-up suggestion */}
                {followUpSuggestion && !isActionActive && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => sendTextCommand(followUpSuggestion)}
                    className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors text-right w-full shrink-0"
                  >
                    <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground">{followUpSuggestion}</span>
                  </motion.button>
                )}

                {/* Text Input */}
                <div className="flex gap-1.5 mb-2 shrink-0">
                  <Input
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTextSend()}
                    placeholder="اكتب أمرك هنا..."
                    className="h-9 text-xs rounded-xl bg-muted/20 border-border/30 focus:border-primary/50"
                    dir="rtl"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleTextSend}
                    disabled={!textInput.trim()}
                    className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-30 shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </motion.button>
                </div>

                {/* Quick Commands */}
                <div className="space-y-1.5 shrink-0">
                  <p className="text-[10px] text-muted-foreground font-medium">أوامر سريعة:</p>
                  <div className="flex flex-wrap gap-1">
                    {contextualCommands.slice(0, 6).map(cmd => (
                      <motion.button
                        key={cmd.command}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendTextCommand(cmd.command)}
                        disabled={state === 'thinking'}
                        className="text-[10px] bg-muted/30 hover:bg-muted/50 text-foreground px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-30 border border-border/20"
                      >
                        {cmd.icon} {cmd.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Wake Word Toggle */}
                <div className="flex items-center justify-between rounded-xl p-2.5 mt-2 shrink-0 bg-muted/10 border border-border/20">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Radio className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-foreground">التنبيه الصوتي</p>
                      <p className="text-[9px] text-muted-foreground">قول "يا نظام"</p>
                    </div>
                  </div>
                  <Switch checked={wakeEnabled} onCheckedChange={handleWakeToggle} />
                </div>
              </div>
            )}

            {/* ─── Favorites Tab ─── */}
            {activeTab === 'favorites' && (
              <div className="space-y-3 overflow-y-auto flex-1 px-3 pb-3">
                {favorites.length > 0 ? (
                  <div className="space-y-1.5">
                    {favorites.map(fav => (
                      <motion.div
                        key={fav.id}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 bg-muted/20 rounded-xl p-2.5 group border border-border/10 hover:border-primary/20 transition-colors"
                      >
                        <button onClick={() => sendTextCommand(fav.command)} className="flex-1 text-right">
                          <p className="text-xs font-medium text-foreground">{fav.icon} {fav.label}</p>
                          <p className="text-[10px] text-muted-foreground">استخدم {fav.usageCount} مرة</p>
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <StarOff className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">مافيش مفضلة لسه</p>
                    <p className="text-[10px] opacity-60 mt-1">مرّر على أمر واضغط النجمة</p>
                  </div>
                )}

                {mostUsed.length > 0 && (
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5">الأكثر استخداماً</p>
                    <div className="space-y-1">
                      {mostUsed.map((cmd, i) => (
                        <button
                          key={i}
                          onClick={() => sendTextCommand(cmd.command)}
                          className="w-full flex items-center justify-between bg-muted/10 hover:bg-muted/25 rounded-xl p-2 transition-colors text-right"
                        >
                          <span className="text-xs text-foreground truncate flex-1">{cmd.command}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 mr-2">{cmd.count}×</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── History Tab ─── */}
            {activeTab === 'history' && (
              <div className="space-y-2 overflow-y-auto flex-1 px-3 pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">سجل الأوامر</p>
                  {commandHistoryList.length > 0 && (
                    <button onClick={() => { clearCommandHistory(); setFavorites(getFavorites()); }} className="text-[10px] text-destructive hover:underline">
                      مسح
                    </button>
                  )}
                </div>

                {commandHistoryList.length > 0 ? (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {commandHistoryList.slice(0, 30).map((entry, i) => (
                      <button
                        key={i}
                        onClick={() => sendTextCommand(entry.command)}
                        className="w-full flex items-start gap-2 bg-muted/10 hover:bg-muted/25 rounded-xl p-2 transition-colors text-right group"
                      >
                        <span className="text-[10px] mt-0.5">{entry.success ? '✅' : '❌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{entry.command}</p>
                          <p className="text-[9px] text-muted-foreground/60">{formatTimeAgo(entry.timestamp)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">مافيش أوامر سابقة</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Training Tab ─── */}
            {activeTab === 'training' && (
              <div className="space-y-3 overflow-y-auto flex-1 px-3 pb-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">التقدم</span>
                    <span className="text-xs text-primary font-bold">{trainingProgress.percentage}%</span>
                  </div>
                  <Progress value={trainingProgress.percentage} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">
                    {trainingProgress.completed}/{trainingProgress.total} دروس
                  </p>
                </div>

                {activeLesson ? (
                  <div className="bg-primary/5 rounded-xl p-3 space-y-2 border border-primary/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground">{activeLesson.title}</h4>
                      <button onClick={() => setActiveLesson(null)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{activeLesson.description}</p>
                    <div className="bg-card/80 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground">تلميح:</p>
                      <p className="text-xs text-foreground font-medium">{activeLesson.hint}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={startListening} className="w-full text-xs bg-primary text-primary-foreground py-2 rounded-xl font-medium hover:opacity-90">
                      جرب الآن
                    </motion.button>
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
                          className={cn('w-full flex items-center gap-2 p-2.5 rounded-xl text-right transition-colors border', lessonDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/10 border-border/10 hover:border-primary/20')}
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

            {/* ─── Fingerprint Tab ─── */}
            {activeTab === 'fingerprint' && (
              <div className="space-y-3 overflow-y-auto flex-1 px-3 pb-3">
                <div className="rounded-xl p-4 text-center space-y-2 bg-gradient-to-b from-primary/5 to-transparent">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Fingerprint className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground">البصمة الصوتية</h4>
                  <p className="text-[10px] text-muted-foreground">سجل بصمتك لتأمين العمليات الحساسة</p>
                </div>

                {profiles.length > 0 && (
                  <div className="space-y-1.5">
                    {profiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-muted/10 rounded-xl p-2.5 border border-border/10">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.samples} عينات</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-medium">مسجل ✓</span>
                      </div>
                    ))}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEnrollVoice}
                  disabled={enrolling}
                  className={cn(
                    'w-full text-xs py-2.5 rounded-xl font-medium transition-all shadow-sm',
                    enrolling ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90'
                  )}
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      جاري التسجيل...
                    </span>
                  ) : (
                    profiles.length > 0 ? 'إضافة بصمة جديدة' : 'سجل بصمتك الصوتية'
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FAB Button ─── */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          onClick={handleMainPress}
          onDoubleClick={() => setExpanded(!expanded)}
          className={cn(
            'relative h-14 w-14 rounded-2xl shadow-xl flex items-center justify-center bg-gradient-to-br text-white',
            fabColor,
          )}
          style={{ boxShadow: isActive ? '0 8px 30px -4px hsl(var(--primary) / 0.5)' : '0 4px 15px -3px rgba(0,0,0,0.2)' }}
        >
          <PulseRings active={isActive} color={conversationActive ? 'bg-red-500' : 'bg-primary'} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              {conversationActive && state !== 'listening' ? (
                <MicOff className="h-6 w-6" />
              ) : state === 'thinking' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : state === 'speaking' ? (
                <Volume2 className="h-6 w-6" />
              ) : state === 'wake_listening' ? (
                <Ear className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Sentiment badge */}
          {lastSentiment && lastSentiment.emotion !== 'neutral' && !isActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-card border border-border shadow-sm"
            >
              {sentimentIcons[lastSentiment.emotion].emoji}
            </motion.span>
          )}

          {/* Conversation count */}
          {conversationActive && conversationHistory.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full border-2 border-background"
            >
              {Math.ceil(conversationHistory.length / 2)}
            </motion.span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setExpanded(!expanded)}
          className="h-8 w-8 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <X className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </motion.button>
      </div>
    </div>
  );
}
