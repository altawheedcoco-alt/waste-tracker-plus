import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface ChatPoll {
  id: string;
  question: string;
  options: { text: string }[];
  poll_type: string;
  is_anonymous: boolean;
  is_closed: boolean;
  created_by: string;
  created_at: string;
  votes?: Map<number, string[]>;
  total_votes?: number;
}

export function useChatPolls(contextId?: string) {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['chat-polls', contextId],
    queryFn: async () => {
      if (!contextId) return [];
      const { data, error } = await supabase
        .from('chat_polls')
        .select('*')
        .or(`room_id.eq.${contextId},channel_id.eq.${contextId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch votes for each poll
      const pollIds = (data || []).map(p => p.id);
      const { data: votes } = await supabase
        .from('chat_poll_votes')
        .select('*')
        .in('poll_id', pollIds);

      return (data || []).map(p => {
        const pollVotes = (votes || []).filter(v => v.poll_id === p.id);
        const voteMap = new Map<number, string[]>();
        pollVotes.forEach(v => {
          const arr = voteMap.get(v.option_index) || [];
          arr.push(v.user_id);
          voteMap.set(v.option_index, arr);
        });
        return {
          ...p,
          options: (p.options as any) || [],
          votes: voteMap,
          total_votes: pollVotes.length,
        } as ChatPoll;
      });
    },
    enabled: !!contextId,
  });

  const createPoll = useMutation({
    mutationFn: async ({ question, options, roomId, channelId, pollType, isAnonymous }: {
      question: string; options: string[]; roomId?: string; channelId?: string;
      pollType?: string; isAnonymous?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('chat_polls').insert({
        question,
        options: options.map(text => ({ text })),
        room_id: roomId || null,
        channel_id: channelId || null,
        created_by: user.id,
        organization_id: organization?.id,
        poll_type: pollType || 'single',
        is_anonymous: isAnonymous || false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-polls'] });
      toast.success('تم إنشاء التصويت');
    },
  });

  const vote = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      if (!user) throw new Error('Not authenticated');
      // Remove existing vote for single-choice
      await supabase.from('chat_poll_votes').delete()
        .eq('poll_id', pollId).eq('user_id', user.id);
      // Add new vote
      const { error } = await supabase.from('chat_poll_votes').insert({
        poll_id: pollId, user_id: user.id, option_index: optionIndex,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-polls'] });
    },
  });

  const closePoll = useMutation({
    mutationFn: async (pollId: string) => {
      await supabase.from('chat_polls').update({ is_closed: true }).eq('id', pollId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat-polls'] }),
  });

  return {
    polls, isLoading,
    createPoll: createPoll.mutate,
    vote: vote.mutate,
    closePoll: closePoll.mutate,
  };
}
