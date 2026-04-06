/**
 * خريطة السياق الصفحي للمساعد الصوتي
 * يحدد لكل صفحة: الإجراءات المتاحة، الحقول المطلوبة، والسلوك الاستباقي
 */

export interface PageField {
  name: string;
  labelAr: string;
  type: 'text' | 'select' | 'number' | 'date' | 'boolean' | 'search';
  required: boolean;
  /** وصف يساعد الذكاء الاصطناعي يفهم الحقل */
  hint?: string;
}

export interface PageAction {
  id: string;
  labelAr: string;
  /** الحقول المطلوبة لتنفيذ هذا الإجراء */
  fields: PageField[];
  /** رسالة استباقية يقولها المساعد */
  proactivePrompt: string;
}

export interface PageContext {
  /** وصف الصفحة */
  descriptionAr: string;
  /** الإجراءات المتاحة */
  actions: PageAction[];
  /** رسالة ترحيب استباقية */
  welcomePrompt: string;
  /** الأدوار المسموح لها */
  allowedRoles?: string[];
}

// ═══════════════════════════════════════════════════════════
// حقول مشتركة
// ═══════════════════════════════════════════════════════════
const SHIPMENT_FIELDS: PageField[] = [
  { name: 'generator_id', labelAr: 'الجهة المولّدة', type: 'search', required: true, hint: 'ابحث بالاسم عن المولد' },
  { name: 'destination_id', labelAr: 'جهة الوجهة (مدوّر أو تخلص)', type: 'search', required: true, hint: 'مدور أو موقع تخلص' },
  { name: 'destination_type', labelAr: 'نوع الوجهة', type: 'select', required: true, hint: 'مدوّر recycler أو تخلص disposal' },
  { name: 'waste_type', labelAr: 'نوع المخلفات', type: 'search', required: true, hint: 'بلاستيك، ورق، حديد، إلخ' },
  { name: 'estimated_weight', labelAr: 'الوزن التقديري', type: 'number', required: true, hint: 'بالطن أو الكيلو' },
  { name: 'weight_unit', labelAr: 'وحدة الوزن', type: 'select', required: false, hint: 'طن أو كيلو — الافتراضي طن' },
  { name: 'driver_id', labelAr: 'السائق', type: 'search', required: false, hint: 'اسم السائق' },
  { name: 'is_hazardous', labelAr: 'مخلفات خطرة؟', type: 'boolean', required: false },
  { name: 'notes', labelAr: 'ملاحظات', type: 'text', required: false },
];

const INVOICE_FIELDS: PageField[] = [
  { name: 'shipment_id', labelAr: 'الشحنة المرتبطة', type: 'search', required: true, hint: 'رقم أو معرف الشحنة' },
  { name: 'amount', labelAr: 'المبلغ', type: 'number', required: true },
  { name: 'partner_id', labelAr: 'الشريك', type: 'search', required: true },
  { name: 'invoice_type', labelAr: 'نوع الفاتورة', type: 'select', required: true, hint: 'مستحقة receivable أو مدفوعة payable' },
  { name: 'notes', labelAr: 'ملاحظات', type: 'text', required: false },
];

const DEPOSIT_FIELDS: PageField[] = [
  { name: 'partner_id', labelAr: 'الشريك', type: 'search', required: true },
  { name: 'amount', labelAr: 'المبلغ', type: 'number', required: true },
  { name: 'payment_method', labelAr: 'طريقة الدفع', type: 'select', required: true, hint: 'كاش، تحويل، شيك' },
  { name: 'notes', labelAr: 'ملاحظات', type: 'text', required: false },
];

const DRIVER_FIELDS: PageField[] = [
  { name: 'full_name', labelAr: 'اسم السائق', type: 'text', required: true },
  { name: 'phone', labelAr: 'رقم التليفون', type: 'text', required: true },
  { name: 'license_number', labelAr: 'رقم الرخصة', type: 'text', required: true },
  { name: 'vehicle_type', labelAr: 'نوع المركبة', type: 'select', required: false },
  { name: 'vehicle_plate', labelAr: 'رقم اللوحة', type: 'text', required: false },
];

