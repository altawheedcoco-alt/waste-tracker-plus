import type { OrgActionChains } from '@/types/actionChainTypes';

export const GENERATOR_CHAINS: OrgActionChains = {
  orgType: 'generator',
  labelAr: 'المولد',
  labelEn: 'Generator',
  chains: [
    {
      id: 'waste-dispatch',
      labelAr: 'إرسال المخلفات',
      labelEn: 'Waste Dispatch',
      descriptionAr: 'من إنشاء الشحنة حتى استلام شهادة التدوير',
      descriptionEn: 'From shipment creation to recycling certificate',
      nodes: [
        { id: 'btn-new-shipment', nodeType: 'trigger', labelAr: 'إنشاء شحنة جديدة', labelEn: 'Create New Shipment', bindingType: 'hybrid', icon: 'Plus', linkedPath: '/dashboard/shipments/new' },
        { id: 'fn-classify-waste', nodeType: 'function', labelAr: 'تصنيف المخلفات', labelEn: 'Classify Waste', bindingType: 'internal', icon: 'Tags', leadsTo: ['fn-select-partner'] },
        { id: 'fn-select-partner', nodeType: 'function', labelAr: 'اختيار الناقل/المدور', labelEn: 'Select Transporter/Recycler', bindingType: 'partner', icon: 'Users', leadsTo: ['fn-schedule-pickup'] },
        { id: 'fn-schedule-pickup', nodeType: 'function', labelAr: 'جدولة الجمع', labelEn: 'Schedule Pickup', bindingType: 'hybrid', icon: 'Calendar', leadsTo: ['res-shipment-sent'] },
        { id: 'res-shipment-sent', nodeType: 'result', labelAr: 'شحنة في الطريق', labelEn: 'Shipment In Transit', bindingType: 'hybrid', icon: 'Truck', leadsTo: ['eff-track', 'eff-receipt'] },
        { id: 'eff-track', nodeType: 'effect', labelAr: 'تتبع لحظي', labelEn: 'Live Tracking', bindingType: 'hybrid', icon: 'MapPin', linkedTab: 'geofence' },
        { id: 'eff-receipt', nodeType: 'effect', labelAr: 'شهادة استلام', labelEn: 'Receipt Certificate', bindingType: 'hybrid', icon: 'FileText', linkedPath: '/dashboard/generator-receipts' },
        { id: 'eff-recycling-cert', nodeType: 'effect', labelAr: 'شهادة تدوير', labelEn: 'Recycling Certificate', bindingType: 'hybrid', icon: 'Award', linkedPath: '/dashboard/recycling-certificates' },
      ],
    },
    {
      id: 'work-order-flow',
      labelAr: 'أوامر الشغل الرقمية',
      labelEn: 'Digital Work Orders',
      descriptionAr: 'طلب خدمات من الشركاء والمتابعة',
      descriptionEn: 'Request services from partners and follow up',
      nodes: [
        { id: 'btn-create-wo', nodeType: 'trigger', labelAr: 'إنشاء أمر شغل', labelEn: 'Create Work Order', bindingType: 'partner', icon: 'ClipboardList' },
        { id: 'fn-send-to-partner', nodeType: 'function', labelAr: 'إرسال للشريك', labelEn: 'Send to Partner', bindingType: 'partner', icon: 'Send', leadsTo: ['fn-partner-respond'] },
        { id: 'fn-partner-respond', nodeType: 'function', labelAr: 'رد الشريك', labelEn: 'Partner Response', bindingType: 'partner', icon: 'MessageCircle', leadsTo: ['res-wo-accepted'] },
        { id: 'res-wo-accepted', nodeType: 'result', labelAr: 'أمر شغل معتمد', labelEn: 'Work Order Approved', bindingType: 'partner', icon: 'CheckSquare', leadsTo: ['eff-auto-shipment'] },
        { id: 'eff-auto-shipment', nodeType: 'effect', labelAr: 'شحنة تلقائية', labelEn: 'Auto Shipment', bindingType: 'hybrid', icon: 'Zap' },
      ],
    },
    {
      id: 'compliance-reporting',
      labelAr: 'الامتثال والإفصاح',
      labelEn: 'Compliance & Disclosure',
      descriptionAr: 'التزام بيئي يتغذى من كل العمليات',
      descriptionEn: 'Environmental compliance fed by all operations',
      nodes: [
        { id: 'btn-compliance', nodeType: 'trigger', labelAr: 'فتح لوحة الامتثال', labelEn: 'Open Compliance Panel', bindingType: 'admin', icon: 'Shield', linkedTab: 'compliance' },
        { id: 'fn-collect-metrics', nodeType: 'function', labelAr: 'تجميع المؤشرات', labelEn: 'Collect Metrics', bindingType: 'hybrid', icon: 'BarChart3', affects: ['waste-dispatch'] },
        { id: 'res-compliance-status', nodeType: 'result', labelAr: 'حالة الامتثال', labelEn: 'Compliance Status', bindingType: 'admin', icon: 'ShieldCheck' },
        { id: 'eff-notifications', nodeType: 'effect', labelAr: 'تنبيهات التجديد', labelEn: 'Renewal Alerts', bindingType: 'admin', icon: 'Bell' },
      ],
    },
  ],
};
