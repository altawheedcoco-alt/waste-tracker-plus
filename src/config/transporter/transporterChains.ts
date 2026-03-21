import type { OrgActionChains } from '@/types/actionChainTypes';

export const TRANSPORTER_CHAINS: OrgActionChains = {
  orgType: 'transporter',
  labelAr: 'الناقل',
  labelEn: 'Transporter',
  chains: [
    // ═══════════════════════════════════════════
    // 1. دورة حياة الشحنة (مع ربط الكربون والتسعير والعقود)
    // ═══════════════════════════════════════════
    {
      id: 'shipment-lifecycle',
      labelAr: 'دورة حياة الشحنة',
      labelEn: 'Shipment Lifecycle',
      descriptionAr: 'من إنشاء الشحنة حتى إصدار الشهادة واحتساب البصمة الكربونية',
      descriptionEn: 'From shipment creation to certificate issuance and carbon footprint calculation',
      nodes: [
        { id: 'btn-create-shipment', nodeType: 'trigger', labelAr: 'إنشاء شحنة', labelEn: 'Create Shipment', bindingType: 'hybrid', icon: 'Plus', linkedPath: '/dashboard/shipments/new' },
        { id: 'fn-contract-verify', nodeType: 'function', labelAr: 'التحقق من العقد الساري', labelEn: 'Verify Active Contract', bindingType: 'partner', icon: 'FileCheck', leadsTo: ['fn-contract-pricing-link', 'fn-license-gate'] },
        // ✅ NEW: ربط التسعير ببنود العقد آلياً
        { id: 'fn-contract-pricing-link', nodeType: 'function', labelAr: 'ربط سعر الشحنة ببنود العقد', labelEn: 'Link Pricing to Contract Terms', bindingType: 'partner', icon: 'DollarSign', leadsTo: ['eff-pricing-update'], linkedTab: 'pricing' },
        { id: 'fn-license-gate', nodeType: 'function', labelAr: 'فحص صلاحية التراخيص', labelEn: 'License Validity Gate', bindingType: 'admin', icon: 'ShieldCheck', leadsTo: ['fn-assign-driver'], linkedTab: 'regulatory_hub' },
        { id: 'fn-assign-driver', nodeType: 'function', labelAr: 'تعيين سائق', labelEn: 'Assign Driver', bindingType: 'internal', icon: 'UserPlus', leadsTo: ['fn-fleet-check'] },
        { id: 'fn-fleet-check', nodeType: 'function', labelAr: 'فحص سلامة المركبة', labelEn: 'Fleet Safety Check', bindingType: 'internal', icon: 'CarFront', leadsTo: ['fn-iot-monitor', 'fn-route-optimize'], linkedTab: 'fleet' },
        { id: 'fn-iot-monitor', nodeType: 'function', labelAr: 'مراقبة حساسات IoT', labelEn: 'IoT Sensor Monitoring', bindingType: 'hybrid', icon: 'Cpu', leadsTo: ['fn-route-optimize', 'eff-iot-fraud-alert', 'eff-fuel-gps-match'], linkedTab: 'iot' },
        { id: 'eff-iot-fraud-alert', nodeType: 'effect', labelAr: 'تنبيه IoT لكشف الاحتيال مع تعليق مؤقت', labelEn: 'IoT Fraud Alert with Shipment Hold', bindingType: 'hybrid', icon: 'ShieldAlert', linkedTab: 'fraud', leadsTo: ['fn-iot-hold-shipment'] },
        { id: 'fn-iot-hold-shipment', nodeType: 'function', labelAr: 'تعليق الشحنة لحين الفحص اليدوي', labelEn: 'Hold Shipment for Manual Inspection', bindingType: 'hybrid', icon: 'PauseCircle', leadsTo: ['fn-iot-reweigh'] },
        // ✅ FIX: إعادة الوزن تؤدي لنتائج واضحة
        { id: 'fn-iot-reweigh', nodeType: 'function', labelAr: 'إعادة وزن فورية', labelEn: 'Immediate Re-weigh', bindingType: 'hybrid', icon: 'Scale', linkedTab: 'iot', leadsTo: ['res-reweigh-result'] },
        { id: 'res-reweigh-result', nodeType: 'result', labelAr: 'نتيجة إعادة الوزن', labelEn: 'Re-weigh Result', bindingType: 'hybrid', icon: 'CheckCircle', leadsTo: ['eff-weight-update', 'eff-fraud-reweigh-flag'] },
        { id: 'eff-weight-update', nodeType: 'effect', labelAr: 'تحديث الوزن الرسمي', labelEn: 'Update Official Weight', bindingType: 'hybrid', icon: 'Scale', affects: ['shipment-lifecycle'] },
        { id: 'eff-fraud-reweigh-flag', nodeType: 'effect', labelAr: 'تنبيه مطابقة إعادة الوزن', labelEn: 'Re-weigh Match Alert', bindingType: 'hybrid', icon: 'AlertTriangle', linkedTab: 'fraud' },
        // ✅ NEW: مطابقة استهلاك الوقود بالـ GPS
        { id: 'eff-fuel-gps-match', nodeType: 'effect', labelAr: 'مطابقة الوقود مع GPS', labelEn: 'Fuel-GPS Distance Match', bindingType: 'internal', icon: 'Fuel', linkedTab: 'fleet', leadsTo: ['eff-fuel-theft-alert'] },
        { id: 'eff-fuel-theft-alert', nodeType: 'effect', labelAr: 'تنبيه سرقة وقود محتملة', labelEn: 'Potential Fuel Theft Alert', bindingType: 'internal', icon: 'AlertOctagon', linkedTab: 'fraud' },
        { id: 'fn-route-optimize', nodeType: 'function', labelAr: 'تحسين المسار', labelEn: 'Optimize Route', bindingType: 'internal', icon: 'MapPin', leadsTo: ['fn-pickup', 'eff-pricing-update'] },
        { id: 'eff-pricing-update', nodeType: 'effect', labelAr: 'تحديث التسعير', labelEn: 'Update Pricing', bindingType: 'hybrid', icon: 'DollarSign', linkedTab: 'pricing' },
        // ✅ NEW: تحقق هوية السائق عند الاستلام (OTP/QR)
        { id: 'fn-pickup', nodeType: 'function', labelAr: 'جمع من المولد', labelEn: 'Pickup from Generator', bindingType: 'partner', icon: 'Package', leadsTo: ['fn-identity-verify'] },
        { id: 'fn-identity-verify', nodeType: 'function', labelAr: 'تحقق هوية السائق (OTP/QR)', labelEn: 'Driver Identity Verification (OTP/QR)', bindingType: 'hybrid', icon: 'ScanLine', leadsTo: ['fn-geofence-check'] },
        { id: 'fn-geofence-check', nodeType: 'function', labelAr: 'فحص السياج الجغرافي', labelEn: 'Geofence Check', bindingType: 'hybrid', icon: 'MapPinned', leadsTo: ['fn-smart-weigh'], linkedTab: 'geofence' },
        { id: 'fn-smart-weigh', nodeType: 'function', labelAr: 'وزن ذكي (رفع الوزنة)', labelEn: 'Smart Weight Upload', bindingType: 'hybrid', icon: 'Scale', leadsTo: ['fn-fraud-weight-check'], linkedTab: 'iot' },
        { id: 'fn-fraud-weight-check', nodeType: 'function', labelAr: 'فحص تلاعب الوزن', labelEn: 'Weight Fraud Check', bindingType: 'hybrid', icon: 'ShieldAlert', leadsTo: ['fn-deliver'], linkedTab: 'fraud' },
        { id: 'fn-deliver', nodeType: 'function', labelAr: 'تسليم للمدوّر', labelEn: 'Deliver to Recycler', bindingType: 'partner', icon: 'Truck', leadsTo: ['fn-epod-sign'] },
        { id: 'fn-epod-sign', nodeType: 'function', labelAr: 'توقيع إثبات التسليم الرقمي', labelEn: 'Digital Proof of Delivery (E-POD)', bindingType: 'partner', icon: 'PenTool', leadsTo: ['res-receipt'] },
        { id: 'res-receipt', nodeType: 'result', labelAr: 'شهادة استلام', labelEn: 'Receipt Certificate', bindingType: 'hybrid', icon: 'FileText', leadsTo: ['eff-ledger', 'eff-custody', 'eff-carbon', 'eff-invoice', 'eff-fuel-log', 'eff-activity-audit'] },
        { id: 'eff-invoice', nodeType: 'effect', labelAr: 'إنشاء فاتورة مطالبة', labelEn: 'Generate Invoice', bindingType: 'partner', icon: 'Receipt', linkedTab: 'overview', affects: ['compliance-chain'] },
        { id: 'eff-fuel-log', nodeType: 'effect', labelAr: 'تسجيل استهلاك الوقود', labelEn: 'Log Fuel Consumption', bindingType: 'internal', icon: 'Fuel', linkedTab: 'fleet' },
        { id: 'eff-activity-audit', nodeType: 'effect', labelAr: 'تسجيل في سجل التدقيق', labelEn: 'Log to Audit Trail', bindingType: 'admin', icon: 'ClipboardList', affects: ['compliance-chain'] },
        { id: 'eff-ledger', nodeType: 'effect', labelAr: 'تحديث دفتر الحسابات', labelEn: 'Update Ledger', bindingType: 'internal', icon: 'BookOpen', linkedTab: 'overview' },
        { id: 'eff-custody', nodeType: 'effect', labelAr: 'تحديث سلسلة الحفظ', labelEn: 'Update Chain of Custody', bindingType: 'hybrid', icon: 'Link', linkedTab: 'custody' },
        { id: 'eff-carbon', nodeType: 'effect', labelAr: 'احتساب البصمة الكربونية', labelEn: 'Calculate Carbon Footprint', bindingType: 'hybrid', icon: 'Leaf', linkedTab: 'carbon' },
        { id: 'eff-compliance-feed', nodeType: 'effect', labelAr: 'تغذية بيانات الامتثال', labelEn: 'Feed Compliance Data', bindingType: 'admin', icon: 'ShieldCheck', affects: ['compliance-chain'] },
      ],
    },

    // ═══════════════════════════════════════════
    // 2. طلب جمع → شحنة
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
    // 3. إدارة السائقين والأداء (مع ربط AI بالصيانة)
    // ═══════════════════════════════════════════
    {
      id: 'driver-management',
      labelAr: 'إدارة السائقين والأداء',
      labelEn: 'Driver Management & Performance',
      descriptionAr: 'من تسجيل السائق حتى المكافآت والتقييم مع صيانة تنبؤية',
      descriptionEn: 'From driver registration to rewards and evaluation with predictive maintenance',
      nodes: [
        { id: 'btn-add-driver', nodeType: 'trigger', labelAr: 'تسجيل سائق جديد', labelEn: 'Register New Driver', bindingType: 'internal', icon: 'UserPlus', linkedPath: '/dashboard/transporter-drivers' },
        { id: 'fn-permit-check', nodeType: 'function', labelAr: 'فحص التصاريح', labelEn: 'Check Permits', bindingType: 'admin', icon: 'Shield', leadsTo: ['fn-training'] },
        { id: 'fn-training', nodeType: 'function', labelAr: 'التدريب والأكاديمية', labelEn: 'Training & Academy', bindingType: 'internal', icon: 'GraduationCap', leadsTo: ['res-certified'], linkedPath: '/dashboard/driver-academy' },
        { id: 'res-certified', nodeType: 'result', labelAr: 'سائق معتمد', labelEn: 'Certified Driver', bindingType: 'internal', icon: 'BadgeCheck', leadsTo: ['eff-performance', 'eff-rewards', 'eff-license-update', 'eff-ai-pattern'] },
        { id: 'eff-performance', nodeType: 'effect', labelAr: 'تتبع الأداء', labelEn: 'Track Performance', bindingType: 'hybrid', icon: 'BarChart3', linkedTab: 'performance', leadsTo: ['eff-driving-wear'] },
        { id: 'eff-driving-wear', nodeType: 'effect', labelAr: 'تأثير أسلوب القيادة على الصيانة', labelEn: 'Driving Style Impact on Maintenance', bindingType: 'internal', icon: 'Wrench', linkedTab: 'fleet' },
        { id: 'eff-rewards', nodeType: 'effect', labelAr: 'نظام المكافآت', labelEn: 'Rewards System', bindingType: 'internal', icon: 'Trophy', linkedPath: '/dashboard/driver-rewards' },
        { id: 'eff-license-update', nodeType: 'effect', labelAr: 'تحديث التراخيص والامتثال', labelEn: 'Update Licenses & Compliance', bindingType: 'admin', icon: 'ShieldCheck', linkedTab: 'regulatory_hub', affects: ['compliance-chain'] },
        // ✅ FIX: ربط AI بالصيانة التنبؤية
        { id: 'eff-ai-pattern', nodeType: 'effect', labelAr: 'تحليل أنماط القيادة بالذكاء الاصطناعي', labelEn: 'AI Driving Pattern Analysis', bindingType: 'hybrid', icon: 'Brain', linkedTab: 'ai', leadsTo: ['eff-ai-predictive-maintenance'] },
        { id: 'eff-ai-predictive-maintenance', nodeType: 'effect', labelAr: 'صيانة تنبؤية بالذكاء الاصطناعي', labelEn: 'AI Predictive Maintenance', bindingType: 'hybrid', icon: 'Wrench', linkedTab: 'fleet', affects: ['shipment-lifecycle'] },
      ],
    },

    // ═══════════════════════════════════════════
    // 4. الامتثال والتقارير الرقابية
    // ═══════════════════════════════════════════
    {
      id: 'compliance-chain',
      labelAr: 'الامتثال والتقارير الرقابية',
      labelEn: 'Compliance & Regulatory Reports',
      descriptionAr: 'التزام تنظيمي يتأثر بكل العمليات مع إجراءات تصحيحية عند عدم الامتثال',
      descriptionEn: 'Regulatory compliance with corrective actions on non-compliance',
      nodes: [
        { id: 'btn-generate-report', nodeType: 'trigger', labelAr: 'إنشاء تقرير', labelEn: 'Generate Report', bindingType: 'admin', icon: 'FileText', linkedTab: 'regulatory_hub' },
        { id: 'fn-aggregate-data', nodeType: 'function', labelAr: 'تجميع بيانات العمليات', labelEn: 'Aggregate Ops Data', bindingType: 'hybrid', icon: 'Database', leadsTo: ['fn-compliance-check'], affects: ['shipment-lifecycle', 'driver-management'] },
        { id: 'fn-compliance-check', nodeType: 'function', labelAr: 'فحص الامتثال', labelEn: 'Compliance Check', bindingType: 'admin', icon: 'ShieldAlert', leadsTo: ['res-compliant', 'res-non-compliant'] },
        { id: 'res-compliant', nodeType: 'result', labelAr: 'ممتثل', labelEn: 'Compliant', bindingType: 'admin', icon: 'CheckCircle', leadsTo: ['fn-esg-calc'] },
        { id: 'res-non-compliant', nodeType: 'result', labelAr: 'غير ممتثل', labelEn: 'Non-Compliant', bindingType: 'admin', icon: 'XCircle', leadsTo: ['eff-corrective-action'] },
        { id: 'eff-corrective-action', nodeType: 'effect', labelAr: 'إجراء تصحيحي', labelEn: 'Corrective Action', bindingType: 'admin', icon: 'Wrench', affects: ['shipment-lifecycle', 'driver-management'] },
        { id: 'fn-esg-calc', nodeType: 'function', labelAr: 'حساب مؤشرات ESG', labelEn: 'Calculate ESG Metrics', bindingType: 'admin', icon: 'Leaf', leadsTo: ['res-esg-report'] },
        { id: 'res-esg-report', nodeType: 'result', labelAr: 'تقرير ESG', labelEn: 'ESG Report', bindingType: 'admin', icon: 'FileSpreadsheet', leadsTo: ['eff-wmis', 'eff-guilloche-secure'] },
        { id: 'eff-guilloche-secure', nodeType: 'effect', labelAr: 'تأمين الوثائق بنمط Guilloche', labelEn: 'Guilloche Document Security', bindingType: 'admin', icon: 'Fingerprint', linkedPath: '/dashboard/transporter-guilloche' },
        { id: 'eff-wmis', nodeType: 'effect', labelAr: 'تحديث WMIS', labelEn: 'Update WMIS', bindingType: 'admin', icon: 'Globe', linkedTab: 'regulatory_hub', leadsTo: ['fn-wmis-correction'] },
        { id: 'fn-wmis-correction', nodeType: 'function', labelAr: 'تصحيح بيانات WMIS المرفوضة', labelEn: 'Correct Rejected WMIS Data', bindingType: 'admin', icon: 'RefreshCw', linkedTab: 'regulatory_hub' },
      ],
    },

    // ═══════════════════════════════════════════
    // 5. سلسلة المرفوضات (مع إغلاق كامل)
    // ═══════════════════════════════════════════
    {
      id: 'rejection-flow',
      labelAr: 'معالجة الشحنات المرفوضة',
      labelEn: 'Rejected Shipment Handling',
      descriptionAr: 'من رفض المدوّر للشحنة حتى إعادة الجدولة أو الإرجاع مع إغلاق كامل',
      descriptionEn: 'From recycler rejection to rescheduling or return with full closure',
      nodes: [
        { id: 'btn-rejection-received', nodeType: 'trigger', labelAr: 'استلام رفض', labelEn: 'Rejection Received', bindingType: 'partner', icon: 'AlertTriangle', linkedPath: '/dashboard/rejected-shipments' },
        { id: 'fn-upload-rejection-photos', nodeType: 'function', labelAr: 'رفع صور الشحنة المرفوضة', labelEn: 'Upload Rejection Photos', bindingType: 'internal', icon: 'Camera', leadsTo: ['fn-assess-rejection'] },
        { id: 'fn-assess-rejection', nodeType: 'function', labelAr: 'تقييم سبب الرفض', labelEn: 'Assess Rejection Reason', bindingType: 'hybrid', icon: 'Search', leadsTo: ['fn-fraud-assessment'] },
        { id: 'fn-fraud-assessment', nodeType: 'function', labelAr: 'فحص التلاعب والاحتيال', labelEn: 'Fraud Assessment Check', bindingType: 'hybrid', icon: 'ShieldAlert', leadsTo: ['fn-decide-action', 'eff-fraud-flag'], linkedTab: 'fraud' },
        { id: 'fn-decide-action', nodeType: 'function', labelAr: 'قرار المعالجة', labelEn: 'Decide Action', bindingType: 'internal', icon: 'GitBranch', leadsTo: ['res-redirect', 'res-return', 'res-marketplace-list'] },
        { id: 'res-redirect', nodeType: 'result', labelAr: 'إعادة توجيه لمدوّر آخر', labelEn: 'Redirect to Another Recycler', bindingType: 'partner', icon: 'RotateCw', leadsTo: ['eff-new-shipment', 'eff-adjust-invoice', 'eff-close-rejection'] },
        { id: 'res-return', nodeType: 'result', labelAr: 'إرجاع للمولد', labelEn: 'Return to Generator', bindingType: 'partner', icon: 'Undo2', leadsTo: ['eff-notify-return', 'eff-adjust-invoice', 'eff-close-rejection'] },
        { id: 'res-marketplace-list', nodeType: 'result', labelAr: 'عرض في بورصة المخلفات', labelEn: 'List on Marketplace', bindingType: 'partner', icon: 'Store', leadsTo: ['eff-marketplace-post', 'eff-adjust-invoice', 'eff-close-rejection'], linkedTab: 'marketplace' },
        { id: 'eff-adjust-invoice', nodeType: 'effect', labelAr: 'تعديل/إلغاء الفاتورة تلقائياً', labelEn: 'Auto-adjust/Cancel Invoice', bindingType: 'partner', icon: 'FileX', linkedTab: 'overview' },
        { id: 'eff-marketplace-post', nodeType: 'effect', labelAr: 'نشر عرض بيع في السوق', labelEn: 'Post Sell Offer on Marketplace', bindingType: 'partner', icon: 'ShoppingBag', linkedTab: 'marketplace', leadsTo: ['eff-marketplace-pricing'] },
        { id: 'eff-marketplace-pricing', nodeType: 'effect', labelAr: 'تحديث محرك التسعير من السوق', labelEn: 'Update Pricing from Marketplace', bindingType: 'hybrid', icon: 'DollarSign', linkedTab: 'pricing' },
        { id: 'eff-new-shipment', nodeType: 'effect', labelAr: 'إنشاء شحنة بديلة', labelEn: 'Create Replacement Shipment', bindingType: 'hybrid', icon: 'PackagePlus', affects: ['shipment-lifecycle'] },
        { id: 'eff-notify-return', nodeType: 'effect', labelAr: 'إشعار المولد بالإرجاع', labelEn: 'Notify Generator of Return', bindingType: 'partner', icon: 'Bell' },
        { id: 'eff-fraud-flag', nodeType: 'effect', labelAr: 'تنبيه كشف تلاعب', labelEn: 'Fraud Detection Flag', bindingType: 'hybrid', icon: 'AlertOctagon', linkedTab: 'fraud' },
        // ✅ FIX: إغلاق كامل لسلسلة المرفوضات
        { id: 'eff-close-rejection', nodeType: 'effect', labelAr: 'إغلاق طلب الرفض وتأكيد المعالجة', labelEn: 'Close Rejection & Confirm Resolution', bindingType: 'hybrid', icon: 'CheckCircle2', leadsTo: ['eff-compliance-rejection-feed', 'eff-risk-update'] },
        { id: 'eff-compliance-rejection-feed', nodeType: 'effect', labelAr: 'تغذية سجل الامتثال بالرفض', labelEn: 'Feed Compliance with Rejection', bindingType: 'admin', icon: 'ShieldCheck', affects: ['compliance-chain'] },
        { id: 'eff-risk-update', nodeType: 'effect', labelAr: 'تحديث تقييم المخاطر', labelEn: 'Update Risk Assessment', bindingType: 'hybrid', icon: 'AlertCircle', linkedTab: 'risk' },
      ],
    },

    // ═══════════════════════════════════════════
    // 6. إدارة الحوادث (مع بروتوكول المواد الخطرة)
    // ═══════════════════════════════════════════
    {
      id: 'incident-flow',
      labelAr: 'إدارة الحوادث والطوارئ البيئية',
      labelEn: 'Incident & Environmental Emergency Management',
      descriptionAr: 'التعامل مع الحوادث والانسكابات والطوارئ البيئية أثناء النقل',
      descriptionEn: 'Handle incidents, spills, and environmental emergencies during transport',
      nodes: [
        { id: 'btn-report-incident', nodeType: 'trigger', labelAr: 'الإبلاغ عن حادث', labelEn: 'Report Incident', bindingType: 'internal', icon: 'Siren', linkedTab: 'ohs', linkedPath: '/dashboard/ohs' },
        { id: 'fn-assess-severity', nodeType: 'function', labelAr: 'تقييم خطورة الحادث', labelEn: 'Assess Incident Severity', bindingType: 'internal', icon: 'AlertTriangle', leadsTo: ['fn-decide-incident-action', 'fn-hazmat-check'] },
        // ✅ NEW: فحص المواد الخطرة
        { id: 'fn-hazmat-check', nodeType: 'function', labelAr: 'فحص تصنيف المواد الخطرة', labelEn: 'Hazardous Material Classification Check', bindingType: 'admin', icon: 'Biohazard', leadsTo: ['res-hazmat-spill', 'fn-decide-incident-action'] },
        { id: 'res-hazmat-spill', nodeType: 'result', labelAr: 'انسكاب مواد خطرة', labelEn: 'Hazardous Material Spill', bindingType: 'admin', icon: 'Skull', leadsTo: ['eff-hazmat-protocol'] },
        // ✅ NEW: بروتوكول الطوارئ البيئية
        { id: 'eff-hazmat-protocol', nodeType: 'effect', labelAr: 'تفعيل بروتوكول المواد الخطرة', labelEn: 'Activate Hazmat Emergency Protocol', bindingType: 'admin', icon: 'ShieldAlert', leadsTo: ['eff-notify-civil-defense', 'eff-notify-regulator', 'eff-dynamic-reroute'] },
        { id: 'eff-notify-civil-defense', nodeType: 'effect', labelAr: 'إبلاغ الدفاع المدني فوراً', labelEn: 'Alert Civil Defense Immediately', bindingType: 'admin', icon: 'Siren' },
        { id: 'eff-notify-regulator', nodeType: 'effect', labelAr: 'إبلاغ الجهة الرقابية', labelEn: 'Notify Regulatory Authority', bindingType: 'admin', icon: 'Building2', affects: ['compliance-chain'] },
        // ✅ NEW: إعادة التوجيه الديناميكي
        { id: 'eff-dynamic-reroute', nodeType: 'effect', labelAr: 'إعادة توجيه لأقرب منشأة معالجة', labelEn: 'Dynamic Reroute to Nearest Facility', bindingType: 'hybrid', icon: 'Navigation', linkedTab: 'tracking' },
        { id: 'fn-decide-incident-action', nodeType: 'function', labelAr: 'قرار المعالجة', labelEn: 'Decide Action', bindingType: 'internal', icon: 'GitBranch', leadsTo: ['res-reassign-driver', 'res-emergency-stop'] },
        { id: 'res-reassign-driver', nodeType: 'result', labelAr: 'إعادة تعيين سائق بديل', labelEn: 'Reassign Backup Driver', bindingType: 'internal', icon: 'UserPlus', leadsTo: ['eff-notify-parties', 'eff-resume-lifecycle'] },
        { id: 'res-emergency-stop', nodeType: 'result', labelAr: 'إيقاف طوارئ', labelEn: 'Emergency Stop', bindingType: 'hybrid', icon: 'OctagonX', leadsTo: ['eff-notify-parties', 'eff-ohs-report', 'eff-upload-incident-photos'] },
        { id: 'eff-resume-lifecycle', nodeType: 'effect', labelAr: 'استئناف دورة حياة الشحنة', labelEn: 'Resume Shipment Lifecycle', bindingType: 'hybrid', icon: 'ArrowRight', affects: ['shipment-lifecycle'] },
        { id: 'eff-notify-parties', nodeType: 'effect', labelAr: 'إشعار فوري للمولد والمدوّر', labelEn: 'Push Notify Generator & Recycler', bindingType: 'hybrid', icon: 'Bell' },
        { id: 'eff-upload-incident-photos', nodeType: 'effect', labelAr: 'رفع صور الحادث', labelEn: 'Upload Incident Photos', bindingType: 'internal', icon: 'Camera' },
        { id: 'eff-ohs-report', nodeType: 'effect', labelAr: 'تقرير السلامة المهنية', labelEn: 'OHS Incident Report', bindingType: 'admin', icon: 'FileWarning', linkedTab: 'ohs', affects: ['compliance-chain'] },
        { id: 'eff-fleet-damage', nodeType: 'effect', labelAr: 'تسجيل ضرر المركبة وفتح تذكرة صيانة', labelEn: 'Record Damage & Open Maintenance Ticket', bindingType: 'internal', icon: 'CarFront', linkedTab: 'fleet', leadsTo: ['eff-maintenance-ticket'] },
        { id: 'eff-maintenance-ticket', nodeType: 'effect', labelAr: 'تذكرة صيانة تلقائية', labelEn: 'Auto Maintenance Ticket', bindingType: 'internal', icon: 'Wrench', linkedPath: '/dashboard/preventive-maintenance' },
      ],
    },
  ],
};
