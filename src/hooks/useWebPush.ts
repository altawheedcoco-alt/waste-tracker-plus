/**
 * useWebPush — Push notifications via Firebase FCM
 * VAPID Web Push is DISABLED — FCM is the sole push channel.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useFirebaseMessaging } from './useFirebaseMessaging';
import { getFirebaseMessaging } from '@/lib/firebase';

type PushSupportState = {
  checked: boolean;
  supported: boolean;
  reason: string | null;
};

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

async function detectPushSupport(): Promise<PushSupportState> {
  if (typeof window === 'undefined') {
    return { checked: true, supported: false, reason: 'المتصفح غير متاح حالياً' };
  }

  if (!window.isSecureContext) {
    return { checked: true, supported: false, reason: 'الإشعارات تحتاج اتصالاً آمناً HTTPS' };
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { checked: true, supported: false, reason: 'هذا المتصفح لا يدعم إشعارات الهاتف لهذا الموقع' };
  }

  if (isIOSDevice() && !isStandalonePwa()) {
    return {
      checked: true,
      supported: false,
      reason: 'على iPhone افتح الموقع من Safari ثم اختر إضافة إلى الشاشة الرئيسية لتفعيل الإشعارات',
    };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return { checked: true, supported: false, reason: 'Firebase Messaging غير مدعوم في هذا المتصفح أو هذا السياق' };
  }

  return { checked: true, supported: true, reason: null };
}

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
  const [supportState, setSupportState] = useState<PushSupportState>({
    checked: false,
    supported: false,
    reason: null,
  });

  const refreshSupport = useCallback(async () => {
    const result = await detectPushSupport();
    setSupportState(result);
    return result;
  }, []);

  useEffect(() => {
    refreshSupport().catch(() => {
      setSupportState({ checked: true, supported: false, reason: 'تعذر فحص دعم الإشعارات على هذا الجهاز' });
    });
  }, [refreshSupport]);

  // Check subscription state from DB on mount
  useEffect(() => {
    if (!user) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      if (fcmToken) {
        setIsSubscribed(true);
      } else {
        // Check DB for existing FCM subscription
        supabase.from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .like('endpoint', 'fcm_token://%')
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) setIsSubscribed(true);
          });
      }
    }
  }, [user, fcmToken]);

  useEffect(() => {
    if (!supportState.supported) return;
    if (user && 'Notification' in window && Notification.permission === 'granted' && !fcmToken) {
      initializeFCM().then(token => {
        if (token) setIsSubscribed(true);
      }).catch(() => {});
    }
  }, [user, fcmToken, initializeFCM, supportState.supported]);

  const subscribe = useCallback(async () => {
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return false; }
    if (subscribing) return false;
    setSubscribing(true);

    try {
      const support = await refreshSupport();
      if (!support.supported) {
        toast.error(support.reason || 'هذا الجهاز أو المتصفح لا يدعم إشعارات الهاتف حالياً');
        return false;
      }

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

      const token = await initializeFCM();
      if (!token) {
        return false;
      }

      setIsSubscribed(true);
      toast.success('تم تفعيل الإشعارات ✅');

      supabase.from('notifications').insert({
        user_id: user.id,
        title: '🔔 تم تفعيل الإشعارات بنجاح',
        message: 'ستصلك جميع التنبيهات والتحديثات المهمة فوراً.',
        type: 'system',
        is_read: false,
      } as any).then(() => {});

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
    } catch (e: any) {
      console.error('[Push] Subscribe error:', e);
      toast.error(e?.message || 'فشل تفعيل الإشعارات');
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [user, initializeFCM, subscribing, refreshSupport]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
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
    isSupported: supportState.supported,
    supportChecked: supportState.checked,
    unsupportedReason: supportState.reason,
    isSubscribed,
    permission: ('Notification' in window ? Notification.permission : 'default') as NotificationPermission,
    loading: subscribing || fcmLoading,
    subscribe,
    unsubscribe,
  };
}
