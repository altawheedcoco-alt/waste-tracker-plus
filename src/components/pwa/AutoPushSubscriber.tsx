/**
 * AutoPushSubscriber — يحاول إكمال الاشتراك تلقائياً فقط عندما يكون الإذن granted بالفعل
 * لتجنّب إزعاج المستخدم أو طلب إذن بدون تفاعل مباشر.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';

const SESSION_KEY = 'push_auto_attempted';

export function AutoPushSubscriber() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, loading, subscribe } = useWebPush();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!user || !isSupported || isSubscribed || loading) return;
    if (permission !== 'granted') return;
    if (attemptedRef.current || sessionStorage.getItem(SESSION_KEY)) return;

    attemptedRef.current = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    subscribe().catch(() => undefined);
  }, [user, isSupported, isSubscribed, permission, loading, subscribe]);

  return null;
}

