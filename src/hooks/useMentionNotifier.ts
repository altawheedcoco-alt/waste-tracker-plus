import { sendBulkDualNotification } from '@/services/unifiedNotifier';
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

    // إرسال مزدوج (داخلي + واتساب) لجميع المذكورين
    const userIds = mentionedIds
      .map(profileId => users.find(u => u.id === profileId)?.user_id)
      .filter(Boolean) as string[];

    if (userIds.length > 0) {
      try {
        await sendBulkDualNotification({
          user_ids: userIds,
          title: `📌 ${senderName} أشار إليك في ${context}`,
          message: displayText.slice(0, 200),
          type: 'mention',
          reference_id: referenceId,
          reference_type: referenceType,
        });
      } catch (err) {
        console.error('Error creating mention notifications:', err);
      }
    }
  }, [profile]);

  return { notify };
}
