/**
 * خريطة الارتباطات الوظيفية لجهة الناقل
 * تصنّف كل تبويب وعنصر sidebar وإجراء سريع حسب نوع ارتباطه
 * 
 * التصحيحات المطبقة:
 * - transporter-certs: hybrid → admin (شهادات حكومية)
 * - annual_plan: hybrid → admin (التزام تقريري موجه للرقيب)
 * - ohs: hybrid → admin (خاضع لمعايير امتثال صارمة)
 * - transporter-guilloche: internal → admin (أمان شهادات مرئي للرقيب)
 * - smart-weight-upload: internal → hybrid (مرتبط بوزن الشحنة)
 * - risk: partner → hybrid (مرئي للرقيب)
 * - declarations: توحيد كـ admin
 */
import type { BindingMeta, BindingType } from '@/types/bindingTypes';

// ═══════════════════════════════════════════
// تصنيف تبويبات لوحة التحكم (Dashboard Tabs)
// ═══════════════════════════════════════════
export const TRANSPORTER_TAB_BINDINGS: Record<string, BindingMeta> = {
  // ── نظرة عامة: تجمع كل شيء ──
  overview: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler', 'admin'],
    adminVisible: true,
    contextHint: 'ملخص شامل يضم بيانات داخلية وخارجية ورقابية',
  },

  // ── ذكاء اصطناعي: هجين (مرئي للرقيب لتحسين الانبعاثات والمسارات) ──
  ai: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler', 'regulator'],
    adminVisible: true,
    contextHint: 'تحليلات ذكية تعتمد على بيانات الناقل والشركاء لتحسين المسارات وتقليل الانبعاثات - مرئية للجهات الرقابية',
  },

  // ── أداء السائقين: هجين (بيانات من تطبيق السائق الخارجي + مراقبة IoT) ──
  performance: {
    type: 'hybrid',
    involvedParties: ['self', 'driver'],
    adminVisible: true,
    contextHint: 'أداء السائقين وتكاليف الرحلات مع تدفق بيانات من تطبيق السائق المستقل وحساسات IoT',
  },

  // ── مساعد السائق: داخلي ──
  copilot: {
    type: 'internal',
    involvedParties: ['self', 'driver'],
    adminVisible: false,
    contextHint: 'مساعد ذكي للسائق أثناء الرحلة',
  },

  // ── التسعير الديناميكي: هجين (يعتمد على بيانات السوق والشركاء + المسارات المحسنة) ──
  pricing: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: false,
    requiresPartner: true,
    contextHint: 'تسعير ذكي يعتمد على بيانات الشركاء والسوق وتحسين المسارات',
  },

  // ── بورصة المخلفات: شركاء ──
  marketplace: {
    type: 'partner',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'سوق B2B لتبادل المواد مع جهات أخرى',
  },

  // ── صيانة الأسطول: داخلي ──
  fleet: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'صيانة تنبؤية وإدارة المركبات',
  },

  // ── كشف الاحتيال: هجين (بيانات داخلية + مقارنة مع الشركاء) ──
  fraud: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: true,
    contextHint: 'رصد تلاعب بالأوزان والبيانات عبر الأطراف',
  },

  // ── مخاطر الشركاء: هجين (تقييم امتثال مرئي للرقيب) ──
  risk: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler', 'regulator'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'تقييم موثوقية ومخاطر الشركاء مع تقارير امتثال رقابية',
  },

  // ── سلسلة الحفظ: هجين (يتتبع عبر كل الأطراف) ──
  custody: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler', 'disposal', 'admin'],
    adminVisible: true,
    contextHint: 'توثيق سلسلة الحيازة من المصدر للوجهة',
  },

  // ── البوابة الحكومية: رقابي ──
  government: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'تقارير حكومية وإفصاحات رقابية',
  },

  // ── أرصدة الكربون: هجين ──
  carbon: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: true,
    contextHint: 'حساب البصمة الكربونية من عمليات النقل المشتركة',
  },

  // ── إنترنت الأشياء: داخلي ──
  iot: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'مراقبة أجهزة الاستشعار على المركبات',
  },

  // ── التقويم: هجين (مواعيد مع شركاء) ──
  calendar: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: false,
    contextHint: 'جدولة الشحنات والمواعيد مع الأطراف',
  },

  // ── الذكاء التشغيلي: هجين ──
  intelligence: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: false,
    contextHint: 'تحسين المسارات وتحليل ربحية الشركاء',
  },

  // ── الشركاء: شركاء (فصل الرقابي عن التجاري) ──
  partners: {
    type: 'partner',
    involvedParties: ['self', 'generator', 'recycler', 'disposal'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'إدارة العلاقات والتقييمات مع الشركاء التجاريين فقط - منفصل عن الجهات الرقابية',
  },

  // ── التتبع: هجين (تتبع السائقين مع ربط بالتراخيص الجغرافية) ──
  tracking: {
    type: 'hybrid',
    involvedParties: ['self', 'driver', 'regulator'],
    adminVisible: true,
    contextHint: 'تتبع مواقع السائقين والمركبات لحظياً مع التحقق من التصاريح الجغرافية',
  },

  // ── السياج الجغرافي: هجين (مرتبط بطلبات الجمع والمسارات) ──
  geofence: {
    type: 'hybrid',
    involvedParties: ['self', 'driver', 'generator', 'recycler'],
    adminVisible: true,
    contextHint: 'تنبيهات دخول/خروج من مناطق العملاء مرتبطة بطلبات الجمع',
  },

  // ── ESG: رقابي ──
  esg: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'تقارير الحوكمة البيئية والاجتماعية',
  },

  // ── الامتثال: رقابي ──
  compliance: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'امتثال قانوني وتراخيص ومركبات وسائقين',
  },

  // ── WMIS: رقابي ──
  wmis: {
    type: 'admin',
    involvedParties: ['self', 'regulator', 'admin'],
    adminVisible: true,
    contextHint: 'نظام إدارة معلومات المخلفات الرقابي',
  },

  // ── التراخيص: رقابي ──
  licenses: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'تجديد التراخيص والتصاريح التنظيمية',
  },

  // ── الإقرارات: رقابي ──
  declarations: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'إقرارات رسمية للجهات الرقابية',
  },

  // ── الخطة السنوية: رقابي (التزام تقريري موجه للجهة التنظيمية) ──
  annual_plan: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'خطة تشغيلية سنوية إلزامية مقدمة للجهة الرقابية',
  },

  // ── السلامة المهنية: هجين (عمليات يومية داخلية + رفع للجهات الرقابية) ──
  ohs: {
    type: 'hybrid',
    involvedParties: ['self', 'driver', 'regulator'],
    adminVisible: true,
    contextHint: 'إدارة السلامة والصحة المهنية: عمليات يومية داخلية مع إفصاح رقابي',
  },
};

