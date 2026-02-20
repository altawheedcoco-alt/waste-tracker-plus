import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  orgId: string;
  userId: string;
  lastSeen: string;
}

/**
 * Track organization online presence using Supabase Realtime Presence.
 * Returns a Set of currently online organization IDs.
 */
export function usePresence() {
  const { user, organization } = useAuth();
  const [onlineOrgIds, setOnlineOrgIds] = useState<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.id || !organization?.id) return;

    const channel = supabase.channel('org-presence', {
      config: { presence: { key: organization.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const ids = new Set<string>(Object.keys(state));
        setOnlineOrgIds(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            orgId: organization.id,
            userId: user.id,
            lastSeen: new Date().toISOString(),
          } as PresenceState);
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, organization?.id]);

  const isOrgOnline = useCallback(
    (orgId: string) => onlineOrgIds.has(orgId),
    [onlineOrgIds]
  );

  return { onlineOrgIds, isOrgOnline };
}
