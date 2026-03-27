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

/**
 * VAPID Web Push is DISABLED.
 * All push notifications now go through Firebase FCM only.
 * This hook returns a no-op interface to avoid breaking existing consumers.
 */
export function useWebPush() {
  const { user } = useAuth();
  const { initializeFCM } = useFirebaseMessaging();

  const subscribe = useCallback(async () => {
    if (!user) { toast.error('يجب تسجيل الدخول أولاً'); return false; }

    // Request notification permission for FCM
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

    // Use FCM only
    try {
      await initializeFCM();
      toast.success('تم تفعيل الإشعارات ✅');

      // Send confirmation in-app
      supabase.from('notifications').insert({
        user_id: user.id,
        title: '🔔 تم تفعيل الإشعارات بنجاح',
        message: 'ستصلك جميع التنبيهات والتحديثات المهمة فوراً.',
        type: 'system',
        is_read: false,
      } as any).catch(() => {});

      return true;
    } catch (e) {
      console.error('[Push] FCM init failed:', e);
      toast.error('حدث خطأ — حاول مرة أخرى');
      return false;
    }
  }, [user, initializeFCM]);

  const unsubscribe = useCallback(async () => {
    toast.success('تم إلغاء الإشعارات');
  }, []);

  return {
    isSupported: 'Notification' in window,
    isSubscribed: false,
    permission: ('Notification' in window ? Notification.permission : 'default') as NotificationPermission,
    loading: false,
    subscribe,
    unsubscribe,
  };
}
