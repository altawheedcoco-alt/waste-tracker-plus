/**
 * useWebPush — Subscribe to Web Push notifications (VAPID)
 * One-tap: permission dialog → subscribe → save → done
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useFirebaseMessaging } from './useFirebaseMessaging';

const VAPID_PUBLIC_KEY = 'BGUbGLdxCbsZR7ZZQNdZAkpusnhxFrYdQcKSh1oBorhVSeJC7GWb2jTLX17YW40gRn7EWJp0wLe4847KtgGXHcs';

let _cachedAppServerKey: Uint8Array | null = null;
function getAppServerKey(): Uint8Array {
  if (_cachedAppServerKey) return _cachedAppServerKey;
  const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
  const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  _cachedAppServerKey = Uint8Array.from(rawData, (char) => char.charCodeAt(0));
  return _cachedAppServerKey;
}

export function useWebPush() {
  const { user } = useAuth();
  const { initializeFCM } = useFirebaseMessaging();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const subscribingRef = useRef(false);

  // Check support & existing subscription on mount
  useEffect(() => {
    const supported = 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);

    (async () => {
      try {
        const reg = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.getRegistration()) || null;
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setIsSubscribed(!!sub);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const subscribe = useCallback(async () => {
    // Guard: no user, not supported, already running
    if (!isSupported) { toast.error('المتصفح لا يدعم الإشعارات'); return false; }
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return false; }
    if (subscribingRef.current) return false;
    subscribingRef.current = true;
    setLoading(true);

    try {
      // 1. Request permission (no timeout — let browser handle it)
      let perm: NotificationPermission;
      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = Notification.permission;
      }
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error(perm === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'لم يتم قبول الإذن');
        return false;
      }

      // 2. Get SW registration with timeout
      let registration: ServiceWorkerRegistration;
      try {
        // Check for existing registrations first (VitePWA auto-registers)
        const existingRegs = await navigator.serviceWorker.getRegistrations();
        if (existingRegs.length === 0) {
          // Only register manually if VitePWA hasn't done it
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        }
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('sw_timeout')), 20000)),
        ]);
      } catch (swErr) {
        console.error('[WebPush] SW not ready:', swErr);
        toast.error('تعذر تشغيل خدمة الإشعارات — أعد تحميل الصفحة وحاول مرة أخرى');
        return false;
      }

      // 3. Subscribe to push
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: getAppServerKey().buffer as ArrayBuffer,
          });
        } catch (subErr) {
          console.error('[WebPush] Subscribe error:', subErr);
          toast.error('فشل الاشتراك في الإشعارات — تأكد من إعدادات المتصفح');
          return false;
        }
      }

      // 4. Ensure auth session is ready before DB write
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[WebPush] No active session — cannot save subscription');
        toast.error('يجب تسجيل الدخول أولاً لحفظ الاشتراك');
        return false;
      }

      // 5. Save to DB (upsert with retry)
      const subJson = subscription.toJSON();
      const payload = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth_key: subJson.keys?.auth || '',
      };

      let saved = false;
      for (let i = 0; i < 3; i++) {
        const { error } = await supabase.from('push_subscriptions').upsert(
          payload as any, { onConflict: 'user_id,endpoint' }
        );
        if (error) console.error('[WebPush] Save error attempt', i + 1, error.message, error.details, error.code);
        if (!error) { saved = true; break; }
        if (i < 2) await new Promise(r => setTimeout(r, 1000));
      }

      // 5. Verify
      const verifySub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!verifySub);
      console.log('[WebPush] Subscription saved:', saved, 'verified:', !!verifySub);

      if (saved) {
        toast.success('تم تفعيل الإشعارات ✅');

        // Initialize FCM alongside VAPID
        initializeFCM().catch(e => console.warn('[WebPush] FCM init skipped:', e));

        // Send confirmation via all channels
        const confirmTitle = '🔔 تم تفعيل الإشعارات بنجاح';
        const confirmBody = 'مرحباً! تم تفعيل الإشعارات لديك — ستصلك جميع التنبيهات والتحديثات المهمة فوراً.';

        // 1. In-app notification
        supabase.from('notifications').insert({
          user_id: user.id,
          title: confirmTitle,
          message: confirmBody,
          type: 'system',
          is_read: false,
        } as any).then(({ error }) => {
          if (error) console.warn('[WebPush] In-app notification error:', error.message);
        });

        // 2. Web Push notification (via edge function to test the pipeline)
        supabase.functions.invoke('send-push', {
          body: {
            user_ids: [user.id],
            title: confirmTitle,
            body: confirmBody,
          },
        }).then(({ error }) => {
          if (error) console.warn('[WebPush] Push confirmation error:', error);
        });
      } else {
        toast.warning('تم التفعيل لكن فشل الحفظ — حاول لاحقاً');
      }
      return true;
    } catch (err) {
      console.error('[WebPush] Error:', err);
      toast.error('حدث خطأ — حاول مرة أخرى');
      return false;
    } finally {
      setLoading(false);
      setPermission(Notification.permission);
      subscribingRef.current = false;
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase.from('push_subscriptions').delete()
          .eq('user_id', user.id).eq('endpoint', subscription.endpoint);
      }
      setIsSubscribed(false);
      toast.success('تم إلغاء الإشعارات');
    } catch (err) {
      console.error('[WebPush] Unsubscribe error:', err);
    }
  }, [user]);

  return { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe };
}
