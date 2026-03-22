/**
 * useDocumentProtection — Hook for checking and enforcing document protection
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentProtection {
  protection_enabled: boolean;
  protection_pin: string | null;
  allow_view: boolean;
  allow_download: boolean;
  allow_print: boolean;
  watermark_enabled: boolean;
  notify_on_download: boolean;
}

const DEFAULT_PROTECTION: DocumentProtection = {
  protection_enabled: false,
  protection_pin: null,
  allow_view: true,
  allow_download: true,
  allow_print: true,
  watermark_enabled: false,
  notify_on_download: false,
};

export function useDocumentProtection() {
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    documentId: string;
    actionType: 'download' | 'print' | 'view';
    callback: () => void;
    organizationId?: string;
  } | null>(null);

  /**
   * Fetch protection settings for a document
   */
  const getProtection = useCallback(async (documentId: string): Promise<DocumentProtection> => {
    try {
      const { data, error } = await supabase
        .from('organization_documents')
        .select('protection_enabled, protection_pin, allow_view, allow_download, allow_print, watermark_enabled, notify_on_download')
        .eq('id', documentId)
        .single();

      if (error) return DEFAULT_PROTECTION;
      return { ...DEFAULT_PROTECTION, ...(data as any) };
    } catch {
      return DEFAULT_PROTECTION;
    }
  }, []);

  /**
   * Check if an action is allowed. If PIN required, opens PIN dialog.
   * Returns true if action can proceed immediately.
   */
  const checkAccess = useCallback(async (
    documentId: string,
    actionType: 'download' | 'print' | 'view',
    callback: () => void,
    organizationId?: string,
  ): Promise<boolean> => {
    const protection = await getProtection(documentId);

    if (!protection.protection_enabled) {
      // Log the access
      logAccess(documentId, actionType, organizationId);
      callback();
      return true;
    }

    // Check permission
    if (actionType === 'view' && !protection.allow_view) {
      toast.error('المعاينة غير مسموحة لهذا المستند');
      return false;
    }
    if (actionType === 'download' && !protection.allow_download) {
      toast.error('التحميل غير مسموح لهذا المستند');
      return false;
    }
    if (actionType === 'print' && !protection.allow_print) {
      toast.error('الطباعة غير مسموحة لهذا المستند');
      return false;
    }

    // If PIN is set, require verification
    if (protection.protection_pin) {
      setPendingAction({ documentId, actionType, callback, organizationId });
      setPinDialogOpen(true);
      return false;
    }

    // No PIN but protection enabled — allow with logging
    logAccess(documentId, actionType, organizationId);
    callback();
    return true;
  }, [getProtection]);

  const logAccess = async (documentId: string, actionType: string, organizationId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get org id from document if not provided
      let orgId = organizationId;
      if (!orgId) {
        const { data } = await supabase.from('organization_documents').select('organization_id').eq('id', documentId).single();
        orgId = data?.organization_id;
      }

      if (orgId) {
        await supabase.from('document_access_log').insert({
          document_id: documentId,
          user_id: user.id,
          organization_id: orgId,
          action_type: actionType,
        } as any);
      }

      // Check if notify_on_download is enabled
      if (actionType === 'download' || actionType === 'print') {
        const { data: doc } = await supabase
          .from('organization_documents')
          .select('notify_on_download, organization_id, file_name')
          .eq('id', documentId)
          .single();

        if ((doc as any)?.notify_on_download) {
          // Create notification for org admins
          await supabase.from('notifications').insert({
            user_id: user.id,
            organization_id: (doc as any)?.organization_id,
            title: `🔔 ${actionType === 'download' ? 'تم تحميل' : 'تم طباعة'} مستند محمي`,
            message: `قام مستخدم بـ${actionType === 'download' ? 'تحميل' : 'طباعة'} الملف: ${(doc as any)?.file_name}`,
            type: 'security',
          } as any).catch(() => { /* silent */ });
        }
      }
    } catch { /* silent */ }
  };

  const handlePinSuccess = useCallback(() => {
    if (pendingAction) {
      pendingAction.callback();
      setPendingAction(null);
    }
  }, [pendingAction]);

  return {
    checkAccess,
    getProtection,
    pinDialogOpen,
    setPinDialogOpen,
    pendingAction,
    handlePinSuccess,
  };
}
