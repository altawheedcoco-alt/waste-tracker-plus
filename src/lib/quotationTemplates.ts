/**
 * Quotation templates with direction (outgoing/incoming) and multiple document types
 */

export type QuotationDirection = 'outgoing' | 'incoming';

export type DocumentType = 
  | 'price_quote'        // عرض سعر
  | 'technical_financial' // عرض فني ومالي
  | 'estimate'           // تسعيرة
  | 'proforma'           // فاتورة مبدئية
  | 'rfq'                // طلب عرض سعر
  | 'purchase_order'     // أمر شراء
  | 'service_offer'      // عرض خدمات
  | 'contract_proposal'; // مقترح تعاقدي

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  price_quote: 'عرض سعر',
  technical_financial: 'عرض فني ومالي',
  estimate: 'تسعيرة',
  proforma: 'فاتورة مبدئية (Proforma)',
  rfq: 'طلب عرض سعر (RFQ)',
  purchase_order: 'أمر شراء',
  service_offer: 'عرض خدمات',
  contract_proposal: 'مقترح تعاقدي',
};

export const DIRECTION_LABELS: Record<QuotationDirection, { label: string; description: string; icon: string }> = {
  outgoing: { label: 'عروض صادرة (هناخد)', description: 'عروض نقدمها للعملاء لتحصيل مقابل خدماتنا', icon: '📤' },
  incoming: { label: 'عروض واردة (هندفع)', description: 'عروض نطلبها من الموردين لشراء خدمات أو مواد', icon: '📥' },
};

export interface QuotationTemplateItem {
  description: string;
  unit: string;
  defaultPrice?: number;
}

export interface QuotationTemplate {
  id: string;
  entityType: string;
  direction: QuotationDirection;
  documentType: DocumentType;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  icon: string;
  defaultItems: QuotationTemplateItem[];
  defaultTerms: string;
  defaultPaymentTerms: string;
  defaultDeliveryTerms: string;
  headerNote: string;
}

