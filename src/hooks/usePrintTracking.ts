import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/** Generate a unique print tracking code: PRN-YYMM-XXXXXX */
const generateTrackingCode = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PRN-${yy}${mm}-${rand}`;
};

interface LogPrintParams {
  documentType: string;
  documentId?: string;
  documentNumber?: string;
  templateId?: string;
  themeId?: string;
  actionType?: 'print' | 'pdf_export' | 'email' | 'whatsapp' | 'save';
  metadata?: Record<string, any>;
}

export const usePrintTracking = () => {
  const { user, profile } = useAuth();

  const logPrint = useCallback(async (params: LogPrintParams): Promise<string | null> => {
    if (!user || !profile?.organization_id) return null;

    const trackingCode = generateTrackingCode();
    const employeeCode = user.id.slice(0, 8).toUpperCase();

    try {
      const { error } = await supabase.from('document_print_log' as any).insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        document_type: params.documentType,
        document_id: params.documentId || null,
        document_number: params.documentNumber || null,
        print_tracking_code: trackingCode,
        template_id: params.templateId || 'standard',
        theme_id: params.themeId || 'corporate',
        action_type: params.actionType || 'print',
        printed_by_name: profile.full_name || user.email,
        printed_by_employee_code: employeeCode,
        metadata: params.metadata || {},
      });

      if (error) throw error;
      return trackingCode;
    } catch (e) {
      console.error('Failed to log print:', e);
      return trackingCode; // still return code even if logging fails
    }
  }, [user, profile]);

  return { logPrint, generateTrackingCode };
};
