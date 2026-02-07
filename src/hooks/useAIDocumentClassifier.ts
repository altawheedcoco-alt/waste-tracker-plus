import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassificationResult {
  document_type: string;
  confidence: number;
  extracted_data: Record<string, any>;
  suggested_folder: string;
  tags: string[];
  summary: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  weight_ticket: 'تذكرة وزن',
  invoice: 'فاتورة',
  contract: 'عقد',
  license: 'ترخيص',
  vehicle_photo: 'صورة مركبة',
  waste_photo: 'صورة نفايات',
  identity: 'إثبات هوية',
  financial: 'مستند مالي',
  report: 'تقرير',
  other: 'أخرى',
};

export const useAIDocumentClassifier = () => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const classifyDocument = useCallback(async (file: File): Promise<ClassificationResult | null> => {
    setIsClassifying(true);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error: funcError } = await supabase.functions.invoke('ai-document-classifier', {
        body: {
          imageBase64: base64,
          fileName: file.name,
          mimeType: file.type,
        }
      });

      if (funcError) throw funcError;

      if (!data.success) {
        throw new Error(data.error || 'فشل في تصنيف المستند');
      }

      return data.result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل في تصنيف المستند';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsClassifying(false);
    }
  }, []);

  const getDocumentTypeLabel = useCallback((type: string): string => {
    return DOCUMENT_TYPE_LABELS[type] || type;
  }, []);

  return {
    isClassifying,
    error,
    classifyDocument,
    getDocumentTypeLabel,
    DOCUMENT_TYPE_LABELS,
  };
};
