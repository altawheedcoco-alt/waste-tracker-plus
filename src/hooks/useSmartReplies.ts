import { useMemo } from 'react';

interface SmartReply {
  id: string;
  text: string;
  icon: string;
  action?: string;
  actionId?: string;
}

interface SmartReplyContext {
  lastMessageType?: string;
  lastMessageContent?: string;
  resourceType?: string;
  resourceData?: any;
  isIncoming?: boolean;
}

export function useSmartReplies(context: SmartReplyContext): SmartReply[] {
  return useMemo(() => {
    const { lastMessageType, lastMessageContent, resourceType, isIncoming } = context;
    if (!isIncoming) return [];

    const replies: SmartReply[] = [];

    // Resource card responses
    if (resourceType === 'invoice' || lastMessageContent?.includes('فاتورة')) {
      replies.push(
        { id: 'approve-inv', text: 'اعتمد الفاتورة', icon: '✅', action: 'approve_invoice' },
        { id: 'reject-inv', text: 'رفض الفاتورة', icon: '❌', action: 'reject_invoice' },
        { id: 'edit-inv', text: 'طلب تعديل', icon: '📝', action: 'request_edit' },
      );
    }

    if (resourceType === 'signing_request' || resourceType === 'sign' || resourceType === 'stamp') {
      replies.push(
        { id: 'sign-now', text: 'وقّع الآن', icon: '✍️', action: 'sign_now' },
        { id: 'sign-later', text: 'لاحقاً', icon: '⏰' },
        { id: 'sign-return', text: 'أعد للمرسل', icon: '↩️', action: 'return_to_sender' },
      );
    }

    if (resourceType === 'shipment' || lastMessageContent?.includes('شحنة')) {
      replies.push(
        { id: 'track', text: 'تتبع الشحنة', icon: '📍', action: 'track_shipment' },
        { id: 'view-bol', text: 'عرض البوليصة', icon: '📄', action: 'view_bol' },
        { id: 'chat-driver', text: 'تواصل مع السائق', icon: '💬', action: 'chat_driver' },
      );
    }

    if (resourceType === 'document' || resourceType === 'doc') {
      replies.push(
        { id: 'view-doc', text: 'معاينة المستند', icon: '👁️', action: 'view_document' },
        { id: 'download-doc', text: 'تحميل', icon: '📥', action: 'download_document' },
        { id: 'sign-doc', text: 'وقّع المستند', icon: '✍️', action: 'sign_document' },
      );
    }

    if (resourceType === 'contract') {
      replies.push(
        { id: 'accept-contract', text: 'قبول العقد', icon: '✅', action: 'accept_contract' },
        { id: 'reject-contract', text: 'رفض العقد', icon: '❌', action: 'reject_contract' },
        { id: 'negotiate', text: 'التفاوض', icon: '🤝', action: 'negotiate' },
      );
    }

    // Generic text message responses
    if (replies.length === 0 && lastMessageType === 'text') {
      const content = (lastMessageContent || '').toLowerCase();
      
      if (content.includes('موافق') || content.includes('تم') || content.includes('ok')) {
        replies.push(
          { id: 'thanks', text: 'شكراً جزيلاً', icon: '🙏' },
          { id: 'great', text: 'ممتاز', icon: '👍' },
        );
      } else if (content.includes('؟') || content.includes('?')) {
        replies.push(
          { id: 'yes', text: 'نعم', icon: '✅' },
          { id: 'no', text: 'لا', icon: '❌' },
          { id: 'checking', text: 'جاري التحقق', icon: '🔍' },
        );
      } else {
        replies.push(
          { id: 'ok', text: 'تم الاستلام', icon: '✅' },
          { id: 'thanks', text: 'شكراً', icon: '🙏' },
          { id: 'noted', text: 'تم الملاحظة', icon: '📝' },
        );
      }
    }

    return replies.slice(0, 4);
  }, [context.lastMessageType, context.lastMessageContent, context.resourceType, context.isIncoming]);
}
