import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MessageReminder {
  id: string;
  message_id: string | null;
  direct_message_id: string | null;
  reminder_at: string;
  note: string | null;
  is_triggered: boolean;
  created_at: string;
}

export function useMessageReminders() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['message-reminders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('message_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_triggered', false)
        .order('reminder_at', { ascending: true });
      return (data || []) as MessageReminder[];
    },
    enabled: !!user,
  });

  const addReminder = useMutation({
    mutationFn: async (r: {
      message_id?: string;
      direct_message_id?: string;
      room_id?: string;
      partner_organization_id?: string;
      reminder_at: string;
      note?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('message_reminders').insert({
        user_id: user.id,
        ...r,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['message-reminders'] });
      toast.success('تم إضافة التذكير');
    },
    onError: () => toast.error('فشل إضافة التذكير'),
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('message_reminders')
        .update({ is_triggered: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['message-reminders'] }),
  });

  return {
    reminders,
    isLoading,
    addReminder: addReminder.mutate,
    dismiss: dismiss.mutate,
  };
}
