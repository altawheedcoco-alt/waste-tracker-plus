/**
 * أوامر صوتية سياقية شاملة — تغطي كل مسارات الداشبورد (305+ صفحة)
 * تتغير حسب الصفحة الحالية ودور المستخدم
 */

export interface ContextualCommand {
  label: string;
  command: string;
  icon: string;
}

// ═══════════════════════════════════════════════════════════
// الأوامر العامة (متاحة لكل المستخدمين)
// ═══════════════════════════════════════════════════════════
const GLOBAL_COMMANDS: ContextualCommand[] = [
  { label: 'الرئيسية', command: 'روح للرئيسية', icon: '🏠' },
  { label: 'الإشعارات', command: 'افتح الإشعارات', icon: '🔔' },
  { label: 'المراسلات', command: 'افتح الشات', icon: '💬' },
  { label: 'بحث', command: 'ابحث', icon: '🔍' },
  { label: 'الوضع الليلي', command: 'فعّل الوضع الليلي', icon: '🌙' },
  { label: 'تسجيل خروج', command: 'سجّل خروج', icon: '🚪' },
];

// ═══════════════════════════════════════════════════════════
// أوامر خاصة بكل صفحة (305 صفحة مغطاة)
// ═══════════════════════════════════════════════════════════
const PAGE_COMMANDS: Record<string, ContextualCommand[]> = {
  // ── الرئيسية ──
  '/dashboard': [
    { label: 'ملخص اليوم', command: 'عايز ملخص النهارده', icon: '📊' },
    { label: 'شحنات النهارده', command: 'عايز شحنات النهارده', icon: '📦' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'الحسابات', command: 'روح للحسابات', icon: '💰' },
    { label: 'التقارير', command: 'افتح التقارير', icon: '📈' },
  ],

  // ── الشحنات ──
  '/dashboard/shipments': [
    { label: 'شحنات البلاستيك', command: 'فلتر الشحنات بلاستيك', icon: '♻️' },
    { label: 'شحنات الورق', command: 'فلتر الشحنات ورق', icon: '📄' },
    { label: 'شحنات الحديد', command: 'فلتر الشحنات حديد', icon: '🔩' },
    { label: 'شحنات في الطريق', command: 'ورّيني الشحنات اللي في الطريق', icon: '🚛' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'شحنات الأسبوع', command: 'عايز شحنات الأسبوع ده', icon: '📅' },
  ],
  '/dashboard/shipments/new': [
    { label: 'اختر مولّد', command: 'اختار المولد', icon: '🏭' },
    { label: 'اختر ناقل', command: 'اختار الناقل', icon: '🚛' },
    { label: 'نوع المخلفات', command: 'حدد نوع المخلفات', icon: '🏷️' },
    { label: 'إرسال', command: 'أرسل الشحنة', icon: '✅' },
  ],
  '/dashboard/transporter-shipments': [
    { label: 'شحنات جديدة', command: 'ورّيني الشحنات الجديدة', icon: '🆕' },
    { label: 'شحنات في الطريق', command: 'ورّيني الشحنات في الطريق', icon: '🚛' },
    { label: 'شحنات مكتملة', command: 'ورّيني الشحنات المسلمة', icon: '✅' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'شحنات مرفوضة', command: 'روح الشحنات المرفوضة', icon: '❌' },
  ],
  '/dashboard/rejected-shipments': [
    { label: 'أسباب الرفض', command: 'ورّيني أسباب الرفض', icon: '❓' },
    { label: 'إعادة إرسال', command: 'أعد إرسال الشحنة', icon: '🔄' },
    { label: 'تواصل مع الشريك', command: 'تواصل مع الشريك', icon: '💬' },
  ],
  '/dashboard/recurring-shipments': [
    { label: 'جدولة جديدة', command: 'أنشئ جدولة شحن متكررة', icon: '➕' },
    { label: 'إيقاف جدولة', command: 'أوقف الشحنات المتكررة', icon: '⏸️' },
    { label: 'تعديل الجدول', command: 'عدّل جدول الشحنات', icon: '✏️' },
  ],
  '/dashboard/manual-shipment': [
    { label: 'إدخال بيانات', command: 'ابدأ إدخال شحنة يدوية', icon: '✏️' },
    { label: 'رفع صورة', command: 'ارفع صورة الإيصال', icon: '📷' },
  ],
  '/dashboard/manual-shipment-drafts': [
    { label: 'المسودات', command: 'ورّيني المسودات', icon: '📝' },
    { label: 'إكمال مسودة', command: 'أكمل أول مسودة', icon: '✅' },
  ],
  '/dashboard/shipment-market': [
    { label: 'شحنات قريبة', command: 'ورّيني الشحنات القريبة مني', icon: '📍' },
    { label: 'أعلى سعر', command: 'ورّيني الشحنات الأعلى سعراً', icon: '💰' },
    { label: 'فلتر بالمسافة', command: 'فلتر الشحنات حسب المسافة', icon: '🗺️' },
  ],
  '/dashboard/shipment-routes': [
    { label: 'المسارات', command: 'ورّيني مسارات الشحنات', icon: '🛣️' },
    { label: 'أقصر مسار', command: 'ورّيني أقصر مسار', icon: '📍' },
  ],
  '/dashboard/shipment-reports': [
    { label: 'تقرير شهري', command: 'أنشئ تقرير شحنات شهري', icon: '📊' },
    { label: 'تقرير أسبوعي', command: 'أنشئ تقرير شحنات أسبوعي', icon: '📈' },
    { label: 'تصدير التقرير', command: 'صدّر التقرير PDF', icon: '📥' },
  ],
  '/dashboard/collection-requests': [
    { label: 'طلبات جديدة', command: 'ورّيني طلبات التجميع الجديدة', icon: '🆕' },
    { label: 'طلب تجميع', command: 'أنشئ طلب تجميع جديد', icon: '➕' },
    { label: 'طلبات معلقة', command: 'ورّيني الطلبات المعلقة', icon: '⏳' },
  ],
  '/dashboard/collection-routes': [
    { label: 'خطوط التجميع', command: 'ورّيني خطوط التجميع', icon: '🛣️' },
    { label: 'تحسين المسار', command: 'حسّن مسار التجميع', icon: '🤖' },
  ],
  '/dashboard/collection-trips': [
    { label: 'رحلات اليوم', command: 'ورّيني رحلات التجميع النهارده', icon: '📅' },
    { label: 'رحلة جديدة', command: 'أنشئ رحلة تجميع جديدة', icon: '➕' },
  ],
  '/dashboard/b2c-collection': [
    { label: 'طلبات الأفراد', command: 'ورّيني طلبات تجميع الأفراد', icon: '🏘️' },
    { label: 'طلب جديد', command: 'أنشئ طلب تجميع أفراد', icon: '➕' },
  ],
  '/dashboard/work-orders': [
    { label: 'أوامر الشغل', command: 'ورّيني أوامر الشغل', icon: '📋' },
    { label: 'أمر شغل جديد', command: 'أنشئ أمر شغل جديد', icon: '➕' },
    { label: 'أوامر معلقة', command: 'ورّيني الأوامر المعلقة', icon: '⏳' },
  ],
  '/dashboard/delivery-declarations': [
    { label: 'إقرارات التسليم', command: 'ورّيني إقرارات التسليم', icon: '📝' },
    { label: 'إقرار جديد', command: 'أنشئ إقرار تسليم جديد', icon: '➕' },
  ],
  '/dashboard/recurring-services': [
    { label: 'الخدمات المتكررة', command: 'ورّيني الخدمات المتكررة', icon: '🔄' },
    { label: 'خدمة جديدة', command: 'أنشئ خدمة متكررة', icon: '➕' },
  ],

  // ── الحسابات والمالية ──
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
  '/dashboard/e-invoice': [
    { label: 'فاتورة إلكترونية', command: 'أنشئ فاتورة إلكترونية', icon: '🧾' },
    { label: 'ربط الضرائب', command: 'اربط مع مصلحة الضرائب', icon: '🏛️' },
    { label: 'حالة الربط', command: 'ورّيني حالة الربط الضريبي', icon: '📡' },
  ],
  '/dashboard/quotations': [
    { label: 'عروض الأسعار', command: 'ورّيني عروض الأسعار', icon: '💰' },
    { label: 'عرض جديد', command: 'أنشئ عرض سعر جديد', icon: '➕' },
    { label: 'عروض منتظرة', command: 'ورّيني العروض المنتظرة', icon: '⏳' },
  ],
  '/dashboard/partner-accounts': [
    { label: 'حسابات الشركاء', command: 'ورّيني حسابات الشركاء', icon: '🤝' },
    { label: 'كشف حساب شريك', command: 'عايز كشف حساب شريك', icon: '📋' },
  ],
  '/dashboard/quick-deposit-links': [
    { label: 'رابط إيداع', command: 'أنشئ رابط إيداع سريع', icon: '💳' },
    { label: 'روابط نشطة', command: 'ورّيني الروابط النشطة', icon: '🔗' },
  ],
  '/dashboard/digital-wallet': [
    { label: 'رصيد المحفظة', command: 'عايز أعرف رصيد المحفظة', icon: '💰' },
    { label: 'سحب أرباح', command: 'عايز أسحب أرباحي', icon: '🏦' },
    { label: 'تحويل', command: 'حوّل رصيد', icon: '💸' },
  ],
  '/dashboard/dynamic-pricing': [
    { label: 'التسعير الديناميكي', command: 'ورّيني التسعير الديناميكي', icon: '📊' },
    { label: 'تعديل الأسعار', command: 'عدّل الأسعار', icon: '✏️' },
  ],
  '/dashboard/revenue-radar': [
    { label: 'رادار الإيرادات', command: 'ورّيني رادار الإيرادات', icon: '📡' },
    { label: 'فرص الربح', command: 'ورّيني فرص الربح', icon: '💎' },
  ],

  // ── ERP ──
  '/dashboard/erp/financial-dashboard': [
    { label: 'لوحة مالية', command: 'ورّيني اللوحة المالية', icon: '📊' },
    { label: 'الأرباح', command: 'عايز أعرف الأرباح', icon: '💰' },
  ],
  '/dashboard/erp/accounting': [
    { label: 'القيود المحاسبية', command: 'ورّيني القيود المحاسبية', icon: '📒' },
    { label: 'قيد جديد', command: 'أنشئ قيد محاسبي', icon: '➕' },
  ],
  '/dashboard/erp/inventory': [
    { label: 'المخزون', command: 'ورّيني حالة المخزون', icon: '📦' },
    { label: 'أصناف منخفضة', command: 'ورّيني الأصناف المنخفضة', icon: '⚠️' },
  ],
  '/dashboard/erp/hr': [
    { label: 'الموارد البشرية', command: 'افتح الموارد البشرية', icon: '👥' },
    { label: 'الموظفين', command: 'ورّيني قائمة الموظفين', icon: '👤' },
  ],
  '/dashboard/erp/purchasing-sales': [
    { label: 'المشتريات', command: 'ورّيني المشتريات والمبيعات', icon: '🛒' },
    { label: 'أمر شراء', command: 'أنشئ أمر شراء', icon: '➕' },
  ],
  '/dashboard/erp/cogs': [
    { label: 'تكلفة الإنتاج', command: 'ورّيني تكلفة الإنتاج', icon: '💵' },
  ],
  '/dashboard/erp/revenue-expenses': [
    { label: 'الإيرادات والمصروفات', command: 'ورّيني الإيرادات والمصروفات', icon: '📈' },
  ],
  '/dashboard/erp/financial-comparisons': [
    { label: 'مقارنات مالية', command: 'ورّيني المقارنات المالية', icon: '📊' },
  ],

  // ── الأسطول والمركبات ──
  '/dashboard/fleet': [
    { label: 'حالة العربيات', command: 'عايز أعرف حالة العربيات', icon: '🚗' },
    { label: 'صيانة مطلوبة', command: 'ورّيني العربيات اللي محتاجة صيانة', icon: '🔧' },
    { label: 'رخص منتهية', command: 'ورّيني الرخص اللي قربت تخلص', icon: '📝' },
    { label: 'إضافة مركبة', command: 'أضف مركبة جديدة', icon: '➕' },
  ],
  '/dashboard/fuel-management': [
    { label: 'استهلاك الوقود', command: 'عايز أعرف استهلاك الوقود', icon: '⛽' },
    { label: 'تعبئة جديدة', command: 'سجل تعبئة وقود', icon: '➕' },
    { label: 'تحليل التكلفة', command: 'ورّيني تحليل تكلفة الوقود', icon: '📊' },
  ],
  '/dashboard/preventive-maintenance': [
    { label: 'الصيانة الوقائية', command: 'ورّيني جدول الصيانة', icon: '🔧' },
    { label: 'صيانة جديدة', command: 'سجّل صيانة جديدة', icon: '➕' },
    { label: 'تنبيهات الصيانة', command: 'ورّيني تنبيهات الصيانة', icon: '⚠️' },
  ],
  '/dashboard/predictive-failure': [
    { label: 'التنبؤ بالأعطال', command: 'ورّيني التنبؤ بالأعطال', icon: '🔮' },
    { label: 'مركبات معرضة', command: 'ورّيني المركبات المعرضة للخطر', icon: '⚠️' },
  ],
  '/dashboard/cameras': [
    { label: 'الكاميرات', command: 'افتح الكاميرات', icon: '📷' },
    { label: 'كاميرا مباشرة', command: 'ورّيني البث المباشر', icon: '📹' },
  ],
  '/dashboard/gps-settings': [
    { label: 'إعدادات GPS', command: 'افتح إعدادات GPS', icon: '📡' },
    { label: 'تتبع مباشر', command: 'شغّل التتبع المباشر', icon: '📍' },
  ],
  '/dashboard/iot-settings': [
    { label: 'إعدادات IoT', command: 'افتح إعدادات IoT', icon: '📲' },
    { label: 'أجهزة متصلة', command: 'ورّيني الأجهزة المتصلة', icon: '🔌' },
  ],
  '/dashboard/iot-fill-prediction': [
    { label: 'تنبؤ الامتلاء', command: 'ورّيني تنبؤ امتلاء الحاويات', icon: '📊' },
  ],
  '/dashboard/smart-insurance': [
    { label: 'التأمين الذكي', command: 'ورّيني حالة التأمين', icon: '🛡️' },
    { label: 'تجديد التأمين', command: 'جدّد التأمين', icon: '🔄' },
  ],

  // ── السائقين ──
  '/dashboard/drivers': [
    { label: 'السواقين المتاحين', command: 'ورّيني السواقين المتاحين', icon: '👤' },
    { label: 'تقييمات السواقين', command: 'عايز تقييمات السواقين', icon: '⭐' },
    { label: 'إضافة سائق', command: 'أضف سائق جديد', icon: '➕' },
  ],
  '/dashboard/transporter-drivers': [
    { label: 'إدارة السواقين', command: 'ورّيني السواقين', icon: '👥' },
    { label: 'إضافة سائق', command: 'أضف سائق جديد', icon: '➕' },
    { label: 'تصاريح', command: 'افتح تصاريح السواقين', icon: '📋' },
    { label: 'تتبع', command: 'افتح تتبع السواقين', icon: '📍' },
  ],
  '/dashboard/driver-permits': [
    { label: 'التصاريح', command: 'ورّيني تصاريح السواقين', icon: '📋' },
    { label: 'تصريح جديد', command: 'أصدر تصريح جديد', icon: '➕' },
    { label: 'تصاريح منتهية', command: 'ورّيني التصاريح المنتهية', icon: '⚠️' },
  ],
  '/dashboard/driver-tracking': [
    { label: 'تتبع مباشر', command: 'ورّيني مواقع السواقين', icon: '📍' },
    { label: 'خريطة السواقين', command: 'افتح خريطة السواقين', icon: '🗺️' },
  ],
  '/dashboard/driver-onboarding': [
    { label: 'تأهيل سائق', command: 'ابدأ تأهيل سائق جديد', icon: '📋' },
    { label: 'الخطوات المتبقية', command: 'ورّيني خطوات التأهيل', icon: '📝' },
  ],
  '/dashboard/driver-contracts': [
    { label: 'عقود السواقين', command: 'ورّيني عقود السواقين', icon: '📑' },
    { label: 'عقد جديد', command: 'أنشئ عقد سائق جديد', icon: '➕' },
  ],
  '/dashboard/driver-approvals': [
    { label: 'موافقات السواقين', command: 'ورّيني الموافقات المعلقة', icon: '✅' },
  ],
  '/dashboard/driver-analytics': [
    { label: 'تحليلات السواقين', command: 'ورّيني تحليلات أداء السواقين', icon: '📊' },
  ],
  '/dashboard/loading-workers': [
    { label: 'عمال التحميل', command: 'ورّيني عمال التحميل', icon: '💪' },
    { label: 'إضافة عامل', command: 'أضف عامل تحميل', icon: '➕' },
  ],
  '/dashboard/quick-driver-links': [
    { label: 'روابط السواقين', command: 'أنشئ رابط سريع للسائق', icon: '🔗' },
  ],

  // ── صفحات السائق الشخصية ──
  '/dashboard/driver-my-route': [
    { label: 'مساري', command: 'ورّيني المسار القادم', icon: '🗺️' },
    { label: 'بدء الرحلة', command: 'ابدأ الرحلة', icon: '▶️' },
    { label: 'الملاحة', command: 'افتح الملاحة', icon: '🧭' },
    { label: 'إنهاء', command: 'إنهاء الرحلة', icon: '⏹️' },
  ],
  '/dashboard/driver-wallet': [
    { label: 'رصيدي', command: 'عايز أعرف رصيدي', icon: '💰' },
    { label: 'أرباح اليوم', command: 'كام أرباح النهارده', icon: '💵' },
    { label: 'سحب الأرباح', command: 'عايز أسحب أرباحي', icon: '🏦' },
  ],
  '/dashboard/driver-offers': [
    { label: 'العروض', command: 'ورّيني العروض المتاحة', icon: '📋' },
    { label: 'قبول عرض', command: 'اقبل أول عرض', icon: '✅' },
  ],
  '/dashboard/driver-trip-schedule': [
    { label: 'جدول اليوم', command: 'ورّيني جدول رحلاتي', icon: '📅' },
    { label: 'الرحلة الجاية', command: 'ورّيني الرحلة الجاية', icon: '⏭️' },
  ],
  '/dashboard/driver-profile': [
    { label: 'ملفي', command: 'افتح ملفي الشخصي', icon: '👤' },
    { label: 'تعديل بياناتي', command: 'عدّل بياناتي', icon: '✏️' },
  ],
  '/dashboard/driver-data': [
    { label: 'بياناتي', command: 'ورّيني بياناتي', icon: '📄' },
  ],
  '/dashboard/driver-rewards': [
    { label: 'المكافآت', command: 'ورّيني مكافآتي', icon: '🏆' },
    { label: 'نقاطي', command: 'كام نقاطي', icon: '⭐' },
  ],
  '/dashboard/driver-academy': [
    { label: 'الدورات', command: 'ورّيني الدورات المتاحة', icon: '🎓' },
    { label: 'شهاداتي', command: 'ورّيني شهاداتي', icon: '📜' },
  ],
  '/dashboard/my-location': [
    { label: 'موقعي', command: 'ورّيني موقعي الحالي', icon: '📍' },
  ],

  // ── التتبع والخرائط ──
  '/dashboard/tracking-center': [
    { label: 'تتبع مباشر', command: 'ورّيني التتبع المباشر', icon: '📍' },
    { label: 'تتبع السواقين', command: 'روح تتبع السواقين', icon: '🗺️' },
    { label: 'خريطة المسارات', command: 'افتح خريطة المسارات', icon: '🛣️' },
  ],
  '/dashboard/map-explorer': [
    { label: 'خريطة تفاعلية', command: 'افتح الخريطة التفاعلية', icon: '🗺️' },
    { label: 'بحث بالموقع', command: 'ابحث بالموقع', icon: '🔍' },
  ],
  '/dashboard/waze-live-map': [
    { label: 'خريطة ويز', command: 'افتح خريطة ويز المباشرة', icon: '🧭' },
  ],
  '/dashboard/admin-drivers-map': [
    { label: 'خريطة السواقين', command: 'ورّيني خريطة كل السواقين', icon: '🗺️' },
  ],
  '/dashboard/saved-locations': [
    { label: 'المواقع المحفوظة', command: 'ورّيني المواقع المحفوظة', icon: '📌' },
    { label: 'موقع جديد', command: 'أضف موقع جديد', icon: '➕' },
  ],
  '/dashboard/service-zones': [
    { label: 'مناطق الخدمة', command: 'ورّيني مناطق الخدمة', icon: '🗺️' },
    { label: 'إضافة منطقة', command: 'أضف منطقة خدمة', icon: '➕' },
  ],

  // ── الإيصالات والمستندات ──
  '/dashboard/create-receipt': [
    { label: 'إيصال جديد', command: 'أنشئ إيصال', icon: '🧾' },
  ],
  '/dashboard/generator-receipts': [
    { label: 'إيصالات المولّد', command: 'ورّيني إيصالات المولد', icon: '🧾' },
  ],
  '/dashboard/transporter-receipts': [
    { label: 'إيصالات الناقل', command: 'ورّيني إيصالات الناقل', icon: '🧾' },
  ],
  '/dashboard/document-center': [
    { label: 'المستندات', command: 'ورّيني المستندات', icon: '📄' },
    { label: 'رفع مستند', command: 'ارفع مستند جديد', icon: '📤' },
  ],
  '/dashboard/document-archive': [
    { label: 'الأرشيف', command: 'ابحث في الأرشيف', icon: '🗂️' },
  ],
  '/dashboard/smart-document-archive': [
    { label: 'أرشيف ذكي', command: 'ابحث في الأرشيف الذكي', icon: '🤖' },
  ],
  '/dashboard/document-verification': [
    { label: 'التحقق', command: 'تحقق من مستند', icon: '✅' },
  ],
  '/dashboard/central-document-registry': [
    { label: 'السجل المركزي', command: 'ورّيني السجل المركزي للمستندات', icon: '📚' },
  ],
  '/dashboard/organization-documents': [
    { label: 'مستندات المنظمة', command: 'ورّيني مستندات المنظمة', icon: '📁' },
  ],

  // ── العقود ──
  '/dashboard/contracts': [
    { label: 'عقود نشطة', command: 'ورّيني العقود النشطة', icon: '📑' },
    { label: 'عقود قربت تخلص', command: 'ورّيني العقود اللي قربت تنتهي', icon: '⚠️' },
    { label: 'عقد جديد', command: 'أنشئ عقد جديد', icon: '➕' },
  ],
  '/dashboard/contract-templates': [
    { label: 'قوالب العقود', command: 'ورّيني قوالب العقود', icon: '📋' },
  ],
  '/dashboard/verify-contract': [
    { label: 'التحقق من عقد', command: 'تحقق من صحة العقد', icon: '✅' },
  ],
  '/dashboard/municipal-contracts': [
    { label: 'عقود بلدية', command: 'ورّيني العقود البلدية', icon: '🏛️' },
  ],

  // ── التوقيعات والأختام ──
  '/dashboard/signing-inbox': [
    { label: 'صندوق التوقيع', command: 'ورّيني المستندات المطلوب توقيعها', icon: '✍️' },
    { label: 'توقيع الكل', command: 'وقّع كل المستندات', icon: '✅' },
  ],
  '/dashboard/signing-status': [
    { label: 'حالة التوقيعات', command: 'ورّيني حالة التوقيعات', icon: '📝' },
  ],
  '/dashboard/bulk-signing': [
    { label: 'توقيع جماعي', command: 'ابدأ التوقيع الجماعي', icon: '✍️' },
  ],
  '/dashboard/multi-sign-templates': [
    { label: 'قوالب التوقيع', command: 'ورّيني قوالب التوقيع المتعدد', icon: '📋' },
  ],
  '/dashboard/authorized-signatories': [
    { label: 'المفوضين', command: 'ورّيني المفوضين بالتوقيع', icon: '✍️' },
    { label: 'إضافة مفوض', command: 'أضف مفوض جديد', icon: '➕' },
  ],
  '/dashboard/admin-document-stamping': [
    { label: 'الأختام', command: 'ورّيني أختام المستندات', icon: '🔏' },
  ],
  '/dashboard/guilloche-patterns': [
    { label: 'أنماط الحماية', command: 'ورّيني أنماط الجيلوش', icon: '🎨' },
  ],

  // ── الشات والتواصل ──
  '/dashboard/chat': [
    { label: 'رسائل غير مقروءة', command: 'ورّيني الرسائل الجديدة', icon: '📩' },
    { label: 'رسالة جديدة', command: 'ابعت رسالة جديدة', icon: '✉️' },
    { label: 'بحث', command: 'ابحث في المحادثات', icon: '🔍' },
  ],
  '/dashboard/broadcast-channels': [
    { label: 'قنوات البث', command: 'ورّيني قنوات البث', icon: '📢' },
    { label: 'بث جديد', command: 'أنشئ بث جديد', icon: '➕' },
  ],
  '/dashboard/wapilot': [
    { label: 'واتساب', command: 'افتح واتساب WaPilot', icon: '💚' },
    { label: 'رسالة جماعية', command: 'ابعت رسالة جماعية', icon: '📨' },
  ],
  '/dashboard/call-center': [
    { label: 'الكول سنتر', command: 'افتح الكول سنتر', icon: '📞' },
    { label: 'مكالمة جديدة', command: 'ابدأ مكالمة', icon: '☎️' },
  ],
  '/dashboard/call-history': [
    { label: 'سجل المكالمات', command: 'ورّيني سجل المكالمات', icon: '📞' },
  ],

  // ── الشركاء ──
  '/dashboard/partners': [
    { label: 'الشركاء', command: 'ورّيني الشركاء', icon: '🤝' },
    { label: 'إضافة شريك', command: 'أضف شريك جديد', icon: '➕' },
    { label: 'بحث شريك', command: 'ابحث عن شريك', icon: '🔍' },
  ],
  '/dashboard/partner-reviews': [
    { label: 'تقييمات الشركاء', command: 'ورّيني تقييمات الشركاء', icon: '⭐' },
  ],
  '/dashboard/partners-timeline': [
    { label: 'الجدول الزمني', command: 'ورّيني الجدول الزمني للشركاء', icon: '📅' },
  ],
  '/dashboard/external-records': [
    { label: 'سجلات خارجية', command: 'ورّيني السجلات الخارجية', icon: '📂' },
  ],

  // ── التقارير والتحليلات ──
  '/dashboard/reports': [
    { label: 'تقرير الشهر', command: 'عايز تقرير الشهر ده', icon: '📊' },
    { label: 'تقرير الأسبوع', command: 'عايز تقرير الأسبوع', icon: '📈' },
    { label: 'تصدير', command: 'صدّر التقرير', icon: '📥' },
  ],
  '/dashboard/advanced-analytics': [
    { label: 'تحليلات متقدمة', command: 'ورّيني التحليلات المتقدمة', icon: '📊' },
    { label: 'تنبؤات', command: 'ورّيني التنبؤات', icon: '🔮' },
  ],
  '/dashboard/ai-forecasting': [
    { label: 'تنبؤات AI', command: 'ورّيني تنبؤات الذكاء الاصطناعي', icon: '🤖' },
  ],
  '/dashboard/smart-insights': [
    { label: 'رؤى ذكية', command: 'ورّيني الرؤى الذكية', icon: '🧠' },
    { label: 'توصيات', command: 'ورّيني التوصيات', icon: '💡' },
  ],
  '/dashboard/aggregate-report': [
    { label: 'تقرير مجمع', command: 'أنشئ تقرير مجمع', icon: '📑' },
  ],
  '/dashboard/benchmarking': [
    { label: 'المقارنة المرجعية', command: 'ورّيني المقارنة المرجعية', icon: '📊' },
  ],
  '/dashboard/market-intelligence': [
    { label: 'ذكاء السوق', command: 'ورّيني تحليل السوق', icon: '📈' },
  ],
  '/dashboard/visitor-analytics': [
    { label: 'تحليلات الزوار', command: 'ورّيني تحليلات الزوار', icon: '👥' },
  ],

  // ── البيئة والاستدامة ──
  '/dashboard/carbon-footprint': [
    { label: 'البصمة الكربونية', command: 'عايز أعرف البصمة الكربونية', icon: '🌍' },
    { label: 'تعويض الكربون', command: 'ورّيني خيارات تعويض الكربون', icon: '🌿' },
  ],
  '/dashboard/environmental-sustainability': [
    { label: 'الاستدامة', command: 'ورّيني مؤشرات الاستدامة', icon: '🌱' },
  ],
  '/dashboard/esg-reports': [
    { label: 'تقارير ESG', command: 'أنشئ تقرير ESG', icon: '📊' },
    { label: 'مؤشرات ESG', command: 'ورّيني مؤشرات ESG', icon: '📈' },
  ],
  '/dashboard/circular-economy': [
    { label: 'الاقتصاد الدائري', command: 'ورّيني مؤشرات الاقتصاد الدائري', icon: '♻️' },
  ],
  '/dashboard/circular-matcher': [
    { label: 'مطابقة دائرية', command: 'ابحث عن فرص التدوير', icon: '🔄' },
  ],
  '/dashboard/detailed-waste-analysis': [
    { label: 'تحليل نفايات', command: 'ورّيني تحليل النفايات التفصيلي', icon: '🔬' },
  ],
  '/dashboard/waste-flow-heatmap': [
    { label: 'خريطة حرارية', command: 'ورّيني خريطة تدفق النفايات', icon: '🗺️' },
  ],
  '/dashboard/environmental-passport': [
    { label: 'جواز بيئي', command: 'ورّيني الجواز البيئي', icon: '🌍' },
  ],

  // ── النفايات والسجلات ──
  '/dashboard/waste-types': [
    { label: 'أنواع النفايات', command: 'ورّيني أنواع النفايات', icon: '🏷️' },
  ],
  '/dashboard/non-hazardous-register': [
    { label: 'سجل غير خطر', command: 'افتح سجل المخلفات غير الخطرة', icon: '📗' },
    { label: 'إضافة قيد', command: 'أضف قيد جديد للسجل', icon: '➕' },
  ],
  '/dashboard/hazardous-register': [
    { label: 'سجل خطرة', command: 'افتح سجل المخلفات الخطرة', icon: '☢️' },
    { label: 'إضافة قيد', command: 'أضف قيد خطرة جديد', icon: '➕' },
  ],
  '/dashboard/smart-scale': [
    { label: 'الميزان الذكي', command: 'افتح الميزان الذكي', icon: '⚖️' },
    { label: 'وزنة جديدة', command: 'سجّل وزنة جديدة', icon: '➕' },
  ],
  '/dashboard/quick-weight': [
    { label: 'وزن سريع', command: 'سجّل وزن سريع', icon: '⚖️' },
  ],
  '/dashboard/bulk-weight-entries': [
    { label: 'وزنات جماعية', command: 'ورّيني الوزنات الجماعية', icon: '⚖️' },
  ],

  // ── الأسواق والبورصات ──
  '/dashboard/waste-exchange': [
    { label: 'عروض جديدة', command: 'ورّيني العروض الجديدة', icon: '🏷️' },
    { label: 'أسعار اليوم', command: 'عايز أسعار النهارده', icon: '💵' },
    { label: 'عرض جديد', command: 'أنشئ عرض جديد', icon: '➕' },
  ],
  '/dashboard/waste-auctions': [
    { label: 'المزادات النشطة', command: 'ورّيني المزادات النشطة', icon: '🔨' },
    { label: 'مزاد جديد', command: 'أنشئ مزاد جديد', icon: '➕' },
  ],
  '/dashboard/commodity-exchange': [
    { label: 'أسعار السلع', command: 'عايز أسعار السلع النهارده', icon: '💹' },
    { label: 'البورصة العالمية', command: 'افتح البورصة العالمية', icon: '🌍' },
  ],
  '/dashboard/b2b-marketplace': [
    { label: 'سوق B2B', command: 'افتح سوق الأعمال', icon: '🏪' },
  ],
  '/dashboard/secondary-materials': [
    { label: 'مواد ثانوية', command: 'ورّيني سوق المواد الثانوية', icon: '♻️' },
  ],
  '/dashboard/equipment-marketplace': [
    { label: 'سوق المعدات', command: 'ورّيني سوق المعدات', icon: '🔧' },
  ],
  '/dashboard/vehicle-marketplace': [
    { label: 'سوق المركبات', command: 'ورّيني سوق المركبات', icon: '🚛' },
  ],
  '/dashboard/wood-market': [
    { label: 'سوق الخشب', command: 'افتح سوق الخشب', icon: '🪵' },
  ],
  '/dashboard/futures-market': [
    { label: 'العقود الآجلة', command: 'ورّيني سوق العقود الآجلة', icon: '📈' },
  ],
  '/dashboard/smart-inventory': [
    { label: 'المخزون الذكي', command: 'ورّيني المخزون الذكي', icon: '📦' },
  ],

  // ── الإنتاج والتصنيع (المُدوّر) ──
  '/dashboard/production': [
    { label: 'حالة الإنتاج', command: 'عايز أعرف حالة الإنتاج', icon: '🏭' },
    { label: 'الطاقة المتاحة', command: 'كام الطاقة المتاحة', icon: '📊' },
    { label: 'خط إنتاج', command: 'شغّل خط الإنتاج', icon: '▶️' },
  ],
  '/dashboard/capacity-management': [
    { label: 'إدارة الطاقة', command: 'ورّيني الطاقة الاستيعابية', icon: '📊' },
    { label: 'تعديل الطاقة', command: 'عدّل الطاقة الاستيعابية', icon: '✏️' },
  ],
  '/dashboard/quality-control': [
    { label: 'مراقبة الجودة', command: 'ورّيني تقارير الجودة', icon: '✅' },
    { label: 'فحص جديد', command: 'سجّل فحص جودة', icon: '🔍' },
  ],
  '/dashboard/recycling-certificates': [
    { label: 'شهادات التدوير', command: 'ورّيني شهادات التدوير', icon: '📜' },
  ],
  '/dashboard/issue-recycling-certificates': [
    { label: 'إصدار شهادة', command: 'أصدر شهادة تدوير جديدة', icon: '🏅' },
  ],
  '/dashboard/pride-certificates': [
    { label: 'شهادات الفخر', command: 'ورّيني شهادات الفخر البيئي', icon: '🏆' },
  ],
  '/dashboard/equipment-custody': [
    { label: 'عهدة المعدات', command: 'ورّيني عهدة المعدات', icon: '🔧' },
  ],

  // ── التخلص النهائي ──
  '/dashboard/disposal': [
    { label: 'لوحة التخلص', command: 'افتح لوحة التخلص النهائي', icon: '🗑️' },
  ],
  '/dashboard/disposal/incoming-requests': [
    { label: 'طلبات واردة', command: 'ورّيني الطلبات الواردة', icon: '📥' },
    { label: 'قبول طلب', command: 'اقبل أول طلب وارد', icon: '✅' },
    { label: 'رفض طلب', command: 'ارفض الطلب', icon: '❌' },
  ],
  '/dashboard/disposal/operations': [
    { label: 'العمليات', command: 'ورّيني عمليات التخلص', icon: '⚙️' },
    { label: 'عملية جديدة', command: 'ابدأ عملية تخلص جديدة', icon: '➕' },
  ],
  '/dashboard/disposal/operations/new': [
    { label: 'عملية جديدة', command: 'أنشئ عملية تخلص جديدة', icon: '➕' },
    { label: 'اختر النوع', command: 'حدد نوع المخلفات', icon: '🏷️' },
    { label: 'بيانات العملية', command: 'أكمل بيانات العملية', icon: '📝' },
  ],
  '/dashboard/disposal/certificates': [
    { label: 'شهادات التخلص', command: 'ورّيني شهادات التخلص', icon: '📜' },
    { label: 'شهادة جديدة', command: 'أصدر شهادة تخلص', icon: '➕' },
  ],
  '/dashboard/disposal/certificates/new': [
    { label: 'شهادة جديدة', command: 'أنشئ شهادة تخلص جديدة', icon: '➕' },
    { label: 'اختر الشحنة', command: 'اختار الشحنة', icon: '📦' },
    { label: 'بيانات الشهادة', command: 'أكمل بيانات الشهادة', icon: '📝' },
  ],
  '/dashboard/disposal/reports': [
    { label: 'تقارير التخلص', command: 'ورّيني تقارير التخلص', icon: '📊' },
  ],
  '/dashboard/disposal/mission-control': [
    { label: 'مركز القيادة', command: 'افتح مركز القيادة', icon: '🎯' },
  ],
  '/dashboard/disposal-facilities': [
    { label: 'المنشآت', command: 'ورّيني منشآت التخلص', icon: '🏗️' },
  ],
  '/dashboard/transfer-stations': [
    { label: 'محطات الترحيل', command: 'ورّيني محطات الترحيل', icon: '🏗️' },
  ],

  // ── البلدية والنظافة ──
  '/dashboard/street-bins': [
    { label: 'صناديق الشوارع', command: 'ورّيني صناديق الشوارع', icon: '🗑️' },
  ],
  '/dashboard/sweeping-crews': [
    { label: 'أطقم الكنس', command: 'ورّيني أطقم الكنس', icon: '🧹' },
  ],
  '/dashboard/sweeping-equipment': [
    { label: 'معدات الكنس', command: 'ورّيني معدات الكنس', icon: '🧹' },
  ],
  '/dashboard/municipal-dashboard': [
    { label: 'لوحة بلدية', command: 'افتح اللوحة البلدية', icon: '🏛️' },
  ],
  '/dashboard/municipal-reports': [
    { label: 'تقارير بلدية', command: 'ورّيني التقارير البلدية', icon: '📊' },
  ],
  '/dashboard/citizen-complaints': [
    { label: 'شكاوى المواطنين', command: 'ورّيني شكاوى المواطنين', icon: '📢' },
  ],

  // ── الامتثال والتنظيم ──
  '/dashboard/permits': [
    { label: 'التصاريح', command: 'ورّيني التصاريح والتراخيص', icon: '📜' },
    { label: 'طلب تصريح', command: 'قدّم طلب تصريح', icon: '➕' },
  ],
  '/dashboard/laws-regulations': [
    { label: 'القوانين', command: 'ورّيني القوانين واللوائح', icon: '⚖️' },
    { label: 'بحث قانوني', command: 'ابحث في القوانين', icon: '🔍' },
  ],
  '/dashboard/regulatory-updates': [
    { label: 'تحديثات تنظيمية', command: 'ورّيني آخر التحديثات التنظيمية', icon: '📰' },
  ],
  '/dashboard/regulatory-documents': [
    { label: 'مستندات تنظيمية', command: 'ورّيني المستندات التنظيمية', icon: '📂' },
  ],
  '/dashboard/regulatory-violations': [
    { label: 'المخالفات', command: 'ورّيني المخالفات التنظيمية', icon: '⚠️' },
  ],
  '/dashboard/compliance-analysis': [
    { label: 'تحليل الامتثال', command: 'ورّيني تحليل الامتثال', icon: '📊' },
  ],
  '/dashboard/compliance-assessment': [
    { label: 'تقييم الامتثال', command: 'ابدأ تقييم الامتثال', icon: '✅' },
  ],
  '/dashboard/operational-plans': [
    { label: 'الخطط التشغيلية', command: 'ورّيني الخطط التشغيلية', icon: '📋' },
  ],
  '/dashboard/legal-shield': [
    { label: 'الحماية القانونية', command: 'افتح الحماية القانونية', icon: '🛡️' },
  ],
  '/dashboard/gdpr-compliance': [
    { label: 'حماية البيانات', command: 'ورّيني حالة حماية البيانات', icon: '🔒' },
  ],
  '/dashboard/restrictions-monitor': [
    { label: 'مراقبة القيود', command: 'ورّيني القيود النشطة', icon: '🚫' },
  ],

  // ── الجهات الرقابية ──
  '/dashboard/regulator': [
    { label: 'لوحة الرقابة', command: 'افتح لوحة الرقابة', icon: '🏛️' },
  ],
  '/dashboard/regulator-wmra': [
    { label: 'جهاز المخلفات', command: 'افتح جهاز تنظيم إدارة المخلفات', icon: '🏛️' },
  ],
  '/dashboard/regulator-eeaa': [
    { label: 'شؤون البيئة', command: 'افتح جهاز شؤون البيئة', icon: '🌿' },
  ],
  '/dashboard/regulator-ida': [
    { label: 'التنمية الصناعية', command: 'افتح هيئة التنمية الصناعية', icon: '🏭' },
  ],
  '/dashboard/regulator-ltra': [
    { label: 'النقل البري', command: 'افتح هيئة النقل البري', icon: '🚛' },
  ],
  '/dashboard/regulated-companies': [
    { label: 'الشركات الخاضعة', command: 'ورّيني الشركات الخاضعة للرقابة', icon: '🏢' },
  ],
  '/dashboard/penalties-management': [
    { label: 'إدارة الغرامات', command: 'ورّيني الغرامات والعقوبات', icon: '⚠️' },
  ],
  '/dashboard/entity-census': [
    { label: 'تعداد الجهات', command: 'ورّيني تعداد الجهات', icon: '📊' },
  ],

  // ── الاستشارات ──
  '/dashboard/consultant-portal': [
    { label: 'بوابة المستشار', command: 'افتح بوابة المستشار', icon: '👨‍🔬' },
  ],
  '/dashboard/consultant-clients': [
    { label: 'عملاء الاستشارات', command: 'ورّيني عملائي', icon: '👥' },
  ],
  '/dashboard/consultant-reports': [
    { label: 'تقارير استشارية', command: 'ورّيني التقارير الاستشارية', icon: '📈' },
  ],
  '/dashboard/consultant-certifications': [
    { label: 'الشهادات', command: 'ورّيني شهاداتي المهنية', icon: '📜' },
  ],
  '/dashboard/environmental-consultants': [
    { label: 'المستشارين', command: 'ورّيني المستشارين البيئيين', icon: '👨‍🔬' },
  ],
  '/dashboard/office-consultants': [
    { label: 'مستشارو المكتب', command: 'ورّيني مستشارو المكتب', icon: '👥' },
  ],
  '/dashboard/office-performance': [
    { label: 'أداء المكتب', command: 'ورّيني أداء المكتب', icon: '📊' },
  ],
  '/dashboard/office-tasks': [
    { label: 'مهام المكتب', command: 'ورّيني مهام المكتب', icon: '📋' },
  ],

  // ── العمليات ──
  '/dashboard/operations': [
    { label: 'عمليات اليوم', command: 'ورّيني عمليات النهارده', icon: '📊' },
    { label: 'التوزيع الذكي', command: 'شغّل التوزيع الذكي', icon: '🤖' },
  ],
  '/dashboard/manual-operations': [
    { label: 'العمليات اليدوية', command: 'افتح العمليات اليدوية', icon: '✏️' },
  ],

  // ── الذكاء الاصطناعي ──
  '/dashboard/ai-tools': [
    { label: 'أدوات AI', command: 'ورّيني أدوات الذكاء الاصطناعي', icon: '🤖' },
  ],
  '/dashboard/transporter-ai-tools': [
    { label: 'AI الناقل', command: 'ورّيني أدوات AI للناقل', icon: '🤖' },
  ],
  '/dashboard/recycler-ai-tools': [
    { label: 'AI المُدوّر', command: 'ورّيني أدوات AI للمُدوّر', icon: '🤖' },
  ],
  '/dashboard/ai-document-studio': [
    { label: 'استوديو المستندات', command: 'افتح استوديو المستندات الذكي', icon: '📄' },
  ],
  '/dashboard/ai-extracted-data': [
    { label: 'بيانات مستخرجة', command: 'ورّيني البيانات المستخرجة بالـ AI', icon: '🔍' },
  ],
  '/dashboard/smart-agent': [
    { label: 'الوكيل الذكي', command: 'افتح الوكيل الذكي', icon: '🤖' },
  ],

  // ── الموارد البشرية ──
  '/dashboard/employees': [
    { label: 'الموظفين', command: 'ورّيني قائمة الموظفين', icon: '👥' },
    { label: 'إضافة موظف', command: 'أضف موظف جديد', icon: '➕' },
  ],
  '/dashboard/hr/payroll': [
    { label: 'الرواتب', command: 'ورّيني كشف الرواتب', icon: '💰' },
    { label: 'إصدار الرواتب', command: 'أصدر رواتب الشهر', icon: '💵' },
  ],
  '/dashboard/hr/performance': [
    { label: 'تقييم الأداء', command: 'ورّيني تقييمات الأداء', icon: '📊' },
  ],
  '/dashboard/hr/shifts': [
    { label: 'الورديات', command: 'ورّيني جدول الورديات', icon: '🕐' },
    { label: 'وردية جديدة', command: 'أنشئ جدول ورديات', icon: '➕' },
  ],
  '/dashboard/hr/org-chart': [
    { label: 'الهيكل التنظيمي', command: 'ورّيني الهيكل التنظيمي', icon: '🏗️' },
  ],
  '/dashboard/hr/end-of-service': [
    { label: 'نهاية الخدمة', command: 'احسب مكافأة نهاية الخدمة', icon: '💰' },
  ],
  '/dashboard/hr/self-service': [
    { label: 'الخدمة الذاتية', command: 'افتح خدمات الموظفين', icon: '👤' },
    { label: 'طلب إجازة', command: 'قدّم طلب إجازة', icon: '📅' },
  ],
  '/dashboard/daily-attendance': [
    { label: 'الحضور', command: 'ورّيني الحضور والانصراف', icon: '📅' },
    { label: 'تسجيل حضور', command: 'سجّل حضوري', icon: '✅' },
  ],
  '/dashboard/org-structure': [
    { label: 'هيكل المنظمة', command: 'ورّيني هيكل المنظمة', icon: '🏗️' },
  ],
  '/dashboard/team-credentials': [
    { label: 'بيانات الفريق', command: 'ورّيني بيانات اعتماد الفريق', icon: '🔑' },
  ],
  '/dashboard/cv-builder': [
    { label: 'بناء السيرة', command: 'ابدأ بناء السيرة الذاتية', icon: '📄' },
  ],

  // ── التوظيف (أُمالونا) ──
  '/dashboard/omaluna': [
    { label: 'أُمالونا', command: 'افتح منصة التوظيف', icon: '💼' },
    { label: 'وظائف متاحة', command: 'ورّيني الوظائف المتاحة', icon: '🔍' },
  ],
  '/dashboard/omaluna/post-job': [
    { label: 'نشر وظيفة', command: 'أنشر وظيفة جديدة', icon: '➕' },
  ],
  '/dashboard/omaluna/my-jobs': [
    { label: 'وظائفي', command: 'ورّيني وظائفي المنشورة', icon: '📋' },
  ],
  '/dashboard/omaluna/my-applications': [
    { label: 'طلباتي', command: 'ورّيني طلبات التوظيف', icon: '📝' },
  ],
  '/dashboard/omaluna/my-profile': [
    { label: 'ملفي المهني', command: 'افتح ملفي المهني', icon: '👤' },
  ],
  '/dashboard/smart-job-recommendations': [
    { label: 'توصيات وظائف', command: 'ورّيني الوظائف المقترحة', icon: '🤖' },
  ],
  '/dashboard/lead-generation': [
    { label: 'توليد العملاء', command: 'ورّيني فرص العملاء', icon: '🎯' },
  ],

  // ── الإعدادات والملف الشخصي ──
  '/dashboard/settings': [
    { label: 'الإعدادات', command: 'ورّيني الإعدادات', icon: '⚙️' },
    { label: 'تغيير كلمة السر', command: 'غيّر كلمة السر', icon: '🔒' },
  ],
  '/dashboard/my-profile': [
    { label: 'ملفي', command: 'ورّيني ملفي الشخصي', icon: '👤' },
    { label: 'تعديل', command: 'عدّل بياناتي', icon: '✏️' },
  ],
  '/dashboard/my-data': [
    { label: 'بياناتي', command: 'ورّيني بياناتي', icon: '📄' },
  ],
  '/dashboard/organization-profile': [
    { label: 'ملف المنظمة', command: 'ورّيني ملف المنظمة', icon: '🏢' },
  ],
  '/dashboard/digital-identity-card': [
    { label: 'الهوية الرقمية', command: 'ورّيني هويتي الرقمية', icon: '🪪' },
  ],

  // ── الإدارة والنظام ──
  '/dashboard/notifications': [
    { label: 'الإشعارات', command: 'ورّيني الإشعارات', icon: '🔔' },
    { label: 'إشعارات غير مقروءة', command: 'ورّيني الإشعارات الجديدة', icon: '🆕' },
  ],
  '/dashboard/activity-log': [
    { label: 'سجل النشاط', command: 'ورّيني سجل النشاط', icon: '📝' },
  ],
  '/dashboard/auto-actions': [
    { label: 'الأتمتة', command: 'ورّيني الإجراءات التلقائية', icon: '🤖' },
    { label: 'إجراء تلقائي', command: 'أنشئ إجراء تلقائي جديد', icon: '➕' },
  ],
  '/dashboard/system-status': [
    { label: 'حالة النظام', command: 'ورّيني حالة النظام', icon: '🟢' },
  ],
  '/dashboard/system-overview': [
    { label: 'نظرة عامة', command: 'ورّيني نظرة عامة على النظام', icon: '📊' },
  ],
  '/dashboard/data-export': [
    { label: 'تصدير البيانات', command: 'صدّر البيانات', icon: '📥' },
  ],
  '/dashboard/db-optimization': [
    { label: 'تحسين القاعدة', command: 'ورّيني حالة قاعدة البيانات', icon: '🔧' },
  ],

  // ── الأمان ──
  '/dashboard/cyber-security': [
    { label: 'الأمن السيبراني', command: 'ورّيني حالة الأمن السيبراني', icon: '🔒' },
  ],
  '/dashboard/admin-cyber-security': [
    { label: 'أمن النظام', command: 'ورّيني تقرير أمن النظام', icon: '🛡️' },
  ],
  '/dashboard/security-testing': [
    { label: 'اختبار الأمان', command: 'ابدأ اختبار الأمان', icon: '🧪' },
  ],
  '/dashboard/audit-sessions': [
    { label: 'جلسات التدقيق', command: 'ورّيني جلسات التدقيق', icon: '🔍' },
  ],

  // ── إدارة الشركات ──
  '/dashboard/company-management': [
    { label: 'إدارة الشركات', command: 'ورّيني الشركات', icon: '🏢' },
  ],
  '/dashboard/company-approvals': [
    { label: 'موافقات الشركات', command: 'ورّيني الموافقات المعلقة', icon: '✅' },
  ],
  '/dashboard/company-directory': [
    { label: 'دليل الشركات', command: 'ابحث في دليل الشركات', icon: '📒' },
  ],
  '/dashboard/add-organization': [
    { label: 'إضافة منظمة', command: 'أضف منظمة جديدة', icon: '➕' },
  ],
  '/dashboard/onboarding-review': [
    { label: 'مراجعة التسجيل', command: 'ورّيني طلبات التسجيل الجديدة', icon: '📋' },
  ],

  // ── الإعلانات ──
  '/dashboard/my-ads': [
    { label: 'إعلاناتي', command: 'ورّيني إعلاناتي', icon: '📢' },
    { label: 'إعلان جديد', command: 'أنشئ إعلان جديد', icon: '➕' },
  ],
  '/dashboard/ad-plans': [
    { label: 'خطط الإعلان', command: 'ورّيني خطط الإعلانات', icon: '📋' },
  ],

  // ── المحتوى والتسويق ──
  '/dashboard/feed': [
    { label: 'آخر الأخبار', command: 'ورّيني آخر الأخبار', icon: '📰' },
    { label: 'منشور جديد', command: 'أنشئ منشور جديد', icon: '➕' },
  ],
  '/dashboard/stories': [
    { label: 'القصص', command: 'ورّيني القصص', icon: '📱' },
  ],
  '/dashboard/reels': [
    { label: 'الريلز', command: 'ورّيني الريلز', icon: '🎬' },
  ],
  '/dashboard/posts-manager': [
    { label: 'إدارة المنشورات', command: 'ورّيني المنشورات', icon: '📝' },
  ],
  '/dashboard/blog-manager': [
    { label: 'إدارة المدونة', command: 'ورّيني المقالات', icon: '📰' },
  ],
  '/dashboard/news-manager': [
    { label: 'إدارة الأخبار', command: 'ورّيني الأخبار', icon: '📰' },
  ],
  '/dashboard/homepage-manager': [
    { label: 'إدارة الرئيسية', command: 'عدّل الصفحة الرئيسية', icon: '🏠' },
  ],
  '/dashboard/testimonials-management': [
    { label: 'آراء العملاء', command: 'ورّيني آراء العملاء', icon: '⭐' },
  ],
  '/dashboard/video-generator': [
    { label: 'مولد الفيديو', command: 'أنشئ فيديو جديد', icon: '🎬' },
  ],
  '/dashboard/video-series': [
    { label: 'سلاسل فيديو', command: 'ورّيني سلاسل الفيديو', icon: '📹' },
  ],

  // ── بوابات العملاء ──
  '/dashboard/customer-portal': [
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
  ],
  '/dashboard/white-label-portal': [
    { label: 'وايت ليبل', command: 'افتح بوابة الوايت ليبل', icon: '🏷️' },
  ],
  '/dashboard/scoped-access-links': [
    { label: 'روابط وصول', command: 'أنشئ رابط وصول محدود', icon: '🔗' },
  ],
  '/dashboard/shared-links': [
    { label: 'روابط مشاركة', command: 'ورّيني الروابط المشاركة', icon: '🔗' },
  ],
  '/dashboard/quick-shipment-links': [
    { label: 'روابط شحن', command: 'أنشئ رابط شحن سريع', icon: '🔗' },
  ],

  // ── الدعم والتعلم ──
  '/dashboard/help-center': [
    { label: 'مركز المساعدة', command: 'عايز مساعدة', icon: '❓' },
  ],
  '/dashboard/support': [
    { label: 'الدعم الفني', command: 'تواصل مع الدعم', icon: '🎧' },
  ],
  '/dashboard/learning-center': [
    { label: 'مركز التعلم', command: 'افتح مركز التعلم', icon: '📚' },
  ],
  '/dashboard/user-guide': [
    { label: 'دليل المستخدم', command: 'افتح دليل المستخدم', icon: '📖' },
  ],
  '/dashboard/navigation-demo': [
    { label: 'جولة تعريفية', command: 'ابدأ الجولة التعريفية', icon: '🎯' },
  ],
  '/dashboard/demo-scenario': [
    { label: 'سيناريو تجريبي', command: 'شغّل السيناريو التجريبي', icon: '🎬' },
  ],
  '/dashboard/reports-guide': [
    { label: 'دليل التقارير', command: 'ورّيني دليل التقارير', icon: '📖' },
  ],

  // ── اللوحات التنفيذية ──
  '/dashboard/executive': [
    { label: 'لوحة تنفيذية', command: 'ورّيني اللوحة التنفيذية', icon: '📊' },
  ],
  '/dashboard/executive-summary': [
    { label: 'ملخص تنفيذي', command: 'عايز الملخص التنفيذي', icon: '📋' },
  ],
  '/dashboard/admin-revenue': [
    { label: 'إيرادات النظام', command: 'ورّيني إيرادات النظام', icon: '💰' },
  ],

  // ── الولاء والمكافآت ──
  '/dashboard/gamification': [
    { label: 'المكافآت', command: 'ورّيني نظام المكافآت', icon: '🏆' },
  ],
  '/dashboard/b2b-loyalty': [
    { label: 'ولاء B2B', command: 'ورّيني برنامج ولاء الأعمال', icon: '💎' },
  ],
  '/dashboard/community-rewards': [
    { label: 'مكافآت المجتمع', command: 'ورّيني مكافآت المجتمع', icon: '🏆' },
  ],
  '/dashboard/c2b-management': [
    { label: 'إدارة C2B', command: 'ورّيني إدارة تجميع الأفراد', icon: '🏘️' },
  ],
  '/dashboard/award-letters': [
    { label: 'خطابات التقدير', command: 'ورّيني خطابات التقدير', icon: '🏅' },
  ],

  // ── القرطاسية والطباعة ──
  '/dashboard/stationery': [
    { label: 'القرطاسية', command: 'ورّيني تصاميم القرطاسية', icon: '📐' },
  ],
  '/dashboard/stationery-plans': [
    { label: 'خطط القرطاسية', command: 'ورّيني خطط القرطاسية', icon: '📋' },
  ],
  '/dashboard/print-center': [
    { label: 'مركز الطباعة', command: 'افتح مركز الطباعة', icon: '🖨️' },
  ],
  '/dashboard/admin-branding': [
    { label: 'الهوية البصرية', command: 'ورّيني الهوية البصرية', icon: '🎨' },
  ],

  // ── الصحة والسلامة ──
  '/dashboard/health': [
    { label: 'الصحة', command: 'افتح صفحة الصحة', icon: '❤️' },
  ],
  '/dashboard/safety': [
    { label: 'السلامة', command: 'ورّيني إجراءات السلامة', icon: '🦺' },
  ],
  '/dashboard/worker-safety': [
    { label: 'سلامة العمال', command: 'ورّيني تقارير سلامة العمال', icon: '👷' },
  ],
  '/dashboard/ohs-reports': [
    { label: 'تقارير OHS', command: 'ورّيني تقارير الصحة والسلامة', icon: '📊' },
  ],
  '/dashboard/emergency-response': [
    { label: 'الطوارئ', command: 'افتح خطة الاستجابة للطوارئ', icon: '🆘' },
  ],
  '/dashboard/medical-program': [
    { label: 'البرنامج الطبي', command: 'ورّيني البرنامج الطبي', icon: '🏥' },
  ],

  // ── API والتكامل ──
  '/dashboard/api': [
    { label: 'إعدادات API', command: 'ورّيني إعدادات API', icon: '🔌' },
  ],
  '/dashboard/webhooks': [
    { label: 'Webhooks', command: 'ورّيني الـ Webhooks', icon: '🔗' },
  ],
  '/dashboard/developer-portal': [
    { label: 'بوابة المطور', command: 'افتح بوابة المطور', icon: '💻' },
  ],

  // ── مهام وملاحظات ──
  '/dashboard/task-board': [
    { label: 'لوحة المهام', command: 'ورّيني المهام', icon: '📋' },
    { label: 'مهمة جديدة', command: 'أنشئ مهمة جديدة', icon: '➕' },
  ],
  '/dashboard/notes': [
    { label: 'الملاحظات', command: 'ورّيني الملاحظات', icon: '📝' },
    { label: 'ملاحظة جديدة', command: 'أنشئ ملاحظة جديدة', icon: '➕' },
  ],
  '/dashboard/meetings': [
    { label: 'الاجتماعات', command: 'ورّيني الاجتماعات', icon: '📅' },
    { label: 'اجتماع جديد', command: 'جدوّل اجتماع', icon: '➕' },
  ],
  '/dashboard/my-workspace': [
    { label: 'مساحة العمل', command: 'افتح مساحة العمل', icon: '🖥️' },
  ],
  '/dashboard/my-requests': [
    { label: 'طلباتي', command: 'ورّيني طلباتي', icon: '📋' },
  ],

  // ── الحوكمة ──
  '/dashboard/governance': [
    { label: 'الحوكمة', command: 'ورّيني لوحة الحوكمة', icon: '🏛️' },
  ],
  '/dashboard/digital-maturity': [
    { label: 'النضج الرقمي', command: 'ورّيني تقييم النضج الرقمي', icon: '📊' },
  ],

  // ── الاشتراكات والخطط ──
  '/dashboard/subscription': [
    { label: 'الاشتراك', command: 'ورّيني خطة اشتراكي', icon: '💳' },
    { label: 'ترقية', command: 'عايز أرقّي اشتراكي', icon: '⬆️' },
  ],

  // ── صفحات معلوماتية ──
  '/dashboard/about-platform': [
    { label: 'عن المنصة', command: 'ورّيني معلومات عن المنصة', icon: 'ℹ️' },
  ],
  '/dashboard/platform-features': [
    { label: 'مميزات المنصة', command: 'ورّيني مميزات المنصة', icon: '⭐' },
  ],
  '/dashboard/platform-terms': [
    { label: 'الشروط', command: 'ورّيني شروط الاستخدام', icon: '📜' },
  ],
  '/dashboard/platform-brochure': [
    { label: 'بروشور', command: 'ورّيني بروشور المنصة', icon: '📖' },
  ],
  '/dashboard/terms-acceptances': [
    { label: 'القبولات', command: 'ورّيني حالة قبول الشروط', icon: '✅' },
  ],

  // ── أدوات متنوعة ──
  '/dashboard/action-chains': [
    { label: 'سلاسل الإجراءات', command: 'ورّيني سلاسل الإجراءات', icon: '🔗' },
  ],
  '/dashboard/cross-impact': [
    { label: 'الأثر المتقاطع', command: 'ورّيني تحليل الأثر المتقاطع', icon: '🔄' },
  ],
  '/dashboard/system-commands': [
    { label: 'أوامر النظام', command: 'ورّيني أوامر النظام', icon: '⚡' },
  ],
  '/dashboard/architecture-guide': [
    { label: 'دليل المعمارية', command: 'ورّيني دليل المعمارية', icon: '📐' },
  ],
  '/dashboard/system-screenshots': [
    { label: 'لقطات النظام', command: 'ورّيني لقطات النظام', icon: '📸' },
  ],
  '/dashboard/offline-mode': [
    { label: 'وضع أوفلاين', command: 'شغّل الوضع بدون إنترنت', icon: '📴' },
  ],
  '/dashboard/push-notification-stats': [
    { label: 'إحصائيات الإشعارات', command: 'ورّيني إحصائيات الإشعارات', icon: '📊' },
  ],
  '/dashboard/smart-archive': [
    { label: 'الأرشيف الذكي', command: 'ابحث في الأرشيف الذكي', icon: '🗂️' },
  ],
  '/dashboard/central-registry': [
    { label: 'السجل المركزي', command: 'افتح السجل المركزي', icon: '📚' },
  ],
  '/dashboard/admin-attestations': [
    { label: 'التصديقات', command: 'ورّيني التصديقات', icon: '📝' },
  ],
  '/dashboard/organization-attestation': [
    { label: 'تصديق المنظمة', command: 'ورّيني تصديق المنظمة', icon: '📝' },
  ],
};

