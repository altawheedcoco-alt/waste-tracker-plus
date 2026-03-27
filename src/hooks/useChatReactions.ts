import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  reacted: boolean; // current user reacted
}

export function useChatReactions(messageIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactionsMap = {} } = useQuery({
    queryKey: ['message-reactions', messageIds.join(',')],
    queryFn: async () => {
      if (!messageIds.length) return {};

      const { data } = await supabase
        .from('message_reactions')
        .select('*')
        .in('message_id', messageIds);

      const map: Record<string, MessageReaction[]> = {};
      
      for (const r of data || []) {
        if (!map[r.message_id]) map[r.message_id] = [];
        const existing = map[r.message_id].find(x => x.emoji === r.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(r.user_id);
          if (r.user_id === user?.id) existing.reacted = true;
        } else {
          map[r.message_id].push({
            emoji: r.emoji,
            count: 1,
            users: [r.user_id],
            reacted: r.user_id === user?.id,
          });
        }
      }

      return map;
    },
    enabled: !!user && messageIds.length > 0,
    staleTime: 10000,
  });

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const existing = reactionsMap[messageId]?.find(r => r.emoji === emoji && r.reacted);

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('message_reactions')
        .insert({ message_id: messageId, user_id: user.id, emoji });
    }

    queryClient.invalidateQueries({ queryKey: ['message-reactions'] });

    // Fire reaction_added notification (only for adding, not removing)
    if (!existing) {
      try {
        import('@/services/notificationTriggers').then(({ notifyChatEvent }) => {
          notifyChatEvent({
            type: 'reaction_added',
            actorName: emoji,
            actorUserId: user.id,
            targetUserIds: [], // Will be handled by DB trigger
            messagePreview: emoji,
          });
        });
      } catch {}
    }
  }, [user, reactionsMap, queryClient]);

  return { reactionsMap, toggleReaction };
}
