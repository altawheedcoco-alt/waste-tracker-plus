/**
 * Command Registry للمدوّر (Recycler)
 * من استقبال المخلفات حتى إنتاج المواد المعاد تدويرها
 */
import type { CommandDefinition, OrgCommandRegistry } from '@/types/commandTypes';

const RECYCLER_COMMANDS: CommandDefinition[] = [
  // ═══════════════════════════════════════════
  // 1. استقبال ومعالجة المخلفات
  // ═══════════════════════════════════════════
  {
    id: 'cmd-rec-receive',
    labelAr: 'استلام شحنة واردة',
    labelEn: 'Receive Inbound Shipment',
    icon: 'Package',
    bindingType: 'partner',
    orgTypes: ['recycler'],
    chainId: 'inbound-processing',
    nodeId: 'btn-receive',
    path: '/dashboard/shipments',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-rec-audit-receive', type: 'log_audit', labelAr: 'تسجيل الاستلام', labelEn: 'Log receipt', autoExecute: true, priority: 1 },
      { id: 'imp-rec-notify-gen', type: 'send_notification', labelAr: 'إشعار المولد بالاستلام', labelEn: 'Notify generator', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-rec-inspect',
    labelAr: 'فحص الجودة',
    labelEn: 'Quality Inspection',
    icon: 'Search',
    bindingType: 'internal',
    orgTypes: ['recycler'],
    chainId: 'inbound-processing',
    nodeId: 'fn-inspect',
    tab: 'quality',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-rec-receive', checkType: 'completed', blockMessageAr: 'يجب استلام الشحنة أولاً', blockMessageEn: 'Shipment must be received first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-rec-quality-log', type: 'log_audit', labelAr: 'تسجيل فحص الجودة', labelEn: 'Log quality inspection', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-rec-accept-reject',
    labelAr: 'قبول أو رفض الشحنة',
    labelEn: 'Accept or Reject Shipment',
    icon: 'CheckSquare',
    bindingType: 'partner',
    orgTypes: ['recycler'],
    chainId: 'inbound-processing',
    nodeId: 'fn-accept-reject',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-rec-inspect', checkType: 'completed', blockMessageAr: 'يجب فحص الجودة أولاً', blockMessageEn: 'Quality inspection required', allowBypass: true },
    ],
    impacts: [
      { id: 'imp-rec-accept-notify', type: 'send_notification', labelAr: 'إشعار الناقل بالنتيجة', labelEn: 'Notify transporter', autoExecute: true, priority: 1 },
      { id: 'imp-rec-accept-audit', type: 'log_audit', labelAr: 'تسجيل القرار', labelEn: 'Log decision', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-rec-process',
    labelAr: 'تشغيل خط الإنتاج',
    labelEn: 'Run Production Line',
    icon: 'Factory',
    bindingType: 'internal',
    orgTypes: ['recycler'],
    chainId: 'inbound-processing',
    nodeId: 'fn-process',
    tab: 'production',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-rec-accept-reject', checkType: 'completed', blockMessageAr: 'يجب قبول الشحنة أولاً', blockMessageEn: 'Shipment must be accepted first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-rec-production-kpi', type: 'update_kpi', labelAr: 'تحديث مؤشرات الإنتاج', labelEn: 'Update production KPIs', autoExecute: true, priority: 1 },
      { id: 'imp-rec-cost-calc', type: 'update_ledger', labelAr: 'حساب تكلفة الإنتاج', labelEn: 'Calculate production cost', autoExecute: true, priority: 2 },
    ],
    resourceType: 'production_batch',
  },
  {
    id: 'cmd-rec-issue-cert',
    labelAr: 'إصدار شهادة تدوير',
    labelEn: 'Issue Recycling Certificate',
    icon: 'Award',
    bindingType: 'hybrid',
    orgTypes: ['recycler'],
    chainId: 'inbound-processing',
    nodeId: 'eff-cert',
    path: '/dashboard/issue-recycling-certificates',
    requiredPermissions: ['manage_shipments', 'create_reports'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-rec-process', checkType: 'completed', blockMessageAr: 'يجب إتمام المعالجة أولاً', blockMessageEn: 'Processing must be completed', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-rec-cert-notify', type: 'send_notification', labelAr: 'إشعار المولد بالشهادة', labelEn: 'Notify generator of certificate', autoExecute: true, priority: 1 },
      { id: 'imp-rec-trace', type: 'update_compliance', labelAr: 'تحديث التتبع', labelEn: 'Update traceability', autoExecute: true, priority: 1 },
      { id: 'imp-rec-esg', type: 'recalculate_esg', labelAr: 'تحديث مؤشرات ESG', labelEn: 'Update ESG metrics', autoExecute: true, priority: 2 },
    ],
    resourceType: 'certificate',
  },
  {
    id: 'cmd-rec-list-marketplace',
    labelAr: 'عرض في البورصة',
    labelEn: 'List on Marketplace',
    icon: 'Store',
    bindingType: 'partner',
    orgTypes: ['recycler'],
    chainId: 'inbound-processing',
    nodeId: 'eff-market',
    tab: 'market',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-rec-process', checkType: 'completed', blockMessageAr: 'يجب إتمام الإنتاج أولاً', blockMessageEn: 'Production must be completed', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-rec-market-audit', type: 'log_audit', labelAr: 'تسجيل العرض', labelEn: 'Log listing', autoExecute: true, priority: 1 },
    ],
    resourceType: 'marketplace_listing',
  },

  // ═══════════════════════════════════════════
  // 2. تحسين الإنتاج
  // ═══════════════════════════════════════════
  {
    id: 'cmd-rec-monitor-equipment',
    labelAr: 'مراقبة المعدات',
    labelEn: 'Monitor Equipment',
    icon: 'Activity',
    bindingType: 'internal',
    orgTypes: ['recycler'],
    chainId: 'production-optimization',
    nodeId: 'fn-monitor',
    tab: 'equipment',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-rec-equip-kpi', type: 'update_kpi', labelAr: 'تحديث مؤشرات المعدات', labelEn: 'Update equipment KPIs', autoExecute: true, priority: 1 },
    ],
    resourceType: 'equipment',
  },
  {
    id: 'cmd-rec-predictive-maint',
    labelAr: 'صيانة تنبؤية',
    labelEn: 'Predictive Maintenance',
    icon: 'Wrench',
    bindingType: 'internal',
    orgTypes: ['recycler'],
    chainId: 'production-optimization',
    nodeId: 'fn-predict',
    tab: 'predictive',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-rec-monitor-equipment', checkType: 'exists', blockMessageAr: 'يجب مراقبة المعدات أولاً', blockMessageEn: 'Equipment must be monitored first', allowBypass: true },
    ],
    impacts: [
      { id: 'imp-rec-maint-schedule', type: 'custom', labelAr: 'تحديث جدول الصيانة', labelEn: 'Update maintenance schedule', autoExecute: true, priority: 1 },
      { id: 'imp-rec-cost-save', type: 'update_kpi', labelAr: 'تقدير التوفير', labelEn: 'Estimate savings', autoExecute: true, priority: 2 },
    ],
    resourceType: 'maintenance',
  },

  // ═══════════════════════════════════════════
  // 3. الامتثال البيئي ESG
  // ═══════════════════════════════════════════
  {
    id: 'cmd-rec-esg-report',
    labelAr: 'إنشاء تقرير ESG',
    labelEn: 'Generate ESG Report',
    icon: 'Leaf',
    bindingType: 'admin',
    orgTypes: ['recycler'],
    chainId: 'esg-compliance',
    nodeId: 'btn-esg',
    tab: 'esg',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [],
    impacts: [
      { id: 'imp-rec-esg-audit', type: 'log_audit', labelAr: 'تسجيل التقرير', labelEn: 'Log report', autoExecute: true, priority: 1 },
      { id: 'imp-rec-wmis', type: 'update_compliance', labelAr: 'تحديث WMIS', labelEn: 'Update WMIS', autoExecute: true, priority: 2 },
    ],
    resourceType: 'report',
  },
];

export const RECYCLER_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'recycler',
  commands: RECYCLER_COMMANDS,
};
