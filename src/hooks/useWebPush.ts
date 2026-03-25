/**
 * useWebPush — Subscribe to Web Push notifications (VAPID)
 * Works even when browser/tab is closed.
 * Optimized for fast subscription (~1-3 seconds)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BAUii7gQ7fO0xLhOUzWqpzfZ7UDj_PqKYKT2ahVOThwaP9lP7gENAfC33gRUUi3frzfBQ2t0d_Jdna50WByL6xA';

// Pre-compute the application server key once
let _cachedAppServerKey: Uint8Array | null = null;
function getAppServerKey(): Uint8Array {
  if (_cachedAppServerKey) return _cachedAppServerKey;
  const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
  const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  _cachedAppServerKey = Uint8Array.from(rawData, (char) => char.charCodeAt(0));
  return _cachedAppServerKey;
}

// Pre-warm: get SW registration early so it's ready when user clicks
let _cachedRegistration: ServiceWorkerRegistration | null = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => { _cachedRegistration = reg; });
}

export function useWebPush() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const regRef = useRef<ServiceWorkerRegistration | null>(_cachedRegistration);

  useEffect(() => {
    const supported = 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    // Use cached registration or wait for it
    const checkSub = async () => {
      try {
        if (!regRef.current) {
          regRef.current = _cachedRegistration || await navigator.serviceWorker.ready;
          _cachedRegistration = regRef.current;
        }
        const sub = await regRef.current.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch { /* SW not ready */ }
    };
    checkSub();
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      toast.error('المتصفح لا يدعم إشعارات Push');
      return false;
    }

    setLoading(true);
    try {
      // 1. Request permission (fast — browser native dialog)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('تم رفض إذن الإشعارات');
        return false;
      }

      // 2. Get registration (should be instant from cache)
      const registration = regRef.current || _cachedRegistration || await navigator.serviceWorker.ready;
      regRef.current = registration;

      // 3. Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // 4. Subscribe (the main network call)
        const appServerKey = getAppServerKey();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey.buffer as ArrayBuffer,
        });
      }

      const subJson = subscription.toJSON();

      // 5. Save to DB with retry — AWAIT to ensure it completes
      const payload = {
        user_id: user.id,
        endpoint: subscription!.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth_key: subJson.keys?.auth || '',
      };
      console.log('[WebPush] Saving subscription for user:', user.id);

      let saved = false;
      for (let i = 0; i < 3; i++) {
        try {
          const { error } = await supabase.from('push_subscriptions' as any).upsert(
            payload,
            { onConflict: 'user_id,endpoint' }
          );
          if (!error) {
            saved = true;
            console.log('[WebPush] ✅ Subscription saved to DB');
            break;
          }
          console.error(`[WebPush] DB save attempt ${i + 1}/3:`, error.message, error.code);
        } catch (e) {
          console.error(`[WebPush] DB save exception ${i + 1}/3:`, e);
        }
        if (i < 2) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }

      setIsSubscribed(true);
      if (saved) {
        toast.success('تم تفعيل الإشعارات ✅');
      } else {
        toast.warning('تم تفعيل الإشعارات لكن فشل الحفظ — حاول مرة أخرى');
      }

      return true;
    } catch (err: any) {
      console.error('[WebPush] Subscribe error:', err);
      toast.error('حدث خطأ أثناء تفعيل الإشعارات');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const registration = regRef.current || await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }
      setIsSubscribed(false);
      toast.success('تم إلغاء الإشعارات');
    } catch (err) {
      console.error('[WebPush] Unsubscribe error:', err);
    }
  }, [user]);

  return { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe };
}
