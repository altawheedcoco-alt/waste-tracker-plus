/**
 * نظام الأدوار الهرمية والصلاحيات التفصيلية لأعضاء الجهات
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

/** All available member permissions — granular & comprehensive */
export const ALL_MEMBER_PERMISSIONS = [
  // ===== الشحنات =====
  'create_shipments', 'view_shipments', 'edit_shipments', 'delete_shipments',
  'approve_shipments', 'reject_shipments', 'cancel_shipments',
  'reassign_shipments', 'change_shipment_status', 'view_shipment_history',
  'add_shipment_notes', 'upload_shipment_attachments', 'print_shipment_manifest',
  'view_shipment_tracking', 'manage_recurring_shipments', 'bulk_shipment_operations',
  'manage_collection_requests', 'create_manual_shipments', 'view_manual_drafts',
  'manage_shipment_routes', 'view_rejected_shipments',

  // ===== الإيداعات والمعاملات المالية =====
  'create_deposits', 'view_deposits', 'edit_deposits', 'delete_deposits',
  'approve_deposits', 'reject_deposits', 'verify_deposits',

  // ===== المحاسبة والمالية =====
  'view_financials', 'view_account_details', 'create_invoices', 'edit_invoices',
  'delete_invoices', 'approve_payments', 'reject_payments', 'manage_deposits_advanced',
  'view_ledger', 'create_ledger_entries', 'verify_ledger_entries',
  'view_account_periods', 'close_account_periods', 'manage_cogs',
  'view_revenue_expenses', 'create_financial_reports', 'view_financial_comparisons',
  'manage_purchasing', 'manage_sales', 'manage_digital_wallet',
  'view_financial_dashboard', 'export_financial_data',

  // ===== السائقين والأسطول =====
  'manage_drivers', 'view_drivers', 'add_drivers', 'edit_driver_info',
  'deactivate_drivers', 'assign_drivers', 'unassign_drivers',
  'view_driver_tracking', 'track_vehicles', 'manage_vehicles',
  'manage_containers', 'reassign_vehicles', 'manage_driver_permits',
  'manage_driver_academy', 'manage_driver_rewards', 'view_driver_performance',
  'manage_preventive_maintenance', 'manage_shift_scheduling',
  'view_fleet_reports', 'manage_fuel_records',

  // ===== الشركاء والجهات =====
  'manage_partners', 'view_partners', 'add_partners', 'edit_partners',
  'delete_partners', 'view_partner_data', 'create_external_partners',
  'approve_partnership_requests', 'view_partner_accounts',
  'view_partner_timeline', 'manage_partner_contracts',

  // ===== الأعضاء والموظفين =====
  'manage_members', 'view_members', 'add_members', 'edit_members',
  'remove_members', 'manage_member_permissions', 'manage_member_roles',
  'view_member_activity', 'manage_employees', 'manage_team_credentials',
  'invite_members', 'approve_member_requests',

  // ===== الإعدادات والنظام =====
  'manage_settings', 'view_settings', 'manage_org_profile',
  'manage_auto_actions', 'manage_subscription', 'manage_api_keys',
  'manage_notification_settings', 'manage_branding', 'manage_templates',
  'manage_integrations', 'view_activity_logs', 'manage_security_settings',

  // ===== التقارير والتحليلات =====
  'view_reports', 'create_reports', 'export_reports',
  'view_shipment_reports', 'view_aggregate_reports', 'view_waste_register',
  'view_hazardous_register', 'view_carbon_footprint', 'view_esg_reports',
  'view_ohs_reports', 'view_waste_analysis', 'view_waste_flow',
  'view_sustainability_reports', 'export_data', 'export_accounts',
  'view_detailed_analytics', 'create_custom_reports',

  // ===== المستندات والشهادات =====
  'sign_documents', 'view_documents', 'upload_documents', 'delete_documents',
  'issue_certificates', 'view_certificates', 'revoke_certificates',
  'manage_contracts', 'view_contracts', 'sign_contracts',
  'manage_document_templates', 'manage_digital_attestation',
  'print_documents', 'share_documents',

  // ===== الهيكل التنظيمي =====
  'view_org_structure', 'manage_org_structure', 'manage_departments',
  'manage_positions', 'assign_position_holders',

  // ===== الموارد البشرية =====
  'manage_hr', 'view_hr', 'manage_payroll', 'view_payroll',
  'manage_performance_reviews', 'view_performance_reviews',
  'manage_shifts', 'view_shifts', 'manage_end_of_service',
  'view_self_service', 'manage_org_chart',

  // ===== المخزون =====
  'view_inventory', 'manage_inventory', 'add_inventory_items',
  'edit_inventory_items', 'delete_inventory_items', 'transfer_inventory',

  // ===== الدعم والتواصل =====
  'view_support_tickets', 'create_support_tickets', 'manage_support_tickets',
  'view_notifications', 'manage_notifications', 'send_bulk_notifications',

  // ===== الذكاء الاصطناعي =====
  'manage_ai_config', 'view_ai_analytics', 'manage_ai_agent',
  'manage_ai_knowledge', 'view_ai_conversations',

  // ===== الإعلانات =====
  'create_advertisements', 'manage_advertisements', 'view_ad_analytics',

  // ===== التأمين والعقود الآجلة =====
  'manage_insurance', 'view_insurance', 'manage_futures_market',

  // ===== البيانات المتقدمة =====
  'view_system_status', 'manage_offline_mode', 'view_digital_identity',
  'manage_waste_types', 'manage_guilloche_patterns',
] as const;

