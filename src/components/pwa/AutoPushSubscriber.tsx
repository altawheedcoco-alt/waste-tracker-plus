/**
 * AutoPushSubscriber — يفرض تفعيل الإشعارات إلزامياً على كل مستخدم
 * يطلب الإذن تلقائياً عند كل زيارة حتى يتم التفعيل
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';

export function AutoPushSubscriber() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } = useWebPush();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    if (isSubscribed) return;
    // If denied, we can't ask again (browser restriction) — banner will show instructions
    if (permission === 'denied') return;
    if (attemptedRef.current) return;

    attemptedRef.current = true;

    // Request immediately with minimal delay
    const timer = setTimeout(() => {
      subscribe();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission, subscribe]);

  // Reset attempt flag when user changes (re-login)
  useEffect(() => {
    attemptedRef.current = false;
  }, [user?.id]);

  return null;
}
