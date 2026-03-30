/**
 * خريطة الارتباطات الوظيفية لجهة المولد (Generator)
 */
import type { BindingMeta, BindingType } from '@/types/bindingTypes';

export const GENERATOR_TAB_BINDINGS: Record<string, BindingMeta> = {
  overview: {
    type: 'hybrid',
    involvedParties: ['self', 'recycler', 'admin'],
    adminVisible: true,
    contextHint: 'ملخص شامل يضم بيانات داخلية وخارجية',
  },
  shipments: {
    type: 'hybrid',
    involvedParties: ['self', 'recycler', 'admin'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'شحنات المخلفات المرسلة للناقلين والمدورين',
  },
  finance: {
    type: 'hybrid',
    involvedParties: ['self', 'admin'],
    adminVisible: true,
    contextHint: 'الفواتير والمدفوعات والمحفظة والتكاليف',
  },
  operations: {
    type: 'partner',
    involvedParties: ['self', 'recycler'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'عمليات النقل مع الشركاء',
  },
  'ai-tools': {
    type: 'hybrid',
    involvedParties: ['self'],
    adminVisible: true,
    contextHint: 'أدوات الذكاء الاصطناعي وتصنيف النفايات والتوقعات',
  },
  'work-orders': {
    type: 'partner',
    involvedParties: ['self', 'recycler'],
    adminVisible: false,
    requiresPartner: true,
    contextHint: 'أوامر شغل رقمية مرسلة للشركاء',
  },
  partners: {
    type: 'partner',
    involvedParties: ['self', 'recycler', 'disposal'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'إدارة العلاقات مع الناقلين والمدورين',
  },
  reports: {
    type: 'hybrid',
    involvedParties: ['self', 'admin'],
    adminVisible: true,
    contextHint: 'التقارير الشهرية والربع سنوية والبيئية',
  },
  compliance: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'الامتثال القانوني والتراخيص',
  },
  geofence: {
    type: 'hybrid',
    involvedParties: ['self', 'driver'],
    adminVisible: true,
    contextHint: 'تتبع شحنات المخلفات لحظياً',
  },
};

export const GENERATOR_SIDEBAR_BINDINGS: Record<string, BindingType> = {
  'generator-shipments': 'hybrid',
  'generator-rejected': 'partner',
  'recurring-shipments': 'hybrid',
  'generator-receipts': 'hybrid',
  'generator-certs': 'hybrid',
};
