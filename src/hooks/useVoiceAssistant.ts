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
}

interface UseVoiceAssistantOptions {
  userRole?: string;
  wakeWordEnabled?: boolean;
  wakeWord?: string;
}

/** How long (ms) to wait after the system finishes speaking before auto-listening again */
const AUTO_LISTEN_DELAY = 400;
/** How long (ms) of total inactivity before the conversation session ends */
const SESSION_TIMEOUT = 45_000; // 45 seconds

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { userRole = 'user', wakeWordEnabled = true, wakeWord = 'يا نظام' } = options;
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastSentiment, setLastSentiment] = useState<VoiceSentiment | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [conversationActive, setConversationActive] = useState(false);
  const [commandHistory, setCommandHistory] = useState<Array<{ text: string; intent: string; time: number }>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);
  const conversationActiveRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);
  }, []);

  // Keep ref in sync
  useEffect(() => {
    conversationActiveRef.current = conversationActive;
  }, [conversationActive]);

  /** Reset the session inactivity timer */
  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      // Session expired — end conversation
      if (conversationActiveRef.current) {
        setConversationActive(false);
        conversationActiveRef.current = false;
        setState('idle');
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }
        window.speechSynthesis.cancel();
        // Restart wake word if enabled
        if (wakeWordEnabled) startWakeWordListenerFn();
      }
    }, SESSION_TIMEOUT);
  }, [wakeWordEnabled]);

  const speak = useCallback((text: string, sentiment?: VoiceSentiment) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    
    if (sentiment) {
      switch (sentiment.emotion) {
        case 'frustrated':
        case 'angry':
          utterance.rate = 0.85;
          utterance.pitch = 0.9;
          break;
        case 'urgent':
          utterance.rate = 1.15;
          utterance.pitch = 1.1;
          break;
        case 'happy':
        case 'satisfied':
          utterance.rate = 1.0;
          utterance.pitch = 1.1;
          break;
        default:
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
      }
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    utterance.onstart = () => setState('speaking');
    utterance.onend = () => {
      synthRef.current = null;
      // If conversation is active, auto-listen again after speaking
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
      case 'show_info':
        break;
    }
  }, [navigate]);

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setState('thinking');
    resetSessionTimer(); // Reset timer on each interaction

    try {
      const { data, error } = await supabase.functions.invoke('voice-command', {
        body: { transcript: text, currentRoute: location.pathname, userRole },
      });

      if (error) throw error;

      const command = data as VoiceCommand;
      setLastResponse(command.response);
      
      if (command.sentiment) {
        setLastSentiment(command.sentiment);
      }

      if (command.confidence > 0.5) {
        executeCommand(command);
      }

      const responseText = command.sentiment?.adaptive_tone || command.response;
      speak(responseText, command.sentiment);
    } catch (err) {
      const errorMsg = 'معذرة، حصل مشكلة. حاول تاني.';
      setLastResponse(errorMsg);
      speak(errorMsg);
      toast.error('خطأ في معالجة الأمر الصوتي');
    } finally {
      isProcessingRef.current = false;
    }
  }, [location.pathname, userRole, executeCommand, speak, resetSessionTimer]);

  /** Internal listening function — isConversation means we're in continuous mode */
  const startListeningInternal = useCallback((isConversation: boolean) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop wake word listener
    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.stop(); } catch {}
      wakeRecognitionRef.current = null;
    }

    // Stop existing recognition
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
        // Check for end-conversation phrases
        const endPhrases = ['خلاص', 'كفاية', 'شكرا', 'شكراً', 'باي', 'مع السلامة', 'سلام', 'اقفل', 'وقف'];
        const isEndPhrase = endPhrases.some(p => finalTranscript.trim().includes(p));
        
        if (isEndPhrase && conversationActiveRef.current) {
          // End conversation gracefully
          setConversationActive(false);
          conversationActiveRef.current = false;
          if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
          speak('تمام يا باشا، لو احتجتني قول "يا نظام" وأنا هنا! 👋');
          return;
        }
        
        processTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error('خطأ في التعرف على الصوت');
      }
      // If conversation active and it was just no-speech, re-listen
      if (conversationActiveRef.current && (event.error === 'no-speech' || event.error === 'aborted')) {
        setTimeout(() => {
          if (conversationActiveRef.current) {
            startListeningInternal(true);
          }
        }, 500);
        return;
      }
      setState('idle');
      if (wakeWordEnabled) startWakeWordListenerFn();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      // If still in conversation and not processing/speaking, re-listen
      if (conversationActiveRef.current && !isProcessingRef.current && state !== 'thinking' && state !== 'speaking') {
        // Small delay to avoid rapid re-starts
        setTimeout(() => {
          if (conversationActiveRef.current && !isProcessingRef.current) {
            startListeningInternal(true);
          }
        }, 300);
        return;
      }
      if (!conversationActiveRef.current) {
        if (state === 'listening') setState('idle');
        if (wakeWordEnabled) startWakeWordListenerFn();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript, wakeWordEnabled, state, speak]);

  /** Public: start a conversation session */
  const startListening = useCallback(() => {
    setConversationActive(true);
    conversationActiveRef.current = true;
    resetSessionTimer();
    startListeningInternal(true);
  }, [startListeningInternal, resetSessionTimer]);

  // We need a stable ref for startWakeWordListener to avoid circular deps
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
          const audioCtx = new AudioContext();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.15;
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
          toast.info('🎤 أنا سامعك، قول أمرك!');
          setTimeout(() => {
            setConversationActive(true);
            conversationActiveRef.current = true;
            resetSessionTimer();
            startListeningInternal(true);
          }, 300);
          return;
        }
      }
    };

    recognition.onerror = () => {
      wakeRecognitionRef.current = null;
      setTimeout(() => {
        if (wakeWordEnabled && !conversationActiveRef.current) {
          startWakeWordListenerFn();
        }
      }, 2000);
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      setTimeout(() => {
        if (wakeWordEnabled && !conversationActiveRef.current) {
          startWakeWordListenerFn();
        }
      }, 500);
    };

    wakeRecognitionRef.current = recognition;
    try { recognition.start(); } catch { wakeRecognitionRef.current = null; }
  }, [wakeWordEnabled, wakeWord, startListeningInternal, resetSessionTimer]);

  // Alias for external use
  const startWakeWordListener = startWakeWordListenerFn;

  const stopListening = useCallback(() => {
    // End conversation session
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
    isSupported,
    conversationActive,
    commandHistory,
    startListening,
    stopListening,
    startWakeWordListener,
    toggleWakeWord,
    speak,
  };
}
