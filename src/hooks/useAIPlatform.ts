/**
 * useAIPlatform — هوك موحد لجميع عمليات الذكاء الاصطناعي
 * 
 * يعمل من أي دومين لأنه يعتمد على Edge Functions في قاعدة البيانات
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { preprocessForOCR } from '@/utils/imagePreprocess';

type AIAction = 
  | 'chat' | 'classify' | 'extract' | 'analyze' 
  | 'generate' | 'optimize' | 'detect' | 'forecast' | 'inspect';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseAIPlatformOptions {
  onStreamDelta?: (delta: string) => void;
  onStreamDone?: () => void;
}

export function useAIPlatform(options?: UseAIPlatformOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const invoke = useCallback(async (action: AIAction, params: Record<string, any> = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // For streaming chat with delta callback, use streamChat
      if (action === 'chat' && options?.onStreamDelta) {
        return await streamChat(params.messages || [], options.onStreamDelta, options.onStreamDone);
      }

      // Preprocess images for OCR-related actions (CamScanner quality)
      let processedParams = { ...params };
      if (params.imageBase64 && ['classify', 'extract', 'inspect'].includes(action)) {
        const isColorNeeded = action === 'classify' || action === 'inspect';
        processedParams.imageBase64 = await preprocessForOCR(params.imageBase64, {
          grayscale: !isColorNeeded,
          contrast: isColorNeeded ? 40 : 60,
          sharpness: 2,
          brightness: isColorNeeded ? 5 : 10,
          binarize: isColorNeeded ? undefined : 0,
          maxDimension: 2400,
          quality: 0.95,
        });
      }

      // For chat without streaming callback, use fetch + SSE parsing
      if (action === 'chat') {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-unified-gateway`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action, ...processedParams }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const reader = resp.body?.getReader();
        if (!reader) throw new Error('No body');
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullText += content;
            } catch { /* partial */ }
          }
        }
        return fullText || null;
      }

      // For non-chat actions, use supabase.functions.invoke (returns JSON)
      const { data, error: fnError } = await supabase.functions.invoke('ai-unified-gateway', {
        body: { action, ...processedParams },
      });

      if (fnError) {
        throw new Error(fnError.message || 'خطأ في خدمة الذكاء الاصطناعي');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.result;
    } catch (err: any) {
      const message = err?.message || 'حدث خطأ غير متوقع';
      setError(message);

      if (message.includes('429') || message.includes('الحد الأقصى') || message.includes('الحد اليومي')) {
        toast({
          title: '⚠️ تم تجاوز الحد',
          description: 'يرجى المحاولة لاحقاً أو ترقية الباقة',
          variant: 'destructive',
        });
      } else if (message.includes('402') || message.includes('رصيد')) {
        toast({
          title: '💳 رصيد غير كافٍ',
          description: 'يرجى إضافة رصيد لاستخدام خدمات الذكاء الاصطناعي',
          variant: 'destructive',
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options?.onStreamDelta, options?.onStreamDone, toast]);

  const streamChat = async (
    messages: Message[],
    onDelta: (delta: string) => void,
    onDone?: () => void
  ) => {
    abortControllerRef.current = new AbortController();

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-unified-gateway`;
    const session = (await supabase.auth.getSession()).data.session;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action: 'chat', messages }),
      signal: abortControllerRef.current.signal,
    });

    if (!resp.ok || !resp.body) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${resp.status}`);
    }

    const reader = resp.body.getReader();
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
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onDone?.();
          setIsLoading(false);
          return fullText;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onDelta(content);
          }
        } catch {
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    onDone?.();
    setIsLoading(false);
    return fullText;
  };

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  // Convenience methods
  const chat = useCallback((messages: Message[]) => invoke('chat', { messages }), [invoke]);
  const classifyWaste = useCallback((imageBase64: string) => invoke('classify', { imageBase64 }), [invoke]);
  const extractReceipt = useCallback((imageBase64: string) => invoke('extract', { imageBase64 }), [invoke]);
  const analyzeData = useCallback((data: any, prompt?: string) => invoke('analyze', { data, prompt }), [invoke]);
  const generateText = useCallback((prompt: string) => invoke('generate', { prompt }), [invoke]);
  const optimizeRoute = useCallback((prompt: string) => invoke('optimize', { prompt }), [invoke]);
  const detectAnomalies = useCallback((data: any) => invoke('detect', { data }), [invoke]);
  const forecastDemand = useCallback((data: any) => invoke('forecast', { data }), [invoke]);
  const inspectQuality = useCallback((imageBase64: string) => invoke('inspect', { imageBase64 }), [invoke]);

  return {
    invoke,
    isLoading,
    error,
    cancelStream,
    // Convenience methods
    chat,
    classifyWaste,
    extractReceipt,
    analyzeData,
    generateText,
    optimizeRoute,
    detectAnomalies,
    forecastDemand,
    inspectQuality,
  };
}
