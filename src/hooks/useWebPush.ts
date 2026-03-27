/**
 * useWebPush — Subscribe to Web Push notifications (VAPID)
 * One-tap: permission dialog → subscribe → save → done
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useFirebaseMessaging } from './useFirebaseMessaging';

/**
 * VAPID Web Push is DISABLED.
 * All push notifications now go through Firebase FCM only.
 */
export function useWebPush() {
  const { user } = useAuth();
  const { initializeFCM, fcmToken } = useFirebaseMessaging();
  const [isSubscribed, setIsSubscribed] = useState(() => {
    // Check if permission already granted = already subscribed
    return 'Notification' in window && Notification.permission === 'granted';
  });
  const [loading, setLoading] = useState(false);

  const subscribe = useCallback(async () => {
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return false; }
    setLoading(true);

    try {
      let perm: NotificationPermission;
      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = Notification.permission;
      }

      if (perm !== 'granted') {
        toast.error(perm === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'لم يتم قبول الإذن');
        return false;
      }

      await initializeFCM();
      setIsSubscribed(true);
      toast.success('تم تفعيل الإشعارات ✅');

      supabase.from('notifications').insert({
        user_id: user.id,
        title: '🔔 تم تفعيل الإشعارات بنجاح',
        message: 'ستصلك جميع التنبيهات والتحديثات المهمة فوراً.',
        type: 'system',
        is_read: false,
      } as any).then(() => {});

      return true;
    } catch (e) {
      console.error('[Push] FCM init failed:', e);
      toast.error('حدث خطأ — حاول مرة أخرى');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, initializeFCM]);

  const unsubscribe = useCallback(async () => {
    setIsSubscribed(false);
    toast.success('تم إلغاء الإشعارات');
  }, []);

  return {
    isSupported: 'Notification' in window,
    isSubscribed,
    permission: ('Notification' in window ? Notification.permission : 'default') as NotificationPermission,
    loading,
    subscribe,
    unsubscribe,
  };
}
