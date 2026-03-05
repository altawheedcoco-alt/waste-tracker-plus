/**
 * Regulatory Document Templates per Egyptian Environmental Law 202/2020,
 * Law 4/1994, and WMRA regulations.
 */

export type DocumentCategory = 
  | 'certificates'
  | 'reports'
  | 'contracts'
  | 'tracking_forms'
  | 'registers'
  | 'regulatory';

export interface RegulatoryTemplate {
  id: string;
  title: string;
  title_en: string;
  category: DocumentCategory;
  description: string;
  legal_reference?: string;
  /** Org types that can issue this document */
  applicable_org_types: string[];
  /** Roles required to sign */
  required_signatories: string[];
  /** Fields the user must fill */
  fields: TemplateField[];
  /** Is this a multi-party document */
  requires_multi_sign: boolean;
}

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const commonFields: TemplateField[] = [
  { id: 'reference_number', label: 'رقم المرجع', type: 'text', required: true, placeholder: 'يتم توليده تلقائياً' },
  { id: 'issue_date', label: 'تاريخ الإصدار', type: 'date', required: true },
  { id: 'notes', label: 'ملاحظات', type: 'textarea', required: false, placeholder: 'ملاحظات إضافية...' },
];

const wasteFields: TemplateField[] = [
  { id: 'waste_type', label: 'نوع المخلفات', type: 'select', required: true, options: ['خطرة', 'غير خطرة', 'طبية', 'إلكترونية', 'بناء وهدم', 'بلدية'] },
  { id: 'waste_description', label: 'وصف المخلفات', type: 'textarea', required: true, placeholder: 'وصف تفصيلي للمخلفات...' },
  { id: 'quantity', label: 'الكمية (طن)', type: 'number', required: true },
];

export const categoryLabels: Record<DocumentCategory, { ar: string; en: string; icon: string }> = {
  certificates: { ar: 'الشهادات', en: 'Certificates', icon: 'Award' },
  reports: { ar: 'التقارير', en: 'Reports', icon: 'FileText' },
  contracts: { ar: 'العقود', en: 'Contracts', icon: 'FileSignature' },
  tracking_forms: { ar: 'نماذج التتبع والمانيفيست', en: 'Tracking & Manifests', icon: 'ClipboardList' },
  registers: { ar: 'السجلات', en: 'Registers', icon: 'Database' },
  regulatory: { ar: 'مستندات تنظيمية', en: 'Regulatory', icon: 'Scale' },
};

