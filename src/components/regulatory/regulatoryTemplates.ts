/**
 * Regulatory Document Templates per Egyptian Environmental Law 202/2020,
 * Law 4/1994, and WMRA regulations.
 * Enhanced with detailed sections and system data integration
 */

export type DocumentCategory = 
  | 'certificates'
  | 'reports'
  | 'contracts'
  | 'tracking_forms'
  | 'registers'
  | 'regulatory';

export interface TemplateField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
  /** Can this field be auto-filled from system data? */
  systemSource?: 'organization' | 'shipment' | 'contract' | 'driver' | 'partner';
  /** Hint about what system data maps to this field */
  systemField?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  title_en: string;
  icon?: string;
  fields: TemplateField[];
}

export interface RegulatoryTemplate {
  id: string;
  title: string;
  title_en: string;
  category: DocumentCategory;
  description: string;
  /** Detailed description for expanded view */
  detailed_description?: string;
  legal_reference?: string;
  /** Specific legal articles */
  legal_articles?: { article: string; summary: string }[];
  /** Org types that can issue this document */
  applicable_org_types: string[];
  /** Roles required to sign */
  required_signatories: string[];
  /** Fields the user must fill (flat legacy) */
  fields: TemplateField[];
  /** Grouped sections for expanded view */
  sections?: TemplateSection[];
  /** Is this a multi-party document */
  requires_multi_sign: boolean;
  /** Document importance level */
  importance?: 'critical' | 'high' | 'medium' | 'low';
  /** Renewal period */
  renewal_period?: string;
  /** Penalties for non-compliance */
  penalty_note?: string;
  /** Related template IDs */
  related_templates?: string[];
  /** Required attachments */
  required_attachments?: string[];
}

const commonFields: TemplateField[] = [
  { id: 'reference_number', label: 'رقم المرجع', type: 'text', required: true, placeholder: 'يتم توليده تلقائياً' },
  { id: 'issue_date', label: 'تاريخ الإصدار', type: 'date', required: true },
  { id: 'notes', label: 'ملاحظات', type: 'textarea', required: false, placeholder: 'ملاحظات إضافية...' },
];

