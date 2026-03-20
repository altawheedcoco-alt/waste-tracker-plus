import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  channel_type: string;
  organization_id: string;
  partner_organization_id?: string;
  created_by: string;
  avatar_url?: string;
  is_archived: boolean;
  created_at: string;
  member_count?: number;
  last_message?: string;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  is_pinned: boolean;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null; organization_name?: string };
}

export function useChatChannels() {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['chat-channels', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberships } = await supabase
        .from('chat_channel_members')
        .select('channel_id')
        .eq('user_id', user.id);
      if (!memberships?.length) return [];

      const channelIds = memberships.map(m => m.channel_id);
      const { data, error } = await supabase
        .from('chat_channels')
        .select('*')
        .in('id', channelIds)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ChatChannel[];
    },
    enabled: !!user,
  });

  const createChannel = useMutation({
    mutationFn: async ({ name, description, channelType, memberIds }: {
      name: string; description?: string; channelType: string; memberIds: string[];
    }) => {
      if (!user || !organization) throw new Error('Not authenticated');
      const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert({ name, description, channel_type: channelType, organization_id: organization.id, created_by: user.id })
        .select().single();
      if (error) throw error;

      // Add creator
      await supabase.from('chat_channel_members').insert({
        channel_id: channel.id, user_id: user.id, organization_id: organization.id, role: 'admin',
      });
      // Add members
      for (const mid of memberIds) {
        await supabase.from('chat_channel_members').insert({
          channel_id: channel.id, user_id: mid, role: 'member',
        });
      }
      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
      toast.success('تم إنشاء القناة بنجاح');
    },
  });

  const fetchChannelMessages = useCallback(async (channelId: string): Promise<ChannelMessage[]> => {
    const { data, error } = await supabase
      .from('chat_channel_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;

    const senderIds = [...new Set((data || []).map(m => m.sender_id))];
    let profileMap = new Map();
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);
      profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    }
    return (data || []).map(m => ({ ...m, sender: profileMap.get(m.sender_id) })) as ChannelMessage[];
  }, []);

  const sendChannelMessage = useCallback(async (channelId: string, content: string) => {
    if (!user || !organization) return;
    await supabase.from('chat_channel_messages').insert({
      channel_id: channelId, sender_id: user.id, sender_organization_id: organization.id, content,
    });
  }, [user, organization]);

  return {
    channels, isLoading,
    createChannel: createChannel.mutate,
    isCreating: createChannel.isPending,
    fetchChannelMessages, sendChannelMessage,
  };
}
