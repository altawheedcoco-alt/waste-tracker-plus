/**
 * Quotation templates per entity type with domain-specific items and terms
 */

export interface QuotationTemplateItem {
  description: string;
  unit: string;
  defaultPrice?: number;
}

export interface QuotationTemplate {
  id: string;
  entityType: string;
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
  // ═══ Generator (مولّد المخلفات) ═══
  {
    id: 'generator-waste-disposal',
    entityType: 'generator',
    nameAr: 'عرض سعر خدمات التخلص من المخلفات',
    nameEn: 'Waste Disposal Services Quote',
    descriptionAr: 'عرض أسعار لخدمات جمع ونقل والتخلص الآمن من المخلفات',
    icon: '🏭',
    defaultItems: [
      { description: 'خدمة جمع المخلفات الصلبة غير الخطرة', unit: 'طن', defaultPrice: 350 },
      { description: 'خدمة جمع المخلفات الخطرة', unit: 'طن', defaultPrice: 1200 },
      { description: 'توفير حاويات مخلفات (إيجار شهري)', unit: 'حاوية/شهر', defaultPrice: 500 },
      { description: 'خدمة النقل من الموقع إلى محطة المعالجة', unit: 'رحلة', defaultPrice: 800 },
      { description: 'إعداد سجل المخلفات الدوري', unit: 'تقرير', defaultPrice: 200 },
    ],
    defaultTerms: 'يسري هذا العرض لمدة 30 يوماً من تاريخ الإصدار. الأسعار شاملة خدمة النقل والتحميل. يلتزم المقدم بكافة الاشتراطات البيئية وفقاً لأحكام القانون 202 لسنة 2020 ولائحته التنفيذية. تخضع المخلفات الخطرة لإجراءات خاصة وفقاً للمواصفات القياسية المصرية.',
    defaultPaymentTerms: 'الدفع خلال 30 يوماً من تاريخ الفاتورة. يتم الدفع بالتحويل البنكي أو شيك مصرفي.',
    defaultDeliveryTerms: 'يتم الجمع وفق الجدول الزمني المتفق عليه. التسليم خلال 48 ساعة من طلب الخدمة.',
    headerNote: 'نتشرف بتقديم عرض أسعارنا لخدمات إدارة المخلفات، آملين أن ينال استحسانكم ورضاكم.',
  },
  {
    id: 'generator-recycling',
    entityType: 'generator',
    nameAr: 'عرض سعر خدمات إعادة التدوير',
    nameEn: 'Recycling Services Quote',
    descriptionAr: 'عرض أسعار لخدمات فرز وإعادة تدوير المخلفات القابلة للاسترداد',
    icon: '♻️',
    defaultItems: [
      { description: 'فرز وتصنيف المخلفات البلاستيكية', unit: 'طن', defaultPrice: 250 },
      { description: 'فرز وتصنيف المخلفات الورقية', unit: 'طن', defaultPrice: 180 },
      { description: 'فرز وتصنيف المخلفات المعدنية', unit: 'طن', defaultPrice: 400 },
      { description: 'إصدار شهادة تدوير معتمدة', unit: 'شهادة', defaultPrice: 150 },
    ],
    defaultTerms: 'يسري هذا العرض لمدة 15 يوماً. جميع الأسعار قابلة للتعديل وفقاً لأسعار السوق الحالية للمواد المستردة.',
    defaultPaymentTerms: 'الدفع فوري عند التسليم أو خلال 15 يوماً.',
    defaultDeliveryTerms: 'يتم استلام المخلفات من موقع العميل. التسليم حسب الجدول المتفق عليه.',
    headerNote: 'نتقدم إليكم بعرض أسعار خدمات إعادة التدوير المتكاملة.',
  },

