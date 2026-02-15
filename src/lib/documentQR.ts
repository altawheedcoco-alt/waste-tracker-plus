/**
 * Unified QR Code Generation for all document types in iRecycle
 * All documents use a standardized verification URL format:
 * {origin}/qr-verify?type={docType}&code={reference}
 * 
 * Supported document types:
 * - shipment: نموذج تتبع نقل المخلفات
 * - certificate: شهادة التدوير
 * - receipt: إيصال الاستلام
 * - contract: العقد
 * - disposal: شهادة التخلص الآمن
 * - invoice: الفاتورة
 * - statement: كشف الحساب
 * - report: التقرير المجمع
 * - award_letter: خطاب الترسية
 * - entity_certificate: شهادة الجهة
 */

export type DocumentQRType = 
  | 'shipment' 
  | 'certificate' 
  | 'receipt' 
  | 'contract' 
  | 'disposal' 
  | 'invoice' 
  | 'statement' 
  | 'report' 
  | 'award_letter' 
  | 'entity_certificate'
  | 'signer'
  | 'permit'
  | 'delivery_cert'
  | 'transport_receipt'
  | 'operational_plan';

/**
 * Generate a standardized QR verification URL for any document
 */
export const generateDocumentQRValue = (
  type: DocumentQRType,
  reference: string
): string => {
  return `${window.location.origin}/qr-verify?type=${type}&code=${encodeURIComponent(reference)}`;
};

/**
 * Document type labels in Arabic/English
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentQRType, { ar: string; en: string; icon: string }> = {
  shipment: { ar: 'شحنة', en: 'Shipment', icon: 'Package' },
  certificate: { ar: 'شهادة تدوير', en: 'Recycling Certificate', icon: 'Recycle' },
  receipt: { ar: 'إيصال استلام', en: 'Receipt', icon: 'FileText' },
  contract: { ar: 'عقد', en: 'Contract', icon: 'FileText' },
  disposal: { ar: 'شهادة تخلص آمن', en: 'Disposal Certificate', icon: 'Shield' },
  invoice: { ar: 'فاتورة', en: 'Invoice', icon: 'Receipt' },
  statement: { ar: 'كشف حساب', en: 'Account Statement', icon: 'FileText' },
  report: { ar: 'تقرير مجمع', en: 'Aggregate Report', icon: 'FileText' },
  award_letter: { ar: 'خطاب ترسية', en: 'Award Letter', icon: 'FileText' },
  entity_certificate: { ar: 'شهادة جهة', en: 'Entity Certificate', icon: 'Building2' },
  signer: { ar: 'توقيع مفوض', en: 'Authorized Signer', icon: 'FileSignature' },
  permit: { ar: 'تصريح', en: 'Permit', icon: 'Shield' },
  delivery_cert: { ar: 'شهادة تسليم', en: 'Delivery Certificate', icon: 'FileCheck' },
  transport_receipt: { ar: 'إيصال نقل', en: 'Transport Receipt', icon: 'Truck' },
  operational_plan: { ar: 'خطة تشغيلية', en: 'Operational Plan', icon: 'FileText' },
};
