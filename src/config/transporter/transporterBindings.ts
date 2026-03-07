/**
 * خريطة الارتباطات الوظيفية لجهة الناقل
 * تصنّف كل تبويب وعنصر sidebar وإجراء سريع حسب نوع ارتباطه
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

  // ── ذكاء اصطناعي: تحليلات داخلية ──
  ai: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'تحليلات وتوصيات ذكية مبنية على بيانات الناقل',
  },

  // ── أداء السائقين: داخلي ──
  performance: {
    type: 'internal',
    involvedParties: ['self', 'driver'],
    adminVisible: false,
    contextHint: 'أداء السائقين وتكاليف الرحلات والصيانة',
  },

  // ── مساعد السائق: داخلي ──
  copilot: {
    type: 'internal',
    involvedParties: ['self', 'driver'],
    adminVisible: false,
    contextHint: 'مساعد ذكي للسائق أثناء الرحلة',
  },

  // ── التسعير الديناميكي: هجين (يعتمد على بيانات السوق والشركاء) ──
  pricing: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'recycler'],
    adminVisible: false,
    requiresPartner: true,
    contextHint: 'تسعير ذكي يعتمد على بيانات الشركاء والسوق',
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

  // ── الشركاء: شركاء ──
  partners: {
    type: 'partner',
    involvedParties: ['self', 'generator', 'recycler', 'disposal'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'إدارة العلاقات والتقييمات مع الجهات المرتبطة',
  },

  // ── التتبع: داخلي (تتبع السائقين) ──
  tracking: {
    type: 'internal',
    involvedParties: ['self', 'driver'],
    adminVisible: false,
    contextHint: 'تتبع مواقع السائقين والمركبات لحظياً',
  },

  // ── السياج الجغرافي: هجين ──
  geofence: {
    type: 'hybrid',
    involvedParties: ['self', 'driver', 'generator', 'recycler'],
    adminVisible: true,
    contextHint: 'تنبيهات دخول/خروج من مناطق العملاء',
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

  // ── الخطة السنوية: هجين ──
  annual_plan: {
    type: 'hybrid',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'خطة تشغيلية سنوية مرتبطة بالامتثال',
  },

  // ── السلامة المهنية: هجين (تقارير حوادث ترسل للجهات الرقابية) ──
  ohs: {
    type: 'hybrid',
    involvedParties: ['self', 'driver', 'regulator'],
    adminVisible: true,
    contextHint: 'إدارة السلامة والصحة المهنية مع إفصاحات رقابية',
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
  'transporter-certs': 'hybrid',
  'transporter-guilloche': 'internal',
  'collection-requests': 'partner',
  'manual-shipment': 'hybrid',
  'manual-shipment-drafts': 'internal',

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
  'smart-weight-upload': 'internal',
  'collection-requests': 'partner',
  'transporter-drivers': 'internal',
  'quick-shipment-links': 'partner',
  'quick-deposit-links': 'partner',
  'contracts': 'partner',
  'external-records': 'partner',
  'navigation-demo': 'internal',
  'partners': 'partner',
  'reports': 'hybrid',
  'transporter-ai-tools': 'internal',
  'environmental-sustainability': 'admin',
  'employees': 'internal',
  'org-structure': 'internal',
  'my-requests': 'hybrid',
  'activity-log': 'admin',
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