  // ═══ Transporter (الناقل) ═══
  {
    id: 'transporter-shipping',
    entityType: 'transporter',
    nameAr: 'عرض سعر خدمات النقل والشحن',
    nameEn: 'Transport & Shipping Quote',
    descriptionAr: 'عرض أسعار خدمات نقل المخلفات بأنواع المركبات المختلفة',
    icon: '🚛',
    defaultItems: [
      { description: 'نقل بمركبة ربع نقل (حتى 2 طن)', unit: 'رحلة', defaultPrice: 450 },
      { description: 'نقل بمركبة جامبو (حتى 5 طن)', unit: 'رحلة', defaultPrice: 850 },
      { description: 'نقل بتريلا (حتى 20 طن)', unit: 'رحلة', defaultPrice: 2500 },
      { description: 'رسم بدء الرحلة (Flag-drop)', unit: 'رحلة', defaultPrice: 100 },
      { description: 'تكلفة الكيلومتر الإضافي', unit: 'كم', defaultPrice: 8 },
      { description: 'رسوم الانتظار', unit: 'ساعة', defaultPrice: 100 },
      { description: 'مضاعف المخلفات الخطرة (×2)', unit: 'رحلة', defaultPrice: 0 },
    ],
    defaultTerms: 'يسري هذا العرض لمدة 30 يوماً. الأسعار محسوبة على أساس المسافة من نقطة التحميل إلى الوجهة. يلتزم الناقل بكافة اشتراطات السلامة والنقل الآمن وفقاً لقانون تنظيم النقل البري.',
    defaultPaymentTerms: 'الدفع عند التسليم أو خلال 15 يوماً من تاريخ إصدار الفاتورة.',
    defaultDeliveryTerms: 'يتم تحديد موعد النقل خلال 24-48 ساعة من تأكيد الطلب. التتبع المباشر متاح عبر المنصة.',
    headerNote: 'يسعدنا تقديم عرض أسعارنا التنافسي لخدمات النقل المتخصص، مع التزامنا التام بأعلى معايير السلامة والجودة.',
  },
  {
    id: 'transporter-fleet-rental',
    entityType: 'transporter',
    nameAr: 'عرض سعر تأجير أسطول',
    nameEn: 'Fleet Rental Quote',
    descriptionAr: 'عرض أسعار لتأجير المركبات والأسطول بعقود مرنة',
    icon: '🚚',
    defaultItems: [
      { description: 'تأجير مركبة نقل خفيف (يومي)', unit: 'يوم', defaultPrice: 600 },
      { description: 'تأجير مركبة نقل ثقيل (يومي)', unit: 'يوم', defaultPrice: 1500 },
      { description: 'تأجير مركبة مع سائق (شهري)', unit: 'شهر', defaultPrice: 15000 },
      { description: 'تأمين شامل على المركبة', unit: 'شهر', defaultPrice: 2000 },
    ],
    defaultTerms: 'الحد الأدنى لفترة الإيجار أسبوع واحد. المستأجر مسؤول عن أي أضرار ناتجة عن سوء الاستخدام.',
    defaultPaymentTerms: 'دفعة مقدمة 50% عند التعاقد، والباقي شهرياً.',
    defaultDeliveryTerms: 'تسليم المركبة خلال 48 ساعة من توقيع العقد.',
    headerNote: 'نقدم لكم باقات تأجير مرنة تناسب احتياجاتكم التشغيلية.',
  },

