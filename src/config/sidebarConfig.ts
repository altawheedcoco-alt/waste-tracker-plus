/**
 * Sidebar menu configuration with smart grouping per organization type.
 * Merges similar sections and filters irrelevant items per role.
 */
import {
  LayoutDashboard, Package, Truck, Users, Settings, Bell, Building2, Recycle, Wrench,
  User, MapPin, BarChart3, FileText, Handshake, BadgeCheck, Scale, FolderCheck,
  Search, ClipboardList, FileSpreadsheet, AlertTriangle, Layers, Send,
  MessageCircle, Newspaper, Rss, Info, BookOpen, Banknote, Activity, Headphones,
  Bookmark, Link as LinkIcon, Zap, Fingerprint, Brain, Sparkles, Shield,
  CircleDot, Factory, WifiOff, FileCheck, Calculator, Wallet, ShoppingCart,
  Boxes, GitCompareArrows, FolderOpen, Inbox, TreePine, Store, GraduationCap,
  Award, Receipt, Leaf, TrendingUp, Lock, Database, Trophy, Globe, Bot, Gauge,
  Eye, Umbrella, PenTool, Network, FileSignature, ClipboardCheck, Printer,
  CreditCard, Monitor, Plus, CheckSquare, UserPlus, Video, HardHat, Upload,
  CalendarClock, Gauge as GaugeIcon,
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
  /** نوع الارتباط الوظيفي */
  bindingType?: import('@/types/bindingTypes').BindingType;
  /** Required employee permissions to see this item (any one suffices) */
  requiredPermissions?: string[];
}

type OrgType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'regulator' | 'consultant' | 'consulting_office' | 'admin' | 'driver';

/**
 * Top-level standalone items (always visible, not in groups)
 */
