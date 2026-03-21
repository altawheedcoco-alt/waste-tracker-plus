import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommHubCounts {
  unreadMessages: number;
  unreadNotes: number;
  pendingSignatures: number;
  activeStories: number;
  broadcastChannels: number;
  pendingRequests: number;
  activeMeetings: number;
  activePolls: number;
}

export const useCommHubCounts = () => {
  const { organization, profile } = useAuth();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ['comm-hub-counts', orgId],
    queryFn: async (): Promise<CommHubCounts> => {
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
      ] = await Promise.all([
        // Unread messages for this org
        supabase
          .from('direct_messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_organization_id', orgId!)
          .eq('is_read', false),

        // Unread notes
        supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('is_read', false),

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

        // Broadcast channels count
        supabase
          .from('broadcast_channels')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('is_active', true),

        // Pending work orders
        supabase
          .from('work_orders')
          .select('id', { count: 'exact', head: true })
          .or(`sender_org_id.eq.${orgId},recipient_org_id.eq.${orgId}`)
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
      ]);

      return {
        unreadMessages: messagesR.count ?? 0,
        unreadNotes: notesR.count ?? 0,
        pendingSignatures: signaturesR.count ?? 0,
        activeStories: storiesR.count ?? 0,
        broadcastChannels: broadcastR.count ?? 0,
        pendingRequests: requestsR.count ?? 0,
        activeMeetings: (meetingsR as any).count ?? 0,
        activePolls: (pollsR as any).count ?? 0,
      };
    },
    enabled: !!orgId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
};
