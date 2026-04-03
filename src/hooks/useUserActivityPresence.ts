/**
 * useUserActivityPresence — Tracks individual user activity for smart notification delivery
 * 
 * online: user actively using the platform (mouse/keyboard/touch)
 * away: user idle for 3 minutes
 * offline: set on page unload
 * 
 * When user is "online" → only in-app notifications (no push/whatsapp)
 * When "away" or "offline" → push + whatsapp are sent by DB trigger
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AWAY_TIMEOUT_MS = 3 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const ACTIVITY_THROTTLE_MS = 30_000;
const EVENT_THROTTLE_MS = 5000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

type PresenceStatus = 'online' | 'away' | 'offline';

export function useUserActivityPresence() {
  const { user } = useAuth();
  const statusRef = useRef<PresenceStatus>('offline');
  const awayTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const lastUpdateRef = useRef<number>(0);

  const upsertPresence = useCallback(async (status: PresenceStatus) => {
    if (!user?.id) return;
    const now = Date.now();
    if (status === statusRef.current && now - lastUpdateRef.current < ACTIVITY_THROTTLE_MS) return;

    statusRef.current = status;
    lastUpdateRef.current = now;

    try {
      await (supabase.from('user_presence') as any).upsert({
        user_id: user.id,
        status,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.warn('[Presence] Update failed:', e);
    }
  }, [user?.id]);

  const resetAwayTimer = useCallback(() => {
    if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
    awayTimerRef.current = setTimeout(() => {
      upsertPresence('away');
    }, AWAY_TIMEOUT_MS);
  }, [upsertPresence]);

  const handleActivity = useCallback(() => {
    if (statusRef.current !== 'online') {
      upsertPresence('online');
    }
    resetAwayTimer();
  }, [upsertPresence, resetAwayTimer]);

  useEffect(() => {
    if (!user?.id) return;

    upsertPresence('online');
    resetAwayTimer();

    let lastCall = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastCall < EVENT_THROTTLE_MS) return;
      lastCall = now;
      handleActivity();
    };

    ACTIVITY_EVENTS.forEach(e => document.addEventListener(e, throttledHandler, { passive: true }));

    heartbeatRef.current = setInterval(() => {
      if (statusRef.current === 'online') upsertPresence('online');
    }, HEARTBEAT_INTERVAL_MS);

    const handleUnload = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`;
      const body = JSON.stringify({ status: 'offline', updated_at: new Date().toISOString() });
      try {
        fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch { /* best-effort */ }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        upsertPresence('away');
      } else {
        handleActivity();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach(e => document.removeEventListener(e, throttledHandler));
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      upsertPresence('offline');
    };
  }, [user?.id, upsertPresence, handleActivity, resetAwayTimer]);
}
