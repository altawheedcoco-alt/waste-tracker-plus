/**
 * AutoPushSubscriber — يفرض تفعيل الإشعارات إلزامياً على كل مستخدم
 * يطلب الإذن تلقائياً فقط داخل التطبيق المثبّت لتجنب تعليق بعض متصفحات أندرويد
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWebPush } from '@/hooks/useWebPush';

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

export function AutoPushSubscriber() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } = useWebPush();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!user || !isSupported) return;
    if (!isStandaloneMode()) return;
    if (isSubscribed) return;
    if (permission === 'denied') return;
    if (attemptedRef.current) return;

    attemptedRef.current = true;

    const timer = setTimeout(() => {
      void subscribe();
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission, subscribe]);

  useEffect(() => {
    attemptedRef.current = false;
  }, [user?.id]);

  return null;
}