export type MemberPermission = typeof ALL_MEMBER_PERMISSIONS[number];

export const PERMISSION_LABELS: Record<MemberPermission, { ar: string; category: string }> = {
  // الشحنات
  create_shipments: { ar: 'إنشاء شحنات', category: 'shipments' },
  view_shipments: { ar: 'عرض الشحنات', category: 'shipments' },
  edit_shipments: { ar: 'تعديل الشحنات', category: 'shipments' },
  delete_shipments: { ar: 'حذف الشحنات', category: 'shipments' },
  approve_shipments: { ar: 'اعتماد الشحنات', category: 'shipments' },
  reject_shipments: { ar: 'رفض الشحنات', category: 'shipments' },
  cancel_shipments: { ar: 'إلغاء الشحنات', category: 'shipments' },
  reassign_shipments: { ar: 'إعادة تعيين الشحنات', category: 'shipments' },
  change_shipment_status: { ar: 'تغيير حالة الشحنة', category: 'shipments' },
  view_shipment_history: { ar: 'عرض سجل الشحنة', category: 'shipments' },
  add_shipment_notes: { ar: 'إضافة ملاحظات للشحنة', category: 'shipments' },
  upload_shipment_attachments: { ar: 'رفع مرفقات الشحنة', category: 'shipments' },
  print_shipment_manifest: { ar: 'طباعة بوليصة الشحن', category: 'shipments' },
  view_shipment_tracking: { ar: 'تتبع الشحنات', category: 'shipments' },
  manage_recurring_shipments: { ar: 'إدارة الشحنات المتكررة', category: 'shipments' },
  bulk_shipment_operations: { ar: 'عمليات جماعية على الشحنات', category: 'shipments' },
  manage_collection_requests: { ar: 'إدارة طلبات الجمع', category: 'shipments' },
  create_manual_shipments: { ar: 'إنشاء شحنات يدوية', category: 'shipments' },
  view_manual_drafts: { ar: 'عرض مسودات الشحنات اليدوية', category: 'shipments' },
  manage_shipment_routes: { ar: 'إدارة مسارات الشحنات', category: 'shipments' },
  view_rejected_shipments: { ar: 'عرض الشحنات المرفوضة', category: 'shipments' },

  // الإيداعات
  create_deposits: { ar: 'إنشاء إيداعات', category: 'deposits' },
  view_deposits: { ar: 'عرض الإيداعات', category: 'deposits' },
  edit_deposits: { ar: 'تعديل الإيداعات', category: 'deposits' },
  delete_deposits: { ar: 'حذف الإيداعات', category: 'deposits' },
  approve_deposits: { ar: 'اعتماد الإيداعات', category: 'deposits' },
  reject_deposits: { ar: 'رفض الإيداعات', category: 'deposits' },
  verify_deposits: { ar: 'التحقق من الإيداعات', category: 'deposits' },

  // المحاسبة
  view_financials: { ar: 'عرض البيانات المالية', category: 'financial' },
  view_account_details: { ar: 'عرض تفاصيل الحسابات', category: 'financial' },
  create_invoices: { ar: 'إنشاء فواتير', category: 'financial' },
  edit_invoices: { ar: 'تعديل الفواتير', category: 'financial' },
  delete_invoices: { ar: 'حذف الفواتير', category: 'financial' },
  approve_payments: { ar: 'اعتماد المدفوعات', category: 'financial' },
  reject_payments: { ar: 'رفض المدفوعات', category: 'financial' },
  manage_deposits_advanced: { ar: 'إدارة متقدمة للإيداعات', category: 'financial' },
  view_ledger: { ar: 'عرض دفتر الأستاذ', category: 'financial' },
  create_ledger_entries: { ar: 'إنشاء قيود محاسبية', category: 'financial' },
  verify_ledger_entries: { ar: 'تدقيق القيود المحاسبية', category: 'financial' },
  view_account_periods: { ar: 'عرض الفترات المحاسبية', category: 'financial' },
  close_account_periods: { ar: 'إغلاق الفترات المحاسبية', category: 'financial' },
  manage_cogs: { ar: 'إدارة تكلفة البضاعة', category: 'financial' },
  view_revenue_expenses: { ar: 'عرض الإيرادات والمصروفات', category: 'financial' },
  create_financial_reports: { ar: 'إنشاء تقارير مالية', category: 'financial' },
  view_financial_comparisons: { ar: 'عرض المقارنات المالية', category: 'financial' },
  manage_purchasing: { ar: 'إدارة المشتريات', category: 'financial' },
  manage_sales: { ar: 'إدارة المبيعات', category: 'financial' },
  manage_digital_wallet: { ar: 'إدارة المحفظة الرقمية', category: 'financial' },
  view_financial_dashboard: { ar: 'عرض لوحة المالية', category: 'financial' },
  export_financial_data: { ar: 'تصدير البيانات المالية', category: 'financial' },

  // السائقين والأسطول
  manage_drivers: { ar: 'إدارة السائقين', category: 'fleet' },
  view_drivers: { ar: 'عرض السائقين', category: 'fleet' },
  add_drivers: { ar: 'إضافة سائقين', category: 'fleet' },
  edit_driver_info: { ar: 'تعديل بيانات السائقين', category: 'fleet' },
  deactivate_drivers: { ar: 'تعطيل السائقين', category: 'fleet' },
  assign_drivers: { ar: 'تعيين السائقين للشحنات', category: 'fleet' },
  unassign_drivers: { ar: 'إلغاء تعيين السائقين', category: 'fleet' },
  view_driver_tracking: { ar: 'تتبع السائقين مباشرة', category: 'fleet' },
  track_vehicles: { ar: 'تتبع المركبات', category: 'fleet' },
  manage_vehicles: { ar: 'إدارة المركبات', category: 'fleet' },
  manage_containers: { ar: 'إدارة الحاويات', category: 'fleet' },
  reassign_vehicles: { ar: 'إعادة تعيين المركبات', category: 'fleet' },
  manage_driver_permits: { ar: 'إدارة تصاريح السائقين', category: 'fleet' },
  manage_driver_academy: { ar: 'إدارة أكاديمية السائقين', category: 'fleet' },
  manage_driver_rewards: { ar: 'إدارة مكافآت السائقين', category: 'fleet' },
  view_driver_performance: { ar: 'عرض أداء السائقين', category: 'fleet' },
  manage_preventive_maintenance: { ar: 'إدارة الصيانة الوقائية', category: 'fleet' },
  manage_shift_scheduling: { ar: 'جدولة الورديات', category: 'fleet' },
  view_fleet_reports: { ar: 'عرض تقارير الأسطول', category: 'fleet' },
  manage_fuel_records: { ar: 'إدارة سجلات الوقود', category: 'fleet' },

  // الشركاء
  manage_partners: { ar: 'إدارة الشركاء', category: 'partners' },
  view_partners: { ar: 'عرض الشركاء', category: 'partners' },
  add_partners: { ar: 'إضافة شركاء', category: 'partners' },
  edit_partners: { ar: 'تعديل بيانات الشركاء', category: 'partners' },
  delete_partners: { ar: 'حذف شركاء', category: 'partners' },
  view_partner_data: { ar: 'عرض بيانات الشركاء', category: 'partners' },
  create_external_partners: { ar: 'إنشاء جهات خارجية', category: 'partners' },
  approve_partnership_requests: { ar: 'اعتماد طلبات الشراكة', category: 'partners' },
  view_partner_accounts: { ar: 'عرض حسابات الشركاء', category: 'partners' },
  view_partner_timeline: { ar: 'عرض أخبار الشركاء', category: 'partners' },
  manage_partner_contracts: { ar: 'إدارة عقود الشركاء', category: 'partners' },

  // الأعضاء والموظفين
  manage_members: { ar: 'إدارة الأعضاء', category: 'management' },
  view_members: { ar: 'عرض الأعضاء', category: 'management' },
  add_members: { ar: 'إضافة أعضاء', category: 'management' },
  edit_members: { ar: 'تعديل بيانات الأعضاء', category: 'management' },
  remove_members: { ar: 'إزالة أعضاء', category: 'management' },
  manage_member_permissions: { ar: 'إدارة صلاحيات الأعضاء', category: 'management' },
  manage_member_roles: { ar: 'إدارة أدوار الأعضاء', category: 'management' },
  view_member_activity: { ar: 'عرض نشاط الأعضاء', category: 'management' },
  manage_employees: { ar: 'إدارة الموظفين', category: 'management' },
  manage_team_credentials: { ar: 'إدارة بيانات دخول الفريق', category: 'management' },
  invite_members: { ar: 'دعوة أعضاء جدد', category: 'management' },
  approve_member_requests: { ar: 'اعتماد طلبات الانضمام', category: 'management' },

  // الإعدادات
  manage_settings: { ar: 'إدارة الإعدادات', category: 'settings' },
  view_settings: { ar: 'عرض الإعدادات', category: 'settings' },
  manage_org_profile: { ar: 'إدارة ملف المنظمة', category: 'settings' },
  manage_auto_actions: { ar: 'إدارة الإجراءات التلقائية', category: 'settings' },
  manage_subscription: { ar: 'إدارة الاشتراك', category: 'settings' },
  manage_api_keys: { ar: 'إدارة مفاتيح API', category: 'settings' },
  manage_notification_settings: { ar: 'إدارة إعدادات الإشعارات', category: 'settings' },
  manage_branding: { ar: 'إدارة الهوية البصرية', category: 'settings' },
  manage_templates: { ar: 'إدارة القوالب', category: 'settings' },
  manage_integrations: { ar: 'إدارة التكاملات', category: 'settings' },
  view_activity_logs: { ar: 'عرض سجل النشاطات', category: 'settings' },
  manage_security_settings: { ar: 'إدارة إعدادات الأمان', category: 'settings' },

  // التقارير
  view_reports: { ar: 'عرض التقارير', category: 'reports' },
  create_reports: { ar: 'إنشاء تقارير', category: 'reports' },
  export_reports: { ar: 'تصدير التقارير', category: 'reports' },
  view_shipment_reports: { ar: 'عرض تقارير الشحنات', category: 'reports' },
  view_aggregate_reports: { ar: 'عرض التقارير التجميعية', category: 'reports' },
  view_waste_register: { ar: 'عرض سجل النفايات غير الخطرة', category: 'reports' },
  view_hazardous_register: { ar: 'عرض سجل النفايات الخطرة', category: 'reports' },
  view_carbon_footprint: { ar: 'عرض البصمة الكربونية', category: 'reports' },
  view_esg_reports: { ar: 'عرض تقارير ESG', category: 'reports' },
  view_ohs_reports: { ar: 'عرض تقارير السلامة', category: 'reports' },
  view_waste_analysis: { ar: 'عرض تحليل النفايات', category: 'reports' },
  view_waste_flow: { ar: 'عرض تدفق النفايات', category: 'reports' },
  view_sustainability_reports: { ar: 'عرض تقارير الاستدامة', category: 'reports' },
  export_data: { ar: 'تصدير البيانات', category: 'reports' },
  export_accounts: { ar: 'تصدير الحسابات', category: 'reports' },
  view_detailed_analytics: { ar: 'عرض التحليلات التفصيلية', category: 'reports' },
  create_custom_reports: { ar: 'إنشاء تقارير مخصصة', category: 'reports' },

  // المستندات
  sign_documents: { ar: 'توقيع المستندات', category: 'documents' },
  view_documents: { ar: 'عرض المستندات', category: 'documents' },
  upload_documents: { ar: 'رفع المستندات', category: 'documents' },
  delete_documents: { ar: 'حذف المستندات', category: 'documents' },
  issue_certificates: { ar: 'إصدار شهادات', category: 'documents' },
  view_certificates: { ar: 'عرض الشهادات', category: 'documents' },
  revoke_certificates: { ar: 'إلغاء شهادات', category: 'documents' },
  manage_contracts: { ar: 'إدارة العقود', category: 'documents' },
  view_contracts: { ar: 'عرض العقود', category: 'documents' },
  sign_contracts: { ar: 'توقيع العقود', category: 'documents' },
  manage_document_templates: { ar: 'إدارة قوالب المستندات', category: 'documents' },
  manage_digital_attestation: { ar: 'إدارة الإفادة الرقمية', category: 'documents' },
  print_documents: { ar: 'طباعة المستندات', category: 'documents' },
  share_documents: { ar: 'مشاركة المستندات', category: 'documents' },

  // الهيكل التنظيمي
  view_org_structure: { ar: 'عرض الهيكل التنظيمي', category: 'org_structure' },
  manage_org_structure: { ar: 'إدارة الهيكل التنظيمي', category: 'org_structure' },
  manage_departments: { ar: 'إدارة الأقسام', category: 'org_structure' },
  manage_positions: { ar: 'إدارة المناصب', category: 'org_structure' },
  assign_position_holders: { ar: 'تعيين شاغلي المناصب', category: 'org_structure' },

  // الموارد البشرية
  manage_hr: { ar: 'إدارة الموارد البشرية', category: 'hr' },
  view_hr: { ar: 'عرض الموارد البشرية', category: 'hr' },
  manage_payroll: { ar: 'إدارة الرواتب', category: 'hr' },
  view_payroll: { ar: 'عرض الرواتب', category: 'hr' },
  manage_performance_reviews: { ar: 'إدارة تقييم الأداء', category: 'hr' },
  view_performance_reviews: { ar: 'عرض تقييم الأداء', category: 'hr' },
  manage_shifts: { ar: 'إدارة الورديات', category: 'hr' },
  view_shifts: { ar: 'عرض الورديات', category: 'hr' },
  manage_end_of_service: { ar: 'إدارة نهاية الخدمة', category: 'hr' },
  view_self_service: { ar: 'الخدمة الذاتية', category: 'hr' },
  manage_org_chart: { ar: 'إدارة الهيكل التنظيمي HR', category: 'hr' },

  // المخزون
  view_inventory: { ar: 'عرض المخزون', category: 'inventory' },
  manage_inventory: { ar: 'إدارة المخزون', category: 'inventory' },
  add_inventory_items: { ar: 'إضافة أصناف', category: 'inventory' },
  edit_inventory_items: { ar: 'تعديل الأصناف', category: 'inventory' },
  delete_inventory_items: { ar: 'حذف أصناف', category: 'inventory' },
  transfer_inventory: { ar: 'نقل المخزون', category: 'inventory' },

  // الدعم
  view_support_tickets: { ar: 'عرض تذاكر الدعم', category: 'support' },
  create_support_tickets: { ar: 'إنشاء تذاكر دعم', category: 'support' },
  manage_support_tickets: { ar: 'إدارة تذاكر الدعم', category: 'support' },
  view_notifications: { ar: 'عرض الإشعارات', category: 'support' },
  manage_notifications: { ar: 'إدارة الإشعارات', category: 'support' },
  send_bulk_notifications: { ar: 'إرسال إشعارات جماعية', category: 'support' },

  // الذكاء الاصطناعي
  manage_ai_config: { ar: 'إدارة إعدادات الذكاء الاصطناعي', category: 'ai' },
  view_ai_analytics: { ar: 'عرض تحليلات الذكاء الاصطناعي', category: 'ai' },
  manage_ai_agent: { ar: 'إدارة وكيل الذكاء الاصطناعي', category: 'ai' },
  manage_ai_knowledge: { ar: 'إدارة قاعدة المعرفة AI', category: 'ai' },
  view_ai_conversations: { ar: 'عرض محادثات AI', category: 'ai' },

  // الإعلانات
  create_advertisements: { ar: 'إنشاء إعلانات', category: 'ads' },
  manage_advertisements: { ar: 'إدارة الإعلانات', category: 'ads' },
  view_ad_analytics: { ar: 'عرض تحليلات الإعلانات', category: 'ads' },

  // التأمين
  manage_insurance: { ar: 'إدارة التأمين', category: 'advanced' },
  view_insurance: { ar: 'عرض التأمين', category: 'advanced' },
  manage_futures_market: { ar: 'إدارة العقود الآجلة', category: 'advanced' },

  // بيانات متقدمة
  view_system_status: { ar: 'عرض حالة النظام', category: 'advanced' },
  manage_offline_mode: { ar: 'إدارة وضع بدون إنترنت', category: 'advanced' },
  view_digital_identity: { ar: 'عرض الهوية الرقمية', category: 'advanced' },
  manage_waste_types: { ar: 'إدارة أنواع النفايات', category: 'advanced' },
  manage_guilloche_patterns: { ar: 'إدارة أنماط الجيلوش', category: 'advanced' },
};

export const PERMISSION_CATEGORIES: Record<string, string> = {
  shipments: 'الشحنات',
  deposits: 'الإيداعات',
  financial: 'المالية والمحاسبة',
  fleet: 'السائقين والأسطول',
  partners: 'الشركاء',
  management: 'الأعضاء والموظفين',
  settings: 'الإعدادات والنظام',
  reports: 'التقارير والتحليلات',
  documents: 'المستندات والشهادات',
  org_structure: 'الهيكل التنظيمي',
  hr: 'الموارد البشرية',
  inventory: 'المخزون',
  support: 'الدعم والتواصل',
  ai: 'الذكاء الاصطناعي',
  ads: 'الإعلانات',
  advanced: 'متقدم',
};

/** Get roles a user can assign (only lower than their own) */
export function getAssignableRoles(currentRole: MemberRole): MemberRole[] {
  const currentLevel = MEMBER_ROLE_LEVELS[currentRole];
  return (Object.keys(MEMBER_ROLE_LEVELS) as MemberRole[])
    .filter(role => MEMBER_ROLE_LEVELS[role] > currentLevel);
}
