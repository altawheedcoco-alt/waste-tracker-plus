/**
 * Auto Push Subscribe — FCM-only auto-subscription on login
 * VAPID Web Push is DISABLED — all push goes through Firebase FCM.
 * This file is kept for backward compatibility but now delegates to FCM flow.
 */

/**
 * Called automatically after SIGNED_IN event.
 * Now a no-op — FCM subscription is handled by AutoPushSubscriber component
 * which uses useWebPush → useFirebaseMessaging flow.
 */
export async function autoPushSubscribe(_userId: string): Promise<void> {
  // No-op: FCM subscription is handled by AutoPushSubscriber component
  // Do NOT register browser PushManager subscriptions (VAPID) — they conflict with FCM
  return;
}