// ═══════════════════════════════════════════════════════════
// خريطة الصفحات
// ═══════════════════════════════════════════════════════════
const PAGE_CONTEXT_MAP: Record<string, PageContext> = {
  // ── الرئيسية ──
  '/dashboard': {
    descriptionAr: 'لوحة التحكم الرئيسية',
    welcomePrompt: 'أهلاً يا باشا! إنت في الرئيسية. عايز تعمل إيه؟ ممكن أعرضلك ملخص اليوم، أو تنشئ شحنة جديدة، أو تروح لأي صفحة.',
    actions: [
      { id: 'daily_summary', labelAr: 'ملخص اليوم', fields: [], proactivePrompt: 'عايز أجيبلك ملخص اليوم؟' },
      { id: 'create_shipment', labelAr: 'إنشاء شحنة', fields: SHIPMENT_FIELDS, proactivePrompt: 'عايز تنشئ شحنة جديدة؟ هبدأ أسألك على البيانات' },
      { id: 'navigate', labelAr: 'فتح صفحة', fields: [], proactivePrompt: 'عايز تروح صفحة معينة؟' },
    ],
  },

  // ── الشحنات ──
  '/dashboard/shipments': {
    descriptionAr: 'قائمة الشحنات',
    welcomePrompt: 'إنت في صفحة الشحنات. عايز تنشئ شحنة جديدة ولا تدور على شحنة معينة؟',
    actions: [
      { id: 'create_shipment', labelAr: 'إنشاء شحنة جديدة', fields: SHIPMENT_FIELDS, proactivePrompt: 'يلا ننشئ شحنة جديدة. أول حاجة، إيه اسم الجهة المولّدة؟' },
      { id: 'search_shipments', labelAr: 'بحث عن شحنة', fields: [{ name: 'query', labelAr: 'كلمة البحث', type: 'text', required: true }], proactivePrompt: 'عايز تبحث عن شحنة؟ قولي رقمها أو نوع المخلفات' },
      { id: 'filter_shipments', labelAr: 'فلترة الشحنات', fields: [{ name: 'status', labelAr: 'الحالة', type: 'select', required: false }, { name: 'waste_type', labelAr: 'نوع المخلفات', type: 'select', required: false }], proactivePrompt: 'عايز تفلتر الشحنات حسب الحالة أو النوع؟' },
    ],
  },
  '/dashboard/shipments/new': {
    descriptionAr: 'إنشاء شحنة جديدة',
    welcomePrompt: 'ممتاز، إنت في صفحة إنشاء شحنة جديدة. عايزني أساعدك أملي البيانات؟ هسألك واحدة واحدة.',
    actions: [
      { id: 'fill_shipment_form', labelAr: 'ملء بيانات الشحنة', fields: SHIPMENT_FIELDS, proactivePrompt: 'يلا نبدأ. أول حاجة: إيه اسم الجهة المولّدة اللي بتشحن منها؟' },
    ],
  },
  '/dashboard/transporter-shipments': {
    descriptionAr: 'شحنات الناقل',
    welcomePrompt: 'إنت في شحنات الناقل. عايز تشوف الشحنات الجديدة ولا تنشئ شحنة؟',
    actions: [
      { id: 'create_shipment', labelAr: 'إنشاء شحنة', fields: SHIPMENT_FIELDS, proactivePrompt: 'يلا ننشئ شحنة. مين الجهة المولّدة؟' },
      { id: 'view_new', labelAr: 'شحنات جديدة', fields: [], proactivePrompt: 'عايز تشوف الشحنات اللي لسه جديدة؟' },
      { id: 'assign_driver', labelAr: 'تعيين سائق', fields: [{ name: 'shipment_id', labelAr: 'الشحنة', type: 'search', required: true }, { name: 'driver_id', labelAr: 'السائق', type: 'search', required: true }], proactivePrompt: 'عايز تعيّن سواق لشحنة؟' },
    ],
  },

  // ── الفواتير ──
  '/dashboard/invoices': {
    descriptionAr: 'قائمة الفواتير',
    welcomePrompt: 'إنت في صفحة الفواتير. عايز تنشئ فاتورة جديدة ولا تدور على فاتورة؟',
    actions: [
      { id: 'create_invoice', labelAr: 'إنشاء فاتورة', fields: INVOICE_FIELDS, proactivePrompt: 'يلا ننشئ فاتورة. إيه رقم الشحنة المرتبطة؟' },
      { id: 'search_invoices', labelAr: 'بحث عن فاتورة', fields: [], proactivePrompt: 'عايز تبحث عن فاتورة؟' },
    ],
  },

  // ── الحسابات ──
  '/dashboard/accounts': {
    descriptionAr: 'دفتر الحسابات',
    welcomePrompt: 'إنت في صفحة الحسابات. عايز تشوف رصيد شريك معين ولا تسجل إيداع؟',
    actions: [
      { id: 'create_deposit', labelAr: 'تسجيل إيداع', fields: DEPOSIT_FIELDS, proactivePrompt: 'يلا نسجل إيداع. مين الشريك؟' },
      { id: 'view_balance', labelAr: 'عرض رصيد', fields: [{ name: 'partner', labelAr: 'اسم الشريك', type: 'search', required: true }], proactivePrompt: 'عايز تشوف رصيد مين؟' },
    ],
  },

  // ── السائقين ──
  '/dashboard/drivers': {
    descriptionAr: 'إدارة السائقين',
    welcomePrompt: 'إنت في صفحة السائقين. عايز تضيف سواق جديد ولا تدور على سواق؟',
    actions: [
      { id: 'add_driver', labelAr: 'إضافة سائق', fields: DRIVER_FIELDS, proactivePrompt: 'يلا نضيف سواق جديد. إيه اسمه؟' },
      { id: 'search_driver', labelAr: 'بحث عن سائق', fields: [], proactivePrompt: 'عايز تدور على سواق معين؟' },
    ],
  },

  // ── الشركاء ──
  '/dashboard/partners': {
    descriptionAr: 'إدارة الشركاء',
    welcomePrompt: 'إنت في صفحة الشركاء. عايز تضيف شريك جديد ولا تعدل بيانات شريك؟',
    actions: [
      { id: 'add_partner', labelAr: 'إضافة شريك', fields: [{ name: 'name', labelAr: 'اسم الشريك', type: 'text', required: true }, { name: 'type', labelAr: 'نوع الشريك', type: 'select', required: true }], proactivePrompt: 'يلا نضيف شريك جديد. إيه اسمه؟' },
    ],
  },

  // ── التقارير ──
  '/dashboard/reports': {
    descriptionAr: 'التقارير والإحصائيات',
    welcomePrompt: 'إنت في التقارير. عايز تقرير عن إيه؟ الشحنات، الفواتير، الأداء؟',
    actions: [
      { id: 'shipment_report', labelAr: 'تقرير شحنات', fields: [{ name: 'period', labelAr: 'الفترة', type: 'select', required: true, hint: 'النهارده، الأسبوع، الشهر' }], proactivePrompt: 'عايز تقرير شحنات عن أنهي فترة؟' },
    ],
  },

  // ── الإشعارات ──
  '/dashboard/notifications': {
    descriptionAr: 'الإشعارات',
    welcomePrompt: 'إنت في الإشعارات. عايز أقرألك الإشعارات الجديدة؟',
    actions: [
      { id: 'read_notifications', labelAr: 'قراءة الإشعارات', fields: [], proactivePrompt: 'عندك إشعارات جديدة، عايزني أقرأهالك؟' },
    ],
  },

  // ── الإعدادات ──
  '/dashboard/settings': {
    descriptionAr: 'إعدادات الجهة',
    welcomePrompt: 'إنت في الإعدادات. عايز تعدل إيه؟',
    actions: [],
  },

  // ── الأعضاء والهيكل التنظيمي ──
  '/dashboard/organization-structure': {
    descriptionAr: 'الهيكل التنظيمي وإدارة الأعضاء',
    welcomePrompt: 'إنت في الهيكل التنظيمي. عايز تضيف عضو جديد ولا تعدل صلاحيات؟',
    actions: [
      { id: 'add_member', labelAr: 'إضافة عضو', fields: [{ name: 'name', labelAr: 'اسم العضو', type: 'text', required: true }, { name: 'role', labelAr: 'الدور', type: 'select', required: true }], proactivePrompt: 'يلا نضيف عضو جديد. إيه اسمه ودوره؟' },
    ],
  },

  // ── المراسلات ──
  '/dashboard/chat': {
    descriptionAr: 'المراسلات والدردشة',
    welcomePrompt: 'إنت في المراسلات. عايز تبعت رسالة لمين؟',
    actions: [],
  },

  // ── سوق الشحنات ──
  '/dashboard/shipment-market': {
    descriptionAr: 'سوق الشحنات المتاحة',
    welcomePrompt: 'إنت في سوق الشحنات. عايز تشوف الشحنات القريبة منك ولا الأعلى سعراً؟',
    actions: [
      { id: 'nearby', labelAr: 'شحنات قريبة', fields: [], proactivePrompt: 'عايز أورّيك الشحنات القريبة منك؟' },
      { id: 'best_price', labelAr: 'أعلى سعر', fields: [], proactivePrompt: 'عايز تشوف الشحنات الأعلى سعراً؟' },
    ],
  },

  // ── التتبع ──
  '/dashboard/tracking': {
    descriptionAr: 'تتبع الشحنات على الخريطة',
    welcomePrompt: 'إنت في صفحة التتبع. عايز تتبع شحنة معينة؟ قولي رقمها.',
    actions: [],
  },

  // ── السائق: لوحة التحكم ──
  '/dashboard/driver-dashboard': {
    descriptionAr: 'لوحة تحكم السائق',
    welcomePrompt: 'أهلاً يا كابتن! عندك شحنات جاهزة للاستلام؟ عايز أوريك الشحنات المسندة ليك؟',
    actions: [
      { id: 'my_shipments', labelAr: 'شحناتي', fields: [], proactivePrompt: 'عايز تشوف الشحنات المسندة ليك؟' },
      { id: 'update_status', labelAr: 'تحديث حالة شحنة', fields: [{ name: 'shipment_id', labelAr: 'الشحنة', type: 'search', required: true }, { name: 'new_status', labelAr: 'الحالة الجديدة', type: 'select', required: true }], proactivePrompt: 'عايز تحدث حالة شحنة؟ قولي رقمها والحالة الجديدة' },
    ],
    allowedRoles: ['driver'],
  },

  // ── المولّد: لوحة التحكم ──
  '/dashboard/generator-dashboard': {
    descriptionAr: 'لوحة تحكم الجهة المولّدة',
    welcomePrompt: 'أهلاً بالجهة المولّدة! عايز تطلب شحنة جديدة ولا تشوف ملخص اليوم؟',
    actions: [
      { id: 'request_pickup', labelAr: 'طلب شحنة', fields: SHIPMENT_FIELDS, proactivePrompt: 'يلا نطلب شحنة. إيه نوع المخلفات اللي عايز تشحنها؟' },
    ],
    allowedRoles: ['generator'],
  },

  // ── المدوّر ──
  '/dashboard/recycler-dashboard': {
    descriptionAr: 'لوحة تحكم المدوّر',
    welcomePrompt: 'أهلاً بالمدوّر! عايز تشوف الشحنات الواردة ولا تسجل وزن شحنة؟',
    actions: [
      { id: 'incoming_shipments', labelAr: 'الشحنات الواردة', fields: [], proactivePrompt: 'عايز تشوف الشحنات اللي جاياك؟' },
      { id: 'record_weight', labelAr: 'تسجيل وزن', fields: [{ name: 'shipment_id', labelAr: 'الشحنة', type: 'search', required: true }, { name: 'actual_weight', labelAr: 'الوزن الفعلي', type: 'number', required: true }], proactivePrompt: 'عايز تسجل وزن شحنة؟ قولي رقمها' },
    ],
    allowedRoles: ['recycler'],
  },
};

