import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { preprocessForOCR } from '@/utils/imagePreprocess';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WasteClassification {
  waste_type: string;
  description: string;
  recommendations: string;
}

interface WeightData {
  // الحقول الأساسية
  gross_weight: string;
  tare_weight: string;
  net_weight: string;
  unit: string;
  date: string;
  time: string;
  company_name: string;
  vehicle_number: string;
  // الحقول الموسعة
  ticket_number?: string;
  operation_type?: string;
  material_type?: string;
  customer_name?: string;
  driver_name?: string;
  trailer_number?: string;
  governorate?: string;
  first_weight?: string;
  second_weight?: string;
  first_date?: string;
  first_time?: string;
  second_date?: string;
  second_time?: string;
  weigher_name?: string;
  notes?: string;
  additional_data?: Record<string, string>;
}

export const useAIAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming chat function
  const streamChat = useCallback(async ({
    messages,
    onDelta,
    onDone,
  }: {
    messages: Message[];
    onDelta: (deltaText: string) => void;
    onDone: () => void;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ type: "chat", messages }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في الاتصال");
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Classify waste from image
  const classifyWaste = useCallback(async (imageBase64: string): Promise<WasteClassification | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'classify_waste', imageBase64 }
      });

      if (funcError) throw funcError;

      const result = data.result;
      // Parse JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل في تصنيف النفاية";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extract weight data from scale image
  const extractWeightData = useCallback(async (imageBase64: string): Promise<WeightData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'extract_weight', imageBase64 }
      });

      if (funcError) throw funcError;

      const result = data.result;
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل في استخراج بيانات الوزن";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimize routes
  const optimizeRoute = useCallback(async (locations: string[]): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `لدي المواقع التالية التي يجب زيارتها: ${locations.join('، ')}. 
      ما هو أفضل ترتيب للمسار لتوفير الوقت والوقود؟`;

      const { data, error: funcError } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'optimize_route', prompt }
      });

      if (funcError) throw funcError;
      return data.result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل في تحسين المسار";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate smart report
  const generateReport = useCallback(async (data: Record<string, any>): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const prompt = `حلل البيانات التالية وقدم تقريراً شاملاً:\n${JSON.stringify(data, null, 2)}`;

      const { data: responseData, error: funcError } = await supabase.functions.invoke('ai-assistant', {
        body: { type: 'generate_report', prompt }
      });

      if (funcError) throw funcError;
      return responseData.result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل في إنشاء التقرير";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    streamChat,
    classifyWaste,
    extractWeightData,
    optimizeRoute,
    generateReport,
  };
};
