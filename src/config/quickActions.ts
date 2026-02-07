import {
  Zap,
  Link2,
  FileText,
  Navigation,
  Banknote,
  FileSignature,
  Scale,
  Bot,
  Leaf,
  Send,
  Building2,
  Users,
  Search,
  Stamp,
  MapPin,
  Factory,
  LayoutDashboard,
  Package,
  ClipboardList,
  Shield,
  UserPlus,
  Recycle,
  ChartBar,
  Link,
  Activity,
  Plus,
  FileCheck,
  FolderCheck,
  TrendingUp,
  Settings,
  BarChart3,
  Truck,
  CheckCircle2,
  LucideIcon,
  Sparkles,
  Map,
  Bell,
  MessageCircle,
  Headphones,
  Bookmark,
  User,
  Info,
} from 'lucide-react';

export interface QuickActionConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  path?: string;
  onClick?: string; // Action identifier for dynamic handlers
  iconBgClass?: string;
  category?: 'primary' | 'secondary' | 'utility';
}

// ============= TRANSPORTER QUICK ACTIONS =============
export const transporterQuickActions: QuickActionConfig[] = [
  // Primary Actions
  { id: 'quick-deposit-links', title: 'روابط الإيداع السريع ⚡', subtitle: 'روابط مخصصة لاستقبال الإيداعات', icon: Zap, path: '/dashboard/quick-deposit-links', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'primary' },
  { id: 'quick-shipment-links', title: 'روابط الشحنات السريعة', subtitle: 'روابط مخصصة لتسجيل الشحنات', icon: Link2, path: '/dashboard/quick-shipment-links', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },
  { id: 'transporter-receipts', title: 'شهادات استلام الشحنات', subtitle: 'إصدار وإدارة شهادات الاستلام', icon: FileText, path: '/dashboard/transporter-receipts', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'primary' },
  { id: 'navigation-demo', title: 'عرض توضيحي للملاحة', subtitle: 'محاكاة رحلة نقل كاملة', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'primary' },
  
  // Financial Actions
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'contracts', title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'primary' },
  { id: 'contract-templates', title: 'قوالب العقود', subtitle: 'إنشاء صيغ عقود الجمع والنقل', icon: FileText, path: '/dashboard/contract-templates', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'secondary' },
  { id: 'external-records', title: 'سجل الكميات الخارجية', subtitle: 'تسجيل كميات من مصادر خارجية', icon: Scale, path: '/dashboard/external-records', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'secondary' },
  
  // AI & Reports
  { id: 'transporter-ai-tools', title: 'أدوات تحليل النقل', subtitle: 'إحصائيات وتحليلات الشحنات', icon: Bot, path: '/dashboard/transporter-ai-tools', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'secondary' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'secondary' },
  { id: 'carbon-footprint', title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'secondary' },
  { id: 'my-requests', title: 'طلب تقارير بيئية', subtitle: 'إرسال طلب تقارير للإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  
  // Management
  { id: 'register-company', title: 'تسجيل شركة', subtitle: 'تسجيل شركة مولدة أو مدورة', icon: Building2, path: '/dashboard/register-company', category: 'utility' },
  { id: 'transporter-drivers', title: 'إدارة السائقين', subtitle: 'إضافة أو تعديل السائقين', icon: Users, path: '/dashboard/transporter-drivers', category: 'utility' },
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي الشركة', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'transporter-shipments', title: 'البحث والتصفية', subtitle: 'بحث متقدم عن الشحنات', icon: Search, path: '/dashboard/transporter-shipments', category: 'utility' },
  { id: 'reports', title: 'التقرير المجمع', subtitle: 'طباعة تقرير مجمع للشحنات', icon: FileText, path: '/dashboard/reports', category: 'utility' },
  { id: 'signatures', title: 'الامضاءات والأختام', subtitle: 'رفع امضاء وختم الشركة', icon: Stamp, path: '/dashboard/signatures', category: 'utility' },
  { id: 'driver-tracking', title: 'تتبع السائقين', subtitle: 'متابعة مواقع السائقين', icon: MapPin, path: '/dashboard/driver-tracking', category: 'utility' },
  { id: 'partners', title: 'الشركاء', subtitle: 'عرض الجهات المولدة والمدورة', icon: Factory, path: '/dashboard/partners', category: 'utility' },
];