export const QUOTATION_TEMPLATES: QuotationTemplate[] = [
  // ══════════════════════════════════════════════════════════════
  // ═══ OUTGOING (صادر - هناخد) ═══════════════════════════════
  // ══════════════════════════════════════════════════════════════

  // ───── Generator (مولّد المخلفات) - OUTGOING ─────
  {
    id: 'gen-out-disposal',
    entityType: 'generator',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر بيع مخلفات قابلة للتدوير',
    nameEn: 'Recyclable Waste Sale Quote',
    descriptionAr: 'عرض لبيع المخلفات القابلة للاسترداد للمدوّرين',
    icon: '🏭',
    defaultItems: [
      { description: 'مخلفات بلاستيكية مفروزة (PET)', unit: 'طن', defaultPrice: 3500 },
      { description: 'مخلفات ورقية وكرتونية مفروزة', unit: 'طن', defaultPrice: 2000 },
      { description: 'مخلفات معدنية (خردة حديد)', unit: 'طن', defaultPrice: 7000 },
      { description: 'مخلفات خشبية (باليتات)', unit: 'طن', defaultPrice: 1500 },
      { description: 'تحميل من الموقع (شامل العمالة)', unit: 'شحنة', defaultPrice: 300 },
    ],
    defaultTerms: 'يسري العرض 30 يوماً. الأسعار وفق أسعار السوق الحالية وقابلة للتعديل. المخلفات مفروزة ونظيفة.',
    defaultPaymentTerms: 'الدفع عند الاستلام أو خلال 15 يوماً.',
    defaultDeliveryTerms: 'التسليم من موقع المنشأة. الحد الأدنى 5 أطنان.',
    headerNote: 'نتشرف بعرض المخلفات القابلة للتدوير المتوفرة لدينا.',
  },
  {
    id: 'gen-out-service-offer',
    entityType: 'generator',
    direction: 'outgoing',
    documentType: 'service_offer',
    nameAr: 'عرض خدمات فرز وتجهيز المخلفات',
    nameEn: 'Waste Sorting & Preparation Services',
    descriptionAr: 'عرض خدمات فرز المخلفات وتجهيزها للنقل',
    icon: '🔧',
    defaultItems: [
      { description: 'فرز المخلفات بالموقع', unit: 'طن', defaultPrice: 150 },
      { description: 'تعبئة وتغليف المخلفات للنقل', unit: 'شحنة', defaultPrice: 200 },
      { description: 'إعداد بيان حمولة المخلفات', unit: 'بيان', defaultPrice: 50 },
      { description: 'وزن وتوثيق المخلفات', unit: 'شحنة', defaultPrice: 100 },
    ],
    defaultTerms: 'يسري العرض 15 يوماً. يتم الفرز وفق معايير وزارة البيئة.',
    defaultPaymentTerms: 'الدفع أسبوعياً حسب الكميات المنفذة.',
    defaultDeliveryTerms: 'تنفيذ الفرز خلال 24 ساعة من الطلب.',
    headerNote: 'نقدم خدمات فرز احترافية بعمالة مدربة.',
  },

  // ───── Generator - INCOMING (وارد - هندفع) ─────
  {
    id: 'gen-in-transport-rfq',
    entityType: 'generator',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر خدمات نقل مخلفات',
    nameEn: 'Waste Transport RFQ',
    descriptionAr: 'طلب تسعيرة من شركات النقل لنقل المخلفات',
    icon: '🚛',
    defaultItems: [
      { description: 'نقل مخلفات صلبة غير خطرة', unit: 'رحلة', defaultPrice: 0 },
      { description: 'نقل مخلفات خطرة', unit: 'رحلة', defaultPrice: 0 },
      { description: 'توفير حاويات بالموقع', unit: 'حاوية/شهر', defaultPrice: 0 },
      { description: 'خدمة التحميل بالمعدات', unit: 'رحلة', defaultPrice: 0 },
    ],
    defaultTerms: 'يُرجى تقديم العرض خلال 7 أيام. يجب أن يشمل العرض كافة التكاليف. نحتفظ بحق اختيار أفضل عرض.',
    defaultPaymentTerms: 'شروط الدفع المفضلة: 30 يوماً من الفاتورة.',
    defaultDeliveryTerms: 'مطلوب بدء الخدمة خلال أسبوعين من التعاقد.',
    headerNote: 'نرجو التكرم بتقديم أفضل عرض أسعاركم لخدمات النقل التالية:',
  },
  {
    id: 'gen-in-disposal-purchase',
    entityType: 'generator',
    direction: 'incoming',
    documentType: 'purchase_order',
    nameAr: 'أمر شراء خدمات تخلص من مخلفات',
    nameEn: 'Disposal Services Purchase Order',
    descriptionAr: 'أمر شراء لخدمات التخلص الآمن من المخلفات',
    icon: '📋',
    defaultItems: [
      { description: 'خدمة التخلص من مخلفات صناعية', unit: 'طن', defaultPrice: 400 },
      { description: 'خدمة التخلص من مخلفات كيميائية', unit: 'طن', defaultPrice: 2500 },
      { description: 'إصدار شهادة تخلص نهائي', unit: 'شهادة', defaultPrice: 300 },
    ],
    defaultTerms: 'أمر الشراء ملزم بعد التوقيع. يلتزم المورد بالمواصفات المذكورة.',
    defaultPaymentTerms: 'الدفع خلال 45 يوماً من استلام شهادة التخلص.',
    defaultDeliveryTerms: 'التنفيذ خلال أسبوع من استلام المخلفات.',
    headerNote: 'بناءً على العرض المقدم منكم، نصدر أمر الشراء التالي:',
  },
  {
    id: 'gen-in-consulting-rfq',
    entityType: 'generator',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر خدمات استشارية بيئية',
    nameEn: 'Environmental Consulting RFQ',
    descriptionAr: 'طلب تسعيرة من مكتب استشاري للخدمات البيئية',
    icon: '🌿',
    defaultItems: [
      { description: 'إعداد دراسة تقييم أثر بيئي', unit: 'دراسة', defaultPrice: 0 },
      { description: 'تدقيق بيئي سنوي', unit: 'تدقيق', defaultPrice: 0 },
      { description: 'إعداد خطة إدارة مخلفات', unit: 'خطة', defaultPrice: 0 },
      { description: 'تدريب العاملين على الإدارة البيئية', unit: 'دورة', defaultPrice: 0 },
    ],
    defaultTerms: 'نرجو تقديم العرض الفني والمالي منفصلين. مدة تقديم العروض 10 أيام.',
    defaultPaymentTerms: 'يُفضل الدفع على دفعات مرتبطة بمراحل التنفيذ.',
    defaultDeliveryTerms: 'مطلوب تنفيذ المشروع خلال 3 أشهر.',
    headerNote: 'نطلب من سيادتكم التكرم بتقديم عرضكم الفني والمالي للخدمات التالية:',
  },

  // ───── Transporter (الناقل) - OUTGOING ─────
  {
    id: 'trans-out-shipping',
    entityType: 'transporter',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر خدمات النقل والشحن',
    nameEn: 'Transport & Shipping Quote',
    descriptionAr: 'عرض أسعار خدمات نقل المخلفات بأنواع المركبات',
    icon: '🚛',
    defaultItems: [
      { description: 'نقل بمركبة ربع نقل (حتى 2 طن)', unit: 'رحلة', defaultPrice: 450 },
      { description: 'نقل بمركبة جامبو (حتى 5 طن)', unit: 'رحلة', defaultPrice: 850 },
      { description: 'نقل بتريلا (حتى 20 طن)', unit: 'رحلة', defaultPrice: 2500 },
      { description: 'رسم بدء الرحلة (Flag-drop)', unit: 'رحلة', defaultPrice: 100 },
      { description: 'تكلفة الكيلومتر الإضافي', unit: 'كم', defaultPrice: 8 },
      { description: 'رسوم الانتظار', unit: 'ساعة', defaultPrice: 100 },
    ],
    defaultTerms: 'يسري العرض 30 يوماً. الأسعار محسوبة على أساس المسافة. يلتزم الناقل بمعايير السلامة.',
    defaultPaymentTerms: 'الدفع عند التسليم أو خلال 15 يوماً.',
    defaultDeliveryTerms: 'تحديد موعد النقل خلال 24-48 ساعة من التأكيد.',
    headerNote: 'يسعدنا تقديم عرض أسعارنا التنافسي لخدمات النقل المتخصص.',
  },
  {
    id: 'trans-out-fleet-rental',
    entityType: 'transporter',
    direction: 'outgoing',
    documentType: 'service_offer',
    nameAr: 'عرض خدمات تأجير أسطول مركبات',
    nameEn: 'Fleet Rental Service Offer',
    descriptionAr: 'عرض تأجير مركبات بعقود مرنة',
    icon: '🚚',
    defaultItems: [
      { description: 'تأجير مركبة نقل خفيف (يومي)', unit: 'يوم', defaultPrice: 600 },
      { description: 'تأجير مركبة نقل ثقيل (يومي)', unit: 'يوم', defaultPrice: 1500 },
      { description: 'تأجير مركبة مع سائق (شهري)', unit: 'شهر', defaultPrice: 15000 },
      { description: 'تأمين شامل على المركبة', unit: 'شهر', defaultPrice: 2000 },
    ],
    defaultTerms: 'الحد الأدنى للإيجار أسبوع. المستأجر مسؤول عن الأضرار.',
    defaultPaymentTerms: 'دفعة مقدمة 50%، والباقي شهرياً.',
    defaultDeliveryTerms: 'تسليم المركبة خلال 48 ساعة من التعاقد.',
    headerNote: 'نقدم لكم باقات تأجير مرنة تناسب احتياجاتكم التشغيلية.',
  },
  {
    id: 'trans-out-technical-financial',
    entityType: 'transporter',
    direction: 'outgoing',
    documentType: 'technical_financial',
    nameAr: 'عرض فني ومالي لمناقصة نقل مخلفات',
    nameEn: 'Technical & Financial Proposal for Waste Transport',
    descriptionAr: 'عرض فني ومالي متكامل للمناقصات الحكومية والخاصة',
    icon: '📊',
    defaultItems: [
      { description: 'خدمات نقل مخلفات بلدية (سنوي)', unit: 'طن/شهر', defaultPrice: 35 },
      { description: 'توفير أسطول مخصص (10 مركبات)', unit: 'شهر', defaultPrice: 120000 },
      { description: 'إدارة وتشغيل نقاط التجميع', unit: 'نقطة/شهر', defaultPrice: 5000 },
      { description: 'نظام تتبع GPS لحظي', unit: 'مركبة/شهر', defaultPrice: 200 },
      { description: 'صيانة وقائية للأسطول', unit: 'شهر', defaultPrice: 15000 },
      { description: 'تدريب السائقين والمشغلين', unit: 'دورة', defaultPrice: 3000 },
    ],
    defaultTerms: 'العرض ساري لمدة 60 يوماً. يتضمن الجزء الفني تفاصيل الأسطول والخبرات. مطابق لكراسة الشروط.',
    defaultPaymentTerms: 'دفعات شهرية حسب الكميات الفعلية المنقولة.',
    defaultDeliveryTerms: 'بدء التشغيل خلال 30 يوماً من توقيع العقد.',
    headerNote: 'نتقدم بعرضنا الفني والمالي استجابة لمناقصتكم، مع خبرة تتجاوز العقدين في النقل المتخصص.',
  },
  {
    id: 'trans-out-contract-proposal',
    entityType: 'transporter',
    direction: 'outgoing',
    documentType: 'contract_proposal',
    nameAr: 'مقترح تعاقدي للنقل الدوري',
    nameEn: 'Periodic Transport Contract Proposal',
    descriptionAr: 'مقترح تعاقد سنوي لخدمات النقل الدوري',
    icon: '📝',
    defaultItems: [
      { description: 'نقل دوري أسبوعي (4 رحلات/شهر)', unit: 'شهر', defaultPrice: 3200 },
      { description: 'نقل دوري يومي', unit: 'شهر', defaultPrice: 12000 },
      { description: 'خدمة طوارئ (نقل عاجل خلال 6 ساعات)', unit: 'رحلة', defaultPrice: 1500 },
      { description: 'تقارير شهرية وإحصائيات', unit: 'شهر', defaultPrice: 300 },
    ],
    defaultTerms: 'مدة العقد سنة قابلة للتجديد. يتضمن بند تعديل الأسعار وفق مؤشر التضخم.',
    defaultPaymentTerms: 'دفعات شهرية في بداية كل شهر.',
    defaultDeliveryTerms: 'الالتزام بالجدول الزمني المتفق عليه بنسبة 98%.',
    headerNote: 'نقدم مقترحنا التعاقدي للنقل الدوري بأسعار تنافسية وضمان جودة الخدمة.',
  },

  // ───── Transporter - INCOMING ─────
  {
    id: 'trans-in-fuel-purchase',
    entityType: 'transporter',
    direction: 'incoming',
    documentType: 'purchase_order',
    nameAr: 'أمر شراء وقود وصيانة',
    nameEn: 'Fuel & Maintenance PO',
    descriptionAr: 'أمر شراء مستلزمات تشغيل الأسطول',
    icon: '⛽',
    defaultItems: [
      { description: 'سولار (ديزل)', unit: 'لتر', defaultPrice: 10 },
      { description: 'زيوت محركات', unit: 'لتر', defaultPrice: 80 },
      { description: 'إطارات شاحنات', unit: 'إطار', defaultPrice: 5000 },
      { description: 'صيانة دورية للمركبات', unit: 'مركبة', defaultPrice: 3000 },
    ],
    defaultTerms: 'أمر الشراء ملزم بعد التوقيع. التوريد حسب الجدول المرفق.',
    defaultPaymentTerms: 'الدفع خلال 30 يوماً من الفاتورة.',
    defaultDeliveryTerms: 'التوريد إلى موقع الأسطول مباشرة.',
    headerNote: 'نرجو توريد المستلزمات التالية وفقاً للمواصفات المحددة:',
  },
  {
    id: 'trans-in-insurance-rfq',
    entityType: 'transporter',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر تأمين أسطول',
    nameEn: 'Fleet Insurance RFQ',
    descriptionAr: 'طلب تسعيرة تأمين شامل للأسطول',
    icon: '🛡️',
    defaultItems: [
      { description: 'تأمين شامل مركبة نقل خفيف', unit: 'مركبة/سنة', defaultPrice: 0 },
      { description: 'تأمين شامل مركبة نقل ثقيل', unit: 'مركبة/سنة', defaultPrice: 0 },
      { description: 'تأمين ضد الغير', unit: 'مركبة/سنة', defaultPrice: 0 },
      { description: 'تأمين البضائع المنقولة', unit: 'سنة', defaultPrice: 0 },
    ],
    defaultTerms: 'نرجو تقديم العرض خلال 5 أيام مع تفاصيل التغطية.',
    defaultPaymentTerms: 'يُفضل الدفع ربع سنوي.',
    defaultDeliveryTerms: 'بدء التغطية فوراً من تاريخ التعاقد.',
    headerNote: 'نطلب عرض أسعاركم لتأمين أسطولنا المكون من المركبات التالية:',
  },

  // ───── Recycler (المدوّر) - OUTGOING ─────
  {
    id: 'rec-out-processing',
    entityType: 'recycler',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر خدمات المعالجة والتدوير',
    nameEn: 'Processing & Recycling Quote',
    descriptionAr: 'عرض أسعار لخدمات معالجة وإعادة تدوير المخلفات',
    icon: '🔄',
    defaultItems: [
      { description: 'معالجة بلاستيك (PET/HDPE)', unit: 'طن', defaultPrice: 600 },
      { description: 'معالجة ورق وكرتون', unit: 'طن', defaultPrice: 300 },
      { description: 'معالجة معادن (حديد/ألومنيوم)', unit: 'طن', defaultPrice: 800 },
      { description: 'معالجة مخلفات إلكترونية', unit: 'طن', defaultPrice: 2000 },
      { description: 'إصدار شهادة تدوير رسمية', unit: 'شهادة', defaultPrice: 250 },
    ],
    defaultTerms: 'يسري العرض 21 يوماً. الأسعار تعتمد على نسبة النقاء.',
    defaultPaymentTerms: 'صافي 30 يوماً من تاريخ استلام المخلفات.',
    defaultDeliveryTerms: 'مدة المعالجة 7-14 يوم عمل.',
    headerNote: 'نقدم لكم خدمات تدوير متقدمة بأحدث التقنيات.',
  },
  {
    id: 'rec-out-raw-materials',
    entityType: 'recycler',
    direction: 'outgoing',
    documentType: 'estimate',
    nameAr: 'تسعيرة مواد خام مُعاد تدويرها',
    nameEn: 'Recycled Raw Materials Estimate',
    descriptionAr: 'تسعيرة لبيع المواد الخام المعاد تدويرها',
    icon: '📦',
    defaultItems: [
      { description: 'حبيبات بلاستيك مُعاد تدويرها (PET)', unit: 'طن', defaultPrice: 4500 },
      { description: 'حبيبات بلاستيك مُعاد تدويرها (HDPE)', unit: 'طن', defaultPrice: 5000 },
      { description: 'ورق مُعاد تدويره (لُب)', unit: 'طن', defaultPrice: 3000 },
      { description: 'خردة حديد مُعالجة', unit: 'طن', defaultPrice: 8000 },
      { description: 'ألومنيوم مُعاد تدويره', unit: 'طن', defaultPrice: 12000 },
    ],
    defaultTerms: 'الأسعار خاضعة لتقلبات السوق. الحد الأدنى للطلب 5 أطنان.',
    defaultPaymentTerms: 'الدفع مقدم بالكامل قبل الشحن.',
    defaultDeliveryTerms: 'التسليم خلال 5-10 أيام عمل.',
    headerNote: 'نوفر مواد خام عالية الجودة بمواصفات صناعية معتمدة.',
  },
  {
    id: 'rec-out-proforma',
    entityType: 'recycler',
    direction: 'outgoing',
    documentType: 'proforma',
    nameAr: 'فاتورة مبدئية لتوريد مواد مُدوّرة',
    nameEn: 'Proforma Invoice for Recycled Materials',
    descriptionAr: 'فاتورة مبدئية للتصدير أو التوريد الكبير',
    icon: '🧾',
    defaultItems: [
      { description: 'رقائق بلاستيك PET مغسولة', unit: 'طن', defaultPrice: 6000 },
      { description: 'حبيبات LDPE مُعاد تدويرها', unit: 'طن', defaultPrice: 4000 },
      { description: 'تكلفة التعبئة والتغليف', unit: 'شحنة', defaultPrice: 2000 },
      { description: 'تكلفة النقل إلى الميناء', unit: 'شحنة', defaultPrice: 5000 },
    ],
    defaultTerms: 'الفاتورة المبدئية صالحة 15 يوماً. الأسعار FOB الميناء المصري.',
    defaultPaymentTerms: 'خطاب اعتماد (L/C) غير قابل للإلغاء.',
    defaultDeliveryTerms: 'الشحن خلال 21 يوماً من تأكيد خطاب الاعتماد.',
    headerNote: 'فاتورة مبدئية لأغراض التوريد وفتح الاعتماد المستندي.',
  },
  {
    id: 'rec-out-contract',
    entityType: 'recycler',
    direction: 'outgoing',
    documentType: 'contract_proposal',
    nameAr: 'مقترح تعاقدي لتوريد مواد مدوّرة',
    nameEn: 'Recycled Materials Supply Contract',
    descriptionAr: 'مقترح عقد توريد دوري للمواد المعاد تدويرها',
    icon: '📝',
    defaultItems: [
      { description: 'توريد شهري حبيبات PET (50 طن)', unit: 'شهر', defaultPrice: 225000 },
      { description: 'توريد شهري كرتون مُعاد تدويره (30 طن)', unit: 'شهر', defaultPrice: 90000 },
      { description: 'شهادات جودة واختبارات', unit: 'شهر', defaultPrice: 2000 },
    ],
    defaultTerms: 'مدة العقد سنة قابلة للتجديد. مراجعة الأسعار كل 3 أشهر.',
    defaultPaymentTerms: 'دفعات شهرية خلال 30 يوماً من التسليم.',
    defaultDeliveryTerms: 'التوريد في الأسبوع الأول من كل شهر.',
    headerNote: 'نقترح تعاقداً طويل الأجل لضمان استمرارية التوريد بأسعار تنافسية.',
  },

  // ───── Recycler - INCOMING ─────
  {
    id: 'rec-in-waste-purchase',
    entityType: 'recycler',
    direction: 'incoming',
    documentType: 'purchase_order',
    nameAr: 'أمر شراء مخلفات خام للتدوير',
    nameEn: 'Raw Waste Purchase Order',
    descriptionAr: 'أمر شراء مخلفات من المولّدين للتدوير',
    icon: '🏭',
    defaultItems: [
      { description: 'مخلفات بلاستيكية مفروزة', unit: 'طن', defaultPrice: 2000 },
      { description: 'مخلفات ورقية وكرتونية', unit: 'طن', defaultPrice: 1200 },
      { description: 'مخلفات معدنية مختلطة', unit: 'طن', defaultPrice: 5000 },
      { description: 'مخلفات إلكترونية', unit: 'طن', defaultPrice: 3000 },
    ],
    defaultTerms: 'أمر الشراء ساري لمدة شهر. يحق للمدوّر رفض المخلفات غير المطابقة.',
    defaultPaymentTerms: 'الدفع عند الاستلام بعد الفحص والوزن.',
    defaultDeliveryTerms: 'التسليم إلى مصنع التدوير. الحد الأدنى طن واحد.',
    headerNote: 'نرغب في شراء المخلفات التالية وفق المواصفات المحددة:',
  },
  {
    id: 'rec-in-equipment-rfq',
    entityType: 'recycler',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر معدات تدوير',
    nameEn: 'Recycling Equipment RFQ',
    descriptionAr: 'طلب تسعيرة معدات وخطوط إنتاج التدوير',
    icon: '⚙️',
    defaultItems: [
      { description: 'خط غسيل وفرز بلاستيك', unit: 'خط', defaultPrice: 0 },
      { description: 'ماكينة تحبيب (Pelletizer)', unit: 'ماكينة', defaultPrice: 0 },
      { description: 'مكبس هيدروليكي', unit: 'مكبس', defaultPrice: 0 },
      { description: 'سير ناقل (Conveyor)', unit: 'متر', defaultPrice: 0 },
      { description: 'تركيب وتشغيل', unit: 'مشروع', defaultPrice: 0 },
    ],
    defaultTerms: 'نرجو تقديم العرض شاملاً التركيب والتدريب وقطع الغيار.',
    defaultPaymentTerms: 'يُفضل خطاب اعتماد أو دفعات مرحلية.',
    defaultDeliveryTerms: 'التسليم والتركيب خلال 3 أشهر.',
    headerNote: 'نطلب عرض أسعاركم لتوريد وتركيب المعدات التالية:',
  },

  // ───── Disposal (جهة التخلص) - OUTGOING ─────
  {
    id: 'disp-out-treatment',
    entityType: 'disposal',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر خدمات المعالجة والتخلص النهائي',
    nameEn: 'Treatment & Final Disposal Quote',
    descriptionAr: 'عرض أسعار للمعالجة الآمنة والتخلص النهائي',
    icon: '⚗️',
    defaultItems: [
      { description: 'معالجة مخلفات خطرة بالحرق الآمن', unit: 'طن', defaultPrice: 3000 },
      { description: 'دفن صحي آمن للمخلفات غير الخطرة', unit: 'طن', defaultPrice: 200 },
      { description: 'معالجة كيميائية للمخلفات السائلة', unit: 'م³', defaultPrice: 1500 },
      { description: 'معالجة مخلفات طبية (تعقيم وتمزيق)', unit: 'طن', defaultPrice: 4000 },
      { description: 'إصدار شهادة تخلص نهائي', unit: 'شهادة', defaultPrice: 300 },
      { description: 'رسوم استقبال وتفريغ', unit: 'شحنة', defaultPrice: 150 },
    ],
    defaultTerms: 'يسري العرض 30 يوماً. تخضع العمليات لرقابة WMRA. شهادة تخلص لكل شحنة.',
    defaultPaymentTerms: 'الدفع خلال 45 يوماً من إصدار شهادة التخلص.',
    defaultDeliveryTerms: 'استقبال الشحنات وفق المواعيد المحددة. المعالجة خلال 72 ساعة.',
    headerNote: 'نلتزم بأعلى معايير السلامة البيئية في التخلص النهائي.',
  },
  {
    id: 'disp-out-technical-financial',
    entityType: 'disposal',
    direction: 'outgoing',
    documentType: 'technical_financial',
    nameAr: 'عرض فني ومالي لعقد تخلص سنوي',
    nameEn: 'Annual Disposal Contract Technical & Financial Proposal',
    descriptionAr: 'عرض فني ومالي شامل لعقود التخلص طويلة الأجل',
    icon: '📊',
    defaultItems: [
      { description: 'رسوم استقبال سنوية', unit: 'سنة', defaultPrice: 50000 },
      { description: 'معالجة مخلفات صناعية (حتى 500 طن/شهر)', unit: 'طن', defaultPrice: 180 },
      { description: 'معالجة مخلفات خطرة', unit: 'طن', defaultPrice: 2800 },
      { description: 'مراقبة بيئية دورية', unit: 'ربع سنة', defaultPrice: 5000 },
      { description: 'تقارير امتثال فصلية', unit: 'تقرير', defaultPrice: 3000 },
    ],
    defaultTerms: 'العرض ساري 60 يوماً. يشمل الجزء الفني وصف المنشأة والتقنيات والتراخيص.',
    defaultPaymentTerms: 'رسوم شهرية حسب الكميات الفعلية + رسم استقبال سنوي.',
    defaultDeliveryTerms: 'استقبال فوري بعد التعاقد. تقارير شهرية مفصلة.',
    headerNote: 'نتقدم بعرضنا المتكامل لخدمات التخلص الآمن بأحدث التقنيات المعتمدة.',
  },

  // ───── Disposal - INCOMING ─────
  {
    id: 'disp-in-chemicals-purchase',
    entityType: 'disposal',
    direction: 'incoming',
    documentType: 'purchase_order',
    nameAr: 'أمر شراء مواد معالجة كيميائية',
    nameEn: 'Chemical Treatment Materials PO',
    descriptionAr: 'أمر شراء المواد الكيميائية اللازمة للمعالجة',
    icon: '🧪',
    defaultItems: [
      { description: 'جير حي (أكسيد كالسيوم)', unit: 'طن', defaultPrice: 1200 },
      { description: 'كربون نشط', unit: 'طن', defaultPrice: 8000 },
      { description: 'كلور سائل', unit: 'طن', defaultPrice: 3000 },
      { description: 'مواد تخثير (Coagulants)', unit: 'طن', defaultPrice: 5000 },
    ],
    defaultTerms: 'التوريد حسب المواصفات المرفقة. يحق لنا رفض المواد غير المطابقة.',
    defaultPaymentTerms: 'الدفع خلال 30 يوماً من الاستلام.',
    defaultDeliveryTerms: 'التوريد إلى موقع المنشأة مع شهادة تحليل.',
    headerNote: 'نرجو توريد المواد الكيميائية التالية وفق المواصفات المحددة:',
  },

  // ───── Consultant (الاستشاري) - OUTGOING ─────
  {
    id: 'cons-out-environmental',
    entityType: 'consultant',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر خدمات استشارات بيئية',
    nameEn: 'Environmental Consulting Quote',
    descriptionAr: 'عرض أسعار للخدمات الاستشارية البيئية',
    icon: '🌿',
    defaultItems: [
      { description: 'إعداد دراسة تقييم الأثر البيئي (EIA)', unit: 'دراسة', defaultPrice: 25000 },
      { description: 'تدقيق بيئي شامل', unit: 'تدقيق', defaultPrice: 15000 },
      { description: 'إعداد خطة إدارة مخلفات', unit: 'خطة', defaultPrice: 8000 },
      { description: 'تقييم الامتثال البيئي', unit: 'تقرير', defaultPrice: 5000 },
      { description: 'تدريب الكوادر', unit: 'جلسة', defaultPrice: 3000 },
    ],
    defaultTerms: 'يسري العرض 15 يوماً. المستشار مسؤول عن دقة التقارير.',
    defaultPaymentTerms: '40% مقدم، 30% عند المسودة، 30% عند التسليم النهائي.',
    defaultDeliveryTerms: 'مدة التنفيذ 2-4 أسابيع.',
    headerNote: 'نضع خبراتنا المتخصصة في خدمتكم.',
  },
  {
    id: 'cons-out-technical-financial',
    entityType: 'consultant',
    direction: 'outgoing',
    documentType: 'technical_financial',
    nameAr: 'عرض فني ومالي لمشروع استشاري',
    nameEn: 'Technical & Financial Consulting Proposal',
    descriptionAr: 'عرض فني ومالي متكامل لمشاريع الاستشارات البيئية',
    icon: '📊',
    defaultItems: [
      { description: 'المرحلة الأولى: تقييم الوضع الراهن', unit: 'مرحلة', defaultPrice: 10000 },
      { description: 'المرحلة الثانية: إعداد الدراسات الفنية', unit: 'مرحلة', defaultPrice: 20000 },
      { description: 'المرحلة الثالثة: تطبيق التوصيات', unit: 'مرحلة', defaultPrice: 15000 },
      { description: 'المرحلة الرابعة: متابعة وتقييم', unit: 'مرحلة', defaultPrice: 8000 },
      { description: 'زيارات ميدانية إضافية', unit: 'زيارة', defaultPrice: 2000 },
    ],
    defaultTerms: 'يسري العرض 30 يوماً. يتضمن الجزء الفني منهجية العمل والسير الذاتية للفريق.',
    defaultPaymentTerms: 'دفعات مرحلية مرتبطة بمخرجات كل مرحلة.',
    defaultDeliveryTerms: 'مدة المشروع 3-6 أشهر حسب النطاق.',
    headerNote: 'نقدم عرضنا الفني والمالي المتكامل بناءً على خبرتنا الواسعة في المجال البيئي.',
  },
  {
    id: 'cons-out-contract-proposal',
    entityType: 'consultant',
    direction: 'outgoing',
    documentType: 'contract_proposal',
    nameAr: 'مقترح تعاقدي للاستشارات البيئية الدورية',
    nameEn: 'Periodic Environmental Consulting Contract',
    descriptionAr: 'مقترح تعاقد سنوي للمتابعة والاستشارات الدورية',
    icon: '📝',
    defaultItems: [
      { description: 'متابعة بيئية شهرية', unit: 'شهر', defaultPrice: 5000 },
      { description: 'تدقيق بيئي ربع سنوي', unit: 'تدقيق', defaultPrice: 10000 },
      { description: 'تمثيل أمام الجهات الرقابية', unit: 'جلسة', defaultPrice: 3000 },
      { description: 'استشارات طوارئ (خط ساخن)', unit: 'شهر', defaultPrice: 2000 },
    ],
    defaultTerms: 'مدة العقد سنة. يتضمن زيارات ميدانية شهرية وتقارير دورية.',
    defaultPaymentTerms: 'دفعات شهرية ثابتة.',
    defaultDeliveryTerms: 'بدء التعاقد من الشهر التالي للتوقيع.',
    headerNote: 'نقترح تعاقداً سنوياً يضمن الامتثال البيئي المستمر لمنشأتكم.',
  },

  // ───── Consultant - INCOMING ─────
  {
    id: 'cons-in-lab-rfq',
    entityType: 'consultant',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر تحاليل معملية',
    nameEn: 'Lab Analysis RFQ',
    descriptionAr: 'طلب تسعيرة من معامل معتمدة للتحاليل البيئية',
    icon: '🔬',
    defaultItems: [
      { description: 'تحليل مياه صرف صناعي (شامل)', unit: 'عينة', defaultPrice: 0 },
      { description: 'تحليل تربة (معادن ثقيلة)', unit: 'عينة', defaultPrice: 0 },
      { description: 'قياس انبعاثات هوائية', unit: 'نقطة قياس', defaultPrice: 0 },
      { description: 'تحليل مخلفات صلبة', unit: 'عينة', defaultPrice: 0 },
    ],
    defaultTerms: 'المعمل يجب أن يكون معتمداً من الجهات المختصة. تقديم العرض خلال 5 أيام.',
    defaultPaymentTerms: 'الدفع عند استلام نتائج التحاليل.',
    defaultDeliveryTerms: 'نتائج التحاليل خلال 7-10 أيام عمل.',
    headerNote: 'نطلب عرض أسعاركم للتحاليل المعملية التالية لمشاريعنا الاستشارية:',
  },

  // ───── Consulting Office (المكتب الاستشاري) - OUTGOING ─────
  {
    id: 'office-out-comprehensive',
    entityType: 'consulting_office',
    direction: 'outgoing',
    documentType: 'service_offer',
    nameAr: 'عرض خدمات استشارية متكاملة',
    nameEn: 'Comprehensive Consulting Service Offer',
    descriptionAr: 'عرض شامل لحزمة الخدمات الاستشارية',
    icon: '🏢',
    defaultItems: [
      { description: 'دراسة تقييم الأثر البيئي والاجتماعي (ESIA)', unit: 'دراسة', defaultPrice: 50000 },
      { description: 'تدقيق بيئي وفق ISO 14001', unit: 'تدقيق', defaultPrice: 20000 },
      { description: 'إعداد نظام إدارة بيئية (EMS)', unit: 'نظام', defaultPrice: 35000 },
      { description: 'تمثيل أمام الجهات الرقابية', unit: 'ملف', defaultPrice: 5000 },
      { description: 'تأهيل ISO 14001', unit: 'مشروع', defaultPrice: 40000 },
      { description: 'تقارير ESG والاستدامة', unit: 'تقرير', defaultPrice: 15000 },
    ],
    defaultTerms: 'يسري العرض 30 يوماً. فريق متخصص لكل مشروع.',
    defaultPaymentTerms: '30% مقدم، ودفعات شهرية حسب التقدم.',
    defaultDeliveryTerms: 'مدة التنفيذ 1-3 أشهر.',
    headerNote: 'يتشرف مكتبنا بتقديم هذا العرض المتكامل بخبرة تتجاوز العقدين.',
  },
  {
    id: 'office-out-legal',
    entityType: 'consulting_office',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر خدمات التمثيل القانوني البيئي',
    nameEn: 'Environmental Legal Representation Quote',
    descriptionAr: 'عرض أسعار للتمثيل أمام الجهات الرقابية',
    icon: '⚖️',
    defaultItems: [
      { description: 'تمثيل أمام جهاز شؤون البيئة (EEAA)', unit: 'ملف', defaultPrice: 8000 },
      { description: 'تمثيل أمام WMRA', unit: 'ملف', defaultPrice: 8000 },
      { description: 'إعداد ملف الترخيص البيئي', unit: 'ملف', defaultPrice: 12000 },
      { description: 'متابعة تجديد التراخيص', unit: 'ترخيص', defaultPrice: 3000 },
      { description: 'استشارة قانونية بيئية', unit: 'ساعة', defaultPrice: 500 },
    ],
    defaultTerms: 'يسري العرض 15 يوماً. لا يشمل الرسوم الحكومية.',
    defaultPaymentTerms: 'دفعة مقدمة 50% عند التوكيل.',
    defaultDeliveryTerms: 'المدة تعتمد على إجراءات الجهة الرقابية.',
    headerNote: 'نقدم خدمات التمثيل القانوني البيئي بخبرة عريقة.',
  },
  {
    id: 'office-out-iso-cert',
    entityType: 'consulting_office',
    direction: 'outgoing',
    documentType: 'technical_financial',
    nameAr: 'عرض فني ومالي لتأهيل ISO',
    nameEn: 'ISO Certification Technical & Financial Proposal',
    descriptionAr: 'عرض فني ومالي للتأهيل والحصول على شهادات الأيزو',
    icon: '🏅',
    defaultItems: [
      { description: 'تقييم الفجوات (Gap Analysis)', unit: 'تقييم', defaultPrice: 8000 },
      { description: 'إعداد الوثائق والإجراءات', unit: 'مشروع', defaultPrice: 25000 },
      { description: 'تدريب الفريق الداخلي', unit: 'دورة', defaultPrice: 5000 },
      { description: 'تدقيق داخلي تجريبي', unit: 'تدقيق', defaultPrice: 7000 },
      { description: 'مراجعة ما قبل الشهادة', unit: 'مراجعة', defaultPrice: 5000 },
      { description: 'مرافقة أثناء التدقيق الخارجي', unit: 'يوم', defaultPrice: 3000 },
    ],
    defaultTerms: 'يسري العرض 30 يوماً. يضمن المكتب الدعم حتى الحصول على الشهادة.',
    defaultPaymentTerms: 'دفعات مرحلية مرتبطة بإنجاز كل مرحلة.',
    defaultDeliveryTerms: 'مدة المشروع 4-6 أشهر.',
    headerNote: 'نقدم عرضنا المتكامل لتأهيل منشأتكم للحصول على شهادة الأيزو.',
  },

  // ───── Consulting Office - INCOMING ─────
  {
    id: 'office-in-subcontract-rfq',
    entityType: 'consulting_office',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر من استشاري متعاقد (Subcontract)',
    nameEn: 'Subcontractor RFQ',
    descriptionAr: 'طلب تسعيرة من استشاري فرعي لمهام محددة',
    icon: '🤝',
    defaultItems: [
      { description: 'إعداد جزء من دراسة بيئية', unit: 'تقرير', defaultPrice: 0 },
      { description: 'زيارات ميدانية وجمع بيانات', unit: 'زيارة', defaultPrice: 0 },
      { description: 'تحليل بيانات متخصص', unit: 'تقرير', defaultPrice: 0 },
      { description: 'مراجعة فنية متخصصة', unit: 'مراجعة', defaultPrice: 0 },
    ],
    defaultTerms: 'يجب تقديم العرض مع السيرة الذاتية والخبرات. السرية واجبة.',
    defaultPaymentTerms: 'الدفع عند تسليم واعتماد المخرجات.',
    defaultDeliveryTerms: 'التسليم حسب الجدول الزمني للمشروع الأم.',
    headerNote: 'نطلب عرضكم للمشاركة في المشروع التالي كاستشاري فرعي:',
  },
  {
    id: 'office-in-software-rfq',
    entityType: 'consulting_office',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر أنظمة وبرمجيات',
    nameEn: 'Software & Systems RFQ',
    descriptionAr: 'طلب تسعيرة أنظمة إدارة بيئية وبرمجيات',
    icon: '💻',
    defaultItems: [
      { description: 'نظام إدارة بيئية إلكتروني', unit: 'ترخيص', defaultPrice: 0 },
      { description: 'نظام تتبع المخلفات', unit: 'ترخيص', defaultPrice: 0 },
      { description: 'تدريب على النظام', unit: 'جلسة', defaultPrice: 0 },
      { description: 'دعم فني سنوي', unit: 'سنة', defaultPrice: 0 },
    ],
    defaultTerms: 'يجب أن يشمل العرض ضمان وتحديثات لمدة سنة.',
    defaultPaymentTerms: 'يُفضل الدفع على أقساط ربع سنوية.',
    defaultDeliveryTerms: 'التسليم والتدريب خلال شهرين.',
    headerNote: 'نطلب عرض أسعاركم لتوريد وتركيب الأنظمة التالية:',
  },

  // ───── ISO Body (الجهة المانحة للأيزو) - OUTGOING ─────
  {
    id: 'iso-out-certification',
    entityType: 'iso_body',
    direction: 'outgoing',
    documentType: 'price_quote',
    nameAr: 'عرض سعر خدمات التدقيق ومنح الشهادات',
    nameEn: 'Certification Audit Services Quote',
    descriptionAr: 'عرض أسعار لخدمات تدقيق ومنح شهادات ISO',
    icon: '🏅',
    defaultItems: [
      { description: 'تدقيق المرحلة الأولى (Stage 1)', unit: 'تدقيق', defaultPrice: 15000 },
      { description: 'تدقيق المرحلة الثانية (Stage 2)', unit: 'تدقيق', defaultPrice: 25000 },
      { description: 'إصدار شهادة ISO 14001', unit: 'شهادة', defaultPrice: 10000 },
      { description: 'تدقيق مراقبة سنوي', unit: 'تدقيق', defaultPrice: 12000 },
      { description: 'تدقيق إعادة الشهادة (كل 3 سنوات)', unit: 'تدقيق', defaultPrice: 20000 },
    ],
    defaultTerms: 'يسري العرض 60 يوماً. التدقيق وفق معايير IAF و ISO 17021.',
    defaultPaymentTerms: 'الدفع قبل بدء التدقيق.',
    defaultDeliveryTerms: 'جدولة التدقيق خلال 30 يوماً من الدفع.',
    headerNote: 'نقدم خدمات التدقيق والاعتماد المعترف بها دولياً.',
  },
  {
    id: 'iso-out-training',
    entityType: 'iso_body',
    direction: 'outgoing',
    documentType: 'service_offer',
    nameAr: 'عرض خدمات تدريب مدققين معتمدين',
    nameEn: 'Certified Auditor Training Offer',
    descriptionAr: 'عرض دورات تدريبية لتأهيل المدققين',
    icon: '🎓',
    defaultItems: [
      { description: 'دورة مدقق داخلي ISO 14001 (5 أيام)', unit: 'متدرب', defaultPrice: 5000 },
      { description: 'دورة مدقق رئيسي ISO 14001 (5 أيام)', unit: 'متدرب', defaultPrice: 8000 },
      { description: 'دورة مدقق ISO 45001 (5 أيام)', unit: 'متدرب', defaultPrice: 6000 },
      { description: 'شهادة حضور معتمدة', unit: 'شهادة', defaultPrice: 500 },
    ],
    defaultTerms: 'الحد الأدنى 10 متدربين. يتضمن المادة التدريبية والشهادة.',
    defaultPaymentTerms: 'الدفع الكامل قبل بدء الدورة.',
    defaultDeliveryTerms: 'التنسيق لعقد الدورة خلال شهر.',
    headerNote: 'نقدم دورات تدريبية معتمدة دولياً لتأهيل المدققين.',
  },

  // ───── ISO Body - INCOMING ─────
  {
    id: 'iso-in-venue-rfq',
    entityType: 'iso_body',
    direction: 'incoming',
    documentType: 'rfq',
    nameAr: 'طلب عرض سعر قاعات تدريب ولوجستيات',
    nameEn: 'Training Venue & Logistics RFQ',
    descriptionAr: 'طلب تسعيرة قاعات ومستلزمات الدورات التدريبية',
    icon: '🏨',
    defaultItems: [
      { description: 'إيجار قاعة تدريب (يومي)', unit: 'يوم', defaultPrice: 0 },
      { description: 'ضيافة ووجبات خفيفة', unit: 'شخص/يوم', defaultPrice: 0 },
      { description: 'طباعة مواد تدريبية', unit: 'نسخة', defaultPrice: 0 },
      { description: 'معدات عرض (بروجيكتور + شاشة)', unit: 'يوم', defaultPrice: 0 },
    ],
    defaultTerms: 'القاعة تتسع لـ 20 شخصاً على الأقل مع تكييف.',
    defaultPaymentTerms: 'الدفع قبل الحجز.',
    defaultDeliveryTerms: 'الحجز قبل أسبوعين من تاريخ الدورة.',
    headerNote: 'نرجو تقديم عرضكم لتوفير قاعة تدريب مجهزة:',
  },
];

export const getTemplatesByEntity = (entityType: string, direction?: QuotationDirection): QuotationTemplate[] => {
  return QUOTATION_TEMPLATES.filter(t => 
    t.entityType === entityType && 
    (direction ? t.direction === direction : true)
  );
};

export const getTemplateById = (id: string): QuotationTemplate | undefined => {
  return QUOTATION_TEMPLATES.find(t => t.id === id);
};

export const ENTITY_LABELS: Record<string, string> = {
  generator: 'مولّد المخلفات',
  transporter: 'الناقل',
  recycler: 'المدوّر',
  disposal: 'جهة التخلص',
  consultant: 'الاستشاري البيئي',
  consulting_office: 'المكتب الاستشاري',
  iso_body: 'الجهة المانحة للأيزو',
};
