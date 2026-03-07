/**
 * Command Registries للجهات الإضافية:
 * المستشار، المكتب الاستشاري، السائق، الموظف، الرقابي، جهة ISO، مدير النظام
 */
import type { CommandDefinition, OrgCommandRegistry } from '@/types/commandTypes';

// ═══════════════════════════════════════════
// المستشار (Consultant)
// ═══════════════════════════════════════════
const CONSULTANT_COMMANDS: CommandDefinition[] = [
  {
    id: 'cmd-con-create-project',
    labelAr: 'إنشاء مشروع استشاري',
    labelEn: 'Create Consulting Project',
    icon: 'FolderPlus',
    bindingType: 'partner',
    orgTypes: ['consultant'],
    chainId: 'consulting-projects',
    nodeId: 'btn-create-project',
    requiredPermissions: ['manage_partners'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-con-audit', type: 'log_audit', labelAr: 'تسجيل المشروع', labelEn: 'Log project', autoExecute: true, priority: 1 },
      { id: 'imp-con-notify', type: 'send_notification', labelAr: 'إشعار العميل', labelEn: 'Notify client', autoExecute: true, priority: 2 },
    ],
    resourceType: 'project',
  },
  {
    id: 'cmd-con-submit-report',
    labelAr: 'تقديم تقرير استشاري',
    labelEn: 'Submit Consulting Report',
    icon: 'FileText',
    bindingType: 'hybrid',
    orgTypes: ['consultant'],
    chainId: 'consulting-projects',
    nodeId: 'fn-submit-report',
    requiredPermissions: ['create_reports'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-con-create-project', checkType: 'completed', blockMessageAr: 'يجب إنشاء المشروع أولاً', blockMessageEn: 'Project must be created first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-con-report-audit', type: 'log_audit', labelAr: 'تسجيل التقرير', labelEn: 'Log report', autoExecute: true, priority: 1 },
      { id: 'imp-con-report-notify', type: 'send_notification', labelAr: 'إشعار العميل بالتقرير', labelEn: 'Notify client of report', autoExecute: true, priority: 1 },
    ],
    resourceType: 'report',
  },
  {
    id: 'cmd-con-compliance-audit',
    labelAr: 'مراجعة امتثال للعميل',
    labelEn: 'Client Compliance Audit',
    icon: 'ShieldCheck',
    bindingType: 'admin',
    orgTypes: ['consultant'],
    chainId: 'consulting-projects',
    nodeId: 'fn-compliance-audit',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [],
    impacts: [
      { id: 'imp-con-audit-log', type: 'log_audit', labelAr: 'تسجيل المراجعة', labelEn: 'Log audit', autoExecute: true, priority: 1 },
      { id: 'imp-con-compliance', type: 'update_compliance', labelAr: 'تحديث الامتثال', labelEn: 'Update compliance', autoExecute: true, priority: 2 },
    ],
    resourceType: 'audit',
  },
];

// ═══════════════════════════════════════════
// المكتب الاستشاري (Consulting Office)
// ═══════════════════════════════════════════
const CONSULTING_OFFICE_COMMANDS: CommandDefinition[] = [
  {
    id: 'cmd-co-manage-clients',
    labelAr: 'إدارة العملاء',
    labelEn: 'Manage Clients',
    icon: 'Users',
    bindingType: 'partner',
    orgTypes: ['consulting_office'],
    chainId: 'office-operations',
    nodeId: 'btn-manage-clients',
    requiredPermissions: ['manage_partners'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-co-client-audit', type: 'log_audit', labelAr: 'تسجيل إدارة العميل', labelEn: 'Log client management', autoExecute: true, priority: 1 },
    ],
    resourceType: 'client',
  },
  {
    id: 'cmd-co-assign-consultant',
    labelAr: 'تعيين مستشار لمشروع',
    labelEn: 'Assign Consultant to Project',
    icon: 'UserPlus',
    bindingType: 'internal',
    orgTypes: ['consulting_office'],
    chainId: 'office-operations',
    nodeId: 'fn-assign-consultant',
    requiredPermissions: ['manage_drivers'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-co-manage-clients', checkType: 'exists', blockMessageAr: 'يجب إضافة العميل أولاً', blockMessageEn: 'Client must be added first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-co-assign-notify', type: 'send_notification', labelAr: 'إشعار المستشار', labelEn: 'Notify consultant', autoExecute: true, priority: 1 },
    ],
    resourceType: 'project',
  },
  {
    id: 'cmd-co-upload-delegation',
    labelAr: 'رفع تفويض قانوني',
    labelEn: 'Upload Legal Delegation',
    icon: 'Upload',
    bindingType: 'admin',
    orgTypes: ['consulting_office'],
    chainId: 'office-operations',
    nodeId: 'fn-upload-delegation',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-co-delegation-audit', type: 'log_audit', labelAr: 'تسجيل التفويض', labelEn: 'Log delegation', autoExecute: true, priority: 1 },
      { id: 'imp-co-compliance', type: 'update_compliance', labelAr: 'تحديث الامتثال', labelEn: 'Update compliance', autoExecute: true, priority: 2 },
    ],
    resourceType: 'document',
  },
];

