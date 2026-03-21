import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BroadcastChannel {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  is_active: boolean;
  subscriber_count: number;
  avatar_url?: string | null;
  cover_url?: string | null;
  is_verified?: boolean;
  channel_visibility?: string;
  created_at: string;
  is_mine?: boolean;
  is_subscribed?: boolean;
}

export interface BroadcastPost {
  id: string;
  channel_id: string;
  content: string;
  post_type: string;
  file_url: string | null;
  file_name: string | null;
  views_count: number;
  created_at: string;
  sender_name?: string;
}

export function useBroadcastChannels() {
  const { user, organization } = useAuth();
  const qc = useQueryClient();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['broadcast-channels', organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data } = await (supabase as any)
        .from('broadcast_channels')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!data) return [];

      const { data: subs } = await (supabase as any)
        .from('broadcast_channel_subscribers')
        .select('channel_id')
        .eq('user_id', user!.id);

      const subSet = new Set((subs || []).map((s: any) => s.channel_id));

      // Get partner org IDs for partners_only filtering
      const { data: partnerships } = await (supabase as any)
        .from('verified_partnerships')
        .select('organization_id, partner_organization_id')
        .or(`organization_id.eq.${organization.id},partner_organization_id.eq.${organization.id}`)
        .eq('status', 'active');

      const partnerOrgIds = new Set<string>();
      (partnerships || []).forEach((p: any) => {
        if (p.organization_id === organization.id) partnerOrgIds.add(p.partner_organization_id);
        else partnerOrgIds.add(p.organization_id);
      });

      // Filter by visibility
      const filtered = data.filter((ch: any) => {
        const vis = ch.channel_visibility || 'public';
        // Own channel always visible
        if (ch.organization_id === organization.id) return true;
        if (vis === 'public') return true;
        if (vis === 'internal') return true; // all orgs in system can see
        if (vis === 'partners_only') return partnerOrgIds.has(ch.organization_id);
        return true;
      });

      return filtered.map((ch: any) => ({
        ...ch,
        is_mine: ch.organization_id === organization.id,
        is_subscribed: subSet.has(ch.id),
      })) as BroadcastChannel[];
    },
    enabled: !!organization,
  });

  const createChannel = useMutation({
    mutationFn: async ({ name, description, channel_visibility }: { name: string; description?: string; channel_visibility?: string }) => {
      if (!user || !organization) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('broadcast_channels').insert({
        name, description, organization_id: organization.id, created_by: user.id,
        channel_visibility: channel_visibility || 'public',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-channels'] });
      toast.success('تم إنشاء قناة البث');
    },
    onError: () => toast.error('فشل إنشاء القناة'),
  });

  const subscribe = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user || !organization) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('broadcast_channel_subscribers').insert({
        channel_id: channelId, user_id: user.id, organization_id: organization.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-channels'] });
      toast.success('تم الاشتراك في القناة');
    },
  });

  const unsubscribe = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase as any)
        .from('broadcast_channel_subscribers')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-channels'] });
      toast.success('تم إلغاء الاشتراك');
    },
  });

  const post = useMutation({
    mutationFn: async ({ channelId, content, postType, fileUrl, fileName }: {
      channelId: string; content: string; postType?: string; fileUrl?: string; fileName?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('broadcast_posts').insert({
        channel_id: channelId, sender_id: user.id, content,
        post_type: postType || 'text', file_url: fileUrl, file_name: fileName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-posts'] });
      toast.success('تم نشر الرسالة');
    },
  });

  return {
    channels, isLoading,
    createChannel: createChannel.mutate,
    subscribe: subscribe.mutate,
    unsubscribe: unsubscribe.mutate,
    post: post.mutate,
  };
}