const wasteFields: TemplateField[] = [
  { id: 'waste_type', label: 'نوع المخلفات', type: 'select', required: true, options: ['خطرة', 'غير خطرة', 'طبية', 'إلكترونية', 'بناء وهدم', 'بلدية'] },
  { id: 'waste_description', label: 'وصف المخلفات', type: 'textarea', required: true, placeholder: 'وصف تفصيلي للمخلفات...' },
  { id: 'quantity', label: 'الكمية (طن)', type: 'number', required: true, systemSource: 'shipment', systemField: 'quantity' },
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
    detailed_description: 'تُصدر هذه الشهادة عند إتمام عملية التخلص الآمن من المخلفات وفقاً للمعايير البيئية المصرية. تُعد دليلاً قانونياً على الامتثال البيئي وتحمي المولد من المسؤولية القانونية بعد التسليم.',
    legal_reference: 'قانون 202/2020 - مادة 27',
    legal_articles: [
      { article: 'مادة 27', summary: 'يجب على منشآت التخلص إصدار شهادة تثبت التخلص الآمن' },
      { article: 'مادة 28', summary: 'يتحمل المولد المسؤولية حتى إتمام التخلص الآمن' },
    ],
    applicable_org_types: ['disposal', 'recycler', 'consultant', 'consulting_office'],
    required_signatories: ['issuer', 'generator', 'disposer'],
    requires_multi_sign: true,
    importance: 'critical',
    penalty_note: 'غرامة من 100,000 إلى 2,000,000 ج.م في حالة التخلص غير الآمن (مادة 72)',
    related_templates: ['waste-manifest', 'delivery-receipt-form'],
    required_attachments: ['تحليل مختبري للمخلفات', 'صور عملية التخلص', 'تقرير الرصد البيئي'],
    sections: [
      {
        id: 'basic_info',
        title: 'البيانات الأساسية',
        title_en: 'Basic Information',
        icon: '📋',
        fields: commonFields,
      },
      {
        id: 'waste_info',
        title: 'بيانات المخلفات',
        title_en: 'Waste Information',
        icon: '♻️',
        fields: [
          ...wasteFields,
          { id: 'ewc_code', label: 'كود EWC', type: 'text', required: false, placeholder: 'XX XX XX' },
          { id: 'physical_state', label: 'الحالة الفيزيائية', type: 'select', required: true, options: ['صلبة', 'سائلة', 'شبه صلبة', 'غازية', 'حمأة'] },
        ],
      },
      {
        id: 'disposal_info',
        title: 'بيانات التخلص',
        title_en: 'Disposal Details',
        icon: '🏭',
        fields: [
          { id: 'disposal_method', label: 'طريقة التخلص', type: 'select', required: true, options: ['دفن صحي', 'حرق آمن', 'معالجة كيميائية', 'معالجة بيولوجية', 'تثبيت وتغليف'] },
          { id: 'disposal_facility', label: 'منشأة التخلص', type: 'text', required: true, systemSource: 'partner', systemField: 'name' },
          { id: 'disposal_date', label: 'تاريخ التخلص', type: 'date', required: true },
          { id: 'disposal_location', label: 'موقع التخلص', type: 'text', required: true, systemSource: 'partner', systemField: 'address' },
          { id: 'environmental_monitoring', label: 'نتائج الرصد البيئي', type: 'textarea', required: false, placeholder: 'نتائج فحص التربة والمياه الجوفية...' },
        ],
      },
      {
        id: 'parties_info',
        title: 'بيانات الأطراف',
        title_en: 'Parties Information',
        icon: '👥',
        fields: [
          { id: 'generator_name', label: 'اسم المولد', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
          { id: 'generator_license', label: 'رقم ترخيص المولد', type: 'text', required: false, systemSource: 'organization', systemField: 'environmental_license' },
          { id: 'disposer_name', label: 'اسم جهة التخلص', type: 'text', required: true, systemSource: 'partner', systemField: 'name' },
          { id: 'disposer_license', label: 'رقم ترخيص جهة التخلص', type: 'text', required: true },
          { id: 'transporter_name', label: 'اسم الناقل', type: 'text', required: false, systemSource: 'partner', systemField: 'name' },
        ],
      },
    ],
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
    detailed_description: 'شهادة رسمية تمنح بعد اجتياز تدقيق شامل يثبت تطبيق نظام إدارة بيئية متكامل وفق المعايير الدولية.',
    legal_reference: 'قانون 4/1994 - باب ثاني',
    importance: 'high',
    renewal_period: 'سنوياً',
    related_templates: ['compliance-cert', 'self-monitoring-report'],
    required_attachments: ['تقرير التدقيق', 'سياسة الإدارة البيئية', 'خطة الطوارئ'],
    applicable_org_types: ['generator', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['consultant', 'organization'],
    requires_multi_sign: true,
    sections: [
      {
        id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋',
        fields: commonFields,
      },
      {
        id: 'cert_details', title: 'تفاصيل الشهادة', title_en: 'Certificate Details', icon: '🏅',
        fields: [
          { id: 'scope', label: 'نطاق الشهادة', type: 'textarea', required: true, placeholder: 'النطاق الذي تغطيه الشهادة...' },
          { id: 'validity_months', label: 'مدة الصلاحية (شهور)', type: 'number', required: true },
          { id: 'standard', label: 'المعيار المرجعي', type: 'select', required: true, options: ['ISO 14001:2015', 'ISO 45001:2018', 'معايير WMRA', 'معايير وزارة البيئة'] },
          { id: 'audit_team', label: 'فريق التدقيق', type: 'text', required: false },
          { id: 'findings_count', label: 'عدد الملاحظات', type: 'number', required: false },
          { id: 'corrective_deadline', label: 'مهلة الإجراءات التصحيحية', type: 'date', required: false },
        ],
      },
      {
        id: 'org_info', title: 'بيانات المنشأة', title_en: 'Organization Info', icon: '🏢',
        fields: [
          { id: 'org_name', label: 'اسم المنشأة', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
          { id: 'org_address', label: 'عنوان المنشأة', type: 'text', required: true, systemSource: 'organization', systemField: 'address' },
          { id: 'org_license', label: 'رقم الترخيص البيئي', type: 'text', required: false, systemSource: 'organization', systemField: 'environmental_license' },
          { id: 'org_commercial_reg', label: 'رقم السجل التجاري', type: 'text', required: false, systemSource: 'organization', systemField: 'commercial_register' },
          { id: 'org_activity', label: 'النشاط الرئيسي', type: 'text', required: true },
          { id: 'employees_count', label: 'عدد الموظفين', type: 'number', required: false },
        ],
      },
    ],
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
    detailed_description: 'تُصدر بعد مراجعة شاملة لأداء المنشأة البيئي وتأكيد التزامها بجميع الاشتراطات والتراخيص البيئية السارية.',
    legal_reference: 'قانون 202/2020 - مادة 12',
    importance: 'critical',
    renewal_period: 'سنوياً',
    penalty_note: 'يترتب على عدم الامتثال غرامات وإيقاف النشاط (مادة 65-72)',
    related_templates: ['self-monitoring-report', 'env-management-cert'],
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['consultant', 'organization'],
    requires_multi_sign: true,
    sections: [
      {
        id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋',
        fields: commonFields,
      },
      {
        id: 'compliance_details', title: 'تفاصيل الامتثال', title_en: 'Compliance Details', icon: '✅',
        fields: [
          { id: 'compliance_level', label: 'مستوى الامتثال', type: 'select', required: true, options: ['امتثال كامل', 'امتثال جزئي', 'يحتاج تحسين'] },
          { id: 'audit_date', label: 'تاريخ التدقيق', type: 'date', required: true },
          { id: 'auditor_name', label: 'اسم المدقق', type: 'text', required: false },
          { id: 'non_conformities', label: 'عدد حالات عدم المطابقة', type: 'number', required: false },
          { id: 'major_findings', label: 'الملاحظات الرئيسية', type: 'textarea', required: false },
          { id: 'corrective_plan', label: 'خطة الإجراءات التصحيحية', type: 'textarea', required: false },
        ],
      },
      {
        id: 'org_info', title: 'بيانات المنشأة', title_en: 'Organization Info', icon: '🏢',
        fields: [
          { id: 'org_name', label: 'اسم المنشأة', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
          { id: 'org_address', label: 'عنوان المنشأة', type: 'text', required: true, systemSource: 'organization', systemField: 'address' },
          { id: 'org_license', label: 'رقم الترخيص البيئي', type: 'text', required: false, systemSource: 'organization', systemField: 'environmental_license' },
        ],
      },
    ],
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
    detailed_description: 'تحدد التصنيف الدقيق للمخلفات وفق الأكواد الدولية والمحلية، وتعد أساسية لتحديد طرق النقل والمعالجة والتخلص المناسبة.',
    legal_reference: 'قانون 202/2020 - مادة 5',
    importance: 'high',
    required_attachments: ['تقرير التحليل المختبري', 'صحيفة بيانات السلامة (MSDS)'],
    applicable_org_types: ['generator', 'recycler', 'consultant', 'consulting_office'],
    required_signatories: ['classifier', 'generator'],
    requires_multi_sign: true,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'classification', title: 'بيانات التصنيف', title_en: 'Classification', icon: '🔬',
        fields: [
          ...wasteFields,
          { id: 'ewc_code', label: 'كود EWC', type: 'text', required: true, placeholder: 'XX XX XX' },
          { id: 'hazard_class', label: 'فئة الخطورة', type: 'select', required: false, options: ['H1 متفجرة', 'H3 قابلة للاشتعال', 'H5 ضارة', 'H6 سامة', 'H8 أكّالة', 'H10 ماسخة', 'H11 سامة للجينات', 'H12 بيئية', 'غير خطرة'] },
          { id: 'physical_state', label: 'الحالة الفيزيائية', type: 'select', required: true, options: ['صلبة', 'سائلة', 'شبه صلبة', 'غازية', 'حمأة'] },
          { id: 'chemical_composition', label: 'التركيب الكيميائي', type: 'textarea', required: false, placeholder: 'المكونات الرئيسية...' },
          { id: 'un_number', label: 'رقم الأمم المتحدة (UN)', type: 'text', required: false, placeholder: 'UN XXXX' },
        ],
      },
      {
        id: 'source_info', title: 'بيانات المصدر', title_en: 'Source Info', icon: '🏭',
        fields: [
          { id: 'source_process', label: 'العملية المولدة', type: 'text', required: true },
          { id: 'generation_rate', label: 'معدل التولد (طن/شهر)', type: 'number', required: false },
          { id: 'storage_method', label: 'طريقة التخزين', type: 'text', required: false },
          { id: 'org_name', label: 'اسم المنشأة المولدة', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
        ],
      },
    ],
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
    detailed_description: 'توثق إتمام عملية المعالجة بنجاح وتشمل تفاصيل المدخلات والمخرجات ونسبة الاسترداد.',
    legal_reference: 'قانون 202/2020 - مادة 30',
    importance: 'high',
    required_attachments: ['تقرير نتائج المعالجة', 'صور المخرجات', 'تقرير جودة المخرجات'],
    applicable_org_types: ['recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['treater', 'generator'],
    requires_multi_sign: true,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'treatment', title: 'تفاصيل المعالجة', title_en: 'Treatment Details', icon: '⚙️',
        fields: [
          ...wasteFields,
          { id: 'treatment_method', label: 'طريقة المعالجة', type: 'select', required: true, options: ['إعادة تدوير', 'معالجة حرارية', 'معالجة كيميائية', 'معالجة بيولوجية', 'فصل وفرز'] },
          { id: 'treatment_start', label: 'تاريخ بدء المعالجة', type: 'date', required: true },
          { id: 'treatment_end', label: 'تاريخ انتهاء المعالجة', type: 'date', required: true },
        ],
      },
      {
        id: 'output', title: 'المخرجات', title_en: 'Output', icon: '📦',
        fields: [
          { id: 'output_description', label: 'وصف المخرجات', type: 'textarea', required: true },
          { id: 'recovery_rate', label: 'نسبة الاسترداد (%)', type: 'number', required: false },
          { id: 'residuals_quantity', label: 'كمية المتبقيات (طن)', type: 'number', required: false },
          { id: 'residuals_disposal', label: 'طريقة التخلص من المتبقيات', type: 'text', required: false },
          { id: 'quality_test', label: 'نتائج فحص الجودة', type: 'textarea', required: false },
        ],
      },
    ],
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
    detailed_description: 'يشمل رصد الانبعاثات الهوائية ومياه الصرف والضوضاء والمخلفات الصلبة وفقاً لخطة الرصد المعتمدة.',
    legal_reference: 'قانون 4/1994 - مادة 22',
    importance: 'high',
    renewal_period: 'ربع سنوي',
    penalty_note: 'عدم تقديم التقرير يعرض المنشأة للإنذار ثم الإيقاف',
    applicable_org_types: ['generator', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization', 'consultant'],
    requires_multi_sign: true,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'monitoring', title: 'بيانات الرصد', title_en: 'Monitoring Data', icon: '📊',
        fields: [
          { id: 'monitoring_period', label: 'فترة الرصد', type: 'text', required: true, placeholder: 'مثال: يناير - مارس 2025' },
          { id: 'parameters_monitored', label: 'المعاملات المرصودة', type: 'textarea', required: true, placeholder: 'انبعاثات هوائية، مياه صرف، ضوضاء...' },
          { id: 'sampling_method', label: 'طريقة أخذ العينات', type: 'text', required: false },
          { id: 'lab_name', label: 'المعمل المعتمد', type: 'text', required: false },
        ],
      },
      {
        id: 'results', title: 'النتائج والتوصيات', title_en: 'Results', icon: '📈',
        fields: [
          { id: 'results_summary', label: 'ملخص النتائج', type: 'textarea', required: true },
          { id: 'exceedances', label: 'التجاوزات المرصودة', type: 'textarea', required: false, placeholder: 'أي تجاوزات للحدود المسموحة...' },
          { id: 'corrective_actions', label: 'الإجراءات التصحيحية', type: 'textarea', required: false },
          { id: 'recommendations', label: 'التوصيات', type: 'textarea', required: false },
        ],
      },
    ],
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
    detailed_description: 'يوثق جميع عمليات إدارة المخلفات خلال الربع المالي بما يشمل الكميات والأنواع وطرق المعالجة والتخلص.',
    legal_reference: 'قانون 202/2020 - مادة 15',
    importance: 'high',
    renewal_period: 'ربع سنوي',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization'],
    requires_multi_sign: false,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'period', title: 'الفترة والكميات', title_en: 'Period & Quantities', icon: '📊',
        fields: [
          { id: 'quarter', label: 'الربع', type: 'select', required: true, options: ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'] },
          { id: 'year', label: 'السنة', type: 'number', required: true },
          { id: 'total_generated', label: 'إجمالي المخلفات المولدة (طن)', type: 'number', required: true, systemSource: 'shipment', systemField: 'total_quantity' },
          { id: 'total_recycled', label: 'إجمالي المخلفات المدورة (طن)', type: 'number', required: false },
          { id: 'total_disposed', label: 'إجمالي المخلفات المتخلص منها (طن)', type: 'number', required: false },
          { id: 'total_stored', label: 'إجمالي المخلفات المخزنة (طن)', type: 'number', required: false },
        ],
      },
      {
        id: 'breakdown', title: 'تفصيل حسب النوع', title_en: 'Breakdown by Type', icon: '📂',
        fields: [
          { id: 'hazardous_qty', label: 'مخلفات خطرة (طن)', type: 'number', required: false },
          { id: 'non_hazardous_qty', label: 'مخلفات غير خطرة (طن)', type: 'number', required: false },
          { id: 'medical_qty', label: 'مخلفات طبية (طن)', type: 'number', required: false },
          { id: 'electronic_qty', label: 'مخلفات إلكترونية (طن)', type: 'number', required: false },
          { id: 'construction_qty', label: 'مخلفات بناء وهدم (طن)', type: 'number', required: false },
          { id: 'comparison_notes', label: 'مقارنة بالربع السابق', type: 'textarea', required: false },
        ],
      },
    ],
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
    importance: 'critical',
    penalty_note: 'عدم الإبلاغ الفوري عن الحوادث يضاعف العقوبة',
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['organization', 'consultant'],
    requires_multi_sign: true,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'incident', title: 'تفاصيل الحادث', title_en: 'Incident Details', icon: '⚠️',
        fields: [
          { id: 'incident_date', label: 'تاريخ الحادث', type: 'date', required: true },
          { id: 'incident_time', label: 'وقت الحادث', type: 'text', required: false, placeholder: 'HH:MM' },
          { id: 'incident_type', label: 'نوع الحادث', type: 'select', required: true, options: ['تسرب مواد خطرة', 'تلوث هوائي', 'تلوث مائي', 'تلوث تربة', 'حريق', 'انفجار', 'أخرى'] },
          { id: 'incident_location', label: 'موقع الحادث', type: 'text', required: true },
          { id: 'incident_description', label: 'وصف الحادث', type: 'textarea', required: true },
          { id: 'affected_area', label: 'المنطقة المتأثرة', type: 'text', required: false },
          { id: 'casualties', label: 'الإصابات', type: 'text', required: false, placeholder: '0' },
        ],
      },
      {
        id: 'response', title: 'الاستجابة والإجراءات', title_en: 'Response', icon: '🚨',
        fields: [
          { id: 'immediate_actions', label: 'الإجراءات الفورية', type: 'textarea', required: true },
          { id: 'corrective_actions', label: 'الإجراءات التصحيحية', type: 'textarea', required: true },
          { id: 'preventive_measures', label: 'إجراءات منع التكرار', type: 'textarea', required: false },
          { id: 'authorities_notified', label: 'الجهات التي تم إخطارها', type: 'text', required: false },
          { id: 'estimated_damage', label: 'الأضرار المقدرة (ج.م)', type: 'number', required: false },
        ],
      },
    ],
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
    importance: 'critical',
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
    importance: 'critical',
    renewal_period: 'سنوياً',
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
    detailed_description: 'عقد ملزم قانوناً ينظم عملية نقل المخلفات بين المولد والناقل. يشمل الكميات والتكرار والأسعار والمسؤوليات.',
    legal_reference: 'قانون 202/2020 - مادة 20',
    importance: 'critical',
    penalty_note: 'النقل بدون عقد مرخص: غرامة 50,000 - 500,000 ج.م',
    applicable_org_types: ['generator', 'transporter', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'transporter'],
    requires_multi_sign: true,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'contract_terms', title: 'شروط العقد', title_en: 'Contract Terms', icon: '📄',
        fields: [
          { id: 'contract_duration', label: 'مدة العقد (شهور)', type: 'number', required: true },
          { id: 'start_date', label: 'تاريخ البدء', type: 'date', required: true },
          { id: 'end_date', label: 'تاريخ الانتهاء', type: 'date', required: false },
          { id: 'auto_renew', label: 'تجديد تلقائي', type: 'select', required: false, options: ['نعم', 'لا'] },
          { id: 'termination_notice', label: 'مدة إشعار الإنهاء (أيام)', type: 'number', required: false },
        ],
      },
      {
        id: 'waste_details', title: 'تفاصيل المخلفات والنقل', title_en: 'Waste & Transport', icon: '🚛',
        fields: [
          ...wasteFields,
          { id: 'transport_frequency', label: 'تكرار النقل', type: 'select', required: true, options: ['يومي', 'أسبوعي', 'نصف شهري', 'شهري', 'حسب الطلب'] },
          { id: 'pickup_address', label: 'عنوان التحميل', type: 'text', required: true, systemSource: 'organization', systemField: 'address' },
          { id: 'delivery_address', label: 'عنوان التسليم', type: 'text', required: true },
          { id: 'vehicle_requirements', label: 'متطلبات المركبات', type: 'text', required: false },
        ],
      },
      {
        id: 'financial', title: 'البيانات المالية', title_en: 'Financial', icon: '💰',
        fields: [
          { id: 'price_per_ton', label: 'السعر لكل طن (ج.م)', type: 'number', required: true },
          { id: 'minimum_monthly', label: 'الحد الأدنى الشهري (طن)', type: 'number', required: false },
          { id: 'payment_terms', label: 'شروط الدفع', type: 'select', required: false, options: ['فوري', 'أسبوعي', 'شهري', 'ربع سنوي'] },
          { id: 'penalty_clause', label: 'شرط الغرامة', type: 'textarea', required: false },
        ],
      },
      {
        id: 'parties', title: 'بيانات الأطراف', title_en: 'Parties', icon: '👥',
        fields: [
          { id: 'generator_name', label: 'اسم المولد', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
          { id: 'generator_commercial_reg', label: 'سجل تجاري المولد', type: 'text', required: false, systemSource: 'organization', systemField: 'commercial_register' },
          { id: 'transporter_name', label: 'اسم الناقل', type: 'text', required: true, systemSource: 'partner', systemField: 'name' },
          { id: 'transporter_license', label: 'ترخيص الناقل', type: 'text', required: true },
          { id: 'representative_generator', label: 'ممثل المولد', type: 'text', required: false, systemSource: 'organization', systemField: 'representative_name' },
          { id: 'representative_transporter', label: 'ممثل الناقل', type: 'text', required: false },
        ],
      },
    ],
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
    importance: 'high',
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
    importance: 'high',
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
    importance: 'medium',
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
    detailed_description: 'يعد المانيفيست الوثيقة الأساسية لسلسلة الحيازة، ويجب أن يرافق كل شحنة مخلفات من نقطة المصدر إلى الوجهة النهائية.',
    legal_reference: 'قانون 202/2020 - مادة 18',
    importance: 'critical',
    penalty_note: 'نقل مخلفات بدون مانيفيست: غرامة 20,000 - 200,000 ج.م',
    required_attachments: ['بطاقة الشحنة', 'صورة تذكرة الميزان'],
    applicable_org_types: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['generator', 'transporter', 'receiver'],
    requires_multi_sign: true,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'shipment', title: 'بيانات الشحنة', title_en: 'Shipment', icon: '🚛',
        fields: [
          ...wasteFields,
          { id: 'shipment_number', label: 'رقم الشحنة', type: 'text', required: false, systemSource: 'shipment', systemField: 'shipment_number' },
          { id: 'origin_address', label: 'عنوان المصدر', type: 'text', required: true, systemSource: 'shipment', systemField: 'pickup_address' },
          { id: 'destination_address', label: 'عنوان الوجهة', type: 'text', required: true, systemSource: 'shipment', systemField: 'delivery_address' },
        ],
      },
      {
        id: 'transport', title: 'بيانات النقل', title_en: 'Transport', icon: '🚗',
        fields: [
          { id: 'vehicle_plate', label: 'رقم لوحة المركبة', type: 'text', required: true, systemSource: 'driver', systemField: 'vehicle_plate' },
          { id: 'driver_name', label: 'اسم السائق', type: 'text', required: true, systemSource: 'driver', systemField: 'profile.full_name' },
          { id: 'driver_license', label: 'رقم رخصة السائق', type: 'text', required: false, systemSource: 'driver', systemField: 'license_number' },
          { id: 'pickup_date', label: 'تاريخ التحميل', type: 'date', required: true },
          { id: 'delivery_date', label: 'تاريخ التسليم المتوقع', type: 'date', required: true },
        ],
      },
      {
        id: 'parties', title: 'بيانات الأطراف', title_en: 'Parties', icon: '👥',
        fields: [
          { id: 'generator_name', label: 'اسم المولد', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
          { id: 'transporter_name', label: 'اسم الناقل', type: 'text', required: true, systemSource: 'partner', systemField: 'name' },
          { id: 'receiver_name', label: 'اسم المستقبل', type: 'text', required: true, systemSource: 'partner', systemField: 'name' },
        ],
      },
    ],
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
    importance: 'critical',
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
    importance: 'high',
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
    importance: 'critical',
    renewal_period: 'شهري',
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
    importance: 'high',
    renewal_period: 'شهري',
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
    importance: 'high',
    renewal_period: 'ربع سنوي',
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
    importance: 'high',
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
    importance: 'critical',
    required_attachments: ['صورة السجل التجاري', 'صورة البطاقة الضريبية', 'دراسة الأثر البيئي', 'رسم هندسي للمنشأة'],
    applicable_org_types: ['transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'],
    required_signatories: ['applicant'],
    requires_multi_sign: false,
    sections: [
      { id: 'basic_info', title: 'البيانات الأساسية', title_en: 'Basic Info', icon: '📋', fields: commonFields },
      {
        id: 'activity', title: 'بيانات النشاط', title_en: 'Activity Details', icon: '🏭',
        fields: [
          { id: 'activity_type', label: 'نوع النشاط', type: 'select', required: true, options: ['جمع', 'نقل', 'معالجة', 'تدوير', 'تخلص نهائي'] },
          { id: 'waste_types_handled', label: 'أنواع المخلفات المراد التعامل معها', type: 'textarea', required: true },
          { id: 'facility_address', label: 'عنوان المنشأة', type: 'text', required: true, systemSource: 'organization', systemField: 'address' },
          { id: 'capacity', label: 'الطاقة الاستيعابية (طن/يوم)', type: 'number', required: true },
          { id: 'equipment_list', label: 'قائمة المعدات', type: 'textarea', required: false },
          { id: 'staff_count', label: 'عدد العمالة المتخصصة', type: 'number', required: false },
        ],
      },
      {
        id: 'applicant_info', title: 'بيانات مقدم الطلب', title_en: 'Applicant Info', icon: '👤',
        fields: [
          { id: 'applicant_name', label: 'اسم مقدم الطلب', type: 'text', required: true, systemSource: 'organization', systemField: 'representative_name' },
          { id: 'org_name', label: 'اسم المنشأة', type: 'text', required: true, systemSource: 'organization', systemField: 'name' },
          { id: 'commercial_reg', label: 'رقم السجل التجاري', type: 'text', required: true, systemSource: 'organization', systemField: 'commercial_register' },
          { id: 'contact_phone', label: 'رقم التواصل', type: 'text', required: true, systemSource: 'organization', systemField: 'phone' },
          { id: 'contact_email', label: 'البريد الإلكتروني', type: 'text', required: false, systemSource: 'organization', systemField: 'email' },
        ],
      },
    ],
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
    importance: 'high',
    renewal_period: 'سنوياً',
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
    importance: 'high',
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
