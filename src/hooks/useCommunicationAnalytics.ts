import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommAnalytics {
  partner_org_id: string;
  partner_name: string;
  messages_sent: number;
  messages_received: number;
  total_messages: number;
  avg_response_minutes: number | null;
  documents_shared: number;
  last_activity: string | null;
}

export interface CommSummary {
  total_conversations: number;
  total_messages: number;
  avg_response_time: number | null;
  most_active_partner: string | null;
  pending_signatures: number;
  unread_messages: number;
}

export function useCommunicationAnalytics() {
  const { user, organization } = useAuth();

  const { data: analytics = [], isLoading: analyticsLoading } = useQuery({
    queryKey: ['comm-analytics', organization?.id],
    queryFn: async () => {
      if (!organization) return [];

      // Get direct messages stats per partner
      const { data: sentMsgs } = await supabase
        .from('direct_messages')
        .select('receiver_organization_id, created_at')
        .eq('sender_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);

      const { data: receivedMsgs } = await supabase
        .from('direct_messages')
        .select('sender_organization_id, created_at')
        .eq('receiver_organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(500);

      // Aggregate per partner
      const partnerStats = new Map<string, { sent: number; received: number; lastActivity: string | null }>();

      (sentMsgs || []).forEach(m => {
        const pid = m.receiver_organization_id;
        if (!pid) return;
        const s = partnerStats.get(pid) || { sent: 0, received: 0, lastActivity: null };
        s.sent++;
        if (!s.lastActivity || m.created_at > s.lastActivity) s.lastActivity = m.created_at;
        partnerStats.set(pid, s);
      });

      (receivedMsgs || []).forEach(m => {
        const pid = m.sender_organization_id;
        if (!pid) return;
        const s = partnerStats.get(pid) || { sent: 0, received: 0, lastActivity: null };
        s.received++;
        if (!s.lastActivity || m.created_at > s.lastActivity) s.lastActivity = m.created_at;
        partnerStats.set(pid, s);
      });

      // Get partner names
      const partnerIds = [...partnerStats.keys()];
      if (partnerIds.length === 0) return [];

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', partnerIds);

      const orgMap = new Map((orgs || []).map(o => [o.id, o.name]));

      return partnerIds.map(pid => {
        const s = partnerStats.get(pid)!;
        return {
          partner_org_id: pid,
          partner_name: orgMap.get(pid) || 'جهة غير معروفة',
          messages_sent: s.sent,
          messages_received: s.received,
          total_messages: s.sent + s.received,
          avg_response_minutes: null,
          documents_shared: 0,
          last_activity: s.lastActivity,
        } as CommAnalytics;
      }).sort((a, b) => b.total_messages - a.total_messages);
    },
    enabled: !!organization,
  });

  const { data: summary } = useQuery({
    queryKey: ['comm-summary', organization?.id],
    queryFn: async (): Promise<CommSummary> => {
      if (!organization) return { total_conversations: 0, total_messages: 0, avg_response_time: null, most_active_partner: null, pending_signatures: 0, unread_messages: 0 };

      const { count: unreadCount } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_organization_id', organization.id)
        .eq('is_read', false);

      const { count: pendingSigs } = await supabase
        .from('signing_chain_steps')
        .select('*', { count: 'exact', head: true })
        .eq('signer_org_id', organization.id)
        .eq('status', 'pending');

      const topPartner = analytics.length > 0 ? analytics[0].partner_name : null;

      return {
        total_conversations: analytics.length,
        total_messages: analytics.reduce((sum, a) => sum + a.total_messages, 0),
        avg_response_time: null,
        most_active_partner: topPartner,
        pending_signatures: pendingSigs || 0,
        unread_messages: unreadCount || 0,
      };
    },
    enabled: !!organization && analytics.length >= 0,
  });

  return { analytics, analyticsLoading, summary };
}
