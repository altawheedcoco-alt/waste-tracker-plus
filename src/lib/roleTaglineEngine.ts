/**
 * ============================================================
 * Role-Based Tagline Engine — محرك الجُمل التذييلية حسب الدور
 * ============================================================
 * 
 * كل جملة مرتبطة بنظام iRecycle كمنصة
 * Generates 10,000+ unique deterministic taglines per role.
 * Uses a hash of the shipment identifier to pick a tagline,
 * ensuring the SAME form always gets the SAME tagline.
 * 
 * Architecture: prefix × middle × suffix = 10,000+ combinations
 * ============================================================
 */

// ─── Deterministic hash function ─────────────────────────────
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFromHash(hash: number, arr: string[], offset = 0): string {
  return arr[((hash >>> offset) + offset * 7) % arr.length];
}

// ─── Role: المولّد (Generator) ───────────────────────────────
const GEN_PREFIX = [
  'iRecycle يبدأ من عندك —',
  'مع iRecycle مسؤوليتك واضحة —',
  'iRecycle يوثّق كل كيلو من مصدره —',
  'نظام iRecycle يضمن تصنيفك الدقيق —',
  'iRecycle يُحوّل مخلفاتك إلى بيانات —',
  'عبر iRecycle أنت الحلقة الأولى —',
  'iRecycle يربط مصنعك بسلسلة الاستدامة —',
  'مع iRecycle كل بيان له قيمة —',
  'iRecycle يحمي بياناتك ويحمي البيئة —',
  'نظام iRecycle يبدأ التتبع من موقعك —',
  'iRecycle يجعل الفرز استثماراً لا عبئاً —',
  'مع iRecycle إقرارك مُوثّق ومحمي —',
  'iRecycle يصنع من بياناتك درعاً بيئياً —',
  'عبر iRecycle مصدر المخلفات شريك الحل —',
  'iRecycle يُظهر التزامك للجهات الرقابية —',
  'نظام iRecycle يوفّر عليك وقت التوثيق —',
  'iRecycle يربط كل كيلو بسجل رقمي —',
  'مع iRecycle الشفافية تبدأ من المولّد —',
  'iRecycle يحوّل الهدر إلى فرصة —',
  'عبر iRecycle فرزك اليوم ثروة الغد —',
  'iRecycle يجعل التصريح الصحيح سهلاً —',
  'نظام iRecycle يحمي حقوقك كمولّد —',
];

const GEN_MIDDLE = [
  'لأن iRecycle يُتابع سلسلة الحيازة بالكامل',
  'ونظام iRecycle يضمن الامتثال لمعايير WMRA',
  'وiRecycle يبني سجلاً رقمياً لا يُمحى',
  'لأن iRecycle يقلل البصمة الكربونية لمنشأتك',
  'وiRecycle يرفع تصنيفك البيئي تلقائياً',
  'ونظام iRecycle يعكس التزامك بالقوانين',
  'لأن iRecycle يحوّل المخلفات لقيمة اقتصادية',
  'وiRecycle يدعم أهداف التنمية المستدامة',
  'ونظام iRecycle يوفّر تكاليف المعالجة',
  'لأن iRecycle يعزز سمعتك كمنشأة مسؤولة',
  'وiRecycle يُسهم في حماية الموارد الطبيعية',
  'ونظام iRecycle يبني جسور الثقة مع شركائك',
  'لأن iRecycle يقلل المخاطر القانونية',
  'وiRecycle يدعم رؤية مصر 2030',
  'ونظام iRecycle يجعل كل طن فرصة استثمار',
  'لأن iRecycle يُحسّن كفاءة المعالجة',
  'وiRecycle يضمن حقوقك وحقوق الشركاء',
  'ونظام iRecycle يُظهر التزامك الرقابي',
  'لأن iRecycle يحوّل الهدر لعائد اقتصادي',
  'وiRecycle يصنع فارقاً حقيقياً في البيئة',
  'ونظام iRecycle يرفع جودة الحياة للمجتمع',
  'لأن iRecycle يحمي مجتمعك ويحفظ مواردك',
];

