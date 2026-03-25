/**
 * useWebPush — Subscribe to Web Push notifications (VAPID)
 * One-tap: permission dialog → subscribe → save → done
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const subscribingRef = useRef(false); // guard against double-calls

  // Check support & existing subscription on mount
  useEffect(() => {
    const supported = 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch { /* ignore */ }
    })();
  }, []);

  const subscribe = useCallback(async () => {
    // Guard: no user, not supported, already running
    if (!isSupported || !user || subscribingRef.current) return false;
    subscribingRef.current = true;
    setLoading(true);

    try {
      // 1. Request permission
      let perm: NotificationPermission;
      try {
        perm = await Promise.race([
          Notification.requestPermission(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
        ]);
      } catch {
        perm = Notification.permission;
        if (perm === 'default') {
          toast.error('لم يظهر طلب الإذن — جرّب تاني أو فعّل الإشعارات من إعدادات المتصفح');
          return false;
        }
      }
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error(perm === 'denied' ? 'الإشعارات محظورة من إعدادات المتصفح' : 'لم يتم قبول الإذن');
        return false;
      }

      // 2. Get SW & subscribe to push
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: getAppServerKey().buffer as ArrayBuffer,
        });
      }

      // 3. Save to DB (upsert with retry)
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
        if (error) console.error('[WebPush] Save error attempt', i + 1, error.message);
        if (!error) { saved = true; break; }
        if (i < 2) await new Promise(r => setTimeout(r, 800));
      }

      // 4. Verify
      const verifySub = await registration.pushManager.getSubscription();
      setIsSubscribed(!!verifySub);
      console.log('[WebPush] Subscription saved:', saved, 'verified:', !!verifySub);

      if (saved) {
        toast.success('تم تفعيل الإشعارات ✅');
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