// ═══════════════════════════════════════════════════════════
// أوامر حسب الدور (Role-based Commands)
// ═══════════════════════════════════════════════════════════
const ROLE_COMMANDS: Record<string, ContextualCommand[]> = {
  // ══════════════════════════════════════
  // المولّد (Generator) — 50 أمر
  // ══════════════════════════════════════
  generator: [
    // الشحنات والعمليات
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'طلباتي', command: 'افتح طلباتي', icon: '📋' },
    { label: 'طلب تجميع', command: 'أنشئ طلب تجميع جديد', icon: '🚛' },
    { label: 'إيصال جديد', command: 'أنشئ إيصال جديد', icon: '🧾' },
    { label: 'شحنة يدوية', command: 'أنشئ شحنة يدوية', icon: '✏️' },
    { label: 'إقرار تسليم', command: 'افتح إقرارات التسليم', icon: '📝' },
    { label: 'أمر شغل', command: 'أنشئ أمر شغل جديد', icon: '📋' },
    { label: 'شحنات متكررة', command: 'افتح الشحنات المتكررة', icon: '🔄' },
    { label: 'شحنات مرفوضة', command: 'ورّيني الشحنات المرفوضة', icon: '❌' },
    // السجلات البيئية
    { label: 'سجل غير خطر', command: 'افتح سجل المخلفات غير الخطرة', icon: '📗' },
    { label: 'سجل خطرة', command: 'افتح سجل المخلفات الخطرة', icon: '☢️' },
    { label: 'تصنيف النفايات', command: 'افتح تصنيف النفايات', icon: '🏷️' },
    { label: 'وزن سريع', command: 'سجل وزن سريع', icon: '⚖️' },
    { label: 'الميزان الذكي', command: 'افتح الميزان الذكي', icon: '⚖️' },
    // التقارير والتحليلات
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'افتح تقارير الاستدامة البيئية', icon: '🌱' },
    { label: 'تقرير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'تحليل النفايات', command: 'افتح تحليل النفايات التفصيلي', icon: '🔬' },
    { label: 'تقارير الشحنات', command: 'افتح تقارير الشحنات', icon: '📈' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'جواز بيئي', command: 'ورّيني الجواز البيئي', icon: '🌍' },
    { label: 'اقتصاد دائري', command: 'ورّيني مؤشرات الاقتصاد الدائري', icon: '♻️' },
    // القانون والامتثال
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    { label: 'التراخيص', command: 'افتح التصاريح والتراخيص', icon: '📜' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'المستندات التنظيمية', command: 'افتح المستندات التنظيمية', icon: '📂' },
    { label: 'الخطط التشغيلية', command: 'افتح الخطط التشغيلية', icon: '📋' },
    { label: 'مستشارين بيئيين', command: 'ورّيني المستشارين البيئيين', icon: '👨‍🔬' },
    { label: 'تقييم الامتثال', command: 'ابدأ تقييم الامتثال', icon: '✅' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'الحسابات', command: 'افتح الحسابات', icon: '💳' },
    { label: 'كشف حساب', command: 'عايز كشف حساب', icon: '📋' },
    { label: 'الفواتير', command: 'ورّيني الفواتير', icon: '🧾' },
    // العقود
    { label: 'العقود', command: 'ورّيني العقود', icon: '📑' },
    { label: 'عقد جديد', command: 'أنشئ عقد جديد', icon: '➕' },
    // الإدارة
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
    { label: 'روابط سريعة', command: 'افتح روابط الشحن السريعة', icon: '🔗' },
    { label: 'روابط إيداع', command: 'افتح روابط الإيداع السريعة', icon: '💳' },
    { label: 'الشركاء', command: 'ورّيني الشركاء', icon: '🤝' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'الموظفين', command: 'ورّيني الموظفين', icon: '👥' },
    { label: 'مركز المستندات', command: 'افتح مركز المستندات', icon: '📄' },
    { label: 'صندوق التوقيع', command: 'ورّيني المستندات المطلوب توقيعها', icon: '✍️' },
    { label: 'سجل النشاط', command: 'ورّيني سجل النشاط', icon: '📝' },
    { label: 'الاشتراك', command: 'ورّيني اشتراكي', icon: '💳' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
  ],

  // ══════════════════════════════════════
  // الناقل (Transporter) — 60 أمر
  // ══════════════════════════════════════
  transporter: [
    // الشحنات
    { label: 'شحنات الناقل', command: 'افتح شحنات الناقل', icon: '📦' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'شحنات مرفوضة', command: 'افتح الشحنات المرفوضة', icon: '❌' },
    { label: 'شحنات متكررة', command: 'افتح الشحنات المتكررة', icon: '🔄' },
    { label: 'شحنة يدوية', command: 'أنشئ شحنة يدوية', icon: '✏️' },
    { label: 'إيصالات الناقل', command: 'افتح إيصالات الناقل', icon: '🧾' },
    { label: 'أوامر الشغل', command: 'ورّيني أوامر الشغل', icon: '📋' },
    { label: 'إقرارات التسليم', command: 'افتح إقرارات التسليم', icon: '📝' },
    // السائقين
    { label: 'إدارة السواقين', command: 'افتح إدارة السواقين', icon: '👥' },
    { label: 'إضافة سائق', command: 'أضف سائق جديد', icon: '➕' },
    { label: 'تصاريح السواقين', command: 'افتح تصاريح السواقين', icon: '📋' },
    { label: 'تتبع السواقين', command: 'افتح تتبع السواقين', icon: '📍' },
    { label: 'تأهيل سائق', command: 'ابدأ تأهيل سائق جديد', icon: '📋' },
    { label: 'عقود السواقين', command: 'ورّيني عقود السواقين', icon: '📑' },
    { label: 'موافقات السواقين', command: 'ورّيني موافقات السواقين', icon: '✅' },
    { label: 'تحليلات السواقين', command: 'ورّيني تحليلات أداء السواقين', icon: '📊' },
    { label: 'عمال التحميل', command: 'افتح عمال التحميل', icon: '💪' },
    { label: 'روابط السواقين', command: 'أنشئ رابط سريع للسائق', icon: '🔗' },
    // الأسطول والمعدات
    { label: 'الأسطول', command: 'افتح إدارة الأسطول', icon: '🚛' },
    { label: 'إدارة الوقود', command: 'افتح إدارة الوقود', icon: '⛽' },
    { label: 'صيانة وقائية', command: 'افتح الصيانة الوقائية', icon: '🔧' },
    { label: 'تنبؤ الأعطال', command: 'ورّيني التنبؤ بالأعطال', icon: '🔮' },
    { label: 'الكاميرات', command: 'افتح الكاميرات', icon: '📷' },
    { label: 'إعدادات GPS', command: 'افتح إعدادات GPS', icon: '📡' },
    { label: 'إعدادات IoT', command: 'افتح إعدادات IoT', icon: '📲' },
    { label: 'التأمين', command: 'ورّيني حالة التأمين', icon: '🛡️' },
    // التتبع والخرائط
    { label: 'مركز التتبع', command: 'افتح مركز التتبع', icon: '🗺️' },
    { label: 'خريطة المسارات', command: 'افتح خريطة المسارات', icon: '🛣️' },
    { label: 'خريطة ويز', command: 'افتح خريطة ويز', icon: '🧭' },
    { label: 'خريطة تفاعلية', command: 'افتح الخريطة التفاعلية', icon: '🗺️' },
    // العمليات
    { label: 'لوحة العمليات', command: 'افتح لوحة العمليات', icon: '📊' },
    { label: 'طلبات التجميع', command: 'افتح طلبات التجميع', icon: '📋' },
    { label: 'تجميع B2C', command: 'افتح طلبات تجميع الأفراد', icon: '🏘️' },
    { label: 'خطوط التجميع', command: 'ورّيني خطوط التجميع', icon: '🛣️' },
    { label: 'رحلات التجميع', command: 'ورّيني رحلات التجميع', icon: '📅' },
    { label: 'التوزيع الذكي', command: 'شغّل التوزيع الذكي', icon: '🤖' },
    { label: 'مناطق الخدمة', command: 'ورّيني مناطق الخدمة', icon: '🗺️' },
    // التراخيص والامتثال
    { label: 'التراخيص', command: 'ورّيني حالة التراخيص', icon: '📜' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'المخالفات', command: 'ورّيني المخالفات', icon: '⚠️' },
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    // التحليلات والتقارير
    { label: 'أدوات AI', command: 'افتح أدوات الذكاء الاصطناعي', icon: '🤖' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'تقارير الشحنات', command: 'افتح تقارير الشحنات', icon: '📈' },
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'افتح تقارير الاستدامة', icon: '🌱' },
    { label: 'ذكاء السوق', command: 'ورّيني تحليل السوق', icon: '📈' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'الحسابات', command: 'افتح الحسابات', icon: '💳' },
    { label: 'رادار الإيرادات', command: 'ورّيني رادار الإيرادات', icon: '📡' },
    { label: 'تسعير ديناميكي', command: 'ورّيني التسعير الديناميكي', icon: '📊' },
    // الإدارة
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
    { label: 'سجلات خارجية', command: 'افتح السجلات الخارجية', icon: '📂' },
    { label: 'وزنات جماعية', command: 'افتح الوزنات الجماعية', icon: '⚖️' },
    { label: 'الشركاء', command: 'ورّيني الشركاء', icon: '🤝' },
    { label: 'واتساب', command: 'افتح WaPilot', icon: '💚' },
  ],

  // ══════════════════════════════════════
  // المُدوّر (Recycler) — 55 أمر
  // ══════════════════════════════════════
  recycler: [
    // الشحنات والاستلام
    { label: 'الشحنات', command: 'افتح الشحنات', icon: '📦' },
    { label: 'سجلات خارجية', command: 'افتح السجلات الخارجية', icon: '📂' },
    { label: 'إيصالات', command: 'أنشئ إيصال جديد', icon: '🧾' },
    { label: 'شحنات مرفوضة', command: 'ورّيني الشحنات المرفوضة', icon: '❌' },
    // الإنتاج والتصنيع
    { label: 'لوحة الإنتاج', command: 'افتح لوحة الإنتاج', icon: '🏭' },
    { label: 'إدارة الطاقة', command: 'افتح إدارة الطاقة الاستيعابية', icon: '📊' },
    { label: 'مراقبة الجودة', command: 'ورّيني تقارير الجودة', icon: '✅' },
    { label: 'عهدة المعدات', command: 'ورّيني عهدة المعدات', icon: '🔧' },
    { label: 'المخزون الذكي', command: 'ورّيني المخزون الذكي', icon: '📦' },
    // الشهادات
    { label: 'شهادات التدوير', command: 'افتح شهادات التدوير', icon: '📜' },
    { label: 'إصدار شهادة', command: 'أصدر شهادة تدوير جديدة', icon: '🏅' },
    { label: 'شهادات الفخر', command: 'افتح شهادات الفخر البيئي', icon: '🏆' },
    // السوق والتجارة
    { label: 'بورصة النفايات', command: 'افتح بورصة النفايات', icon: '💹' },
    { label: 'المزادات', command: 'افتح المزادات', icon: '🔨' },
    { label: 'سوق B2B', command: 'افتح سوق الأعمال', icon: '🏪' },
    { label: 'سوق المعدات', command: 'افتح سوق المعدات', icon: '🔧' },
    { label: 'سوق المركبات', command: 'افتح سوق المركبات', icon: '🚛' },
    { label: 'البورصة العالمية', command: 'افتح البورصة العالمية', icon: '🌍' },
    { label: 'سوق الخشب', command: 'افتح سوق الخشب', icon: '🪵' },
    { label: 'العقود الآجلة', command: 'افتح سوق العقود الآجلة', icon: '📈' },
    { label: 'مواد ثانوية', command: 'ورّيني سوق المواد الثانوية', icon: '♻️' },
    { label: 'مطابقة دائرية', command: 'ابحث عن فرص التدوير', icon: '🔄' },
    // البيئة والاستدامة
    { label: 'الاقتصاد الدائري', command: 'افتح الاقتصاد الدائري', icon: '♻️' },
    { label: 'خريطة تدفق', command: 'افتح خريطة تدفق النفايات', icon: '🗺️' },
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'افتح الاستدامة البيئية', icon: '🌱' },
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'تحليل نفايات', command: 'افتح تحليل النفايات التفصيلي', icon: '🔬' },
    { label: 'جواز بيئي', command: 'ورّيني الجواز البيئي', icon: '🌍' },
    // السجلات البيئية
    { label: 'سجل غير خطر', command: 'افتح سجل غير الخطرة', icon: '📗' },
    { label: 'سجل خطرة', command: 'افتح سجل الخطرة', icon: '☢️' },
    { label: 'تصنيف النفايات', command: 'افتح تصنيف النفايات', icon: '🏷️' },
    { label: 'الميزان الذكي', command: 'افتح الميزان الذكي', icon: '⚖️' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    { label: 'الحسابات', command: 'افتح الحسابات', icon: '💳' },
    { label: 'تسعير ديناميكي', command: 'ورّيني التسعير الديناميكي', icon: '📊' },
    // الأدوات والتحليلات
    { label: 'أدوات AI', command: 'افتح أدوات الذكاء الاصطناعي', icon: '🤖' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
    // الامتثال
    { label: 'التراخيص', command: 'ورّيني التراخيص', icon: '📜' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    // ERP
    { label: 'لوحة مالية', command: 'افتح اللوحة المالية', icon: '📊' },
    { label: 'المخزون', command: 'ورّيني حالة المخزون', icon: '📦' },
    { label: 'المشتريات', command: 'ورّيني المشتريات والمبيعات', icon: '🛒' },
    // الشركاء
    { label: 'الشركاء', command: 'ورّيني الشركاء', icon: '🤝' },
    { label: 'العقود', command: 'ورّيني العقود', icon: '📑' },
    // الصحة والسلامة
    { label: 'السلامة', command: 'ورّيني إجراءات السلامة', icon: '🦺' },
    { label: 'صيانة وقائية', command: 'ورّيني جدول الصيانة', icon: '🔧' },
    { label: 'ذكاء السوق', command: 'ورّيني تحليل السوق', icon: '📈' },
    { label: 'واتساب', command: 'افتح WaPilot', icon: '💚' },
  ],

  // ══════════════════════════════════════
  // التخلص النهائي (Disposer) — 40 أمر
  // ══════════════════════════════════════
  disposer: [
    // العمليات الأساسية
    { label: 'لوحة التخلص', command: 'افتح لوحة التخلص النهائي', icon: '🗑️' },
    { label: 'طلبات واردة', command: 'ورّيني الطلبات الواردة', icon: '📥' },
    { label: 'عمليات التخلص', command: 'ورّيني عمليات التخلص', icon: '⚙️' },
    { label: 'شهادات التخلص', command: 'ورّيني شهادات التخلص', icon: '📜' },
    { label: 'تقارير التخلص', command: 'ورّيني تقارير التخلص', icon: '📊' },
    { label: 'مركز القيادة', command: 'افتح مركز القيادة', icon: '🎯' },
    { label: 'الشحنات', command: 'افتح الشحنات', icon: '📦' },
    { label: 'المنشآت', command: 'ورّيني منشآت التخلص', icon: '🏗️' },
    { label: 'محطات الترحيل', command: 'ورّيني محطات الترحيل', icon: '🏗️' },
    // الطاقة والسعة
    { label: 'الطاقة الاستيعابية', command: 'كام الطاقة الاستيعابية المتاحة', icon: '📊' },
    { label: 'تعديل الطاقة', command: 'عدّل الطاقة الاستيعابية', icon: '✏️' },
    // السجلات البيئية
    { label: 'سجل غير خطر', command: 'افتح سجل المخلفات غير الخطرة', icon: '📗' },
    { label: 'سجل خطرة', command: 'افتح سجل المخلفات الخطرة', icon: '☢️' },
    { label: 'تصنيف النفايات', command: 'افتح تصنيف النفايات', icon: '🏷️' },
    // البيئة
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'ورّيني مؤشرات الاستدامة', icon: '🌱' },
    { label: 'تحليل النفايات', command: 'ورّيني تحليل النفايات', icon: '🔬' },
    // الصحة والسلامة
    { label: 'السلامة', command: 'ورّيني إجراءات السلامة', icon: '🦺' },
    { label: 'الطوارئ', command: 'افتح خطة الاستجابة للطوارئ', icon: '🆘' },
    { label: 'سلامة العمال', command: 'ورّيني تقارير سلامة العمال', icon: '👷' },
    { label: 'تقارير OHS', command: 'ورّيني تقارير الصحة والسلامة', icon: '📊' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    { label: 'الحسابات', command: 'افتح الحسابات', icon: '💳' },
    // الامتثال
    { label: 'التراخيص', command: 'ورّيني التراخيص', icon: '📜' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'المخالفات', command: 'ورّيني المخالفات', icon: '⚠️' },
    // الإدارة
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'الشركاء', command: 'ورّيني الشركاء', icon: '🤝' },
    { label: 'العقود', command: 'ورّيني العقود', icon: '📑' },
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'مراقبة الجودة', command: 'ورّيني تقارير الجودة', icon: '✅' },
    { label: 'الموظفين', command: 'ورّيني الموظفين', icon: '👥' },
    { label: 'واتساب', command: 'افتح WaPilot', icon: '💚' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
  ],

  // ══════════════════════════════════════
  // السائق (Driver) — 30 أمر
  // ══════════════════════════════════════
  driver: [
    // المسار والملاحة
    { label: 'مساري', command: 'افتح مساري', icon: '🗺️' },
    { label: 'موقعي', command: 'ورّيني موقعي', icon: '📍' },
    { label: 'جدول الرحلات', command: 'افتح جدول الرحلات', icon: '📅' },
    { label: 'بدء الرحلة', command: 'ابدأ الرحلة', icon: '▶️' },
    { label: 'إنهاء الرحلة', command: 'إنهاء الرحلة', icon: '⏹️' },
    { label: 'ملاحة', command: 'افتح الملاحة', icon: '🧭' },
    // الشحنات
    { label: 'شحناتي', command: 'افتح شحناتي', icon: '📦' },
    { label: 'سوق الشحنات', command: 'افتح سوق الشحنات', icon: '🏪' },
    { label: 'العروض', command: 'افتح العروض المتاحة', icon: '📋' },
    { label: 'إقرار تسليم', command: 'أنشئ إقرار تسليم', icon: '📝' },
    // المالية
    { label: 'محفظتي', command: 'افتح محفظتي', icon: '💰' },
    { label: 'أرباح اليوم', command: 'كام أرباح النهارده', icon: '💵' },
    { label: 'سحب الأرباح', command: 'عايز أسحب أرباحي', icon: '🏦' },
    // البيانات والأداء
    { label: 'ملفي', command: 'افتح ملفي الشخصي', icon: '👤' },
    { label: 'بياناتي', command: 'افتح بياناتي', icon: '📄' },
    { label: 'تحليلاتي', command: 'افتح تحليلات أدائي', icon: '📊' },
    { label: 'مكافآتي', command: 'افتح المكافآت', icon: '🏆' },
    { label: 'تصاريحي', command: 'افتح تصاريحي', icon: '📋' },
    { label: 'هويتي الرقمية', command: 'ورّيني هويتي الرقمية', icon: '🪪' },
    // التعلم
    { label: 'الأكاديمية', command: 'افتح الأكاديمية', icon: '🎓' },
    { label: 'الشهادات', command: 'ورّيني شهاداتي', icon: '📜' },
    // الطوارئ
    { label: 'طوارئ SOS', command: 'أرسل استغاثة', icon: '🆘' },
    // إضافية
    { label: 'الإشعارات', command: 'ورّيني الإشعارات', icon: '🔔' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'ملاحظاتي', command: 'ورّيني ملاحظاتي', icon: '📝' },
    { label: 'وظائف متاحة', command: 'ورّيني الوظائف المتاحة', icon: '💼' },
    { label: 'السيرة الذاتية', command: 'ابدأ بناء السيرة الذاتية', icon: '📄' },
    { label: 'المواقع المحفوظة', command: 'ورّيني المواقع المحفوظة', icon: '📌' },
    { label: 'تقييمات', command: 'ورّيني تقييماتي', icon: '⭐' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
  ],

  // ══════════════════════════════════════
  // الاستشاري (Consultant) — 25 أمر
  // ══════════════════════════════════════
  consultant: [
    { label: 'بوابة المستشار', command: 'افتح بوابة المستشار', icon: '👨‍🔬' },
    { label: 'عملائي', command: 'ورّيني عملائي', icon: '👥' },
    { label: 'تقارير استشارية', command: 'ورّيني التقارير الاستشارية', icon: '📈' },
    { label: 'شهاداتي', command: 'ورّيني شهاداتي المهنية', icon: '📜' },
    { label: 'الشحنات', command: 'افتح الشحنات', icon: '📦' },
    { label: 'التقارير', command: 'افتح التقارير', icon: '📈' },
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    { label: 'المستشارين', command: 'افتح المستشارين البيئيين', icon: '👨‍🔬' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'تحليل الامتثال', command: 'ورّيني تحليل الامتثال', icon: '📊' },
    { label: 'تقييم الامتثال', command: 'ابدأ تقييم الامتثال', icon: '✅' },
    { label: 'البصمة الكربونية', command: 'ورّيني البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'ورّيني مؤشرات الاستدامة', icon: '🌱' },
    { label: 'الخطط التشغيلية', command: 'ورّيني الخطط التشغيلية', icon: '📋' },
    { label: 'المستندات التنظيمية', command: 'ورّيني المستندات التنظيمية', icon: '📂' },
    { label: 'الحماية القانونية', command: 'افتح الحماية القانونية', icon: '🛡️' },
    { label: 'حماية البيانات', command: 'ورّيني حالة GDPR', icon: '🔒' },
    { label: 'جلسات التدقيق', command: 'ورّيني جلسات التدقيق', icon: '🔍' },
    { label: 'مهامي', command: 'ورّيني مهامي', icon: '📋' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'ملفي', command: 'ورّيني ملفي', icon: '👤' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
    { label: 'وظائف', command: 'ورّيني الوظائف', icon: '💼' },
  ],

  // ══════════════════════════════════════
  // مكتب الاستشارات (Consulting Office) — 20 أمر
  // ══════════════════════════════════════
  consulting_office: [
    { label: 'مستشارو المكتب', command: 'ورّيني مستشارو المكتب', icon: '👥' },
    { label: 'أداء المكتب', command: 'ورّيني أداء المكتب', icon: '📊' },
    { label: 'مهام المكتب', command: 'ورّيني مهام المكتب', icon: '📋' },
    { label: 'العملاء', command: 'ورّيني العملاء', icon: '👥' },
    { label: 'التقارير', command: 'ورّيني التقارير', icon: '📈' },
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'القوانين', command: 'افتح القوانين', icon: '⚖️' },
    { label: 'العقود', command: 'ورّيني العقود', icon: '📑' },
    { label: 'الشهادات', command: 'ورّيني الشهادات', icon: '📜' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'الموظفين', command: 'ورّيني الموظفين', icon: '👥' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'المفوضين', command: 'افتح المفوضين', icon: '✍️' },
    { label: 'الفواتير', command: 'ورّيني الفواتير', icon: '🧾' },
    { label: 'الحسابات', command: 'افتح الحسابات', icon: '💳' },
    { label: 'الاشتراك', command: 'ورّيني اشتراكي', icon: '💳' },
    { label: 'سجل النشاط', command: 'ورّيني سجل النشاط', icon: '📝' },
    { label: 'الدعم', command: 'تواصل مع الدعم', icon: '🎧' },
    { label: 'ملف المنظمة', command: 'ورّيني ملف المنظمة', icon: '🏢' },
  ],

  // ══════════════════════════════════════
  // الموظف (Employee) — 20 أمر
  // ══════════════════════════════════════
  employee: [
    { label: 'مهامي', command: 'ورّيني مهامي', icon: '📋' },
    { label: 'الحضور', command: 'سجّل حضوري', icon: '✅' },
    { label: 'طلب إجازة', command: 'قدّم طلب إجازة', icon: '📅' },
    { label: 'الورديات', command: 'ورّيني جدول ورديتي', icon: '🕐' },
    { label: 'كشف الراتب', command: 'ورّيني كشف راتبي', icon: '💰' },
    { label: 'نهاية الخدمة', command: 'احسب مكافأة نهاية خدمتي', icon: '💵' },
    { label: 'الخدمة الذاتية', command: 'افتح خدمات الموظفين', icon: '👤' },
    { label: 'ملفي', command: 'ورّيني ملفي', icon: '👤' },
    { label: 'بياناتي', command: 'ورّيني بياناتي', icon: '📄' },
    { label: 'تقييم أدائي', command: 'ورّيني تقييم أدائي', icon: '📊' },
    { label: 'الهيكل التنظيمي', command: 'ورّيني الهيكل التنظيمي', icon: '🏗️' },
    { label: 'طلباتي', command: 'ورّيني طلباتي', icon: '📋' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'الإشعارات', command: 'ورّيني الإشعارات', icon: '🔔' },
    { label: 'الدورات', command: 'ورّيني الدورات المتاحة', icon: '🎓' },
    { label: 'المكافآت', command: 'ورّيني مكافآتي', icon: '🏆' },
    { label: 'الاجتماعات', command: 'ورّيني الاجتماعات', icon: '📅' },
    { label: 'ملاحظاتي', command: 'ورّيني ملاحظاتي', icon: '📝' },
    { label: 'الدعم', command: 'تواصل مع الدعم', icon: '🎧' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
  ],

  // ══════════════════════════════════════
  // الجهة الرقابية (Regulator) — 25 أمر
  // ══════════════════════════════════════
  regulator: [
    { label: 'لوحة الرقابة', command: 'افتح لوحة الرقابة', icon: '🏛️' },
    { label: 'جهاز المخلفات', command: 'افتح جهاز تنظيم المخلفات', icon: '🏛️' },
    { label: 'شؤون البيئة', command: 'افتح جهاز شؤون البيئة', icon: '🌿' },
    { label: 'التنمية الصناعية', command: 'افتح هيئة التنمية الصناعية', icon: '🏭' },
    { label: 'النقل البري', command: 'افتح هيئة النقل البري', icon: '🚛' },
    { label: 'الشركات الخاضعة', command: 'ورّيني الشركات الخاضعة للرقابة', icon: '🏢' },
    { label: 'الغرامات', command: 'ورّيني الغرامات والعقوبات', icon: '⚠️' },
    { label: 'تعداد الجهات', command: 'ورّيني تعداد الجهات', icon: '📊' },
    { label: 'المخالفات', command: 'ورّيني المخالفات التنظيمية', icon: '⚠️' },
    { label: 'تحليل الامتثال', command: 'ورّيني تحليل الامتثال', icon: '📊' },
    { label: 'تقييم الامتثال', command: 'ابدأ تقييم الامتثال', icon: '✅' },
    { label: 'التراخيص', command: 'ورّيني التراخيص', icon: '📜' },
    { label: 'القوانين', command: 'افتح القوانين', icon: '⚖️' },
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    { label: 'المستندات التنظيمية', command: 'ورّيني المستندات التنظيمية', icon: '📂' },
    { label: 'تقارير ESG', command: 'ورّيني تقارير ESG', icon: '📊' },
    { label: 'التقارير البلدية', command: 'ورّيني التقارير البلدية', icon: '📊' },
    { label: 'شكاوى المواطنين', command: 'ورّيني شكاوى المواطنين', icon: '📢' },
    { label: 'سجل النشاط', command: 'ورّيني سجل النشاط', icon: '📝' },
    { label: 'جلسات التدقيق', command: 'ورّيني جلسات التدقيق', icon: '🔍' },
    { label: 'الخريطة الحرارية', command: 'ورّيني خريطة تدفق النفايات', icon: '🗺️' },
    { label: 'نظرة عامة', command: 'ورّيني نظرة عامة على النظام', icon: '📊' },
    { label: 'التحليلات', command: 'افتح التحليلات المتقدمة', icon: '📊' },
    { label: 'المحادثات', command: 'افتح المحادثات', icon: '💬' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
  ],

  // ══════════════════════════════════════
  // مدير النظام (Admin) — 40 أمر
  // ══════════════════════════════════════
  admin: [
    // لوحات القيادة
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'ملخص تنفيذي', command: 'عايز الملخص التنفيذي', icon: '📋' },
    { label: 'نظرة عامة', command: 'ورّيني نظرة عامة على النظام', icon: '📊' },
    { label: 'إيرادات النظام', command: 'ورّيني إيرادات النظام', icon: '💰' },
    // التحليلات
    { label: 'التحليلات', command: 'افتح التحليلات المتقدمة', icon: '📈' },
    { label: 'تنبؤات AI', command: 'ورّيني تنبؤات الذكاء الاصطناعي', icon: '🤖' },
    { label: 'تحليلات الزوار', command: 'ورّيني تحليلات الزوار', icon: '👥' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    // المستخدمين والشركات
    { label: 'إدارة الشركات', command: 'ورّيني الشركات', icon: '🏢' },
    { label: 'موافقات الشركات', command: 'ورّيني الموافقات المعلقة', icon: '✅' },
    { label: 'دليل الشركات', command: 'ابحث في دليل الشركات', icon: '📒' },
    { label: 'إضافة منظمة', command: 'أضف منظمة جديدة', icon: '➕' },
    { label: 'مراجعة التسجيل', command: 'ورّيني طلبات التسجيل', icon: '📋' },
    // السجلات والأمان
    { label: 'سجل النشاط', command: 'افتح سجل النشاط', icon: '📝' },
    { label: 'الأمن السيبراني', command: 'ورّيني حالة الأمن', icon: '🔒' },
    { label: 'اختبار الأمان', command: 'ابدأ اختبار الأمان', icon: '🧪' },
    { label: 'جلسات التدقيق', command: 'ورّيني جلسات التدقيق', icon: '🔍' },
    { label: 'حالة النظام', command: 'ورّيني حالة النظام', icon: '🟢' },
    // الإعدادات
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
    { label: 'تحسين القاعدة', command: 'ورّيني حالة قاعدة البيانات', icon: '🔧' },
    { label: 'الأتمتة', command: 'ورّيني الإجراءات التلقائية', icon: '🤖' },
    // المحتوى
    { label: 'إدارة الأخبار', command: 'ورّيني الأخبار', icon: '📰' },
    { label: 'إدارة المدونة', command: 'ورّيني المقالات', icon: '📰' },
    { label: 'الإعلانات', command: 'ورّيني الإعلانات', icon: '📢' },
    { label: 'خطط الإعلان', command: 'ورّيني خطط الإعلان', icon: '📋' },
    { label: 'الصفحة الرئيسية', command: 'عدّل الصفحة الرئيسية', icon: '🏠' },
    { label: 'القرطاسية', command: 'ورّيني القرطاسية', icon: '📐' },
    { label: 'الهوية البصرية', command: 'ورّيني الهوية البصرية', icon: '🎨' },
    // التكامل
    { label: 'Webhooks', command: 'ورّيني الـ Webhooks', icon: '🔗' },
    { label: 'إعدادات API', command: 'ورّيني إعدادات API', icon: '🔌' },
    { label: 'بوابة المطور', command: 'افتح بوابة المطور', icon: '💻' },
    // الكول سنتر
    { label: 'كول سنتر', command: 'افتح الكول سنتر', icon: '📞' },
    { label: 'واتساب', command: 'افتح WaPilot', icon: '💚' },
    { label: 'البث', command: 'ورّيني قنوات البث', icon: '📢' },
    // الحوكمة
    { label: 'الحوكمة', command: 'ورّيني لوحة الحوكمة', icon: '🏛️' },
    { label: 'النضج الرقمي', command: 'ورّيني تقييم النضج الرقمي', icon: '📊' },
    { label: 'حماية البيانات', command: 'ورّيني حالة GDPR', icon: '🔒' },
    // خريطة السواقين
    { label: 'خريطة السواقين', command: 'ورّيني خريطة كل السواقين', icon: '🗺️' },
    { label: 'التصديقات', command: 'ورّيني التصديقات', icon: '📝' },
    { label: 'إشعارات Push', command: 'ورّيني إحصائيات الإشعارات', icon: '📊' },
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

/**
 * الحصول على كل الأوامر المتاحة لدور معين (بدون حد)
 */
export function getAllRoleCommands(userRole: string): ContextualCommand[] {
  return ROLE_COMMANDS[userRole] || [];
}

/**
 * الحصول على عدد الأوامر الكلي
 */
export function getTotalVoiceCommandCount(): {
  pageCommands: number;
  roleCommands: Record<string, number>;
  globalCommands: number;
  total: number;
} {
  const pageCount = Object.values(PAGE_COMMANDS).reduce((sum, cmds) => sum + cmds.length, 0);
  const roleCount: Record<string, number> = {};
  let roleTotalCount = 0;
  for (const [role, cmds] of Object.entries(ROLE_COMMANDS)) {
    roleCount[role] = cmds.length;
    roleTotalCount += cmds.length;
  }
  return {
    pageCommands: pageCount,
    roleCommands: roleCount,
    globalCommands: GLOBAL_COMMANDS.length,
    total: pageCount + roleTotalCount + GLOBAL_COMMANDS.length,
  };
}

/**
 * الحصول على عدد الصفحات المغطاة
 */
export function getCoveredPagesCount(): number {
  return Object.keys(PAGE_COMMANDS).length;
}