// ═══════════════════════════════════════════
// السائق (Driver)
// ═══════════════════════════════════════════
const DRIVER_COMMANDS: CommandDefinition[] = [
  {
    id: 'cmd-drv-accept-task',
    labelAr: 'قبول مهمة نقل',
    labelEn: 'Accept Transport Task',
    icon: 'CheckSquare',
    bindingType: 'internal',
    orgTypes: ['driver'],
    chainId: 'driver-tasks',
    nodeId: 'btn-accept-task',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-drv-accept-audit', type: 'log_audit', labelAr: 'تسجيل قبول المهمة', labelEn: 'Log task acceptance', autoExecute: true, priority: 1 },
      { id: 'imp-drv-accept-notify', type: 'send_notification', labelAr: 'إشعار مدير العمليات', labelEn: 'Notify ops manager', autoExecute: true, priority: 2 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-drv-start-trip',
    labelAr: 'بدء الرحلة',
    labelEn: 'Start Trip',
    icon: 'Navigation',
    bindingType: 'internal',
    orgTypes: ['driver'],
    chainId: 'driver-tasks',
    nodeId: 'fn-start-trip',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-drv-accept-task', checkType: 'completed', blockMessageAr: 'يجب قبول المهمة أولاً', blockMessageEn: 'Task must be accepted first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-drv-gps-start', type: 'custom', labelAr: 'تفعيل التتبع GPS', labelEn: 'Activate GPS tracking', autoExecute: true, priority: 1 },
      { id: 'imp-drv-start-audit', type: 'log_audit', labelAr: 'تسجيل بداية الرحلة', labelEn: 'Log trip start', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-drv-confirm-pickup',
    labelAr: 'تأكيد الجمع',
    labelEn: 'Confirm Pickup',
    icon: 'Package',
    bindingType: 'partner',
    orgTypes: ['driver'],
    chainId: 'driver-tasks',
    nodeId: 'fn-confirm-pickup',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-drv-start-trip', checkType: 'completed', blockMessageAr: 'يجب بدء الرحلة أولاً', blockMessageEn: 'Trip must be started first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-drv-pickup-notify', type: 'send_notification', labelAr: 'إشعار المولد بالجمع', labelEn: 'Notify generator of pickup', autoExecute: true, priority: 1 },
      { id: 'imp-drv-custody', type: 'update_compliance', labelAr: 'بدء سلسلة الحفظ', labelEn: 'Start chain of custody', autoExecute: true, priority: 1 },
    ],
    resourceType: 'shipment',
  },
  {
    id: 'cmd-drv-confirm-delivery',
    labelAr: 'تأكيد التسليم',
    labelEn: 'Confirm Delivery',
    icon: 'CheckCircle',
    bindingType: 'partner',
    orgTypes: ['driver'],
    chainId: 'driver-tasks',
    nodeId: 'fn-confirm-delivery',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-drv-confirm-pickup', checkType: 'completed', blockMessageAr: 'يجب تأكيد الجمع أولاً', blockMessageEn: 'Pickup must be confirmed first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-drv-delivery-notify', type: 'send_notification', labelAr: 'إشعار المدور بالتسليم', labelEn: 'Notify recycler of delivery', autoExecute: true, priority: 1 },
      { id: 'imp-drv-delivery-audit', type: 'log_audit', labelAr: 'تسجيل التسليم', labelEn: 'Log delivery', autoExecute: true, priority: 1 },
      { id: 'imp-drv-kpi', type: 'update_kpi', labelAr: 'تحديث أداء السائق', labelEn: 'Update driver performance', autoExecute: true, priority: 2 },
      { id: 'imp-drv-carbon', type: 'recalculate_esg', labelAr: 'احتساب البصمة الكربونية', labelEn: 'Calculate carbon footprint', autoExecute: true, priority: 3 },
    ],
    resourceType: 'shipment',
  },
];

