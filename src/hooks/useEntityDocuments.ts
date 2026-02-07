import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EntityDocument {
  id: string;
  organization_id: string;
  partner_organization_id?: string;
  external_partner_id?: string;
  document_type: string;
  document_category: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  shipment_id?: string;
  invoice_id?: string;
  deposit_id?: string;
  award_letter_id?: string;
  contract_id?: string;
  document_date?: string;
  reference_number?: string;
  tags?: string[];
  uploaded_by?: string;
  uploaded_by_role?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  uploader?: { full_name: string; avatar_url?: string };
  shipment?: { shipment_number: string };
}

export interface DocumentFilters {
  partnerId?: string;
  externalPartnerId?: string;
  documentType?: string;
  documentCategory?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface UploadDocumentParams {
  file: File;
  partnerId?: string;
  externalPartnerId?: string;
  documentType: string;
  documentCategory: string;
  title: string;
  description?: string;
  documentDate?: string;
  referenceNumber?: string;
  tags?: string[];
  shipmentId?: string;
  invoiceId?: string;
  depositId?: string;
  awardLetterId?: string;
  contractId?: string;
}

export function useEntityDocuments(filters: DocumentFilters = {}) {
  const { organization, user, profile } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['entity-documents', organization?.id, filters];

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('entity_documents')
        .select(`
          *,
          uploader:profiles!entity_documents_uploaded_by_fkey(full_name, avatar_url),
          shipment:shipments(shipment_number)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (filters.partnerId) {
        query = query.eq('partner_organization_id', filters.partnerId);
      }

      if (filters.externalPartnerId) {
        query = query.eq('external_partner_id', filters.externalPartnerId);
      }

      if (filters.documentType) {
        query = query.eq('document_type', filters.documentType);
      }

      if (filters.documentCategory) {
        query = query.eq('document_category', filters.documentCategory);
      }

      if (filters.dateFrom) {
        query = query.gte('document_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('document_date', filters.dateTo);
      }

      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,reference_number.ilike.%${filters.searchQuery}%,file_name.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as EntityDocument[];
    },
    enabled: !!organization?.id,
  });

  const uploadDocument = useMutation({
    mutationFn: async (params: UploadDocumentParams) => {
      if (!organization?.id || !user?.id) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Upload file to storage
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${organization.id}/${params.partnerId || params.externalPartnerId || 'general'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('entity-documents')
        .upload(filePath, params.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('entity-documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('entity_documents')
        .insert({
          organization_id: organization.id,
          partner_organization_id: params.partnerId || null,
          external_partner_id: params.externalPartnerId || null,
          document_type: params.documentType,
          document_category: params.documentCategory,
          title: params.title,
          description: params.description,
          file_url: urlData.publicUrl,
          file_name: params.file.name,
          file_type: params.file.type,
          file_size: params.file.size,
          document_date: params.documentDate,
          reference_number: params.referenceNumber,
          tags: params.tags,
          shipment_id: params.shipmentId,
          invoice_id: params.invoiceId,
          deposit_id: params.depositId,
          award_letter_id: params.awardLetterId,
          contract_id: params.contractId,
          uploaded_by: user.id,
          uploaded_by_role: (profile as any)?.role || 'employee',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
      toast.success('تم رفع المستند بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل رفع المستند: ${error.message}`);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('entity_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
      toast.success('تم حذف المستند');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف المستند: ${error.message}`);
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EntityDocument> }) => {
      const { data, error } = await supabase
        .from('entity_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
      toast.success('تم تحديث المستند');
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث المستند: ${error.message}`);
    },
  });

  return {
    documents: documents || [],
    isLoading,
    error,
    refetch,
    uploadDocument,
    deleteDocument,
    updateDocument,
  };
}

// Hook for timeline view - groups documents by date
export function useEntityTimeline(partnerId?: string, externalPartnerId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['entity-timeline', organization?.id, partnerId, externalPartnerId],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('entity_documents')
        .select(`
          *,
          uploader:profiles!entity_documents_uploaded_by_fkey(full_name, avatar_url),
          shipment:shipments(shipment_number)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (partnerId) {
        query = query.eq('partner_organization_id', partnerId);
      }

      if (externalPartnerId) {
        query = query.eq('external_partner_id', externalPartnerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by month/year for timeline
      const grouped = (data || []).reduce((acc, doc) => {
        const date = new Date(doc.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(doc);
        return acc;
      }, {} as Record<string, EntityDocument[]>);

      return Object.entries(grouped).map(([key, docs]) => ({
        period: key,
        documents: docs as EntityDocument[],
      }));
    },
    enabled: !!organization?.id,
  });
}
