/**
 * Smart Upload Pipeline - خط أنابيب رفع ذكي مركزي
 * 
 * يقوم بـ:
 * 1. رفع الملف للمسار الصحيح (bucket + path)
 * 2. أرشفة تلقائية في entity_documents
 * 3. تشغيل OCR/AI Classification تلقائياً
 * 4. حفظ ذكي حسب النوع (صورة / PDF / كلاهما)
 */

import { supabase } from '@/integrations/supabase/client';
import { uploadFile, UploadResult } from './optimizedUpload';

// ============== أنواع البيانات ==============

export type UploadContext = 
  | 'shipment_photo'       // صور الشحنة
  | 'weighbridge_receipt'  // إيصال ميزان
  | 'loading_photo'        // صورة التحميل
  | 'delivery_photo'       // صورة التسليم
  | 'invoice'              // فاتورة
  | 'contract'             // عقد
  | 'license'              // ترخيص/رخصة
  | 'identity_card'        // بطاقة هوية
  | 'deposit_proof'        // إثبات إيداع
  | 'vehicle_photo'        // صورة مركبة
  | 'waste_photo'          // صورة نفايات
  | 'permit'               // تصريح
  | 'employee_doc'         // مستند موظف
  | 'general';             // عام

export interface SmartUploadParams {
  file: File;
  context: UploadContext;
  organizationId: string;
  userId: string;
  userRole?: string;
  
  /** معرفات الربط (اختياري) */
  shipmentId?: string;
  invoiceId?: string;
  depositId?: string;
  contractId?: string;
  awardLetterId?: string;
  partnerId?: string;
  externalPartnerId?: string;
  
  /** عنوان مخصص (يُولد تلقائياً إن لم يُحدد) */
  customTitle?: string;
  /** وصف إضافي */
  description?: string;
  /** وسوم إضافية */
  extraTags?: string[];
  
  /** تعطيل الأرشفة التلقائية */
  skipArchive?: boolean;
  /** تعطيل OCR */
  skipOCR?: boolean;
}

export interface SmartUploadResult {
  /** نتيجة الرفع الأساسية */
  upload: UploadResult;
  /** معرف سجل الأرشيف (إن تم الأرشفة) */
  archiveId?: string;
  /** نتيجة OCR/التصنيف (إن تم) */
  classification?: {
    document_type: string;
    confidence: number;
    extracted_data: Record<string, any>;
    suggested_folder: string;
    tags: string[];
    summary: string;
  };
  /** الصيغة النهائية المحفوظة */
  savedFormat: 'photo' | 'pdf' | 'both' | 'original';
}

// ============== تهيئة حسب السياق ==============

interface ContextConfig {
  bucket: string;
  pathPrefix: string;
  documentType: string;
  documentCategory: string;
  autoTitle: string;
  saveFormat: 'photo' | 'pdf' | 'both' | 'original';
  runOCR: boolean;
}

const CONTEXT_CONFIG: Record<UploadContext, ContextConfig> = {
  shipment_photo: {
    bucket: 'shipment-photos',
    pathPrefix: 'shipments',
    documentType: 'waste_photo',
    documentCategory: 'operations',
    autoTitle: 'صورة شحنة',
    saveFormat: 'photo',
    runOCR: false,
  },
  weighbridge_receipt: {
    bucket: 'weighbridge-photos',
    pathPrefix: 'weighbridge',
    documentType: 'weight_ticket',
    documentCategory: 'operations',
    autoTitle: 'إيصال ميزان',
    saveFormat: 'both', // صورة + PDF
    runOCR: true,
  },
  loading_photo: {
    bucket: 'weighbridge-photos',
    pathPrefix: 'loading',
    documentType: 'waste_photo',
    documentCategory: 'operations',
    autoTitle: 'صورة تحميل',
    saveFormat: 'photo',
    runOCR: false,
  },
  delivery_photo: {
    bucket: 'weighbridge-photos',
    pathPrefix: 'delivery',
    documentType: 'waste_photo',
    documentCategory: 'operations',
    autoTitle: 'صورة تسليم',
    saveFormat: 'photo',
    runOCR: false,
  },
  invoice: {
    bucket: 'entity-documents',
    pathPrefix: 'invoices',
    documentType: 'invoice',
    documentCategory: 'financials',
    autoTitle: 'فاتورة',
    saveFormat: 'pdf',
    runOCR: true,
  },
  contract: {
    bucket: 'entity-documents',
    pathPrefix: 'contracts',
    documentType: 'contract',
    documentCategory: 'legal',
    autoTitle: 'عقد',
    saveFormat: 'pdf',
    runOCR: true,
  },
  license: {
    bucket: 'organization-documents',
    pathPrefix: 'licenses',
    documentType: 'license',
    documentCategory: 'legal',
    autoTitle: 'رخصة/ترخيص',
    saveFormat: 'both',
    runOCR: true,
  },
  identity_card: {
    bucket: 'id-cards',
    pathPrefix: 'ids',
    documentType: 'identity',
    documentCategory: 'legal',
    autoTitle: 'إثبات هوية',
    saveFormat: 'photo',
    runOCR: true,
  },
  deposit_proof: {
    bucket: 'deposit-receipts',
    pathPrefix: 'deposits',
    documentType: 'deposit_proof',
    documentCategory: 'financials',
    autoTitle: 'إثبات إيداع',
    saveFormat: 'both',
    runOCR: true,
  },
  vehicle_photo: {
    bucket: 'shipment-photos',
    pathPrefix: 'vehicles',
    documentType: 'vehicle_photo',
    documentCategory: 'operations',
    autoTitle: 'صورة مركبة',
    saveFormat: 'photo',
    runOCR: false,
  },
  waste_photo: {
    bucket: 'shipment-photos',
    pathPrefix: 'waste',
    documentType: 'waste_photo',
    documentCategory: 'operations',
    autoTitle: 'صورة نفايات',
    saveFormat: 'photo',
    runOCR: false,
  },
  permit: {
    bucket: 'organization-documents',
    pathPrefix: 'permits',
    documentType: 'license',
    documentCategory: 'legal',
    autoTitle: 'تصريح',
    saveFormat: 'pdf',
    runOCR: true,
  },
  employee_doc: {
    bucket: 'employee-files',
    pathPrefix: 'employees',
    documentType: 'other',
    documentCategory: 'documents',
    autoTitle: 'مستند موظف',
    saveFormat: 'original',
    runOCR: false,
  },
  general: {
    bucket: 'entity-documents',
    pathPrefix: 'general',
    documentType: 'other',
    documentCategory: 'documents',
    autoTitle: 'مستند',
    saveFormat: 'original',
    runOCR: true,
  },
};

