/**
 * Unified document type descriptions for the archive system.
 * Each document type has a standardized Arabic/English description
 * explaining its purpose, legal standing, and key contents.
 */

export interface DocumentTypeDescription {
  ar: string;
  en: string;
  category: 'legal' | 'financial' | 'operational' | 'compliance' | 'correspondence';
  icon: string;
}

export const DOCUMENT_DESCRIPTIONS: Record<string, DocumentTypeDescription> = {
  shipment: {
    ar: 'نموذج تتبع نقل المخلفات — يوثق تفاصيل الشحنة من المصدر إلى الوجهة، شاملاً نوع المخلفات والكميات وسلسلة الحيازة',
    en: 'Waste Transport Tracking Form — documents shipment details from source to destination, including waste type, quantities, and chain of custody',
    category: 'operational',
    icon: 'Package',
  },
  certificate: {
    ar: 'شهادة تدوير رسمية — تثبت إعادة تدوير المخلفات وفق المعايير البيئية المعتمدة مع بصمة رقمية للتحقق',
    en: 'Official Recycling Certificate — confirms waste recycling per environmental standards with digital verification',
    category: 'compliance',
    icon: 'Recycle',
  },
  receipt: {
    ar: 'إيصال استلام — يوثق تسلم المخلفات بين الأطراف مع توقيع المستلم والبيانات الزمنية والجغرافية',
    en: 'Receipt — documents waste handover between parties with recipient signature and geo-temporal data',
    category: 'operational',
    icon: 'FileText',
  },
  contract: {
    ar: 'عقد رسمي — اتفاقية ملزمة بين الأطراف تتضمن الشروط والالتزامات والبنود القانونية المتوافقة مع التشريعات',
    en: 'Official Contract — binding agreement between parties with terms, obligations, and legal clauses',
    category: 'legal',
    icon: 'FileText',
  },
  disposal: {
    ar: 'شهادة تخلص آمن — تثبت التخلص النهائي من المخلفات بطريقة آمنة ومطابقة للمعايير البيئية',
    en: 'Safe Disposal Certificate — confirms final waste disposal in a safe, environmentally compliant manner',
    category: 'compliance',
    icon: 'Shield',
  },
  invoice: {
    ar: 'فاتورة — مستند مالي يوثق قيمة الخدمات المقدمة مع تفاصيل البنود والضرائب وشروط السداد',
    en: 'Invoice — financial document detailing service charges, line items, taxes, and payment terms',
    category: 'financial',
    icon: 'Receipt',
  },
  statement: {
    ar: 'كشف حساب — ملخص مالي شامل يعرض الحركات المدينة والدائنة والرصيد بين الأطراف لفترة محددة',
    en: 'Account Statement — comprehensive financial summary showing debits, credits, and balance for a period',
    category: 'financial',
    icon: 'FileText',
  },
  report: {
    ar: 'تقرير مجمع — تحليل إحصائي شامل يلخص العمليات والكميات والأداء لفترة زمنية محددة',
    en: 'Aggregate Report — statistical analysis summarizing operations, quantities, and performance for a period',
    category: 'operational',
    icon: 'FileText',
  },
  award_letter: {
    ar: 'خطاب ترسية — وثيقة رسمية تحدد شروط التعاقد والأسعار المعتمدة لأنواع المخلفات بين الأطراف',
    en: 'Award Letter — official document specifying contracting terms and approved waste pricing between parties',
    category: 'legal',
    icon: 'FileText',
  },
  entity_certificate: {
    ar: 'شهادة جهة — وثيقة تعريفية بالمنظمة تتضمن بيانات التسجيل والتراخيص والحالة التشغيلية',
    en: 'Entity Certificate — organizational identity document with registration, licenses, and operational status',
    category: 'compliance',
    icon: 'Building2',
  },
  delivery_cert: {
    ar: 'شهادة تسليم — توثق عملية تسليم المخلفات من المولد للناقل مع إقرار المسؤولية القانونية',
    en: 'Delivery Certificate — documents waste handover from generator to transporter with legal accountability',
    category: 'operational',
    icon: 'FileCheck',
  },
  transport_receipt: {
    ar: 'إيصال نقل — وثيقة رسمية للناقل تثبت استلام ونقل الشحنة مع تفاصيل المسار وسلسلة الحيازة',
    en: 'Transport Receipt — official transporter document confirming shipment receipt and transport with route details',
    category: 'operational',
    icon: 'Truck',
  },
  operational_plan: {
    ar: 'خطة تشغيلية — جدول زمني منظم يحدد مسار العمليات والشحنات المخطط لها خلال فترة محددة',
    en: 'Operational Plan — organized schedule defining operations and planned shipments for a specific period',
    category: 'operational',
    icon: 'FileText',
  },
  permit: {
    ar: 'تصريح — إذن رسمي يسمح بتنفيذ عملية محددة (خروج مخلفات، دخول أفراد، نقل) وفق الضوابط',
    en: 'Permit — official authorization for specific operations (waste exit, personnel entry, transport)',
    category: 'compliance',
    icon: 'Shield',
  },
  declaration: {
    ar: 'إقرار — تعهد رسمي من طرف بالتزامه بالمسؤوليات القانونية والتنظيمية المتعلقة بالمخلفات',
    en: 'Declaration — official commitment by a party to legal and regulatory waste management responsibilities',
    category: 'legal',
    icon: 'FileText',
  },
  recycling_report: {
    ar: 'تقرير تدوير — ملخص عمليات إعادة التدوير المنجزة شاملاً الكميات والأنواع ونسب الاسترداد',
    en: 'Recycling Report — summary of completed recycling operations including quantities, types, and recovery rates',
    category: 'compliance',
    icon: 'Recycle',
  },
  weight_record: {
    ar: 'سجل وزن — بيانات الميزان الرسمية تتضمن الوزن الإجمالي والفارغ والصافي مع الطابع الزمني',
    en: 'Weight Record — official scale data including gross, tare, and net weight with timestamp',
    category: 'operational',
    icon: 'Scale',
  },
  weighbridge_photo: {
    ar: 'صورة ميزان — توثيق مرئي لعملية الوزن على البسكول كإثبات تدقيق مرئي إلزامي',
    en: 'Weighbridge Photo — visual documentation of weighing process as mandatory audit evidence',
    category: 'operational',
    icon: 'Image',
  },
  deposit: {
    ar: 'إيداع مالي — توثيق عملية دفع أو تحويل بنكي مع إثبات الدفع والمرجع المالي',
    en: 'Financial Deposit — documentation of payment or bank transfer with proof and financial reference',
    category: 'financial',
    icon: 'Banknote',
  },
  entity_document: {
    ar: 'مستند جهة — ملف مرفوع يخص المنظمة (ترخيص، سجل تجاري، شهادة بيئية، أو مستند إداري)',
    en: 'Entity Document — uploaded organizational file (license, commercial register, environmental cert, or admin doc)',
    category: 'compliance',
    icon: 'FileArchive',
  },
};

export const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  legal: { ar: 'قانوني', en: 'Legal' },
  financial: { ar: 'مالي', en: 'Financial' },
  operational: { ar: 'تشغيلي', en: 'Operational' },
  compliance: { ar: 'امتثال', en: 'Compliance' },
  correspondence: { ar: 'مراسلات', en: 'Correspondence' },
};

export const getDocumentDescription = (type: string, lang: 'ar' | 'en' = 'ar'): string => {
  return DOCUMENT_DESCRIPTIONS[type]?.[lang] || (lang === 'ar' ? 'مستند' : 'Document');
};

export const getDocumentCategory = (type: string): string => {
  return DOCUMENT_DESCRIPTIONS[type]?.category || 'other';
};
