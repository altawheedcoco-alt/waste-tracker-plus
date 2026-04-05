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

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { userRole = 'user', wakeWordEnabled = true, wakeWord = 'يا نظام' } = options;
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [lastSentiment, setLastSentiment] = useState<VoiceSentiment | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [commandHistory, setCommandHistory] = useState<Array<{ text: string; intent: string; time: number }>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);
  }, []);

  const speak = useCallback((text: string, sentiment?: VoiceSentiment) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    
    // Adapt speech based on sentiment
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
      setState('idle');
      synthRef.current = null;
    };
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const executeCommand = useCallback((command: VoiceCommand) => {
    const { action } = command;
    
    // Track command in history
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

      // Use adaptive tone if available, else normal response
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
  }, [location.pathname, userRole, executeCommand, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (wakeRecognitionRef.current) {
      try { wakeRecognitionRef.current.stop(); } catch {}
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
      if (finalTranscript) processTranscript(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error('خطأ في التعرف على الصوت');
      }
      setState('idle');
      if (wakeWordEnabled) startWakeWordListener();
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
      recognitionRef.current = null;
      if (wakeWordEnabled) startWakeWordListener();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript, wakeWordEnabled, state]);

  const startWakeWordListener = useCallback(() => {
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
          setTimeout(() => startListening(), 300);
          return;
        }
      }
    };

    recognition.onerror = () => {
      wakeRecognitionRef.current = null;
      setTimeout(() => {
        if (wakeWordEnabled && state !== 'listening' && state !== 'thinking' && state !== 'speaking') {
          startWakeWordListener();
        }
      }, 2000);
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      setTimeout(() => {
        if (wakeWordEnabled && state !== 'listening' && state !== 'thinking' && state !== 'speaking') {
          startWakeWordListener();
        }
      }, 500);
    };

    wakeRecognitionRef.current = recognition;
    try { recognition.start(); } catch { wakeRecognitionRef.current = null; }
  }, [wakeWordEnabled, wakeWord, startListening, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    setState('idle');
  }, []);

  const toggleWakeWord = useCallback((enabled: boolean) => {
    if (enabled) {
      startWakeWordListener();
    } else {
      if (wakeRecognitionRef.current) {
        try { wakeRecognitionRef.current.stop(); } catch {}
        wakeRecognitionRef.current = null;
      }
      setState('idle');
    }
  }, [startWakeWordListener]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
      if (wakeRecognitionRef.current) try { wakeRecognitionRef.current.stop(); } catch {}
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    state,
    transcript,
    lastResponse,
    lastSentiment,
    isSupported,
    commandHistory,
    startListening,
    stopListening,
    startWakeWordListener,
    toggleWakeWord,
    speak,
  };
}
