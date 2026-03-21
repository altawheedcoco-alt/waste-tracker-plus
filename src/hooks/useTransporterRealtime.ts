import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
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

    const invalidateCommHub = () => {
      queryClient.invalidateQueries({ queryKey: ['comm-hub-counts'] });
    };

    const invalidateCommandCenter = () => {
      queryClient.invalidateQueries({ queryKey: ['transporter-command-center-v4'] });
    };

    const channel = supabase
      .channel(getTabChannelName('transporter-dashboard-realtime'))
      // Shipments
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `transporter_id=eq.${orgId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['transporter-shipments'] });
        queryClient.invalidateQueries({ queryKey: ['transporter-stats'] });
        queryClient.invalidateQueries({ queryKey: ['transporter-kpis'] });
        invalidateCommandCenter();
      })
      // Notifications
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', ...(profileId ? { filter: `user_id=eq.${profileId}` } : {}) }, () => {
        queryClient.invalidateQueries({ queryKey: ['transporter-notifications'] });
      })
      // Driver locations
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_location_logs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['transporter-drivers-summary'] });
      })
      // Direct messages → comm hub
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages', filter: `receiver_organization_id=eq.${orgId}` }, invalidateCommHub)
      // Signing chain → comm hub
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signing_chain_steps', filter: `signer_org_id=eq.${orgId}` }, invalidateCommHub)
      // Work orders → comm hub + requests
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, () => {
        invalidateCommHub();
        queryClient.invalidateQueries({ queryKey: ['transporter-incoming-requests'] });
      })
      // Notes → comm hub
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `organization_id=eq.${orgId}` }, invalidateCommHub)
      // Stories → comm hub
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories', filter: `organization_id=eq.${orgId}` }, invalidateCommHub)
      // Invoices → command center
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `organization_id=eq.${orgId}` }, invalidateCommandCenter)
      // Fleet vehicles → command center
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles', filter: `organization_id=eq.${orgId}` }, invalidateCommandCenter)
      // Contracts → command center
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts', filter: `organization_id=eq.${orgId}` }, invalidateCommandCenter)
      // Organization members → command center
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_members', filter: `organization_id=eq.${orgId}` }, invalidateCommandCenter)
      // Entity documents → command center
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entity_documents', filter: `organization_id=eq.${orgId}` }, invalidateCommandCenter)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, profileId, queryClient]);
};
