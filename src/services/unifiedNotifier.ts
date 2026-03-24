/**
 * Unified Dual-Channel Notification Service
 * 
 * القاعدة: كل إشعار يُرسل عبر قناتين معاً:
 * 1. إشعار داخلي (notifications table)
 * 2. واتساب (عبر whatsapp-send edge function)
 * 
 * لا يُرسل إشعار من قناة واحدة فقط أبداً.
 */
import { supabase } from '@/integrations/supabase/client';
import { fetchBranding } from '@/hooks/useBranding';

export interface DualNotification {
  /** المستخدم المستهدف */
  user_id: string;
  /** عنوان الإشعار */
  title: string;
  /** نص الرسالة */
  message: string;
  /** نوع الإشعار */
  type?: string;
  /** معرف المنظمة */
  organization_id?: string;
  /** معرف المرجع (شحنة، فاتورة، إلخ) */
  reference_id?: string;
  /** نوع المرجع */
  reference_type?: string;
  /** أولوية */
  priority?: string;
  /** بيانات إضافية */
  metadata?: Record<string, any>;
}

export interface BulkDualNotification {
  /** قائمة المستخدمين المستهدفين */
  user_ids: string[];
  /** عنوان الإشعار */
  title: string;
  /** نص الرسالة */
  message: string;
  /** نوع الإشعار */
  type?: string;
  /** معرف المنظمة */
  organization_id?: string;
  /** معرف المرجع */
  reference_id?: string;
  /** نوع المرجع */
  reference_type?: string;
  /** أولوية */
  priority?: string;
  /** بيانات إضافية */
  metadata?: Record<string, any>;
}

interface NotifyResult {
  inApp: { success: boolean; error?: string };
  whatsApp: { success: boolean; error?: string; sent?: number };
  push: { success: boolean; error?: string; sent?: number };
}

/**
 * إرسال إشعار مزدوج (داخلي + واتساب) لمستخدم واحد
 */
export async function sendDualNotification(notification: DualNotification): Promise<NotifyResult> {
  const result: NotifyResult = {
    inApp: { success: false },
    whatsApp: { success: false },
    push: { success: false },
  };

  // Fetch branding for notifications
  const branding = await fetchBranding();
  const systemName = branding.system_name || 'iRecycle';
  const logoUrl = branding.notification_logo_url || branding.logo_url || '';

  // 1. إشعار داخلي مع بيانات الهوية
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'general',
      is_read: false,
      metadata: {
        ...(notification.metadata || {}),
        system_name: systemName,
        logo_url: logoUrl,
      } as any,
    });
    result.inApp = error ? { success: false, error: error.message } : { success: true };
  } catch (err: any) {
    result.inApp = { success: false, error: err.message };
  }

  // 2. واتساب مع اسم النظام واللوجو
  try {
    const brandedMessage = `${logoUrl ? '🏷️ ' : ''}*${systemName}*\n\n${notification.title}\n\n${notification.message}`;
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: {
        action: 'send_to_user',
        user_id: notification.user_id,
        message_text: brandedMessage,
        organization_id: notification.organization_id,
        notification_type: notification.type || 'general',
        logo_url: logoUrl,
        system_name: systemName,
      },
    });
    result.whatsApp = error
      ? { success: false, error: error.message }
      : { success: true, sent: data?.sent || 1 };
  } catch (err: any) {
    result.whatsApp = { success: false, error: err.message };
    console.warn('[UnifiedNotifier] WhatsApp failed (non-blocking):', err.message);
  }

  // 3. Web Push (background notifications)
  try {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        user_id: notification.user_id,
        title: notification.title,
        body: notification.message,
        tag: `notif-${notification.type || 'general'}-${Date.now()}`,
        data: {
          url: notification.metadata?.url || '/',
          type: notification.type,
          reference_id: notification.reference_id,
        },
      },
    });
    result.push = error
      ? { success: false, error: error.message }
      : { success: true, sent: data?.sent || 0 };
  } catch (err: any) {
    result.push = { success: false, error: err.message };
    console.warn('[UnifiedNotifier] Push failed (non-blocking):', err.message);
  }

  return result;
}

/**
 * إرسال إشعار مزدوج لمجموعة مستخدمين
 */
export async function sendBulkDualNotification(notification: BulkDualNotification): Promise<NotifyResult> {
  const result: NotifyResult = {
    inApp: { success: false },
    whatsApp: { success: false },
    push: { success: false },
  };

  if (!notification.user_ids.length) {
    return { inApp: { success: true }, whatsApp: { success: true }, push: { success: true } };
  }

  // 1. إشعارات داخلية (دفعة واحدة)
  try {
    const rows = notification.user_ids.map(uid => ({
      user_id: uid,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'general',
      is_read: false,
    }));
    const { error } = await supabase.from('notifications').insert(rows);
    result.inApp = error ? { success: false, error: error.message } : { success: true };
  } catch (err: any) {
    result.inApp = { success: false, error: err.message };
  }

  // 2. واتساب (بث جماعي)
  try {
    const { data, error } = await supabase.functions.invoke('whatsapp-send', {
      body: {
        action: 'broadcast_to_users',
        user_ids: notification.user_ids,
        message_text: `${notification.title}\n\n${notification.message}`,
        organization_id: notification.organization_id,
        notification_type: notification.type || 'general',
      },
    });
    result.whatsApp = error
      ? { success: false, error: error.message }
      : { success: true, sent: data?.sent || notification.user_ids.length };
  } catch (err: any) {
    result.whatsApp = { success: false, error: err.message };
    console.warn('[UnifiedNotifier] Bulk WhatsApp failed (non-blocking):', err.message);
  }

  return result;
}

/**
 * إرسال إشعار مزدوج للمشرفين (admins)
 */
export async function notifyAdmins(
  title: string,
  message: string,
  options?: {
    type?: string;
    organization_id?: string;
    reference_id?: string;
    reference_type?: string;
  }
): Promise<NotifyResult> {
  try {
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!admins?.length) {
      return { inApp: { success: true }, whatsApp: { success: true } };
    }

    return sendBulkDualNotification({
      user_ids: admins.map(a => a.user_id),
      title,
      message,
      type: options?.type || 'admin',
      organization_id: options?.organization_id,
      reference_id: options?.reference_id,
      reference_type: options?.reference_type,
    });
  } catch (err: any) {
    console.error('[UnifiedNotifier] notifyAdmins error:', err);
    return {
      inApp: { success: false, error: err.message },
      whatsApp: { success: false, error: err.message },
    };
  }
}

/**
 * إرسال إشعار مزدوج لأعضاء منظمة
 */
export async function notifyOrganizationMembers(
  organizationId: string,
  title: string,
  message: string,
  options?: {
    type?: string;
    reference_id?: string;
    reference_type?: string;
    excludeUserIds?: string[];
  }
): Promise<NotifyResult> {
  try {
    const { data: members } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId);

    if (!members?.length) {
      return { inApp: { success: true }, whatsApp: { success: true } };
    }

    let userIds = members.map(m => m.id);
    if (options?.excludeUserIds) {
      userIds = userIds.filter(id => !options.excludeUserIds!.includes(id));
    }

    return sendBulkDualNotification({
      user_ids: userIds,
      title,
      message,
      type: options?.type || 'general',
      organization_id: organizationId,
      reference_id: options?.reference_id,
      reference_type: options?.reference_type,
    });
  } catch (err: any) {
    console.error('[UnifiedNotifier] notifyOrgMembers error:', err);
    return {
      inApp: { success: false, error: err.message },
      whatsApp: { success: false, error: err.message },
    };
  }
}
