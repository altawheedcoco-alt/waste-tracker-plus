import type { OrgActionChains } from '@/types/actionChainTypes';

export const TRANSPORTER_CHAINS: OrgActionChains = {
  orgType: 'transporter',
  labelAr: 'الناقل',
  labelEn: 'Transporter',
  chains: [
    // ═══════════════════════════════════════════
    // 1. دورة حياة الشحنة (مع ربط الكربون والتسعير)
    // ═══════════════════════════════════════════
    {
      id: 'shipment-lifecycle',
      labelAr: 'دورة حياة الشحنة',
      labelEn: 'Shipment Lifecycle',
      descriptionAr: 'من إنشاء الشحنة حتى إصدار الشهادة واحتساب البصمة الكربونية',
      descriptionEn: 'From shipment creation to certificate issuance and carbon footprint calculation',
      nodes: [
        { id: 'btn-create-shipment', nodeType: 'trigger', labelAr: 'إنشاء شحنة', labelEn: 'Create Shipment', bindingType: 'hybrid', icon: 'Plus', linkedPath: '/dashboard/shipments/new' },
        { id: 'fn-assign-driver', nodeType: 'function', labelAr: 'تعيين سائق', labelEn: 'Assign Driver', bindingType: 'internal', icon: 'UserPlus', leadsTo: ['fn-route-optimize'] },
        { id: 'fn-route-optimize', nodeType: 'function', labelAr: 'تحسين المسار', labelEn: 'Optimize Route', bindingType: 'internal', icon: 'MapPin', leadsTo: ['fn-pickup', 'eff-pricing-update'] },
        { id: 'eff-pricing-update', nodeType: 'effect', labelAr: 'تحديث التسعير', labelEn: 'Update Pricing', bindingType: 'hybrid', icon: 'DollarSign', linkedTab: 'pricing' },
        { id: 'fn-pickup', nodeType: 'function', labelAr: 'جمع من المولد', labelEn: 'Pickup from Generator', bindingType: 'partner', icon: 'Package', leadsTo: ['fn-geofence-check'] },
        { id: 'fn-geofence-check', nodeType: 'function', labelAr: 'فحص السياج الجغرافي', labelEn: 'Geofence Check', bindingType: 'hybrid', icon: 'MapPinned', leadsTo: ['fn-weigh'], linkedTab: 'geofence' },
        { id: 'fn-weigh', nodeType: 'function', labelAr: 'وزن الشحنة', labelEn: 'Weigh Shipment', bindingType: 'hybrid', icon: 'Scale', leadsTo: ['fn-deliver'] },
        { id: 'fn-deliver', nodeType: 'function', labelAr: 'تسليم للمدوّر', labelEn: 'Deliver to Recycler', bindingType: 'partner', icon: 'Truck', leadsTo: ['res-receipt'] },
        { id: 'res-receipt', nodeType: 'result', labelAr: 'شهادة استلام', labelEn: 'Receipt Certificate', bindingType: 'hybrid', icon: 'FileText', leadsTo: ['eff-ledger', 'eff-custody', 'eff-carbon'] },
        { id: 'eff-ledger', nodeType: 'effect', labelAr: 'تحديث دفتر الحسابات', labelEn: 'Update Ledger', bindingType: 'internal', icon: 'BookOpen', linkedTab: 'overview' },
        { id: 'eff-custody', nodeType: 'effect', labelAr: 'تحديث سلسلة الحفظ', labelEn: 'Update Chain of Custody', bindingType: 'hybrid', icon: 'Link', linkedTab: 'custody' },
        { id: 'eff-carbon', nodeType: 'effect', labelAr: 'احتساب البصمة الكربونية', labelEn: 'Calculate Carbon Footprint', bindingType: 'hybrid', icon: 'Leaf', linkedTab: 'carbon' },
        { id: 'eff-compliance-feed', nodeType: 'effect', labelAr: 'تغذية بيانات الامتثال', labelEn: 'Feed Compliance Data', bindingType: 'admin', icon: 'ShieldCheck', affects: ['compliance-chain'] },
      ],
    },

    // ═══════════════════════════════════════════
    // 2. طلب جمع → شحنة (مع ربط بسلسلة الشحنة الرئيسية)
    // ═══════════════════════════════════════════
    {
      id: 'collection-request-flow',
      labelAr: 'طلب جمع → شحنة',
      labelEn: 'Collection Request → Shipment',
      descriptionAr: 'تحويل طلب جمع من مولد إلى شحنة فعلية مرتبطة بدورة الحياة',
      descriptionEn: 'Convert generator collection request to actual shipment linked to lifecycle',
      nodes: [
        { id: 'btn-accept-request', nodeType: 'trigger', labelAr: 'قبول طلب جمع', labelEn: 'Accept Collection Request', bindingType: 'partner', icon: 'CheckSquare', linkedPath: '/dashboard/collection-requests' },
        { id: 'fn-geofence-zone', nodeType: 'function', labelAr: 'ربط بمنطقة جيوفنس', labelEn: 'Link Geofence Zone', bindingType: 'hybrid', icon: 'MapPinned', leadsTo: ['fn-schedule'], linkedTab: 'geofence' },
        { id: 'fn-schedule', nodeType: 'function', labelAr: 'جدولة الموعد', labelEn: 'Schedule Pickup', bindingType: 'hybrid', icon: 'Calendar', leadsTo: ['fn-auto-shipment'] },
        { id: 'fn-auto-shipment', nodeType: 'function', labelAr: 'إنشاء شحنة تلقائي', labelEn: 'Auto-create Shipment', bindingType: 'hybrid', icon: 'Zap', leadsTo: ['res-shipment-created'] },
        { id: 'res-shipment-created', nodeType: 'result', labelAr: 'شحنة جديدة', labelEn: 'New Shipment', bindingType: 'hybrid', icon: 'Package', leadsTo: ['eff-notify-generator', 'eff-calendar-update', 'eff-start-lifecycle'] },
        { id: 'eff-notify-generator', nodeType: 'effect', labelAr: 'إشعار المولد', labelEn: 'Notify Generator', bindingType: 'partner', icon: 'Bell' },
        { id: 'eff-calendar-update', nodeType: 'effect', labelAr: 'تحديث التقويم', labelEn: 'Update Calendar', bindingType: 'hybrid', icon: 'CalendarDays', linkedTab: 'calendar' },
        { id: 'eff-start-lifecycle', nodeType: 'effect', labelAr: 'بدء تعيين السائق', labelEn: 'Start Driver Assignment', bindingType: 'internal', icon: 'ArrowRight', affects: ['shipment-lifecycle'] },
      ],
    },

    // ═══════════════════════════════════════════
    // 3. إدارة السائقين والأداء
    // ═══════════════════════════════════════════
    {
      id: 'driver-management',
      labelAr: 'إدارة السائقين والأداء',
      labelEn: 'Driver Management & Performance',
      descriptionAr: 'من تسجيل السائق حتى المكافآت والتقييم',
      descriptionEn: 'From driver registration to rewards and evaluation',
      nodes: [
        { id: 'btn-add-driver', nodeType: 'trigger', labelAr: 'تسجيل سائق جديد', labelEn: 'Register New Driver', bindingType: 'internal', icon: 'UserPlus', linkedPath: '/dashboard/transporter-drivers' },
        { id: 'fn-permit-check', nodeType: 'function', labelAr: 'فحص التصاريح', labelEn: 'Check Permits', bindingType: 'admin', icon: 'Shield', leadsTo: ['fn-training'] },
        { id: 'fn-training', nodeType: 'function', labelAr: 'التدريب والأكاديمية', labelEn: 'Training & Academy', bindingType: 'internal', icon: 'GraduationCap', leadsTo: ['res-certified'], linkedPath: '/dashboard/driver-academy' },
        { id: 'res-certified', nodeType: 'result', labelAr: 'سائق معتمد', labelEn: 'Certified Driver', bindingType: 'internal', icon: 'BadgeCheck', leadsTo: ['eff-performance', 'eff-rewards'] },
        { id: 'eff-performance', nodeType: 'effect', labelAr: 'تتبع الأداء', labelEn: 'Track Performance', bindingType: 'internal', icon: 'BarChart3', linkedTab: 'performance' },
        { id: 'eff-rewards', nodeType: 'effect', labelAr: 'نظام المكافآت', labelEn: 'Rewards System', bindingType: 'internal', icon: 'Trophy', linkedPath: '/dashboard/driver-rewards' },
      ],
    },

    // ═══════════════════════════════════════════
    // 4. الامتثال والتقارير الرقابية (مع روابط تصحيحية)
    // ═══════════════════════════════════════════
    {
      id: 'compliance-chain',
      labelAr: 'الامتثال والتقارير الرقابية',
      labelEn: 'Compliance & Regulatory Reports',
      descriptionAr: 'التزام تنظيمي يتأثر بكل العمليات مع إجراءات تصحيحية عند عدم الامتثال',
      descriptionEn: 'Regulatory compliance with corrective actions on non-compliance',
      nodes: [
        { id: 'btn-generate-report', nodeType: 'trigger', labelAr: 'إنشاء تقرير', labelEn: 'Generate Report', bindingType: 'admin', icon: 'FileText', linkedTab: 'compliance' },
        { id: 'fn-aggregate-data', nodeType: 'function', labelAr: 'تجميع بيانات العمليات', labelEn: 'Aggregate Ops Data', bindingType: 'hybrid', icon: 'Database', leadsTo: ['fn-compliance-check'], affects: ['shipment-lifecycle', 'driver-management'] },
        { id: 'fn-compliance-check', nodeType: 'function', labelAr: 'فحص الامتثال', labelEn: 'Compliance Check', bindingType: 'admin', icon: 'ShieldAlert', leadsTo: ['res-compliant', 'res-non-compliant'] },
        { id: 'res-compliant', nodeType: 'result', labelAr: 'ممتثل', labelEn: 'Compliant', bindingType: 'admin', icon: 'CheckCircle', leadsTo: ['fn-esg-calc'] },
        { id: 'res-non-compliant', nodeType: 'result', labelAr: 'غير ممتثل', labelEn: 'Non-Compliant', bindingType: 'admin', icon: 'XCircle', leadsTo: ['eff-corrective-action'] },
        { id: 'eff-corrective-action', nodeType: 'effect', labelAr: 'إجراء تصحيحي', labelEn: 'Corrective Action', bindingType: 'admin', icon: 'Wrench', affects: ['shipment-lifecycle', 'driver-management'] },
        { id: 'fn-esg-calc', nodeType: 'function', labelAr: 'حساب مؤشرات ESG', labelEn: 'Calculate ESG Metrics', bindingType: 'admin', icon: 'Leaf', leadsTo: ['res-esg-report'] },
        { id: 'res-esg-report', nodeType: 'result', labelAr: 'تقرير ESG', labelEn: 'ESG Report', bindingType: 'admin', icon: 'FileSpreadsheet', leadsTo: ['eff-wmis'] },
        { id: 'eff-wmis', nodeType: 'effect', labelAr: 'تحديث WMIS', labelEn: 'Update WMIS', bindingType: 'admin', icon: 'Globe', linkedTab: 'wmis' },
      ],
    },

    // ═══════════════════════════════════════════
    // 5. سلسلة المرفوضات (جديد - لسد الفجوة الوظيفية)
    // ═══════════════════════════════════════════
    {
      id: 'rejection-flow',
      labelAr: 'معالجة الشحنات المرفوضة',
      labelEn: 'Rejected Shipment Handling',
      descriptionAr: 'من رفض المدوّر للشحنة حتى إعادة الجدولة أو الإرجاع',
      descriptionEn: 'From recycler rejection to rescheduling or return to generator',
      nodes: [
        { id: 'btn-rejection-received', nodeType: 'trigger', labelAr: 'استلام رفض', labelEn: 'Rejection Received', bindingType: 'partner', icon: 'AlertTriangle', linkedPath: '/dashboard/rejected-shipments' },
        { id: 'fn-assess-rejection', nodeType: 'function', labelAr: 'تقييم سبب الرفض', labelEn: 'Assess Rejection Reason', bindingType: 'hybrid', icon: 'Search', leadsTo: ['fn-decide-action'] },
        { id: 'fn-decide-action', nodeType: 'function', labelAr: 'قرار المعالجة', labelEn: 'Decide Action', bindingType: 'internal', icon: 'GitBranch', leadsTo: ['res-redirect', 'res-return'] },
        { id: 'res-redirect', nodeType: 'result', labelAr: 'إعادة توجيه لمدوّر آخر', labelEn: 'Redirect to Another Recycler', bindingType: 'partner', icon: 'RotateCw', leadsTo: ['eff-new-shipment'] },
        { id: 'res-return', nodeType: 'result', labelAr: 'إرجاع للمولد', labelEn: 'Return to Generator', bindingType: 'partner', icon: 'Undo2', leadsTo: ['eff-notify-return'] },
        { id: 'eff-new-shipment', nodeType: 'effect', labelAr: 'إنشاء شحنة بديلة', labelEn: 'Create Replacement Shipment', bindingType: 'hybrid', icon: 'PackagePlus', affects: ['shipment-lifecycle'] },
        { id: 'eff-notify-return', nodeType: 'effect', labelAr: 'إشعار المولد بالإرجاع', labelEn: 'Notify Generator of Return', bindingType: 'partner', icon: 'Bell' },
        { id: 'eff-fraud-flag', nodeType: 'effect', labelAr: 'تنبيه كشف تلاعب', labelEn: 'Fraud Detection Flag', bindingType: 'hybrid', icon: 'AlertOctagon', linkedTab: 'fraud' },
      ],
    },
  ],
};
