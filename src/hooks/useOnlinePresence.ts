import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * حالة الاتصال (متصل الآن / آخر ظهور) عبر Supabase Realtime Presence
 */

interface PresenceState {
  isOnline: boolean;
  lastSeen: string | null;
}

// Global presence channel - shared across components
let globalPresenceChannel: ReturnType<typeof supabase.channel> | null = null;
let presenceListeners = new Set<() => void>();
let presenceData = new Map<string, { online_at: string }>();

export function useOnlinePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    if (!globalPresenceChannel) {
      globalPresenceChannel = supabase.channel('online-presence', {
        config: { presence: { key: user.id } },
      });

      globalPresenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = globalPresenceChannel!.presenceState();
          presenceData.clear();
          Object.entries(state).forEach(([userId, presences]) => {
            const latest = (presences as any[])[0];
            if (latest) presenceData.set(userId, { online_at: latest.online_at });
          });
          presenceListeners.forEach(cb => cb());
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await globalPresenceChannel!.track({
              online_at: new Date().toISOString(),
            });
          }
        });
    }

    return () => {
      // Don't destroy on unmount — keep presence alive
    };
  }, [user]);
}

export function useUserOnlineStatus(userId: string | undefined): PresenceState {
  const [state, setState] = useState<PresenceState>({ isOnline: false, lastSeen: null });

  useEffect(() => {
    if (!userId) return;

    const update = () => {
      const data = presenceData.get(userId);
      setState({
        isOnline: !!data,
        lastSeen: data?.online_at || null,
      });
    };

    update();
    presenceListeners.add(update);
    return () => { presenceListeners.delete(update); };
  }, [userId]);

  return state;
}
