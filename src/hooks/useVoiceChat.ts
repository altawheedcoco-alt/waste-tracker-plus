import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [isSupported] = useState(!!SpeechRecognitionAPI);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<VoiceChatMessage[]>([]);
  const finalTranscriptRef = useRef('');
  const isProcessingRef = useRef(false);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();

      const clean = text
        .replace(/[*_#`~>\-|]/g, '')
        .replace(/\n+/g, '، ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'ar-SA';
      utterance.rate = 1.0;
      utterance.pitch = 1;

      const voices = synthRef.current.getVoices();
      const arabicVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('ar'));
      if (arabicVoice) utterance.voice = arabicVoice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      synthRef.current.speak(utterance);
    });
  }, []);

  const sendToAI = useCallback(async (text: string, history: VoiceChatMessage[]): Promise<string | null> => {
    abortRef.current = new AbortController();

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-unified-gateway`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: 'chat',
          messages: [
            { role: 'system', content: VOICE_SYSTEM_PROMPT },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      // Parse SSE stream to extract full text
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch {
            // partial JSON, skip
          }
        }
      }

      // If streaming returned nothing, try parsing as regular JSON
      if (!fullText) {
        try {
          const json = JSON.parse(buffer);
          fullText = json?.result || json?.choices?.[0]?.message?.content || '';
        } catch { /* ignore */ }
      }

      return fullText || 'عذراً، لم أستطع الرد. حاول مرة أخرى.';
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
      throw err;
    }
  }, []);

  const processAndRespond = useCallback(async (text: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const history = messagesRef.current;
    const userMsg: VoiceChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    setState('thinking');

    try {
      const reply = await sendToAI(text, history);
      if (!reply) { setState('idle'); isProcessingRef.current = false; return; }

      const assistantMsg: VoiceChatMessage = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);

      setState('speaking');
      await speak(reply);
      setState('idle');
    } catch {
      setError('عذراً، حدث خطأ. حاول مرة أخرى.');
      setState('idle');
    } finally {
      isProcessingRef.current = false;
    }
  }, [sendToAI, speak]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError('متصفحك لا يدعم التعرف على الصوت. استخدم Chrome أو Edge.');
      return;
    }

    setError(null);
    stopSpeaking();
    finalTranscriptRef.current = '';

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ar-SA';
    recognition.interimResults = true;
    recognition.continuous = true; // Keep listening until user stops
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setState('listening');
      setCurrentTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      finalTranscriptRef.current = final;
      setCurrentTranscript(final + interim);
    };

    recognition.onend = () => {
      const transcript = (finalTranscriptRef.current || currentTranscriptRef.current).trim();
      if (!transcript) {
        setState('idle');
        return;
      }
      processAndRespond(transcript);
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
  }, [stopSpeaking, processAndRespond]);

  // Ref for currentTranscript to access in onend callback
  const currentTranscriptRef = useRef('');
  currentTranscriptRef.current = currentTranscript;

  // Handle quick prompts (text sent directly without voice)
  const sendTextMessage = useCallback((text: string) => {
    if (state !== 'idle' || isProcessingRef.current) return;
    processAndRespond(text);
  }, [state, processAndRespond]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    abortRef.current?.abort();
    stopSpeaking();
    isProcessingRef.current = false;
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
    sendTextMessage,
  };
}
