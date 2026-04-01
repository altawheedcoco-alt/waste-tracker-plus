import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface StarredMessage {
  id: string;
  message_id: string;
  conversation_id: string;
  message_content: string | null;
  message_type: string | null;
  starred_at: string;
}

export function useStarredMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: starredMessages = [], isLoading } = useQuery({
    queryKey: ['starred-messages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('starred_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('starred_at', { ascending: false });
      if (error) throw error;
      return (data || []) as StarredMessage[];
    },
    enabled: !!user,
  });

  const starredMessageIds = new Set(starredMessages.map(s => s.message_id));

  const toggleStar = useCallback(async (messageId: string, conversationId: string, content?: string, messageType?: string) => {
    if (!user) return;
    const isStarred = starredMessageIds.has(messageId);

    if (isStarred) {
      await supabase
        .from('starred_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('message_id', messageId);
      toast.success('تم إزالة التمييز');
    } else {
      await supabase.from('starred_messages').insert({
        user_id: user.id,
        message_id: messageId,
        conversation_id: conversationId,
        message_content: content || null,
        message_type: messageType || 'text',
      });
      toast.success('⭐ تم تمييز الرسالة');
    }

    queryClient.invalidateQueries({ queryKey: ['starred-messages'] });
  }, [user, starredMessageIds, queryClient]);

  return { starredMessages, starredMessageIds, isLoading, toggleStar };
}
