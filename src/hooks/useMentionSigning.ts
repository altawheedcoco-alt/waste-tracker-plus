import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendDualNotification } from '@/services/unifiedNotifier';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { MentionableEntity } from '@/components/ui/mentionable-field';

interface MentionSigningParams {
  entity: MentionableEntity;
  documentTitle: string;
  documentType?: string;
  documentUrl?: string;
  documentId?: string;
  relatedShipmentId?: string;
  message?: string;
  requiresStamp?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
}

/**
 * Hook that creates signing requests when mentioning users/organizations.
 * When a user @mentions someone in a document field, this hook sends them
 * a signing request with a direct link to sign/stamp/view the document.
 */
export function useMentionSigning() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  const sendSigningRequest = useCallback(async ({
    entity,
    documentTitle,
    documentType = 'general',
    documentUrl,
    documentId,
    relatedShipmentId,
    message,
    requiresStamp = false,
    priority = 'normal',
  }: MentionSigningParams) => {
    if (!orgId || !profile) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      // Determine recipient org and user
      let recipientOrgId: string;
      let recipientUserId: string | null = null;
      let recipientProfileId: string | null = null;

      if (entity.type === 'organization') {
        recipientOrgId = entity.id;
      } else {
        // For user mentions, get their organization
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('organization_id, user_id')
          .eq('id', entity.id)
          .single();

        if (!userProfile?.organization_id) {
          toast.error('لم يتم العثور على جهة المستخدم');
          return false;
        }

        recipientOrgId = userProfile.organization_id;
        recipientUserId = userProfile.user_id;
        recipientProfileId = entity.id;
      }

      // Don't send to self
      if (recipientOrgId === orgId && entity.type === 'organization') {
        toast.error('لا يمكن إرسال طلب توقيع لنفس الجهة');
        return false;
      }

      const { error } = await supabase.from('signing_requests').insert({
        sender_organization_id: orgId,
        sender_user_id: profile.user_id,
        sender_profile_id: profile.id,
        recipient_organization_id: recipientOrgId,
        recipient_user_id: recipientUserId,
        recipient_profile_id: recipientProfileId,
        document_title: documentTitle,
        document_description: message || `طلب توقيع/ختم من ${profile.full_name}`,
        document_url: documentUrl || null,
        document_type: documentType,
        document_id: documentId || null,
        related_shipment_id: relatedShipmentId || null,
        message: message || `يرجى مراجعة وتوقيع المستند: ${documentTitle}`,
        priority,
        requires_stamp: requiresStamp,
        status: 'pending',
      });

      if (error) throw error;

      // Send dual notification (in-app + WhatsApp) to the recipient
      if (recipientUserId) {
        await sendDualNotification({
          user_id: recipientUserId,
          title: `📝 طلب توقيع جديد`,
          message: `${profile.full_name} يطلب توقيعك على: ${documentTitle}`,
          type: 'signing_request',
          organization_id: recipientOrgId,
          metadata: {
            sender_name: profile.full_name,
            sender_org_id: orgId,
            document_title: documentTitle,
            document_type: documentType,
            requires_stamp: requiresStamp,
          },
        });
      }

      toast.success(`تم إرسال طلب التوقيع إلى ${entity.name}`, {
        description: requiresStamp ? 'مطلوب ختم + توقيع' : 'مطلوب توقيع',
        action: {
          label: 'عرض الطلبات',
          onClick: () => window.location.href = '/dashboard/signing-inbox',
        },
      });

      return true;
    } catch (err: any) {
      console.error('Mention signing error:', err);
      toast.error('فشل في إرسال طلب التوقيع');
      return false;
    }
  }, [orgId, profile]);

  return { sendSigningRequest };
}
