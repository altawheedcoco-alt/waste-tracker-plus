import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';

export interface DocumentTemplate {
  id: string;
  organization_id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  template_type: string;
  content_template: string | null;
  is_sequential: boolean;
  is_mandatory: boolean;
  is_active: boolean;
  auto_attach: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  signatories?: TemplateSignatory[];
}

export interface TemplateSignatory {
  id: string;
  template_id: string;
  signatory_type: string;
  role_title: string;
  role_title_en: string | null;
  position_id: string | null;
  party_type: string | null;
  is_required: boolean;
  sign_order: number;
  created_at: string;
}

export interface ShipmentDocument {
  id: string;
  shipment_id: string;
  template_id: string | null;
  organization_id: string;
  document_name: string;
  status: string;
  is_mandatory: boolean;
  is_sequential: boolean;
  total_signatures_required: number;
  completed_signatures: number;
  completed_at: string | null;
  created_at: string;
  signatures?: ShipmentDocSignature[];
}

export interface ShipmentDocSignature {
  id: string;
  document_id: string;
  signatory_template_id: string | null;
  signer_user_id: string | null;
  signer_name: string;
  signer_title: string;
  signer_national_id: string | null;
  party_type: string | null;
  sign_order: number;
  is_required: boolean;
  status: string;
  signature_image_url: string | null;
  signature_method: string | null;
  signed_at: string | null;
  ip_address: string | null;
  integrity_hash: string | null;
  notes: string | null;
}

export function useDocumentTemplates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const templatesQuery = useQuery({
    queryKey: ['document-templates', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('document_templates' as any)
        .select('*')
        .eq('organization_id', orgId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as DocumentTemplate[];
    },
    enabled: !!orgId,
  });

  const signatoriesQuery = useQuery({
    queryKey: ['document-template-signatories', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const templateIds = (templatesQuery.data || []).map(t => t.id);
      if (templateIds.length === 0) return [];
      const { data, error } = await supabase
        .from('document_template_signatories' as any)
        .select('*')
        .in('template_id', templateIds)
        .order('sign_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as TemplateSignatory[];
    },
    enabled: !!orgId && (templatesQuery.data || []).length > 0,
  });

  // Combine templates with their signatories
  const templates: DocumentTemplate[] = (templatesQuery.data || []).map(t => ({
    ...t,
    signatories: (signatoriesQuery.data || []).filter(s => s.template_id === t.id),
  }));

  const createTemplate = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      is_sequential: boolean;
      is_mandatory: boolean;
      auto_attach: boolean;
      signatories: { role_title: string; signatory_type: string; party_type?: string; is_required: boolean; sign_order: number }[];
    }) => {
      const { data: template, error } = await supabase
        .from('document_templates' as any)
        .insert({
          organization_id: orgId!,
          name: data.name,
          description: data.description || null,
          is_sequential: data.is_sequential,
          is_mandatory: data.is_mandatory,
          auto_attach: data.auto_attach,
          created_by: profile?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Insert signatories
      if (data.signatories.length > 0) {
        const { error: sigError } = await supabase
          .from('document_template_signatories' as any)
          .insert(
            data.signatories.map(s => ({
              template_id: (template as any).id,
              role_title: s.role_title,
              signatory_type: s.signatory_type,
              party_type: s.party_type || null,
              is_required: s.is_required,
              sign_order: s.sign_order,
            })) as any
          );
        if (sigError) throw sigError;
      }
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates', orgId] });
      queryClient.invalidateQueries({ queryKey: ['document-template-signatories', orgId] });
      toast.success('تم إنشاء القالب بنجاح');
    },
    onError: (err: any) => {
      console.error('Error creating template:', err);
      toast.error('حدث خطأ أثناء إنشاء القالب');
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('document_templates' as any)
        .delete()
        .eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates', orgId] });
      toast.success('تم حذف القالب');
    },
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('document_templates' as any)
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates', orgId] });
    },
  });

  return {
    templates,
    isLoading: templatesQuery.isLoading,
    createTemplate,
    deleteTemplate,
    toggleTemplate,
    refetch: () => {
      templatesQuery.refetch();
      signatoriesQuery.refetch();
    },
  };
}

