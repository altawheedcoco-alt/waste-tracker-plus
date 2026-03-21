import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getTabChannelName } from '@/lib/tabSession';

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

  // Realtime subscription — تحديث فوري عند أي تغيير
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel(getTabChannelName('entity-docs-realtime'))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entity_documents',
          filter: `organization_id=eq.${organization.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
          queryClient.invalidateQueries({ queryKey: ['entity-timeline'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id, queryClient]);

  const uploadDocument = useMutation({
    mutationFn: async (params: UploadDocumentParams) => {
      if (!organization?.id || !user?.id) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      // Upload file to storage with auto-compression
      const { uploadFile } = await import('@/utils/optimizedUpload');
      const fileExt = params.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${organization.id}/${params.partnerId || params.externalPartnerId || 'general'}/${fileName}`;

      const uploadResult = await uploadFile(params.file, {
        bucket: 'entity-documents',
        path: filePath,
      });

      // Get public URL
      const fileUrl = uploadResult.publicUrl;

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
          file_url: fileUrl,
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
    onSuccess: async (data, params) => {
      queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
      queryClient.invalidateQueries({ queryKey: ['entity-timeline'] });
      toast.success('تم رفع المستند بنجاح');

      // ═══ 1. استخراج إلزامي بالذكاء الاصطناعي ═══
      if (data?.id && organization?.id) {
        try {
          toast.info('🤖 جاري تحليل المستند بالذكاء الاصطناعي...', { id: `ai-extract-${data.id}`, duration: 30000 });
          
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(params.file);
          });

          const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-document', {
            body: {
              imageBase64: base64,
              fileName: params.file.name,
              mimeType: params.file.type,
              context: `نوع المستند: ${params.documentType}, الفئة: ${params.documentCategory}`,
            },
          });

          if (!aiError && aiResult?.success && aiResult.result) {
            const r = aiResult.result;
            const structuredFields: Record<string, any> = {};
            if (r.extracted_data) {
              if (r.extracted_data.reference_number) structuredFields['رقم مرجعي'] = r.extracted_data.reference_number;
              if (r.extracted_data.date) structuredFields['التاريخ'] = r.extracted_data.date;
              if (r.extracted_data.amount) structuredFields['المبلغ'] = r.extracted_data.amount;
              if (r.extracted_data.parties?.length) structuredFields['الأطراف'] = r.extracted_data.parties;
              if (r.extracted_data.weights?.length) structuredFields['الأوزان'] = r.extracted_data.weights;
              if (r.extracted_data.other_fields) Object.assign(structuredFields, r.extracted_data.other_fields);
            }

            // حفظ البيانات المستخرجة في entity_documents
            await supabase.from('entity_documents').update({
              ai_extracted: true,
              ocr_confidence: r.classification?.confidence || 0,
              ocr_extracted_data: {
                structured_fields: structuredFields,
                classification: r.classification,
                summary: r.summary,
                risk_analysis: r.risk_analysis,
                tags: r.tags,
                extracted_data: r.extracted_data,
              } as any,
              tags: [...(params.tags || []), 'ai-extracted', ...(r.tags || [])].filter((v, i, a) => a.indexOf(v) === i),
            }).eq('id', data.id);

            toast.success(`✅ تم تحليل المستند: ${r.classification?.document_type || 'مستند'} (ثقة ${r.classification?.confidence || 0}%)`, { id: `ai-extract-${data.id}` });

            // ═══ 2. تحليل الجهة الشامل التلقائي ═══
            try {
              toast.info('📊 جاري تحليل الجهة الشامل تلقائياً...', { id: `org-analysis-${organization.id}`, duration: 60000 });
              
              const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-organization', {
                body: { organization_id: organization.id },
              });

              if (!analysisError && analysisResult?.success && analysisResult.result) {
                // حفظ التقرير في entity_documents كتقرير تحليلي
                await supabase.from('entity_documents').insert({
                  organization_id: organization.id,
                  document_type: 'report',
                  document_category: 'analysis',
                  title: `تقرير تحليل شامل - ${new Date().toLocaleDateString('ar-EG')}`,
                  file_url: data.file_url, // reference
                  file_name: `analysis-report-${Date.now()}.json`,
                  file_type: 'application/json',
                  file_size: 0,
                  tags: ['ai-analysis', 'auto-generated', 'compliance-report'],
                  ai_extracted: true,
                  ocr_extracted_data: analysisResult.result as any,
                  ocr_confidence: analysisResult.result.compliance_score || 0,
                  uploaded_by: user?.id,
                  uploaded_by_role: 'system',
                });

                const score = analysisResult.result.compliance_score || 0;
                const riskLevel = analysisResult.result.risk_level || 'unknown';
                const riskEmoji = riskLevel === 'low' ? '🟢' : riskLevel === 'medium' ? '🟡' : '🔴';
                
                toast.success(
                  `📊 تقرير الجهة: درجة الامتثال ${score}% ${riskEmoji} مستوى المخاطرة: ${riskLevel}`,
                  { id: `org-analysis-${organization.id}`, duration: 8000 }
                );

                queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
              } else {
                toast.dismiss(`org-analysis-${organization.id}`);
              }
            } catch (analysisErr) {
              console.warn('[EntityDocs] تحليل الجهة فشل (غير مؤثر):', analysisErr);
              toast.dismiss(`org-analysis-${organization.id}`);
            }
          } else {
            console.warn('[EntityDocs] AI extraction failed:', aiError);
            toast.warning('⚠️ لم يتمكن الذكاء الاصطناعي من تحليل المستند', { id: `ai-extract-${data.id}` });
          }
        } catch (aiErr) {
          console.warn('[EntityDocs] AI extraction error (non-blocking):', aiErr);
          toast.dismiss(`ai-extract-${data?.id}`);
        }
      }

      // إشعار الأطراف المرتبطة فورياً
      try {
        const partnerOrgId = params.partnerId;
        if (partnerOrgId) {
          const { data: members } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', partnerOrgId)
            .limit(50);

          if (members && members.length > 0) {
            const orgName = (organization as any)?.name || 'جهة';
            const { sendBulkDualNotification } = await import('@/services/unifiedNotifier');
            await sendBulkDualNotification({
              user_ids: members.map(m => m.id),
              title: '📄 مستند جديد وارد',
              message: `تم إصدار مستند "${params.title}" من ${orgName} — محقق رقمياً بالكود والباركود`,
              type: 'document_issued',
              organization_id: partnerOrgId,
              reference_id: data?.id,
              reference_type: 'entity_document',
              metadata: {
                document_type: params.documentType,
                document_category: params.documentCategory,
                issuer_org: orgName,
                file_url: data?.file_url,
                has_verification: true,
              },
            });
          }
        }
      } catch (err) {
        console.warn('[EntityDocs] إشعار الأطراف فشل (غير مؤثر):', err);
      }
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
