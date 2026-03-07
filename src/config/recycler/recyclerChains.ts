import type { OrgActionChains } from '@/types/actionChainTypes';

export const RECYCLER_CHAINS: OrgActionChains = {
  orgType: 'recycler',
  labelAr: 'المدوّر',
  labelEn: 'Recycler',
  chains: [
    {
      id: 'inbound-processing',
      labelAr: 'استقبال ومعالجة المخلفات',
      labelEn: 'Inbound Waste Processing',
      descriptionAr: 'من استلام الشحنة حتى إصدار شهادة التدوير',
      descriptionEn: 'From receiving shipment to issuing recycling certificate',
      nodes: [
        { id: 'btn-receive', nodeType: 'trigger', labelAr: 'استلام شحنة واردة', labelEn: 'Receive Inbound Shipment', bindingType: 'partner', icon: 'Package', linkedPath: '/dashboard/shipments' },
        { id: 'fn-inspect', nodeType: 'function', labelAr: 'فحص الجودة', labelEn: 'Quality Inspection', bindingType: 'internal', icon: 'Search', leadsTo: ['fn-accept-reject'], linkedTab: 'quality' },
        { id: 'fn-accept-reject', nodeType: 'function', labelAr: 'قبول أو رفض', labelEn: 'Accept or Reject', bindingType: 'partner', icon: 'CheckSquare', leadsTo: ['fn-process', 'res-rejected'] },
        { id: 'res-rejected', nodeType: 'result', labelAr: 'شحنة مرفوضة', labelEn: 'Rejected Shipment', bindingType: 'partner', icon: 'AlertTriangle', linkedPath: '/dashboard/rejected-shipments' },
        { id: 'fn-process', nodeType: 'function', labelAr: 'تشغيل خط الإنتاج', labelEn: 'Run Production Line', bindingType: 'internal', icon: 'Factory', leadsTo: ['res-output'], linkedTab: 'production' },
        { id: 'res-output', nodeType: 'result', labelAr: 'منتج معاد تدويره', labelEn: 'Recycled Product', bindingType: 'internal', icon: 'Recycle', leadsTo: ['eff-cert', 'eff-market', 'eff-trace'] },
        { id: 'eff-cert', nodeType: 'effect', labelAr: 'إصدار شهادة تدوير', labelEn: 'Issue Recycling Certificate', bindingType: 'hybrid', icon: 'Award', linkedPath: '/dashboard/issue-recycling-certificates' },
        { id: 'eff-market', nodeType: 'effect', labelAr: 'عرض في البورصة', labelEn: 'List on Marketplace', bindingType: 'partner', icon: 'Store', linkedTab: 'market' },
        { id: 'eff-trace', nodeType: 'effect', labelAr: 'تحديث التتبع', labelEn: 'Update Traceability', bindingType: 'hybrid', icon: 'GitBranch', linkedTab: 'traceability' },
      ],
    },
    {
      id: 'production-optimization',
      labelAr: 'تحسين الإنتاج',
      labelEn: 'Production Optimization',
      descriptionAr: 'صيانة تنبؤية وتحسين ذكي وتوأم رقمي',
      descriptionEn: 'Predictive maintenance, smart optimization, digital twin',
      nodes: [
        { id: 'btn-twin', nodeType: 'trigger', labelAr: 'فتح التوأم الرقمي', labelEn: 'Open Digital Twin', bindingType: 'internal', icon: 'Cpu', linkedTab: 'twin' },
        { id: 'fn-monitor', nodeType: 'function', labelAr: 'مراقبة المعدات', labelEn: 'Monitor Equipment', bindingType: 'internal', icon: 'Activity', leadsTo: ['fn-predict'], linkedTab: 'equipment' },
        { id: 'fn-predict', nodeType: 'function', labelAr: 'صيانة تنبؤية', labelEn: 'Predictive Maintenance', bindingType: 'internal', icon: 'Wrench', leadsTo: ['res-schedule'], linkedTab: 'predictive' },
        { id: 'res-schedule', nodeType: 'result', labelAr: 'جدول صيانة', labelEn: 'Maintenance Schedule', bindingType: 'internal', icon: 'Calendar' },
        { id: 'eff-optimize', nodeType: 'effect', labelAr: 'تحسين الكفاءة', labelEn: 'Optimize Efficiency', bindingType: 'internal', icon: 'TrendingUp', linkedTab: 'optimizer' },
        { id: 'eff-cost', nodeType: 'effect', labelAr: 'خفض التكلفة', labelEn: 'Reduce Cost', bindingType: 'internal', icon: 'DollarSign', linkedTab: 'cost' },
      ],
    },
    {
      id: 'esg-compliance',
      labelAr: 'الامتثال البيئي والاجتماعي',
      labelEn: 'ESG Compliance',
      descriptionAr: 'تقارير ESG وكربون وWMIS',
      descriptionEn: 'ESG reports, carbon, and WMIS',
      nodes: [
        { id: 'btn-esg', nodeType: 'trigger', labelAr: 'فتح تقارير ESG', labelEn: 'Open ESG Reports', bindingType: 'admin', icon: 'Leaf', linkedTab: 'esg' },
        { id: 'fn-carbon-calc', nodeType: 'function', labelAr: 'حساب الكربون', labelEn: 'Calculate Carbon', bindingType: 'hybrid', icon: 'Cloud', leadsTo: ['res-carbon-report'], linkedTab: 'carbon', affects: ['inbound-processing'] },
        { id: 'res-carbon-report', nodeType: 'result', labelAr: 'تقرير كربون', labelEn: 'Carbon Report', bindingType: 'hybrid', icon: 'FileText' },
        { id: 'eff-wmis', nodeType: 'effect', labelAr: 'إفصاح WMIS', labelEn: 'WMIS Disclosure', bindingType: 'admin', icon: 'Globe', linkedTab: 'wmis' },
        { id: 'eff-declarations', nodeType: 'effect', labelAr: 'إقرارات رسمية', labelEn: 'Official Declarations', bindingType: 'admin', icon: 'Stamp', linkedTab: 'declarations' },
      ],
    },
  ],
};
