/**
 * Command Registry للناقل
 * سجل مركزي لكل أمر تشغيلي مع النطاق والصلاحيات والتبعيات والآثار
 */
import type { CommandDefinition, OrgCommandRegistry } from '@/types/commandTypes';

const TRANSPORTER_COMMANDS: CommandDefinition[] = [
  // ═══════════════════════════════════════════
  // 1. دورة حياة الشحنة
  // ═══════════════════════════════════════════
  {
    id: 'cmd-create-shipment',
    labelAr: 'إنشاء شحنة',
    labelEn: 'Create Shipment',
    descriptionAr: 'إنشاء شحنة جديدة لنقل مخلفات',
    icon: 'Plus',
    bindingType: 'hybrid',
    orgTypes: ['transporter'],
    chainId: 'shipment-lifecycle',
    nodeId: 'btn-create-shipment',
    path: '/dashboard/shipments/new',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-audit-create', type: 'log_audit', labelAr: 'تسجيل إنشاء الشحنة', labelEn: 'Log shipment creation', autoExecute: true, priority: 1 },
      { id: 'imp-notify-ops', type: 'send_notification', labelAr: 'إشعار مدير العمليات', labelEn: 'Notify ops manager', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-assign-driver',
    labelAr: 'تعيين سائق للشحنة',
    labelEn: 'Assign Driver to Shipment',
    icon: 'UserPlus',
    bindingType: 'internal',
    orgTypes: ['transporter'],
    chainId: 'shipment-lifecycle',
    nodeId: 'fn-assign-driver',
    requiredPermissions: ['manage_shipments', 'manage_drivers'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-create-shipment',
        checkType: 'completed',
        blockMessageAr: 'يجب إنشاء الشحنة أولاً',
        blockMessageEn: 'Shipment must be created first',
        allowBypass: false,
      },
    ],
    impacts: [
      { id: 'imp-driver-schedule', type: 'update_inventory', labelAr: 'تحديث جدول السائق', labelEn: 'Update driver schedule', autoExecute: true, priority: 1 },
      { id: 'imp-notify-driver', type: 'send_notification', labelAr: 'إشعار السائق', labelEn: 'Notify driver', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-optimize-route',
    labelAr: 'تحسين المسار',
    labelEn: 'Optimize Route',
    icon: 'MapPin',
    bindingType: 'internal',
    orgTypes: ['transporter'],
    chainId: 'shipment-lifecycle',
    nodeId: 'fn-route-optimize',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-assign-driver',
        checkType: 'completed',
        blockMessageAr: 'يجب تعيين سائق أولاً',
        blockMessageEn: 'Driver must be assigned first',
        allowBypass: true,
      },
    ],
    impacts: [
      { id: 'imp-pricing', type: 'update_ledger', labelAr: 'تحديث التسعير', labelEn: 'Update pricing', autoExecute: true, priority: 1 },
      { id: 'imp-fuel-est', type: 'update_kpi', labelAr: 'تقدير الوقود', labelEn: 'Estimate fuel', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-pickup',
    labelAr: 'جمع من المولد',
    labelEn: 'Pickup from Generator',
    icon: 'Package',
    bindingType: 'partner',
    orgTypes: ['transporter'],
    chainId: 'shipment-lifecycle',
    nodeId: 'fn-pickup',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-assign-driver',
        checkType: 'completed',
        blockMessageAr: 'يجب تعيين السائق أولاً',
        blockMessageEn: 'Driver must be assigned first',
        allowBypass: false,
      },
    ],
    impacts: [
      { id: 'imp-geofence-log', type: 'log_audit', labelAr: 'تسجيل دخول الجيوفنس', labelEn: 'Log geofence entry', autoExecute: true, priority: 1 },
      { id: 'imp-custody-start', type: 'update_compliance', labelAr: 'بدء سلسلة الحفظ', labelEn: 'Start chain of custody', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-weigh-shipment',
    labelAr: 'وزن الشحنة',
    labelEn: 'Weigh Shipment',
    icon: 'Scale',
    bindingType: 'hybrid',
    orgTypes: ['transporter'],
    chainId: 'shipment-lifecycle',
    nodeId: 'fn-weigh',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-pickup',
        checkType: 'completed',
        blockMessageAr: 'يجب جمع الشحنة من المولد أولاً',
        blockMessageEn: 'Must pick up from generator first',
        allowBypass: true,
      },
    ],
    impacts: [
      { id: 'imp-weight-kpi', type: 'update_kpi', labelAr: 'تحديث مؤشر الأوزان', labelEn: 'Update weight KPI', autoExecute: true, priority: 1 },
      { id: 'imp-fraud-check', type: 'custom', labelAr: 'فحص تلاعب الأوزان', labelEn: 'Weight fraud check', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-deliver',
    labelAr: 'تسليم للمدوّر',
    labelEn: 'Deliver to Recycler',
    icon: 'Truck',
    bindingType: 'partner',
    orgTypes: ['transporter'],
    chainId: 'shipment-lifecycle',
    nodeId: 'fn-deliver',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-weigh-shipment',
        checkType: 'completed',
        blockMessageAr: 'يجب وزن الشحنة أولاً',
        blockMessageEn: 'Shipment must be weighed first',
        allowBypass: true,
      },
    ],
    impacts: [
      { id: 'imp-ledger-update', type: 'update_ledger', labelAr: 'تحديث دفتر الحسابات', labelEn: 'Update ledger', autoExecute: true, priority: 1 },
      { id: 'imp-custody-update', type: 'update_compliance', labelAr: 'تحديث سلسلة الحفظ', labelEn: 'Update chain of custody', autoExecute: true, priority: 1 },
      { id: 'imp-carbon-calc', type: 'recalculate_esg', labelAr: 'احتساب البصمة الكربونية', labelEn: 'Calculate carbon footprint', autoExecute: true, priority: 2 },
      { id: 'imp-compliance-feed', type: 'update_compliance', labelAr: 'تغذية بيانات الامتثال', labelEn: 'Feed compliance data', autoExecute: true, priority: 3 },
    ],
    resourceType: 'shipment',
  },

  // ═══════════════════════════════════════════
  // 2. طلبات الجمع
  // ═══════════════════════════════════════════
  {
    id: 'cmd-accept-collection',
    labelAr: 'قبول طلب جمع',
    labelEn: 'Accept Collection Request',
    icon: 'CheckSquare',
    bindingType: 'partner',
    orgTypes: ['transporter'],
    chainId: 'collection-request-flow',
    nodeId: 'btn-accept-request',
    path: '/dashboard/collection-requests',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-notify-gen', type: 'send_notification', labelAr: 'إشعار المولد بالقبول', labelEn: 'Notify generator of acceptance', autoExecute: true, priority: 1 },
      { id: 'imp-auto-shipment', type: 'trigger_chain', labelAr: 'إنشاء شحنة تلقائياً', labelEn: 'Auto-create shipment', autoExecute: true, priority: 1 },
      { id: 'imp-calendar', type: 'custom', labelAr: 'تحديث التقويم', labelEn: 'Update calendar', autoExecute: true, priority: 2 },
    ],
    resourceType: 'collection_request',
  },

  // ═══════════════════════════════════════════
  // 3. إدارة السائقين
  // ═══════════════════════════════════════════
  {
    id: 'cmd-register-driver',
    labelAr: 'تسجيل سائق جديد',
    labelEn: 'Register New Driver',
    icon: 'UserPlus',
    bindingType: 'internal',
    orgTypes: ['transporter'],
    chainId: 'driver-management',
    nodeId: 'btn-add-driver',
    path: '/dashboard/transporter-drivers',
    requiredPermissions: ['manage_drivers'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-audit-driver', type: 'log_audit', labelAr: 'تسجيل إضافة سائق', labelEn: 'Log driver addition', autoExecute: true, priority: 1 },
    ],
    resourceType: 'driver',
  },
  {
    id: 'cmd-verify-permit',
    labelAr: 'فحص تصاريح السائق',
    labelEn: 'Verify Driver Permits',
    icon: 'Shield',
    bindingType: 'admin',
    orgTypes: ['transporter'],
    chainId: 'driver-management',
    nodeId: 'fn-permit-check',
    requiredPermissions: ['manage_drivers', 'view_reports'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-register-driver',
        checkType: 'completed',
        blockMessageAr: 'يجب تسجيل السائق أولاً',
        blockMessageEn: 'Driver must be registered first',
        allowBypass: false,
      },
    ],
    impacts: [
      { id: 'imp-compliance-flag', type: 'update_compliance', labelAr: 'تحديث حالة الامتثال', labelEn: 'Update compliance status', autoExecute: true, priority: 1 },
    ],
    resourceType: 'driver',
  },

  // ═══════════════════════════════════════════
  // 4. المرفوضات
  // ═══════════════════════════════════════════
  {
    id: 'cmd-handle-rejection',
    labelAr: 'معالجة شحنة مرفوضة',
    labelEn: 'Handle Rejected Shipment',
    icon: 'AlertTriangle',
    bindingType: 'partner',
    orgTypes: ['transporter'],
    chainId: 'rejection-flow',
    nodeId: 'btn-rejection-received',
    path: '/dashboard/rejected-shipments',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-fraud-flag', type: 'custom', labelAr: 'تنبيه كشف التلاعب', labelEn: 'Fraud detection flag', autoExecute: true, priority: 1 },
      { id: 'imp-sla-impact', type: 'update_kpi', labelAr: 'تحديث مؤشر SLA', labelEn: 'Update SLA metric', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-redirect-shipment',
    labelAr: 'إعادة توجيه لمدوّر آخر',
    labelEn: 'Redirect to Another Recycler',
    icon: 'RotateCw',
    bindingType: 'partner',
    orgTypes: ['transporter'],
    chainId: 'rejection-flow',
    nodeId: 'res-redirect',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      {
        commandId: 'cmd-handle-rejection',
        checkType: 'completed',
        blockMessageAr: 'يجب تقييم الرفض أولاً',
        blockMessageEn: 'Rejection must be assessed first',
        allowBypass: false,
      },
    ],
    impacts: [
      { id: 'imp-new-shipment', type: 'trigger_chain', labelAr: 'إنشاء شحنة بديلة', labelEn: 'Create replacement shipment', autoExecute: true, priority: 1 },
      { id: 'imp-notify-recycler', type: 'send_notification', labelAr: 'إشعار المدوّر الجديد', labelEn: 'Notify new recycler', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },

  // ═══════════════════════════════════════════
  // 5. الامتثال
  // ═══════════════════════════════════════════
  {
    id: 'cmd-generate-compliance-report',
    labelAr: 'إنشاء تقرير امتثال',
    labelEn: 'Generate Compliance Report',
    icon: 'FileText',
    bindingType: 'admin',
    orgTypes: ['transporter'],
    chainId: 'compliance-chain',
    nodeId: 'btn-generate-report',
    tab: 'compliance',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [],
    impacts: [
      { id: 'imp-esg-calc', type: 'recalculate_esg', labelAr: 'حساب مؤشرات ESG', labelEn: 'Calculate ESG metrics', autoExecute: true, priority: 1 },
      { id: 'imp-wmis-update', type: 'update_compliance', labelAr: 'تحديث WMIS', labelEn: 'Update WMIS', autoExecute: true, priority: 2 },
    ],
    resourceType: 'report',
  },
];

export const TRANSPORTER_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'transporter',
  commands: TRANSPORTER_COMMANDS,
};
