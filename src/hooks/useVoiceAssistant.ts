import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'wake_listening';

interface VoiceCommand {
  intent: string;
  action: {
    type: string;
    target: string;
    params?: Record<string, any>;
  };
  response: string;
  confidence: number;
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
  const [isSupported, setIsSupported] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);
  }, []);

  // Speak response
  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find Arabic voice
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

  // Execute the parsed command
  const executeCommand = useCallback((command: VoiceCommand) => {
    const { action } = command;
    
    switch (action.type) {
      case 'navigate_to':
        if (action.target && action.target.startsWith('/')) {
          navigate(action.target);
        }
        break;
      case 'filter_data':
        // Navigate to target page with filter params
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
        if (action.target === 'new_shipment') {
          navigate('/dashboard/shipments?action=create');
        }
        break;
      case 'show_info':
        // Info is conveyed via the spoken response
        break;
    }
  }, [navigate]);

  // Process transcript with AI
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

      if (command.confidence > 0.5) {
        executeCommand(command);
      }

      speak(command.response);
    } catch (err) {
      const errorMsg = 'معذرة، حصل مشكلة. حاول تاني.';
      setLastResponse(errorMsg);
      speak(errorMsg);
      toast.error('خطأ في معالجة الأمر الصوتي');
    } finally {
      isProcessingRef.current = false;
    }
  }, [location.pathname, userRole, executeCommand, speak]);

  // Start main listening (after button press or wake word)
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop wake word listener temporarily
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
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        processTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error('خطأ في التعرف على الصوت');
      }
      setState('idle');
      // Restart wake word if enabled
      if (wakeWordEnabled) startWakeWordListener();
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
      recognitionRef.current = null;
      // Restart wake word if enabled
      if (wakeWordEnabled) startWakeWordListener();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processTranscript, wakeWordEnabled, state]);

  // Wake word listener — runs continuously in background
  const startWakeWordListener = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !wakeWordEnabled) return;

    // Don't start if already active
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
        // Check for wake word variations
        const wakeVariations = [wakeWord, 'يا نظام', 'يانظام', 'نظام', 'هاي نظام'];
        const detected = wakeVariations.some(w => t.includes(w));
        if (detected) {
          // Stop wake listener and start main listening
          try { recognition.stop(); } catch {}
          wakeRecognitionRef.current = null;
          // Play activation sound
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
      // Auto-restart after error
      setTimeout(() => {
        if (wakeWordEnabled && state !== 'listening' && state !== 'thinking' && state !== 'speaking') {
          startWakeWordListener();
        }
      }, 2000);
    };

    recognition.onend = () => {
      wakeRecognitionRef.current = null;
      // Auto-restart
      setTimeout(() => {
        if (wakeWordEnabled && state !== 'listening' && state !== 'thinking' && state !== 'speaking') {
          startWakeWordListener();
        }
      }, 500);
    };

    wakeRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      wakeRecognitionRef.current = null;
    }
  }, [wakeWordEnabled, wakeWord, startListening, state]);

  // Stop everything
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    setState('idle');
  }, []);

  // Toggle wake word
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

  // Cleanup
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
    isSupported,
    startListening,
    stopListening,
    startWakeWordListener,
    toggleWakeWord,
    speak,
  };
}
