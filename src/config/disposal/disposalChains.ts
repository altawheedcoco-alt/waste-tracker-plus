import type { OrgActionChains } from '@/types/actionChainTypes';

export const DISPOSAL_CHAINS: OrgActionChains = {
  orgType: 'disposal',
  labelAr: 'التخلص النهائي',
  labelEn: 'Disposal',
  chains: [
    {
      id: 'incoming-disposal',
      labelAr: 'استقبال ومعالجة نهائية',
      labelEn: 'Incoming & Final Processing',
      descriptionAr: 'من استلام الطلب حتى إصدار شهادة التخلص',
      descriptionEn: 'From receiving request to disposal certificate',
      nodes: [
        { id: 'btn-incoming', nodeType: 'trigger', labelAr: 'طلب وارد جديد', labelEn: 'New Incoming Request', bindingType: 'partner', icon: 'Inbox', linkedPath: '/dashboard/disposal/incoming-requests' },
        { id: 'fn-capacity-check', nodeType: 'function', labelAr: 'فحص السعة', labelEn: 'Check Capacity', bindingType: 'internal', icon: 'Gauge', leadsTo: ['fn-accept-reject'], linkedPath: '/dashboard/capacity-management' },
        { id: 'fn-accept-reject', nodeType: 'function', labelAr: 'قبول أو رفض', labelEn: 'Accept or Reject', bindingType: 'partner', icon: 'CheckSquare', leadsTo: ['fn-process'] },
        { id: 'fn-process', nodeType: 'function', labelAr: 'معالجة وتخلص', labelEn: 'Process & Dispose', bindingType: 'hybrid', icon: 'Factory', leadsTo: ['res-disposed'], linkedPath: '/dashboard/disposal/operations' },
        { id: 'res-disposed', nodeType: 'result', labelAr: 'تم التخلص', labelEn: 'Disposed', bindingType: 'hybrid', icon: 'CheckCircle', leadsTo: ['eff-cert', 'eff-capacity-update'] },
        { id: 'eff-cert', nodeType: 'effect', labelAr: 'شهادة تخلص', labelEn: 'Disposal Certificate', bindingType: 'hybrid', icon: 'Award', linkedPath: '/dashboard/disposal/certificates' },
        { id: 'eff-capacity-update', nodeType: 'effect', labelAr: 'تحديث السعة', labelEn: 'Update Capacity', bindingType: 'internal', icon: 'Gauge', linkedPath: '/dashboard/capacity-management' },
      ],
    },
    {
      id: 'safety-compliance',
      labelAr: 'السلامة والامتثال',
      labelEn: 'Safety & Compliance',
      descriptionAr: 'معايير السلامة المهنية والتقارير البيئية',
      descriptionEn: 'OHS standards and environmental reports',
      nodes: [
        { id: 'btn-safety', nodeType: 'trigger', labelAr: 'فتح لوحة السلامة', labelEn: 'Open Safety Panel', bindingType: 'admin', icon: 'HardHat', linkedPath: '/dashboard/safety' },
        { id: 'fn-inspect-facility', nodeType: 'function', labelAr: 'فحص المرافق', labelEn: 'Inspect Facilities', bindingType: 'internal', icon: 'Search', leadsTo: ['res-safety-report'], linkedPath: '/dashboard/disposal-facilities' },
        { id: 'res-safety-report', nodeType: 'result', labelAr: 'تقرير سلامة', labelEn: 'Safety Report', bindingType: 'admin', icon: 'FileText', leadsTo: ['eff-annual-plan'] },
        { id: 'eff-annual-plan', nodeType: 'effect', labelAr: 'تحديث الخطة السنوية', labelEn: 'Update Annual Plan', bindingType: 'admin', icon: 'Calendar' },
        { id: 'eff-regulatory', nodeType: 'effect', labelAr: 'إفصاحات تنظيمية', labelEn: 'Regulatory Disclosures', bindingType: 'admin', icon: 'Globe', affects: ['incoming-disposal'] },
      ],
    },
  ],
};