// ============= ADMIN QUICK ACTIONS =============
// مدير النظام يمتلك صلاحيات المراقبة والتحكم الكامل في جميع جوانب المنصة
export const adminQuickActions: QuickActionConfig[] = [
  // === المراقبة والتحكم المركزي ===
  { id: 'system-overview', title: 'مركز التحكم الرئيسي', subtitle: 'مراقبة شاملة لجميع العمليات والجهات', icon: LayoutDashboard, path: '/dashboard/system-overview', iconBgClass: 'bg-gradient-to-br from-purple-600 to-indigo-700', category: 'primary' },
  { id: 'smart-insights', title: 'العين الذكية', subtitle: 'تحليلات تنبؤية ورؤى استراتيجية', icon: Bot, path: '/dashboard/smart-insights', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'primary' },
  { id: 'activity-log', title: 'سجل النشاطات الكامل', subtitle: 'تتبع جميع العمليات والأحداث', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'primary' },
  { id: 'driver-tracking', title: 'مراقبة السائقين', subtitle: 'تتبع لحظي لجميع المواقع', icon: MapPin, path: '/dashboard/driver-tracking', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'primary' },
  
  // === إدارة الشحنات والعمليات ===
  { id: 'shipments', title: 'إدارة جميع الشحنات', subtitle: 'عرض وتعديل وحذف أي شحنة', icon: Package, path: '/dashboard/shipments', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },
  { id: 'shipments-new', title: 'إنشاء شحنة', subtitle: 'إنشاء شحنة لأي جهة', icon: Plus, path: '/dashboard/shipments/new', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'primary' },
  { id: 'navigation-demo', title: 'محاكاة الملاحة', subtitle: 'اختبار نظام التتبع والتوجيه', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'secondary' },
  
  // === الموافقات والطلبات ===
  { id: 'my-requests', title: 'مركز الموافقات', subtitle: 'جميع الطلبات المعلقة والمراجعات', icon: ClipboardList, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'primary' },
  { id: 'company-approvals', title: 'موافقات الشركات', subtitle: 'قبول أو رفض تسجيل الجهات', icon: Building2, path: '/dashboard/company-approvals', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'secondary' },
  { id: 'driver-approvals', title: 'موافقات السائقين', subtitle: 'اعتماد السائقين الجدد', icon: UserPlus, path: '/dashboard/driver-approvals', iconBgClass: 'bg-gradient-to-br from-cyan-500 to-blue-600', category: 'secondary' },
  { id: 'terms-acceptances', title: 'موافقات الشروط', subtitle: 'متابعة قبول السياسات القانونية', icon: FileCheck, path: '/dashboard/terms-acceptances', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  
  // === الأمان والتحقق ===
  { id: 'document-verification', title: 'التحقق من المستندات', subtitle: 'فحص الوثائق القانونية والتراخيص', icon: Shield, path: '/dashboard/document-verification', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'primary' },
  
  // === إدارة الشركات والمستخدمين ===
  { id: 'company-management', title: 'إدارة جميع الشركات', subtitle: 'تحكم كامل في بيانات الجهات', icon: Building2, path: '/dashboard/company-management', iconBgClass: 'bg-gradient-to-br from-slate-600 to-gray-700', category: 'secondary' },
  { id: 'employees', title: 'إدارة جميع الموظفين', subtitle: 'صلاحيات وأدوار كل الحسابات', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-teal-500 to-emerald-600', category: 'secondary' },
  { id: 'user-linking', title: 'ربط المستخدمين', subtitle: 'إدارة انتماء الحسابات للشركات', icon: Link, path: '/dashboard/user-linking', iconBgClass: 'bg-gradient-to-br from-pink-500 to-rose-600', category: 'secondary' },
  
  // === التقارير والتحليلات ===
  { id: 'reports', title: 'التقارير المركزية', subtitle: 'تقارير شاملة لجميع الجهات', icon: ChartBar, path: '/dashboard/reports', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'secondary' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة', subtitle: 'الأداء البيئي لجميع الجهات', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'utility' },
  { id: 'carbon-footprint', title: 'البصمة الكربونية', subtitle: 'تحليل الانبعاثات الشامل', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'utility' },
  { id: 'ai-tools', title: 'أدوات الذكاء الاصطناعي', subtitle: 'تحليل متقدم للبيانات', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'utility' },
  
  // === إعدادات النظام ===
  { id: 'waste-types', title: 'أنواع المخلفات', subtitle: 'تحرير التصنيفات والفئات', icon: Recycle, path: '/dashboard/waste-types', iconBgClass: 'bg-gradient-to-br from-lime-500 to-green-600', category: 'utility' },
  { id: 'documents', title: 'المستندات والأختام', subtitle: 'إدارة الوثائق الرسمية', icon: FileText, path: '/dashboard/documents', iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-600', category: 'utility' },
  { id: 'contracts', title: 'جميع العقود', subtitle: 'مراقبة عقود كل الجهات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600', category: 'utility' },
  { id: 'deposits-overview', title: 'مراقبة الإيداعات', subtitle: 'جميع المعاملات المالية', icon: Banknote, path: '/dashboard/deposits-overview', iconBgClass: 'bg-gradient-to-br from-emerald-600 to-green-700', category: 'utility' },
];

// ============= GENERATOR QUICK ACTIONS =============
export const generatorQuickActions: QuickActionConfig[] = [
  // Primary Actions
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'contracts', title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'primary' },
  { id: 'generator-receipts', title: 'شهادات استلام الشحنات', subtitle: 'إدارة شهادات استلام الشحنات من الناقلين', icon: FileCheck, path: '/dashboard/generator-receipts', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'primary' },
  { id: 'recycling-certificates', title: 'شهادات إعادة التدوير', subtitle: 'تقارير جهات التدوير المستلمة', icon: FolderCheck, path: '/dashboard/recycling-certificates', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  
  // AI & Environment
  { id: 'ai-tools', title: 'تحليل المخلفات بالذكاء الاصطناعي', subtitle: 'تحليلات دقيقة وتوصيات للحد من المخلفات', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'secondary' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'secondary' },
  { id: 'carbon-footprint', title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'secondary' },
  { id: 'my-requests', title: 'طلب تقارير بيئية', subtitle: 'إرسال طلب تقارير للإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'secondary' },
  
  // Management
  { id: 'shipments', title: 'الشحنات', subtitle: 'عرض جميع الشحنات', icon: Package, path: '/dashboard/shipments', category: 'utility' },
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي المنشأة', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'reports', title: 'التقارير', subtitle: 'تقارير الأداء', icon: TrendingUp, path: '/dashboard/reports', category: 'utility' },
];

// ============= RECYCLER QUICK ACTIONS =============
export const recyclerQuickActions: QuickActionConfig[] = [
  // Primary Actions - Financial
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'contracts', title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'primary' },
  { id: 'external-records', title: 'سجل الكميات الخارجية', subtitle: 'تسجيل كميات من مصادر خارجية', icon: Scale, path: '/dashboard/external-records', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'primary' },
  { id: 'smart-weight-upload', title: 'رفع الوزنة الذكي', subtitle: 'استخراج البيانات من صورة الميزان', icon: Sparkles, onClick: 'openSmartWeightUpload', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'primary' },
  
  // AI & Analytics
  { id: 'recycler-ai-tools', title: 'أدوات تحليل التدوير', subtitle: 'إحصائيات وتحليلات متقدمة', icon: Bot, path: '/dashboard/recycler-ai-tools', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'primary' },
  { id: 'issue-recycling-certificates', title: 'إصدار شهادات التدوير', subtitle: 'إصدار شهادات إعادة التدوير', icon: FolderCheck, path: '/dashboard/issue-recycling-certificates', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  
  // Environment
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'secondary' },
  { id: 'carbon-footprint', title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'secondary' },
  
  // Operations
  { id: 'shipments', title: 'الشحنات الواردة', subtitle: 'عرض وإدارة الشحنات', icon: Package, path: '/dashboard/shipments', category: 'utility' },
  { id: 'confirm-receipt', title: 'تأكيد الاستلام', subtitle: 'تأكيد استلام الشحنات', icon: CheckCircle2, path: '/dashboard/shipments', category: 'utility' },
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي المنشأة', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'reports', title: 'التقارير', subtitle: 'تقارير التدوير والأداء', icon: BarChart3, path: '/dashboard/reports', category: 'utility' },
  { id: 'track-shipments', title: 'تتبع الشحنات', subtitle: 'متابعة الشحنات القادمة', icon: Truck, path: '/dashboard/shipments', category: 'utility' },
  { id: 'documents', title: 'مستندات التدوير', subtitle: 'طباعة شهادات وأختام', icon: FileText, path: '/dashboard/documents', category: 'utility' },
  { id: 'processing-stats', title: 'إحصائيات المعالجة', subtitle: 'تحليل أداء التدوير', icon: TrendingUp, path: '/dashboard/reports', category: 'utility' },
  { id: 'settings', title: 'الإعدادات', subtitle: 'إعدادات المنشأة', icon: Settings, path: '/dashboard/settings', category: 'utility' },
];

// ============= DRIVER QUICK ACTIONS =============
export const driverQuickActions: QuickActionConfig[] = [
  // Primary Actions - Navigation & Location
  { id: 'my-location', title: 'عرض موقعي', subtitle: 'عرض موقعك الحالي على الخريطة', icon: Map, onClick: 'openLiveMap', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'primary' },
  { id: 'navigation-demo', title: 'عرض توضيحي للملاحة', subtitle: 'محاكاة رحلة نقل كاملة', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },
  { id: 'transporter-shipments', title: 'شحناتي', subtitle: 'عرض الشحنات المسندة إليك', icon: Package, path: '/dashboard/transporter-shipments', iconBgClass: 'bg-gradient-to-br from-primary to-blue-600', category: 'primary' },
  { id: 'saved-locations', title: 'المواقع المحفوظة', subtitle: 'الوجهات المفضلة والمتكررة', icon: Bookmark, path: '/dashboard/saved-locations', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'primary' },
  
  // Profile & Settings
  { id: 'driver-profile', title: 'ملف السائق', subtitle: 'عرض وتعديل بياناتك الشخصية', icon: User, path: '/dashboard/driver-profile', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'driver-data', title: 'بيانات المركبة', subtitle: 'معلومات الرخصة والمركبة', icon: Truck, path: '/dashboard/driver-data', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'secondary' },
  { id: 'settings', title: 'إعدادات الحساب', subtitle: 'تعديل إعدادات حسابك', icon: Settings, onClick: 'openSettings', iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-600', category: 'secondary' },
  
  // Communication
  { id: 'chat', title: 'المحادثات', subtitle: 'التواصل مع الفريق والشركاء', icon: MessageCircle, path: '/dashboard/chat', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'utility' },
  { id: 'my-requests', title: 'طلباتي', subtitle: 'عرض وإدارة طلباتك', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  { id: 'notifications', title: 'الإشعارات', subtitle: 'التنبيهات والإخطارات', icon: Bell, path: '/dashboard/notifications', iconBgClass: 'bg-gradient-to-br from-red-500 to-rose-600', category: 'utility' },
  
  // Support & Info
  { id: 'support', title: 'الدعم الفني', subtitle: 'تواصل مع فريق الدعم', icon: Headphones, path: '/dashboard/support', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'utility' },
  { id: 'map-explorer', title: 'استكشاف الخريطة', subtitle: 'البحث عن المواقع والوجهات', icon: Search, path: '/dashboard/map-explorer', category: 'utility' },
  { id: 'about-platform', title: 'عن المنصة', subtitle: 'معلومات عن iRecycle', icon: Info, path: '/dashboard/about-platform', category: 'utility' },
];

// ============= HELPER FUNCTIONS =============

/**
 * Get quick actions by user type
 */
export function getQuickActionsByType(
  type: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver'
): QuickActionConfig[] {
  switch (type) {
    case 'admin':
      return adminQuickActions;
    case 'transporter':
      return transporterQuickActions;
    case 'generator':
      return generatorQuickActions;
    case 'recycler':
      return recyclerQuickActions;
    case 'driver':
      return driverQuickActions;
    default:
      return generatorQuickActions;
  }
}

/**
 * Get quick actions filtered by category
 */
export function getQuickActionsByCategory(
  actions: QuickActionConfig[],
  category: 'primary' | 'secondary' | 'utility' | 'all'
): QuickActionConfig[] {
  if (category === 'all') return actions;
  return actions.filter((action) => action.category === category);
}

/**
 * Get sidebar-compatible menu items from quick actions
 * Removes duplicates and onClick-only actions
 */
export function getSidebarItemsFromQuickActions(
  actions: QuickActionConfig[]
): { icon: LucideIcon; label: string; path: string; key: string }[] {
  const seen = new Set<string>();
  return actions
    .filter((action) => action.path && !seen.has(action.path) && seen.add(action.path))
    .map((action) => ({
      icon: action.icon,
      label: action.title.replace(' ⚡', ''), // Remove emoji
      path: action.path!,
      key: `quick-${action.id}`,
    }));
}
