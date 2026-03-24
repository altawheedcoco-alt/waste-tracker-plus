/**
 * useWebPush — Subscribe to Web Push notifications (VAPID)
 * Works even when browser/tab is closed.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// VAPID public key — safe to embed (public key only)
const VAPID_PUBLIC_KEY = 'BAUii7gQ7fO0xLhOUzWqpzfZ7UDj_PqKYKT2ahVOThwaP9lP7gENAfC33gRUUi3frzfBQ2t0d_Jdna50WByL6xA';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function useWebPush() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  // Check support and existing subscription
  useEffect(() => {
    const supported = 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      // SW not ready yet
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      toast.error('المتصفح لا يدعم إشعارات Push');
      return false;
    }

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error('تم رفض إذن الإشعارات');
        return false;
      }

      // Get SW registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey.buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh || '';
      const auth = subJson.keys?.auth || '';

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth_key: auth,
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('تم تفعيل الإشعارات — ستصلك حتى لو المتصفح مقفول');
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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
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

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  };
}
