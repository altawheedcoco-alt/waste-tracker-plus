import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedComplianceData {
  document_type: string;
  license_number?: string;
  issue_date?: string;
  expiry_date?: string;
  licensed_waste_types?: string[];
  issuing_authority?: string;
  holder_name?: string;
  summary?: string;
}

export function useDocumentComplianceExtractor() {
  const [extracting, setExtracting] = useState(false);

  const extractAndUpdate = useCallback(async (
    file: File,
    organizationId: string,
  ): Promise<ExtractedComplianceData | null> => {
    setExtracting(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('ai-document-classifier', {
        body: {
          imageBase64: base64,
          fileName: file.name,
          mimeType: file.type,
          extractCompliance: true,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'فشل تحليل المستند');

      const result = data.result as ExtractedComplianceData;

      // Auto-populate org fields based on extracted data
      const updates: Record<string, any> = {};
      if (result.license_number) {
        if (result.document_type === 'wmra_license') {
          updates.wmra_license = result.license_number;
          if (result.expiry_date) updates.wmra_license_expiry_date = result.expiry_date;
          if (result.issue_date) updates.wmra_license_issue_date = result.issue_date;
        } else if (result.document_type === 'environmental_approval') {
          updates.environmental_approval_number = result.license_number;
          if (result.expiry_date) updates.env_approval_expiry = result.expiry_date;
        } else if (result.document_type === 'transport_license') {
          updates.land_transport_license = result.license_number;
        }
      }
      if (result.licensed_waste_types?.length) {
        updates.licensed_waste_types = result.licensed_waste_types;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', organizationId);

        if (updateError) {
          console.error('Failed to auto-update org fields:', updateError);
          toast.warning('تم استخراج البيانات لكن فشل التحديث التلقائي');
        } else {
          toast.success('تم استخراج وحفظ بيانات المستند تلقائياً');
        }
      }

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تحليل المستند';
      toast.error(msg);
      return null;
    } finally {
      setExtracting(false);
    }
  }, []);

  return { extractAndUpdate, extracting };
}
