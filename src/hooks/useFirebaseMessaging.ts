/**
 * useFirebaseMessaging — FCM integration hook (PRIMARY push channel)
 * Saves FCM tokens to push_subscriptions for server-side sending.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getFirebaseMessaging, getToken, onMessage } from '@/lib/firebase';
import { showSystemNotification } from '@/lib/systemNotifications';

const FCM_VAPID_KEY = 'BG4HSc0wFyjsD2l4tHc5K_QCoWwA_xfc_fJQentkLTWulWkNEqZKt3MMILTyN_PBhsvx2BCTyhrOjo3nac_bfQ0';
const FCM_SERVICE_WORKER_SCOPE = '/firebase-cloud-messaging-push-scope/';

async function waitForServiceWorkerActivation(registration: ServiceWorkerRegistration) {
  if (registration.active?.state === 'activated') return registration;

  const worker = registration.installing || registration.waiting || registration.active;
  if (!worker) return registration;

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('FCM service worker activation timed out')), 10000);

    const handleStateChange = () => {
      if (worker.state === 'activated') {
        window.clearTimeout(timeout);
        worker.removeEventListener('statechange', handleStateChange);
        resolve();
      }
    };

    if (worker.state === 'activated') {
      window.clearTimeout(timeout);
      resolve();
      return;
    }

    worker.addEventListener('statechange', handleStateChange);
  });

  return registration;
}

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
  const initializeFCM = useCallback(async (): Promise<string | null> => {
    if (!user) {
      console.warn('[FCM] No user — skipping init');
      return null;
    }
    if (!('serviceWorker' in navigator)) {
      console.warn('[FCM] Service workers are not available in this browser');
      return null;
    }
    // Allow re-init if previous attempt failed (no token saved)
    if (initRef.current && fcmToken) return fcmToken;
    initRef.current = true;
    setLoading(true);

    try {
      console.log('[FCM] Starting initialization...');

      // 1. Verify browser/engine support before touching the service worker
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        console.warn('[FCM] Firebase Messaging is not supported in this browser/context');
        return null;
      }

      // 2. Register the Firebase messaging service worker
      let swReg: ServiceWorkerRegistration;
      try {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: FCM_SERVICE_WORKER_SCOPE,
        });
        await waitForServiceWorkerActivation(swReg);
        console.log('[FCM] Service worker registered:', swReg.scope);
      } catch (swErr) {
        console.error('[FCM] SW registration failed:', swErr);
        return null;
      }

      // 3. Get FCM token
      console.log('[FCM] Requesting token...');
      const token = await getToken(messaging, {
        vapidKey: FCM_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (!token) {
        console.error('[FCM] No token returned');
        return null;
      }

      console.log('[FCM] Token received:', token.slice(0, 20) + '...');
      setFcmToken(token);

      // 4. Ensure auth session is active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[FCM] No active session — cannot save token');
        return token;
      }

      const { error: cleanupError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .not('endpoint', 'like', 'fcm_token://%');

      if (cleanupError) {
        console.warn('[FCM] Legacy subscription cleanup failed:', cleanupError.message);
      }

      // 5. Save FCM token to push_subscriptions with fcm_ prefix
      const endpoint = `fcm_token://${token.slice(0, 40)}`;
      const payload = {
        user_id: user.id,
        endpoint,
        p256dh: token,
        auth_key: 'fcm',
      };

      let saved = false;
      for (let i = 0; i < 3; i++) {
        const { error } = await supabase.from('push_subscriptions').upsert(
          payload as any, { onConflict: 'user_id,endpoint' }
        );
        if (!error) {
          saved = true;
          console.log('[FCM] Token saved successfully to DB');
          break;
        }
        console.error(`[FCM] Token save attempt ${i + 1} failed:`, error.message);
        if (i < 2) await new Promise(r => setTimeout(r, 1000));
      }

      if (!saved) {
        console.error('[FCM] Failed to save token after 3 attempts');
      }

      return token;
    } catch (err) {
      console.error('[FCM] Init error:', err);
      initRef.current = false;
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fcmToken]);

  return { fcmToken, loading, initializeFCM };
}
