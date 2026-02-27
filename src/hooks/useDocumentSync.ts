/**
 * useDocumentSync — مزامنة المستندات بعد التوقيع/الختم
 * 
 * عند توقيع مستند أو ختمه، يتم تحديث سجل entity_documents
 * ليعكس النسخة الموقعة الجديدة في كل الأماكن التي تشير للمستند
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface SyncAfterSigningParams {
  /** معرف طلب التوقيع */
  signingRequestId: string;
  /** رابط المستند الموقّع الجديد (إن تم توليد نسخة جديدة) */
  signedDocumentUrl?: string;
  /** معرف التوقيع الرقمي المستخدم */
  signatureId?: string;
}

export function useDocumentSync() {
  const queryClient = useQueryClient();

  /**
   * بعد توقيع مستند — يحدث entity_documents ليعكس التوقيع
   */
  const syncAfterSigning = useCallback(async (params: SyncAfterSigningParams) => {
    const { signingRequestId, signedDocumentUrl, signatureId } = params;

    try {
      // 1. جلب بيانات طلب التوقيع
      const { data: sigReq, error: sigErr } = await supabase
        .from('signing_requests')
        .select('document_url, document_id, document_title, related_shipment_id, sender_organization_id, recipient_organization_id')
        .eq('id', signingRequestId)
        .single();

      if (sigErr || !sigReq) {
        console.warn('⚠️ [DocSync] لم يتم العثور على طلب التوقيع:', sigErr);
        return;
      }

      // 2. تحديث طلب التوقيع بالمستند الموقّع
      if (signedDocumentUrl || signatureId) {
        const updates: Record<string, any> = {};
        if (signedDocumentUrl) updates.signed_document_url = signedDocumentUrl;
        if (signatureId) updates.signature_id = signatureId;
        
        await supabase
          .from('signing_requests')
          .update(updates)
          .eq('id', signingRequestId);
      }

      // 3. البحث عن سجل entity_documents المرتبط وتحديثه
      const originalUrl = sigReq.document_url;
      if (originalUrl && signedDocumentUrl) {
        // البحث بالرابط الأصلي
        const { data: entityDocs } = await supabase
          .from('entity_documents')
          .select('id')
          .eq('file_url', originalUrl)
          .limit(5);

        if (entityDocs && entityDocs.length > 0) {
          // تحديث كل السجلات المرتبطة بالرابط الأصلي
          const { error: updateErr } = await supabase
            .from('entity_documents')
            .update({
              file_url: signedDocumentUrl,
              tags: supabase.rpc ? undefined : undefined, // tags handled separately
              updated_at: new Date().toISOString(),
            })
            .in('id', entityDocs.map(d => d.id));

          if (!updateErr) {
            console.log(`✅ [DocSync] تم تحديث ${entityDocs.length} سجل(ات) في الأرشيف`);
            
            // إضافة وسم "موقّع" للسجلات
            for (const doc of entityDocs) {
              const { data: existing } = await supabase
                .from('entity_documents')
                .select('tags')
                .eq('id', doc.id)
                .single();

              const currentTags = (existing?.tags as string[]) || [];
              if (!currentTags.includes('موقّع')) {
                await supabase
                  .from('entity_documents')
                  .update({ tags: [...currentTags, 'موقّع'] })
                  .eq('id', doc.id);
              }
            }
          }
        }
      }

      // 4. إبطال كاشات البيانات ليظهر التحديث فوراً
      queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
      queryClient.invalidateQueries({ queryKey: ['entity-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['signing-requests'] });

      console.log('✅ [DocSync] تمت مزامنة المستند بنجاح بعد التوقيع');
    } catch (err) {
      console.error('❌ [DocSync] خطأ في مزامنة المستند:', err);
    }
  }, [queryClient]);

  /**
   * مزامنة عامة — تحديث file_url في entity_documents
   */
  const syncFileUrl = useCallback(async (
    entityDocumentId: string,
    newFileUrl: string,
    extraTags?: string[]
  ) => {
    try {
      const updates: Record<string, any> = {
        file_url: newFileUrl,
        updated_at: new Date().toISOString(),
      };

      if (extraTags?.length) {
        const { data: existing } = await supabase
          .from('entity_documents')
          .select('tags')
          .eq('id', entityDocumentId)
          .single();

        const currentTags = (existing?.tags as string[]) || [];
        const merged = [...new Set([...currentTags, ...extraTags])];
        updates.tags = merged;
      }

      const { error } = await supabase
        .from('entity_documents')
        .update(updates)
        .eq('id', entityDocumentId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['entity-documents'] });
      queryClient.invalidateQueries({ queryKey: ['entity-timeline'] });

      console.log(`✅ [DocSync] تم تحديث الملف: ${entityDocumentId}`);
    } catch (err) {
      console.error('❌ [DocSync] خطأ في التحديث:', err);
      toast.error('فشل في مزامنة المستند');
    }
  }, [queryClient]);

  return {
    syncAfterSigning,
    syncFileUrl,
  };
}
