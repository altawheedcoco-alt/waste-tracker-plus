/**
 * AutoPushSubscriber — يحاول تفعيل الإشعارات تلقائياً مرة واحدة
 * - في وضع PWA standalone: يفعّل فوراً
 * - في المتصفح العادي: يفعّل فقط إذا كان الإذن granted مسبقاً (لا يزعج المستخدم)
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';

const SESSION_KEY = 'push_auto_attempted';

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

export function AutoPushSubscriber() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } = useWebPush();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!user || !isSupported || isSubscribed || attemptedRef.current) return;
    if (permission === 'denied') return;

    // Don't repeat within same session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const canAutoSubscribe = isStandaloneMode() || permission === 'granted';
    if (!canAutoSubscribe) return;

    attemptedRef.current = true;
    sessionStorage.setItem(SESSION_KEY, '1');

    const timer = setTimeout(() => { void subscribe(); }, 1500);
    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission, subscribe]);

  // Reset on user change
  useEffect(() => {
    attemptedRef.current = false;
  }, [user?.id]);

  return null;
}
