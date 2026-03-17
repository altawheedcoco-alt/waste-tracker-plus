/**
 * notifyAction — إنشاء إشعار فوري عند تنفيذ أي إجراء في الواجهة
 * 
 * Usage:
 *   import { notifyAction } from '@/utils/notifyAction';
 *   notifyAction({ title: 'تم إنشاء شحنة جديدة', message: 'شحنة رقم #1234', type: 'shipment_created' });
 *   
 * Or target another user:
 *   notifyAction({ ..., targetUserId: 'some-uuid' });
 */
import { supabase } from '@/integrations/supabase/client';

export interface NotifyActionParams {
  /** عنوان الإشعار */
  title: string;
  /** نص الإشعار */
  message: string;
  /** نوع الإشعار (يؤثر على الصوت والفئة) */
  type?: string;
  /** أولوية: low, normal, high, urgent */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** معرّف الشحنة المرتبطة (اختياري) */
  shipmentId?: string | null;
  /** معرّف الطلب المرتبط (اختياري) */
  requestId?: string | null;
  /** بيانات إضافية */
  metadata?: Record<string, any> | null;
  /** معرّف المستخدم المستهدف (إذا لم يُحدد يُرسل للمستخدم الحالي) */
  targetUserId?: string;
  /** معرّف المنظمة */
  organizationId?: string | null;
}

/**
 * أرسل إشعاراً فورياً — يتم إدراجه في جدول notifications
 * مما يُطلق الاشتراك اللحظي (Realtime) ويحدّث العدّاد تلقائياً.
 */
export async function notifyAction(params: NotifyActionParams): Promise<boolean> {
  try {
    // Get current user if no target specified
    let userId = params.targetUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }
    if (!userId) return false;

    const { error } = await (supabase.from('notifications') as any).insert({
      user_id: userId,
      title: params.title,
      message: params.message,
      type: params.type || 'action',
      priority: params.priority || 'normal',
      shipment_id: params.shipmentId || null,
      request_id: params.requestId || null,
      metadata: params.metadata || null,
      organization_id: params.organizationId || null,
      is_read: false,
    });

    if (error) {
      console.error('notifyAction error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('notifyAction exception:', err);
    return false;
  }
}

/**
 * أرسل إشعاراً لعدة مستخدمين
 */
export async function notifyMultiple(
  userIds: string[],
  params: Omit<NotifyActionParams, 'targetUserId'>
): Promise<boolean> {
  if (userIds.length === 0) return false;
  try {
    const rows = userIds.map(uid => ({
      user_id: uid,
      title: params.title,
      message: params.message,
      type: params.type || 'action',
      priority: params.priority || 'normal',
      shipment_id: params.shipmentId || null,
      request_id: params.requestId || null,
      metadata: params.metadata || null,
      organization_id: params.organizationId || null,
      is_read: false,
    }));

    const { error } = await (supabase.from('notifications') as any).insert(rows);
    if (error) {
      console.error('notifyMultiple error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('notifyMultiple exception:', err);
    return false;
  }
}
