import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ConversationMessage {
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
const SESSION_TIMEOUT = 60_000; // 60 seconds

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { userRole = 'user', wakeWordEnabled = true, wakeWord = 'يا نظام' } = options;
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastSentiment, setLastSentiment] = useState<VoiceSentiment | null>(null);
  const [followUpSuggestion, setFollowUpSuggestion] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [commandHistory, setCommandHistory] = useState<Array<{ text: string; intent: string; time: number }>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);
  const conversationActiveRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationHistoryRef = useRef<ConversationMessage[]>([]);
  const bestArabicVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Find the best Arabic voice on load
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);

    const findBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Priority: Egyptian Arabic > Arabic > any
      const priorities = [
        (v: SpeechSynthesisVoice) => v.lang === 'ar-EG',
        (v: SpeechSynthesisVoice) => v.lang === 'ar-SA' && v.name.toLowerCase().includes('female'),
        (v: SpeechSynthesisVoice) => v.lang === 'ar-SA',
        (v: SpeechSynthesisVoice) => v.lang.startsWith('ar') && v.name.toLowerCase().includes('female'),
        (v: SpeechSynthesisVoice) => v.lang.startsWith('ar'),
      ];
      for (const predicate of priorities) {
        const found = voices.find(predicate);
        if (found) {
          bestArabicVoiceRef.current = found;
          return;
        }
      }
    };

    findBestVoice();
    window.speechSynthesis.onvoiceschanged = findBestVoice;
  }, []);

  useEffect(() => {
    conversationActiveRef.current = conversationActive;
  }, [conversationActive]);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      if (conversationActiveRef.current) {
        setConversationActive(false);
        conversationActiveRef.current = false;
        setState('idle');
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        window.speechSynthesis.cancel();
        if (wakeWordEnabled) startWakeWordListenerFn();
      }
    }, SESSION_TIMEOUT);
  }, [wakeWordEnabled]);

  const speak = useCallback((text: string, sentiment?: VoiceSentiment) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';

    // Use the best Arabic voice found
    if (bestArabicVoiceRef.current) {
      utterance.voice = bestArabicVoiceRef.current;
    }

    // Warm, natural settings
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    if (sentiment) {
      switch (sentiment.emotion) {
        case 'frustrated':
        case 'angry':
          utterance.rate = 0.85;
          utterance.pitch = 0.95;
          break;
        case 'urgent':
          utterance.rate = 1.1;
          utterance.pitch = 1.05;
          break;
        case 'happy':
        case 'satisfied':
          utterance.rate = 0.95;
          utterance.pitch = 1.1;
          break;
        case 'confused':
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          break;
      }
    }

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => {
      synthRef.current = null;
      if (conversationActiveRef.current) {
        resetSessionTimer();
        setTimeout(() => {
          if (conversationActiveRef.current) {
            startListeningInternal(true);
          }
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

    setCommandHistory(prev => [...prev.slice(-19), {
      text: command.response,
      intent: command.intent,
      time: Date.now(),
    }]);

    switch (action.type) {
      case 'navigate_to':
        if (action.target?.startsWith('/')) navigate(action.target);
        break;
      case 'filter_data':
        if (action.target === 'shipments') {
          const params = new URLSearchParams();
          if (action.params?.waste_type) params.set('waste_type', action.params.waste_type);
          if (action.params?.status) params.set('status', action.params.status);
          if (action.params?.date_filter) params.set('date_filter', action.params.date_filter);
          navigate(`/dashboard/shipments?${params.toString()}`);
        } else if (action.target === 'accounts') {
          navigate('/dashboard/accounts');
        }
        break;
      case 'search_query':
        if (action.params?.query) {
          navigate(`/dashboard/shipments?search=${encodeURIComponent(action.params.query)}`);
        }
        break;
      case 'open_dialog':
        if (action.target === 'new_shipment') navigate('/dashboard/shipments?action=create');
        break;
      case 'conversation':
        // Pure conversation, no navigation needed
        break;
      case 'show_info':
        break;
    }
  }, [navigate]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setState('thinking');
    resetSessionTimer();

    // Add to conversation history
    const userMsg: ConversationMessage = { role: 'user', content: text, timestamp: Date.now() };
    setConversationHistory(prev => [...prev, userMsg]);

    try {
      const { data, error } = await supabase.functions.invoke('voice-command', {
        body: {
          transcript: text,
          currentRoute: location.pathname,
          userRole,
          conversationHistory: conversationHistoryRef.current,
        },
      });

      if (error) throw error;

      const command = data as VoiceCommand;
      setLastResponse(command.response);
      setFollowUpSuggestion(command.follow_up_suggestion || null);

      if (command.sentiment) {
        setLastSentiment(command.sentiment);
      }

      // Add assistant response to conversation history
      const assistantMsg: ConversationMessage = {
        role: 'assistant',
        content: command.response,
        timestamp: Date.now(),
      };
      setConversationHistory(prev => [...prev, assistantMsg]);

      if (command.confidence > 0.5) {
        executeCommand(command);
      }

      const responseText = command.sentiment?.adaptive_tone || command.response;
      speak(responseText, command.sentiment);
    } catch (err) {
      const errorMsg = 'معلش يا باشا حصلت مشكلة، حاول تاني';
      setLastResponse(errorMsg);
      speak(errorMsg);
      toast.error('خطأ في معالجة الأمر الصوتي');
    } finally {
      isProcessingRef.current = false;
    }
  }, [location.pathname, userRole, executeCommand, speak, resetSessionTimer]);

  const startListeningInternal = useCallback((isConversation: boolean) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.stop(); } catch {}
      wakeRecognitionRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    window.speechSynthesis.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState('listening');

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interimTranscript += t;
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        const endPhrases = ['خلاص', 'كفاية', 'شكرا', 'شكراً', 'باي', 'مع السلامة', 'سلام', 'اقفل', 'وقف'];
        const isEndPhrase = endPhrases.some(p => finalTranscript.trim().includes(p));

        if (isEndPhrase && conversationActiveRef.current) {
          setConversationActive(false);
          conversationActiveRef.current = false;
          if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
          speak('تمام يا باشا، لو احتجتني قول "يا نظام" وأنا موجود! 👋');
          // Clear history for next session
          setTimeout(() => setConversationHistory([]), 2000);
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
        setTimeout(() => {
          if (conversationActiveRef.current) startListeningInternal(true);
        }, 500);
        return;
      }
      setState('idle');
      if (wakeWordEnabled) startWakeWordListenerFn();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (conversationActiveRef.current && !isProcessingRef.current) {
        setTimeout(() => {
          if (conversationActiveRef.current && !isProcessingRef.current) {
            startListeningInternal(true);
          }
        }, 300);
        return;
      }
      if (!conversationActiveRef.current) {
        setState('idle');
        if (wakeWordEnabled) startWakeWordListenerFn();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript, wakeWordEnabled, speak]);

  const startListening = useCallback(() => {
    setConversationActive(true);
    conversationActiveRef.current = true;
    resetSessionTimer();
    startListeningInternal(true);
  }, [startListeningInternal, resetSessionTimer]);

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
        const wakeVariations = [wakeWord, 'يا نظام', 'يانظام', 'نظام', 'هاي نظام'];
        const detected = wakeVariations.some(w => t.includes(w));
        if (detected) {
          try { recognition.stop(); } catch {}
          wakeRecognitionRef.current = null;
          // Play activation sound
          try {
            const audioCtx = new AudioContext();
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g).connect(audioCtx.destination);
            o.frequency.value = 880;
            g.gain.value = 0.12;
            o.start();
            o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            o.stop(audioCtx.currentTime + 0.2);
          } catch {}
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
  }, [wakeWordEnabled, wakeWord, startListeningInternal, resetSessionTimer]);

  const startWakeWordListener = startWakeWordListenerFn;

  const stopListening = useCallback(() => {
    setConversationActive(false);
    conversationActiveRef.current = false;
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    setState('idle');
  }, []);

  const toggleWakeWord = useCallback((enabled: boolean) => {
    if (enabled) {
      startWakeWordListenerFn();
    } else {
      if (wakeRecognitionRef.current) {
        try { wakeRecognitionRef.current.stop(); } catch {}
        wakeRecognitionRef.current = null;
      }
      setState('idle');
    }
  }, [startWakeWordListenerFn]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse('');
    setTranscript('');
    setLastSentiment(null);
    setFollowUpSuggestion(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (wakeRecognitionRef.current) try { wakeRecognitionRef.current.stop(); } catch {}
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    state,
    transcript,
    lastResponse,
    lastSentiment,
    followUpSuggestion,
    isSupported,
    conversationActive,
    conversationHistory,
    commandHistory,
    startListening,
    stopListening,
    startWakeWordListener,
    toggleWakeWord,
    clearHistory,
    speak,
  };
}
