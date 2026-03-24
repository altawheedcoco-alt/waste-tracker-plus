/**
 * تكوين الحقول الديناميكية لكل نوع جهة
 * يحدد أي الحقول تظهر، ما هو إلزامي، والـ label المناسب لكل نوع
 */

export interface FieldConfig {
  /** المفتاح في CompanyFormData */
  key: string;
  /** التسمية بالعربية */
  label: string;
  /** placeholder */
  placeholder: string;
  /** إلزامي أم اختياري */
  required: boolean;
  /** نوع الحقل */
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  /** اتجاه الكتابة */
  dir?: 'ltr' | 'rtl';
  /** inputMode */
  inputMode?: 'tel' | 'email' | 'text' | 'numeric';
  /** maxLength */
  maxLength?: number;
  /** خيارات (لحقول select) */
  options?: { value: string; label: string }[];
  /** عرض كامل col-span-2 */
  fullWidth?: boolean;
  /** مجموعة الحقل */
  group: 'org_info' | 'legal' | 'representative' | 'login' | 'activity';
}

type OrgFieldsMap = Record<string, FieldConfig[]>;

// ====== الحقول المشتركة لجميع الجهات ======
const commonOrgFields: FieldConfig[] = [
  { key: 'organizationName', label: 'اسم الشركة', placeholder: 'أدخل اسم الشركة', required: true, maxLength: 200, group: 'org_info' },
  { key: 'organizationPhone', label: 'الهاتف', placeholder: 'رقم الهاتف', required: true, dir: 'ltr', inputMode: 'tel', maxLength: 20, group: 'org_info' },
  { key: 'organizationEmail', label: 'البريد الإلكتروني', placeholder: 'البريد الإلكتروني', required: true, type: 'email', dir: 'ltr', maxLength: 255, group: 'org_info' },
  { key: 'representativeName', label: 'الشخص المسؤول', placeholder: 'اسم الشخص المسؤول', required: true, maxLength: 100, group: 'representative' },
  { key: 'commercialRegister', label: 'السجل التجاري', placeholder: 'رقم السجل التجاري', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'address', label: 'العنوان', placeholder: 'العنوان الكامل', required: true, maxLength: 500, fullWidth: true, group: 'org_info' },
];

// ====== الحقول الخاصة بكل نوع ======

