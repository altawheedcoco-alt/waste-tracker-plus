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
  return null;
}
