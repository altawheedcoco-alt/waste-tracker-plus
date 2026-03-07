/**
 * خريطة الارتباطات الوظيفية لجهة التدوير (Recycler)
 */
import type { BindingMeta, BindingType } from '@/types/bindingTypes';

export const RECYCLER_TAB_BINDINGS: Record<string, BindingMeta> = {
  overview: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'admin'],
    adminVisible: true,
    contextHint: 'ملخص شامل للإنتاج والعمليات',
  },
  twin: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'التوأم الرقمي لخطوط الإنتاج',
  },
  production: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'إدارة الإنتاج والمخرجات',
  },
  quality: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: true,
    contextHint: 'فحص جودة المواد المعاد تدويرها',
  },
  equipment: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'إدارة المعدات والآلات',
  },
  predictive: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'صيانة تنبؤية للمعدات',
  },
  workorders: {
    type: 'partner',
    involvedParties: ['self', 'generator'],
    adminVisible: false,
    requiresPartner: true,
    contextHint: 'أوامر تشغيل واردة من المولدين',
  },
  optimizer: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'تحسين ذكي لعمليات التدوير',
  },
  traceability: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'admin'],
    adminVisible: true,
    contextHint: 'تتبع الدُفعات من المصدر للمنتج النهائي',
  },
  utilities: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'استهلاك المرافق (كهرباء، مياه، غاز)',
  },
  cost: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'تحليل تكلفة التدوير لكل طن',
  },
  certificates: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'admin'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'إصدار شهادات التدوير للمولدين',
  },
  market: {
    type: 'partner',
    involvedParties: ['self', 'generator'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'بورصة المواد المعاد تدويرها',
  },
  carbon: {
    type: 'hybrid',
    involvedParties: ['self', 'admin'],
    adminVisible: true,
    contextHint: 'حساب البصمة الكربونية للتدوير',
  },
  esg: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'تقارير الحوكمة البيئية والاجتماعية',
  },
  wmis: {
    type: 'admin',
    involvedParties: ['self', 'regulator', 'admin'],
    adminVisible: true,
    contextHint: 'نظام إدارة معلومات المخلفات',
  },
  declarations: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'إقرارات رسمية للجهات الرقابية',
  },
};

export const RECYCLER_SIDEBAR_BINDINGS: Record<string, BindingType> = {
  'recycler-shipments': 'hybrid',
  'recycler-rejected': 'partner',
  'recycler-declarations': 'partner',
  'issue-certs': 'hybrid',
  'production-dashboard': 'internal',
};
