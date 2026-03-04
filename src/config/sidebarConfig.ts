/**
 * Sidebar menu configuration with smart grouping per organization type.
 * Merges similar sections and filters irrelevant items per role.
 */
import {
  LayoutDashboard, Package, Truck, Users, Settings, Bell, Building2, Recycle,
  User, MapPin, BarChart3, FileText, Handshake, BadgeCheck, Scale, FolderCheck,
  Search, ClipboardList, FileSpreadsheet, AlertTriangle, Layers, Send,
  MessageCircle, Newspaper, Rss, Info, BookOpen, Banknote, Activity, Headphones,
  Bookmark, Link as LinkIcon, Zap, Fingerprint, Brain, Sparkles, Shield,
  CircleDot, Factory, WifiOff, FileCheck, Calculator, Wallet, ShoppingCart,
  Boxes, GitCompareArrows, FolderOpen, Inbox, TreePine, Store, GraduationCap,
  Award, Receipt, Leaf, TrendingUp, Lock, Database, Trophy, Globe, Bot, Gauge,
  Eye, Umbrella, PenTool, Network, FileSignature, ClipboardCheck, Printer,
  CreditCard, Monitor, Plus, CheckSquare, UserPlus, Video,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface SidebarGroupConfig {
  id: string;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  /** Which org types can see this group. Empty = all */
  visibleFor: string[];
  /** Items within this group */
  items: SidebarItemConfig[];
}

export interface SidebarItemConfig {
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  path: string;
  key: string;
  badgeKey?: string;
  /** Which org types can see this item. Empty = all */
  visibleFor?: string[];
}

type OrgType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'regulator' | 'consultant' | 'consulting_office' | 'admin' | 'driver';

/**
 * Top-level standalone items (always visible, not in groups)
 */
export const standaloneItems: SidebarItemConfig[] = [
  { icon: LayoutDashboard, labelAr: 'لوحة التحكم', labelEn: 'Dashboard', path: '/dashboard', key: 'dashboard' },
];

/**
 * All sidebar groups with smart visibility rules.
 * Groups are merged for a cleaner structure (~12 groups instead of ~22).
 */
export const sidebarGroups: SidebarGroupConfig[] = [
  // ═══════════════ 1. المنظمة والهيكل ═══════════════
  {
    id: 'org-structure',
    icon: Building2,
    labelAr: 'المنظمة والهيكل',
    labelEn: 'Organization',
    visibleFor: [], // all
    items: [
      { icon: Building2, labelAr: 'ملف المنظمة', labelEn: 'Org Profile', path: '/dashboard/organization-profile', key: 'org-profile' },
      { icon: FileText, labelAr: 'الإفادة الرقمية', labelEn: 'Digital Attestation', path: '/dashboard/organization-attestation', key: 'org-attestation' },
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Structure', path: '/dashboard/org-structure', key: 'org-structure' },
      { icon: Users, labelAr: 'إدارة الموظفين', labelEn: 'Employees', path: '/dashboard/employees', key: 'employees' },
      { icon: Users, labelAr: 'بيانات الفريق', labelEn: 'Team Data', path: '/dashboard/team-credentials', key: 'other-team' },
      { icon: Handshake, labelAr: 'الشركاء', labelEn: 'Partners', path: '/dashboard/partners', key: 'partners', badgeKey: 'partners' },
      { icon: Rss, labelAr: 'آخر أخبار الشركاء', labelEn: 'Partners Timeline', path: '/dashboard/partners-timeline', key: 'partners-timeline', badgeKey: 'partners-timeline' },
      { icon: Newspaper, labelAr: 'منشورات المنظمة', labelEn: 'Posts', path: '/dashboard/organization-profile?tab=posts', key: 'posts' },
      { icon: Fingerprint, labelAr: 'بطاقة الهوية الرقمية', labelEn: 'Digital Identity', path: '/dashboard/digital-identity-card', key: 'digital-identity-card' },
    ],
  },

  // ═══════════════ 2. العمليات — المولّد ═══════════════
  {
    id: 'generator-ops',
    icon: Package,
    labelAr: 'الشحنات والشهادات',
    labelEn: 'Shipments & Certs',
    visibleFor: ['generator'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'generator-shipments', badgeKey: 'generator-shipments' },
      { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'generator-rejected' },
      { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/generator-receipts', key: 'generator-receipts' },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'generator-certs', badgeKey: 'generator-certs' },
    ],
  },

  // ═══════════════ 3. العمليات — الناقل ═══════════════
  {
    id: 'transporter-ops',
    icon: Package,
    labelAr: 'عمليات الشحن',
    labelEn: 'Shipping Operations',
    visibleFor: ['transporter'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/transporter-shipments', key: 'transporter-shipments', badgeKey: 'transporter-shipments' },
      { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'transporter-rejected' },
      { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/transporter-receipts', key: 'transporter-receipts' },
      { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations', key: 'transporter-declarations' },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'transporter-certs', badgeKey: 'transporter-certs' },
      { icon: Fingerprint, labelAr: 'أنماط الجيلوش', labelEn: 'Guilloche', path: '/dashboard/guilloche-patterns', key: 'transporter-guilloche' },
      { icon: Inbox, labelAr: 'طلبات الجمع', labelEn: 'Collection Requests', path: '/dashboard/collection-requests', key: 'collection-requests' },
    ],
  },

  // ═══════════════ 4. السائقون والأسطول (ناقل فقط) ═══════════════
  {
    id: 'fleet-drivers',
    icon: Truck,
    labelAr: 'السائقون والأسطول',
    labelEn: 'Fleet & Drivers',
    visibleFor: ['transporter'],
    items: [
      { icon: Users, labelAr: 'إدارة السائقين', labelEn: 'Drivers', path: '/dashboard/transporter-drivers', key: 'transporter-drivers' },
      { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'transporter-driver-tracking' },
      { icon: Truck, labelAr: 'خريطة المسارات', labelEn: 'Routes Map', path: '/dashboard/shipment-routes', key: 'shipment-routes' },
      { icon: Shield, labelAr: 'تصاريح السائقين', labelEn: 'Driver Permits', path: '/dashboard/driver-permits', key: 'driver-permits' },
      { icon: GraduationCap, labelAr: 'أكاديمية السائقين', labelEn: 'Driver Academy', path: '/dashboard/driver-academy', key: 'driver-academy' },
    ],
  },

  // ═══════════════ 5. العمليات — المدوّر ═══════════════
  {
    id: 'recycler-ops',
    icon: Recycle,
    labelAr: 'الشحنات والشهادات',
    labelEn: 'Shipments & Certs',
    visibleFor: ['recycler'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'recycler-shipments', badgeKey: 'recycler-shipments' },
      { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'recycler-rejected' },
      { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations', key: 'recycler-declarations' },
      { icon: FolderCheck, labelAr: 'إصدار شهادات التدوير', labelEn: 'Issue Certs', path: '/dashboard/issue-recycling-certificates', key: 'issue-certs', badgeKey: 'issue-certs' },
    ],
  },

  // ═══════════════ 6. العمليات — جهة التخلص ═══════════════
  {
    id: 'disposal-ops',
    icon: Factory,
    labelAr: 'عمليات التخلص',
    labelEn: 'Disposal Operations',
    visibleFor: ['disposal'],
    items: [
      { icon: Factory, labelAr: 'العمليات', labelEn: 'Operations', path: '/dashboard/disposal/operations', key: 'disposal-operations' },
      { icon: Package, labelAr: 'الطلبات الواردة', labelEn: 'Incoming Requests', path: '/dashboard/disposal/incoming-requests', key: 'disposal-incoming' },
      { icon: FolderCheck, labelAr: 'شهادات التخلص', labelEn: 'Disposal Certs', path: '/dashboard/disposal/certificates', key: 'disposal-certs' },
      { icon: BarChart3, labelAr: 'تقارير التخلص', labelEn: 'Disposal Reports', path: '/dashboard/disposal/reports', key: 'disposal-reports' },
      { icon: Factory, labelAr: 'مرافق التخلص', labelEn: 'Facilities', path: '/dashboard/disposal-facilities', key: 'disposal-facilities' },
    ],
  },

  // ═══════════════ 7. المنظومة الرقابية ═══════════════
  {
    id: 'regulator-ops',
    icon: Shield,
    labelAr: 'المنظومة الرقابية',
    labelEn: 'Regulatory System',
    visibleFor: ['regulator'],
    items: [
      { icon: BarChart3, labelAr: 'لوحة الرقابة', labelEn: 'Regulator Dashboard', path: '/dashboard/regulator', key: 'regulator-dashboard' },
      { icon: Building2, labelAr: 'سجل المنظمات', labelEn: 'Organizations', path: '/dashboard/regulator', key: 'regulator-orgs' },
      { icon: ClipboardCheck, labelAr: 'التفتيش الميداني', labelEn: 'Inspections', path: '/dashboard/regulator', key: 'regulator-inspections' },
      { icon: AlertTriangle, labelAr: 'المخالفات', labelEn: 'Violations', path: '/dashboard/regulator', key: 'regulator-violations' },
      { icon: Scale, labelAr: 'القرارات والعقوبات', labelEn: 'Penalties', path: '/dashboard/regulator', key: 'regulator-penalties' },
      { icon: Building2, labelAr: 'الشركات المنظمة', labelEn: 'Regulated Companies', path: '/dashboard/regulated-companies', key: 'regulated-companies' },
      { icon: MapPin, labelAr: 'تتبع المركبات', labelEn: 'Vehicle Tracking', path: '/dashboard/driver-tracking', key: 'regulator-tracking' },
    ],
  },

  // ═══════════════ 8. الاستشارات ═══════════════
  {
    id: 'consultant-ops',
    icon: User,
    labelAr: 'خدمات الاستشارات',
    labelEn: 'Consulting Services',
    visibleFor: ['consultant'],
    items: [
      { icon: ClipboardCheck, labelAr: 'عمليات التدقيق', labelEn: 'Audits', path: '/dashboard/audit-sessions', key: 'consultant-audits' },
      { icon: FileText, labelAr: 'التقارير البيئية', labelEn: 'Reports', path: '/dashboard/consultant-reports', key: 'consultant-reports' },
      { icon: Shield, labelAr: 'تقييم الامتثال', labelEn: 'Compliance', path: '/dashboard/compliance-assessment', key: 'consultant-compliance' },
      { icon: Building2, labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/consultant-clients', key: 'consultant-clients' },
      { icon: Award, labelAr: 'الشهادات والتراخيص', labelEn: 'Certifications', path: '/dashboard/consultant-certifications', key: 'consultant-certifications' },
      { icon: BookOpen, labelAr: 'قاعدة المعرفة', labelEn: 'Knowledge', path: '/dashboard/consultant-knowledge', key: 'consultant-knowledge' },
    ],
  },

  // ═══════════════ 9. مكتب الاستشارات ═══════════════
  {
    id: 'consulting-office-ops',
    icon: Building2,
    labelAr: 'إدارة المكتب',
    labelEn: 'Office Management',
    visibleFor: ['consulting_office'],
    items: [
      { icon: Users, labelAr: 'فريق الاستشاريين', labelEn: 'Team', path: '/dashboard/office-consultants', key: 'office-consultants' },
      { icon: ClipboardList, labelAr: 'توزيع المهام', labelEn: 'Tasks', path: '/dashboard/office-tasks', key: 'office-tasks' },
      { icon: ClipboardCheck, labelAr: 'عمليات التدقيق', labelEn: 'Audits', path: '/dashboard/audit-sessions', key: 'office-audits' },
      { icon: FileText, labelAr: 'التقارير البيئية', labelEn: 'Reports', path: '/dashboard/consultant-reports', key: 'office-reports' },
      { icon: Shield, labelAr: 'تقييم الامتثال', labelEn: 'Compliance', path: '/dashboard/compliance-assessment', key: 'office-compliance' },
      { icon: Building2, labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/consultant-clients', key: 'office-clients' },
      { icon: Award, labelAr: 'الشهادات والتراخيص', labelEn: 'Certifications', path: '/dashboard/consultant-certifications', key: 'office-certifications' },
      { icon: BarChart3, labelAr: 'أداء الفريق', labelEn: 'Team Performance', path: '/dashboard/office-performance', key: 'office-performance' },
    ],
  },

  // ═══════════════ 10. العمليات والأنشطة (مدمج) ═══════════════
  {
    id: 'operations-activity',
    icon: Activity,
    labelAr: 'العمليات والأنشطة',
    labelEn: 'Operations & Activity',
    visibleFor: [],
    items: [
      { icon: Gauge, labelAr: 'لوحة العمليات', labelEn: 'Operations Dashboard', path: '/dashboard/operations', key: 'operations' },
      { icon: ClipboardList, labelAr: 'سجل الأنشطة', labelEn: 'Activity Log', path: '/dashboard/activity-log', key: 'activity-log' },
      { icon: FileText, labelAr: 'السجلات الخارجية', labelEn: 'External Records', path: '/dashboard/external-records', key: 'external-records' },
      { icon: MapPin, labelAr: 'إعدادات GPS', labelEn: 'GPS Settings', path: '/dashboard/gps-settings', key: 'gps-settings' },
      { icon: Zap, labelAr: 'إعدادات IoT', labelEn: 'IoT Settings', path: '/dashboard/iot-settings', key: 'iot-settings' },
      { icon: Eye, labelAr: 'الكاميرات والتحقق', labelEn: 'Cameras & Verification', path: '/dashboard/cameras', key: 'cameras', visibleFor: ['recycler', 'disposal', 'generator', 'transporter'] },
    ],
  },

  // ═══════════════ 11. المستندات والعقود (مدمج: عقود + توقيعات + أرشيف + طباعة) ═══════════════
  {
    id: 'docs-contracts',
    icon: FileText,
    labelAr: 'المستندات والعقود',
    labelEn: 'Documents & Contracts',
    visibleFor: [],
    items: [
      { icon: Printer, labelAr: 'مركز الطباعة', labelEn: 'Print Center', path: '/dashboard/print-center', key: 'print-center' },
      { icon: PenTool, labelAr: 'التوقيعات والأختام', labelEn: 'Signing Status', path: '/dashboard/signing-status', key: 'signing-status' },
      { icon: FileText, labelAr: 'العقود', labelEn: 'Contracts', path: '/dashboard/contracts', key: 'contracts' },
      { icon: FileText, labelAr: 'قوالب العقود', labelEn: 'Templates', path: '/dashboard/contract-templates', key: 'contract-templates' },
      { icon: Award, labelAr: 'خطابات الترسية', labelEn: 'Award Letters', path: '/dashboard/award-letters', key: 'award-letters' },
      { icon: FileCheck, labelAr: 'قبول الشروط', labelEn: 'Terms', path: '/dashboard/terms-acceptances', key: 'terms-acceptances' },
      { icon: Shield, labelAr: 'الاشتراطات والسياسات', labelEn: 'Policies', path: '/dashboard/platform-terms', key: 'platform-terms' },
      { icon: BadgeCheck, labelAr: 'ختم المستندات', labelEn: 'Stamping', path: '/dashboard/admin-document-stamping', key: 'admin-document-stamping' },
      { icon: Receipt, labelAr: 'الفاتورة الإلكترونية', labelEn: 'E-Invoice', path: '/dashboard/e-invoice', key: 'e-invoice' },
      { icon: Eye, labelAr: 'التحقق من الوثائق', labelEn: 'Verification', path: '/dashboard/document-verification', key: 'document-verification' },
      { icon: Shield, labelAr: 'المفوضون المعتمدون', labelEn: 'Signatories', path: '/dashboard/authorized-signatories', key: 'authorized-signatories' },
      { icon: FileText, labelAr: 'التصاريح والأذونات', labelEn: 'Permits', path: '/dashboard/permits', key: 'permits' },
      { icon: Shield, labelAr: 'الاستشاريون البيئيون', labelEn: 'Env. Consultants', path: '/dashboard/environmental-consultants', key: 'env-consultants' },
      { icon: FileText, labelAr: 'صندوق التوقيعات', labelEn: 'Signing Inbox', path: '/dashboard/signing-inbox', key: 'signing-inbox' },
      { icon: FolderOpen, labelAr: 'أرشيف المستندات', labelEn: 'Archive', path: '/dashboard/document-archive', key: 'doc-archive-all' },
      { icon: Inbox, labelAr: 'المستلمة', labelEn: 'Received', path: '/dashboard/document-archive?tab=received', key: 'doc-archive-received' },
      { icon: Send, labelAr: 'المرسلة', labelEn: 'Sent', path: '/dashboard/document-archive?tab=sent', key: 'doc-archive-sent' },
      { icon: FileText, labelAr: 'الصادرة', labelEn: 'Issued', path: '/dashboard/document-archive?tab=issued', key: 'doc-archive-issued' },
      { icon: FileSignature, labelAr: 'طلبات التوقيع', labelEn: 'Signing Requests', path: '/dashboard/document-archive?tab=signing_request', key: 'doc-archive-signing' },
      { icon: Building2, labelAr: 'حسب الجهة', labelEn: 'By Partner', path: '/dashboard/document-archive?view=partners', key: 'doc-archive-partners' },
      { icon: FileCheck, labelAr: 'الأعمال اليدوية', labelEn: 'Manual Ops', path: '/dashboard/manual-operations', key: 'manual-operations' },
      { icon: FileSignature, labelAr: 'قوالب التوقيع المتعدد', labelEn: 'Multi-Sign Templates', path: '/dashboard/multi-sign-templates', key: 'multi-sign-templates' },
    ],
  },

  // ═══════════════ 12. المالية (مدمج: ERP + أدوات مالية) ═══════════════
  {
    id: 'finance',
    icon: Wallet,
    labelAr: 'المالية والمحاسبة',
    labelEn: 'Finance & Accounting',
    visibleFor: [],
    items: [
      { icon: Calculator, labelAr: 'المحاسبة', labelEn: 'Accounting', path: '/dashboard/erp/accounting', key: 'erp-accounting' },
      { icon: Package, labelAr: 'المخزون', labelEn: 'Inventory', path: '/dashboard/erp/inventory', key: 'erp-inventory' },
      { icon: Users, labelAr: 'الموارد البشرية', labelEn: 'HR', path: '/dashboard/erp/hr', key: 'erp-hr' },
      { icon: Banknote, labelAr: 'مسيّر الرواتب', labelEn: 'Payroll', path: '/dashboard/hr/payroll', key: 'hr-payroll' },
      { icon: Award, labelAr: 'تقييم الأداء', labelEn: 'Performance', path: '/dashboard/hr/performance', key: 'hr-performance' },
      { icon: Activity, labelAr: 'إدارة الورديات', labelEn: 'Shifts', path: '/dashboard/hr/shifts', key: 'hr-shifts' },
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Chart', path: '/dashboard/hr/org-chart', key: 'hr-org-chart' },
      { icon: UserPlus, labelAr: 'نهاية الخدمة', labelEn: 'End of Service', path: '/dashboard/hr/end-of-service', key: 'hr-eos' },
      { icon: Inbox, labelAr: 'الخدمة الذاتية', labelEn: 'Self Service', path: '/dashboard/hr/self-service', key: 'hr-self-service' },
      { icon: ShoppingCart, labelAr: 'المشتريات والمبيعات', labelEn: 'Purchasing & Sales', path: '/dashboard/erp/purchasing-sales', key: 'erp-purchasing-sales' },
      { icon: BarChart3, labelAr: 'التقارير المالية', labelEn: 'Financial Reports', path: '/dashboard/erp/financial-dashboard', key: 'erp-financial-dashboard' },
      { icon: Activity, labelAr: 'الإيرادات والمصروفات', labelEn: 'Revenue & Expenses', path: '/dashboard/erp/revenue-expenses', key: 'erp-revenue-expenses' },
      { icon: Banknote, labelAr: 'تكلفة البضاعة', labelEn: 'COGS', path: '/dashboard/erp/cogs', key: 'erp-cogs' },
      { icon: GitCompareArrows, labelAr: 'المقارنات المالية', labelEn: 'Comparisons', path: '/dashboard/erp/financial-comparisons', key: 'erp-comparisons' },
      { icon: Umbrella, labelAr: 'التأمين الذكي', labelEn: 'Smart Insurance', path: '/dashboard/smart-insurance', key: 'smart-insurance', visibleFor: ['transporter'] },
      { icon: TrendingUp, labelAr: 'العقود الآجلة', labelEn: 'Futures Market', path: '/dashboard/futures-market', key: 'futures-market', visibleFor: ['transporter'] },
      { icon: Wallet, labelAr: 'المحفظة الرقمية', labelEn: 'Digital Wallet', path: '/dashboard/digital-wallet', key: 'digital-wallet', visibleFor: ['transporter'] },
    ],
  },

  // ═══════════════ 13. التقارير والتحليلات (مدمج: تقارير + سجلات نفايات + بيئة) ═══════════════
  {
    id: 'reports-analytics',
    icon: BarChart3,
    labelAr: 'التقارير والتحليلات',
    labelEn: 'Reports & Analytics',
    visibleFor: [],
    items: [
      { icon: BarChart3, labelAr: 'التقارير', labelEn: 'Reports', path: '/dashboard/reports', key: 'reports' },
      { icon: FileText, labelAr: 'تقارير الشحنات', labelEn: 'Shipment Reports', path: '/dashboard/shipment-reports', key: 'shipment-reports' },
      { icon: ClipboardList, labelAr: 'التقرير التجميعي', labelEn: 'Aggregate Report', path: '/dashboard/aggregate-report', key: 'aggregate-report' },
      { icon: BookOpen, labelAr: 'دليل التقارير', labelEn: 'Reports Guide', path: '/dashboard/reports-guide', key: 'reports-guide' },
      { icon: FileSpreadsheet, labelAr: 'سجل غير خطرة', labelEn: 'Non-Hazardous', path: '/dashboard/non-hazardous-register', key: 'non-hazardous' },
      { icon: AlertTriangle, labelAr: 'سجل خطرة', labelEn: 'Hazardous', path: '/dashboard/hazardous-register', key: 'hazardous' },
      { icon: Layers, labelAr: 'تصنيف النفايات', labelEn: 'Waste Types', path: '/dashboard/waste-types', key: 'waste-types' },
      { icon: Leaf, labelAr: 'البصمة الكربونية', labelEn: 'Carbon Footprint', path: '/dashboard/carbon-footprint', key: 'carbon-footprint' },
      { icon: TreePine, labelAr: 'الاستدامة البيئية', labelEn: 'Sustainability', path: '/dashboard/environmental-sustainability', key: 'environmental-sustainability' },
      { icon: Leaf, labelAr: 'تقارير ESG', labelEn: 'ESG Reports', path: '/dashboard/esg-reports', key: 'esg-reports' },
      { icon: Shield, labelAr: 'تقارير السلامة', labelEn: 'OHS Reports', path: '/dashboard/ohs-reports', key: 'ohs-reports' },
      { icon: BarChart3, labelAr: 'تحليل النفايات التفصيلي', labelEn: 'Waste Analysis', path: '/dashboard/detailed-waste-analysis', key: 'detailed-waste-analysis' },
      { icon: Activity, labelAr: 'خريطة تدفق النفايات', labelEn: 'Waste Flow', path: '/dashboard/waste-flow-heatmap', key: 'waste-flow-heatmap' },
    ],
  },

  // ═══════════════ 14. البورصة والتجارة ═══════════════
  {
    id: 'exchange-trade',
    icon: Store,
    labelAr: 'البورصة والتجارة',
    labelEn: 'Exchange & Trade',
    visibleFor: ['transporter', 'recycler', 'admin'],
    items: [
      { icon: Store, labelAr: 'بورصة المخلفات', labelEn: 'Waste Exchange', path: '/dashboard/waste-exchange', key: 'waste-exchange' },
      { icon: Globe, labelAr: 'بورصة السلع العالمية', labelEn: 'Commodity Exchange', path: '/dashboard/commodity-exchange', key: 'commodity-exchange' },
    ],
  },

  // ═══════════════ 15. التواصل والطلبات (مدمج) ═══════════════
  {
    id: 'communication',
    icon: MessageCircle,
    labelAr: 'التواصل والطلبات',
    labelEn: 'Communication & Requests',
    visibleFor: [],
    items: [
      { icon: MessageCircle, labelAr: 'الرسائل', labelEn: 'Chat', path: '/dashboard/chat', key: 'chat', badgeKey: 'chat' },
      { icon: Video, labelAr: 'الاجتماعات المرئية', labelEn: 'Video Meetings', path: '/dashboard/meetings', key: 'meetings' },
      { icon: CircleDot, labelAr: 'الحالات', labelEn: 'Stories', path: '/dashboard/stories', key: 'stories' },
      { icon: Users, labelAr: 'بوابة العملاء', labelEn: 'Customer Portal', path: '/dashboard/customer-portal', key: 'customer-portal' },
      { icon: Send, labelAr: 'طلباتي', labelEn: 'My Requests', path: '/dashboard/my-requests', key: 'my-requests', badgeKey: 'my-requests' },
      { icon: Scale, labelAr: 'السجل التنظيمي', labelEn: 'Regulatory', path: '/dashboard/regulatory-updates', key: 'regulatory' },
      { icon: ClipboardList, labelAr: 'الخطط التشغيلية', labelEn: 'Plans', path: '/dashboard/operational-plans', key: 'operational-plans' },
      { icon: Users, labelAr: 'حسابات الشركاء', labelEn: 'Partner Accounts', path: '/dashboard/partner-accounts', key: 'partner-accounts', badgeKey: 'partner-accounts' },
    ],
  },

  // ═══════════════ 16. الخرائط والروابط السريعة (مدمج) ═══════════════
  {
    id: 'maps-links',
    icon: MapPin,
    labelAr: 'الخرائط والروابط',
    labelEn: 'Maps & Links',
    visibleFor: [],
    items: [
      { icon: Search, labelAr: 'مستكشف الخريطة', labelEn: 'Map Explorer', path: '/dashboard/map-explorer', key: 'map-explorer' },
      { icon: Bookmark, labelAr: 'المواقع المحفوظة', labelEn: 'Saved Locations', path: '/dashboard/saved-locations', key: 'saved-locations' },
      { icon: LinkIcon, labelAr: 'روابط الإيداع', labelEn: 'Deposit Links', path: '/dashboard/quick-deposit-links', key: 'quick-deposit-links' },
      { icon: Zap, labelAr: 'روابط الشحنات', labelEn: 'Shipment Links', path: '/dashboard/quick-shipment-links', key: 'quick-shipment-links' },
      { icon: Truck, labelAr: 'روابط السائقين', labelEn: 'Driver Links', path: '/dashboard/quick-driver-links', key: 'quick-driver-links' },
      { icon: Shield, labelAr: 'روابط الوصول المحدد', labelEn: 'Scoped Access', path: '/dashboard/scoped-access-links', key: 'scoped-access-links' },
    ],
  },

  // ═══════════════ 17. أدوات ذكية (مدمج: AI + إنجازات + تعلم) ═══════════════
  {
    id: 'smart-tools',
    icon: Brain,
    labelAr: 'أدوات ذكية وتعلّم',
    labelEn: 'Smart Tools & Learning',
    visibleFor: [],
    items: [
      { icon: Brain, labelAr: 'أدوات الذكاء الاصطناعي', labelEn: 'AI Tools', path: '/dashboard/ai-tools', key: 'ai-tools' },
      { icon: Trophy, labelAr: 'نظام الإنجازات', labelEn: 'Gamification', path: '/dashboard/gamification', key: 'gamification' },
      { icon: Award, labelAr: 'شهادات التميز', labelEn: 'Certificates', path: '/dashboard/pride-certificates', key: 'pride-certificates' },
      { icon: GraduationCap, labelAr: 'المركز التعليمي', labelEn: 'Learning Center', path: '/dashboard/learning-center', key: 'learning-center' },
      { icon: BookOpen, labelAr: 'دليل المستخدم', labelEn: 'User Guide', path: '/dashboard/user-guide', key: 'user-guide' },
      { icon: FileText, labelAr: 'مركز الملاحظات', labelEn: 'Notes', path: '/dashboard/notes', key: 'notes-center' },
    ],
  },

  // ═══════════════ 18. إدارة النظام (أدمن فقط) ═══════════════
  {
    id: 'admin-panel',
    icon: Shield,
    labelAr: 'إدارة النظام',
    labelEn: 'System Admin',
    visibleFor: ['admin'],
    items: [
      { icon: Brain, labelAr: 'العين الذكية', labelEn: 'Smart Eye', path: '/dashboard/smart-insights', key: 'smart-insights' },
      { icon: Shield, labelAr: 'مراجعة التسجيل', labelEn: 'Onboarding', path: '/dashboard/onboarding-review', key: 'onboarding-review' },
      { icon: Activity, labelAr: 'حالة النظام', labelEn: 'System Status', path: '/dashboard/system-status', key: 'system-status' },
      { icon: Activity, labelAr: 'نظرة عامة', labelEn: 'System Overview', path: '/dashboard/system-overview', key: 'system-overview' },
      { icon: CreditCard, labelAr: 'الإيرادات والاشتراكات', labelEn: 'Revenue', path: '/dashboard/admin-revenue', key: 'admin-revenue' },
      { icon: Settings, labelAr: 'أوامر النظام', labelEn: 'Commands', path: '/dashboard/system-commands', key: 'system-commands' },
      { icon: Newspaper, labelAr: 'إدارة الأخبار', labelEn: 'News', path: '/dashboard/news-manager', key: 'news-manager' },
      { icon: BookOpen, labelAr: 'إدارة المدونة', labelEn: 'Blog', path: '/dashboard/blog-manager', key: 'blog-manager' },
      { icon: MessageCircle, labelAr: 'إدارة التعليقات', labelEn: 'Testimonials', path: '/dashboard/testimonials-management', key: 'testimonials-management' },
      { icon: CheckSquare, labelAr: 'موافقات الشركات', labelEn: 'Approvals', path: '/dashboard/company-approvals', key: 'company-approvals', badgeKey: 'company-approvals' },
      { icon: Building2, labelAr: 'إدارة الشركات', labelEn: 'Companies', path: '/dashboard/company-management', key: 'company-management' },
      { icon: UserPlus, labelAr: 'موافقات السائقين', labelEn: 'Driver Approvals', path: '/dashboard/driver-approvals', key: 'driver-approvals', badgeKey: 'driver-approvals' },
      { icon: FileText, labelAr: 'وثائق المنظمات', labelEn: 'Org Docs', path: '/dashboard/organization-documents', key: 'org-docs', badgeKey: 'org-docs' },
      { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'admin-driver-tracking' },
      { icon: Truck, labelAr: 'خريطة السائقين', labelEn: 'Drivers Map', path: '/dashboard/admin-drivers-map', key: 'admin-drivers-map' },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'admin-certs', badgeKey: 'admin-certs' },
      { icon: Video, labelAr: 'مولد الفيديو', labelEn: 'Video Gen', path: '/dashboard/video-generator', key: 'video-gen' },
      { icon: TreePine, labelAr: 'سوق الخشب', labelEn: 'Wood Market', path: '/dashboard/wood-market', key: 'wood-market' },
      { icon: Scale, labelAr: 'لوحة الرقابة', labelEn: 'Regulator', path: '/dashboard/regulator', key: 'regulator' },
      { icon: Building2, labelAr: 'الشركات المنظمة', labelEn: 'Regulated', path: '/dashboard/regulated-companies', key: 'regulated-companies' },
      { icon: LinkIcon, labelAr: 'إدارة API', labelEn: 'API Management', path: '/dashboard/api', key: 'api-management' },
      { icon: Shield, labelAr: 'اختبار الأمان', labelEn: 'Security Testing', path: '/dashboard/security-testing', key: 'security-testing' },
      { icon: Database, labelAr: 'تحسين قاعدة البيانات', labelEn: 'DB Optimization', path: '/dashboard/db-optimization', key: 'db-optimization' },
      { icon: BarChart3, labelAr: 'تحليلات متقدمة', labelEn: 'Analytics', path: '/dashboard/advanced-analytics', key: 'advanced-analytics' },
      { icon: Lock, labelAr: 'امتثال GDPR', labelEn: 'GDPR', path: '/dashboard/gdpr-compliance', key: 'gdpr-compliance' },
      { icon: BookOpen, labelAr: 'بروشور المنصة', labelEn: 'Brochure', path: '/dashboard/platform-brochure', key: 'platform-brochure' },
      { icon: FileText, labelAr: 'إدارة الإفادات', labelEn: 'Attestations', path: '/dashboard/admin-attestations', key: 'admin-attestations' },
      { icon: Monitor, labelAr: 'سكرين شوت', labelEn: 'Screenshots', path: '/dashboard/system-screenshots', key: 'system-screenshots' },
      { icon: Globe, labelAr: 'إدارة الصفحة الرئيسية', labelEn: 'Homepage Manager', path: '/dashboard/homepage-manager', key: 'homepage-manager' },
      { icon: Send, labelAr: 'إدارة WaPilot', labelEn: 'WaPilot', path: '/dashboard/wapilot', key: 'wapilot' },
    ],
  },

  // ═══════════════ 19. النظام والدعم ═══════════════
  {
    id: 'system-support',
    icon: Settings,
    labelAr: 'النظام والدعم',
    labelEn: 'System & Support',
    visibleFor: [],
    items: [
      { icon: Headphones, labelAr: 'الدعم الفني', labelEn: 'Support', path: '/dashboard/support', key: 'support' },
      { icon: Bell, labelAr: 'الإشعارات', labelEn: 'Notifications', path: '/dashboard/notifications', key: 'notifications' },
      { icon: Activity, labelAr: 'حالة النظام', labelEn: 'System Status', path: '/dashboard/system-status', key: 'all-system-status' },
      { icon: Wallet, labelAr: 'إدارة الاشتراك', labelEn: 'Subscription', path: '/dashboard/subscription', key: 'subscription' },
      { icon: WifiOff, labelAr: 'وضع بدون إنترنت', labelEn: 'Offline Mode', path: '/dashboard/offline-mode', key: 'offline-mode' },
      { icon: Info, labelAr: 'عن المنصة', labelEn: 'About', path: '/dashboard/about-platform', key: 'about-platform' },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', path: '/dashboard/settings', key: 'settings' },
      { icon: Zap, labelAr: 'الإجراءات التلقائية', labelEn: 'Auto Actions', path: '/dashboard/auto-actions', key: 'auto-actions' },
    ],
  },
];

/**
 * Get visible sidebar groups for a given org type.
 * Filters groups by visibleFor and filters items within groups.
 */
export function getGroupsForOrgType(orgType: string, isAdmin: boolean): SidebarGroupConfig[] {
  return sidebarGroups.filter(group => {
    if (group.visibleFor.length === 0) return true;
    if (isAdmin && group.visibleFor.includes('admin')) return true;
    return group.visibleFor.includes(orgType);
  }).map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.visibleFor || item.visibleFor.length === 0) return true;
      if (isAdmin) return true;
      return item.visibleFor.includes(orgType);
    }),
  }));
}

/**
 * Get all group IDs in default order for a given org type.
 */
export function getDefaultGroupOrder(orgType: string, isAdmin: boolean): string[] {
  return getGroupsForOrgType(orgType, isAdmin).map(g => g.id);
}
