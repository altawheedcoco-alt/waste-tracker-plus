import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook that subscribes to realtime changes for the transporter dashboard
 * and invalidates relevant queries when data changes.
 */
export const useTransporterRealtime = () => {
  const queryClient = useQueryClient();
  const { organization, profile } = useAuth();
  const orgId = organization?.id;
  const profileId = profile?.id;

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel('transporter-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
          filter: `transporter_id=eq.${orgId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transporter-shipments'] });
          queryClient.invalidateQueries({ queryKey: ['transporter-stats'] });
          queryClient.invalidateQueries({ queryKey: ['transporter-kpis'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          ...(profileId ? { filter: `user_id=eq.${profileId}` } : {}),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transporter-notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_location_logs',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transporter-drivers-summary'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, profileId, queryClient]);
};
