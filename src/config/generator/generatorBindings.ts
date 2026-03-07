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
  operations: {
    type: 'partner',
    involvedParties: ['self', 'recycler'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'عمليات النقل مع الشركاء',
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