// ═══════════════════════════════════════════
// الموظف (Employee) — أوامر عامة مشتركة
// ═══════════════════════════════════════════
const EMPLOYEE_COMMANDS: CommandDefinition[] = [
  {
    id: 'cmd-emp-clock-in',
    labelAr: 'تسجيل حضور',
    labelEn: 'Clock In',
    icon: 'LogIn',
    bindingType: 'internal',
    orgTypes: ['employee'],
    chainId: 'employee-daily',
    nodeId: 'btn-clock-in',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-emp-clock-audit', type: 'log_audit', labelAr: 'تسجيل الحضور', labelEn: 'Log clock-in', autoExecute: true, priority: 1 },
    ],
    resourceType: 'attendance',
  },
  {
    id: 'cmd-emp-submit-task',
    labelAr: 'تسليم مهمة',
    labelEn: 'Submit Task',
    icon: 'CheckSquare',
    bindingType: 'internal',
    orgTypes: ['employee'],
    chainId: 'employee-daily',
    nodeId: 'fn-submit-task',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-emp-task-audit', type: 'log_audit', labelAr: 'تسجيل تسليم المهمة', labelEn: 'Log task submission', autoExecute: true, priority: 1 },
      { id: 'imp-emp-task-notify', type: 'send_notification', labelAr: 'إشعار المدير', labelEn: 'Notify manager', autoExecute: true, priority: 2 },
      { id: 'imp-emp-kpi', type: 'update_kpi', labelAr: 'تحديث الأداء', labelEn: 'Update performance', autoExecute: true, priority: 3 },
    ],
    resourceType: 'task',
  },
  {
    id: 'cmd-emp-request-leave',
    labelAr: 'طلب إجازة',
    labelEn: 'Request Leave',
    icon: 'Calendar',
    bindingType: 'internal',
    orgTypes: ['employee'],
    chainId: 'employee-daily',
    nodeId: 'fn-request-leave',
    requiredPermissions: ['view_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-emp-leave-audit', type: 'log_audit', labelAr: 'تسجيل طلب الإجازة', labelEn: 'Log leave request', autoExecute: true, priority: 1 },
      { id: 'imp-emp-leave-notify', type: 'send_notification', labelAr: 'إشعار المدير', labelEn: 'Notify manager', autoExecute: true, priority: 1 },
    ],
    resourceType: 'leave_request',
  },
];

// ═══════════════════════════════════════════
// الجهة الرقابية (Regulator)
// ═══════════════════════════════════════════
const REGULATOR_COMMANDS: CommandDefinition[] = [
  {
    id: 'cmd-reg-review-org',
    labelAr: 'مراجعة منظمة',
    labelEn: 'Review Organization',
    icon: 'Search',
    bindingType: 'admin',
    orgTypes: ['regulator'],
    chainId: 'regulatory-oversight',
    nodeId: 'btn-review-org',
    requiredPermissions: ['view_reports'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-reg-review-audit', type: 'log_audit', labelAr: 'تسجيل المراجعة', labelEn: 'Log review', autoExecute: true, priority: 1 },
    ],
    resourceType: 'organization',
  },
  {
    id: 'cmd-reg-issue-violation',
    labelAr: 'إصدار مخالفة',
    labelEn: 'Issue Violation',
    icon: 'AlertTriangle',
    bindingType: 'admin',
    orgTypes: ['regulator'],
    chainId: 'regulatory-oversight',
    nodeId: 'fn-issue-violation',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [
      { commandId: 'cmd-reg-review-org', checkType: 'completed', blockMessageAr: 'يجب مراجعة المنظمة أولاً', blockMessageEn: 'Organization must be reviewed first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-reg-violation-notify', type: 'send_notification', labelAr: 'إشعار المنظمة', labelEn: 'Notify organization', autoExecute: true, priority: 1 },
      { id: 'imp-reg-violation-audit', type: 'log_audit', labelAr: 'تسجيل المخالفة', labelEn: 'Log violation', autoExecute: true, priority: 1 },
      { id: 'imp-reg-compliance', type: 'update_compliance', labelAr: 'تحديث الامتثال', labelEn: 'Update compliance', autoExecute: true, priority: 2 },
    ],
    resourceType: 'violation',
  },
  {
    id: 'cmd-reg-approve-license',
    labelAr: 'اعتماد ترخيص',
    labelEn: 'Approve License',
    icon: 'BadgeCheck',
    bindingType: 'admin',
    orgTypes: ['regulator'],
    chainId: 'regulatory-oversight',
    nodeId: 'fn-approve-license',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [],
    impacts: [
      { id: 'imp-reg-license-notify', type: 'send_notification', labelAr: 'إشعار المنظمة', labelEn: 'Notify organization', autoExecute: true, priority: 1 },
      { id: 'imp-reg-license-audit', type: 'log_audit', labelAr: 'تسجيل الاعتماد', labelEn: 'Log approval', autoExecute: true, priority: 1 },
    ],
    resourceType: 'license',
  },
];

