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
  // Transporter-specific pages
  '/dashboard/transporter-shipments': [
    { label: 'شحنات جديدة', command: 'ورّيني الشحنات الجديدة', icon: '🆕' },
    { label: 'شحنات في الطريق', command: 'ورّيني الشحنات في الطريق', icon: '🚛' },
    { label: 'شحنات مكتملة', command: 'ورّيني الشحنات المسلمة', icon: '✅' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'شحنات مرفوضة', command: 'روح الشحنات المرفوضة', icon: '❌' },
  ],
  '/dashboard/transporter-drivers': [
    { label: 'السواقين المتاحين', command: 'ورّيني السواقين المتاحين', icon: '👤' },
    { label: 'إضافة سائق', command: 'أضف سائق جديد', icon: '➕' },
    { label: 'تصاريح السواقين', command: 'روح تصاريح السواقين', icon: '📋' },
    { label: 'تتبع السواقين', command: 'افتح تتبع السواقين', icon: '📍' },
  ],
  '/dashboard/tracking-center': [
    { label: 'تتبع مباشر', command: 'ورّيني التتبع المباشر', icon: '📍' },
    { label: 'تتبع السواقين', command: 'روح تتبع السواقين', icon: '🗺️' },
    { label: 'خريطة المسارات', command: 'افتح خريطة المسارات', icon: '🛣️' },
  ],
  '/dashboard/fuel-management': [
    { label: 'استهلاك الوقود', command: 'عايز أعرف استهلاك الوقود', icon: '⛽' },
    { label: 'تعبئة جديدة', command: 'سجل تعبئة وقود', icon: '➕' },
  ],
  '/dashboard/operations': [
    { label: 'عمليات اليوم', command: 'ورّيني عمليات النهارده', icon: '📊' },
    { label: 'التوزيع الذكي', command: 'شغّل التوزيع الذكي', icon: '🤖' },
  ],
  // Recycler pages
  '/dashboard/production': [
    { label: 'حالة الإنتاج', command: 'عايز أعرف حالة الإنتاج', icon: '🏭' },
    { label: 'الطاقة المتاحة', command: 'كام الطاقة المتاحة', icon: '📊' },
  ],
  '/dashboard/waste-auctions': [
    { label: 'المزادات النشطة', command: 'ورّيني المزادات النشطة', icon: '🔨' },
    { label: 'مزاد جديد', command: 'أنشئ مزاد جديد', icon: '➕' },
  ],
  '/dashboard/commodity-exchange': [
    { label: 'أسعار السلع', command: 'عايز أسعار السلع النهارده', icon: '💹' },
    { label: 'البورصة العالمية', command: 'افتح البورصة العالمية', icon: '🌍' },
  ],
  // Driver pages
  '/dashboard/driver-my-route': [
    { label: 'المسار اللي جاي', command: 'ورّيني المسار القادم', icon: '🗺️' },
    { label: 'بدء الرحلة', command: 'ابدأ الرحلة', icon: '▶️' },
    { label: 'الملاحة', command: 'افتح الملاحة', icon: '🧭' },
  ],
  '/dashboard/driver-wallet': [
    { label: 'رصيدي', command: 'عايز أعرف رصيدي', icon: '💰' },
    { label: 'أرباح اليوم', command: 'كام أرباح النهارده', icon: '💵' },
    { label: 'سحب الأرباح', command: 'عايز أسحب أرباحي', icon: '🏦' },
  ],
  '/dashboard/driver-offers': [
    { label: 'العروض المتاحة', command: 'ورّيني العروض المتاحة', icon: '📋' },
    { label: 'قبول عرض', command: 'اقبل أول عرض', icon: '✅' },
  ],
  '/dashboard/shipment-market': [
    { label: 'شحنات قريبة', command: 'ورّيني الشحنات القريبة مني', icon: '📍' },
    { label: 'أعلى سعر', command: 'ورّيني الشحنات الأعلى سعراً', icon: '💰' },
  ],
};

