import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlatformCounts {
  unreadMessages: number;
  unreadNotes: number;
  pendingSignatures: number;
  activeStories: number;
  broadcastChannels: number;
  pendingRequests: number;
  activeMeetings: number;
  activePolls: number;
  unreadNotifications: number;
  activeShipments: number;
  pendingShipments: number;
  totalDrivers: number;
  availableDrivers: number;
  activeContracts: number;
  activePartners: number;
  pendingApprovals: number;
  activeVehicles: number;
  pendingReceipts: number;
}

export const usePlatformCounts = () => {
  const { organization, user } = useAuth();
  const orgId = organization?.id;
  const userId = user?.id;

  return useQuery({
    queryKey: ['platform-counts', orgId],
    queryFn: async (): Promise<PlatformCounts> => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [
        messagesR,
        notesR,
        signaturesR,
        storiesR,
        broadcastR,
        requestsR,
        meetingsR,
        pollsR,
        notificationsR,
        activeShipmentsR,
        pendingShipmentsR,
        driversR,
        contractsR,
        partnersR,
        approvalsR,
        vehiclesR,
        receiptsR,
      ] = await Promise.all([
        // Unread messages
        (supabase as any)
          .from('direct_messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_organization_id', orgId!)
          .eq('is_read', false),

        // Unresolved notes
        (supabase as any)
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('is_resolved', false),

        // Pending signatures
        supabase
          .from('signing_chain_steps')
          .select('id', { count: 'exact', head: true })
          .eq('signer_org_id', orgId!)
          .eq('status', 'pending'),

        // Active stories (last 24h)
        supabase
          .from('stories')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .gte('created_at', yesterday),

        // Broadcast channels
        supabase
          .from('broadcast_channels')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('is_active', true),

        // Pending work orders
        supabase
          .from('work_orders')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('status', 'pending'),

        // Upcoming meetings
        supabase
          .from('meetings' as any)
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('status', 'scheduled')
          .gte('scheduled_at', now.toISOString()),

        // Active polls
        supabase
          .from('polls' as any)
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('is_active', true),

        // Unread notifications
        userId
          ? (supabase as any)
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId)
              .eq('is_read', false)
          : Promise.resolve({ count: 0 }),

        // Active shipments (in_transit, collecting, approved)
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('transporter_id', orgId!)
          .in('status', ['in_transit', 'approved', 'collecting'] as any),

        // Pending shipments (new)
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('transporter_id', orgId!)
          .in('status', ['new'] as any),

        // Drivers
        supabase
          .from('drivers')
          .select('id, is_available')
          .eq('organization_id', orgId!),

        // Active contracts (active + signed)
        supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .in('status', ['active', 'signed'] as any),

        // Active partners
        supabase
          .from('external_partners')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!),

        // Pending approvals
        (supabase as any)
          .from('approval_requests')
          .select('id', { count: 'exact', head: true })
          .eq('requester_organization_id', orgId!)
          .eq('status', 'pending'),

        // Active vehicles
        supabase
          .from('fleet_vehicles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('status', 'active'),

        // Pending receipts
        supabase
          .from('shipment_receipts')
          .select('id', { count: 'exact', head: true })
          .eq('transporter_id', orgId!)
          .eq('status', 'pending'),
      ]);

      const driversData = driversR.data || [];

      return {
        unreadMessages: messagesR.count ?? 0,
        unreadNotes: notesR.count ?? 0,
        pendingSignatures: signaturesR.count ?? 0,
        activeStories: storiesR.count ?? 0,
        broadcastChannels: broadcastR.count ?? 0,
        pendingRequests: requestsR.count ?? 0,
        activeMeetings: (meetingsR as any).count ?? 0,
        activePolls: (pollsR as any).count ?? 0,
        unreadNotifications: notificationsR.count ?? 0,
        activeShipments: activeShipmentsR.count ?? 0,
        pendingShipments: pendingShipmentsR.count ?? 0,
        totalDrivers: driversData.length,
        availableDrivers: driversData.filter((d: any) => d.is_available).length,
        activeContracts: contractsR.count ?? 0,
        activePartners: partnersR.count ?? 0,
        pendingApprovals: approvalsR.count ?? 0,
        activeVehicles: vehiclesR.count ?? 0,
        pendingReceipts: receiptsR.count ?? 0,
      };
    },
    enabled: !!orgId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};
