import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PinnedMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender?: { full_name: string };
}

export function usePinnedMessages(partnerId?: string) {
  const { user, organization } = useAuth();
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPinned = useCallback(async () => {
    if (!organization?.id || !partnerId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('direct_messages')
        .select('id, content, sender_id, created_at')
        .eq('is_pinned', true)
        .or(`and(sender_organization_id.eq.${organization.id},receiver_organization_id.eq.${partnerId}),and(sender_organization_id.eq.${partnerId},receiver_organization_id.eq.${organization.id})`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', senderIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        setPinnedMessages(data.map(m => ({
          ...m,
          sender: profileMap.get(m.sender_id) as any,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, [organization?.id, partnerId]);

  const togglePin = useCallback(async (messageId: string, currentlyPinned: boolean) => {
    const { error } = await supabase
      .from('direct_messages')
      .update({ is_pinned: !currentlyPinned })
      .eq('id', messageId);

    if (error) {
      toast.error('فشل تحديث التثبيت');
      return;
    }

    toast.success(currentlyPinned ? 'تم إلغاء التثبيت' : 'تم تثبيت الرسالة');
    fetchPinned();

    // Fire pinned_message notification
    if (!currentlyPinned) {
      try {
        import('@/services/notificationTriggers').then(({ notifyChatEvent }) => {
          notifyChatEvent({
            type: 'pinned_message',
            actorName: 'رسالة مثبتة',
            actorUserId: user?.id || '',
            targetUserIds: [],
            messagePreview: 'تم تثبيت رسالة',
          });
        });
      } catch {}
    }
  }, [fetchPinned, user]);

  return { pinnedMessages, loading, fetchPinned, togglePin };
}
