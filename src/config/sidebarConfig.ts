/**
 * Sidebar menu configuration — Ultra-granular v5.0
 * Hierarchical: Section → Group → Item
 * ~50 groups organized into 14 sections.
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
  CreditCard, Monitor, Plus, CheckSquare, UserPlus, Video, HardHat, Upload, UserCheck,
  CalendarClock, Gauge as GaugeIcon, Heart, Timer, Briefcase, ArrowLeftRight,
  Megaphone, Repeat, Crown, Star, Phone, Mail, Radio, Landmark, Cog, Hash,
  Image, Clock, ChevronRight, Blocks, ListOrdered, Fuel,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import type { SidebarSectionConfig } from '@/config/sidebar/sidebarTypes';

export interface SidebarGroupConfig {
  id: string;
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  visibleFor: string[];
  items: SidebarItemConfig[];
}

export interface SidebarItemConfig {
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  path: string;
  key: string;
  badgeKey?: string;
  visibleFor?: string[];
  bindingType?: import('@/types/bindingTypes').BindingType;
  requiredPermissions?: string[];
}

/**
 * أنواع الجهات الفعلية — السائق كيان مستقل وليس جهة
 */
type OrgType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'regulator' | 'consultant' | 'consulting_office';

/**
 * جميع كيانات لوحة التحكم (جهات + كيانات خاصة)
 */
type DashboardEntityType = OrgType | 'admin' | 'driver' | 'employee';

/**
 * Top-level standalone items (always visible, not in groups)
 */
export const standaloneItems: SidebarItemConfig[] = [
  { icon: LayoutDashboard, labelAr: 'لوحة التحكم', labelEn: 'Dashboard', path: '/dashboard', key: 'dashboard' },
  { icon: User, labelAr: 'مساحة العمل', labelEn: 'Workspace', path: '/dashboard/my-workspace', key: 'my-workspace' },
  { icon: UserPlus, labelAr: 'ملفي الشخصي', labelEn: 'My Profile', path: '/dashboard/my-profile', key: 'my-profile' },
];

