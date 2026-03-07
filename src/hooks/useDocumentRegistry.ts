import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DocRegistryEntry {
  id: string;
  document_number: string;
  title: string;
  category: string;
  sub_category?: string;
  status: string;
  organization_id: string;
  created_by?: string;
  source_type?: string;
  source_id?: string;
  file_url?: string;
  file_type?: string;
  party_organization_ids: string[];
  metadata: any;
  tags: string[];
  expires_at?: string;
  total_signatures_required: number;
  total_signatures_completed: number;
  issued_at: string;
  created_at: string;
}

export interface DocRegistrySigner {
  id: string;
  document_id: string;
  signer_user_id?: string;
  signer_organization_id?: string;
  signer_role?: string;
  signer_name?: string;
  action_type: string;
  status: string;
  signature_record_id?: string;
  signed_at?: string;
  sign_order: number;
  rejection_reason?: string;
  notification_sent: boolean;
  whatsapp_sent: boolean;
  created_at: string;
}

const DOC_CATEGORIES = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  receipt: 'إيصال',
  certificate: 'شهادة',
  declaration: 'إقرار',
  contract: 'عقد',
  permit: 'ترخيص',
  report: 'تقرير',
  attestation: 'إفادة',
  compliance: 'امتثال',
  financial: 'مالي',
  operational: 'تشغيلي',
  other: 'أخرى',
};

const DOC_STATUSES = {
  draft: 'مسودة',
  pending_signatures: 'بانتظار التوقيعات',
  partially_signed: 'موقّع جزئياً',
  fully_signed: 'مكتمل التوقيع',
  archived: 'مؤرشف',
  expired: 'منتهي',
  revoked: 'ملغي',
};

export const DOC_CATEGORY_LABELS = DOC_CATEGORIES;
export const DOC_STATUS_LABELS = DOC_STATUSES;

export const useDocumentRegistry = (filters?: {
  category?: string;
  status?: string;
  search?: string;
}) => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['document-registry', organization?.id, filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('document_registry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DocRegistryEntry[];
    },
    enabled: !!organization?.id,
  });

  const registerDocument = useMutation({
    mutationFn: async (doc: Partial<DocRegistryEntry>) => {
      const { data, error } = await (supabase as any)
        .from('document_registry')
        .insert({ ...doc, organization_id: organization?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-registry'] });
      toast.success('تم تسجيل المستند');
    },
  });

  // Stats
  const stats = {
    total: documents.length,
    draft: documents.filter(d => d.status === 'draft').length,
    pending: documents.filter(d => d.status === 'pending_signatures').length,
    partial: documents.filter(d => d.status === 'partially_signed').length,
    completed: documents.filter(d => d.status === 'fully_signed').length,
    archived: documents.filter(d => d.status === 'archived').length,
  };

  return { documents, isLoading, registerDocument, stats };
};

export const useDocumentSigners = (documentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: signers = [], isLoading } = useQuery({
    queryKey: ['doc-registry-signers', documentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('doc_registry_signers')
        .select('*')
        .eq('document_id', documentId)
        .order('sign_order');
      if (error) throw error;
      return (data || []) as DocRegistrySigner[];
    },
    enabled: !!documentId,
  });

  const addSigner = useMutation({
    mutationFn: async (signer: Partial<DocRegistrySigner>) => {
      const { error } = await (supabase as any)
        .from('doc_registry_signers')
        .insert({ ...signer, document_id: documentId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-registry-signers', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-registry'] });
    },
  });

  const completeSigning = useMutation({
    mutationFn: async ({ signerId, signatureRecordId }: { signerId: string; signatureRecordId?: string }) => {
      const { error } = await (supabase as any)
        .from('doc_registry_signers')
        .update({
          status: 'completed',
          signed_at: new Date().toISOString(),
          signature_record_id: signatureRecordId || null,
        })
        .eq('id', signerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-registry-signers', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-registry'] });
      toast.success('تم التوقيع بنجاح');
    },
  });

  const rejectSigning = useMutation({
    mutationFn: async ({ signerId, reason }: { signerId: string; reason: string }) => {
      const { error } = await (supabase as any)
        .from('doc_registry_signers')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', signerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc-registry-signers', documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-registry'] });
      toast.error('تم رفض التوقيع');
    },
  });

  // Pending for current user
  const myPendingSignatures = signers.filter(
    s => s.signer_user_id === user?.id && s.status === 'pending'
  );

  return { signers, isLoading, addSigner, completeSigning, rejectSigning, myPendingSignatures };
};

// Hook for getting all pending signatures across all documents
export const useMyPendingSignatures = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-pending-signatures', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('doc_registry_signers')
        .select('*, document:document_id(id, title, document_number, category, status, organization_id, file_url)')
        .eq('signer_user_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });
};