// Hook for shipment-level documents and signatures
export function useShipmentDocuments(shipmentId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const documentsQuery = useQuery({
    queryKey: ['shipment-documents-multi', shipmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_documents' as any)
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ShipmentDocument[];
    },
    enabled: !!shipmentId,
  });

  const signaturesQuery = useQuery({
    queryKey: ['shipment-doc-signatures', shipmentId],
    queryFn: async () => {
      const docIds = (documentsQuery.data || []).map(d => d.id);
      if (docIds.length === 0) return [];
      const { data, error } = await supabase
        .from('shipment_doc_signatures' as any)
        .select('*')
        .in('document_id', docIds)
        .order('sign_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ShipmentDocSignature[];
    },
    enabled: (documentsQuery.data || []).length > 0,
  });

  const documents: ShipmentDocument[] = (documentsQuery.data || []).map(d => ({
    ...d,
    signatures: (signaturesQuery.data || []).filter(s => s.document_id === d.id),
  }));

  // Attach a template to a shipment
  const attachTemplate = useMutation({
    mutationFn: async (template: DocumentTemplate) => {
      // Create shipment document
      const requiredSigs = (template.signatories || []).filter(s => s.is_required).length;
      const totalSigs = (template.signatories || []).length;

      const { data: doc, error } = await supabase
        .from('shipment_documents' as any)
        .insert({
          shipment_id: shipmentId,
          template_id: template.id,
          organization_id: orgId!,
          document_name: template.name,
          is_mandatory: template.is_mandatory,
          is_sequential: template.is_sequential,
          total_signatures_required: totalSigs,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Create signature slots
      if ((template.signatories || []).length > 0) {
        const { error: sigError } = await supabase
          .from('shipment_doc_signatures' as any)
          .insert(
            (template.signatories || []).map(s => ({
              document_id: (doc as any).id,
              signatory_template_id: s.id,
              signer_name: s.role_title,
              signer_title: s.role_title,
              party_type: s.party_type,
              sign_order: s.sign_order,
              is_required: s.is_required,
            })) as any
          );
        if (sigError) throw sigError;
      }
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-documents-multi', shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-doc-signatures', shipmentId] });
      toast.success('تم إرفاق المستند بالشحنة');
    },
  });

  // Sign a specific signature slot
  const signDocument = useMutation({
    mutationFn: async (data: {
      signatureId: string;
      signerName: string;
      signerTitle: string;
      signerNationalId?: string;
      signatureImageUrl?: string;
      signatureMethod: string;
    }) => {
      const { error } = await supabase
        .from('shipment_doc_signatures' as any)
        .update({
          signer_user_id: profile?.id,
          signer_name: data.signerName,
          signer_title: data.signerTitle,
          signer_national_id: data.signerNationalId || null,
          signature_image_url: data.signatureImageUrl || null,
          signature_method: data.signatureMethod,
          status: 'signed',
          signed_at: new Date().toISOString(),
          ip_address: null, // Will be set server-side ideally
          user_agent: navigator.userAgent,
        } as any)
        .eq('id', data.signatureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-documents-multi', shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-doc-signatures', shipmentId] });
      toast.success('تم التوقيع بنجاح');
    },
  });

  const allMandatoryCompleted = documents
    .filter(d => d.is_mandatory)
    .every(d => d.status === 'completed');

  return {
    documents,
    isLoading: documentsQuery.isLoading,
    attachTemplate,
    signDocument,
    allMandatoryCompleted,
    refetch: () => {
      documentsQuery.refetch();
      signaturesQuery.refetch();
    },
  };
}