export const standaloneItems: SidebarItemConfig[] = [
  { icon: LayoutDashboard, labelAr: 'لوحة التحكم', labelEn: 'Dashboard', path: '/dashboard', key: 'dashboard' },
  { icon: User, labelAr: 'مساحة العمل الشخصية', labelEn: 'My Workspace', path: '/dashboard/my-workspace', key: 'my-workspace' },
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
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Structure', path: '/dashboard/org-structure', key: 'org-structure', requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Users, labelAr: 'إدارة الموظفين', labelEn: 'Employees', path: '/dashboard/employees', key: 'employees', requiredPermissions: ['manage_members'] },
      { icon: Users, labelAr: 'بيانات الفريق', labelEn: 'Team Data', path: '/dashboard/team-credentials', key: 'other-team', requiredPermissions: ['manage_members'] },
      { icon: Handshake, labelAr: 'الشركاء', labelEn: 'Partners', path: '/dashboard/partners', key: 'partners', badgeKey: 'partners', requiredPermissions: ['manage_partners', 'view_partner_data'] },
      { icon: Rss, labelAr: 'آخر أخبار الشركاء', labelEn: 'Partners Timeline', path: '/dashboard/partners-timeline', key: 'partners-timeline', badgeKey: 'partners-timeline', requiredPermissions: ['view_partner_data'] },
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
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'generator-shipments', badgeKey: 'generator-shipments', requiredPermissions: ['view_shipments', 'create_shipments', 'manage_shipments'] },
      { icon: MapPin, labelAr: 'مركز التتبع المباشر', labelEn: 'Live Tracking', path: '/dashboard/tracking-center', key: 'generator-tracking-center', requiredPermissions: ['view_shipments'] },
      { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'generator-rejected', requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: CalendarClock, labelAr: 'شحنات متكررة', labelEn: 'Recurring Shipments', path: '/dashboard/recurring-shipments', key: 'recurring-shipments', requiredPermissions: ['create_shipments', 'manage_shipments'] },
      { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/generator-receipts', key: 'generator-receipts', requiredPermissions: ['view_shipments'] },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'generator-certs', badgeKey: 'generator-certs', requiredPermissions: ['view_shipments'] },
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
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/transporter-shipments', key: 'transporter-shipments', badgeKey: 'transporter-shipments', requiredPermissions: ['view_shipments', 'create_shipments', 'manage_shipments'] },
      { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'transporter-rejected', requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/transporter-receipts', key: 'transporter-receipts', requiredPermissions: ['view_shipments'] },
      { icon: Scale, labelAr: 'سجل الكميات الخارجية', labelEn: 'External Records', path: '/dashboard/external-records', key: 'transporter-external-records', requiredPermissions: ['view_shipments'] },
      { icon: Scale, labelAr: 'الوزنات الجماعية', labelEn: 'Bulk Weight Entries', path: '/dashboard/bulk-weight-entries', key: 'transporter-bulk-weight', requiredPermissions: ['manage_shipments'] },
      { icon: Fingerprint, labelAr: 'أنماط الجيلوش', labelEn: 'Guilloche', path: '/dashboard/guilloche-patterns', key: 'transporter-guilloche' },
      { icon: Inbox, labelAr: 'طلبات الجمع', labelEn: 'Collection Requests', path: '/dashboard/collection-requests', key: 'collection-requests', requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: Plus, labelAr: 'إنشاء شحنة يدوية', labelEn: 'Manual Shipment', path: '/dashboard/manual-shipment', key: 'manual-shipment', requiredPermissions: ['create_shipments'] },
      { icon: FileText, labelAr: 'أرشيف النماذج اليدوية', labelEn: 'Manual Drafts', path: '/dashboard/manual-shipment-drafts', key: 'manual-shipment-drafts', requiredPermissions: ['view_shipments'] },
      { icon: Printer, labelAr: 'مركز الطباعة', labelEn: 'Print Center', path: '/dashboard/print-center', key: 'transporter-print-center', requiredPermissions: ['view_shipments', 'export_reports'] },
    ],
  },

  // ═══════════════ 4A. الأسطول والتتبع (ناقل فقط) ═══════════════
  {
    id: 'fleet-tracking',
    icon: Truck,
    labelAr: 'الأسطول والتتبع',
    labelEn: 'Fleet & Tracking',
    visibleFor: ['transporter'],
    items: [
      { icon: MapPin, labelAr: 'مركز التتبع المباشر', labelEn: 'Live Tracking Center', path: '/dashboard/tracking-center', key: 'tracking-center', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments', 'view_drivers'] },
      { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'transporter-driver-tracking', bindingType: 'internal' as const, requiredPermissions: ['view_drivers', 'manage_drivers'] },
      { icon: Truck, labelAr: 'خريطة المسارات', labelEn: 'Routes Map', path: '/dashboard/shipment-routes', key: 'shipment-routes', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: Boxes, labelAr: 'إدارة الحاويات', labelEn: 'Container Management', path: '/dashboard?tab=fleet', key: 'container-management', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: GitCompareArrows, labelAr: 'إعادة تعيين المركبات', labelEn: 'Vehicle Reassignment', path: '/dashboard?tab=fleet', key: 'vehicle-reassignment', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Wrench, labelAr: 'الصيانة الوقائية', labelEn: 'Preventive Maintenance', path: '/dashboard/preventive-maintenance', key: 'preventive-maintenance', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
    ],
  },

  // ═══════════════ 4B. إدارة القوى العاملة (ناقل فقط) ═══════════════
  {
    id: 'workforce-management',
    icon: Users,
    labelAr: 'إدارة القوى العاملة',
    labelEn: 'Workforce Management',
    visibleFor: ['transporter'],
    items: [
      { icon: Users, labelAr: 'إدارة السائقين', labelEn: 'Drivers', path: '/dashboard/transporter-drivers', key: 'transporter-drivers', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers', 'view_drivers'] },
      { icon: Shield, labelAr: 'تصاريح السائقين', labelEn: 'Driver Permits', path: '/dashboard/driver-permits', key: 'driver-permits', bindingType: 'admin' as const, requiredPermissions: ['manage_drivers'] },
      { icon: CalendarClock, labelAr: 'جدولة الورديات', labelEn: 'Shift Scheduler', path: '/dashboard?tab=intelligence', key: 'shift-scheduler', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: GraduationCap, labelAr: 'أكاديمية السائقين', labelEn: 'Driver Academy', path: '/dashboard/driver-academy', key: 'driver-academy', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Trophy, labelAr: 'مكافآت السائقين', labelEn: 'Driver Rewards', path: '/dashboard/driver-rewards', key: 'driver-rewards', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
    ],
  },

  // ═══════════════ 4C. المركز التنظيمي (ناقل فقط) ═══════════════
  {
    id: 'transporter-regulatory',
    icon: Shield,
    labelAr: 'المركز التنظيمي',
    labelEn: 'Regulatory Center',
    visibleFor: ['transporter'],
    items: [
      { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations', key: 'transporter-declarations', bindingType: 'admin' as const },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'transporter-certs', badgeKey: 'transporter-certs', bindingType: 'admin' as const },
      { icon: FileCheck, labelAr: 'تجديد التراخيص', labelEn: 'License Renewal', path: '/dashboard?tab=licenses', key: 'transporter-license-renewal', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الإقرارات الدورية', labelEn: 'Periodic Declarations', path: '/dashboard?tab=declarations', key: 'transporter-periodic-declarations', bindingType: 'admin' as const },
      { icon: ClipboardList, labelAr: 'الخطة السنوية', labelEn: 'Annual Plan', path: '/dashboard?tab=annual_plan', key: 'transporter-annual-plan', bindingType: 'admin' as const },
      { icon: HardHat, labelAr: 'السلامة والصحة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety', key: 'transporter-safety', bindingType: 'hybrid' as const },
    ],
  },


  {
    id: 'recycler-ops',
    icon: Recycle,
    labelAr: 'الشحنات والشهادات',
    labelEn: 'Shipments & Certs',
    visibleFor: ['recycler'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'recycler-shipments', badgeKey: 'recycler-shipments' },
      { icon: MapPin, labelAr: 'مركز التتبع المباشر', labelEn: 'Live Tracking', path: '/dashboard/tracking-center', key: 'recycler-tracking-center' },
      { icon: AlertTriangle, labelAr: 'الشحنات المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'recycler-rejected' },
      { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Delivery Declarations', path: '/dashboard/delivery-declarations', key: 'recycler-declarations' },
      { icon: FolderCheck, labelAr: 'إصدار شهادات التدوير', labelEn: 'Issue Certs', path: '/dashboard/issue-recycling-certificates', key: 'issue-certs', badgeKey: 'issue-certs' },
      { icon: Factory, labelAr: 'لوحة الإنتاج', labelEn: 'Production Dashboard', path: '/dashboard/production', key: 'production-dashboard' },
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
      { icon: MapPin, labelAr: 'مركز التتبع المباشر', labelEn: 'Live Tracking', path: '/dashboard/tracking-center', key: 'disposal-tracking-center' },
      { icon: Package, labelAr: 'الطلبات الواردة', labelEn: 'Incoming Requests', path: '/dashboard/disposal/incoming-requests', key: 'disposal-incoming' },
      { icon: FolderCheck, labelAr: 'شهادات التخلص', labelEn: 'Disposal Certs', path: '/dashboard/disposal/certificates', key: 'disposal-certs' },
      { icon: BarChart3, labelAr: 'تقارير التخلص', labelEn: 'Disposal Reports', path: '/dashboard/disposal/reports', key: 'disposal-reports' },
      { icon: Factory, labelAr: 'مرافق التخلص', labelEn: 'Facilities', path: '/dashboard/disposal-facilities', key: 'disposal-facilities' },
      { icon: HardHat, labelAr: 'السلامة والصحة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety', key: 'disposal-safety' },
      { icon: GaugeIcon, labelAr: 'إدارة السعة', labelEn: 'Capacity Management', path: '/dashboard/capacity-management', key: 'capacity-management' },
    ],
  },

  // ═══════════════ 7. مركز القيادة الرقابي (مشترك لجميع الجهات الرقابية) ═══════════════
  {
    id: 'regulator-command',
    icon: Shield,
    labelAr: 'الرقابة والإشراف',
    labelEn: 'Oversight & Supervision',
    visibleFor: ['regulator'],
    items: [
      { icon: BarChart3, labelAr: 'لوحة المؤشرات الرقابية', labelEn: 'Oversight Dashboard', path: '/dashboard/regulator', key: 'regulator-dashboard' },
      { icon: Building2, labelAr: 'سجل الجهات الخاضعة للرقابة', labelEn: 'Supervised Entities', path: '/dashboard/regulator?tab=organizations', key: 'regulator-orgs' },
      { icon: Search, labelAr: 'التحقق من المستندات والتراخيص', labelEn: 'Document Verification', path: '/dashboard/regulator?tab=verify', key: 'regulator-verify' },
      { icon: Scale, labelAr: 'نطاق الاختصاص القانوني', labelEn: 'Legal Jurisdiction', path: '/dashboard/regulator?tab=jurisdiction', key: 'regulator-jurisdiction' },
    ],
  },

  // ═══════════════ 7A. التفتيش والمخالفات ═══════════════
  {
    id: 'regulator-enforcement',
    icon: AlertTriangle,
    labelAr: 'التفتيش والمخالفات',
    labelEn: 'Inspections & Violations',
    visibleFor: ['regulator'],
    items: [
      { icon: ClipboardCheck, labelAr: 'حملات التفتيش الميداني', labelEn: 'Field Inspections', path: '/dashboard/regulator?tab=inspections', key: 'regulator-inspections' },
      { icon: AlertTriangle, labelAr: 'سجل المخالفات', labelEn: 'Violations Registry', path: '/dashboard/regulator?tab=violations', key: 'regulator-violations' },
      { icon: FileText, labelAr: 'الإنذارات والتحذيرات', labelEn: 'Warnings & Notices', path: '/dashboard/regulator?tab=warnings', key: 'regulator-warnings' },
      { icon: Scale, labelAr: 'القرارات والجزاءات', labelEn: 'Penalties & Sanctions', path: '/dashboard/regulator?tab=penalties', key: 'regulator-penalties' },
      { icon: Activity, labelAr: 'متابعة تنفيذ الجزاءات', labelEn: 'Enforcement Tracking', path: '/dashboard/regulator?tab=enforcement', key: 'regulator-enforcement' },
      { icon: AlertTriangle, labelAr: 'نظام المخالفات المتقدم', labelEn: 'Violations System', path: '/dashboard/regulatory-violations', key: 'regulatory-violations' },
    ],
  },

  // ═══════════════ 7B. التراخيص والإفادات ═══════════════
  {
    id: 'regulator-licensing',
    icon: FileCheck,
    labelAr: 'التراخيص والإفادات',
    labelEn: 'Licenses & Attestations',
    visibleFor: ['regulator'],
    items: [
      { icon: FileCheck, labelAr: 'إصدار وتجديد التراخيص', labelEn: 'License Management', path: '/dashboard/regulator?tab=licenses', key: 'regulator-licenses' },
      { icon: FileSpreadsheet, labelAr: 'طلبات التراخيص الواردة', labelEn: 'License Applications', path: '/dashboard/regulator?tab=license-apps', key: 'regulator-license-apps' },
      { icon: FileText, labelAr: 'إصدار الإفادات الرسمية', labelEn: 'Official Attestations', path: '/dashboard/regulator?tab=attestations', key: 'regulator-attestations' },
      { icon: AlertTriangle, labelAr: 'تراخيص قاربت على الانتهاء', labelEn: 'Expiring Licenses', path: '/dashboard/regulator?tab=expiring', key: 'regulator-expiring' },
    ],
  },

  // ═══════════════ 7C. أدوات WMRA (جهاز تنظيم إدارة المخلفات) ═══════════════
  {
    id: 'wmra-tools',
    icon: Recycle,
    labelAr: 'رقابة المخلفات (WMRA)',
    labelEn: 'Waste Oversight (WMRA)',
    visibleFor: ['regulator'],
    items: [
      { icon: Recycle, labelAr: 'مراقبة سلسلة الحيازة', labelEn: 'Chain of Custody Monitor', path: '/dashboard/regulator-wmra?tab=waste-chain', key: 'wmra-waste-chain' },
      { icon: Package, labelAr: 'تدقيق بيانات المانيفست', labelEn: 'Manifest Audit', path: '/dashboard/regulator-wmra?tab=manifests', key: 'wmra-manifests' },
      { icon: Layers, labelAr: 'مراجعة تصنيف المخلفات', labelEn: 'Waste Classification Review', path: '/dashboard/waste-types', key: 'wmra-waste-types' },
      { icon: Activity, labelAr: 'خريطة تدفق المخلفات', labelEn: 'Waste Flow Map', path: '/dashboard/waste-flow-heatmap', key: 'wmra-waste-flow' },
      { icon: FileText, labelAr: 'تقارير الإقرارات الدورية', labelEn: 'Periodic Declaration Reports', path: '/dashboard/regulator-wmra?tab=declarations', key: 'wmra-declarations' },
      { icon: Leaf, labelAr: 'مؤشرات الاستدامة', labelEn: 'Sustainability KPIs', path: '/dashboard/environmental-sustainability', key: 'wmra-sustainability' },
    ],
  },

  // ═══════════════ 7D. أدوات EEAA (جهاز شؤون البيئة) ═══════════════
  {
    id: 'eeaa-tools',
    icon: Leaf,
    labelAr: 'الرقابة البيئية (EEAA)',
    labelEn: 'Environmental Oversight (EEAA)',
    visibleFor: ['regulator'],
    items: [
      { icon: Leaf, labelAr: 'الرصد البيئي والتلوث', labelEn: 'Pollution Monitoring', path: '/dashboard/regulator-eeaa?tab=monitoring', key: 'eeaa-monitoring' },
      { icon: AlertTriangle, labelAr: 'مراجعة دراسات الأثر البيئي', labelEn: 'EIA Reviews', path: '/dashboard/regulator-eeaa?tab=eia', key: 'eeaa-eia' },
      { icon: FileSpreadsheet, labelAr: 'الموافقات البيئية المعلقة', labelEn: 'Pending Approvals', path: '/dashboard/regulator-eeaa?tab=approvals', key: 'eeaa-approvals' },
      { icon: Activity, labelAr: 'الانبعاثات والملوثات', labelEn: 'Emissions Tracking', path: '/dashboard/regulator-eeaa?tab=emissions', key: 'eeaa-emissions' },
      { icon: BarChart3, labelAr: 'البصمة الكربونية', labelEn: 'Carbon Footprint', path: '/dashboard/carbon-footprint', key: 'eeaa-carbon' },
    ],
  },

  // ═══════════════ 7E. أدوات LTRA (جهاز تنظيم النقل البري) ═══════════════
  {
    id: 'ltra-tools',
    icon: Truck,
    labelAr: 'رقابة النقل (LTRA)',
    labelEn: 'Transport Oversight (LTRA)',
    visibleFor: ['regulator'],
    items: [
      { icon: Truck, labelAr: 'مراقبة أساطيل النقل المرخصة', labelEn: 'Licensed Fleet Oversight', path: '/dashboard/regulator-ltra?tab=fleet', key: 'ltra-fleet' },
      { icon: Users, labelAr: 'تدقيق رخص السائقين', labelEn: 'Driver License Audit', path: '/dashboard/regulator-ltra?tab=drivers', key: 'ltra-drivers' },
      { icon: Shield, labelAr: 'تصاريح نقل المواد الخطرة', labelEn: 'Hazmat Transport Permits', path: '/dashboard/regulator-ltra?tab=hazmat', key: 'ltra-hazmat' },
      { icon: FileCheck, labelAr: 'ترخيص وفحص المركبات', labelEn: 'Vehicle Inspection', path: '/dashboard/regulator-ltra?tab=vehicles', key: 'ltra-vehicles' },
      { icon: BarChart3, labelAr: 'بلاغات الحوادث والمخالفات', labelEn: 'Incident Reports', path: '/dashboard/regulator-ltra?tab=incidents', key: 'ltra-incidents' },
    ],
  },

  // ═══════════════ 7F. أدوات IDA (الهيئة العامة للتنمية الصناعية) ═══════════════
  {
    id: 'ida-tools',
    icon: Factory,
    labelAr: 'الرقابة الصناعية (IDA)',
    labelEn: 'Industrial Oversight (IDA)',
    visibleFor: ['regulator'],
    items: [
      { icon: Factory, labelAr: 'السجل الصناعي الموحد', labelEn: 'Industrial Registry', path: '/dashboard/regulator-ida?tab=registry', key: 'ida-registry' },
      { icon: FileCheck, labelAr: 'تدقيق تراخيص التشغيل', labelEn: 'Operating License Audit', path: '/dashboard/regulator-ida?tab=licenses', key: 'ida-licenses' },
      { icon: HardHat, labelAr: 'التفتيش على السلامة الصناعية', labelEn: 'Industrial Safety Inspection', path: '/dashboard/regulator-ida?tab=safety', key: 'ida-safety' },
      { icon: ClipboardCheck, labelAr: 'جولات التفتيش الصناعي', labelEn: 'Industrial Inspections', path: '/dashboard/regulator-ida?tab=inspections', key: 'ida-inspections' },
      { icon: Building2, labelAr: 'قاعدة بيانات المنشآت', labelEn: 'Facilities Database', path: '/dashboard/regulator-ida?tab=facilities', key: 'ida-facilities' },
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
      { icon: HardHat, labelAr: 'السلامة والصحة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety', key: 'consultant-safety' },
      { icon: Building2, labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/consultant-clients', key: 'consultant-clients' },
      { icon: Award, labelAr: 'الشهادات والتراخيص', labelEn: 'Certifications', path: '/dashboard/consultant-certifications', key: 'consultant-certifications' },
      { icon: Users, labelAr: 'بوابة الاستشاري', labelEn: 'Consultant Portal', path: '/dashboard/consultant-portal', key: 'consultant-portal' },
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
      { icon: CheckSquare, labelAr: 'لوحة المهام', labelEn: 'Task Board', path: '/dashboard/task-board', key: 'task-board' },
      { icon: ClipboardList, labelAr: 'سجل الأنشطة', labelEn: 'Activity Log', path: '/dashboard/activity-log', key: 'activity-log' },
      { icon: FileText, labelAr: 'السجلات الخارجية', labelEn: 'External Records', path: '/dashboard/external-records', key: 'external-records' },
      { icon: MapPin, labelAr: 'إعدادات GPS', labelEn: 'GPS Settings', path: '/dashboard/gps-settings', key: 'gps-settings' },
      { icon: Zap, labelAr: 'إعدادات IoT', labelEn: 'IoT Settings', path: '/dashboard/iot-settings', key: 'iot-settings' },
      { icon: Eye, labelAr: 'الكاميرات والتحقق', labelEn: 'Cameras & Verification', path: '/dashboard/cameras', key: 'cameras', visibleFor: ['recycler', 'disposal', 'generator', 'transporter'] },
    ],
  },

  // ═══════════════ 11. مركز المستندات (موحد) ═══════════════
  {
    id: 'docs-contracts',
    icon: FolderOpen,
    labelAr: 'مركز المستندات',
    labelEn: 'Document Center',
    visibleFor: [],
    items: [
      { icon: Database, labelAr: 'بياناتي', labelEn: 'My Data', path: '/dashboard/my-data', key: 'my-data' },
      { icon: FolderOpen, labelAr: 'مركز المستندات', labelEn: 'Document Center', path: '/dashboard/document-center', key: 'document-center' },
      { icon: Upload, labelAr: 'رفع المستندات', labelEn: 'Upload Documents', path: '/dashboard/document-center?tab=upload', key: 'doc-upload' },
      { icon: Scale, labelAr: 'المستندات التنظيمية', labelEn: 'Regulatory Documents', path: '/dashboard/regulatory-documents', key: 'regulatory-documents',
        visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office', 'admin'] },
      { icon: FolderOpen, labelAr: 'الأرشيف', labelEn: 'Archive', path: '/dashboard/document-center?tab=archive', key: 'doc-center-archive' },
      { icon: PenTool, labelAr: 'التوقيعات والأختام', labelEn: 'Signatures & Stamps', path: '/dashboard/document-center?tab=signatures', key: 'doc-center-signatures' },
      { icon: CircleDot, labelAr: 'QR وباركود', labelEn: 'QR & Barcode', path: '/dashboard/document-center?tab=qr-barcode', key: 'doc-center-qr' },
      { icon: Shield, labelAr: 'التحقق والأمان', labelEn: 'Verification', path: '/dashboard/document-center?tab=verification', key: 'doc-center-verification' },
      { icon: Printer, labelAr: 'الطباعة والتصدير', labelEn: 'Print & Export', path: '/dashboard/document-center?tab=print', key: 'doc-center-print' },
      { icon: FileSignature, labelAr: 'العقود', labelEn: 'Contracts', path: '/dashboard/document-center?tab=contracts', key: 'doc-center-contracts' },
      { icon: Award, labelAr: 'الشهادات', labelEn: 'Certificates', path: '/dashboard/document-center?tab=certificates', key: 'doc-center-certificates' },
      { icon: Receipt, labelAr: 'الفواتير', labelEn: 'Invoices', path: '/dashboard/document-center?tab=invoices', key: 'doc-center-invoices' },
      { icon: FileText, labelAr: 'القوالب والنماذج', labelEn: 'Templates', path: '/dashboard/document-center?tab=templates', key: 'doc-center-templates' },
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
      { icon: Calculator, labelAr: 'المحاسبة', labelEn: 'Accounting', path: '/dashboard/erp/accounting', key: 'erp-accounting', requiredPermissions: ['view_accounts', 'view_account_details'] },
      { icon: Package, labelAr: 'المخزون', labelEn: 'Inventory', path: '/dashboard/erp/inventory', key: 'erp-inventory', requiredPermissions: ['view_accounts'] },
      { icon: Users, labelAr: 'الموارد البشرية', labelEn: 'HR', path: '/dashboard/erp/hr', key: 'erp-hr', requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Banknote, labelAr: 'مسيّر الرواتب', labelEn: 'Payroll', path: '/dashboard/hr/payroll', key: 'hr-payroll', requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Award, labelAr: 'تقييم الأداء', labelEn: 'Performance', path: '/dashboard/hr/performance', key: 'hr-performance', requiredPermissions: ['manage_members'] },
      { icon: Activity, labelAr: 'إدارة الورديات', labelEn: 'Shifts', path: '/dashboard/hr/shifts', key: 'hr-shifts', requiredPermissions: ['manage_members'] },
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Chart', path: '/dashboard/hr/org-chart', key: 'hr-org-chart' },
      { icon: UserPlus, labelAr: 'نهاية الخدمة', labelEn: 'End of Service', path: '/dashboard/hr/end-of-service', key: 'hr-eos', requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Inbox, labelAr: 'الخدمة الذاتية', labelEn: 'Self Service', path: '/dashboard/hr/self-service', key: 'hr-self-service' },
      { icon: ShoppingCart, labelAr: 'المشتريات والمبيعات', labelEn: 'Purchasing & Sales', path: '/dashboard/erp/purchasing-sales', key: 'erp-purchasing-sales', requiredPermissions: ['view_accounts', 'create_deposits'] },
      { icon: BarChart3, labelAr: 'التقارير المالية', labelEn: 'Financial Reports', path: '/dashboard/erp/financial-dashboard', key: 'erp-financial-dashboard', requiredPermissions: ['view_accounts', 'view_reports'] },
      { icon: Activity, labelAr: 'الإيرادات والمصروفات', labelEn: 'Revenue & Expenses', path: '/dashboard/erp/revenue-expenses', key: 'erp-revenue-expenses', requiredPermissions: ['view_accounts'] },
      { icon: Banknote, labelAr: 'تكلفة البضاعة', labelEn: 'COGS', path: '/dashboard/erp/cogs', key: 'erp-cogs', requiredPermissions: ['view_accounts'] },
      { icon: GitCompareArrows, labelAr: 'المقارنات المالية', labelEn: 'Comparisons', path: '/dashboard/erp/financial-comparisons', key: 'erp-comparisons', requiredPermissions: ['view_accounts', 'view_reports'] },
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
      { icon: BarChart3, labelAr: 'التقارير', labelEn: 'Reports', path: '/dashboard/reports', key: 'reports', requiredPermissions: ['view_reports', 'create_reports'] },
      { icon: FileText, labelAr: 'تقارير الشحنات', labelEn: 'Shipment Reports', path: '/dashboard/shipment-reports', key: 'shipment-reports', requiredPermissions: ['view_reports', 'view_shipments'] },
      { icon: ClipboardList, labelAr: 'التقرير التجميعي', labelEn: 'Aggregate Report', path: '/dashboard/aggregate-report', key: 'aggregate-report', requiredPermissions: ['view_reports'] },
      { icon: BookOpen, labelAr: 'دليل التقارير', labelEn: 'Reports Guide', path: '/dashboard/reports-guide', key: 'reports-guide', requiredPermissions: ['view_reports'] },
      { icon: FileSpreadsheet, labelAr: 'سجل غير خطرة', labelEn: 'Non-Hazardous', path: '/dashboard/non-hazardous-register', key: 'non-hazardous', requiredPermissions: ['view_reports', 'view_shipments'] },
      { icon: AlertTriangle, labelAr: 'سجل خطرة', labelEn: 'Hazardous', path: '/dashboard/hazardous-register', key: 'hazardous', requiredPermissions: ['view_reports', 'view_shipments'] },
      { icon: Layers, labelAr: 'تصنيف النفايات', labelEn: 'Waste Types', path: '/dashboard/waste-types', key: 'waste-types', requiredPermissions: ['view_reports'] },
      { icon: Leaf, labelAr: 'البصمة الكربونية', labelEn: 'Carbon Footprint', path: '/dashboard/carbon-footprint', key: 'carbon-footprint', requiredPermissions: ['view_reports'] },
      { icon: TreePine, labelAr: 'الاستدامة البيئية', labelEn: 'Sustainability', path: '/dashboard/environmental-sustainability', key: 'environmental-sustainability', requiredPermissions: ['view_reports'] },
      { icon: Leaf, labelAr: 'تقارير ESG', labelEn: 'ESG Reports', path: '/dashboard/esg-reports', key: 'esg-reports', requiredPermissions: ['view_reports'] },
      { icon: Shield, labelAr: 'تقارير السلامة', labelEn: 'OHS Reports', path: '/dashboard/ohs-reports', key: 'ohs-reports', requiredPermissions: ['view_reports'] },
      { icon: BarChart3, labelAr: 'تحليل النفايات التفصيلي', labelEn: 'Waste Analysis', path: '/dashboard/detailed-waste-analysis', key: 'detailed-waste-analysis', requiredPermissions: ['view_reports'] },
      { icon: Activity, labelAr: 'خريطة تدفق النفايات', labelEn: 'Waste Flow', path: '/dashboard/waste-flow-heatmap', key: 'waste-flow-heatmap', requiredPermissions: ['view_reports'] },
    ],
  },

  // ═══════════════ 14. البورصة والتجارة ═══════════════
  {
    id: 'exchange-trade',
    icon: Store,
    labelAr: 'البورصة والتجارة',
    labelEn: 'Exchange & Trade',
    visibleFor: [],
    items: [
      { icon: Store, labelAr: 'بورصة المخلفات', labelEn: 'Waste Exchange', path: '/dashboard/waste-exchange', key: 'waste-exchange' },
      { icon: Globe, labelAr: 'بورصة السلع العالمية', labelEn: 'Commodity Exchange', path: '/dashboard/commodity-exchange', key: 'commodity-exchange' },
      { icon: ShoppingCart, labelAr: 'سوق B2B', labelEn: 'B2B Marketplace', path: '/dashboard/b2b-marketplace', key: 'b2b-marketplace' },
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
      { icon: FileText, labelAr: 'عروض الأسعار', labelEn: 'Quotations', path: '/dashboard/quotations', key: 'quotations',
        visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'] },
      { icon: Scale, labelAr: 'السجل التنظيمي', labelEn: 'Regulatory', path: '/dashboard/regulatory-updates', key: 'regulatory' },
      { icon: ClipboardList, labelAr: 'الخطط التشغيلية', labelEn: 'Plans', path: '/dashboard/operational-plans', key: 'operational-plans' },
      { icon: Users, labelAr: 'حسابات الشركاء', labelEn: 'Partner Accounts', path: '/dashboard/partner-accounts', key: 'partner-accounts', badgeKey: 'partner-accounts' },
      { icon: BookOpen, labelAr: 'القوانين واللوائح', labelEn: 'Laws & Regulations', path: '/dashboard/laws-regulations', key: 'laws-regulations',
        visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office', 'admin'] },
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
      { icon: TrendingUp, labelAr: 'التنبؤ الذكي', labelEn: 'AI Forecasting', path: '/dashboard/ai-forecasting', key: 'ai-forecasting' },
      { icon: Sparkles, labelAr: 'توصيات الوظائف', labelEn: 'Smart Jobs', path: '/dashboard/smart-job-recommendations', key: 'smart-jobs' },
      { icon: Trophy, labelAr: 'نظام الإنجازات', labelEn: 'Gamification', path: '/dashboard/gamification', key: 'gamification' },
      { icon: Award, labelAr: 'شهادات التميز', labelEn: 'Certificates', path: '/dashboard/pride-certificates', key: 'pride-certificates' },
      { icon: GraduationCap, labelAr: 'المركز التعليمي', labelEn: 'Learning Center', path: '/dashboard/learning-center', key: 'learning-center' },
      { icon: BookOpen, labelAr: 'دليل المستخدم', labelEn: 'User Guide', path: '/dashboard/user-guide', key: 'user-guide' },
      { icon: FileText, labelAr: 'مركز الملاحظات', labelEn: 'Notes', path: '/dashboard/notes', key: 'notes-center' },
      { icon: FileText, labelAr: 'منشئ السيرة الذاتية', labelEn: 'CV Builder', path: '/dashboard/cv-builder', key: 'cv-builder' },
    ],
  },

  // ═══════════════ 18A. مركز القيادة (أدمن فقط) ═══════════════
  {
    id: 'admin-command-center',
    icon: Zap,
    labelAr: 'مركز القيادة',
    labelEn: 'Command Center',
    visibleFor: ['admin'],
    items: [
      { icon: Zap, labelAr: 'اللوحة التنفيذية', labelEn: 'Executive Dashboard', path: '/dashboard/executive', key: 'executive-dashboard' },
      { icon: Brain, labelAr: 'العين الذكية', labelEn: 'Smart Eye', path: '/dashboard/smart-insights', key: 'smart-insights' },
      { icon: Activity, labelAr: 'نظرة عامة على النظام', labelEn: 'System Overview', path: '/dashboard/system-overview', key: 'system-overview' },
      { icon: Activity, labelAr: 'حالة النظام', labelEn: 'System Status', path: '/dashboard/system-status', key: 'system-status' },
      { icon: BarChart3, labelAr: 'تحليلات متقدمة', labelEn: 'Advanced Analytics', path: '/dashboard/advanced-analytics', key: 'advanced-analytics' },
      { icon: Scale, labelAr: 'لوحة الرقابة', labelEn: 'Regulator Panel', path: '/dashboard/regulator', key: 'regulator' },
    ],
  },

  // ═══════════════ 18B. إدارة الكيانات (أدمن فقط) ═══════════════
  {
    id: 'admin-entity-management',
    icon: Building2,
    labelAr: 'إدارة الكيانات',
    labelEn: 'Entity Management',
    visibleFor: ['admin'],
    items: [
      { icon: Shield, labelAr: 'مراجعة التسجيل', labelEn: 'Onboarding Review', path: '/dashboard/onboarding-review', key: 'onboarding-review' },
      { icon: CheckSquare, labelAr: 'موافقات الشركات', labelEn: 'Company Approvals', path: '/dashboard/company-approvals', key: 'company-approvals', badgeKey: 'company-approvals' },
      { icon: Building2, labelAr: 'إدارة الشركات', labelEn: 'Company Management', path: '/dashboard/company-management', key: 'company-management' },
      { icon: Building2, labelAr: 'الشركات المنظمة', labelEn: 'Regulated Companies', path: '/dashboard/regulated-companies', key: 'regulated-companies' },
      { icon: BarChart3, labelAr: 'تعداد الكيانات', labelEn: 'Entity Census', path: '/dashboard/entity-census', key: 'entity-census' },
      { icon: FileText, labelAr: 'وثائق المنظمات', labelEn: 'Org Documents', path: '/dashboard/organization-documents', key: 'org-docs', badgeKey: 'org-docs' },
      { icon: FileText, labelAr: 'إدارة الإفادات', labelEn: 'Attestation Management', path: '/dashboard/admin-attestations', key: 'admin-attestations' },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certificates', path: '/dashboard/recycling-certificates', key: 'admin-certs', badgeKey: 'admin-certs' },
      { icon: Fingerprint, labelAr: 'ختم المستندات', labelEn: 'Document Stamping', path: '/dashboard/admin-document-stamping', key: 'admin-doc-stamping' },
    ],
  },

  // ═══════════════ 18C. المستخدمون والأسطول (أدمن فقط) ═══════════════
  {
    id: 'admin-users-fleet',
    icon: Truck,
    labelAr: 'المستخدمون والأسطول',
    labelEn: 'Users & Fleet',
    visibleFor: ['admin'],
    items: [
      { icon: UserPlus, labelAr: 'موافقات السائقين', labelEn: 'Driver Approvals', path: '/dashboard/driver-approvals', key: 'driver-approvals', badgeKey: 'driver-approvals' },
      { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'admin-driver-tracking' },
      { icon: Truck, labelAr: 'خريطة السائقين', labelEn: 'Drivers Map', path: '/dashboard/admin-drivers-map', key: 'admin-drivers-map' },
      { icon: Send, labelAr: 'إدارة WaPilot', labelEn: 'WaPilot Management', path: '/dashboard/wapilot', key: 'wapilot' },
      { icon: Bot, labelAr: 'الوكيل الذكي', labelEn: 'Smart Agent', path: '/dashboard/smart-agent', key: 'smart-agent' },
      { icon: Inbox, labelAr: 'صندوق طلبات العملاء (C2B)', labelEn: 'C2B Submissions', path: '/dashboard/c2b-management', key: 'c2b-management' },
      { icon: Headphones, labelAr: 'مركز الاتصال', labelEn: 'Call Center', path: '/dashboard/call-center', key: 'call-center' },
      { icon: Users, labelAr: 'سوق التوظيف', labelEn: 'Recruitment', path: '/dashboard/omaluna', key: 'admin-omaluna' },
    ],
  },

  // ═══════════════ 18D. المالية والإيرادات (أدمن فقط) ═══════════════
  {
    id: 'admin-finance',
    icon: CreditCard,
    labelAr: 'المالية والإيرادات',
    labelEn: 'Finance & Revenue',
    visibleFor: ['admin'],
    items: [
      { icon: CreditCard, labelAr: 'الإيرادات والاشتراكات', labelEn: 'Revenue & Subscriptions', path: '/dashboard/admin-revenue', key: 'admin-revenue' },
      { icon: Newspaper, labelAr: 'إدارة الإعلانات', labelEn: 'Ad Management', path: '/dashboard/my-ads', key: 'admin-ads' },
      { icon: Boxes, labelAr: 'خطط الإعلانات', labelEn: 'Ad Plans', path: '/dashboard/ad-plans', key: 'admin-ad-plans' },
      { icon: TreePine, labelAr: 'سوق الخشب', labelEn: 'Wood Market', path: '/dashboard/wood-market', key: 'wood-market' },
      { icon: Store, labelAr: 'مزادات المخلفات', labelEn: 'Waste Auctions', path: '/dashboard/waste-auctions', key: 'admin-waste-auctions' },
    ],
  },

  // ═══════════════ 18E. المحتوى والتسويق (أدمن فقط) ═══════════════
  {
    id: 'admin-content',
    icon: Globe,
    labelAr: 'المحتوى والتسويق',
    labelEn: 'Content & Marketing',
    visibleFor: ['admin'],
    items: [
      { icon: Globe, labelAr: 'إدارة الصفحة الرئيسية', labelEn: 'Homepage Manager', path: '/dashboard/homepage-manager', key: 'homepage-manager' },
      { icon: Newspaper, labelAr: 'إدارة الأخبار', labelEn: 'News Manager', path: '/dashboard/news-manager', key: 'news-manager' },
      { icon: BookOpen, labelAr: 'إدارة المدونة', labelEn: 'Blog Manager', path: '/dashboard/blog-manager', key: 'blog-manager' },
      { icon: MessageCircle, labelAr: 'إدارة التعليقات', labelEn: 'Testimonials', path: '/dashboard/testimonials-management', key: 'testimonials-management' },
      { icon: Video, labelAr: 'مولد الفيديو', labelEn: 'Video Generator', path: '/dashboard/video-generator', key: 'video-gen' },
      { icon: BookOpen, labelAr: 'بروشور المنصة', labelEn: 'Platform Brochure', path: '/dashboard/platform-brochure', key: 'platform-brochure' },
      { icon: PenTool, labelAr: 'قوالب القرطاسية', labelEn: 'Stationery Templates', path: '/dashboard/stationery', key: 'stationery' },
      { icon: Monitor, labelAr: 'سكرين شوت', labelEn: 'Screenshots', path: '/dashboard/system-screenshots', key: 'system-screenshots' },
      { icon: Eye, labelAr: 'تحليلات الزوار', labelEn: 'Visitor Analytics', path: '/dashboard/visitor-analytics', key: 'visitor-analytics' },
      { icon: Sparkles, labelAr: 'العلامة البيضاء', labelEn: 'White Label Portal', path: '/dashboard/white-label-portal', key: 'white-label-portal' },
    ],
  },

  // ═══════════════ 18F. البنية التحتية (أدمن فقط) ═══════════════
  {
    id: 'admin-infrastructure',
    icon: Database,
    labelAr: 'البنية التحتية',
    labelEn: 'Infrastructure',
    visibleFor: ['admin'],
    items: [
      { icon: Settings, labelAr: 'أوامر النظام', labelEn: 'System Commands', path: '/dashboard/system-commands', key: 'system-commands' },
      { icon: LinkIcon, labelAr: 'إدارة API', labelEn: 'API Management', path: '/dashboard/api', key: 'api-management' },
      { icon: Shield, labelAr: 'اختبار الأمان', labelEn: 'Security Testing', path: '/dashboard/security-testing', key: 'security-testing' },
      { icon: Shield, labelAr: 'الأمن السيبراني', labelEn: 'Cyber Security', path: '/dashboard/cyber-security', key: 'cyber-security' },
      { icon: Database, labelAr: 'تحسين قاعدة البيانات', labelEn: 'DB Optimization', path: '/dashboard/db-optimization', key: 'db-optimization' },
      { icon: Lock, labelAr: 'امتثال GDPR', labelEn: 'GDPR Compliance', path: '/dashboard/gdpr-compliance', key: 'gdpr-compliance' },
      { icon: Sparkles, labelAr: 'إعدادات العلامة التجارية', labelEn: 'Branding Settings', path: '/dashboard/admin-branding', key: 'admin-branding' },
      { icon: FileText, labelAr: 'الشروط والسياسات', labelEn: 'Terms & Policies', path: '/dashboard/platform-terms', key: 'platform-terms' },
      { icon: Gauge, labelAr: 'النضج الرقمي', labelEn: 'Digital Maturity', path: '/dashboard/digital-maturity', key: 'digital-maturity' },
      { icon: Network, labelAr: 'دليل بنية النظام', labelEn: 'Architecture Guide', path: '/dashboard/architecture-guide', key: 'architecture-guide' },
      { icon: Shield, labelAr: 'الحوكمة المؤسسية', labelEn: 'Governance', path: '/dashboard/governance', key: 'admin-governance' },
      { icon: FolderOpen, labelAr: 'السجل المركزي', labelEn: 'Central Registry', path: '/dashboard/central-registry', key: 'central-registry' },
      { icon: Database, labelAr: 'الأرشيف الذكي', labelEn: 'Smart Archive', path: '/dashboard/smart-archive', key: 'smart-archive' },
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
      { icon: Wallet, labelAr: 'إدارة الاشتراك', labelEn: 'Subscription', path: '/dashboard/subscription', key: 'subscription', requiredPermissions: ['manage_settings'] },
      { icon: Database, labelAr: 'تصدير البيانات', labelEn: 'Data Export', path: '/dashboard/data-export', key: 'data-export', requiredPermissions: ['export_reports', 'export_accounts'] },
      { icon: WifiOff, labelAr: 'وضع بدون إنترنت', labelEn: 'Offline Mode', path: '/dashboard/offline-mode', key: 'offline-mode' },
      { icon: Info, labelAr: 'عن المنصة', labelEn: 'About', path: '/dashboard/about-platform', key: 'about-platform' },
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', path: '/dashboard/settings', key: 'settings', requiredPermissions: ['manage_settings', 'view_settings'] },
      { icon: Zap, labelAr: 'الإجراءات التلقائية', labelEn: 'Auto Actions', path: '/dashboard/auto-actions', key: 'auto-actions', requiredPermissions: ['manage_settings'] },
    ],
  },
];

/**
 * Admin-only group IDs for quick lookup
 */
const ADMIN_GROUP_IDS = new Set([
  'admin-command-center',
  'admin-entity-management', 
  'admin-users-fleet',
  'admin-finance',
  'admin-content',
  'admin-infrastructure',
]);

/**
 * Check if admin is currently viewing as an organization (voluntary switch).
 * Returns the org ID or null.
 */
export function getAdminViewingOrg(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_viewing_org');
}

/**
 * Check if current admin view is their own sovereign account (not mimicking an org).
 */
export function isAdminSovereignView(isAdmin: boolean): boolean {
  return isAdmin && !getAdminViewingOrg();
}

/**
 * Get visible sidebar groups for a given org type.
 * 
 * Admin logic:
 * 1. Sovereign mode (own account): Admin-specific groups + shared groups ONLY (no role-specific clutter)
 * 2. Voluntary org switch: That org's groups + shared groups, then admin tools as a separated section
 * 
 * Non-admin: Standard filtering by org type.
 */
export function getGroupsForOrgType(orgType: string, isAdmin: boolean): SidebarGroupConfig[] {
  if (isAdmin) {
    const viewingAsOrg = getAdminViewingOrg();
    
    if (viewingAsOrg && orgType) {
      // ── Voluntary org mimicry: show org-relevant groups, then admin tools at end ──
      const orgGroups = sidebarGroups.filter(group => {
        if (ADMIN_GROUP_IDS.has(group.id)) return false; // exclude admin groups from main list
        if (group.visibleFor.length === 0) return true;
        return group.visibleFor.includes(orgType);
      }).map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (!item.visibleFor || item.visibleFor.length === 0) return true;
          return item.visibleFor.includes(orgType);
        }),
      }));
      
      // Add admin-only groups at the end (sovereign tools always accessible)
      const adminTools = sidebarGroups.filter(group => ADMIN_GROUP_IDS.has(group.id));
      
      return [...orgGroups, ...adminTools];
    }
    
    // ── Sovereign mode: Admin groups first, then shared groups only ──
    // NO role-specific groups — admin uses the org switcher to view those
    const adminGroups = sidebarGroups.filter(group => ADMIN_GROUP_IDS.has(group.id));
    const sharedGroups = sidebarGroups.filter(group => 
      group.visibleFor.length === 0 && !ADMIN_GROUP_IDS.has(group.id)
    );
    
    return [...adminGroups, ...sharedGroups];
  }

  // ── Standard user: filter by org type ──
  return sidebarGroups.filter(group => {
    if (group.visibleFor.length === 0) return true;
    return group.visibleFor.includes(orgType);
  }).map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.visibleFor || item.visibleFor.length === 0) return true;
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