// ═══════════════════════════════════════════════════════════
// الدوال المصدّرة
// ═══════════════════════════════════════════════════════════

/** الحصول على سياق الصفحة الحالية */
export function getPageContext(route: string): PageContext | null {
  // Direct match
  if (PAGE_CONTEXT_MAP[route]) return PAGE_CONTEXT_MAP[route];
  
  // Try partial match (for dynamic routes like /dashboard/shipments/123)
  const parts = route.split('/');
  while (parts.length > 2) {
    parts.pop();
    const partial = parts.join('/');
    if (PAGE_CONTEXT_MAP[partial]) return PAGE_CONTEXT_MAP[partial];
  }
  
  return null;
}

/** تحويل سياق الصفحة لنص يُرسل للذكاء الاصطناعي */
export function getPageContextForAI(route: string, role?: string): string {
  const ctx = getPageContext(route);
  if (!ctx) return `المستخدم في صفحة: ${route}. لا يوجد سياق مخصص.`;

  let text = `## سياق الصفحة الحالية:\n`;
  text += `الصفحة: ${ctx.descriptionAr}\n`;
  text += `المسار: ${route}\n\n`;
  
  if (ctx.actions.length > 0) {
    text += `## الإجراءات المتاحة في هذه الصفحة:\n`;
    ctx.actions.forEach((action, i) => {
      text += `${i + 1}. **${action.labelAr}**\n`;
      if (action.fields.length > 0) {
        text += `   الحقول المطلوبة:\n`;
        action.fields.forEach(f => {
          text += `   - ${f.labelAr} (${f.required ? 'مطلوب' : 'اختياري'})${f.hint ? ` — ${f.hint}` : ''}\n`;
        });
      }
      text += `   💡 اقتراح: "${action.proactivePrompt}"\n\n`;
    });
  }

  text += `## السلوك الاستباقي:\n`;
  text += `عند بداية المحادثة في هذه الصفحة، قل: "${ctx.welcomePrompt}"\n`;
  text += `بعد كل إجابة من المستخدم، اسأله الحقل التالي تلقائياً.\n`;
  text += `لو المستخدم ذكر عدة بيانات في جملة واحدة، التقطها كلها ولا تسأل عنها تاني.\n`;

  return text;
}

/** الحصول على رسالة الترحيب الاستباقية */
export function getProactiveWelcome(route: string): string | null {
  const ctx = getPageContext(route);
  return ctx?.welcomePrompt || null;
}
