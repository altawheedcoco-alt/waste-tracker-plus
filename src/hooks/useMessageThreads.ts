import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ThreadReply {
  id: string;
  parent_message_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null };
}

export function useMessageThreads(parentMessageId: string | null) {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['message-threads', parentMessageId],
    queryFn: async () => {
      if (!parentMessageId) return [];
      const { data, error } = await supabase
        .from('message_threads')
        .select('*')
        .eq('parent_message_id', parentMessageId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const senderIds = [...new Set((data || []).map(r => r.sender_id))];
      let profileMap = new Map();
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', senderIds);
        profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      }

      return (data || []).map(r => ({
        ...r,
        sender: profileMap.get(r.sender_id) || { full_name: 'مجهول', avatar_url: null },
      })) as ThreadReply[];
    },
    enabled: !!parentMessageId,
  });

  const sendReply = useCallback(async (content: string, parentTable = 'direct_messages') => {
    if (!user || !parentMessageId) return;
    const { error } = await supabase.from('message_threads').insert({
      parent_message_id: parentMessageId,
      parent_message_table: parentTable,
      sender_id: user.id,
      sender_organization_id: organization?.id,
      content,
      message_type: 'text',
    });
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['message-threads', parentMessageId] });
  }, [user, organization, parentMessageId, queryClient]);

  return { replies, isLoading, sendReply };
}

// Count threads for multiple messages
export function useThreadCounts(messageIds: string[]) {
  return useQuery({
    queryKey: ['thread-counts', messageIds.sort().join(',')],
    queryFn: async () => {
      if (!messageIds.length) return new Map<string, number>();
      const { data } = await supabase
        .from('message_threads')
        .select('parent_message_id')
        .in('parent_message_id', messageIds);
      const counts = new Map<string, number>();
      (data || []).forEach(r => {
        counts.set(r.parent_message_id, (counts.get(r.parent_message_id) || 0) + 1);
      });
      return counts;
    },
    enabled: messageIds.length > 0,
  });
}