const GEN_SUFFIX = [
  '— iRecycle شريكك في الاستدامة ♻',
  '— iRecycle لأن البيئة تستحق الأفضل ♻',
  '— iRecycle نحو مستقبل أنظف ♻',
  '— iRecycle كل طن يُحدث فرقاً ♻',
  '— iRecycle معاً نُعيد التدوير ♻',
  '— iRecycle نوثّق من أجل الأرض ♻',
  '— iRecycle لا مخلفات بلا أثر ♻',
  '— iRecycle شفافية تصنع ثقة ♻',
  '— iRecycle تقنية في خدمة البيئة ♻',
  '— iRecycle وثّق، تتبّع، استدِم ♻',
  '— iRecycle كل بيان خطوة للأمام ♻',
  '— iRecycle الأرض أمانة بين أيدينا ♻',
  '— iRecycle اقتصاد دائري يبدأ هنا ♻',
  '— iRecycle حلول ذكية لإدارة المخلفات ♻',
  '— iRecycle بيئة نظيفة للأجيال القادمة ♻',
  '— iRecycle التزامك اليوم بيئتنا غداً ♻',
  '— iRecycle من الهدر إلى القيمة ♻',
  '— iRecycle رقمنة سلسلة المخلفات ♻',
  '— iRecycle مسؤولية مشتركة نتائج ملموسة ♻',
  '— iRecycle الاستدامة ليست خياراً ♻',
  '— iRecycle نُغلق الدائرة معاً ♻',
  '— iRecycle أنت جزء من الحل ♻',
];

// ─── Role: الناقل (Transporter) ──────────────────────────────
const TRANS_PREFIX = [
  'iRecycle يجعلك الجسر الآمن —',
  'مع iRecycle كل رحلة نقل موثّقة —',
  'نظام iRecycle يحمي حمولتك وسمعتك —',
  'iRecycle يوفّر تتبعاً لحظياً لأسطولك —',
  'عبر iRecycle أنت حارس سلسلة الحيازة —',
  'iRecycle يضمن المسار الصحيح لشحنتك —',
  'مع iRecycle مسؤوليتك واضحة من التحميل —',
  'نظام iRecycle يحمي كل كيلومتر —',
  'iRecycle يوثّق التزامك بالمسار —',
  'عبر iRecycle لا مجرد حمولة بل أمانة —',
  'iRecycle يحمي رخصتك ومهنيتك —',
  'مع iRecycle النقل الآمن يبدأ بالتوثيق —',
  'نظام iRecycle يربط المصدر بالوجهة بذكاء —',
  'iRecycle يجعل التوثيق اللحظي درعك —',
  'عبر iRecycle كل تأخير مسجّل ومبرّر —',
  'iRecycle يبدأ الامتثال من المركبة —',
  'مع iRecycle سائقك ممثلك الرقمي —',
  'نظام iRecycle يمنع التسربات البيئية —',
  'iRecycle يضمن أمانة النقل للجميع —',
  'عبر iRecycle التزامك بالوزن موثّق —',
  'iRecycle يجعلك رسول الاستدامة —',
  'مع iRecycle أسطولك ذكي ومتصل —',
];

const TRANS_MIDDLE = [
  'لأن iRecycle يتتبع كل كيلومتر بدقة',
  'ونظام iRecycle يحمي البيئة من التسربات',
  'وiRecycle يُثبت التزامك للجهات الرقابية',
  'لأن iRecycle يقلل مخاطر الحوادث',
  'وiRecycle يحمي رخصتك وسمعة منشأتك',
  'ونظام iRecycle يضمن تسليماً لا جدال فيه',
  'لأن iRecycle يحوّل النقل لخدمة قيمة',
  'وiRecycle يحافظ على سلسلة الحيازة',
  'ونظام iRecycle يُقلل البصمة الكربونية للنقل',
  'لأن iRecycle يُثبت كفاءتك التشغيلية',
  'وiRecycle يدعم التحول الرقمي في النقل',
  'ونظام iRecycle يُظهر احترافيتك كناقل',
  'لأن iRecycle يقلل الوقت الضائع',
  'وiRecycle يعزز ثقة العملاء في خدماتك',
  'ونظام iRecycle يخلق سجلاً رقمياً لا يُمحى',
  'لأن iRecycle يحقق الشفافية في كل مرحلة',
  'وiRecycle يُسرّع التسويات المالية',
  'ونظام iRecycle يجعلك الخيار الأول',
  'لأن iRecycle يبني تاريخاً مهنياً موثوقاً',
  'وiRecycle يوفر حماية قانونية لكل رحلة',
  'ونظام iRecycle يضمن وصول الشحنة بأمان',
  'لأن iRecycle يربط كل رحلة بسجل رقمي',
];