// ═══════════════════════════════════════════════════════════════
//  ALL SIDEBAR GROUPS — Ultra-Granular v4.0
// ═══════════════════════════════════════════════════════════════
export const sidebarGroups: SidebarGroupConfig[] = [

  // ══════ 01. التواصل والمنشورات (مدمج) ══════
  {
    id: 'communication-social',
    icon: MessageCircle,
    labelAr: 'التواصل والمنشورات',
    labelEn: 'Communication & Social',
    visibleFor: [],
    items: [
      { icon: MessageCircle, labelAr: 'الدردشة', labelEn: 'Chat', path: '/dashboard/chat', key: 'chat', badgeKey: 'chat', bindingType: 'partner' as const },
      { icon: Users, labelAr: 'المجموعات', labelEn: 'Group Chats', path: '/dashboard/chat?view=groups', key: 'group-chats', bindingType: 'partner' as const },
      { icon: Radio, labelAr: 'قنوات البث', labelEn: 'Broadcast Channels', path: '/dashboard/broadcast-channels', key: 'broadcast-channels', badgeKey: 'broadcastChannels', bindingType: 'internal' as const },
      { icon: Video, labelAr: 'الاجتماعات المرئية', labelEn: 'Video Meetings', path: '/dashboard/meetings', key: 'meetings', bindingType: 'partner' as const },
      { icon: CircleDot, labelAr: 'الحالات (Stories)', labelEn: 'Stories', path: '/dashboard/stories', key: 'stories', bindingType: 'internal' as const },
      { icon: Rss, labelAr: 'آخر الأخبار', labelEn: 'News Feed', path: '/dashboard/feed', key: 'social-feed', bindingType: 'internal' as const },
      { icon: Newspaper, labelAr: 'المنشورات', labelEn: 'Posts', path: '/dashboard/organization-profile?tab=posts', key: 'social-posts', bindingType: 'internal' as const },
    ],
  },

  // ══════ 02. الإشعارات والملاحظات ══════
  {
    id: 'notifications-notes',
    icon: Bell,
    labelAr: 'الإشعارات والملاحظات',
    labelEn: 'Notifications & Notes',
    visibleFor: [],
    items: [
      { icon: Bell, labelAr: 'الإشعارات', labelEn: 'Notifications', path: '/dashboard/notifications', key: 'notifications', badgeKey: 'notifications', bindingType: 'internal' as const },
      { icon: FileText, labelAr: 'مركز الملاحظات', labelEn: 'Notes Center', path: '/dashboard/notes', key: 'notes-center', bindingType: 'internal' as const },
    ],
  },

  // ══════ 03. الطلبات ══════
  {
    id: 'requests',
    icon: Send,
    labelAr: 'الطلبات',
    labelEn: 'Requests',
    visibleFor: [],
    items: [
      { icon: Send, labelAr: 'طلباتي', labelEn: 'My Requests', path: '/dashboard/my-requests', key: 'my-requests', badgeKey: 'my-requests', bindingType: 'hybrid' as const },
      { icon: Users, labelAr: 'بوابة العملاء', labelEn: 'Customer Portal', path: '/dashboard/customer-portal', key: 'customer-portal', bindingType: 'partner' as const },
    ],
  },

  // ══════ 04. ملف المنظمة — صفحة المنظمة ══════
  {
    id: 'org-page',
    icon: Building2,
    labelAr: 'صفحة المنظمة',
    labelEn: 'Organization Page',
    visibleFor: [],
    items: [
      { icon: Building2, labelAr: 'صفحة المنظمة', labelEn: 'Organization Page', path: '/dashboard/organization-profile?tab=page', key: 'org-page', bindingType: 'internal' as const },
      { icon: Image, labelAr: 'البورتفوليو', labelEn: 'Portfolio', path: '/dashboard/organization-profile?tab=portfolio', key: 'org-portfolio', bindingType: 'internal' as const },
      { icon: Briefcase, labelAr: 'الملف التجاري', labelEn: 'Business Profile', path: '/dashboard/organization-profile?tab=business', key: 'org-business', bindingType: 'internal' as const },
      { icon: Newspaper, labelAr: 'المنشورات', labelEn: 'Posts', path: '/dashboard/organization-profile?tab=posts', key: 'org-posts', bindingType: 'internal' as const },
      { icon: Cog, labelAr: 'البيانات الأساسية', labelEn: 'Basic Data', path: '/dashboard/organization-profile?tab=basic', key: 'org-basic', bindingType: 'internal' as const },
    ],
  },

  // ══════ 05. الهوية والإفادات ══════
  {
    id: 'identity-attestation',
    icon: Fingerprint,
    labelAr: 'الهوية والإفادات',
    labelEn: 'Identity & Attestation',
    visibleFor: [],
    items: [
      { icon: Fingerprint, labelAr: 'بطاقة الهوية الرقمية', labelEn: 'Digital Identity', path: '/dashboard/digital-identity-card', key: 'digital-identity-card', bindingType: 'internal' as const },
      { icon: FileText, labelAr: 'الإفادة الرقمية', labelEn: 'Digital Attestation', path: '/dashboard/organization-attestation', key: 'org-attestation', bindingType: 'admin' as const },
    ],
  },

  // ══════ 06. الهيكل التنظيمي ══════
  {
    id: 'org-structure',
    icon: Network,
    labelAr: 'الهيكل التنظيمي',
    labelEn: 'Org Structure',
    visibleFor: [],
    items: [
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Structure', path: '/dashboard/org-structure', key: 'org-structure', bindingType: 'internal' as const, requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Users, labelAr: 'إدارة الموظفين', labelEn: 'Employees', path: '/dashboard/employees', key: 'employees', bindingType: 'internal' as const, requiredPermissions: ['manage_members'] },
      { icon: Users, labelAr: 'بيانات الفريق', labelEn: 'Team Data', path: '/dashboard/team-credentials', key: 'other-team', bindingType: 'internal' as const, requiredPermissions: ['manage_members'] },
    ],
  },

  // ══════ 07. الشركاء والعلاقات ══════
  {
    id: 'partners',
    icon: Handshake,
    labelAr: 'الشركاء والعلاقات',
    labelEn: 'Partners & Relations',
    visibleFor: [],
    items: [
      { icon: Handshake, labelAr: 'الشركاء', labelEn: 'Partners', path: '/dashboard/partners', key: 'partners', badgeKey: 'partners', bindingType: 'hybrid' as const, requiredPermissions: ['manage_partners', 'view_partner_data'] },
      { icon: Rss, labelAr: 'آخر أخبار الشركاء', labelEn: 'Partners Timeline', path: '/dashboard/partners-timeline', key: 'partners-timeline', badgeKey: 'partners-timeline', bindingType: 'hybrid' as const, requiredPermissions: ['view_partner_data'] },
      { icon: Users, labelAr: 'حسابات الشركاء', labelEn: 'Partner Accounts', path: '/dashboard/partner-accounts', key: 'partner-accounts', badgeKey: 'partner-accounts', bindingType: 'partner' as const, requiredPermissions: ['view_partner_data', 'manage_partners'] },
    ],
  },

  // ══════ 08. الحوكمة والأمان ══════
  {
    id: 'governance-security',
    icon: Shield,
    labelAr: 'الحوكمة والأمان',
    labelEn: 'Governance & Security',
    visibleFor: [],
    items: [
      { icon: Shield, labelAr: 'الحوكمة والرقابة', labelEn: 'Governance', path: '/dashboard/governance', key: 'governance', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
      { icon: Brain, labelAr: 'الأمن السيبراني', labelEn: 'Cyber Security', path: '/dashboard/cyber-security', key: 'cyber-security', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
    ],
  },

  // ═══════════════ شحنات المولّد ═══════════════
  {
    id: 'generator-shipments',
    icon: Package,
    labelAr: 'شحنات المولّد',
    labelEn: 'Generator Shipments',
    visibleFor: ['generator'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'generator-shipments', badgeKey: 'generator-shipments', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments', 'create_shipments', 'manage_shipments'] },
      { icon: CalendarClock, labelAr: 'شحنات متكررة', labelEn: 'Recurring', path: '/dashboard/recurring-shipments', key: 'recurring-shipments', bindingType: 'hybrid' as const, requiredPermissions: ['create_shipments', 'manage_shipments'] },
      { icon: AlertTriangle, labelAr: 'المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'generator-rejected', bindingType: 'partner' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: Scale, labelAr: 'الوزنات الجماعية', labelEn: 'Bulk Weight', path: '/dashboard/bulk-weight-entries', key: 'generator-bulk-weight', bindingType: 'hybrid' as const, requiredPermissions: ['manage_shipments'] },
    ],
  },

  // ═══════════════ شهادات المولّد ═══════════════
  {
    id: 'generator-certificates',
    icon: FolderCheck,
    labelAr: 'شهادات المولّد',
    labelEn: 'Generator Certificates',
    visibleFor: ['generator'],
    items: [
      { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/generator-receipts', key: 'generator-receipts', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'generator-certs', badgeKey: 'generator-certs', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
    ],
  },

  // ═══════════════ (generator-tracking merged into tracking-maps-center below) ═══════════════

  // ═══════════════ عمليات الشحن — الناقل ═══════════════
  {
    id: 'transporter-shipments',
    icon: Package,
    labelAr: 'شحنات الناقل',
    labelEn: 'Transporter Shipments',
    visibleFor: ['transporter'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/transporter-shipments', key: 'transporter-shipments', badgeKey: 'transporter-shipments', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments', 'create_shipments', 'manage_shipments'] },
      { icon: AlertTriangle, labelAr: 'المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'transporter-rejected', bindingType: 'partner' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: Inbox, labelAr: 'طلبات الجمع', labelEn: 'Collection Requests', path: '/dashboard/collection-requests', key: 'collection-requests', bindingType: 'partner' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: Scale, labelAr: 'الوزنات الجماعية', labelEn: 'Bulk Weight', path: '/dashboard/bulk-weight-entries', key: 'transporter-bulk-weight', bindingType: 'hybrid' as const, requiredPermissions: ['manage_shipments'] },
    ],
  },

  // ═══════════════ شهادات وسجلات الناقل ═══════════════
  {
    id: 'transporter-records',
    icon: FileText,
    labelAr: 'سجلات الناقل',
    labelEn: 'Transporter Records',
    visibleFor: ['transporter'],
    items: [
      { icon: FileText, labelAr: 'شهادات الاستلام', labelEn: 'Receipt Certs', path: '/dashboard/transporter-receipts', key: 'transporter-receipts', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: Scale, labelAr: 'سجل الكميات الخارجية', labelEn: 'External Records', path: '/dashboard/external-records', key: 'transporter-external-records', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
    ],
  },

  // ═══════════════ الشحنات اليدوية — الناقل ═══════════════
  {
    id: 'transporter-manual',
    icon: Plus,
    labelAr: 'الشحنات اليدوية',
    labelEn: 'Manual Shipments',
    visibleFor: ['transporter'],
    items: [
      { icon: Plus, labelAr: 'إنشاء شحنة يدوية', labelEn: 'Create Manual', path: '/dashboard/manual-shipment', key: 'manual-shipment', bindingType: 'hybrid' as const, requiredPermissions: ['create_shipments'] },
      { icon: FileText, labelAr: 'أرشيف النماذج', labelEn: 'Manual Drafts', path: '/dashboard/manual-shipment-drafts', key: 'manual-shipment-drafts', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: Fingerprint, labelAr: 'أنماط الجيلوش', labelEn: 'Guilloche', path: '/dashboard/guilloche-patterns', key: 'transporter-guilloche', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ (fleet-tracking merged into tracking-maps-center below) ═══════════════

  // ═══════════════ المركبات والحاويات — الناقل ═══════════════
  {
    id: 'vehicles-containers',
    icon: Truck,
    labelAr: 'المركبات والحاويات',
    labelEn: 'Vehicles & Containers',
    visibleFor: ['transporter'],
    items: [
      { icon: Boxes, labelAr: 'إدارة الحاويات', labelEn: 'Containers', path: '/dashboard?tab=fleet', key: 'container-management', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: GitCompareArrows, labelAr: 'إعادة تعيين المركبات', labelEn: 'Vehicle Reassign', path: '/dashboard?tab=fleet', key: 'vehicle-reassignment', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Wrench, labelAr: 'الصيانة الوقائية', labelEn: 'Maintenance', path: '/dashboard/preventive-maintenance', key: 'preventive-maintenance', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Fuel, labelAr: 'إدارة الوقود', labelEn: 'Fuel Management', path: '/dashboard/fuel-management', key: 'fuel-management', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
    ],
  },

  // ═══════════════ السائقون — الناقل ═══════════════
  {
    id: 'driver-management',
    icon: Users,
    labelAr: 'إدارة السائقين',
    labelEn: 'Driver Management',
    visibleFor: ['transporter'],
    items: [
      { icon: Users, labelAr: 'السائقون', labelEn: 'Drivers', path: '/dashboard/transporter-drivers', key: 'transporter-drivers', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers', 'view_drivers'] },
      { icon: Shield, labelAr: 'تصاريح السائقين', labelEn: 'Permits', path: '/dashboard/driver-permits', key: 'driver-permits', bindingType: 'admin' as const, requiredPermissions: ['manage_drivers'] },
      { icon: CalendarClock, labelAr: 'جدولة الرحلات', labelEn: 'Trip Schedule', path: '/dashboard/driver-trip-schedule', key: 'driver-trip-schedule', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: HardHat, labelAr: 'عمال التحميل', labelEn: 'Loading Workers', path: '/dashboard/loading-workers', key: 'loading-workers', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
    ],
  },

  // ═══════════════ تطوير السائقين ═══════════════
  {
    id: 'driver-development',
    icon: GraduationCap,
    labelAr: 'تطوير السائقين',
    labelEn: 'Driver Development',
    visibleFor: ['transporter'],
    items: [
      { icon: GraduationCap, labelAr: 'الأكاديمية', labelEn: 'Academy', path: '/dashboard/driver-academy', key: 'driver-academy', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Trophy, labelAr: 'الإنجازات', labelEn: 'Achievements', path: '/dashboard/driver-rewards?tab=achievements', key: 'driver-achievements', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Award, labelAr: 'المكافآت', labelEn: 'Rewards', path: '/dashboard/driver-rewards?tab=rewards', key: 'driver-rewards', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
      { icon: Crown, labelAr: 'المتصدرون', labelEn: 'Leaderboard', path: '/dashboard/driver-rewards?tab=leaderboard', key: 'driver-leaderboard', bindingType: 'internal' as const, requiredPermissions: ['manage_drivers'] },
    ],
  },

  // ═══════════════ المركز التنظيمي — الناقل ═══════════════
  {
    id: 'transporter-regulatory',
    icon: Shield,
    labelAr: 'المركز التنظيمي',
    labelEn: 'Regulatory Center',
    visibleFor: ['transporter'],
    items: [
      { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Declarations', path: '/dashboard/delivery-declarations', key: 'transporter-declarations', bindingType: 'admin' as const },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'transporter-certs', badgeKey: 'transporter-certs', bindingType: 'admin' as const },
      { icon: FileCheck, labelAr: 'تجديد التراخيص', labelEn: 'License Renewal', path: '/dashboard?tab=licenses', key: 'transporter-license-renewal', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الإقرارات الدورية', labelEn: 'Periodic', path: '/dashboard?tab=declarations', key: 'transporter-periodic-declarations', bindingType: 'admin' as const },
      { icon: ClipboardList, labelAr: 'الخطة السنوية', labelEn: 'Annual Plan', path: '/dashboard?tab=annual_plan', key: 'transporter-annual-plan', bindingType: 'admin' as const },
      { icon: HardHat, labelAr: 'السلامة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety', key: 'transporter-safety', bindingType: 'hybrid' as const },
      { icon: Heart, labelAr: 'iRecycle Health', labelEn: 'iRecycle Health', path: '/dashboard/health', key: 'irecycle-health', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ شحنات المدوّر ═══════════════
  {
    id: 'recycler-shipments',
    icon: Recycle,
    labelAr: 'شحنات المدوّر',
    labelEn: 'Recycler Shipments',
    visibleFor: ['recycler'],
    items: [
      { icon: Package, labelAr: 'الشحنات', labelEn: 'Shipments', path: '/dashboard/shipments', key: 'recycler-shipments', badgeKey: 'recycler-shipments', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: AlertTriangle, labelAr: 'المرفوضة', labelEn: 'Rejected', path: '/dashboard/rejected-shipments', key: 'recycler-rejected', bindingType: 'partner' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: MapPin, labelAr: 'مركز التتبع', labelEn: 'Tracking', path: '/dashboard/tracking-center', key: 'recycler-tracking-center', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
    ],
  },

  // ═══════════════ شهادات وإنتاج المدوّر ═══════════════
  {
    id: 'recycler-production',
    icon: Factory,
    labelAr: 'الإنتاج والشهادات',
    labelEn: 'Production & Certs',
    visibleFor: ['recycler'],
    items: [
      { icon: Factory, labelAr: 'لوحة الإنتاج', labelEn: 'Production', path: '/dashboard/production', key: 'production-dashboard', bindingType: 'internal' as const, requiredPermissions: ['view_shipments'] },
      { icon: FolderCheck, labelAr: 'إصدار شهادات التدوير', labelEn: 'Issue Certs', path: '/dashboard/issue-recycling-certificates', key: 'issue-certs', badgeKey: 'issue-certs', bindingType: 'hybrid' as const, requiredPermissions: ['manage_shipments'] },
      { icon: FileCheck, labelAr: 'إقرارات التسليم', labelEn: 'Declarations', path: '/dashboard/delivery-declarations', key: 'recycler-declarations', bindingType: 'partner' as const, requiredPermissions: ['view_shipments'] },
    ],
  },

  // ═══════════════ عمليات التخلص ═══════════════
  {
    id: 'disposal-ops',
    icon: Factory,
    labelAr: 'عمليات التخلص',
    labelEn: 'Disposal Operations',
    visibleFor: ['disposal'],
    items: [
      { icon: Factory, labelAr: 'العمليات', labelEn: 'Operations', path: '/dashboard/disposal/operations', key: 'disposal-operations', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
      { icon: MapPin, labelAr: 'التتبع', labelEn: 'Tracking', path: '/dashboard/tracking-center', key: 'disposal-tracking-center', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: Package, labelAr: 'الواردة', labelEn: 'Incoming', path: '/dashboard/disposal/incoming-requests', key: 'disposal-incoming', bindingType: 'partner' as const, requiredPermissions: ['view_shipments', 'manage_shipments'] },
    ],
  },

  // ═══════════════ شهادات ومرافق التخلص ═══════════════
  {
    id: 'disposal-certs-facilities',
    icon: GaugeIcon,
    labelAr: 'الشهادات والمرافق',
    labelEn: 'Certs & Facilities',
    visibleFor: ['disposal'],
    items: [
      { icon: FolderCheck, labelAr: 'شهادات التخلص', labelEn: 'Disposal Certs', path: '/dashboard/disposal/certificates', key: 'disposal-certs', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: BarChart3, labelAr: 'تقارير التخلص', labelEn: 'Reports', path: '/dashboard/disposal/reports', key: 'disposal-reports', bindingType: 'internal' as const, requiredPermissions: ['view_reports'] },
      { icon: Factory, labelAr: 'المرافق', labelEn: 'Facilities', path: '/dashboard/disposal-facilities', key: 'disposal-facilities', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
      { icon: GaugeIcon, labelAr: 'إدارة السعة', labelEn: 'Capacity', path: '/dashboard/capacity-management', key: 'capacity-management', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
      { icon: HardHat, labelAr: 'السلامة المهنية', labelEn: 'Safety', path: '/dashboard/safety', key: 'disposal-safety', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ المقاول البلدي (Municipal Contractor) ═══════════════
  {
    id: 'municipal-operations',
    icon: Truck,
    labelAr: 'العمليات البلدية',
    labelEn: 'Municipal Operations',
    visibleFor: ['municipal_contractor'],
    items: [
      { icon: BarChart3, labelAr: 'لوحة المراقبة', labelEn: 'Dashboard', path: '/dashboard/municipal-dashboard', key: 'municipal-dashboard', bindingType: 'internal' as const },
      { icon: LayoutDashboard, labelAr: 'مناطق الخدمة', labelEn: 'Service Zones', path: '/dashboard/service-zones', key: 'service-zones', bindingType: 'internal' as const },
      { icon: MapPin, labelAr: 'سجل الصناديق', labelEn: 'Street Bins', path: '/dashboard/street-bins', key: 'street-bins', bindingType: 'internal' as const },
      { icon: Truck, labelAr: 'مسارات الجمع', labelEn: 'Collection Routes', path: '/dashboard/collection-routes', key: 'collection-routes', bindingType: 'internal' as const },
      { icon: Package, labelAr: 'رحلات الجمع', labelEn: 'Collection Trips', path: '/dashboard/collection-trips', key: 'collection-trips', bindingType: 'internal' as const },
      { icon: MessageCircle, labelAr: 'شكاوى المواطنين', labelEn: 'Complaints', path: '/dashboard/citizen-complaints', key: 'citizen-complaints', bindingType: 'internal' as const },
    ],
  },
  {
    id: 'municipal-contracts',
    icon: FileText,
    labelAr: 'العقود والامتثال',
    labelEn: 'Contracts & Compliance',
    visibleFor: ['municipal_contractor'],
    items: [
      { icon: FileText, labelAr: 'العقود الحكومية', labelEn: 'Contracts', path: '/dashboard/municipal-contracts', key: 'municipal-contracts', bindingType: 'internal' as const },
      { icon: AlertTriangle, labelAr: 'الغرامات والجزاءات', labelEn: 'Penalties', path: '/dashboard/penalties-management', key: 'penalties-management', bindingType: 'internal' as const },
      { icon: BarChart3, labelAr: 'التقارير الدورية', labelEn: 'Reports', path: '/dashboard/municipal-reports', key: 'municipal-reports', bindingType: 'internal' as const },
    ],
  },
  {
    id: 'municipal-workforce',
    icon: Users,
    labelAr: 'القوى العاملة',
    labelEn: 'Workforce',
    visibleFor: ['municipal_contractor'],
    items: [
      { icon: Users, labelAr: 'طواقم الكنس والنظافة', labelEn: 'Sweeping Crews', path: '/dashboard/sweeping-crews', key: 'sweeping-crews', bindingType: 'internal' as const },
      { icon: UserCheck, labelAr: 'حضور وانصراف', labelEn: 'Attendance', path: '/dashboard/daily-attendance', key: 'daily-attendance', bindingType: 'internal' as const },
      { icon: Shield, labelAr: 'سلامة العمال', labelEn: 'Worker Safety', path: '/dashboard/worker-safety', key: 'worker-safety', bindingType: 'internal' as const },
    ],
  },
  {
    id: 'municipal-assets',
    icon: Package,
    labelAr: 'المعدات والمحطات',
    labelEn: 'Assets & Stations',
    visibleFor: ['municipal_contractor'],
    items: [
      { icon: Package, labelAr: 'المعدات والأدوات', labelEn: 'Equipment', path: '/dashboard/sweeping-equipment', key: 'sweeping-equipment', bindingType: 'internal' as const },
      { icon: Building2, labelAr: 'محطات الترحيل', labelEn: 'Transfer Stations', path: '/dashboard/transfer-stations', key: 'transfer-stations', bindingType: 'internal' as const },
      { icon: Boxes, labelAr: 'العُهد والمستلزمات', labelEn: 'Custody', path: '/dashboard/equipment-custody', key: 'equipment-custody', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ الرقابة والإشراف (Regulator) ═══════════════
  {
    id: 'regulator-command',
    icon: Shield,
    labelAr: 'الرقابة والإشراف',
    labelEn: 'Oversight',
    visibleFor: ['regulator'],
    items: [
      { icon: BarChart3, labelAr: 'لوحة المؤشرات', labelEn: 'Dashboard', path: '/dashboard/regulator', key: 'regulator-dashboard', bindingType: 'admin' as const },
      { icon: Building2, labelAr: 'الجهات الخاضعة', labelEn: 'Entities', path: '/dashboard/regulator?tab=organizations', key: 'regulator-orgs', bindingType: 'admin' as const },
      { icon: Search, labelAr: 'التحقق من المستندات', labelEn: 'Verify Docs', path: '/dashboard/regulator?tab=verify', key: 'regulator-verify', bindingType: 'admin' as const },
      { icon: Scale, labelAr: 'الاختصاص القانوني', labelEn: 'Jurisdiction', path: '/dashboard/regulator?tab=jurisdiction', key: 'regulator-jurisdiction', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ التفتيش والمخالفات ═══════════════
  {
    id: 'regulator-enforcement',
    icon: AlertTriangle,
    labelAr: 'التفتيش والمخالفات',
    labelEn: 'Inspections & Violations',
    visibleFor: ['regulator'],
    items: [
      { icon: ClipboardCheck, labelAr: 'حملات التفتيش', labelEn: 'Inspections', path: '/dashboard/regulator?tab=inspections', key: 'regulator-inspections', bindingType: 'admin' as const },
      { icon: AlertTriangle, labelAr: 'سجل المخالفات', labelEn: 'Violations', path: '/dashboard/regulator?tab=violations', key: 'regulator-violations', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الإنذارات', labelEn: 'Warnings', path: '/dashboard/regulator?tab=warnings', key: 'regulator-warnings', bindingType: 'admin' as const },
      { icon: Scale, labelAr: 'الجزاءات', labelEn: 'Penalties', path: '/dashboard/regulator?tab=penalties', key: 'regulator-penalties', bindingType: 'admin' as const },
      { icon: Activity, labelAr: 'متابعة التنفيذ', labelEn: 'Enforcement', path: '/dashboard/regulator?tab=enforcement', key: 'regulator-enforcement', bindingType: 'admin' as const },
      { icon: AlertTriangle, labelAr: 'نظام المخالفات المتقدم', labelEn: 'Advanced Violations', path: '/dashboard/regulatory-violations', key: 'regulatory-violations', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ التراخيص والإفادات ═══════════════
  {
    id: 'regulator-licensing',
    icon: FileCheck,
    labelAr: 'التراخيص والإفادات',
    labelEn: 'Licenses & Attestations',
    visibleFor: ['regulator'],
    items: [
      { icon: FileCheck, labelAr: 'إدارة التراخيص', labelEn: 'Licenses', path: '/dashboard/regulator?tab=licenses', key: 'regulator-licenses', bindingType: 'admin' as const },
      { icon: FileSpreadsheet, labelAr: 'طلبات التراخيص', labelEn: 'Applications', path: '/dashboard/regulator?tab=license-apps', key: 'regulator-license-apps', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الإفادات الرسمية', labelEn: 'Attestations', path: '/dashboard/regulator?tab=attestations', key: 'regulator-attestations', bindingType: 'admin' as const },
      { icon: AlertTriangle, labelAr: 'تراخيص منتهية', labelEn: 'Expiring', path: '/dashboard/regulator?tab=expiring', key: 'regulator-expiring', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ WMRA ═══════════════
  {
    id: 'wmra-tools',
    icon: Recycle,
    labelAr: 'رقابة المخلفات (WMRA)',
    labelEn: 'WMRA',
    visibleFor: ['regulator'],
    items: [
      { icon: Recycle, labelAr: 'سلسلة الحيازة', labelEn: 'Chain of Custody', path: '/dashboard/regulator-wmra?tab=waste-chain', key: 'wmra-waste-chain', bindingType: 'admin' as const },
      { icon: Package, labelAr: 'تدقيق المانيفست', labelEn: 'Manifest Audit', path: '/dashboard/regulator-wmra?tab=manifests', key: 'wmra-manifests', bindingType: 'admin' as const },
      { icon: Layers, labelAr: 'تصنيف المخلفات', labelEn: 'Classification', path: '/dashboard/waste-types', key: 'wmra-waste-types', bindingType: 'admin' as const },
      { icon: Activity, labelAr: 'خريطة التدفق', labelEn: 'Waste Flow', path: '/dashboard/waste-flow-heatmap', key: 'wmra-waste-flow', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الإقرارات الدورية', labelEn: 'Declarations', path: '/dashboard/regulator-wmra?tab=declarations', key: 'wmra-declarations', bindingType: 'admin' as const },
      { icon: Leaf, labelAr: 'مؤشرات الاستدامة', labelEn: 'Sustainability', path: '/dashboard/environmental-sustainability', key: 'wmra-sustainability', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ EEAA ═══════════════
  {
    id: 'eeaa-tools',
    icon: Leaf,
    labelAr: 'الرقابة البيئية (EEAA)',
    labelEn: 'EEAA',
    visibleFor: ['regulator'],
    items: [
      { icon: Leaf, labelAr: 'الرصد البيئي', labelEn: 'Monitoring', path: '/dashboard/regulator-eeaa?tab=monitoring', key: 'eeaa-monitoring', bindingType: 'admin' as const },
      { icon: AlertTriangle, labelAr: 'دراسات الأثر', labelEn: 'EIA', path: '/dashboard/regulator-eeaa?tab=eia', key: 'eeaa-eia', bindingType: 'admin' as const },
      { icon: FileSpreadsheet, labelAr: 'الموافقات المعلقة', labelEn: 'Approvals', path: '/dashboard/regulator-eeaa?tab=approvals', key: 'eeaa-approvals', bindingType: 'admin' as const },
      { icon: Activity, labelAr: 'الانبعاثات', labelEn: 'Emissions', path: '/dashboard/regulator-eeaa?tab=emissions', key: 'eeaa-emissions', bindingType: 'admin' as const },
      { icon: BarChart3, labelAr: 'البصمة الكربونية', labelEn: 'Carbon', path: '/dashboard/carbon-footprint', key: 'eeaa-carbon', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ LTRA ═══════════════
  {
    id: 'ltra-tools',
    icon: Truck,
    labelAr: 'رقابة النقل (LTRA)',
    labelEn: 'LTRA',
    visibleFor: ['regulator'],
    items: [
      { icon: Truck, labelAr: 'الأساطيل المرخصة', labelEn: 'Fleet', path: '/dashboard/regulator-ltra?tab=fleet', key: 'ltra-fleet', bindingType: 'admin' as const },
      { icon: Users, labelAr: 'رخص السائقين', labelEn: 'Driver Licenses', path: '/dashboard/regulator-ltra?tab=drivers', key: 'ltra-drivers', bindingType: 'admin' as const },
      { icon: Shield, labelAr: 'تصاريح الخطرة', labelEn: 'Hazmat', path: '/dashboard/regulator-ltra?tab=hazmat', key: 'ltra-hazmat', bindingType: 'admin' as const },
      { icon: FileCheck, labelAr: 'فحص المركبات', labelEn: 'Vehicles', path: '/dashboard/regulator-ltra?tab=vehicles', key: 'ltra-vehicles', bindingType: 'admin' as const },
      { icon: BarChart3, labelAr: 'بلاغات الحوادث', labelEn: 'Incidents', path: '/dashboard/regulator-ltra?tab=incidents', key: 'ltra-incidents', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ IDA ═══════════════
  {
    id: 'ida-tools',
    icon: Factory,
    labelAr: 'الرقابة الصناعية (IDA)',
    labelEn: 'IDA',
    visibleFor: ['regulator'],
    items: [
      { icon: Factory, labelAr: 'السجل الصناعي', labelEn: 'Registry', path: '/dashboard/regulator-ida?tab=registry', key: 'ida-registry', bindingType: 'admin' as const },
      { icon: FileCheck, labelAr: 'تراخيص التشغيل', labelEn: 'Licenses', path: '/dashboard/regulator-ida?tab=licenses', key: 'ida-licenses', bindingType: 'admin' as const },
      { icon: HardHat, labelAr: 'السلامة الصناعية', labelEn: 'Safety', path: '/dashboard/regulator-ida?tab=safety', key: 'ida-safety', bindingType: 'admin' as const },
      { icon: ClipboardCheck, labelAr: 'جولات التفتيش', labelEn: 'Inspections', path: '/dashboard/regulator-ida?tab=inspections', key: 'ida-inspections', bindingType: 'admin' as const },
      { icon: Building2, labelAr: 'المنشآت', labelEn: 'Facilities', path: '/dashboard/regulator-ida?tab=facilities', key: 'ida-facilities', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ الاستشارات ═══════════════
  {
    id: 'consultant-ops',
    icon: User,
    labelAr: 'خدمات الاستشارات',
    labelEn: 'Consulting',
    visibleFor: ['consultant'],
    items: [
      { icon: ClipboardCheck, labelAr: 'التدقيق', labelEn: 'Audits', path: '/dashboard/audit-sessions', key: 'consultant-audits', bindingType: 'hybrid' as const },
      { icon: FileText, labelAr: 'التقارير', labelEn: 'Reports', path: '/dashboard/consultant-reports', key: 'consultant-reports', bindingType: 'hybrid' as const },
      { icon: Shield, labelAr: 'تقييم الامتثال', labelEn: 'Compliance', path: '/dashboard/compliance-assessment', key: 'consultant-compliance', bindingType: 'hybrid' as const },
      { icon: HardHat, labelAr: 'السلامة', labelEn: 'Safety', path: '/dashboard/safety', key: 'consultant-safety', bindingType: 'hybrid' as const },
      { icon: Building2, labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/consultant-clients', key: 'consultant-clients', bindingType: 'partner' as const },
      { icon: Award, labelAr: 'الشهادات', labelEn: 'Certifications', path: '/dashboard/consultant-certifications', key: 'consultant-certifications', bindingType: 'admin' as const },
      { icon: Users, labelAr: 'بوابة الاستشاري', labelEn: 'Portal', path: '/dashboard/consultant-portal', key: 'consultant-portal', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ مكتب الاستشارات ═══════════════
  {
    id: 'consulting-office-ops',
    icon: Building2,
    labelAr: 'إدارة المكتب',
    labelEn: 'Office Management',
    visibleFor: ['consulting_office'],
    items: [
      { icon: Users, labelAr: 'الفريق', labelEn: 'Team', path: '/dashboard/office-consultants', key: 'office-consultants', bindingType: 'internal' as const },
      { icon: ClipboardList, labelAr: 'المهام', labelEn: 'Tasks', path: '/dashboard/office-tasks', key: 'office-tasks', bindingType: 'internal' as const },
      { icon: ClipboardCheck, labelAr: 'التدقيق', labelEn: 'Audits', path: '/dashboard/audit-sessions', key: 'office-audits', bindingType: 'hybrid' as const },
      { icon: FileText, labelAr: 'التقارير', labelEn: 'Reports', path: '/dashboard/consultant-reports', key: 'office-reports', bindingType: 'hybrid' as const },
      { icon: Shield, labelAr: 'الامتثال', labelEn: 'Compliance', path: '/dashboard/compliance-assessment', key: 'office-compliance', bindingType: 'hybrid' as const },
      { icon: Building2, labelAr: 'العملاء', labelEn: 'Clients', path: '/dashboard/consultant-clients', key: 'office-clients', bindingType: 'partner' as const },
      { icon: Award, labelAr: 'الشهادات', labelEn: 'Certifications', path: '/dashboard/consultant-certifications', key: 'office-certifications', bindingType: 'admin' as const },
      { icon: BarChart3, labelAr: 'أداء الفريق', labelEn: 'Performance', path: '/dashboard/office-performance', key: 'office-performance', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ لوحة العمليات ═══════════════
  {
    id: 'operations-board',
    icon: Gauge,
    labelAr: 'لوحة العمليات',
    labelEn: 'Operations Board',
    visibleFor: [],
    items: [
      { icon: Gauge, labelAr: 'لوحة العمليات', labelEn: 'Operations', path: '/dashboard/operations', key: 'operations', bindingType: 'internal' as const },
      { icon: CheckSquare, labelAr: 'المهام', labelEn: 'Tasks', path: '/dashboard/task-board', key: 'task-board', bindingType: 'internal' as const },
      { icon: ClipboardList, labelAr: 'سجل الأنشطة', labelEn: 'Activity Log', path: '/dashboard/activity-log', key: 'activity-log', bindingType: 'internal' as const },
      { icon: FileText, labelAr: 'السجلات الخارجية', labelEn: 'External Records', path: '/dashboard/external-records', key: 'external-records', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ الأجهزة والمستشعرات ═══════════════
  {
    id: 'device-settings',
    icon: Zap,
    labelAr: 'الأجهزة والمستشعرات',
    labelEn: 'Devices & Sensors',
    visibleFor: [],
    items: [
      { icon: MapPin, labelAr: 'إعدادات GPS', labelEn: 'GPS', path: '/dashboard/gps-settings', key: 'gps-settings', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
      { icon: Zap, labelAr: 'إعدادات IoT', labelEn: 'IoT', path: '/dashboard/iot-settings', key: 'iot-settings', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
      { icon: Eye, labelAr: 'الكاميرات', labelEn: 'Cameras', path: '/dashboard/cameras', key: 'cameras', bindingType: 'internal' as const, visibleFor: ['recycler', 'disposal', 'generator', 'transporter'], requiredPermissions: ['manage_settings'] },
    ],
  },

  // ═══════════════ رفع وأرشفة المستندات ═══════════════
  {
    id: 'docs-upload-archive',
    icon: Upload,
    labelAr: 'رفع وأرشفة',
    labelEn: 'Upload & Archive',
    visibleFor: [],
    items: [
      { icon: Upload, labelAr: 'رفع المستندات', labelEn: 'Upload', path: '/dashboard/document-center?tab=upload', key: 'doc-upload', bindingType: 'internal' as const },
      { icon: FolderOpen, labelAr: 'مركز المستندات', labelEn: 'Documents', path: '/dashboard/document-center', key: 'document-center', bindingType: 'internal' as const },
      { icon: FolderOpen, labelAr: 'الأرشيف', labelEn: 'Archive', path: '/dashboard/document-center?tab=archive', key: 'doc-center-archive', bindingType: 'internal' as const },
      { icon: Database, labelAr: 'بياناتي', labelEn: 'My Data', path: '/dashboard/my-data', key: 'my-data', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ الاستوديو والمستندات الذكية ═══════════════
  {
    id: 'docs-ai-studio',
    icon: Sparkles,
    labelAr: 'الاستوديو الذكي',
    labelEn: 'AI Studio',
    visibleFor: ['transporter', 'recycler', 'disposal'],
    items: [
      { icon: Sparkles, labelAr: 'استوديو المستندات', labelEn: 'AI Document Studio', path: '/dashboard/ai-document-studio', key: 'ai-document-studio', bindingType: 'internal' as const },
      { icon: Scale, labelAr: 'المستندات التنظيمية', labelEn: 'Regulatory Docs', path: '/dashboard/regulatory-documents', key: 'regulatory-documents', bindingType: 'admin' as const },
      { icon: Brain, labelAr: 'البيانات المستخرجة بالـ AI', labelEn: 'AI Extracted Data', path: '/dashboard/ai-extracted-data', key: 'ai-extracted-data', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ مركز التوقيعات والتوثيق (مدمج) ═══════════════
  {
    id: 'signatures-center',
    icon: PenTool,
    labelAr: 'مركز التوقيعات والتوثيق',
    labelEn: 'Signatures & Verification Center',
    visibleFor: [],
    items: [
      { icon: PenTool, labelAr: 'التوقيعات الرقمية', labelEn: 'Digital Signatures', path: '/dashboard/document-center?tab=signatures', key: 'doc-center-signatures', bindingType: 'internal' as const },
      { icon: Inbox, labelAr: 'صندوق التوقيعات', labelEn: 'Signing Inbox', path: '/dashboard/signing-inbox', key: 'signing-inbox', badgeKey: 'signing-inbox', bindingType: 'hybrid' as const },
      { icon: Fingerprint, labelAr: 'ختم المستندات', labelEn: 'Document Stamping', path: '/dashboard/admin-document-stamping', key: 'doc-stamping', bindingType: 'internal' as const },
      { icon: CircleDot, labelAr: 'QR وباركود', labelEn: 'QR & Barcode', path: '/dashboard/document-center?tab=qr-barcode', key: 'doc-center-qr', bindingType: 'internal' as const },
      { icon: Shield, labelAr: 'التحقق والأمان', labelEn: 'Verification', path: '/dashboard/document-center?tab=verification', key: 'doc-center-verification', bindingType: 'internal' as const },
      { icon: FileCheck, labelAr: 'التحقق من المستندات', labelEn: 'Document Verify', path: '/dashboard/document-verification', key: 'doc-verification', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ العقود ═══════════════
  {
    id: 'docs-contracts',
    icon: FileSignature,
    labelAr: 'العقود',
    labelEn: 'Contracts',
    visibleFor: [],
    items: [
      { icon: FileSignature, labelAr: 'العقود', labelEn: 'Contracts', path: '/dashboard/document-center?tab=contracts', key: 'doc-center-contracts', bindingType: 'partner' as const },
      { icon: FileText, labelAr: 'القوالب', labelEn: 'Templates', path: '/dashboard/document-center?tab=templates', key: 'doc-center-templates', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ الشهادات والفواتير ═══════════════
  {
    id: 'docs-certs-invoices',
    icon: Award,
    labelAr: 'الشهادات والفواتير',
    labelEn: 'Certificates & Invoices',
    visibleFor: [],
    items: [
      { icon: Award, labelAr: 'الشهادات', labelEn: 'Certificates', path: '/dashboard/document-center?tab=certificates', key: 'doc-center-certificates', bindingType: 'hybrid' as const },
      { icon: Receipt, labelAr: 'الفواتير', labelEn: 'Invoices', path: '/dashboard/document-center?tab=invoices', key: 'doc-center-invoices', bindingType: 'hybrid' as const, requiredPermissions: ['view_accounts'] },
      { icon: Printer, labelAr: 'الطباعة والتصدير', labelEn: 'Print & Export', path: '/dashboard/document-center?tab=print', key: 'doc-center-print', bindingType: 'internal' as const, requiredPermissions: ['export_reports'] },
    ],
  },

  // ═══════════════ المحاسبة ═══════════════
  {
    id: 'accounting-core',
    icon: Calculator,
    labelAr: 'المحاسبة',
    labelEn: 'Accounting',
    visibleFor: [],
    items: [
      { icon: Calculator, labelAr: 'المحاسبة', labelEn: 'Accounting', path: '/dashboard/erp/accounting', key: 'erp-accounting', bindingType: 'internal' as const, requiredPermissions: ['view_accounts', 'view_account_details'] },
      { icon: Activity, labelAr: 'الإيرادات والمصروفات', labelEn: 'Revenue & Expenses', path: '/dashboard/erp/revenue-expenses', key: 'erp-revenue-expenses', bindingType: 'internal' as const, requiredPermissions: ['view_accounts'] },
      { icon: Banknote, labelAr: 'تكلفة البضاعة', labelEn: 'COGS', path: '/dashboard/erp/cogs', key: 'erp-cogs', bindingType: 'internal' as const, requiredPermissions: ['view_accounts'] },
    ],
  },

  // ═══════════════ المخزون والمشتريات ═══════════════
  {
    id: 'inventory-purchasing',
    icon: ShoppingCart,
    labelAr: 'المخزون والمشتريات',
    labelEn: 'Inventory & Purchasing',
    visibleFor: [],
    items: [
      { icon: Package, labelAr: 'المخزون', labelEn: 'Inventory', path: '/dashboard/erp/inventory', key: 'erp-inventory', bindingType: 'internal' as const, requiredPermissions: ['view_accounts'] },
      { icon: ShoppingCart, labelAr: 'المشتريات والمبيعات', labelEn: 'Purchasing & Sales', path: '/dashboard/erp/purchasing-sales', key: 'erp-purchasing-sales', bindingType: 'internal' as const, requiredPermissions: ['view_accounts', 'create_deposits'] },
    ],
  },

  // ═══════════════ التقارير المالية ═══════════════
  {
    id: 'financial-reports',
    icon: BarChart3,
    labelAr: 'التقارير المالية',
    labelEn: 'Financial Reports',
    visibleFor: [],
    items: [
      { icon: BarChart3, labelAr: 'التقارير المالية', labelEn: 'Financial Reports', path: '/dashboard/erp/financial-dashboard', key: 'erp-financial-dashboard', bindingType: 'internal' as const, requiredPermissions: ['view_accounts', 'view_reports'] },
      { icon: GitCompareArrows, labelAr: 'المقارنات', labelEn: 'Comparisons', path: '/dashboard/erp/financial-comparisons', key: 'erp-comparisons', bindingType: 'internal' as const, requiredPermissions: ['view_accounts', 'view_reports'] },
    ],
  },

  // ═══════════════ الموارد البشرية — الأساسي ═══════════════
  {
    id: 'hr-core',
    icon: Users,
    labelAr: 'الموارد البشرية',
    labelEn: 'Human Resources',
    visibleFor: [],
    items: [
      { icon: Users, labelAr: 'HR', labelEn: 'HR', path: '/dashboard/erp/hr', key: 'erp-hr', bindingType: 'internal' as const, requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Network, labelAr: 'الهيكل التنظيمي', labelEn: 'Org Chart', path: '/dashboard/hr/org-chart', key: 'hr-org-chart', bindingType: 'internal' as const },
      { icon: Inbox, labelAr: 'الخدمة الذاتية', labelEn: 'Self Service', path: '/dashboard/hr/self-service', key: 'hr-self-service', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ الرواتب والأداء ═══════════════
  {
    id: 'hr-payroll-performance',
    icon: Banknote,
    labelAr: 'الرواتب والأداء',
    labelEn: 'Payroll & Performance',
    visibleFor: [],
    items: [
      { icon: Banknote, labelAr: 'مسيّر الرواتب', labelEn: 'Payroll', path: '/dashboard/hr/payroll', key: 'hr-payroll', bindingType: 'internal' as const, requiredPermissions: ['manage_members', 'manage_settings'] },
      { icon: Award, labelAr: 'تقييم الأداء', labelEn: 'Performance', path: '/dashboard/hr/performance', key: 'hr-performance', bindingType: 'internal' as const, requiredPermissions: ['manage_members'] },
      { icon: Activity, labelAr: 'الورديات', labelEn: 'Shifts', path: '/dashboard/hr/shifts', key: 'hr-shifts', bindingType: 'internal' as const, requiredPermissions: ['manage_members'] },
      { icon: UserPlus, labelAr: 'نهاية الخدمة', labelEn: 'End of Service', path: '/dashboard/hr/end-of-service', key: 'hr-eos', bindingType: 'internal' as const, requiredPermissions: ['manage_members', 'manage_settings'] },
    ],
  },

  // ═══════════════ الصحة المهنية ═══════════════
  {
    id: 'occupational-health',
    icon: Heart,
    labelAr: 'الصحة المهنية',
    labelEn: 'Occupational Health',
    visibleFor: [],
    items: [
      { icon: Heart, labelAr: 'iRecycle Health', labelEn: 'iRecycle Health', path: '/dashboard/health', key: 'irecycle-health-main', bindingType: 'internal' as const },
      { icon: HardHat, labelAr: 'السلامة المهنية', labelEn: 'Safety & OHS', path: '/dashboard/safety', key: 'ohs-safety', bindingType: 'hybrid' as const },
      { icon: Activity, labelAr: 'البرنامج الطبي', labelEn: 'Medical Program', path: '/dashboard/medical-program', key: 'medical-program', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ المحفظة والتأمين ═══════════════
  {
    id: 'wallet-insurance',
    icon: Wallet,
    labelAr: 'المحفظة والتأمين',
    labelEn: 'Wallet & Insurance',
    visibleFor: ['transporter'],
    items: [
      { icon: Wallet, labelAr: 'المحفظة الرقمية', labelEn: 'Wallet', path: '/dashboard/digital-wallet', key: 'digital-wallet', bindingType: 'internal' as const },
      { icon: Umbrella, labelAr: 'التأمين الذكي', labelEn: 'Insurance', path: '/dashboard/smart-insurance', key: 'smart-insurance', bindingType: 'hybrid' as const },
      { icon: TrendingUp, labelAr: 'العقود الآجلة', labelEn: 'Futures', path: '/dashboard/futures-market', key: 'futures-market', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ التقارير التشغيلية (مدمج: شحنات + سجلات + تحليل) ═══════════════
  {
    id: 'operational-reports',
    icon: BarChart3,
    labelAr: 'التقارير التشغيلية',
    labelEn: 'Operational Reports',
    visibleFor: [],
    items: [
      { icon: BarChart3, labelAr: 'التقارير', labelEn: 'Reports', path: '/dashboard/reports', key: 'reports', bindingType: 'internal' as const, requiredPermissions: ['view_reports', 'create_reports'] },
      { icon: FileText, labelAr: 'تقارير الشحنات', labelEn: 'Shipment Reports', path: '/dashboard/shipment-reports', key: 'shipment-reports', bindingType: 'hybrid' as const, requiredPermissions: ['view_reports', 'view_shipments'] },
      { icon: ClipboardList, labelAr: 'التقرير التجميعي', labelEn: 'Aggregate', path: '/dashboard/aggregate-report', key: 'aggregate-report', bindingType: 'hybrid' as const, requiredPermissions: ['view_reports'] },
      { icon: FileSpreadsheet, labelAr: 'سجل غير خطرة', labelEn: 'Non-Hazardous', path: '/dashboard/non-hazardous-register', key: 'non-hazardous', bindingType: 'admin' as const, requiredPermissions: ['view_reports', 'view_shipments'] },
      { icon: AlertTriangle, labelAr: 'سجل خطرة', labelEn: 'Hazardous', path: '/dashboard/hazardous-register', key: 'hazardous', bindingType: 'admin' as const, requiredPermissions: ['view_reports', 'view_shipments'] },
      { icon: Layers, labelAr: 'تصنيف النفايات', labelEn: 'Waste Types', path: '/dashboard/waste-types', key: 'waste-types', bindingType: 'admin' as const, requiredPermissions: ['view_reports'] },
      { icon: BarChart3, labelAr: 'التحليل التفصيلي', labelEn: 'Detailed Analysis', path: '/dashboard/detailed-waste-analysis', key: 'detailed-waste-analysis', bindingType: 'internal' as const, requiredPermissions: ['view_reports'] },
      { icon: Activity, labelAr: 'خريطة التدفق', labelEn: 'Waste Flow', path: '/dashboard/waste-flow-heatmap', key: 'waste-flow-heatmap', bindingType: 'hybrid' as const, requiredPermissions: ['view_reports'] },
      { icon: BookOpen, labelAr: 'دليل التقارير', labelEn: 'Guide', path: '/dashboard/reports-guide', key: 'reports-guide', bindingType: 'internal' as const, requiredPermissions: ['view_reports'] },
    ],
  },

  // ═══════════════ التقارير البيئية ═══════════════
  {
    id: 'environmental-reports',
    icon: Leaf,
    labelAr: 'التقارير البيئية',
    labelEn: 'Environmental Reports',
    visibleFor: [],
    items: [
      { icon: Leaf, labelAr: 'البصمة الكربونية', labelEn: 'Carbon Footprint', path: '/dashboard/carbon-footprint', key: 'carbon-footprint', bindingType: 'hybrid' as const, requiredPermissions: ['view_reports'] },
      { icon: TreePine, labelAr: 'الاستدامة', labelEn: 'Sustainability', path: '/dashboard/environmental-sustainability', key: 'environmental-sustainability', bindingType: 'hybrid' as const, requiredPermissions: ['view_reports'] },
      { icon: Leaf, labelAr: 'تقارير ESG', labelEn: 'ESG', path: '/dashboard/esg-reports', key: 'esg-reports', bindingType: 'admin' as const, requiredPermissions: ['view_reports'] },
      { icon: Shield, labelAr: 'تقارير السلامة', labelEn: 'OHS', path: '/dashboard/ohs-reports', key: 'ohs-reports', bindingType: 'hybrid' as const, requiredPermissions: ['view_reports'] },
    ],
  },

  // ═══════════════ بورصة المخلفات ═══════════════
  {
    id: 'waste-exchange',
    icon: Store,
    labelAr: 'بورصة المخلفات',
    labelEn: 'Waste Exchange',
    visibleFor: [],
    items: [
      { icon: Store, labelAr: 'السوق', labelEn: 'Marketplace', path: '/dashboard/waste-exchange?tab=marketplace', key: 'waste-exchange-market', bindingType: 'hybrid' as const },
      { icon: Briefcase, labelAr: 'الوساطة', labelEn: 'Broker', path: '/dashboard/waste-exchange?tab=broker', key: 'waste-exchange-broker', bindingType: 'hybrid' as const },
      { icon: Package, labelAr: 'عروضي', labelEn: 'My Listings', path: '/dashboard/waste-exchange?tab=my-listings', key: 'waste-exchange-listings', bindingType: 'hybrid' as const },
      { icon: Handshake, labelAr: 'مزايداتي', labelEn: 'My Bids', path: '/dashboard/waste-exchange?tab=my-bids', key: 'waste-exchange-bids', bindingType: 'hybrid' as const },
      { icon: TrendingUp, labelAr: 'مؤشر الأسعار', labelEn: 'Price Index', path: '/dashboard/waste-exchange?tab=price-index', key: 'waste-exchange-prices', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ سوق B2B ═══════════════
  {
    id: 'b2b-marketplace',
    icon: ShoppingCart,
    labelAr: 'سوق B2B',
    labelEn: 'B2B Marketplace',
    visibleFor: [],
    items: [
      { icon: ShoppingCart, labelAr: 'العروض', labelEn: 'Supply', path: '/dashboard/b2b-marketplace?tab=supply', key: 'b2b-supply', bindingType: 'hybrid' as const },
      { icon: Megaphone, labelAr: 'الطلبات', labelEn: 'Demand', path: '/dashboard/b2b-marketplace?tab=demand', key: 'b2b-demand', bindingType: 'hybrid' as const },
      { icon: Package, labelAr: 'عروضي', labelEn: 'My Listings', path: '/dashboard/b2b-marketplace?tab=my-listings', key: 'b2b-listings', bindingType: 'hybrid' as const },
      { icon: Handshake, labelAr: 'صفقاتي', labelEn: 'Deals', path: '/dashboard/b2b-marketplace?tab=deals', key: 'b2b-deals', bindingType: 'hybrid' as const },
      { icon: ArrowLeftRight, labelAr: 'قواعد الرؤية', labelEn: 'Visibility Rules', path: '/dashboard/b2b-marketplace?tab=rules', key: 'b2b-rules', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ البورصات العالمية والمزادات ═══════════════
  {
    id: 'global-exchange',
    icon: Globe,
    labelAr: 'البورصات والمزادات',
    labelEn: 'Exchanges & Auctions',
    visibleFor: [],
    items: [
      { icon: Globe, labelAr: 'بورصة السلع العالمية', labelEn: 'Commodity Exchange', path: '/dashboard/commodity-exchange', key: 'commodity-exchange', bindingType: 'hybrid' as const },
      { icon: Store, labelAr: 'مزادات المخلفات', labelEn: 'Waste Auctions', path: '/dashboard/waste-auctions', key: 'waste-auctions', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ العروض والخطط ═══════════════
  {
    id: 'quotations-plans',
    icon: FileText,
    labelAr: 'العروض والخطط',
    labelEn: 'Quotations & Plans',
    visibleFor: [],
    items: [
      { icon: FileText, labelAr: 'عروض الأسعار', labelEn: 'Quotations', path: '/dashboard/quotations', key: 'quotations', bindingType: 'partner' as const,
        visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office'] },
      { icon: Scale, labelAr: 'السجل التنظيمي', labelEn: 'Regulatory', path: '/dashboard/regulatory-updates', key: 'regulatory', bindingType: 'admin' as const },
      { icon: ClipboardList, labelAr: 'الخطط التشغيلية', labelEn: 'Plans', path: '/dashboard/operational-plans', key: 'operational-plans', bindingType: 'internal' as const },
      { icon: BookOpen, labelAr: 'القوانين واللوائح', labelEn: 'Laws', path: '/dashboard/laws-regulations', key: 'laws-regulations', bindingType: 'admin' as const,
        visibleFor: ['generator', 'transporter', 'recycler', 'disposal', 'consultant', 'consulting_office', 'admin'] },
    ],
  },

  // ═══════════════ مركز التتبع والخرائط (مدمج) ═══════════════
  {
    id: 'tracking-maps-center',
    icon: MapPin,
    labelAr: 'التتبع والخرائط',
    labelEn: 'Tracking & Maps',
    visibleFor: [],
    items: [
      { icon: MapPin, labelAr: 'مركز التتبع', labelEn: 'Tracking Center', path: '/dashboard/tracking-center', key: 'unified-tracking-center', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'unified-driver-tracking', bindingType: 'internal' as const, requiredPermissions: ['view_drivers', 'manage_drivers'], visibleFor: ['transporter'] },
      { icon: Truck, labelAr: 'خريطة المسارات', labelEn: 'Routes Map', path: '/dashboard/shipment-routes', key: 'unified-shipment-routes', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'], visibleFor: ['transporter'] },
      { icon: Search, labelAr: 'مستكشف الخريطة', labelEn: 'Map Explorer', path: '/dashboard/map-explorer', key: 'map-explorer', bindingType: 'hybrid' as const },
      { icon: Bookmark, labelAr: 'المواقع المحفوظة', labelEn: 'Saved Locations', path: '/dashboard/saved-locations', key: 'saved-locations', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ مركز الطباعة والتصدير (مدمج) ═══════════════
  {
    id: 'print-export-center',
    icon: Printer,
    labelAr: 'مركز الطباعة والتصدير',
    labelEn: 'Print & Export Center',
    visibleFor: [],
    items: [
      { icon: Printer, labelAr: 'مركز الطباعة', labelEn: 'Print Center', path: '/dashboard/print-center', key: 'print-center', bindingType: 'internal' as const, requiredPermissions: ['view_shipments', 'export_reports'] },
      { icon: Receipt, labelAr: 'الفاتورة الإلكترونية', labelEn: 'E-Invoice', path: '/dashboard/e-invoice', key: 'e-invoice', bindingType: 'hybrid' as const, requiredPermissions: ['view_accounts'] },
      { icon: FileSpreadsheet, labelAr: 'تصدير Excel', labelEn: 'Export Excel', path: '/dashboard/reports', key: 'export-excel', bindingType: 'internal' as const, requiredPermissions: ['export_reports'] },
      { icon: FileText, labelAr: 'طباعة المانيفست', labelEn: 'Print Manifest', path: '/dashboard/print-center', key: 'print-manifest', bindingType: 'hybrid' as const, requiredPermissions: ['view_shipments'] },
      { icon: Award, labelAr: 'طباعة الشهادات', labelEn: 'Print Certificates', path: '/dashboard/print-center', key: 'print-certificates', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ الروابط السريعة ═══════════════
  {
    id: 'quick-links',
    icon: LinkIcon,
    labelAr: 'الروابط السريعة',
    labelEn: 'Quick Links',
    visibleFor: [],
    items: [
      { icon: LinkIcon, labelAr: 'روابط الإيداع', labelEn: 'Deposit Links', path: '/dashboard/quick-deposit-links', key: 'quick-deposit-links', bindingType: 'partner' as const, requiredPermissions: ['create_deposits', 'view_accounts'] },
      { icon: Zap, labelAr: 'روابط الشحنات', labelEn: 'Shipment Links', path: '/dashboard/quick-shipment-links', key: 'quick-shipment-links', bindingType: 'partner' as const, requiredPermissions: ['view_shipments', 'create_shipments'] },
      { icon: Truck, labelAr: 'روابط السائقين', labelEn: 'Driver Links', path: '/dashboard/quick-driver-links', key: 'quick-driver-links', bindingType: 'partner' as const, requiredPermissions: ['view_drivers'] },
      { icon: Shield, labelAr: 'وصول محدد', labelEn: 'Scoped Access', path: '/dashboard/scoped-access-links', key: 'scoped-access-links', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
    ],
  },

  // ═══════════════ أدوات AI ═══════════════
  {
    id: 'ai-tools',
    icon: Brain,
    labelAr: 'الذكاء الاصطناعي',
    labelEn: 'AI Tools',
    visibleFor: [],
    items: [
      { icon: Brain, labelAr: 'أدوات AI', labelEn: 'AI Tools', path: '/dashboard/ai-tools', key: 'ai-tools', bindingType: 'hybrid' as const },
      { icon: TrendingUp, labelAr: 'التنبؤ الذكي', labelEn: 'Forecasting', path: '/dashboard/ai-forecasting', key: 'ai-forecasting', bindingType: 'hybrid' as const },
      { icon: Sparkles, labelAr: 'توصيات الوظائف', labelEn: 'Job Recs', path: '/dashboard/smart-job-recommendations', key: 'smart-jobs', bindingType: 'hybrid' as const },
    ],
  },

  // ═══════════════ التعلّم ═══════════════
  {
    id: 'learning',
    icon: GraduationCap,
    labelAr: 'المركز التعليمي',
    labelEn: 'Learning Center',
    visibleFor: [],
    items: [
      { icon: BookOpen, labelAr: 'كتالوج الدورات', labelEn: 'Catalog', path: '/dashboard/learning-center?tab=catalog', key: 'learning-catalog', bindingType: 'internal' as const },
      { icon: TrendingUp, labelAr: 'تقدمي', labelEn: 'Progress', path: '/dashboard/learning-center?tab=progress', key: 'learning-progress', bindingType: 'internal' as const },
      { icon: Award, labelAr: 'شهاداتي', labelEn: 'Certificates', path: '/dashboard/learning-center?tab=certificates', key: 'learning-certs', bindingType: 'internal' as const },
      { icon: BookOpen, labelAr: 'دليل المستخدم', labelEn: 'User Guide', path: '/dashboard/user-guide', key: 'user-guide', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ الإنجازات ═══════════════
  {
    id: 'achievements',
    icon: Trophy,
    labelAr: 'الإنجازات والتميز',
    labelEn: 'Achievements',
    visibleFor: [],
    items: [
      { icon: Trophy, labelAr: 'نظام الإنجازات', labelEn: 'Gamification', path: '/dashboard/gamification', key: 'gamification', bindingType: 'internal' as const },
      { icon: Award, labelAr: 'شهادات التميز', labelEn: 'Pride Certs', path: '/dashboard/pride-certificates', key: 'pride-certificates', bindingType: 'internal' as const },
      { icon: FileText, labelAr: 'منشئ السيرة', labelEn: 'CV Builder', path: '/dashboard/cv-builder', key: 'cv-builder', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ مركز القيادة (أدمن) ═══════════════
  {
    id: 'admin-command-center',
    icon: Zap,
    labelAr: 'مركز القيادة',
    labelEn: 'Command Center',
    visibleFor: ['admin'],
    items: [
      { icon: Zap, labelAr: 'اللوحة التنفيذية', labelEn: 'Executive', path: '/dashboard/executive', key: 'executive-dashboard', bindingType: 'admin' as const },
      { icon: Brain, labelAr: 'العين الذكية', labelEn: 'Smart Eye', path: '/dashboard/smart-insights', key: 'smart-insights', bindingType: 'admin' as const },
      { icon: Activity, labelAr: 'نظرة على النظام', labelEn: 'System Overview', path: '/dashboard/system-overview', key: 'system-overview', bindingType: 'admin' as const },
      { icon: Activity, labelAr: 'حالة النظام', labelEn: 'Status', path: '/dashboard/system-status', key: 'system-status', bindingType: 'admin' as const },
      { icon: BarChart3, labelAr: 'تحليلات متقدمة', labelEn: 'Analytics', path: '/dashboard/advanced-analytics', key: 'advanced-analytics', bindingType: 'admin' as const },
      { icon: Scale, labelAr: 'لوحة الرقابة', labelEn: 'Regulator', path: '/dashboard/regulator', key: 'regulator', bindingType: 'admin' as const },
      { icon: Bell, labelAr: 'إدارة الإشعارات', labelEn: 'Push Notifications', path: '/dashboard/push-notification-stats', key: 'push-notification-stats', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ إدارة الكيانات (أدمن) ═══════════════
  {
    id: 'admin-entity-management',
    icon: Building2,
    labelAr: 'إدارة الكيانات',
    labelEn: 'Entity Management',
    visibleFor: ['admin'],
    items: [
      { icon: Shield, labelAr: 'مراجعة التسجيل', labelEn: 'Onboarding', path: '/dashboard/onboarding-review', key: 'onboarding-review', bindingType: 'admin' as const },
      { icon: CheckSquare, labelAr: 'موافقات الشركات', labelEn: 'Approvals', path: '/dashboard/company-approvals', key: 'company-approvals', badgeKey: 'company-approvals', bindingType: 'admin' as const },
      { icon: Building2, labelAr: 'إدارة الشركات', labelEn: 'Companies', path: '/dashboard/company-management', key: 'company-management', bindingType: 'admin' as const },
      { icon: Building2, labelAr: 'الشركات المنظمة', labelEn: 'Regulated', path: '/dashboard/regulated-companies', key: 'regulated-companies', bindingType: 'admin' as const },
      { icon: BarChart3, labelAr: 'تعداد الكيانات', labelEn: 'Census', path: '/dashboard/entity-census', key: 'entity-census', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ وثائق المنظمات (أدمن) ═══════════════
  {
    id: 'admin-org-docs',
    icon: FileText,
    labelAr: 'وثائق المنظمات',
    labelEn: 'Org Documents',
    visibleFor: ['admin'],
    items: [
      { icon: FileText, labelAr: 'الوثائق', labelEn: 'Documents', path: '/dashboard/organization-documents', key: 'org-docs', badgeKey: 'org-docs', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الإفادات', labelEn: 'Attestations', path: '/dashboard/admin-attestations', key: 'admin-attestations', bindingType: 'admin' as const },
      { icon: FolderCheck, labelAr: 'شهادات التدوير', labelEn: 'Recycling Certs', path: '/dashboard/recycling-certificates', key: 'admin-certs', badgeKey: 'admin-certs', bindingType: 'admin' as const },
      { icon: Fingerprint, labelAr: 'ختم المستندات', labelEn: 'Stamping', path: '/dashboard/admin-document-stamping', key: 'admin-doc-stamping', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ المستخدمون والأسطول (أدمن) ═══════════════
  {
    id: 'admin-users-fleet',
    icon: Truck,
    labelAr: 'المستخدمون والأسطول',
    labelEn: 'Users & Fleet',
    visibleFor: ['admin'],
    items: [
      { icon: UserPlus, labelAr: 'موافقات السائقين', labelEn: 'Driver Approvals', path: '/dashboard/driver-approvals', key: 'driver-approvals', badgeKey: 'driver-approvals', bindingType: 'admin' as const },
      { icon: MapPin, labelAr: 'تتبع السائقين', labelEn: 'Driver Tracking', path: '/dashboard/driver-tracking', key: 'admin-driver-tracking', bindingType: 'admin' as const },
      { icon: Truck, labelAr: 'خريطة السائقين', labelEn: 'Drivers Map', path: '/dashboard/admin-drivers-map', key: 'admin-drivers-map', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ التواصل الآلي (أدمن) ═══════════════
  {
    id: 'admin-communication',
    icon: Bot,
    labelAr: 'التواصل الآلي',
    labelEn: 'Automation',
    visibleFor: ['admin'],
    items: [
      { icon: Radio, labelAr: 'إدارة قنوات البث', labelEn: 'Broadcast Channels', path: '/dashboard/broadcast-channels', key: 'admin-broadcast', bindingType: 'admin' as const },
      { icon: Send, labelAr: 'WaPilot', labelEn: 'WaPilot', path: '/dashboard/wapilot', key: 'wapilot', bindingType: 'admin' as const },
      { icon: Bot, labelAr: 'الوكيل الذكي', labelEn: 'Smart Agent', path: '/dashboard/smart-agent', key: 'smart-agent', bindingType: 'admin' as const },
      { icon: Inbox, labelAr: 'صندوق C2B', labelEn: 'C2B Inbox', path: '/dashboard/c2b-management', key: 'c2b-management', bindingType: 'admin' as const },
      { icon: Headphones, labelAr: 'مركز الاتصال', labelEn: 'Call Center', path: '/dashboard/call-center', key: 'call-center', bindingType: 'admin' as const },
      { icon: Users, labelAr: 'سوق التوظيف', labelEn: 'Recruitment', path: '/dashboard/omaluna', key: 'admin-omaluna', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ الإيرادات (أدمن) ═══════════════
  {
    id: 'admin-finance',
    icon: CreditCard,
    labelAr: 'الإيرادات',
    labelEn: 'Revenue',
    visibleFor: ['admin'],
    items: [
      { icon: CreditCard, labelAr: 'الإيرادات والاشتراكات', labelEn: 'Revenue', path: '/dashboard/admin-revenue', key: 'admin-revenue', bindingType: 'admin' as const },
      { icon: Newspaper, labelAr: 'الإعلانات', labelEn: 'Ads', path: '/dashboard/my-ads', key: 'admin-ads', bindingType: 'admin' as const },
      { icon: Boxes, labelAr: 'خطط الإعلانات', labelEn: 'Ad Plans', path: '/dashboard/ad-plans', key: 'admin-ad-plans', bindingType: 'admin' as const },
      { icon: TreePine, labelAr: 'سوق الخشب', labelEn: 'Wood Market', path: '/dashboard/wood-market', key: 'wood-market', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ المحتوى (أدمن) ═══════════════
  {
    id: 'admin-content',
    icon: Globe,
    labelAr: 'المحتوى والتسويق',
    labelEn: 'Content',
    visibleFor: ['admin'],
    items: [
      { icon: Globe, labelAr: 'الصفحة الرئيسية', labelEn: 'Homepage', path: '/dashboard/homepage-manager', key: 'homepage-manager', bindingType: 'admin' as const },
      { icon: Newspaper, labelAr: 'الأخبار', labelEn: 'News', path: '/dashboard/news-manager', key: 'news-manager', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'المنشورات', labelEn: 'Posts', path: '/dashboard/posts-manager', key: 'posts-manager', bindingType: 'admin' as const },
      { icon: BookOpen, labelAr: 'المدونة', labelEn: 'Blog', path: '/dashboard/blog-manager', key: 'blog-manager', bindingType: 'admin' as const },
      { icon: MessageCircle, labelAr: 'التعليقات', labelEn: 'Testimonials', path: '/dashboard/testimonials-management', key: 'testimonials-management', bindingType: 'admin' as const },
      { icon: Video, labelAr: 'الفيديو', labelEn: 'Video', path: '/dashboard/video-generator', key: 'video-gen', bindingType: 'admin' as const },
      { icon: BookOpen, labelAr: 'البروشور', labelEn: 'Brochure', path: '/dashboard/platform-brochure', key: 'platform-brochure', bindingType: 'admin' as const },
      { icon: PenTool, labelAr: 'القرطاسية', labelEn: 'Stationery', path: '/dashboard/stationery', key: 'stationery', bindingType: 'admin' as const },
      { icon: Monitor, labelAr: 'سكرين شوت', labelEn: 'Screenshots', path: '/dashboard/system-screenshots', key: 'system-screenshots', bindingType: 'admin' as const },
      { icon: Eye, labelAr: 'تحليلات الزوار', labelEn: 'Visitors', path: '/dashboard/visitor-analytics', key: 'visitor-analytics', bindingType: 'admin' as const },
      { icon: Sparkles, labelAr: 'العلامة البيضاء', labelEn: 'White Label', path: '/dashboard/white-label-portal', key: 'white-label-portal', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ البنية التحتية (أدمن) ═══════════════
  {
    id: 'admin-infrastructure',
    icon: Database,
    labelAr: 'البنية التحتية',
    labelEn: 'Infrastructure',
    visibleFor: ['admin'],
    items: [
      { icon: Settings, labelAr: 'أوامر النظام', labelEn: 'Commands', path: '/dashboard/system-commands', key: 'system-commands', bindingType: 'admin' as const },
      { icon: LinkIcon, labelAr: 'إدارة API', labelEn: 'API', path: '/dashboard/api', key: 'api-management', bindingType: 'admin' as const },
      { icon: Shield, labelAr: 'اختبار الأمان', labelEn: 'Security Test', path: '/dashboard/security-testing', key: 'security-testing', bindingType: 'admin' as const },
      { icon: Shield, labelAr: 'الأمن السيبراني', labelEn: 'Cyber Security', path: '/dashboard/admin-cyber-security', key: 'admin-cyber-security', bindingType: 'admin' as const },
      { icon: Database, labelAr: 'تحسين DB', labelEn: 'DB Optimization', path: '/dashboard/db-optimization', key: 'db-optimization', bindingType: 'admin' as const },
      { icon: Lock, labelAr: 'امتثال GDPR', labelEn: 'GDPR', path: '/dashboard/gdpr-compliance', key: 'gdpr-compliance', bindingType: 'admin' as const },
      { icon: Sparkles, labelAr: 'العلامة التجارية', labelEn: 'Branding', path: '/dashboard/admin-branding', key: 'admin-branding', bindingType: 'admin' as const },
      { icon: FileText, labelAr: 'الشروط والسياسات', labelEn: 'Terms', path: '/dashboard/platform-terms', key: 'platform-terms', bindingType: 'admin' as const },
      { icon: Gauge, labelAr: 'النضج الرقمي', labelEn: 'Maturity', path: '/dashboard/digital-maturity', key: 'digital-maturity', bindingType: 'admin' as const },
      { icon: Network, labelAr: 'دليل البنية', labelEn: 'Architecture', path: '/dashboard/architecture-guide', key: 'architecture-guide', bindingType: 'admin' as const },
      { icon: Shield, labelAr: 'الحوكمة', labelEn: 'Governance', path: '/dashboard/governance', key: 'admin-governance', bindingType: 'admin' as const },
      { icon: FolderOpen, labelAr: 'السجل المركزي', labelEn: 'Registry', path: '/dashboard/central-registry', key: 'central-registry', bindingType: 'admin' as const },
      { icon: Database, labelAr: 'الأرشيف الذكي', labelEn: 'Archive', path: '/dashboard/smart-archive', key: 'smart-archive', bindingType: 'admin' as const },
    ],
  },

  // ═══════════════ الدعم الفني ═══════════════
  {
    id: 'support',
    icon: Headphones,
    labelAr: 'الدعم الفني',
    labelEn: 'Support',
    visibleFor: [],
    items: [
      { icon: Headphones, labelAr: 'الدعم', labelEn: 'Support', path: '/dashboard/support', key: 'support', bindingType: 'internal' as const },
      { icon: Activity, labelAr: 'حالة النظام', labelEn: 'Status', path: '/dashboard/system-status', key: 'all-system-status', bindingType: 'internal' as const },
      { icon: Info, labelAr: 'عن المنصة', labelEn: 'About', path: '/dashboard/about-platform', key: 'about-platform', bindingType: 'internal' as const },
    ],
  },

  // ═══════════════ الإعدادات ═══════════════
  {
    id: 'settings-system',
    icon: Settings,
    labelAr: 'الإعدادات',
    labelEn: 'Settings',
    visibleFor: [],
    items: [
      { icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', path: '/dashboard/settings', key: 'settings', bindingType: 'internal' as const, requiredPermissions: ['manage_settings', 'view_settings'] },
      { icon: Wallet, labelAr: 'الاشتراك', labelEn: 'Subscription', path: '/dashboard/subscription', key: 'subscription', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
      { icon: Database, labelAr: 'تصدير البيانات', labelEn: 'Export', path: '/dashboard/data-export', key: 'data-export', bindingType: 'internal' as const, requiredPermissions: ['export_reports', 'export_accounts'] },
      { icon: WifiOff, labelAr: 'بدون إنترنت', labelEn: 'Offline', path: '/dashboard/offline-mode', key: 'offline-mode', bindingType: 'internal' as const },
      { icon: Zap, labelAr: 'إجراءات تلقائية', labelEn: 'Auto Actions', path: '/dashboard/auto-actions', key: 'auto-actions', bindingType: 'internal' as const, requiredPermissions: ['manage_settings'] },
    ],
  },
];

/**
 * Category-based ordering — groups sorted by functional priority
 * ترتيب فئوي: المؤسسة → العمليات → المستندات → التقارير → المالية → التواصل → السوق → AI → أدمن → إعدادات
 */
const CATEGORY_ORDER: string[] = [
  // ═══ 0. الصحة المهنية (أولوية قصوى) ═══
  'occupational-health',

  // ═══ 1. المؤسسة والهوية ═══
  'org-page',
  'identity-attestation',
  'org-structure',
  'partners',
  'governance-security',

  // ═══ 2. العمليات حسب نوع الجهة ═══
  'generator-shipments',
  'generator-certificates',
  'transporter-shipments',
  'transporter-records',
  'transporter-manual',
  'vehicles-containers',
  'driver-management',
  'driver-development',
  'transporter-regulatory',
  'recycler-shipments',
  'recycler-production',
  'disposal-ops',
  'disposal-certs-facilities',
  'consultant-ops',
  'consulting-office-ops',
  'municipal-operations',
  'municipal-contracts',
  'municipal-workforce',
  'municipal-assets',

  // ═══ 3. أدوات التشغيل ═══
  'operations-board',
  'device-settings',

  // ═══ 4. التتبع والخرائط (مدمج) ═══
  'tracking-maps-center',

  // ═══ 5. المستندات ═══
  'docs-upload-archive',
  'docs-ai-studio',
  'signatures-center',
  'docs-contracts',
  'docs-certs-invoices',

  // ═══ 6. الطباعة والتصدير (مدمج) ═══
  'print-export-center',

  // ═══ 7. التقارير (مدمج) ═══
  'operational-reports',
  'environmental-reports',

  // ═══ 8. المالية والمحاسبة ═══
  'accounting-core',
  'inventory-purchasing',
  'financial-reports',
  'wallet-insurance',

  // ═══ 9. الموارد البشرية ═══
  'hr-core',
  'hr-payroll-performance',

  // ═══ 10. التواصل (مدمج) ═══
  'communication-social',
  'notifications-notes',
  'requests',

  // ═══ 11. السوق ═══
  'waste-exchange',
  'b2b-marketplace',
  'global-exchange',
  'quotations-plans',

  // ═══ 12. الروابط السريعة ═══
  'quick-links',

  // ═══ 13. AI والتعلم ═══
  'ai-tools',
  'learning',
  'achievements',

  // ═══ 14. الرقابة والهيئات ═══
  'regulator-command',
  'regulator-enforcement',
  'regulator-licensing',
  'wmra-tools',
  'eeaa-tools',
  'ltra-tools',
  'ida-tools',

  // ═══ 15. مركز القيادة (أدمن) ═══
  'admin-command-center',
  'admin-entity-management',
  'admin-org-docs',
  'admin-users-fleet',
  'admin-communication',
  'admin-finance',
  'admin-content',
  'admin-infrastructure',

  // ═══ 16. الدعم والإعدادات ═══
  'support',
  'settings-system',
];

/**
 * Admin-only group IDs for quick lookup
 */
const ADMIN_GROUP_IDS = new Set([
  'admin-command-center',
  'admin-entity-management',
  'admin-org-docs',
  'admin-users-fleet',
  'admin-communication',
  'admin-finance',
  'admin-content',
  'admin-infrastructure',
]);

/**
 * 14 أقسام هرمية — كل قسم يجمع مجموعات متشابهة تحت عنوان واحد
 */
export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
  {
    id: 'sec-org-identity',
    labelAr: 'المؤسسة والهوية',
    labelEn: 'Organization & Identity',
    icon: Building2,
    groupIds: ['org-page', 'identity-attestation', 'org-structure', 'partners', 'governance-security'],
  },
  {
    id: 'sec-operations',
    labelAr: 'العمليات التشغيلية',
    labelEn: 'Operations',
    icon: Package,
    groupIds: [
      'generator-shipments', 'generator-certificates',
      'transporter-shipments', 'transporter-records', 'transporter-manual',
      'vehicles-containers', 'driver-management', 'driver-development',
      'transporter-regulatory',
      'recycler-shipments', 'recycler-production',
      'disposal-ops', 'disposal-certs-facilities',
      'consultant-ops', 'consulting-office-ops',
      'municipal-operations', 'municipal-contracts', 'municipal-workforce', 'municipal-assets',
      'regulator-command', 'regulator-enforcement', 'regulator-licensing',
    ],
  },
  {
    id: 'sec-ops-tools',
    labelAr: 'أدوات التشغيل',
    labelEn: 'Operations Tools',
    icon: Gauge,
    groupIds: ['operations-board', 'device-settings'],
  },
  {
    id: 'sec-tracking-maps',
    labelAr: 'التتبع والخرائط',
    labelEn: 'Tracking & Maps',
    icon: MapPin,
    groupIds: ['tracking-maps-center'],
  },
  {
    id: 'sec-documents',
    labelAr: 'المستندات والتوثيق',
    labelEn: 'Documents & Records',
    icon: FolderOpen,
    groupIds: ['docs-upload-archive', 'docs-ai-studio', 'signatures-center', 'docs-contracts', 'docs-certs-invoices'],
  },
  {
    id: 'sec-print-export',
    labelAr: 'الطباعة والتصدير',
    labelEn: 'Print & Export',
    icon: Printer,
    groupIds: ['print-export-center'],
  },
  {
    id: 'sec-reports',
    labelAr: 'التقارير والتحليلات',
    labelEn: 'Reports & Analytics',
    icon: BarChart3,
    groupIds: ['operational-reports', 'environmental-reports'],
  },
  {
    id: 'sec-finance',
    labelAr: 'المالية والمحاسبة',
    labelEn: 'Finance & Accounting',
    icon: Calculator,
    groupIds: ['accounting-core', 'inventory-purchasing', 'financial-reports', 'wallet-insurance'],
  },
  {
    id: 'sec-hr',
    labelAr: 'الموارد البشرية',
    labelEn: 'Human Resources',
    icon: Users,
    groupIds: ['hr-core', 'hr-payroll-performance', 'occupational-health'],
  },
  {
    id: 'sec-communication',
    labelAr: 'التواصل',
    labelEn: 'Communication',
    icon: MessageCircle,
    groupIds: ['communication-social', 'notifications-notes', 'requests'],
  },
  {
    id: 'sec-marketplace',
    labelAr: 'السوق والتجارة',
    labelEn: 'Marketplace',
    icon: Store,
    groupIds: ['waste-exchange', 'b2b-marketplace', 'global-exchange', 'quotations-plans'],
  },
  {
    id: 'sec-links',
    labelAr: 'الروابط السريعة',
    labelEn: 'Quick Links',
    icon: LinkIcon,
    groupIds: ['quick-links'],
  },
  {
    id: 'sec-ai-learning',
    labelAr: 'الذكاء الاصطناعي والتعلم',
    labelEn: 'AI & Learning',
    icon: Brain,
    groupIds: ['ai-tools', 'learning', 'achievements'],
  },
  {
    id: 'sec-regulators',
    labelAr: 'الجهات الرقابية',
    labelEn: 'Regulatory Bodies',
    icon: Shield,
    groupIds: ['wmra-tools', 'eeaa-tools', 'ltra-tools', 'ida-tools'],
  },
  {
    id: 'sec-admin',
    labelAr: 'مركز القيادة',
    labelEn: 'Command Center',
    icon: Zap,
    groupIds: ['admin-command-center', 'admin-entity-management', 'admin-org-docs', 'admin-users-fleet', 'admin-communication', 'admin-finance', 'admin-content', 'admin-infrastructure'],
  },
  {
    id: 'sec-support',
    labelAr: 'الدعم والإعدادات',
    labelEn: 'Support & Settings',
    icon: Settings,
    groupIds: ['support', 'settings-system'],
  },
];

/**
 * Get the section a group belongs to
 */
export function getSectionForGroup(groupId: string): SidebarSectionConfig | undefined {
  return SIDEBAR_SECTIONS.find(s => s.groupIds.includes(groupId));
}

/**
 * Sort groups by CATEGORY_ORDER
 */
function sortByCategory(groups: SidebarGroupConfig[]): SidebarGroupConfig[] {
  const orderMap = new Map(CATEGORY_ORDER.map((id, idx) => [id, idx]));
  return [...groups].sort((a, b) => {
    const aIdx = orderMap.get(a.id) ?? 999;
    const bIdx = orderMap.get(b.id) ?? 999;
    return aIdx - bIdx;
  });
}

/**
 * Check if admin is currently viewing as an organization (voluntary switch).
 */
export function getAdminViewingOrg(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_viewing_org');
}

/**
 * Check if current admin view is their own sovereign account.
 */
export function isAdminSovereignView(isAdmin: boolean): boolean {
  return isAdmin && !getAdminViewingOrg();
}

/**
 * Get visible sidebar groups for a given org type — sorted by category.
 */
export function getGroupsForOrgType(orgType: string, isAdmin: boolean): SidebarGroupConfig[] {
  let filtered: SidebarGroupConfig[];

  if (isAdmin) {
    const viewingAsOrg = getAdminViewingOrg();
    if (viewingAsOrg) {
      filtered = sidebarGroups.filter(g => {
        if (ADMIN_GROUP_IDS.has(g.id)) return true;
        if (g.visibleFor.length === 0) return true;
        return g.visibleFor.includes(orgType);
      });
    } else {
      filtered = sidebarGroups.filter(g => {
        if (ADMIN_GROUP_IDS.has(g.id)) return true;
        if (g.visibleFor.length === 0) return true;
        return false;
      });
    }
  } else {
    filtered = sidebarGroups.filter(g => {
      if (g.visibleFor.length === 0) return true;
      return g.visibleFor.includes(orgType);
    });
  }

  return sortByCategory(filtered);
}

/**
 * Filter groups based on employee permissions
 */
export function filterGroupsByPermissions(
  groups: SidebarGroupConfig[],
  permissions: string[],
  isEmployee: boolean
): SidebarGroupConfig[] {
  if (!isEmployee || permissions.length === 0) return groups;

  return groups.map(group => {
    const filteredItems = group.items.filter(item => {
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
      return item.requiredPermissions.some(p => permissions.includes(p));
    });

    if (filteredItems.length === 0) return null;
    return { ...group, items: filteredItems };
  }).filter(Boolean) as SidebarGroupConfig[];
}

/**
 * Default group order for a given org type.
 */
export function getDefaultGroupOrder(orgType: string, isAdmin: boolean): string[] {
  return getGroupsForOrgType(orgType, isAdmin).map(g => g.id);
}
