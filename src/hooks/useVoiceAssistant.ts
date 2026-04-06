import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addToHistory, incrementFavoriteUsage } from '@/lib/voiceFavorites';
import { useAuth } from '@/contexts/AuthContext';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'wake_listening';

export type SentimentEmotion = 'neutral' | 'happy' | 'frustrated' | 'angry' | 'urgent' | 'confused' | 'satisfied';

interface VoiceSentiment {
  emotion: SentimentEmotion;
  score: number;
  adaptive_tone?: string;
}

interface VoiceCommand {
  intent: string;
  action: {
    type: string;
    target: string;
    params?: Record<string, any>;
  };
  response: string;
  confidence: number;
  sentiment?: VoiceSentiment;
  follow_up_suggestion?: string;
}

// Action engine types
export type ActionEngineState = 'idle' | 'active' | 'waiting_input' | 'completed';

export interface ActionOption {
  id: string;
  label: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface UseVoiceAssistantOptions {
  userRole?: string;
  wakeWordEnabled?: boolean;
  wakeWord?: string;
}

const AUTO_LISTEN_DELAY = 500;
const SESSION_TIMEOUT = 120_000; // 120 ثانية — دقيقتين
const MAX_RETRIES = 2;
const SILENCE_RESTART_DELAY = 300;

// Haptic feedback
function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    if ('vibrate' in navigator) {
      const patterns = { light: [10], medium: [20, 10, 20], heavy: [50, 20, 50] };
      navigator.vibrate(patterns[type]);
    }
  } catch {}
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { userRole = 'user', wakeWordEnabled = true, wakeWord = 'يا نظام' } = options;
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastSentiment, setLastSentiment] = useState<VoiceSentiment | null>(null);
  const [followUpSuggestion, setFollowUpSuggestion] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [commandHistory, setCommandHistory] = useState<Array<{ text: string; intent: string; time: number }>>([]);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lastCommandTime, setLastCommandTime] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);
  const conversationActiveRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const conversationHistoryRef = useRef<ConversationMessage[]>([]);
  const bestArabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const retryCountRef = useRef(0);
  const sessionStartRef = useRef(0);

  // Find best Arabic voice
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);

    const findBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const priorities = [
        (v: SpeechSynthesisVoice) => v.lang === 'ar-EG',
        (v: SpeechSynthesisVoice) => v.lang === 'ar-SA' && v.name.toLowerCase().includes('female'),
        (v: SpeechSynthesisVoice) => v.lang === 'ar-SA',
        (v: SpeechSynthesisVoice) => v.lang.startsWith('ar') && v.name.toLowerCase().includes('female'),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('ar'),
      ];
      for (const predicate of priorities) {
        const found = voices.find(predicate);
        if (found) { bestArabicVoiceRef.current = found; return; }
      }
    };
    findBestVoice();
    window.speechSynthesis.onvoiceschanged = findBestVoice;
  }, []);

  useEffect(() => { conversationActiveRef.current = conversationActive; }, [conversationActive]);
  useEffect(() => { conversationHistoryRef.current = conversationHistory; }, [conversationHistory]);

  // Session duration tracker
  useEffect(() => {
    if (conversationActive) {
      sessionStartRef.current = Date.now();
      sessionIntervalRef.current = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    } else {
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      setSessionDuration(0);
    }
    return () => { if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current); };
  }, [conversationActive]);

  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      if (conversationActiveRef.current) {
        setConversationActive(false);
        conversationActiveRef.current = false;
        setState('idle');
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
        window.speechSynthesis.cancel();
        playEndSound();
        const timeoutMsg = 'مش سامع حاجة يا باشا، هقفل الجلسة. لو عايزني قول "يا نظام"! 👋';
        speak(timeoutMsg);
        if (wakeWordEnabled) startWakeWordListenerFn();
      }
    }, SESSION_TIMEOUT);
  }, [wakeWordEnabled]);

  // Sound effects — improved tones
  const playActivationSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      // Ascending chime — warm and inviting
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.07, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + 0.5);
      });
      haptic('medium');
    } catch {}
  }, []);

  const playEndSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      // Descending gentle close
      [659.25, 554.37, 440].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });
      haptic('light');
    } catch {}
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      // Two-note ding
      [880, 1108.73].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.04, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + 0.2);
      });
    } catch {}
  }, []);

  const playErrorSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 300;
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      haptic('heavy');
    } catch {}
  }, []);

  const speak = useCallback((text: string, sentiment?: VoiceSentiment) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    if (bestArabicVoiceRef.current) utterance.voice = bestArabicVoiceRef.current;

    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    if (sentiment) {
      switch (sentiment.emotion) {
        case 'frustrated': case 'angry': utterance.rate = 0.85; utterance.pitch = 0.95; break;
        case 'urgent': utterance.rate = 1.1; utterance.pitch = 1.05; break;
        case 'happy': case 'satisfied': utterance.rate = 0.95; utterance.pitch = 1.1; break;
        case 'confused': utterance.rate = 0.9; utterance.pitch = 1.0; break;
      }
    }

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => {
      synthRef.current = null;
      if (conversationActiveRef.current) {
        resetSessionTimer();
        setTimeout(() => {
          if (conversationActiveRef.current) startListeningInternal(true);
        }, AUTO_LISTEN_DELAY);
      } else {
        setState('idle');
      }
    };
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [resetSessionTimer]);

  const executeCommand = useCallback((command: VoiceCommand) => {
    const { action } = command;
    setCommandHistory(prev => [...prev.slice(-19), { text: command.response, intent: command.intent, time: Date.now() }]);
    setLastCommandTime(Date.now());

    // Track in persistent history
    addToHistory({
      command: command.response,
      intent: command.intent,
      response: command.response,
      success: command.confidence > 0.5,
    });

    // Increment favorite usage if applicable
    incrementFavoriteUsage(command.response);

    switch (action.type) {
      case 'navigate_to':
        if (action.target?.startsWith('/')) {
          haptic('medium');
          navigate(action.target);
        }
        break;
      case 'filter_data':
        haptic('light');
        if (action.target === 'shipments') {
          const params = new URLSearchParams();
          if (action.params?.waste_type) params.set('waste_type', action.params.waste_type);
          if (action.params?.status) params.set('status', action.params.status);
          if (action.params?.date_filter) params.set('date_filter', action.params.date_filter);
          navigate(`/dashboard/shipments?${params.toString()}`);
        } else if (action.target === 'accounts') {
          navigate('/dashboard/accounts');
        } else if (action.target === 'invoices') {
          const params = new URLSearchParams();
          if (action.params?.status) params.set('status', action.params.status);
          navigate(`/dashboard/invoices?${params.toString()}`);
        }
        break;
      case 'search_query':
        haptic('light');
        if (action.params?.query) {
          navigate(`/dashboard/shipments?search=${encodeURIComponent(action.params.query)}`);
        }
        break;
      case 'open_dialog':
        haptic('medium');
        if (action.target === 'new_shipment') navigate('/dashboard/shipments?action=create');
        else if (action.target === 'new_invoice') navigate('/dashboard/invoices?action=create');
        break;
      case 'go_back':
        haptic('light');
        window.history.back();
        break;
      case 'refresh':
        haptic('medium');
        window.location.reload();
        break;
      case 'scroll_top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'scroll_bottom':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        break;
      case 'toggle_theme':
        haptic('light');
        document.documentElement.classList.toggle('dark');
        break;
      case 'conversation':
      case 'show_info':
        break;
    }
  }, [navigate]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setState('thinking');
    setInterimTranscript('');
    resetSessionTimer();
    retryCountRef.current = 0;
    haptic('light');

    const userMsg: ConversationMessage = { role: 'user', content: text, timestamp: Date.now() };
    setConversationHistory(prev => [...prev, userMsg]);

    const attemptProcess = async (): Promise<void> => {
      try {
        const { data, error } = await supabase.functions.invoke('voice-command', {
          body: {
            transcript: text,
            currentRoute: location.pathname,
            userRole,
            conversationHistory: conversationHistoryRef.current.slice(-10),
          },
        });

        if (error) throw error;

        const command = data as VoiceCommand;
        setLastResponse(command.response);
        setFollowUpSuggestion(command.follow_up_suggestion || null);
        if (command.sentiment) setLastSentiment(command.sentiment);

        const assistantMsg: ConversationMessage = {
          role: 'assistant',
          content: command.response,
          timestamp: Date.now(),
        };
        setConversationHistory(prev => [...prev, assistantMsg]);
        playNotificationSound();

        if (command.confidence > 0.5) executeCommand(command);

        const responseText = command.sentiment?.adaptive_tone || command.response;
        speak(responseText, command.sentiment);
      } catch (err) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          await new Promise(r => setTimeout(r, 1000));
          return attemptProcess();
        }
        playErrorSound();
        const errorMsg = 'معلش يا باشا حصلت مشكلة، حاول تاني';
        setLastResponse(errorMsg);
        speak(errorMsg);
        toast.error('خطأ في معالجة الأمر الصوتي');
      }
    };

    await attemptProcess();
    isProcessingRef.current = false;
  }, [location.pathname, userRole, executeCommand, speak, resetSessionTimer, playNotificationSound, playErrorSound]);

  const startListeningInternal = useCallback((isConversation: boolean) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (wakeRecognitionRef.current) { try { wakeRecognitionRef.current.stop(); } catch {} wakeRecognitionRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    window.speechSynthesis.cancel();

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      if (interim) setInterimTranscript(interim);
      setTranscript(finalTranscript || interim);
      if (finalTranscript) {
        setInterimTranscript('');
        const endPhrases = ['خلاص', 'كفاية', 'شكرا', 'شكراً', 'باي', 'مع السلامة', 'سلام', 'اقفل', 'وقف', 'تصبح على خير', 'يلا باي'];
        const isEndPhrase = endPhrases.some(p => finalTranscript.trim().includes(p));

        if (isEndPhrase && conversationActiveRef.current) {
          setConversationActive(false);
          conversationActiveRef.current = false;
          if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
          playEndSound();
          const goodbyes = [
            'تمام يا باشا، لو احتجتني قول "يا نظام"! 👋',
            'ماشي يا كبير، أنا هنا لو عايزني! 👋',
            'حاضر يا باشا، في أمان الله! 👋',
            'تمام يا معلم، أي وقت كلمني! 👋',
          ];
          speak(goodbyes[Math.floor(Math.random() * goodbyes.length)]);
          setTimeout(() => setConversationHistory([]), 3000);
          return;
        }
        processTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error('خطأ في التعرف على الصوت');
      }
      if (conversationActiveRef.current && (event.error === 'no-speech' || event.error === 'aborted')) {
        setTimeout(() => { if (conversationActiveRef.current) startListeningInternal(true); }, SILENCE_RESTART_DELAY);
        return;
      }
      setState('idle');
      if (wakeWordEnabled) startWakeWordListenerFn();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (conversationActiveRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (conversationActiveRef.current && !isProcessingRef.current) startListeningInternal(true);
        }, SILENCE_RESTART_DELAY);
        return;
      }
      if (!conversationActiveRef.current) {
        setState('idle');
        if (wakeWordEnabled) startWakeWordListenerFn();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript, wakeWordEnabled, speak, playEndSound]);

  const startListening = useCallback(() => {
    playActivationSound();
    setConversationActive(true);
    conversationActiveRef.current = true;
    resetSessionTimer();

    const greetings = [
      'أيوه يا باشا، قول أمرك!',
      'حاضر يا باشا، بسمعك!',
      'أنا معاك يا باشا، عايز إيه؟',
      'تحت أمرك يا باشا!',
    ];
    toast.info(`🎤 ${greetings[Math.floor(Math.random() * greetings.length)]}`);
    startListeningInternal(true);
  }, [startListeningInternal, resetSessionTimer, playActivationSound]);

  const sendTextCommand = useCallback((text: string) => {
    if (!conversationActiveRef.current) {
      setConversationActive(true);
      conversationActiveRef.current = true;
    }
    resetSessionTimer();
    processTranscript(text);
  }, [processTranscript, resetSessionTimer]);

  const startWakeWordListenerFn = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !wakeWordEnabled) return;
    if (wakeRecognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setState('wake_listening');

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim();
        const wakeVariations = [wakeWord, 'يا نظام', 'يانظام', 'نظام', 'هاي نظام', 'يا سيستم'];
        if (wakeVariations.some(w => t.includes(w))) {
          try { recognition.stop(); } catch {}
          wakeRecognitionRef.current = null;
          playActivationSound();
          toast.info('🎤 أيوه يا باشا، قول أمرك!');
          setTimeout(() => {
            setConversationActive(true);
            conversationActiveRef.current = true;
            resetSessionTimer();
            startListeningInternal(true);
          }, 350);
          return;
        }
      }
    };

    recognition.onerror = () => {
      wakeRecognitionRef.current = null;
      setTimeout(() => {
        if (wakeWordEnabled && !conversationActiveRef.current) startWakeWordListenerFn();
      }, 2000);
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      setTimeout(() => {
        if (wakeWordEnabled && !conversationActiveRef.current) startWakeWordListenerFn();
      }, 500);
    };

    wakeRecognitionRef.current = recognition;
    try { recognition.start(); } catch { wakeRecognitionRef.current = null; }
  }, [wakeWordEnabled, wakeWord, startListeningInternal, resetSessionTimer, playActivationSound]);

  const startWakeWordListener = startWakeWordListenerFn;

  const stopListening = useCallback(() => {
    setConversationActive(false);
    conversationActiveRef.current = false;
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    window.speechSynthesis.cancel();
    setState('idle');
    playEndSound();
  }, [playEndSound]);

  const toggleWakeWord = useCallback((enabled: boolean) => {
    if (enabled) {
      startWakeWordListenerFn();
    } else {
      if (wakeRecognitionRef.current) { try { wakeRecognitionRef.current.stop(); } catch {} wakeRecognitionRef.current = null; }
      setState('idle');
    }
  }, [startWakeWordListenerFn]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse('');
    setTranscript('');
    setInterimTranscript('');
    setLastSentiment(null);
    setFollowUpSuggestion(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (wakeRecognitionRef.current) try { wakeRecognitionRef.current.stop(); } catch {}
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    lastResponse,
    lastSentiment,
    followUpSuggestion,
    isSupported,
    conversationActive,
    conversationHistory,
    commandHistory,
    sessionDuration,
    lastCommandTime,
    startListening,
    stopListening,
    startWakeWordListener,
    toggleWakeWord,
    clearHistory,
    speak,
    sendTextCommand,
  };
}
