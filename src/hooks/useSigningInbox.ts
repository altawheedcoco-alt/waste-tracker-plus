import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useDocumentSync } from '@/hooks/useDocumentSync';

export interface SigningRequest {
  id: string;
  sender_organization_id: string;
  sender_user_id: string;
  sender_profile_id: string | null;
  recipient_organization_id: string;
  recipient_user_id: string | null;
  recipient_profile_id: string | null;
  document_type: string;
  document_title: string;
  document_description: string | null;
  document_url: string | null;
  document_id: string | null;
  related_shipment_id: string | null;
  message: string | null;
  priority: string;
  requires_stamp: boolean;
  deadline: string | null;
  status: string;
  viewed_at: string | null;
  signed_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  signature_id: string | null;
  signed_document_url: string | null;
  created_at: string;
  updated_at: string;
  // Enriched
  sender_org?: { name: string } | null;
  recipient_org?: { name: string } | null;
  sender_profile?: { full_name: string; email: string } | null;
  recipient_profile?: { full_name: string; email: string } | null;
}

export function useSigningInbox() {
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;
  const { hasActiveSubscription, isExempt } = useSubscriptionStatus();
  const { syncAfterSigning } = useDocumentSync();

  // Realtime subscription
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel('signing-requests-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'signing_requests',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['signing-requests', orgId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orgId, queryClient]);

  const requestsQuery = useQuery({
    queryKey: ['signing-requests', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('signing_requests')
        .select('*')
        .or(`sender_organization_id.eq.${orgId},recipient_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Enrich with org names and profiles
      const requests = data || [];
      const orgIds = [...new Set(requests.flatMap(r => [r.sender_organization_id, r.recipient_organization_id]))];
      const profileIds = [...new Set(requests.map(r => r.sender_profile_id).filter(Boolean))] as string[];

      const [orgsRes, profilesRes] = await Promise.all([
        orgIds.length > 0
          ? supabase.from('organizations').select('id, name').in('id', orgIds)
          : { data: [] },
        profileIds.length > 0
          ? supabase.from('profiles').select('id, full_name, email').in('id', profileIds)
          : { data: [] },
      ]);

      const orgsMap = new Map((orgsRes.data || []).map(o => [o.id, o]));
      const profilesMap = new Map((profilesRes.data || []).map(p => [p.id, p]));

      return requests.map(r => ({
        ...r,
        sender_org: orgsMap.get(r.sender_organization_id) || null,
        recipient_org: orgsMap.get(r.recipient_organization_id) || null,
        sender_profile: r.sender_profile_id ? profilesMap.get(r.sender_profile_id) || null : null,
      })) as SigningRequest[];
    },
    enabled: !!orgId,
  });

  const sendRequest = useMutation({
    mutationFn: async (req: {
      recipient_organization_id: string;
      recipient_user_id?: string;
      document_title: string;
      document_description?: string;
      document_url?: string;
      document_type?: string;
      message?: string;
      priority?: string;
      requires_stamp?: boolean;
      deadline?: string;
      related_shipment_id?: string;
    }) => {
      if (!orgId || !profile) throw new Error('Not authenticated');
      const { error } = await supabase.from('signing_requests').insert({
        sender_organization_id: orgId,
        sender_user_id: profile.user_id,
        sender_profile_id: profile.id,
        recipient_organization_id: req.recipient_organization_id,
        recipient_user_id: req.recipient_user_id || null,
        document_title: req.document_title,
        document_description: req.document_description || null,
        document_url: req.document_url || null,
        document_type: req.document_type || 'general',
        message: req.message || null,
        priority: req.priority || 'normal',
        requires_stamp: req.requires_stamp || false,
        deadline: req.deadline || null,
        related_shipment_id: req.related_shipment_id || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signing-requests', orgId] });
      toast.success('تم إرسال طلب التوقيع بنجاح');
    },
    onError: (err: any) => toast.error(err.message || 'فشل في إرسال الطلب'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, rejection_reason, signedDocumentUrl, signatureId }: { 
      id: string; 
      status: string; 
      rejection_reason?: string;
      signedDocumentUrl?: string;
      signatureId?: string;
    }) => {
      // Block signing action if no active subscription
      if (status === 'signed' && !isExempt && !hasActiveSubscription) {
        throw new Error('يلزم اشتراك نشط للتوقيع على المستندات. يرجى تجديد اشتراكك أولاً.');
      }
      const updates: any = { status };
      if (status === 'viewed') updates.viewed_at = new Date().toISOString();
      if (status === 'signed') {
        updates.signed_at = new Date().toISOString();
        if (signedDocumentUrl) updates.signed_document_url = signedDocumentUrl;
        if (signatureId) updates.signature_id = signatureId;
      }
      if (status === 'rejected') {
        updates.rejected_at = new Date().toISOString();
        updates.rejection_reason = rejection_reason || null;
      }
      const { error } = await supabase.from('signing_requests').update(updates).eq('id', id);
      if (error) throw error;

      // مزامنة المستند بعد التوقيع — تحديث entity_documents
      if (status === 'signed') {
        await syncAfterSigning({
          signingRequestId: id,
          signedDocumentUrl,
          signatureId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signing-requests', orgId] });
    },
  });

  const incoming = (requestsQuery.data || []).filter(r => r.recipient_organization_id === orgId);
  const outgoing = (requestsQuery.data || []).filter(r => r.sender_organization_id === orgId);

  return {
    requests: requestsQuery.data || [],
    incoming,
    outgoing,
    isLoading: requestsQuery.isLoading,
    sendRequest,
    updateStatus,
  };
}
