import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Mic, MicOff, Loader2, Volume2, Ear, X, ChevronDown, GraduationCap, Fingerprint, Heart, Smile, Frown, AlertTriangle, HelpCircle, Zap, Trash2, MessageCircle, Send, Clock, Keyboard, Star, History, StarOff } from 'lucide-react';
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

type TabType = 'main' | 'training' | 'fingerprint' | 'favorites' | 'history';

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
    // Action engine
    actionEngineState,
    currentQuestion,
    currentOptions,
    nextSuggestion,
    isActionActive,
  } = useVoiceAssistant({ userRole, wakeWordEnabled: wakeEnabled });

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversationHistory, transcript, interimTranscript]);

  useEffect(() => {
    const saved = localStorage.getItem('voice_wake_enabled');
    if (saved === 'true') { setWakeEnabled(true); toggleWakeWord(true); }
  }, []);

  // Refresh favorites
  useEffect(() => {
    setFavorites(getFavorites());
  }, [activeTab]);

  // Auto expand on conversation start
  useEffect(() => {
    if (conversationActive && !expanded) setExpanded(true);
  }, [conversationActive]);

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
    toast.success('تم إضافته للمفضلة! ⭐');
  };

  const handleRemoveFavorite = (id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
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
  const contextualCommands = getContextualCommands(location.pathname, userRole);
  const commandHistoryList = getCommandHistory();
  const mostUsed = getMostUsedCommands(5);

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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'main', label: '🎤' },
    { id: 'favorites', label: '⭐' },
    { id: 'history', label: '📜' },
    { id: 'training', label: '🎓' },
    { id: 'fingerprint', label: '🔐' },
  ];

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
                <h3 className="text-sm font-bold text-foreground">🤖 نظام</h3>
                {conversationActive && (
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                      نشط
                    </span>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDuration(sessionDuration)}
                    </span>
                  </div>
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
            <div className="flex gap-0.5 mb-3 bg-muted/30 rounded-lg p-0.5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 text-[11px] py-1.5 rounded-md transition-colors font-medium',
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
                    <span className="text-[10px] text-primary font-medium flex-1">
                      بسمعك — قول &quot;خلاص&quot; للإنهاء
                    </span>
                    <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((sessionDuration / 120) * 100, 100)}%` }}
                      />
                    </div>
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
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-1.5 mb-2 min-h-0 max-h-40">
                  {conversationHistory.length > 0 ? (
                    <>
                      {conversationHistory.slice(-10).map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'rounded-lg p-2 text-xs group relative',
                            msg.role === 'user' ? 'bg-muted/50 text-foreground' : 'bg-primary/10 text-foreground'
                          )}
                        >
                          <span className="text-[10px] text-muted-foreground mb-0.5 block">
                            {msg.role === 'user' ? '🗣️ أنت' : '🤖 نظام'}
                          </span>
                          {msg.content}
                          {/* Add to favorites button on assistant messages */}
                          {msg.role === 'user' && (
                            <button
                              onClick={() => handleAddFavorite(msg.content, msg.content.slice(0, 20))}
                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-amber-500"
                              title="أضف للمفضلة"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                      {state === 'listening' && (transcript || interimTranscript) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-lg p-2 text-xs bg-muted/30 border border-dashed border-muted-foreground/30"
                        >
                          <span className="text-[10px] text-muted-foreground block">🎤 ...</span>
                          <span className="text-foreground/70">{interimTranscript || transcript}</span>
                        </motion.div>
                      )}
                      {state === 'thinking' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-lg p-2 text-xs bg-primary/5 flex items-center gap-2"
                        >
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-muted-foreground">بفكر في ردك...</span>
                        </motion.div>
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
                          <p className="text-xs text-primary mb-0.5">نظام:</p>
                          <p className="text-sm text-foreground">{lastResponse}</p>
                        </div>
                      )}
                      {!transcript && !lastResponse && (
                        <div className="text-center py-4 text-muted-foreground">
                          <Mic className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">اضغط الزر أو قول "يا نظام" للبدء</p>
                          <p className="text-[10px] mt-1 opacity-60">أو استخدم الأوامر السريعة بالأسفل</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Follow-up suggestion */}
                {followUpSuggestion && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => sendTextCommand(followUpSuggestion)}
                    className="flex items-center gap-1.5 mb-2 px-2 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-right w-full shrink-0"
                  >
                    <MessageCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground">{followUpSuggestion}</span>
                  </motion.button>
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

                {/* Favorites Quick Access */}
                {favorites.length > 0 && (
                  <div className="mb-1.5 shrink-0">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">⭐ المفضلة:</p>
                    <div className="flex flex-wrap gap-1">
                      {favorites.slice(0, 4).map(fav => (
                        <button
                          key={fav.id}
                          onClick={() => sendTextCommand(fav.command)}
                          disabled={state === 'thinking'}
                          className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-foreground px-2 py-1 rounded-full transition-colors disabled:opacity-50 border border-amber-500/20"
                        >
                          {fav.icon} {fav.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contextual Quick Commands */}
                <div className="space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium">أوامر سريعة:</p>
                    <button
                      onClick={() => setShowTextInput(!showTextInput)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                    >
                      <Keyboard className="h-3 w-3" />
                      {showTextInput ? 'إخفاء' : 'كتابة'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {contextualCommands.map(cmd => (
                      <button
                        key={cmd.command}
                        onClick={() => sendTextCommand(cmd.command)}
                        disabled={state === 'thinking'}
                        className="text-[10px] bg-muted hover:bg-muted/80 text-foreground px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                      >
                        {cmd.icon} {cmd.label}
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

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="space-y-3 overflow-y-auto flex-1">
                <div className="text-center mb-2">
                  <Star className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-foreground">أوامرك المفضلة</p>
                  <p className="text-[10px] text-muted-foreground">أضف أوامر للوصول السريع</p>
                </div>

                {favorites.length > 0 ? (
                  <div className="space-y-1.5">
                    {favorites.map(fav => (
                      <div key={fav.id} className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 group">
                        <button
                          onClick={() => sendTextCommand(fav.command)}
                          className="flex-1 text-right"
                        >
                          <p className="text-xs font-medium text-foreground">{fav.icon} {fav.label}</p>
                          <p className="text-[10px] text-muted-foreground">
                            استخدم {fav.usageCount} مرة
                          </p>
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        >
                          <StarOff className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-[10px]">مافيش مفضلة لسه</p>
                    <p className="text-[10px] opacity-60">مرّر على أمر في المحادثة واضغط ⭐</p>
                  </div>
                )}

                {/* Most Used */}
                {mostUsed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[10px] font-medium text-muted-foreground mb-1.5">🔥 الأكثر استخداماً:</p>
                    <div className="space-y-1">
                      {mostUsed.map((cmd, i) => (
                        <button
                          key={i}
                          onClick={() => sendTextCommand(cmd.command)}
                          className="w-full flex items-center justify-between bg-muted/20 hover:bg-muted/40 rounded-lg p-2 transition-colors text-right"
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

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-3 overflow-y-auto flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">📜 سجل الأوامر</p>
                    <p className="text-[10px] text-muted-foreground">{commandHistoryList.length} أمر</p>
                  </div>
                  {commandHistoryList.length > 0 && (
                    <button
                      onClick={() => { clearCommandHistory(); setFavorites(getFavorites()); }}
                      className="text-[10px] text-destructive hover:underline"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>

                {commandHistoryList.length > 0 ? (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {commandHistoryList.slice(0, 30).map((entry, i) => (
                      <button
                        key={i}
                        onClick={() => sendTextCommand(entry.command)}
                        className="w-full flex items-start gap-2 bg-muted/20 hover:bg-muted/40 rounded-lg p-2 transition-colors text-right group"
                      >
                        <span className="text-[10px] mt-0.5">{entry.success ? '✅' : '❌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{entry.command}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{entry.response}</p>
                          <p className="text-[9px] text-muted-foreground/60">{formatTimeAgo(entry.timestamp)}</p>
                        </div>
                        <Star
                          className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500 transition-all shrink-0 mt-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddFavorite(entry.command, entry.command.slice(0, 20));
                          }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <History className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">مافيش أوامر سابقة</p>
                  </div>
                )}
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
