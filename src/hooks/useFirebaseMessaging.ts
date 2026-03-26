/**
 * useFirebaseMessaging — FCM integration hook
 * Works alongside existing VAPID Web Push as an additional channel.
 * Saves FCM tokens to push_subscriptions for server-side sending.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getFirebaseMessaging, getToken, onMessage } from '@/lib/firebase';
import { showSystemNotification } from '@/lib/systemNotifications';

const FCM_VAPID_KEY = 'BGUbGLdxCbsZR7ZZQNdZAkpusnhxFrYdQcKSh1oBorhVSeJC7GWb2jTLX17YW40gRn7EWJp0wLe4847KtgGXHcs';

export function useFirebaseMessaging() {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initRef = useRef(false);

  // Listen for foreground messages
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM] Foreground message:', payload);
        // Show as toast for foreground messages
        const title = payload.notification?.title || 'iRecycle';
        const body = payload.notification?.body || '';
        toast.info(`${title}: ${body}`, { duration: 5000 });

        showSystemNotification(title, {
          body,
          tag: payload.data?.tag || `fcm-foreground-${Date.now()}`,
          url: payload.data?.url || '/',
          data: payload.data || {},
        }).catch((error) => {
          console.warn('[FCM] Foreground system notification failed:', error);
        });
      });
    })();

    return () => { unsubscribe?.(); };
  }, []);

  // Register FCM service worker and get token
  const initializeFCM = useCallback(async () => {
    if (!user || initRef.current) return null;
    initRef.current = true;
    setLoading(true);

    try {
      // Register the Firebase messaging SW
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        console.warn('[FCM] Not supported in this browser');
        return null;
      }

      const token = await getToken(messaging, {
        vapidKey: FCM_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        setFcmToken(token);
        
        // Save FCM token to push_subscriptions with fcm_ prefix endpoint
        const { error } = await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: `fcm_token://${token.slice(0, 40)}`,
          p256dh: token,  // store full token in p256dh field
          auth_key: 'fcm',
        } as any, { onConflict: 'user_id,endpoint' });

        if (error) {
          console.error('[FCM] Token save error:', error);
        } else {
          console.log('[FCM] Token saved successfully');
        }
      }

      return token;
    } catch (err) {
      console.error('[FCM] Init error:', err);
      return null;
    } finally {
      setLoading(false);
      initRef.current = false;
    }
  }, [user]);

  return { fcmToken, loading, initializeFCM };
}
