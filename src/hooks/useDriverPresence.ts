import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Viewer {
  id: string;
  name: string;
  organization?: string;
  joinedAt: Date;
}

interface UseDriverPresenceOptions {
  driverId: string;
  mode: 'driver' | 'viewer';
  viewerName?: string;
  viewerOrganization?: string;
}

export const useDriverPresence = ({
  driverId,
  mode,
  viewerName,
  viewerOrganization,
}: UseDriverPresenceOptions) => {
  const { profile } = useAuth();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [isBeingTracked, setIsBeingTracked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const channelName = `driver-tracking:${driverId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: profile?.id || 'anonymous',
        },
      },
    });

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const activeViewers: Viewer[] = [];

      Object.entries(presenceState).forEach(([key, presences]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const presence = presences[0] as any;
          // Don't show the driver themselves as a viewer
          if (presence.mode !== 'driver') {
            activeViewers.push({
              id: key,
              name: presence.name || 'مستخدم',
              organization: presence.organization,
              joinedAt: new Date(presence.joinedAt || Date.now()),
            });
          }
        }
      });

      setViewers(activeViewers);
      setIsBeingTracked(activeViewers.length > 0);
    });

    // Handle new viewer joining
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Viewer joined:', key, newPresences);
    });

    // Handle viewer leaving
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Viewer left:', key, leftPresences);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // Track this user's presence
        await channel.track({
          mode,
          name: mode === 'viewer' ? viewerName : profile?.full_name,
          organization: mode === 'viewer' ? viewerOrganization : undefined,
          joinedAt: new Date().toISOString(),
          userId: profile?.id,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [driverId, mode, viewerName, viewerOrganization, profile?.id, profile?.full_name]);

  return {
    viewers,
    isBeingTracked,
    isConnected,
    viewerCount: viewers.length,
  };
};

// Hook specifically for drivers to check if they're being tracked
export const useDriverTrackingStatus = (driverId: string) => {
  return useDriverPresence({
    driverId,
    mode: 'driver',
  });
};

// Hook for viewers to announce their presence when viewing a driver
export const useViewerPresence = (
  driverId: string,
  viewerName: string,
  viewerOrganization?: string
) => {
  return useDriverPresence({
    driverId,
    mode: 'viewer',
    viewerName,
    viewerOrganization,
  });
};
