/**
 * Command Registry للمولد (Generator)
 * سجل مركزي لكل أمر تشغيلي مع النطاق والصلاحيات والتبعيات والآثار
 */
import type { CommandDefinition, OrgCommandRegistry } from '@/types/commandTypes';

const GENERATOR_COMMANDS: CommandDefinition[] = [
  // ═══════════════════════════════════════════
  // 1. إرسال المخلفات (Waste Dispatch)
  // ═══════════════════════════════════════════
  {
    id: 'cmd-gen-create-shipment',
    labelAr: 'إنشاء شحنة جديدة',
    labelEn: 'Create New Shipment',
    descriptionAr: 'إنشاء شحنة لنقل المخلفات للناقل أو المدور',
    icon: 'Plus',
    bindingType: 'hybrid',
    orgTypes: ['generator'],
    chainId: 'waste-dispatch',
    nodeId: 'btn-new-shipment',
    path: '/dashboard/shipments/new',
    requiredPermissions: ['create_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-gen-audit-create', type: 'log_audit', labelAr: 'تسجيل إنشاء الشحنة', labelEn: 'Log shipment creation', autoExecute: true, priority: 1 },
      { id: 'imp-gen-notify-partner', type: 'send_notification', labelAr: 'إشعار الناقل/المدور', labelEn: 'Notify transporter/recycler', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-gen-classify-waste',
    labelAr: 'تصنيف المخلفات',
    labelEn: 'Classify Waste',
    icon: 'Tags',
    bindingType: 'internal',
    orgTypes: ['generator'],
    chainId: 'waste-dispatch',
    nodeId: 'fn-classify-waste',
    requiredPermissions: ['create_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-gen-create-shipment', checkType: 'completed', blockMessageAr: 'يجب إنشاء الشحنة أولاً', blockMessageEn: 'Shipment must be created first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-gen-classify-audit', type: 'log_audit', labelAr: 'تسجيل التصنيف', labelEn: 'Log classification', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-gen-select-partner',
    labelAr: 'اختيار الناقل/المدور',
    labelEn: 'Select Transporter/Recycler',
    icon: 'Users',
    bindingType: 'partner',
    orgTypes: ['generator'],
    chainId: 'waste-dispatch',
    nodeId: 'fn-select-partner',
    requiredPermissions: ['manage_shipments', 'view_partners'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-gen-classify-waste', checkType: 'completed', blockMessageAr: 'يجب تصنيف المخلفات أولاً', blockMessageEn: 'Waste must be classified first', allowBypass: true },
    ],
    impacts: [
      { id: 'imp-gen-partner-notify', type: 'send_notification', labelAr: 'إشعار الشريك', labelEn: 'Notify partner', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-gen-schedule-pickup',
    labelAr: 'جدولة الجمع',
    labelEn: 'Schedule Pickup',
    icon: 'Calendar',
    bindingType: 'hybrid',
    orgTypes: ['generator'],
    chainId: 'waste-dispatch',
    nodeId: 'fn-schedule-pickup',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-gen-select-partner', checkType: 'completed', blockMessageAr: 'يجب اختيار الناقل أولاً', blockMessageEn: 'Transporter must be selected first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-gen-calendar', type: 'custom', labelAr: 'تحديث التقويم', labelEn: 'Update calendar', autoExecute: true, priority: 1 },
      { id: 'imp-gen-notify-schedule', type: 'send_notification', labelAr: 'إشعار بالموعد', labelEn: 'Notify schedule', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },

  // ═══════════════════════════════════════════
  // 2. أوامر الشغل (Work Orders)
  // ═══════════════════════════════════════════
  {
    id: 'cmd-gen-create-wo',
    labelAr: 'إنشاء أمر شغل',
    labelEn: 'Create Work Order',
    icon: 'ClipboardList',
    bindingType: 'partner',
    orgTypes: ['generator'],
    chainId: 'work-order-flow',
    nodeId: 'btn-create-wo',
    requiredPermissions: ['create_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-gen-wo-audit', type: 'log_audit', labelAr: 'تسجيل أمر الشغل', labelEn: 'Log work order', autoExecute: true, priority: 1 },
      { id: 'imp-gen-wo-notify', type: 'send_notification', labelAr: 'إشعار الشريك', labelEn: 'Notify partner', autoExecute: true, priority: 1 },
    ],
    resourceType: 'work_order',
  },
  {
    id: 'cmd-gen-approve-wo',
    labelAr: 'اعتماد أمر شغل',
    labelEn: 'Approve Work Order',
    icon: 'CheckSquare',
    bindingType: 'partner',
    orgTypes: ['generator'],
    chainId: 'work-order-flow',
    nodeId: 'res-wo-accepted',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-gen-create-wo', checkType: 'completed', blockMessageAr: 'يجب إنشاء أمر الشغل أولاً', blockMessageEn: 'Work order must be created first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-gen-wo-auto-ship', type: 'trigger_chain', labelAr: 'إنشاء شحنة تلقائية', labelEn: 'Auto-create shipment', autoExecute: true, priority: 1 },
    ],
    resourceType: 'work_order',
  },

  // ═══════════════════════════════════════════
  // 3. الامتثال
  // ═══════════════════════════════════════════
  {
    id: 'cmd-gen-compliance-report',
    labelAr: 'إنشاء تقرير امتثال',
    labelEn: 'Generate Compliance Report',
    icon: 'Shield',
    bindingType: 'admin',
    orgTypes: ['generator'],
    chainId: 'compliance-reporting',
    nodeId: 'btn-compliance',
    tab: 'compliance',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [],
    impacts: [
      { id: 'imp-gen-compliance-audit', type: 'log_audit', labelAr: 'تسجيل إنشاء التقرير', labelEn: 'Log report creation', autoExecute: true, priority: 1 },
      { id: 'imp-gen-renewal-alert', type: 'send_notification', labelAr: 'تنبيه التجديد', labelEn: 'Renewal alert', autoExecute: true, priority: 2 },
    ],
    resourceType: 'report',
  },
];

export const GENERATOR_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'generator',
  commands: GENERATOR_COMMANDS,
};