const ROLE_COMMANDS: Record<string, ContextualCommand[]> = {
  // ====== المولّد (Generator) ======
  generator: [
    // الشحنات والعمليات
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'طلباتي', command: 'افتح طلباتي', icon: '📋' },
    { label: 'طلب تجميع', command: 'أنشئ طلب تجميع جديد', icon: '🚛' },
    { label: 'إيصال جديد', command: 'أنشئ إيصال جديد', icon: '🧾' },
    { label: 'شحنة يدوية', command: 'أنشئ شحنة يدوية', icon: '✏️' },
    { label: 'إقرار تسليم', command: 'افتح إقرارات التسليم', icon: '📝' },
    // السجلات البيئية
    { label: 'سجل غير خطر', command: 'افتح سجل المخلفات غير الخطرة', icon: '📗' },
    { label: 'سجل خطرة', command: 'افتح سجل المخلفات الخطرة', icon: '☢️' },
    { label: 'تصنيف النفايات', command: 'افتح تصنيف النفايات', icon: '🏷️' },
    // التقارير والتحليلات
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'افتح تقارير الاستدامة البيئية', icon: '🌱' },
    { label: 'تقرير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'تحليل النفايات', command: 'افتح تحليل النفايات التفصيلي', icon: '🔬' },
    { label: 'تقارير الشحنات', command: 'افتح تقارير الشحنات', icon: '📈' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    // القانون والامتثال
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    { label: 'التراخيص', command: 'افتح التصاريح والتراخيص', icon: '📜' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'المستندات التنظيمية', command: 'افتح المستندات التنظيمية', icon: '📂' },
    { label: 'الخطط التشغيلية', command: 'افتح الخطط التشغيلية', icon: '📋' },
    { label: 'مستشارين بيئيين', command: 'ورّيني المستشارين البيئيين', icon: '👨‍🔬' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    // الإدارة
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
    { label: 'روابط سريعة', command: 'افتح روابط الشحن السريعة', icon: '🔗' },
    { label: 'روابط إيداع', command: 'افتح روابط الإيداع السريعة', icon: '💳' },
    { label: 'وزن سريع', command: 'سجل وزن سريع', icon: '⚖️' },
  ],

  // ====== الناقل (Transporter) ======
  transporter: [
    // الشحنات
    { label: 'شحنات الناقل', command: 'افتح شحنات الناقل', icon: '📦' },
    { label: 'شحنة جديدة', command: 'أنشئ شحنة جديدة', icon: '➕' },
    { label: 'شحنات مرفوضة', command: 'افتح الشحنات المرفوضة', icon: '❌' },
    { label: 'شحنات متكررة', command: 'افتح الشحنات المتكررة', icon: '🔄' },
    { label: 'شحنة يدوية', command: 'أنشئ شحنة يدوية', icon: '✏️' },
    { label: 'إيصالات الناقل', command: 'افتح إيصالات الناقل', icon: '🧾' },
    // السائقين والأسطول
    { label: 'إدارة السواقين', command: 'افتح إدارة السواقين', icon: '👥' },
    { label: 'تصاريح السواقين', command: 'افتح تصاريح السواقين', icon: '📋' },
    { label: 'تتبع السواقين', command: 'افتح تتبع السواقين', icon: '📍' },
    { label: 'مركز التتبع', command: 'افتح مركز التتبع', icon: '🗺️' },
    { label: 'خريطة المسارات', command: 'افتح خريطة المسارات', icon: '🛣️' },
    { label: 'خريطة ويز', command: 'افتح خريطة ويز', icon: '🧭' },
    { label: 'عمال التحميل', command: 'افتح عمال التحميل', icon: '💪' },
    // الصيانة والمعدات
    { label: 'إدارة الوقود', command: 'افتح إدارة الوقود', icon: '⛽' },
    { label: 'صيانة وقائية', command: 'افتح الصيانة الوقائية', icon: '🔧' },
    { label: 'الكاميرات', command: 'افتح الكاميرات', icon: '📷' },
    { label: 'إعدادات GPS', command: 'افتح إعدادات GPS', icon: '📡' },
    { label: 'إعدادات IoT', command: 'افتح إعدادات IoT', icon: '📲' },
    // العمليات
    { label: 'لوحة العمليات', command: 'افتح لوحة العمليات', icon: '📊' },
    { label: 'طلبات التجميع', command: 'افتح طلبات التجميع', icon: '📋' },
    { label: 'تجميع B2C', command: 'افتح طلبات تجميع الأفراد', icon: '🏘️' },
    { label: 'إقرارات التسليم', command: 'افتح إقرارات التسليم', icon: '📝' },
    // التحليلات والتقارير
    { label: 'أدوات AI', command: 'افتح أدوات الذكاء الاصطناعي', icon: '🤖' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'تقارير الشحنات', command: 'افتح تقارير الشحنات', icon: '📈' },
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'افتح تقارير الاستدامة', icon: '🌱' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    // الإدارة
    { label: 'روابط السواقين', command: 'افتح روابط السواقين السريعة', icon: '🔗' },
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
    { label: 'سجلات خارجية', command: 'افتح السجلات الخارجية', icon: '📂' },
    { label: 'وزنات جماعية', command: 'افتح الوزنات الجماعية', icon: '⚖️' },
  ],

  // ====== المُدوّر (Recycler) ======
  recycler: [
    // الشحنات والاستلام
    { label: 'الشحنات', command: 'افتح الشحنات', icon: '📦' },
    { label: 'سجلات خارجية', command: 'افتح السجلات الخارجية', icon: '📂' },
    // الإنتاج والتصنيع
    { label: 'لوحة الإنتاج', command: 'افتح لوحة الإنتاج', icon: '🏭' },
    { label: 'إدارة الطاقة', command: 'افتح إدارة الطاقة الاستيعابية', icon: '📊' },
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
    // البيئة والاستدامة
    { label: 'الاقتصاد الدائري', command: 'افتح الاقتصاد الدائري', icon: '♻️' },
    { label: 'خريطة تدفق', command: 'افتح خريطة تدفق النفايات', icon: '🗺️' },
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'الاستدامة', command: 'افتح الاستدامة البيئية', icon: '🌱' },
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'تحليل نفايات', command: 'افتح تحليل النفايات التفصيلي', icon: '🔬' },
    // السجلات البيئية
    { label: 'سجل غير خطر', command: 'افتح سجل غير الخطرة', icon: '📗' },
    { label: 'سجل خطرة', command: 'افتح سجل الخطرة', icon: '☢️' },
    { label: 'تصنيف النفايات', command: 'افتح تصنيف النفايات', icon: '🏷️' },
    // المالية
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'فاتورة إلكترونية', command: 'افتح الفاتورة الإلكترونية', icon: '🧾' },
    // الأدوات
    { label: 'أدوات AI', command: 'افتح أدوات الذكاء الاصطناعي', icon: '🤖' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'المفوضين', command: 'افتح المفوضين بالتوقيع', icon: '✍️' },
    { label: 'المساعد الذكي', command: 'افتح المساعد الذكي', icon: '🤖' },
  ],

  // ====== التخلص النهائي (Disposer) ======
  disposer: [
    { label: 'الطاقة الاستيعابية', command: 'كام الطاقة الاستيعابية المتاحة', icon: '🏗️' },
    { label: 'الشحنات', command: 'افتح الشحنات', icon: '📦' },
    { label: 'سجل غير خطر', command: 'افتح سجل غير الخطرة', icon: '📗' },
    { label: 'سجل خطرة', command: 'افتح سجل الخطرة', icon: '☢️' },
    { label: 'إيصالات', command: 'أنشئ إيصال جديد', icon: '🧾' },
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'البصمة الكربونية', command: 'افتح البصمة الكربونية', icon: '🌍' },
    { label: 'عروض أسعار', command: 'افتح عروض الأسعار', icon: '💰' },
    { label: 'بوابة العملاء', command: 'افتح بوابة العملاء', icon: '🌐' },
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
  ],

  // ====== السائق (Driver) ======
  driver: [
    // المسار والملاحة
    { label: 'مساري', command: 'افتح مساري', icon: '🗺️' },
    { label: 'موقعي', command: 'ورّيني موقعي', icon: '📍' },
    { label: 'جدول الرحلات', command: 'افتح جدول الرحلات', icon: '📅' },
    { label: 'بدء الرحلة', command: 'ابدأ الرحلة', icon: '▶️' },
    { label: 'إنهاء الرحلة', command: 'إنهاء الرحلة', icon: '⏹️' },
    // الشحنات
    { label: 'شحناتي', command: 'افتح شحناتي', icon: '📦' },
    { label: 'سوق الشحنات', command: 'افتح سوق الشحنات', icon: '🏪' },
    { label: 'العروض', command: 'افتح العروض المتاحة', icon: '📋' },
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
    // التعلم
    { label: 'الأكاديمية', command: 'افتح الأكاديمية', icon: '🎓' },
    // الطوارئ
    { label: 'طوارئ SOS', command: 'أرسل استغاثة', icon: '🆘' },
  ],

  // ====== الاستشاري (Consultant) ======
  consultant: [
    { label: 'الشحنات', command: 'افتح الشحنات', icon: '📦' },
    { label: 'التقارير', command: 'افتح التقارير', icon: '📈' },
    { label: 'تقارير ESG', command: 'افتح تقارير ESG', icon: '📊' },
    { label: 'القوانين', command: 'افتح القوانين واللوائح', icon: '⚖️' },
    { label: 'التحديثات التنظيمية', command: 'ورّيني التحديثات التنظيمية', icon: '📰' },
    { label: 'المستشارين', command: 'افتح المستشارين البيئيين', icon: '👨‍🔬' },
    { label: 'رؤى ذكية', command: 'افتح الرؤى الذكية', icon: '🧠' },
  ],

  // ====== مدير النظام (Admin) ======
  admin: [
    { label: 'لوحة تنفيذية', command: 'افتح اللوحة التنفيذية', icon: '📊' },
    { label: 'التحليلات', command: 'افتح التحليلات', icon: '📈' },
    { label: 'سجل النشاط', command: 'افتح سجل النشاط', icon: '📝' },
    { label: 'الإعدادات', command: 'افتح الإعدادات', icon: '⚙️' },
    { label: 'المستخدمين', command: 'افتح إدارة المستخدمين', icon: '👥' },
    { label: 'كول سنتر', command: 'افتح الكول سنتر', icon: '📞' },
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
