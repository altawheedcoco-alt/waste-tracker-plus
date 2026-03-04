/**
 * useUnifiedNotifier — React hook for dual-channel notifications (In-App + WhatsApp)
 * 
 * كل إشعار يُرسل تلقائياً عبر القناتين معاً.
 */
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  sendDualNotification,
  sendBulkDualNotification,
  notifyAdmins,
  notifyOrganizationMembers,
  DualNotification,
  BulkDualNotification,
} from '@/services/unifiedNotifier';

export function useUnifiedNotifier() {
  const { user, profile, organization } = useAuth();

  /** إرسال إشعار مزدوج لمستخدم واحد */
  const notify = useCallback(async (notification: Omit<DualNotification, 'organization_id'> & { organization_id?: string }) => {
    return sendDualNotification({
      ...notification,
      organization_id: notification.organization_id || organization?.id,
    });
  }, [organization]);

  /** إرسال إشعار مزدوج لمجموعة */
  const notifyBulk = useCallback(async (notification: Omit<BulkDualNotification, 'organization_id'> & { organization_id?: string }) => {
    return sendBulkDualNotification({
      ...notification,
      organization_id: notification.organization_id || organization?.id,
    });
  }, [organization]);

  /** إشعار المشرفين */
  const alertAdmins = useCallback(async (title: string, message: string, options?: {
    type?: string;
    reference_id?: string;
    reference_type?: string;
  }) => {
    return notifyAdmins(title, message, {
      ...options,
      organization_id: organization?.id,
    });
  }, [organization]);

  /** إشعار أعضاء منظمة */
  const alertOrg = useCallback(async (orgId: string, title: string, message: string, options?: {
    type?: string;
    reference_id?: string;
    reference_type?: string;
    excludeSelf?: boolean;
  }) => {
    return notifyOrganizationMembers(orgId, title, message, {
      ...options,
      excludeUserIds: options?.excludeSelf && user?.id ? [user.id] : undefined,
    });
  }, [user]);

  /** إرسال طوارئ مزدوج */
  const alertEmergency = useCallback(async (data: {
    title: string;
    message: string;
    shipment_id?: string;
  }) => {
    return notifyAdmins(
      `🚨 ${data.title}`,
      data.message,
      {
        type: 'emergency',
        reference_id: data.shipment_id,
        reference_type: data.shipment_id ? 'shipment' : undefined,
        organization_id: organization?.id,
      }
    );
  }, [organization]);

  return {
    notify,
    notifyBulk,
    alertAdmins,
    alertOrg,
    alertEmergency,
    /** اسم المرسل */
    senderName: profile?.full_name || 'مستخدم',
  };
}
