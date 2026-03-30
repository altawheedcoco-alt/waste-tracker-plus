import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VoiceChatState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const VOICE_SYSTEM_PROMPT = `أنت مدرب صحي ذكي متخصص في صحة العاملين في قطاع إدارة النفايات وإعادة التدوير.
- هذه محادثة صوتية حية — أجب بجمل قصيرة وطبيعية (1-3 جمل فقط).
- كن ودوداً ومباشراً كأنك تتحدث مع صديق.
- ركز على: الصحة المهنية، التوتر، الإرهاق، الترطيب، الحماية من المواد الخطرة.
- أجب بالعربية دائماً.
- لا تشخّص أمراضاً — انصح بزيارة الطبيب عند الحاجة.
- لا تستخدم نقاط أو ترقيم — تحدث بشكل سلس طبيعي.`;

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useVoiceChat() {
  const [state, setState] = useState<VoiceChatState>('idle');
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(!!SpeechRecognitionAPI);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const abortRef = useRef<AbortController | null>(null);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      
      synthRef.current.cancel();
      
      // Clean markdown/formatting for natural speech
      const clean = text
        .replace(/[*_#`~>\-|]/g, '')
        .replace(/\n+/g, '، ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.95;
      utterance.pitch = 1;

      // Try to find Arabic voice
      const voices = synthRef.current.getVoices();
      const arabicVoice = voices.find((v: SpeechSynthesisVoice) =>
        v.lang.startsWith('ar')
      );
      if (arabicVoice) utterance.voice = arabicVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      synthRef.current.speak(utterance);
    });
  }, []);

  const sendToAI = useCallback(async (text: string, history: VoiceChatMessage[]) => {
    setState('thinking');
    abortRef.current = new AbortController();

    try {
      const allMessages = [...history, { role: 'user' as const, content: text }];
      
      const { data, error: fnError } = await supabase.functions.invoke('ai-unified-gateway', {
        body: {
          action: 'chat',
          messages: [
            { role: 'system', content: VOICE_SYSTEM_PROMPT },
            ...allMessages.map(m => ({ role: m.role, content: m.content })),
          ],
        },
      });

      if (fnError) throw fnError;
      const reply = data?.result || data?.choices?.[0]?.message?.content || 'عذراً، لم أفهم. حاول مرة أخرى.';
      
      return reply;
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
      throw err;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('متصفحك لا يدعم التعرف على الصوت. استخدم Chrome أو Edge.');
      setIsSupported(false);
      return;
    }

    setError(null);
    stopSpeaking();

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setState('listening');
      setCurrentTranscript('');
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCurrentTranscript(transcript);
    };

    recognition.onend = async () => {
      const transcript = currentTranscriptRef.current;
      if (!transcript.trim()) {
        setState('idle');
        return;
      }

      const userMsg: VoiceChatMessage = { role: 'user', content: transcript };
      
      setMessages(prev => {
        const updated = [...prev, userMsg];
        processAI(transcript, prev);
        return updated;
      });
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setState('idle');
        return;
      }
      if (event.error === 'not-allowed') {
        setError('يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.');
      } else {
        setError(`خطأ في التعرف على الصوت: ${event.error}`);
      }
      setState('idle');
    };

    recognition.start();
  }, [stopSpeaking]);

  // Use ref for currentTranscript to access in callbacks
  const currentTranscriptRef = useRef('');
  currentTranscriptRef.current = currentTranscript;

  const processAI = useCallback(async (text: string, history: VoiceChatMessage[]) => {
    try {
      const reply = await sendToAI(text, history);
      if (!reply) { setState('idle'); return; }

      const assistantMsg: VoiceChatMessage = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);

      setState('speaking');
      await speak(reply);
      setState('idle');
    } catch {
      setError('عذراً، حدث خطأ. حاول مرة أخرى.');
      setState('idle');
    }
  }, [sendToAI, speak]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    abortRef.current?.abort();
    stopSpeaking();
    setState('idle');
  }, [stopSpeaking]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setCurrentTranscript('');
    cancel();
  }, [cancel]);

  return {
    state,
    messages,
    currentTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    cancel,
    clearHistory,
    speak,
    stopSpeaking,
  };
}