export const regulatoryTemplates: RegulatoryTemplate[] = [
  // ═══════════ CERTIFICATES ═══════════
  {
    id: 'safe-disposal-cert',
    title: 'شهادة التخلص الآمن من المخلفات',
    title_en: 'Safe Waste Disposal Certificate',
    category: 'certificates',
    description: 'شهادة تثبت التخلص الآمن والسليم بيئياً من المخلفات وفقاً للمعايير المعتمدة',
    legal_reference: 'قانون 202/2020 - مادة 27',
    applicable_org_types: ['disposal', 'recycler', 'consultant', 'consulting_office'],
    required_signatories: ['issuer', 'generator', 'disposer'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'disposal_method', label: 'طريقة التخلص', type: 'select', required: true, options: ['دفن صحي', 'حرق آمن', 'معالجة كيميائية', 'معالجة بيولوجية', 'تثبيت وتغليف'] },
      { id: 'disposal_facility', label: 'منشأة التخلص', type: 'text', required: true },
    ],
  },
  {
    id: 'env-management-cert',
    title: 'شهادة الإدارة البيئية المتكاملة',
    title_en: 'Integrated Environmental Management Certificate',
    category: 'certificates',
    description: 'شهادة تؤكد التزام المنشأة بمعايير الإدارة البيئية المتكاملة',
    legal_reference: 'قانون 4/1994 - باب ثاني',
    applicable_org_types: ['generator', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['consultant', 'organization'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'scope', label: 'نطاق الشهادة', type: 'textarea', required: true, placeholder: 'النطاق الذي تغطيه الشهادة...' },
      { id: 'validity_months', label: 'مدة الصلاحية (شهور)', type: 'number', required: true },
      { id: 'standard', label: 'المعيار المرجعي', type: 'select', required: true, options: ['ISO 14001:2015', 'ISO 45001:2018', 'معايير WMRA', 'معايير وزارة البيئة'] },
    ],
  },
  {
    id: 'compliance-cert',
    title: 'شهادة الامتثال البيئي',
    title_en: 'Environmental Compliance Certificate',
    category: 'certificates',
    description: 'شهادة تؤكد امتثال المنشأة للاشتراطات البيئية المعمول بها',
    legal_reference: 'قانون 202/2020 - مادة 12',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['consultant', 'organization'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'compliance_level', label: 'مستوى الامتثال', type: 'select', required: true, options: ['امتثال كامل', 'امتثال جزئي', 'يحتاج تحسين'] },
      { id: 'audit_date', label: 'تاريخ التدقيق', type: 'date', required: true },
    ],
  },
  {
    id: 'waste-classification-cert',
    title: 'شهادة تصنيف المخلفات',
    title_en: 'Waste Classification Certificate',
    category: 'certificates',
    description: 'شهادة رسمية لتصنيف نوع المخلفات وفقاً لكود EWC وقوائم بازل',
    legal_reference: 'قانون 202/2020 - مادة 5',
    applicable_org_types: ['generator', 'recycler', 'consultant', 'consulting_office'],
    required_signatories: ['classifier', 'generator'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'ewc_code', label: 'كود EWC', type: 'text', required: true, placeholder: 'XX XX XX' },
      { id: 'hazard_class', label: 'فئة الخطورة', type: 'select', required: false, options: ['H1 متفجرة', 'H3 قابلة للاشتعال', 'H5 ضارة', 'H6 سامة', 'H8 أكّالة', 'H10 ماسخة', 'H11 سامة للجينات', 'H12 بيئية', 'غير خطرة'] },
    ],
  },
  {
    id: 'treatment-completion-cert',
    title: 'شهادة إتمام المعالجة',
    title_en: 'Treatment Completion Certificate',
    category: 'certificates',
    description: 'شهادة تثبت إتمام معالجة المخلفات بالطريقة المعتمدة',
    legal_reference: 'قانون 202/2020 - مادة 30',
    applicable_org_types: ['recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['treater', 'generator'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'treatment_method', label: 'طريقة المعالجة', type: 'select', required: true, options: ['إعادة تدوير', 'معالجة حرارية', 'معالجة كيميائية', 'معالجة بيولوجية', 'فصل وفرز'] },
      { id: 'output_description', label: 'وصف المخرجات', type: 'textarea', required: true },
      { id: 'recovery_rate', label: 'نسبة الاسترداد (%)', type: 'number', required: false },
    ],
  },

  // ═══════════ REPORTS ═══════════
  {
    id: 'self-monitoring-report',
    title: 'تقرير الرصد البيئي الذاتي',
    title_en: 'Self Environmental Monitoring Report',
    category: 'reports',
    description: 'تقرير دوري يوثق نتائج الرصد البيئي الذاتي للمنشأة',
    legal_reference: 'قانون 4/1994 - مادة 22',
    applicable_org_types: ['generator', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'monitoring_period', label: 'فترة الرصد', type: 'text', required: true, placeholder: 'مثال: يناير - مارس 2025' },
      { id: 'parameters_monitored', label: 'المعاملات المرصودة', type: 'textarea', required: true, placeholder: 'انبعاثات هوائية، مياه صرف، ضوضاء...' },
      { id: 'results_summary', label: 'ملخص النتائج', type: 'textarea', required: true },
    ],
  },
  {
    id: 'quarterly-waste-report',
    title: 'تقرير إدارة المخلفات الربع سنوي',
    title_en: 'Quarterly Waste Management Report',
    category: 'reports',
    description: 'تقرير ربع سنوي شامل عن كميات وأنواع المخلفات المولدة والمعالجة',
    legal_reference: 'قانون 202/2020 - مادة 15',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization'],
    requires_multi_sign: false,
    fields: [...commonFields,
      { id: 'quarter', label: 'الربع', type: 'select', required: true, options: ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'] },
      { id: 'year', label: 'السنة', type: 'number', required: true },
      { id: 'total_generated', label: 'إجمالي المخلفات المولدة (طن)', type: 'number', required: true },
      { id: 'total_recycled', label: 'إجمالي المخلفات المدورة (طن)', type: 'number', required: false },
      { id: 'total_disposed', label: 'إجمالي المخلفات المتخلص منها (طن)', type: 'number', required: false },
    ],
  },
  {
    id: 'incident-report',
    title: 'تقرير الحوادث البيئية',
    title_en: 'Environmental Incident Report',
    category: 'reports',
    description: 'تقرير فوري عن أي حادث بيئي أو تسرب أو تلوث',
    legal_reference: 'قانون 4/1994 - مادة 29',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'incident_date', label: 'تاريخ الحادث', type: 'date', required: true },
      { id: 'incident_type', label: 'نوع الحادث', type: 'select', required: true, options: ['تسرب مواد خطرة', 'تلوث هوائي', 'تلوث مائي', 'تلوث تربة', 'حريق', 'انفجار', 'أخرى'] },
      { id: 'incident_description', label: 'وصف الحادث', type: 'textarea', required: true },
      { id: 'corrective_actions', label: 'الإجراءات التصحيحية', type: 'textarea', required: true },
    ],
  },
  {
    id: 'eia-report',
    title: 'تقرير تقييم الأثر البيئي',
    title_en: 'Environmental Impact Assessment (EIA)',
    category: 'reports',
    description: 'تقرير شامل لتقييم الآثار البيئية المحتملة للمشاريع والأنشطة',
    legal_reference: 'قانون 4/1994 - مادة 19',
    applicable_org_types: ['generator', 'consultant', 'consulting_office'],
    required_signatories: ['consultant', 'organization'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'project_name', label: 'اسم المشروع', type: 'text', required: true },
      { id: 'project_location', label: 'موقع المشروع', type: 'text', required: true },
      { id: 'project_description', label: 'وصف المشروع', type: 'textarea', required: true },
      { id: 'potential_impacts', label: 'الآثار البيئية المحتملة', type: 'textarea', required: true },
      { id: 'mitigation_measures', label: 'إجراءات التخفيف', type: 'textarea', required: true },
    ],
  },
  {
    id: 'wmra-annual-report',
    title: 'التقرير السنوي لجهاز تنظيم المخلفات',
    title_en: 'WMRA Annual Report',
    category: 'reports',
    description: 'التقرير السنوي المطلوب تقديمه لجهاز تنظيم إدارة المخلفات',
    legal_reference: 'قانون 202/2020 - مادة 8',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'fiscal_year', label: 'السنة المالية', type: 'number', required: true },
      { id: 'total_waste_handled', label: 'إجمالي المخلفات المدارة (طن)', type: 'number', required: true },
      { id: 'compliance_summary', label: 'ملخص الامتثال', type: 'textarea', required: true },
      { id: 'improvements', label: 'التحسينات المنفذة', type: 'textarea', required: false },
    ],
  },

  // ═══════════ CONTRACTS ═══════════
  {
    id: 'waste-transport-contract',
    title: 'عقد نقل مخلفات',
    title_en: 'Waste Transport Contract',
    category: 'contracts',
    description: 'عقد رسمي لنقل المخلفات بين المولد والناقل المرخص',
    legal_reference: 'قانون 202/2020 - مادة 20',
    applicable_org_types: ['generator', 'transporter', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'transporter'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'contract_duration', label: 'مدة العقد (شهور)', type: 'number', required: true },
      { id: 'start_date', label: 'تاريخ البدء', type: 'date', required: true },
      { id: 'transport_frequency', label: 'تكرار النقل', type: 'select', required: true, options: ['يومي', 'أسبوعي', 'نصف شهري', 'شهري', 'حسب الطلب'] },
      ...wasteFields,
      { id: 'price_per_ton', label: 'السعر لكل طن (ج.م)', type: 'number', required: true },
    ],
  },
  {
    id: 'recycling-contract',
    title: 'عقد معالجة وتدوير',
    title_en: 'Treatment & Recycling Contract',
    category: 'contracts',
    description: 'عقد رسمي لمعالجة وإعادة تدوير المخلفات',
    legal_reference: 'قانون 202/2020 - مادة 25',
    applicable_org_types: ['generator', 'recycler', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'recycler'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'contract_duration', label: 'مدة العقد (شهور)', type: 'number', required: true },
      ...wasteFields,
      { id: 'recycling_method', label: 'طريقة التدوير', type: 'text', required: true },
      { id: 'price_per_ton', label: 'السعر لكل طن (ج.م)', type: 'number', required: true },
    ],
  },
  {
    id: 'disposal-contract',
    title: 'عقد تخلص نهائي',
    title_en: 'Final Disposal Contract',
    category: 'contracts',
    description: 'عقد رسمي للتخلص النهائي من المخلفات',
    legal_reference: 'قانون 202/2020 - مادة 27',
    applicable_org_types: ['generator', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'disposer'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'contract_duration', label: 'مدة العقد (شهور)', type: 'number', required: true },
      ...wasteFields,
      { id: 'disposal_method', label: 'طريقة التخلص', type: 'select', required: true, options: ['دفن صحي', 'حرق آمن', 'معالجة كيميائية', 'تثبيت وتغليف'] },
    ],
  },
  {
    id: 'consulting-contract',
    title: 'عقد استشارات بيئية',
    title_en: 'Environmental Consulting Contract',
    category: 'contracts',
    description: 'عقد تقديم خدمات الاستشارات البيئية',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['client', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'contract_duration', label: 'مدة العقد (شهور)', type: 'number', required: true },
      { id: 'scope_of_work', label: 'نطاق العمل', type: 'textarea', required: true },
      { id: 'deliverables', label: 'المخرجات المتوقعة', type: 'textarea', required: true },
      { id: 'total_fees', label: 'إجمالي الأتعاب (ج.م)', type: 'number', required: true },
    ],
  },

  // ═══════════ TRACKING FORMS ═══════════
  {
    id: 'waste-manifest',
    title: 'بيان حمولة المخلفات (مانيفيست)',
    title_en: 'Waste Manifest',
    category: 'tracking_forms',
    description: 'نموذج تتبع رسمي يرافق المخلفات من المولد إلى المستقبل النهائي',
    legal_reference: 'قانون 202/2020 - مادة 18',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'transporter', 'receiver'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'origin_address', label: 'عنوان المصدر', type: 'text', required: true },
      { id: 'destination_address', label: 'عنوان الوجهة', type: 'text', required: true },
      { id: 'vehicle_plate', label: 'رقم لوحة المركبة', type: 'text', required: true },
      { id: 'driver_name', label: 'اسم السائق', type: 'text', required: true },
      { id: 'pickup_date', label: 'تاريخ التحميل', type: 'date', required: true },
      { id: 'delivery_date', label: 'تاريخ التسليم المتوقع', type: 'date', required: true },
    ],
  },
  {
    id: 'hazardous-transport-form',
    title: 'استمارة نقل المخلفات الخطرة',
    title_en: 'Hazardous Waste Transport Form',
    category: 'tracking_forms',
    description: 'استمارة نقل خاصة بالمخلفات الخطرة وفقاً لاتفاقية بازل',
    legal_reference: 'قانون 202/2020 - مادة 21 + اتفاقية بازل',
    applicable_org_types: ['generator', 'transporter', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'transporter', 'receiver'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'un_number', label: 'رقم الأمم المتحدة (UN)', type: 'text', required: true, placeholder: 'UN XXXX' },
      { id: 'packing_group', label: 'مجموعة التعبئة', type: 'select', required: true, options: ['I - خطورة عالية', 'II - خطورة متوسطة', 'III - خطورة منخفضة'] },
      { id: 'emergency_contact', label: 'جهة اتصال الطوارئ', type: 'text', required: true },
      { id: 'special_handling', label: 'تعليمات المناولة الخاصة', type: 'textarea', required: true },
    ],
  },
  {
    id: 'delivery-receipt-form',
    title: 'نموذج تسليم واستلام',
    title_en: 'Delivery & Receipt Form',
    category: 'tracking_forms',
    description: 'نموذج إثبات تسليم واستلام المخلفات بين الأطراف',
    legal_reference: 'قانون 202/2020 - مادة 19',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['sender', 'receiver'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'sender_name', label: 'اسم المُسلِّم', type: 'text', required: true },
      { id: 'receiver_name', label: 'اسم المُستلِم', type: 'text', required: true },
      { id: 'condition_on_receipt', label: 'حالة المخلفات عند الاستلام', type: 'select', required: true, options: ['سليمة', 'تسرب جزئي', 'تلف بالحاوية', 'مختلفة عن الوصف'] },
    ],
  },

  // ═══════════ REGISTERS ═══════════
  {
    id: 'hazardous-waste-register',
    title: 'سجل المخلفات الخطرة',
    title_en: 'Hazardous Waste Register',
    category: 'registers',
    description: 'سجل إلزامي لتوثيق جميع المخلفات الخطرة المولدة والمعالجة',
    legal_reference: 'قانون 202/2020 - مادة 16',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization'],
    requires_multi_sign: false,
    fields: [...commonFields,
      { id: 'register_period', label: 'فترة السجل', type: 'text', required: true, placeholder: 'مثال: يناير 2025' },
    ],
  },
  {
    id: 'non-hazardous-waste-register',
    title: 'سجل المخلفات غير الخطرة',
    title_en: 'Non-Hazardous Waste Register',
    category: 'registers',
    description: 'سجل توثيق المخلفات غير الخطرة المولدة والمعالجة',
    legal_reference: 'قانون 202/2020 - مادة 16',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization'],
    requires_multi_sign: false,
    fields: [...commonFields,
      { id: 'register_period', label: 'فترة السجل', type: 'text', required: true, placeholder: 'مثال: يناير 2025' },
    ],
  },
  {
    id: 'treatment-operations-register',
    title: 'سجل عمليات المعالجة',
    title_en: 'Treatment Operations Register',
    category: 'registers',
    description: 'سجل يوثق جميع عمليات معالجة المخلفات المنفذة',
    legal_reference: 'قانون 202/2020 - مادة 25',
    applicable_org_types: ['recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization'],
    requires_multi_sign: false,
    fields: [...commonFields,
      { id: 'register_period', label: 'فترة السجل', type: 'text', required: true, placeholder: 'مثال: Q1 2025' },
    ],
  },

  // ═══════════ REGULATORY ═══════════
  {
    id: 'waste-notification',
    title: 'نموذج الإخطار عن المخلفات',
    title_en: 'Waste Notification Form',
    category: 'regulatory',
    description: 'نموذج إخطار الجهات الرقابية عن أنواع وكميات المخلفات',
    legal_reference: 'قانون 202/2020 - مادة 10',
    applicable_org_types: ['generator', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields, ...wasteFields,
      { id: 'notification_reason', label: 'سبب الإخطار', type: 'select', required: true, options: ['إخطار دوري', 'تغيير في النشاط', 'زيادة في الكميات', 'نوع مخلفات جديد'] },
    ],
  },
  {
    id: 'license-application',
    title: 'طلب ترخيص نشاط إدارة مخلفات',
    title_en: 'Waste Management License Application',
    category: 'regulatory',
    description: 'نموذج طلب ترخيص لمزاولة نشاط إدارة المخلفات من WMRA',
    legal_reference: 'قانون 202/2020 - مادة 35',
    applicable_org_types: ['transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['applicant'],
    requires_multi_sign: false,
    fields: [...commonFields,
      { id: 'activity_type', label: 'نوع النشاط', type: 'select', required: true, options: ['جمع', 'نقل', 'معالجة', 'تدوير', 'تخلص نهائي'] },
      { id: 'facility_address', label: 'عنوان المنشأة', type: 'text', required: true },
      { id: 'capacity', label: 'الطاقة الاستيعابية (طن/يوم)', type: 'number', required: true },
    ],
  },
  {
    id: 'waste-management-plan',
    title: 'خطة إدارة المخلفات',
    title_en: 'Waste Management Plan',
    category: 'regulatory',
    description: 'خطة شاملة لإدارة المخلفات المطلوبة من كل منشأة مولدة',
    legal_reference: 'قانون 202/2020 - مادة 13',
    applicable_org_types: ['generator', 'consultant', 'consulting_office'],
    required_signatories: ['organization', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'plan_year', label: 'سنة الخطة', type: 'number', required: true },
      { id: 'waste_sources', label: 'مصادر المخلفات', type: 'textarea', required: true },
      { id: 'reduction_targets', label: 'أهداف التقليل', type: 'textarea', required: true },
      { id: 'management_methods', label: 'أساليب الإدارة المقترحة', type: 'textarea', required: true },
    ],
  },
  {
    id: 'initial-env-assessment',
    title: 'نموذج التقييم البيئي المبدئي',
    title_en: 'Initial Environmental Assessment Form',
    category: 'regulatory',
    description: 'نموذج تقييم بيئي مبدئي للمشاريع الجديدة قبل بدء النشاط',
    legal_reference: 'قانون 4/1994 - مادة 19',
    applicable_org_types: ['generator', 'consultant', 'consulting_office'],
    required_signatories: ['applicant', 'consultant'],
    requires_multi_sign: true,
    fields: [...commonFields,
      { id: 'project_name', label: 'اسم المشروع', type: 'text', required: true },
      { id: 'project_category', label: 'تصنيف المشروع', type: 'select', required: true, options: ['القائمة البيضاء (أ)', 'القائمة الرمادية (ب)', 'القائمة السوداء (ج)'] },
      { id: 'project_description', label: 'وصف المشروع والنشاط', type: 'textarea', required: true },
    ],
  },
];

/** Get templates applicable for a specific org type */
export const getTemplatesForOrgType = (orgType: string): RegulatoryTemplate[] => {
  return regulatoryTemplates.filter(t => t.applicable_org_types.includes(orgType));
};

/** Get templates by category */
export const getTemplatesByCategory = (templates: RegulatoryTemplate[]): Record<DocumentCategory, RegulatoryTemplate[]> => {
  const result: Record<DocumentCategory, RegulatoryTemplate[]> = {
    certificates: [],
    reports: [],
    contracts: [],
    tracking_forms: [],
    registers: [],
    regulatory: [],
  };
  templates.forEach(t => result[t.category].push(t));
  return result;
};