const transporterFields: FieldConfig[] = [
  ...commonOrgFields,
  // حقول قانونية خاصة بالناقل
  { key: 'environmentalLicense', label: 'رقم ترخيص النقل', placeholder: 'رقم ترخيص نقل المخلفات', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  // حقول تشغيلية خاصة بالناقل
  { key: 'productionCapacity', label: 'عدد المركبات', placeholder: 'عدد مركبات الأسطول', required: false, dir: 'ltr', inputMode: 'numeric', maxLength: 10, group: 'activity' },
  { key: 'region', label: 'منطقة التغطية الجغرافية', placeholder: 'مثال: القاهرة الكبرى، الدلتا', required: false, maxLength: 100, group: 'activity' },
  { key: 'activityType', label: 'أنواع المخلفات المنقولة', placeholder: 'مثال: مخلفات صناعية، طبية، خطرة...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const generatorFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'رقم الترخيص البيئي', placeholder: 'رقم الترخيص البيئي', required: false, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'region', label: 'رقم الموافقة البيئية', placeholder: 'رقم الموافقة البيئية', required: false, dir: 'ltr', maxLength: 100, group: 'legal' },
  { key: 'productionCapacity', label: 'الطاقة الإنتاجية', placeholder: 'الطاقة الإنتاجية (طن/شهر)', required: false, dir: 'ltr', maxLength: 100, group: 'activity' },
  { key: 'activityType', label: 'النشاط المسجل', placeholder: 'وصف النشاط المسجل للشركة', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const recyclerFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'ترخيص إعادة التدوير', placeholder: 'رقم ترخيص إعادة التدوير', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'region', label: 'رقم الموافقة البيئية', placeholder: 'رقم الموافقة البيئية', required: false, dir: 'ltr', maxLength: 100, group: 'legal' },
  { key: 'productionCapacity', label: 'الطاقة الإنتاجية للمصنع', placeholder: 'طن/شهر', required: false, dir: 'ltr', maxLength: 100, group: 'activity' },
  { key: 'activityType', label: 'أنواع المخلفات المُعاد تدويرها', placeholder: 'مثال: بلاستيك، ورق، معادن...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const disposalFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'ترخيص التخلص الآمن', placeholder: 'رقم ترخيص التخلص الآمن', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'region', label: 'رقم الموافقة البيئية', placeholder: 'رقم الموافقة البيئية', required: false, dir: 'ltr', maxLength: 100, group: 'legal' },
  { key: 'productionCapacity', label: 'السعة الاستيعابية', placeholder: 'السعة الاستيعابية (طن)', required: false, dir: 'ltr', maxLength: 100, group: 'activity' },
  { key: 'activityType', label: 'طرق التخلص المعتمدة', placeholder: 'مثال: دفن صحي، حرق آمن...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const transportOfficeFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'ترخيص مكتب النقل', placeholder: 'رقم ترخيص مكتب النقل', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'productionCapacity', label: 'عدد المركبات', placeholder: 'عدد مركبات الأسطول', required: false, dir: 'ltr', inputMode: 'numeric', maxLength: 10, group: 'activity' },
  { key: 'region', label: 'منطقة التغطية', placeholder: 'مناطق التغطية الجغرافية', required: false, maxLength: 100, group: 'activity' },
  { key: 'activityType', label: 'أنواع النقل', placeholder: 'مثال: نقل مخلفات صناعية، طبية...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const consultantFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'رقم قيد الاستشاري', placeholder: 'رقم القيد بالسجل البيئي', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'الرقم القومي', placeholder: 'الرقم القومي للاستشاري', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'activityType', label: 'التخصصات البيئية', placeholder: 'مثال: تقييم أثر بيئي، إدارة مخلفات...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const consultingOfficeFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'ترخيص المكتب الاستشاري', placeholder: 'رقم ترخيص المكتب', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'productionCapacity', label: 'عدد الاستشاريين', placeholder: 'عدد الاستشاريين المسجلين', required: false, dir: 'ltr', inputMode: 'numeric', maxLength: 10, group: 'activity' },
  { key: 'activityType', label: 'مجالات الاستشارات', placeholder: 'مثال: بيئة، سلامة، جودة...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

const isoBodyFields: FieldConfig[] = [
  ...commonOrgFields,
  { key: 'environmentalLicense', label: 'رقم اعتماد الجهة', placeholder: 'رقم اعتماد جهة المنح', required: true, dir: 'ltr', maxLength: 50, group: 'legal' },
  { key: 'representativeNationalId', label: 'البطاقة الضريبية', placeholder: 'رقم البطاقة الضريبية', required: false, dir: 'ltr', maxLength: 20, group: 'legal' },
  { key: 'activityType', label: 'شهادات ISO المعتمدة', placeholder: 'مثال: ISO 14001, ISO 9001...', required: false, type: 'textarea', maxLength: 500, fullWidth: true, group: 'activity' },
];

export const orgTypeFieldsMap: OrgFieldsMap = {
  transporter: transporterFields,
  generator: generatorFields,
  recycler: recyclerFields,
  disposal: disposalFields,
  transport_office: transportOfficeFields,
  consultant: consultantFields,
  consulting_office: consultingOfficeFields,
  iso_body: isoBodyFields,
};

/**
 * يرجع الحقول المناسبة لنوع الجهة
 * إذا لم يكن النوع معرفاً يرجع حقول المولد كافتراضي
 */
export const getFieldsForOrgType = (orgType: string): FieldConfig[] => {
  return orgTypeFieldsMap[orgType] || generatorFields;
};

/**
 * يرجع الحقول الإلزامية فقط لنوع معين
 */
export const getRequiredFieldKeys = (orgType: string): string[] => {
  return getFieldsForOrgType(orgType)
    .filter(f => f.required)
    .map(f => f.key);
};
