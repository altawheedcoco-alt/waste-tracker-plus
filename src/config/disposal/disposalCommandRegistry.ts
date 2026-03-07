/**
 * Command Registry للتخلص النهائي (Disposal)
 * من استقبال المخلفات حتى التخلص النهائي وإصدار الشهادات
 */
import type { CommandDefinition, OrgCommandRegistry } from '@/types/commandTypes';

const DISPOSAL_COMMANDS: CommandDefinition[] = [
  // ═══════════════════════════════════════════
  // 1. استقبال ومعالجة نهائية
  // ═══════════════════════════════════════════
  {
    id: 'cmd-disp-incoming',
    labelAr: 'استقبال طلب وارد',
    labelEn: 'Receive Incoming Request',
    icon: 'Inbox',
    bindingType: 'partner',
    orgTypes: ['disposal'],
    chainId: 'incoming-disposal',
    nodeId: 'btn-incoming',
    path: '/dashboard/disposal/incoming-requests',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-disp-audit-incoming', type: 'log_audit', labelAr: 'تسجيل الطلب', labelEn: 'Log request', autoExecute: true, priority: 1 },
      { id: 'imp-disp-notify-partner', type: 'send_notification', labelAr: 'إشعار الشريك', labelEn: 'Notify partner', autoExecute: true, priority: 2 },
    ],
    resourceType: 'disposal_request',
  },
  {
    id: 'cmd-disp-capacity-check',
    labelAr: 'فحص السعة الاستيعابية',
    labelEn: 'Check Facility Capacity',
    icon: 'Gauge',
    bindingType: 'internal',
    orgTypes: ['disposal'],
    chainId: 'incoming-disposal',
    nodeId: 'fn-capacity-check',
    path: '/dashboard/capacity-management',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-disp-incoming', checkType: 'completed', blockMessageAr: 'يجب استقبال الطلب أولاً', blockMessageEn: 'Request must be received first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-disp-capacity-kpi', type: 'update_kpi', labelAr: 'تحديث مؤشر السعة', labelEn: 'Update capacity KPI', autoExecute: true, priority: 1 },
    ],
    resourceType: 'disposal_request',
  },
  {
    id: 'cmd-disp-accept-reject',
    labelAr: 'قبول أو رفض الطلب',
    labelEn: 'Accept or Reject Request',
    icon: 'CheckSquare',
    bindingType: 'partner',
    orgTypes: ['disposal'],
    chainId: 'incoming-disposal',
    nodeId: 'fn-accept-reject',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-disp-capacity-check', checkType: 'completed', blockMessageAr: 'يجب فحص السعة أولاً', blockMessageEn: 'Capacity check required', allowBypass: true },
    ],
    impacts: [
      { id: 'imp-disp-accept-notify', type: 'send_notification', labelAr: 'إشعار بالقرار', labelEn: 'Notify decision', autoExecute: true, priority: 1 },
      { id: 'imp-disp-accept-audit', type: 'log_audit', labelAr: 'تسجيل القرار', labelEn: 'Log decision', autoExecute: true, priority: 1 },
    ],
    resourceType: 'disposal_request',
  },
  {
    id: 'cmd-disp-process',
    labelAr: 'معالجة وتخلص نهائي',
    labelEn: 'Process & Dispose',
    icon: 'Factory',
    bindingType: 'hybrid',
    orgTypes: ['disposal'],
    chainId: 'incoming-disposal',
    nodeId: 'fn-process',
    path: '/dashboard/disposal/operations',
    requiredPermissions: ['manage_shipments'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-disp-accept-reject', checkType: 'completed', blockMessageAr: 'يجب قبول الطلب أولاً', blockMessageEn: 'Request must be accepted first', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-disp-process-kpi', type: 'update_kpi', labelAr: 'تحديث مؤشرات المعالجة', labelEn: 'Update processing KPIs', autoExecute: true, priority: 1 },
      { id: 'imp-disp-ledger', type: 'update_ledger', labelAr: 'تحديث الحسابات', labelEn: 'Update ledger', autoExecute: true, priority: 2 },
    ],
    resourceType: 'disposal_request',
  },
  {
    id: 'cmd-disp-issue-cert',
    labelAr: 'إصدار شهادة تخلص',
    labelEn: 'Issue Disposal Certificate',
    icon: 'Award',
    bindingType: 'hybrid',
    orgTypes: ['disposal'],
    chainId: 'incoming-disposal',
    nodeId: 'eff-cert',
    path: '/dashboard/disposal/certificates',
    requiredPermissions: ['manage_shipments', 'create_reports'],
    requireAllPermissions: false,
    dependencies: [
      { commandId: 'cmd-disp-process', checkType: 'completed', blockMessageAr: 'يجب إتمام المعالجة أولاً', blockMessageEn: 'Processing must be completed', allowBypass: false },
    ],
    impacts: [
      { id: 'imp-disp-cert-notify', type: 'send_notification', labelAr: 'إشعار بالشهادة', labelEn: 'Notify certificate', autoExecute: true, priority: 1 },
      { id: 'imp-disp-capacity-update', type: 'update_inventory', labelAr: 'تحديث السعة', labelEn: 'Update capacity', autoExecute: true, priority: 1 },
      { id: 'imp-disp-esg', type: 'recalculate_esg', labelAr: 'تحديث ESG', labelEn: 'Update ESG', autoExecute: true, priority: 2 },
    ],
    resourceType: 'certificate',
  },

  // ═══════════════════════════════════════════
  // 2. السلامة والامتثال
  // ═══════════════════════════════════════════
  {
    id: 'cmd-disp-safety-inspect',
    labelAr: 'فحص المرافق',
    labelEn: 'Inspect Facilities',
    icon: 'Search',
    bindingType: 'internal',
    orgTypes: ['disposal'],
    chainId: 'safety-compliance',
    nodeId: 'fn-inspect-facility',
    path: '/dashboard/disposal-facilities',
    requiredPermissions: ['view_reports'],
    requireAllPermissions: false,
    dependencies: [],
    impacts: [
      { id: 'imp-disp-safety-audit', type: 'log_audit', labelAr: 'تسجيل الفحص', labelEn: 'Log inspection', autoExecute: true, priority: 1 },
    ],
    resourceType: 'facility',
  },
  {
    id: 'cmd-disp-safety-report',
    labelAr: 'إنشاء تقرير سلامة',
    labelEn: 'Generate Safety Report',
    icon: 'FileText',
    bindingType: 'admin',
    orgTypes: ['disposal'],
    chainId: 'safety-compliance',
    nodeId: 'res-safety-report',
    requiredPermissions: ['view_reports', 'create_reports'],
    requireAllPermissions: true,
    dependencies: [
      { commandId: 'cmd-disp-safety-inspect', checkType: 'completed', blockMessageAr: 'يجب فحص المرافق أولاً', blockMessageEn: 'Facility inspection required', allowBypass: true },
    ],
    impacts: [
      { id: 'imp-disp-safety-plan', type: 'update_compliance', labelAr: 'تحديث الخطة السنوية', labelEn: 'Update annual plan', autoExecute: true, priority: 1 },
      { id: 'imp-disp-regulatory', type: 'update_compliance', labelAr: 'إفصاحات تنظيمية', labelEn: 'Regulatory disclosures', autoExecute: true, priority: 2 },
    ],
    resourceType: 'report',
  },
];

export const DISPOSAL_COMMAND_REGISTRY: OrgCommandRegistry = {
  orgType: 'disposal',
  commands: DISPOSAL_COMMANDS,
};