const TRANS_SUFFIX = [
  '— iRecycle النقل الذكي يحمي البيئة ♻',
  '— iRecycle كل رحلة موثقة كل كيلو آمن ♻',
  '— iRecycle شريكك في النقل المستدام ♻',
  '— iRecycle الطريق الآمن يبدأ بالتوثيق ♻',
  '— iRecycle نقل بلا مخاطر ♻',
  '— iRecycle وثّق رحلتك احمِ مسارك ♻',
  '— iRecycle تقنية في خدمة النقل ♻',
  '— iRecycle أسطولك الذكي يبدأ هنا ♻',
  '— iRecycle من التحميل إلى التسليم بثقة ♻',
  '— iRecycle سلامة الشحنة سلامة البيئة ♻',
  '— iRecycle نقل أخضر لمستقبل أخضر ♻',
  '— iRecycle التتبع الذكي في كل كيلومتر ♻',
  '— iRecycle الناقل المعتمد شريك الاستدامة ♻',
  '— iRecycle التزام واحد فرق كبير ♻',
  '— iRecycle لأن كل رحلة تُحسب ♻',
  '— iRecycle نوثّق لنحمي ♻',
  '— iRecycle مسارك مسؤوليتك ♻',
  '— iRecycle الشفافية في كل شحنة ♻',
  '— iRecycle لا نقل بدون توثيق ♻',
  '— iRecycle رقمنة النقل مستقبل القطاع ♻',
  '— iRecycle سائقك شريك في الحل ♻',
  '— iRecycle اجعل كل رحلة نظيفة ♻',
];

// ─── Role: المدوّر (Recycler) ────────────────────────────────
const REC_PREFIX = [
  'iRecycle يُقدّر دورك في إعادة الحياة —',
  'مع iRecycle كل طن تدوّره موثّق —',
  'نظام iRecycle يدعم رسالتك في التدوير —',
  'iRecycle يحوّل مخلفاتك لثروة رقمية —',
  'عبر iRecycle أنت عمود الاقتصاد الدائري —',
  'iRecycle يضمن دقة الاستلام والمعالجة —',
  'مع iRecycle كل عملية معالجة موثّقة —',
  'نظام iRecycle يعكس جودة مخرجاتك —',
  'iRecycle يُضاعف كفاءة تدويرك بالتقنية —',
  'عبر iRecycle سجلاتك شهادة كفاءتك —',
  'iRecycle يربط مصنعك بسلسلة القيمة —',
  'مع iRecycle المُدوّر المعتمد يتفوق —',
  'نظام iRecycle يرفع معاييرك البيئية —',
  'iRecycle يوثّق كل كيلو مُعاد تدويره —',
  'عبر iRecycle أنت من يُغلق الدائرة —',
  'iRecycle يربط التزامك بقيمة مخرجاتك —',
  'مع iRecycle مخلفاتك مواد خام جديدة —',
  'نظام iRecycle يحمي رخصتك البيئية —',
  'iRecycle يوثّق كل عملية فرز بدقة —',
  'عبر iRecycle الاستدامة تمر عبر مصنعك —',
  'iRecycle يُقلل الحاجة للموارد البكر —',
  'مع iRecycle أنت حلقة الوصل للإنتاج —',
];

const REC_MIDDLE = [
  'لأن iRecycle يُسهم في تقليل استنزاف الموارد',
  'ونظام iRecycle يدعم إنتاج مواد ثانوية',
  'وiRecycle يخلق فرص عمل خضراء',
  'لأن iRecycle يُقلل الضغط على المدافن',
  'وiRecycle يعزز الاقتصاد الدائري',
  'ونظام iRecycle يُحسّن البصمة الكربونية',
  'لأن iRecycle يرفع قيمة المخلفات في السوق',
  'وiRecycle يحقق عائداً اقتصادياً وبيئياً',
  'ونظام iRecycle يدعم التصنيع المستدام',
  'لأن iRecycle يضمن امتثالك للجودة البيئية',
  'وiRecycle يُحوّل التحديات لفرص استثمارية',
  'ونظام iRecycle يُظهر دورك في حماية الكوكب',
  'لأن iRecycle يبني سمعة قوية لمنشأتك',
  'وiRecycle يقلل تكاليف الإنتاج',
  'ونظام iRecycle يُسهم في الحياد الكربوني',
  'لأن iRecycle يخلق سلسلة قيمة مستدامة',
  'وiRecycle يُثبت كفاءتك رقابياً',
  'ونظام iRecycle يعكس التزامك بمعايير ESG',
  'لأن iRecycle يفتح أسواقاً جديدة للمنتجات',
  'وiRecycle يدعم الابتكار في المعالجة',
  'ونظام iRecycle يُسهم في مستقبل بلا مخلفات',
  'لأن iRecycle يرفع معدلات التدوير الوطنية',
];

