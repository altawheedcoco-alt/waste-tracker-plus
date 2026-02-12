import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MentionableUser, parseMentions, mentionToDisplay } from './useMentionableUsers';
import { useCallback } from 'react';

interface MentionNotifyOptions {
  text: string;
  users: MentionableUser[];
  context: string; // e.g. "شحنة SHP-001"
  referenceId?: string;
  referenceType?: string; // 'shipment' | 'invoice' | 'document'
}

export function useMentionNotifier() {
  const { profile } = useAuth();

  const notify = useCallback(async (options: MentionNotifyOptions) => {
    const { text, users, context, referenceId, referenceType } = options;
    const mentionedIds = parseMentions(text, users);
    if (mentionedIds.length === 0) return;

    const displayText = mentionToDisplay(text);
    const senderName = profile?.full_name || 'مستخدم';

    // 1. Create in-app notifications
    const notifications = mentionedIds.map(profileId => {
      const user = users.find(u => u.id === profileId);
      return {
        user_id: user?.user_id || profileId,
        title: `📌 ${senderName} أشار إليك في ${context}`,
        message: displayText.slice(0, 200),
        type: 'mention',
        reference_id: referenceId || null,
        reference_type: referenceType || null,
      };
    });

    try {
      await supabase.from('notifications').insert(notifications);
    } catch (err) {
      console.error('Error creating mention notifications:', err);
    }

    // 2. Send via SMS/WhatsApp for users who have channels configured
    for (const profileId of mentionedIds) {
      const user = users.find(u => u.id === profileId);
      if (!user?.user_id) continue;

      try {
        // Send via edge function which respects user channel preferences
        await supabase.functions.invoke('send-notification', {
          body: {
            action: 'send',
            userId: user.user_id,
            channel: 'whatsapp',
            message: `📌 ${senderName} أشار إليك في ${context}:\n${displayText.slice(0, 300)}`,
          },
        });
      } catch {
        // Silent fail for external channels
      }
    }
  }, [profile]);

  return { notify };
}
