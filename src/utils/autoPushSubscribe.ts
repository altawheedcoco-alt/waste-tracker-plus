/**
 * Auto Push Subscribe — تسجيل اشتراك Push تلقائياً عند تسجيل الدخول
 * يعمل بصمت بدون إزعاج المستخدم إذا كان الإذن ممنوحاً مسبقاً
 */
import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BGUbGLdxCbsZR7ZZQNdZAkpusnhxFrYdQcKSh1oBorhVSeJC7GWb2jTLX17YW40gRn7EWJp0wLe4847KtgGXHcs';

let _appServerKey: Uint8Array | null = null;
function getAppServerKey(): Uint8Array {
  if (_appServerKey) return _appServerKey;
  const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
  const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  _appServerKey = Uint8Array.from(rawData, (c) => c.charCodeAt(0));
  return _appServerKey;
}

/**
 * Called automatically after SIGNED_IN event.
 * - If permission already granted → subscribe silently
 * - If permission default → do nothing (banner will handle it)
 * - If permission denied → do nothing
 */
export async function autoPushSubscribe(userId: string): Promise<void> {
  try {
    // Check support
    if (!('PushManager' in window) || !('serviceWorker' in navigator) || !('Notification' in window)) return;

    // Only auto-subscribe if permission was already granted
    if (Notification.permission !== 'granted') return;

    // Check if already subscribed
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe silently since permission is already granted
      try {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: getAppServerKey().buffer as ArrayBuffer,
        });
      } catch {
        return; // Fail silently
      }
    }

    if (!subscription) return;

    // Wait for auth session to be ready
    await new Promise(r => setTimeout(r, 500));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[AutoPush] No session yet, skipping save');
      return;
    }

    // Save to DB (upsert)
    const subJson = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth_key: subJson.keys?.auth || '',
      } as any,
      { onConflict: 'user_id,endpoint' }
    );

    if (error) {
      console.error('[AutoPush] Save error:', error.message, error.code);
    } else {
      console.log('[AutoPush] Subscription saved for user', userId);
    }
  } catch (err) {
    console.warn('[AutoPush] Silent error:', err);
  }
}