const REC_SUFFIX = [
  '— iRecycle التدوير يصنع مستقبلاً أفضل ♻',
  '— iRecycle كل طن مُدوّر انتصار للبيئة ♻',
  '— iRecycle شريكك في الاقتصاد الدائري ♻',
  '— iRecycle نُحوّل المخلفات إلى ثروات ♻',
  '— iRecycle تدوير ذكي بيئة سليمة ♻',
  '— iRecycle المُدوّر شريك الاستدامة الأول ♻',
  '— iRecycle من النفايات إلى الموارد ♻',
  '— iRecycle الدائرة تكتمل بك ♻',
  '— iRecycle تقنية تدعم تدويرك ♻',
  '— iRecycle جودة المخرجات تبدأ بالتوثيق ♻',
  '— iRecycle كل عملية تدوير خطوة للاستدامة ♻',
  '— iRecycle بيئة نظيفة بأيدٍ ماهرة ♻',
  '— iRecycle إعادة تدوير بمعايير عالمية ♻',
  '— iRecycle نوثّق كل طن نحمي كل مورد ♻',
  '— iRecycle الكفاءة في التدوير تبدأ هنا ♻',
  '— iRecycle مصنعك مستقبل البيئة ♻',
  '— iRecycle التدوير رسالة والتوثيق ضمان ♻',
  '— iRecycle اقتصاد أخضر يبدأ بك ♻',
  '— iRecycle أعد التدوير أعد الأمل ♻',
  '— iRecycle كل كيلو مُدوّر يحمي الطبيعة ♻',
  '— iRecycle التحول الأخضر يمر عبرك ♻',
  '— iRecycle نُعيد نُنتج نستدام ♻',
];

// ─── Role: التخلص النهائي (Disposal) ─────────────────────────
const DISP_PREFIX = [
  'iRecycle يحمي البيئة حتى آخر حلقة —',
  'مع iRecycle التخلص الآمن موثّق رقمياً —',
  'نظام iRecycle يجعلك حارس البيئة الأخير —',
  'iRecycle يحوّل الدفن الصحي لعلم رقمي —',
  'عبر iRecycle كل طن مُتخلّص منه بأمان —',
  'iRecycle يضمن المعالجة الآمنة قبل التخلص —',
  'مع iRecycle التخلص المسؤول موثّق ومحمي —',
  'نظام iRecycle يوثّق كل عملية تخلص —',
  'iRecycle يحميك كخط أخير للدفاع البيئي —',
  'عبر iRecycle المدفن المرخص موثّق رقمياً —',
  'iRecycle يدير ما لا يُدوّر بمسؤولية —',
  'مع iRecycle التخلص إدارة لا إلقاء —',
  'نظام iRecycle يراقب كل خلية في المدفن —',
  'iRecycle يحسّن إدارة المدافن بالتقنية —',
  'عبر iRecycle سجلات التخلص دليل امتثالك —',
  'iRecycle يضمن المعالجة قبل الدفن —',
  'مع iRecycle أنت مسؤول ومحمي —',
  'نظام iRecycle يوثّق الحرق الآمن بدقة —',
  'iRecycle يدعم التخلص المسؤول —',
  'عبر iRecycle كل عملية آمنة ومسجّلة —',
  'iRecycle يمنع الكوارث البيئية بالتوثيق —',
  'مع iRecycle المحطة الأخيرة آمنة ومسؤولة —',
];

const DISP_MIDDLE = [
  'لأن iRecycle يحمي المياه الجوفية والتربة',
  'ونظام iRecycle يمنع تسرب المواد الخطرة',
  'وiRecycle يُسهم في تقليل الانبعاثات',
  'لأن iRecycle يحافظ على صحة المجتمعات',
  'وiRecycle يحقق أعلى معايير السلامة',
  'ونظام iRecycle يُسجّل كل شيء للمساءلة',
  'لأن iRecycle يقلل المخاطر الصحية',
  'وiRecycle يضمن إغلاقاً آمناً للدورة',
  'ونظام iRecycle يُثبت مسؤوليتك البيئية',
  'لأن iRecycle يحمي التنوع البيولوجي',
  'وiRecycle يُقلل حجم المخلفات قبل الدفن',
  'ونظام iRecycle يدعم التحكم في الانبعاثات',
  'لأن iRecycle يُظهر التزامك الدولي',
  'وiRecycle يحافظ على قيمة الأرض المحيطة',
  'ونظام iRecycle يمنع الأضرار طويلة المدى',
  'لأن iRecycle يساهم في مستقبل أنظف',
  'وiRecycle يحقق التوازن بين التنمية والبيئة',
  'ونظام iRecycle يُقلل غازات الاحتباس',
  'لأن iRecycle يثبت كفاءة إدارة المدفن',
  'وiRecycle يدعم السياسات البيئية الوطنية',
  'ونظام iRecycle يحمي حق الأجيال القادمة',
  'لأن iRecycle يجعل التخلص عملية علمية',
];

