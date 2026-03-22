/**
 * useDocumentProtection — Hook شامل لحماية المستندات
 * يدير: PIN، صلاحيات، علامة مائية، إشعارات، تسجيل الوصول، انتهاء الصلاحية
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

  const getProtection = useCallback(async (documentId: string): Promise<DocumentProtection> => {
    try {
      const { data, error } = await supabase
        .from('organization_documents')
        .select('protection_enabled, protection_pin, allow_view, allow_download, allow_print, watermark_enabled, notify_on_download')
        .eq('id', documentId)
        .single();

      if (error) return DEFAULT_PROTECTION;
      return {
        protection_enabled: (data as any)?.protection_enabled ?? false,
        protection_pin: (data as any)?.protection_pin ?? null,
        allow_view: (data as any)?.allow_view ?? true,
        allow_download: (data as any)?.allow_download ?? true,
        allow_print: (data as any)?.allow_print ?? true,
        watermark_enabled: (data as any)?.watermark_enabled ?? false,
        notify_on_download: (data as any)?.notify_on_download ?? false,
      };
    } catch {
      return DEFAULT_PROTECTION;
    }
  }, []);

  const logAccess = useCallback(async (
    documentId: string,
    actionType: string,
    organizationId?: string,
    success = true
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let orgId = organizationId;
      if (!orgId) {
        const { data } = await supabase
          .from('organization_documents')
          .select('organization_id')
          .eq('id', documentId)
          .single();
        orgId = data?.organization_id;
      }

      await supabase.from('document_access_log').insert({
        document_id: documentId,
        user_id: user.id,
        action_type: actionType,
        success,
        ip_address: null,
        user_agent: navigator.userAgent?.slice(0, 200),
      } as any);

      // Send notification if download/print and notify enabled
      if (success && (actionType === 'download' || actionType === 'print')) {
        const { data: doc } = await supabase
          .from('organization_documents')
          .select('notify_on_download, organization_id, file_name')
          .eq('id', documentId)
          .single();

        if ((doc as any)?.notify_on_download && orgId) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            organization_id: orgId,
            title: `🔔 ${actionType === 'download' ? 'تم تحميل' : 'تم طباعة'} مستند محمي`,
            message: `قام مستخدم بـ${actionType === 'download' ? 'تحميل' : 'طباعة'} الملف: ${(doc as any)?.file_name || 'مستند'}`,
            type: 'security',
          } as any).catch(() => {});
        }
      }
    } catch {
      /* silent */
    }
  }, []);

  const checkAccess = useCallback(async (
    documentId: string,
    actionType: 'download' | 'print' | 'view',
    callback: () => void,
    organizationId?: string,
  ): Promise<boolean> => {
    const protection = await getProtection(documentId);

    if (!protection.protection_enabled) {
      logAccess(documentId, actionType, organizationId);
      callback();
      return true;
    }

    // Check permission
    const ACTION_LABELS: Record<string, string> = {
      view: 'المعاينة',
      download: 'التحميل',
      print: 'الطباعة',
    };

    if (actionType === 'view' && !protection.allow_view) {
      toast.error(`${ACTION_LABELS[actionType]} غير مسموحة لهذا المستند`);
      logAccess(documentId, `${actionType}_blocked`, organizationId, false);
      return false;
    }
    if (actionType === 'download' && !protection.allow_download) {
      toast.error(`${ACTION_LABELS[actionType]} غير مسموح لهذا المستند`);
      logAccess(documentId, `${actionType}_blocked`, organizationId, false);
      return false;
    }
    if (actionType === 'print' && !protection.allow_print) {
      toast.error(`${ACTION_LABELS[actionType]} غير مسموحة لهذا المستند`);
      logAccess(documentId, `${actionType}_blocked`, organizationId, false);
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
  }, [getProtection, logAccess]);

  const handlePinSuccess = useCallback(() => {
    if (pendingAction) {
      logAccess(pendingAction.documentId, pendingAction.actionType, pendingAction.organizationId);
      pendingAction.callback();
      setPendingAction(null);
    }
  }, [pendingAction, logAccess]);

  return {
    checkAccess,
    getProtection,
    logAccess,
    pinDialogOpen,
    setPinDialogOpen,
    pendingAction,
    handlePinSuccess,
  };
}
