/**
 * useNativePush — Web Push API مباشر بدون Firebase
 * يستخدم VAPID keys خاصة بالمنصة
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// VAPID Public Key — مفتاح عام (ليس سرّي)
const VAPID_PUBLIC_KEY = 'BGUbGLdxCbsZR7ZZQNdZAkpusnhxFrYdQcKSh1oBorhVSeJC7GWb2jTLX17YW40gRn7EWJp0wLe4847KtgGXHcs';
const SW_PATH = '/native-push-sw.js';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function useNativePush() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Check support
  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      window.isSecureContext &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
  }, []);

  // Check existing subscription
  useEffect(() => {
    if (!user || !isSupported) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          }
        }
      } catch {}
    })();
  }, [user, isSupported]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;
    setLoading(true);

    try {
      // 1. طلب إذن الإشعارات
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error(permission === 'denied'
          ? 'الإشعارات محظورة — فعّلها من إعدادات المتصفح'
          : 'لم يتم قبول إذن الإشعارات');
        return false;
      }

      // 2. تسجيل Service Worker
      const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
      await navigator.serviceWorker.ready;
      console.log('[NativePush] SW registered:', reg.scope);

      // 3. إنشاء اشتراك Web Push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[NativePush] Subscription created:', sub.endpoint);

      // 4. استخراج المفاتيح
      const p256dh = arrayBufferToBase64Url(sub.getKey('p256dh')!);
      const auth = arrayBufferToBase64Url(sub.getKey('auth')!);

      // 5. حفظ في قاعدة البيانات
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh: p256dh,
          auth_key: auth,
        } as any,
        { onConflict: 'user_id,endpoint' }
      );

      if (error) {
        console.error('[NativePush] DB save error:', error);
        toast.error('فشل حفظ الاشتراك');
        return false;
      }

      setIsSubscribed(true);
      toast.success('✅ تم تفعيل الإشعارات الأصلية!');

      // 6. إرسال إشعار تجريبي فوراً
      console.log('[NativePush] Sending test push...');
      const { error: pushError } = await supabase.functions.invoke('send-push', {
        body: {
          user_ids: [user.id],
          title: '🔔 إشعار تجريبي — Web Push',
          body: 'مبروك! الإشعارات الأصلية شغّالة بدون Firebase 🎉',
          data: { url: '/dashboard' },
        },
      });

      if (pushError) {
        console.warn('[NativePush] Test push error:', pushError);
      }

      return true;
    } catch (err: any) {
      console.error('[NativePush] Error:', err);
      toast.error(err?.message || 'فشل تفعيل الإشعارات');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
      }
      await supabase.from('push_subscriptions').delete()
        .eq('user_id', user.id)
        .not('endpoint', 'like', 'fcm_token://%');
      setIsSubscribed(false);
      toast.success('تم إلغاء الإشعارات الأصلية');
    } catch (err) {
      console.error('[NativePush] Unsubscribe error:', err);
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    loading,
    permission: ('Notification' in window ? Notification.permission : 'default') as NotificationPermission,
    subscribe,
    unsubscribe,
  };
}