const DISP_SUFFIX = [
  '— iRecycle التخلص الآمن مسؤولية عظمى ♻',
  '— iRecycle نحمي الأرض حتى آخر حلقة ♻',
  '— iRecycle تخلص مسؤول بيئة مستدامة ♻',
  '— iRecycle كل تخلص آمن انتصار للبيئة ♻',
  '— iRecycle لا مخلفات بلا توثيق ♻',
  '— iRecycle شريكك في إغلاق الدائرة بأمان ♻',
  '— iRecycle المحطة الأخيرة والمسؤولية الأكبر ♻',
  '— iRecycle تخلص ذكي أثر أقل ♻',
  '— iRecycle نوثّق التخلص لحماية المستقبل ♻',
  '— iRecycle التزامك يحمي الأرض ♻',
  '— iRecycle المدفن الآمن يبدأ بالتوثيق ♻',
  '— iRecycle ما يُدفن اليوم يؤثر غداً ♻',
  '— iRecycle سلامة التخلص سلامة البيئة ♻',
  '— iRecycle كل طن آمن يحمي الكوكب ♻',
  '— iRecycle حماية البيئة مسؤولية مشتركة ♻',
  '— iRecycle تقنية لخدمة التخلص الآمن ♻',
  '— iRecycle إدارة المدافن بذكاء ♻',
  '— iRecycle الدفن الصحي يحتاج رقمنة ♻',
  '— iRecycle التزامنا يحمي كوكبنا ♻',
  '— iRecycle نُغلق الدائرة بمسؤولية ♻',
  '— iRecycle كل سجل تخلص شهادة أمان ♻',
  '— iRecycle البيئة تستحق تخلصاً مسؤولاً ♻',
];

// ─── Role mapping ────────────────────────────────────────────
type OrgRole = 'generator' | 'transporter' | 'recycler' | 'disposal';

const ROLE_BANKS: Record<OrgRole, { prefix: string[]; middle: string[]; suffix: string[] }> = {
  generator: { prefix: GEN_PREFIX, middle: GEN_MIDDLE, suffix: GEN_SUFFIX },
  transporter: { prefix: TRANS_PREFIX, middle: TRANS_MIDDLE, suffix: TRANS_SUFFIX },
  recycler: { prefix: REC_PREFIX, middle: REC_MIDDLE, suffix: REC_SUFFIX },
  disposal: { prefix: DISP_PREFIX, middle: DISP_MIDDLE, suffix: DISP_SUFFIX },
};

/**
 * Generate a deterministic tagline for a given role and shipment identifier.
 * The same (role + identifier) always produces the SAME tagline.
 * Every tagline is connected to iRecycle as a platform.
 * 
 * Each role has 22×22×22 = 10,648 unique combinations.
 */
export function generateRoleTagline(role: OrgRole, shipmentIdentifier: string): string {
  const bank = ROLE_BANKS[role] || ROLE_BANKS.generator;
  const seed = `${role}:${shipmentIdentifier}`;
  const hash = hashString(seed);

  const prefix = pickFromHash(hash, bank.prefix, 0);
  const middle = pickFromHash(hash, bank.middle, 8);
  const suffix = pickFromHash(hash, bank.suffix, 16);

  return `${prefix} ${middle}. ${suffix}`;
}

/**
 * Get the role label in Arabic
 */
export function getRoleLabel(role: OrgRole): string {
  const labels: Record<OrgRole, string> = {
    generator: 'المولّد',
    transporter: 'الناقل',
    recycler: 'المُدوّر',
    disposal: 'جهة التخلص',
  };
  return labels[role] || role;
}

/**
 * Get total number of unique taglines for a role
 */
export function getTaglineCount(role: OrgRole): number {
  const bank = ROLE_BANKS[role];
  if (!bank) return 0;
  return bank.prefix.length * bank.middle.length * bank.suffix.length;
}
