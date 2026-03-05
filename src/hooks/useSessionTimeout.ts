/**
 * useSessionTimeout — Auto-logout after idle period for security
 * 
 * يقوم بتسجيل خروج المستخدم تلقائياً بعد فترة خمول محددة
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warn 2 minutes before

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;

export function useSessionTimeout() {
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWarningShownRef = useRef(false);

  const handleLogout = useCallback(async () => {
    toast.error('تم تسجيل الخروج تلقائياً بسبب عدم النشاط', {
      duration: 5000,
    });
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  const showWarning = useCallback(() => {
    if (isWarningShownRef.current) return;
    isWarningShownRef.current = true;
    toast.warning('سيتم تسجيل خروجك خلال دقيقتين بسبب عدم النشاط', {
      duration: WARNING_BEFORE_MS,
      id: 'session-warning',
    });
  }, []);

  const resetTimers = useCallback(() => {
    isWarningShownRef.current = false;
    
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    warningTimerRef.current = setTimeout(showWarning, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
    idleTimerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [handleLogout, showWarning]);

  useEffect(() => {
    // Throttle activity detection
    let lastActivity = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastActivity > 10000) { // Only reset every 10 seconds
        lastActivity = now;
        resetTimers();
      }
    };

    resetTimers();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, throttledReset, { passive: true });
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, throttledReset);
      }
    };
  }, [resetTimers]);
}