  // ═══ Recycler (المدوّر) ═══
  {
    id: 'recycler-processing',
    entityType: 'recycler',
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
      { description: 'تقرير جودة المخرجات المعاد تدويرها', unit: 'تقرير', defaultPrice: 500 },
    ],
    defaultTerms: 'يسري العرض لمدة 21 يوماً. الأسعار تعتمد على نسبة النقاء ودرجة التلوث. يحتفظ المُدوِّر بحق رفض المخلفات غير المطابقة للمواصفات.',
    defaultPaymentTerms: 'صافي 30 يوماً من تاريخ استلام المخلفات ومعالجتها.',
    defaultDeliveryTerms: 'مدة المعالجة 7-14 يوم عمل حسب الكمية والنوع.',
    headerNote: 'نقدم لكم خدمات تدوير متقدمة بأحدث التقنيات وبأسعار تنافسية تراعي جودة المخرجات.',
  },
  {
    id: 'recycler-raw-materials',
    entityType: 'recycler',
    nameAr: 'عرض سعر مواد خام مُعاد تدويرها',
    nameEn: 'Recycled Raw Materials Quote',
    descriptionAr: 'عرض أسعار لبيع المواد الخام المعاد تدويرها',
    icon: '📦',
    defaultItems: [
      { description: 'حبيبات بلاستيك مُعاد تدويرها (PET)', unit: 'طن', defaultPrice: 4500 },
      { description: 'حبيبات بلاستيك مُعاد تدويرها (HDPE)', unit: 'طن', defaultPrice: 5000 },
      { description: 'ورق مُعاد تدويره (لُب)', unit: 'طن', defaultPrice: 3000 },
      { description: 'خردة حديد مُعالجة', unit: 'طن', defaultPrice: 8000 },
    ],
    defaultTerms: 'الأسعار خاضعة لتقلبات السوق وقد تتغير دون إشعار مسبق. الحد الأدنى للطلب 5 أطنان.',
    defaultPaymentTerms: 'الدفع مقدم بالكامل قبل الشحن.',
    defaultDeliveryTerms: 'التسليم خلال 5-10 أيام عمل من تأكيد الطلب والدفع.',
    headerNote: 'نوفر مواد خام عالية الجودة مُعاد تدويرها بمواصفات صناعية معتمدة.',
  },

  // ═══ Disposal (جهة التخلص) ═══
  {
    id: 'disposal-treatment',
    entityType: 'disposal',
    nameAr: 'عرض سعر خدمات المعالجة والتخلص النهائي',
    nameEn: 'Treatment & Final Disposal Quote',
    descriptionAr: 'عرض أسعار لخدمات المعالجة الآمنة والتخلص النهائي من المخلفات',
    icon: '⚗️',
    defaultItems: [
      { description: 'معالجة مخلفات خطرة بالحرق الآمن', unit: 'طن', defaultPrice: 3000 },
      { description: 'دفن صحي آمن للمخلفات غير الخطرة', unit: 'طن', defaultPrice: 200 },
      { description: 'معالجة كيميائية للمخلفات السائلة', unit: 'متر مكعب', defaultPrice: 1500 },
      { description: 'معالجة مخلفات طبية (تعقيم وتمزيق)', unit: 'طن', defaultPrice: 4000 },
      { description: 'إصدار شهادة تخلص نهائي', unit: 'شهادة', defaultPrice: 300 },
      { description: 'رسوم استقبال وتفريغ بالمنشأة', unit: 'شحنة', defaultPrice: 150 },
    ],
    defaultTerms: 'يسري العرض لمدة 30 يوماً. تخضع كافة عمليات التخلص لرقابة جهاز تنظيم إدارة المخلفات (WMRA). يتم إصدار شهادة تخلص نهائي لكل شحنة.',
    defaultPaymentTerms: 'الدفع خلال 45 يوماً من تاريخ إصدار شهادة التخلص.',
    defaultDeliveryTerms: 'يتم استقبال الشحنات وفق المواعيد المحددة. المعالجة خلال 72 ساعة من الاستقبال.',
    headerNote: 'نلتزم بأعلى معايير السلامة البيئية في عمليات التخلص النهائي، وفقاً للمعايير المصرية والدولية.',
  },

  // ═══ Consultant (الاستشاري) ═══
  {
    id: 'consultant-environmental',
    entityType: 'consultant',
    nameAr: 'عرض سعر خدمات الاستشارات البيئية',
    nameEn: 'Environmental Consulting Quote',
    descriptionAr: 'عرض أسعار للخدمات الاستشارية البيئية والتدقيق',
    icon: '🌿',
    defaultItems: [
      { description: 'إعداد دراسة تقييم الأثر البيئي (EIA)', unit: 'دراسة', defaultPrice: 25000 },
      { description: 'تدقيق بيئي شامل للمنشأة', unit: 'تدقيق', defaultPrice: 15000 },
      { description: 'إعداد خطة إدارة المخلفات', unit: 'خطة', defaultPrice: 8000 },
      { description: 'تقييم الامتثال البيئي', unit: 'تقرير', defaultPrice: 5000 },
      { description: 'تدريب الكوادر على الإدارة البيئية', unit: 'جلسة (4 ساعات)', defaultPrice: 3000 },
      { description: 'مراجعة الوثائق والتراخيص البيئية', unit: 'مراجعة', defaultPrice: 2000 },
    ],
    defaultTerms: 'يسري العرض لمدة 15 يوماً. المستشار مسؤول عن دقة التقارير والتحليلات. جميع الأعمال تتم وفقاً للمعايير المهنية المعتمدة.',
    defaultPaymentTerms: 'دفعة مقدمة 40% عند التعاقد، 30% عند تسليم المسودة، 30% عند التسليم النهائي.',
    defaultDeliveryTerms: 'مدة التنفيذ 2-4 أسابيع حسب نطاق العمل.',
    headerNote: 'نضع خبراتنا المتخصصة في الاستشارات البيئية في خدمتكم، ملتزمين بأعلى المعايير المهنية.',
  },

  // ═══ Consulting Office (المكتب الاستشاري) ═══
  {
    id: 'office-comprehensive',
    entityType: 'consulting_office',
    nameAr: 'عرض سعر حزمة خدمات استشارية متكاملة',
    nameEn: 'Comprehensive Consulting Package Quote',
    descriptionAr: 'عرض أسعار شامل لحزمة الخدمات الاستشارية المتكاملة',
    icon: '🏢',
    defaultItems: [
      { description: 'دراسة تقييم الأثر البيئي والاجتماعي (ESIA)', unit: 'دراسة', defaultPrice: 50000 },
      { description: 'تدقيق بيئي وفق ISO 14001', unit: 'تدقيق', defaultPrice: 20000 },
      { description: 'إعداد نظام إدارة بيئية متكامل (EMS)', unit: 'نظام', defaultPrice: 35000 },
      { description: 'خدمات التمثيل أمام الجهات الرقابية', unit: 'ملف', defaultPrice: 5000 },
      { description: 'تأهيل المنشأة للحصول على شهادة ISO 14001', unit: 'مشروع', defaultPrice: 40000 },
      { description: 'إعداد تقارير ESG والاستدامة', unit: 'تقرير', defaultPrice: 15000 },
      { description: 'استشارات السلامة والصحة المهنية', unit: 'زيارة', defaultPrice: 4000 },
    ],
    defaultTerms: 'يسري العرض لمدة 30 يوماً. يتضمن السعر كافة الزيارات الميدانية والتقارير. يضمن المكتب تعيين فريق متخصص لكل مشروع.',
    defaultPaymentTerms: 'دفعة مقدمة 30% عند التعاقد، ودفعات شهرية حسب التقدم في التنفيذ.',
    defaultDeliveryTerms: 'مدة التنفيذ 1-3 أشهر حسب حجم ونطاق المشروع.',
    headerNote: 'يتشرف مكتبنا بتقديم هذا العرض المتكامل، معتمدين على فريق من الخبراء المعتمدين وسجل حافل بالإنجازات.',
  },
  {
    id: 'office-legal-representation',
    entityType: 'consulting_office',
    nameAr: 'عرض سعر خدمات التمثيل القانوني البيئي',
    nameEn: 'Environmental Legal Representation Quote',
    descriptionAr: 'عرض أسعار لخدمات التمثيل أمام الجهات الرقابية والقانونية',
    icon: '⚖️',
    defaultItems: [
      { description: 'تمثيل أمام جهاز شؤون البيئة (EEAA)', unit: 'ملف', defaultPrice: 8000 },
      { description: 'تمثيل أمام جهاز تنظيم إدارة المخلفات (WMRA)', unit: 'ملف', defaultPrice: 8000 },
      { description: 'إعداد ملف الترخيص البيئي', unit: 'ملف', defaultPrice: 12000 },
      { description: 'متابعة تجديد التراخيص', unit: 'ترخيص', defaultPrice: 3000 },
      { description: 'استشارة قانونية بيئية', unit: 'ساعة', defaultPrice: 500 },
    ],
    defaultTerms: 'يسري العرض لمدة 15 يوماً. لا يشمل السعر الرسوم الحكومية والدمغات الرسمية.',
    defaultPaymentTerms: 'دفعة مقدمة 50% عند توكيل المكتب.',
    defaultDeliveryTerms: 'المدة تعتمد على إجراءات الجهة الرقابية المعنية.',
    headerNote: 'نقدم خدمات التمثيل القانوني البيئي بخبرة تتجاوز العقدين في التعامل مع الجهات الرقابية.',
  },
];

export const getTemplatesByEntity = (entityType: string): QuotationTemplate[] => {
  return QUOTATION_TEMPLATES.filter(t => t.entityType === entityType);
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
};
