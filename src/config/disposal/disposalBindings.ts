/**
 * خريطة الارتباطات الوظيفية لجهة التخلص النهائي (Disposal)
 */
import type { BindingMeta, BindingType } from '@/types/bindingTypes';

export const DISPOSAL_TAB_BINDINGS: Record<string, BindingMeta> = {
  operations: {
    type: 'hybrid',
    involvedParties: ['self', 'generator', 'admin'],
    adminVisible: true,
    contextHint: 'عمليات الاستقبال والمعالجة',
  },
  shipments: {
    type: 'partner',
    involvedParties: ['self', 'generator'],
    adminVisible: true,
    requiresPartner: true,
    contextHint: 'شحنات واردة من المولدين والناقلين',
  },
  compliance: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'الامتثال البيئي والسلامة المهنية',
  },
  regulatory: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'مستندات تنظيمية وتراخيص رسمية',
  },
  fleet: {
    type: 'internal',
    involvedParties: ['self'],
    adminVisible: false,
    contextHint: 'إدارة المعدات والمركبات الداخلية',
  },
  reports: {
    type: 'hybrid',
    involvedParties: ['self', 'admin'],
    adminVisible: true,
    contextHint: 'تقارير تشغيلية وبيئية شاملة',
  },
  annual_plan: {
    type: 'admin',
    involvedParties: ['self', 'regulator'],
    adminVisible: true,
    contextHint: 'خطة تشغيلية سنوية للامتثال الرقابي',
  },
};

export const DISPOSAL_SIDEBAR_BINDINGS: Record<string, BindingType> = {
  'disposal-operations': 'hybrid',
  'disposal-incoming': 'partner',
  'disposal-certs': 'hybrid',
  'disposal-facilities': 'internal',
  'disposal-safety': 'admin',
  'capacity-management': 'internal',
};