// ═══════════════════════════════════════════
// مدير النظام (Admin)
// ═══════════════════════════════════════════
const ADMIN_COMMANDS: CommandDefinition[] = [
  {
    id: 'cmd-adm-approve-org',
    labelAr: 'اعتماد منظمة جديدة',
    labelEn: 'Approve New Organization',
    icon: 'CheckCircle',
    bindingType: 'admin',
    orgTypes: ['admin'],
    chainId: 'admin-management',
    nodeId: 'btn-approve-org',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-adm-approve-notify', type: 'send_notification', labelAr: 'إشعار المنظمة', labelEn: 'Notify organization', autoExecute: true, priority: 1 },
      { id: 'imp-adm-approve-audit', type: 'log_audit', labelAr: 'تسجيل الاعتماد', labelEn: 'Log approval', autoExecute: true, priority: 1 },
    ],
    resourceType: 'organization',
  },
  {
    id: 'cmd-adm-review-request',
    labelAr: 'مراجعة طلب',
    labelEn: 'Review Request',
    icon: 'Eye',
    bindingType: 'admin',
    orgTypes: ['admin'],
    chainId: 'admin-management',
    nodeId: 'fn-review-request',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-adm-review-audit', type: 'log_audit', labelAr: 'تسجيل المراجعة', labelEn: 'Log review', autoExecute: true, priority: 1 },
    ],
    resourceType: 'approval_request',
  },
  {
    id: 'cmd-adm-manage-ads',
    labelAr: 'إدارة الإعلانات',
    labelEn: 'Manage Advertisements',
    icon: 'Megaphone',
    bindingType: 'admin',
    orgTypes: ['admin'],
    chainId: 'admin-management',
    nodeId: 'fn-manage-ads',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-adm-ads-audit', type: 'log_audit', labelAr: 'تسجيل إدارة الإعلانات', labelEn: 'Log ad management', autoExecute: true, priority: 1 },
    ],
    resourceType: 'advertisement',
  },
  {
    id: 'cmd-adm-system-config',
    labelAr: 'تعديل إعدادات النظام',
    labelEn: 'Update System Configuration',
    icon: 'Settings',
    bindingType: 'admin',
    orgTypes: ['admin'],
    chainId: 'admin-management',
    nodeId: 'fn-system-config',
    requiredPermissions: ['manage_settings'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-adm-config-audit', type: 'log_audit', labelAr: 'تسجيل تعديل الإعدادات', labelEn: 'Log config change', autoExecute: true, priority: 1 },
    ],
    resourceType: 'system',
  },
];

// ═══════════════════════════════════════════
// تصدير السجلات
// ═══════════════════════════════════════════
export const CONSULTANT_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'consultant',
  commands: CONSULTANT_COMMANDS,
};

export const CONSULTING_OFFICE_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'consulting_office',
  commands: CONSULTING_OFFICE_COMMANDS,
};

export const DRIVER_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'driver',
  commands: DRIVER_COMMANDS,
};

export const EMPLOYEE_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'employee',
  commands: EMPLOYEE_COMMANDS,
};

export const REGULATOR_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'regulator',
  commands: REGULATOR_COMMANDS,
};

export const ADMIN_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'admin',
  commands: ADMIN_COMMANDS,
};
