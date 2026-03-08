/**
 * نظام الأدوار الهرمية لأعضاء الجهات
 */

export type MemberRole = 'entity_head' | 'assistant' | 'deputy_assistant' | 'agent' | 'delegate' | 'member';

export const MEMBER_ROLE_LEVELS: Record<MemberRole, number> = {
  entity_head: 1,
  assistant: 2,
  deputy_assistant: 3,
  agent: 4,
  delegate: 5,
  member: 6,
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, { ar: string; en: string; icon: string }> = {
  entity_head: { ar: 'رئيس الجهة', en: 'Entity Head', icon: '👑' },
  assistant: { ar: 'مساعد الرئيس', en: 'Assistant', icon: '⭐' },
  deputy_assistant: { ar: 'نائب المساعد', en: 'Deputy Assistant', icon: '🌟' },
  agent: { ar: 'وكيل', en: 'Agent', icon: '🔑' },
  delegate: { ar: 'مفوّض', en: 'Delegate', icon: '📋' },
  member: { ar: 'عضو', en: 'Member', icon: '👤' },
};

/** All available member permissions */
export const ALL_MEMBER_PERMISSIONS = [
  // Shipments
  'create_shipments', 'view_shipments', 'edit_shipments', 'delete_shipments', 'approve_shipments',
  // Financial
  'view_financials', 'create_invoices', 'approve_payments', 'manage_deposits',
  // Fleet
  'manage_drivers', 'assign_drivers', 'track_vehicles',
  // Partners
  'manage_partners', 'view_partner_data',
  // Users
  'manage_members', 'manage_settings',
  // Reports
  'view_reports', 'export_data',
  // Documents
  'sign_documents', 'issue_certificates', 'manage_templates', 'manage_contracts',
] as const;

export type MemberPermission = typeof ALL_MEMBER_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<MemberPermission, { ar: string; category: string }> = {
  create_shipments: { ar: 'إنشاء شحنات', category: 'shipments' },
  view_shipments: { ar: 'عرض الشحنات', category: 'shipments' },
  edit_shipments: { ar: 'تعديل الشحنات', category: 'shipments' },
  delete_shipments: { ar: 'حذف الشحنات', category: 'shipments' },
  approve_shipments: { ar: 'اعتماد الشحنات', category: 'shipments' },
  view_financials: { ar: 'عرض البيانات المالية', category: 'financial' },
  create_invoices: { ar: 'إنشاء فواتير', category: 'financial' },
  approve_payments: { ar: 'اعتماد المدفوعات', category: 'financial' },
  manage_deposits: { ar: 'إدارة الإيداعات', category: 'financial' },
  manage_drivers: { ar: 'إدارة السائقين', category: 'fleet' },
  assign_drivers: { ar: 'تعيين السائقين', category: 'fleet' },
  track_vehicles: { ar: 'تتبع المركبات', category: 'fleet' },
  manage_partners: { ar: 'إدارة الشركاء', category: 'partners' },
  view_partner_data: { ar: 'عرض بيانات الشركاء', category: 'partners' },
  manage_members: { ar: 'إدارة الأعضاء', category: 'management' },
  manage_settings: { ar: 'إدارة الإعدادات', category: 'management' },
  view_reports: { ar: 'عرض التقارير', category: 'reports' },
  export_data: { ar: 'تصدير البيانات', category: 'reports' },
  sign_documents: { ar: 'توقيع المستندات', category: 'documents' },
  issue_certificates: { ar: 'إصدار شهادات', category: 'documents' },
  manage_templates: { ar: 'إدارة القوالب', category: 'documents' },
  manage_contracts: { ar: 'إدارة العقود', category: 'documents' },
};

export const PERMISSION_CATEGORIES: Record<string, string> = {
  shipments: 'الشحنات',
  financial: 'المالية',
  fleet: 'الأسطول',
  partners: 'الشركاء',
  management: 'الإدارة',
  reports: 'التقارير',
  documents: 'المستندات',
};

/** Get roles a user can assign (only lower than their own) */
export function getAssignableRoles(currentRole: MemberRole): MemberRole[] {
  const currentLevel = MEMBER_ROLE_LEVELS[currentRole];
  return (Object.keys(MEMBER_ROLE_LEVELS) as MemberRole[])
    .filter(role => MEMBER_ROLE_LEVELS[role] > currentLevel);
}
