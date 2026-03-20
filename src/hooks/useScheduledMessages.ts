import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ScheduledMessage {
  id: string;
  content: string;
  scheduled_at: string;
  status: string;
  receiver_organization_id: string | null;
  room_id: string | null;
  message_type: string;
  created_at: string;
}

export function useScheduledMessages() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['scheduled-messages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from('scheduled_messages')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true });
      return (data || []) as ScheduledMessage[];
    },
    enabled: !!user,
  });

  const schedule = useMutation({
    mutationFn: async (msg: {
      content: string;
      scheduled_at: string;
      receiver_organization_id?: string;
      room_id?: string;
      message_type?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const profile = await supabase.from('profiles').select('organization_id').eq('user_id', user.id).single();
      
      const { error } = await (supabase as any).from('scheduled_messages').insert({
        sender_id: user.id,
        sender_organization_id: profile.data?.organization_id,
        ...msg,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-messages'] });
      toast.success('تم جدولة الرسالة بنجاح');
    },
    onError: () => toast.error('فشل جدولة الرسالة'),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('scheduled_messages')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-messages'] });
      toast.success('تم إلغاء الرسالة المجدولة');
    },
  });

  return {
    messages,
    isLoading,
    schedule: schedule.mutate,
    isScheduling: schedule.isPending,
    cancel: cancel.mutate,
  };
}
