/**
 * أوامر صوتية سياقية — تتغير حسب الصفحة الحالية ودور المستخدم
 */

export interface ContextualCommand {
  label: string;
  command: string;
  icon: string;
}

const GLOBAL_COMMANDS: ContextualCommand[] = [
  { label: 'الرئيسية', command: 'روح للرئيسية', icon: '🏠' },
  { label: 'الإشعارات', command: 'افتح الإشعارات', icon: '🔔' },
  { label: 'المراسلات', command: 'افتح الشات', icon: '💬' },
];

const PAGE_COMMANDS: Record<string, ContextualCommand[]> = {
  '/dashboard': [
    { label: 'ملخص اليوم', command: 'عايز ملخص النهارده', icon: '📊' },
    { label: 'شحنات النهارده', command: 'عايز شحنات النهارده', icon: '📦' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'الحسابات', command: 'روح للحسابات', icon: '💰' },
    { label: 'التقارير', command: 'افتح التقارير', icon: '📈' },
  ],
  '/dashboard/shipments': [
    { label: 'شحنات البلاستيك', command: 'فلتر الشحنات بلاستيك', icon: '♻️' },
    { label: 'شحنات الورق', command: 'فلتر الشحنات ورق', icon: '📄' },
    { label: 'شحنات الحديد', command: 'فلتر الشحنات حديد', icon: '🔩' },
    { label: 'شحنات في الطريق', command: 'ورّيني الشحنات اللي في الطريق', icon: '🚛' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'شحنات الأسبوع', command: 'عايز شحنات الأسبوع ده', icon: '📅' },
  ],
  '/dashboard/accounts': [
    { label: 'الأرصدة', command: 'عايز أعرف الأرصدة', icon: '💳' },
    { label: 'كشف حساب', command: 'عايز كشف حساب', icon: '📋' },
    { label: 'الفواتير', command: 'روح للفواتير', icon: '🧾' },
    { label: 'الإيداعات', command: 'روح للإيداعات', icon: '🏦' },
  ],
  '/dashboard/invoices': [
    { label: 'فواتير مستحقة', command: 'ورّيني الفواتير المستحقة', icon: '⏰' },
    { label: 'فواتير مدفوعة', command: 'فلتر الفواتير المدفوعة', icon: '✅' },
    { label: 'فاتورة جديدة', command: 'أنشئ فاتورة جديدة', icon: '➕' },
  ],
  '/dashboard/fleet': [
    { label: 'حالة العربيات', command: 'عايز أعرف حالة العربيات', icon: '🚗' },
    { label: 'صيانة مطلوبة', command: 'ورّيني العربيات اللي محتاجة صيانة', icon: '🔧' },
    { label: 'رخص منتهية', command: 'ورّيني الرخص اللي قربت تخلص', icon: '📝' },
  ],
  '/dashboard/drivers': [
    { label: 'السواقين المتاحين', command: 'ورّيني السواقين المتاحين', icon: '👤' },
    { label: 'تقييمات السواقين', command: 'عايز تقييمات السواقين', icon: '⭐' },
  ],
  '/dashboard/chat': [
    { label: 'رسائل غير مقروءة', command: 'ورّيني الرسائل الجديدة', icon: '📩' },
    { label: 'رسالة جديدة', command: 'ابعت رسالة جديدة', icon: '✉️' },
  ],
  '/dashboard/reports': [
    { label: 'تقرير الشهر', command: 'عايز تقرير الشهر ده', icon: '📊' },
    { label: 'تقرير الأسبوع', command: 'عايز تقرير الأسبوع', icon: '📈' },
  ],
  '/dashboard/waste-exchange': [
    { label: 'عروض جديدة', command: 'ورّيني العروض الجديدة', icon: '🏷️' },
    { label: 'أسعار اليوم', command: 'عايز أسعار النهارده', icon: '💵' },
  ],
  '/dashboard/contracts': [
    { label: 'عقود نشطة', command: 'ورّيني العقود النشطة', icon: '📑' },
    { label: 'عقود قربت تخلص', command: 'ورّيني العقود اللي قربت تنتهي', icon: '⚠️' },
  ],
};

const ROLE_COMMANDS: Record<string, ContextualCommand[]> = {
  generator: [
    { label: 'طلب نقل', command: 'عايز أطلب نقل مخلفات', icon: '🚛' },
    { label: 'وزن المخلفات', command: 'سجل وزن المخلفات', icon: '⚖️' },
  ],
  transporter: [
    { label: 'رحلاتي', command: 'ورّيني رحلاتي النهارده', icon: '🗺️' },
    { label: 'الأسطول', command: 'افتح الأسطول', icon: '🚛' },
    { label: 'التراخيص', command: 'ورّيني حالة التراخيص', icon: '📋' },
  ],
  recycler: [
    { label: 'المخزون', command: 'عايز أعرف المخزون', icon: '🏭' },
    { label: 'أسعار الشراء', command: 'ورّيني أسعار الشراء', icon: '💰' },
  ],
  disposer: [
    { label: 'الطاقة الاستيعابية', command: 'كم الطاقة الاستيعابية المتاحة', icon: '🏗️' },
  ],
};

/**
 * الحصول على الأوامر المناسبة للسياق الحالي
 */
export function getContextualCommands(
  currentRoute: string,
  userRole?: string,
  maxCommands: number = 8
): ContextualCommand[] {
  const commands: ContextualCommand[] = [];

  // أوامر خاصة بالصفحة الحالية (أولوية قصوى)
  const pageKey = Object.keys(PAGE_COMMANDS)
    .sort((a, b) => b.length - a.length)
    .find(key => currentRoute.startsWith(key));

  if (pageKey) {
    commands.push(...PAGE_COMMANDS[pageKey]);
  }

  // أوامر خاصة بالدور
  if (userRole && ROLE_COMMANDS[userRole]) {
    const roleCommands = ROLE_COMMANDS[userRole].filter(
      rc => !commands.some(c => c.command === rc.command)
    );
    commands.push(...roleCommands);
  }

  // أوامر عامة لملء الفراغ
  const globalToAdd = GLOBAL_COMMANDS.filter(
    gc => !commands.some(c => c.command === gc.command)
  );
  commands.push(...globalToAdd);

  return commands.slice(0, maxCommands);
}