// ============== الدالة الرئيسية ==============

export async function smartUpload(params: SmartUploadParams): Promise<SmartUploadResult> {
  const config = CONTEXT_CONFIG[params.context];
  const {
    file,
    organizationId,
    userId,
    userRole,
    skipArchive = false,
    skipOCR = false,
  } = params;

  // 1. بناء مسار الملف
  const ext = file.name.split('.').pop() || 'bin';
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const entityId = params.shipmentId || params.invoiceId || params.contractId || params.partnerId || 'general';
  const filePath = `${organizationId}/${config.pathPrefix}/${entityId}/${uniqueId}.${ext}`;

  // 2. رفع الملف مع ضغط تلقائي للصور
  const uploadResult = await uploadFile(file, {
    bucket: config.bucket,
    path: filePath,
    compress: file.type.startsWith('image/'),
    upsert: true,
  });

  console.log(`✅ [SmartUpload] تم رفع الملف: ${config.bucket}/${filePath}`);

  // 3. تشغيل OCR/AI Classification بشكل متوازي (لا ننتظره إن لم يكن ضرورياً)
  let classificationResult: SmartUploadResult['classification'] | undefined;
  
  if (config.runOCR && !skipOCR && file.type.startsWith('image/')) {
    classificationResult = await runOCRClassification(file).catch(err => {
      console.warn('⚠️ [SmartUpload] فشل OCR:', err);
      return undefined;
    });
  }

  // 4. أرشفة في entity_documents
  let archiveId: string | undefined;
  
  if (!skipArchive) {
    const title = params.customTitle || 
      (classificationResult?.summary ? `${config.autoTitle} - ${classificationResult.summary.substring(0, 50)}` : config.autoTitle);
    
    const docType = classificationResult?.document_type || config.documentType;
    const tags = [
      ...(params.extraTags || []),
      ...(classificationResult?.tags || []),
      params.context,
    ];

    try {
      const { data: archiveData, error: archiveError } = await supabase
        .from('entity_documents')
        .insert({
          organization_id: organizationId,
          partner_organization_id: params.partnerId || null,
          external_partner_id: params.externalPartnerId || null,
          document_type: docType,
          document_category: classificationResult?.suggested_folder || config.documentCategory,
          title,
          description: params.description || classificationResult?.summary || null,
          file_url: uploadResult.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: uploadResult.finalSize,
          shipment_id: params.shipmentId || null,
          invoice_id: params.invoiceId || null,
          deposit_id: params.depositId || null,
          award_letter_id: params.awardLetterId || null,
          contract_id: params.contractId || null,
          reference_number: classificationResult?.extracted_data?.reference_number || null,
          tags,
          uploaded_by: userId,
          uploaded_by_role: userRole || 'employee',
        })
        .select('id')
        .single();

      if (archiveError) {
        console.warn('⚠️ [SmartUpload] فشل الأرشفة:', archiveError);
      } else {
        archiveId = archiveData?.id;
        console.log(`📁 [SmartUpload] تم الأرشفة: ${archiveId}`);
      }
    } catch (err) {
      console.warn('⚠️ [SmartUpload] خطأ في الأرشفة:', err);
    }
  }

  return {
    upload: uploadResult,
    archiveId,
    classification: classificationResult,
    savedFormat: config.saveFormat,
  };
}

// ============== OCR Helper ==============

async function runOCRClassification(file: File): Promise<SmartUploadResult['classification'] | undefined> {
  try {
    // تحويل الملف لـ base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { data, error } = await supabase.functions.invoke('ai-document-classifier', {
      body: {
        imageBase64: base64,
        fileName: file.name,
        mimeType: file.type,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'فشل التصنيف');

    console.log(`🤖 [SmartUpload] OCR نتيجة: ${data.result.document_type} (${data.result.confidence}%)`);
    return data.result;
  } catch (err) {
    console.warn('⚠️ [SmartUpload] فشل OCR:', err);
    return undefined;
  }
}

// ============== دوال مساعدة ==============

/**
 * رفع عدة ملفات بالتوازي عبر الـ Pipeline الذكي
 */
export async function smartUploadMultiple(
  files: File[],
  baseParams: Omit<SmartUploadParams, 'file'>
): Promise<SmartUploadResult[]> {
  return Promise.all(
    files.map(file => smartUpload({ ...baseParams, file }))
  );
}
