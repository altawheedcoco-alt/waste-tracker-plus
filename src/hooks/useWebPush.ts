/**
 * useWebPush — Push notifications via Firebase FCM
 * VAPID Web Push is DISABLED — FCM is the sole push channel.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useFirebaseMessaging } from './useFirebaseMessaging';

async function clearLegacyBrowserPushSubscriptions() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      try {
        const subscription = await registration.pushManager?.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('[Push] Failed to clear legacy browser subscription:', error);
      }
    })
  );
}

export function useWebPush() {
  const { user } = useAuth();
  const { initializeFCM, fcmToken, loading: fcmLoading } = useFirebaseMessaging();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Check if already subscribed (permission granted + has token)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && fcmToken) {
      setIsSubscribed(true);
    }
  }, [fcmToken]);

  // Auto-init FCM if permission already granted
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'granted' && !fcmToken) {
      initializeFCM().then(token => {
        if (token) setIsSubscribed(true);
      }).catch(() => {});
    }
  }, [user, fcmToken, initializeFCM]);

  const subscribe = useCallback(async () => {
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return false; }
    if (subscribing) return false;
    setSubscribing(true);

    try {
      // 1. Request notification permission
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

      await clearLegacyBrowserPushSubscriptions();

      await supabase.from('push_subscriptions').delete()
        .eq('user_id', user.id)
        .not('endpoint', 'like', 'fcm_token://%');

      // 2. Initialize FCM and get token
      const token = await initializeFCM();
      if (!token) {
        toast.error('فشل تفعيل الإشعارات — حاول مرة أخرى');
        return false;
      }

      setIsSubscribed(true);
      toast.success('تم تفعيل الإشعارات ✅');

      // 3. Send confirmation notification
      supabase.from('notifications').insert({
        user_id: user.id,
        title: '🔔 تم تفعيل الإشعارات بنجاح',
        message: 'ستصلك جميع التنبيهات والتحديثات المهمة فوراً.',
        type: 'system',
        is_read: false,
      } as any).then(() => {});

      // 4. Test push via edge function
      supabase.functions.invoke('send-push', {
        body: {
          user_ids: [user.id],
          title: '🔔 اختبار الإشعارات',
          body: 'تم تفعيل الإشعارات بنجاح — هذا إشعار تجريبي!',
        },
      }).then(({ error }) => {
        if (error) console.warn('[Push] Test push error:', error);
      });

      return true;
    } catch (e) {
      console.error('[Push] Subscribe error:', e);
      toast.error('حدث خطأ — حاول مرة أخرى');
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [user, initializeFCM, subscribing]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      // Delete FCM subscriptions from DB
      await supabase.from('push_subscriptions').delete()
        .eq('user_id', user.id)
        .like('endpoint', 'fcm_token://%');
      setIsSubscribed(false);
      toast.success('تم إلغاء الإشعارات');
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err);
    }
  }, [user]);

  return {
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    isSubscribed,
    permission: ('Notification' in window ? Notification.permission : 'default') as NotificationPermission,
    loading: subscribing || fcmLoading,
    subscribe,
    unsubscribe,
  };
}