// ═══════════════════════════════════════════
// تصنيف عناصر القائمة الجانبية (Sidebar Items)
// ═══════════════════════════════════════════
export const TRANSPORTER_SIDEBAR_BINDINGS: Record<string, BindingType> = {
  // عمليات الشحن
  'transporter-shipments': 'hybrid',
  'transporter-rejected': 'partner',
  'transporter-receipts': 'hybrid',
  'transporter-declarations': 'admin',
  'transporter-certs': 'admin',        // ✅ شهادات حكومية → admin
  'transporter-guilloche': 'admin',       // ✅ أمان وثائق رقابية (Guilloche Security Pattern) → مرتبط بسلسلة الامتثال
  'collection-requests': 'partner',
  'manual-shipment': 'hybrid',
  'manual-shipment-drafts': 'hybrid',       // ✅ تصحيح: مسودة تتحول لشحنة hybrid لاحقاً

  // الأسطول والسائقين
  'transporter-drivers': 'internal',
  'transporter-driver-tracking': 'internal',
  'shipment-routes': 'hybrid',
  'driver-permits': 'admin',
  'driver-academy': 'internal',
  'preventive-maintenance': 'internal',
  'driver-rewards': 'internal',
};

// ═══════════════════════════════════════════
// تصنيف الإجراءات السريعة (Quick Actions)
// ═══════════════════════════════════════════
export const TRANSPORTER_ACTION_BINDINGS: Record<string, BindingType> = {
  'create-shipment': 'hybrid',
  'transporter-shipments': 'hybrid',
  'driver-tracking': 'internal',
  'register-deposit': 'partner',
  'transporter-receipts': 'hybrid',
  'smart-weight-upload': 'hybrid',         // ✅ تصحيح: مرتبط بالوزن في سلسلة الشحنة
  'collection-requests': 'partner',
  'transporter-drivers': 'internal',
  'quick-shipment-links': 'partner',
  'quick-deposit-links': 'partner',
  'contracts': 'partner',
  'external-records': 'partner',
  'navigation-demo': 'internal',
  'partners': 'hybrid',                    // ✅ تصحيح: توحيد مع تبويب partners (hybrid) لوجود أطراف رقابية
  'reports': 'hybrid',
  'transporter-ai-tools': 'hybrid',         // ✅ تصحيح: توحيد مع تبويب ai (hybrid) لسحب بيانات الشركاء
  'environmental-sustainability': 'admin',
  'employees': 'internal',
  'org-structure': 'internal',
  'my-requests': 'hybrid',
  'activity-log': 'internal',                // ✅ تصحيح: سجل نشاط داخلي لمراقبة أداء الموظفين
  'qr-scanner': 'hybrid',
  'pride-certificates': 'hybrid',
};

/** Helper: get binding for a tab */
export const getTabBinding = (tabValue: string): BindingMeta => {
  return TRANSPORTER_TAB_BINDINGS[tabValue] || {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
  };
};

/** Helper: get binding type for a sidebar item */
export const getSidebarBinding = (itemKey: string): BindingType => {
  return TRANSPORTER_SIDEBAR_BINDINGS[itemKey] || 'internal';
};

/** Helper: get binding type for a quick action */
export const getActionBinding = (actionId: string): BindingType => {
  return TRANSPORTER_ACTION_BINDINGS[actionId] || 'internal';
};
