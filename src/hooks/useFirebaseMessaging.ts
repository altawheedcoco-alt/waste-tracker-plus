/**
 * useFirebaseMessaging — FCM integration hook (PRIMARY push channel)
 * Saves FCM tokens to push_subscriptions for server-side sending.
 * Features: auto-retry with exponential backoff for slow networks.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getFirebaseMessaging, getToken, onMessage } from '@/lib/firebase';
import { showSystemNotification } from '@/lib/systemNotifications';

const FCM_VAPID_KEY = 'BG4HSc0wFyjsD2l4tHc5K_QCoWwA_xfc_fJQentkLTWulWkNEqZKt3MMILTyN_PBhsvx2BCTyhrOjo3nac_bfQ0';
const FCM_SERVICE_WORKER_SCOPE = '/firebase-cloud-messaging-push-scope/';
const TOKEN_TIMEOUTS = [20000, 35000, 50000]; // 3 attempts: 20s, 35s, 50s

async function waitForServiceWorkerActivation(registration: ServiceWorkerRegistration) {
  if (registration.active?.state === 'activated') return registration;

  const worker = registration.installing || registration.waiting || registration.active;
  if (!worker) return registration;

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('FCM service worker activation timed out')), 15000);

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

/** Try getToken with increasing timeouts — resilient on slow networks */
async function getTokenWithRetry(
  messaging: any,
  vapidKey: string,
  swReg: ServiceWorkerRegistration,
): Promise<string> {
  let lastError: any = null;

  for (let attempt = 0; attempt < TOKEN_TIMEOUTS.length; attempt++) {
    const timeoutMs = TOKEN_TIMEOUTS[attempt];
    console.log(`[FCM] getToken attempt ${attempt + 1}/${TOKEN_TIMEOUTS.length} (timeout: ${timeoutMs / 1000}s)`);

    try {
      const token = await Promise.race([
        getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg }),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error('timeout')), timeoutMs),
        ),
      ]);

      if (token) return token;
      lastError = new Error('empty-token');
    } catch (err: any) {
      lastError = err;
      const raw = err?.message || '';
      const isRetryable = raw.includes('Failed to fetch') || raw.includes('token-subscribe-failed') || raw === 'timeout';

      if (!isRetryable) {
        // Non-network error — don't retry
        throw err;
      }

      console.warn(`[FCM] Attempt ${attempt + 1} failed (${raw}), ${attempt < TOKEN_TIMEOUTS.length - 1 ? 'retrying...' : 'giving up'}`);

      // Wait before retry with exponential backoff
      if (attempt < TOKEN_TIMEOUTS.length - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
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
    if (initRef.current && fcmToken) return fcmToken;
    initRef.current = true;
    setLoading(true);

    try {
      console.log('[FCM] Starting initialization...');

      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        console.warn('[FCM] Firebase Messaging is not supported in this browser/context');
        return null;
      }

      // Register the Firebase messaging service worker
      let swReg: ServiceWorkerRegistration;
      try {
        const existingReg = await navigator.serviceWorker.getRegistration(FCM_SERVICE_WORKER_SCOPE);
        if (existingReg) {
          swReg = existingReg;
          console.log('[FCM] Using existing SW registration:', swReg.scope);
        } else {
          swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: FCM_SERVICE_WORKER_SCOPE,
          });
          console.log('[FCM] New SW registered:', swReg.scope);
        }
        await waitForServiceWorkerActivation(swReg);
        console.log('[FCM] SW active:', swReg.active?.state);
      } catch (swErr: any) {
        const message = 'تعذر تسجيل خدمة الإشعارات — تأكد من اتصال الإنترنت';
        console.error('[FCM] SW registration failed:', swErr?.message);
        toast.error(message);
        throw new Error(message);
      }

      // Get FCM token with auto-retry
      console.log('[FCM] Requesting token with VAPID key...');
      let token: string;
      try {
        token = await getTokenWithRetry(messaging, FCM_VAPID_KEY, swReg);
      } catch (tokenErr: any) {
        const raw = tokenErr?.message || '';
        const isNetwork = raw.includes('Failed to fetch') || raw.includes('token-subscribe-failed') || raw === 'timeout';
        const message = isNetwork
          ? 'تعذر تفعيل الإشعارات — الشبكة بطيئة جداً، حاول مرة أخرى'
          : 'فشل تفعيل الإشعارات — حاول مرة أخرى لاحقاً';
        console.error('[FCM] getToken failed after all retries:', raw);
        toast.error(message);
        throw new Error(message);
      }

      console.log('[FCM] Token received:', token.slice(0, 20) + '...');
      setFcmToken(token);

      // Ensure auth session is active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[FCM] No active session — cannot save token');
        return token;
      }

      // Cleanup legacy non-FCM subscriptions
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .not('endpoint', 'like', 'fcm_token://%');

      // Save FCM token
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
