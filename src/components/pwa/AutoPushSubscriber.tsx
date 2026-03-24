/**
 * AutoPushSubscriber — يشترك تلقائياً في Web Push عند تسجيل الدخول
 * يعمل في الخلفية بدون واجهة — يطلب الإذن مرة واحدة فقط
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';


export function AutoPushSubscriber() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } = useWebPush();
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Only run in production PWA, when user is logged in
    if (!user || !isSupported) return;
    // Already subscribed or already attempted this session
    if (isSubscribed || attemptedRef.current) return;
    // If permission was previously denied, don't ask again
    if (permission === 'denied') return;

    attemptedRef.current = true;

    // Small delay to not block initial render
    const timer = setTimeout(() => {
      subscribe();
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission, subscribe]);

  return null;
}
