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
  QrCode,
  ScanLine,
  Trophy,
  Network,
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
// الجهة الناقلة: مرتبة حسب الأولوية اليومية الفعلية
export const transporterQuickActions: QuickActionConfig[] = [
  // 1️⃣ الأكثر استخداماً يومياً (حرج)
  { id: 'create-shipment', title: 'إنشاء شحنة جديدة', subtitle: 'تسجيل شحنة لأي شريك', icon: Plus, path: '/dashboard/shipments/new', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'transporter-shipments', title: 'إدارة الشحنات', subtitle: 'عرض وتتبع جميع الشحنات', icon: Package, path: '/dashboard/transporter-shipments', iconBgClass: 'bg-gradient-to-br from-primary to-blue-600', category: 'primary' },
  { id: 'driver-tracking', title: 'تتبع السائقين', subtitle: 'مراقبة مواقع السائقين لحظياً', icon: MapPin, path: '/dashboard/driver-tracking', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'primary' },
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'transporter-receipts', title: 'شهادات استلام الشحنات', subtitle: 'إصدار وإدارة شهادات الاستلام', icon: FileText, path: '/dashboard/transporter-receipts', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'primary' },
  { id: 'smart-weight-upload', title: 'رفع الوزنة الذكي', subtitle: 'استخراج البيانات من صورة الميزان', icon: Sparkles, onClick: 'openSmartWeightUpload', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'primary' },
  { id: 'collection-requests', title: 'طلبات الجمع', subtitle: 'استقبال طلبات الجمع من المولدين', icon: ClipboardList, path: '/dashboard/collection-requests', iconBgClass: 'bg-gradient-to-br from-orange-500 to-red-500', category: 'primary' },

  // 2️⃣ مهم يومي/أسبوعي
  { id: 'transporter-drivers', title: 'إدارة السائقين', subtitle: 'إضافة وتعديل بيانات السائقين', icon: Users, path: '/dashboard/transporter-drivers', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'quick-shipment-links', title: 'روابط الشحنات السريعة', subtitle: 'روابط مخصصة لتسجيل الشحنات', icon: Link2, path: '/dashboard/quick-shipment-links', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'secondary' },
  { id: 'quick-deposit-links', title: 'روابط الإيداع السريع', subtitle: 'روابط مخصصة لاستقبال الإيداعات', icon: Zap, path: '/dashboard/quick-deposit-links', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'secondary' },
  { id: 'contracts', title: 'العقود والاتفاقيات', subtitle: 'إدارة عقود الجمع والنقل', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'external-records', title: 'سجل الكميات الخارجية', subtitle: 'تسجيل كميات من مصادر خارجية', icon: Scale, path: '/dashboard/external-records', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'secondary' },
  { id: 'navigation-demo', title: 'نظام الملاحة', subtitle: 'محاكاة رحلة نقل كاملة', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'secondary' },
  { id: 'partners', title: 'الجهات المرتبطة', subtitle: 'الجهات المولدة والمدورة', icon: Factory, path: '/dashboard/partners', iconBgClass: 'bg-gradient-to-br from-slate-500 to-gray-600', category: 'secondary' },

  // 3️⃣ الأسطول والصيانة
  { id: 'tracking-center', title: 'مركز التتبع المباشر', subtitle: 'مراقبة لحظية لجميع الشحنات', icon: MapPin, path: '/dashboard/tracking-center', iconBgClass: 'bg-gradient-to-br from-cyan-500 to-blue-600', category: 'secondary' },
  { id: 'shipment-routes', title: 'خريطة المسارات', subtitle: 'تتبع مسارات الشحنات', icon: Map, path: '/dashboard/shipment-routes', iconBgClass: 'bg-gradient-to-br from-teal-500 to-emerald-600', category: 'secondary' },
  { id: 'preventive-maintenance', title: 'الصيانة الوقائية', subtitle: 'جدولة صيانة المركبات', icon: Wrench, path: '/dashboard/preventive-maintenance', iconBgClass: 'bg-gradient-to-br from-orange-500 to-red-600', category: 'secondary' },
  { id: 'driver-permits', title: 'تصاريح السائقين', subtitle: 'إدارة تصاريح وتراخيص السائقين', icon: Shield, path: '/dashboard/driver-permits', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-purple-600', category: 'secondary' },
  { id: 'driver-academy', title: 'أكاديمية السائقين', subtitle: 'برامج تدريبية وشهادات', icon: GraduationCap, path: '/dashboard/driver-academy', iconBgClass: 'bg-gradient-to-br from-violet-500 to-indigo-600', category: 'secondary' },
  { id: 'driver-rewards', title: 'مكافآت السائقين', subtitle: 'نظام المكافآت والحوافز', icon: Trophy, path: '/dashboard/driver-rewards', iconBgClass: 'bg-gradient-to-br from-yellow-500 to-amber-600', category: 'secondary' },

  // 4️⃣ المركز التنظيمي
  { id: 'delivery-declarations', title: 'إقرارات التسليم', subtitle: 'إدارة إقرارات تسليم الشحنات', icon: FileCheck, path: '/dashboard/delivery-declarations', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'secondary' },
  { id: 'recycling-certificates', title: 'شهادات التدوير', subtitle: 'شهادات إعادة التدوير', icon: FolderCheck, path: '/dashboard/recycling-certificates', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'secondary' },
  { id: 'safety', title: 'السلامة المهنية', subtitle: 'إدارة السلامة والصحة المهنية', icon: HardHat, path: '/dashboard/safety', iconBgClass: 'bg-gradient-to-br from-red-500 to-rose-600', category: 'secondary' },

  // 5️⃣ أدوات وتقارير
  { id: 'reports', title: 'التقارير', subtitle: 'تقارير الشحنات والأداء', icon: BarChart3, path: '/dashboard/reports', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'utility' },
  { id: 'transporter-ai-tools', title: 'تحليلات الذكاء الاصطناعي', subtitle: 'إحصائيات وتحليلات متقدمة', icon: Bot, path: '/dashboard/transporter-ai-tools', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'utility' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة', subtitle: 'تحليل الأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'utility' },
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'صلاحيات فريق العمل', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'org-structure', title: 'الهيكل التنظيمي', subtitle: 'الأقسام والمناصب الوظيفية', icon: Network, path: '/dashboard/org-structure', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600', category: 'utility' },
  { id: 'my-requests', title: 'الطلبات', subtitle: 'طلباتي ومراسلات الإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  { id: 'activity-log', title: 'سجل النشاطات', subtitle: 'تتبع جميع العمليات', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'utility' },
  { id: 'qr-scanner', title: 'ماسح QR', subtitle: 'التحقق من صحة المستندات', icon: ScanLine, path: '/scan', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'utility' },
  { id: 'pride-certificates', title: 'شهادات الفخر', subtitle: 'شهادات التقدير والإنجازات البيئية', icon: Trophy, path: '/dashboard/pride-certificates', iconBgClass: 'bg-gradient-to-br from-yellow-500 to-amber-600', category: 'utility' },

  // 6️⃣ مركز المستندات
  { id: 'ai-document-studio', title: 'استوديو المستندات الذكي', subtitle: 'إنشاء مستندات بالذكاء الاصطناعي', icon: Sparkles, path: '/dashboard/ai-document-studio', iconBgClass: 'bg-gradient-to-br from-purple-500 to-pink-600', category: 'utility' },
  { id: 'document-center', title: 'مركز المستندات', subtitle: 'إدارة جميع المستندات والملفات', icon: FolderOpen, path: '/dashboard/document-center', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'utility' },
  { id: 'regulatory-documents', title: 'المستندات التنظيمية', subtitle: 'الوثائق الرسمية والتراخيص', icon: Scale, path: '/dashboard/regulatory-documents', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'utility' },
  { id: 'my-data', title: 'بياناتي', subtitle: 'إدارة البيانات الشخصية والمؤسسية', icon: Database, path: '/dashboard/my-data', iconBgClass: 'bg-gradient-to-br from-slate-500 to-gray-600', category: 'utility' },

  // 7️⃣ المالية
  { id: 'accounting', title: 'المحاسبة', subtitle: 'النظام المحاسبي المتكامل', icon: Calculator, path: '/dashboard/erp/accounting', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'utility' },
  { id: 'financial-dashboard', title: 'التقارير المالية', subtitle: 'لوحة مالية شاملة', icon: BarChart3, path: '/dashboard/erp/financial-dashboard', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'utility' },
  { id: 'smart-insurance', title: 'التأمين الذكي', subtitle: 'إدارة وثائق التأمين', icon: Umbrella, path: '/dashboard/smart-insurance', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'utility' },
  { id: 'digital-wallet', title: 'المحفظة الرقمية', subtitle: 'المعاملات المالية الرقمية', icon: Wallet, path: '/dashboard/digital-wallet', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'utility' },

  // 8️⃣ التواصل والتبادل
  { id: 'chat', title: 'الرسائل', subtitle: 'التواصل مع الشركاء', icon: MessageCircle, path: '/dashboard/chat', iconBgClass: 'bg-gradient-to-br from-pink-500 to-rose-600', category: 'utility' },
  { id: 'waste-exchange', title: 'بورصة المخلفات', subtitle: 'عرض وشراء المخلفات', icon: Store, path: '/dashboard/waste-exchange', iconBgClass: 'bg-gradient-to-br from-cyan-500 to-sky-600', category: 'utility' },
  { id: 'b2b-marketplace', title: 'سوق B2B', subtitle: 'السوق التجاري بين الجهات', icon: ShoppingCart, path: '/dashboard/b2b-marketplace', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'utility' },
  { id: 'bulk-weight-entries', title: 'الوزنات الجماعية', subtitle: 'تسجيل وزنات متعددة دفعة واحدة', icon: Scale, path: '/dashboard/bulk-weight-entries', iconBgClass: 'bg-gradient-to-br from-slate-500 to-gray-600', category: 'utility' },
  { id: 'manual-shipment', title: 'شحنة يدوية', subtitle: 'إنشاء شحنة بإدخال يدوي', icon: FileText, path: '/dashboard/manual-shipment', iconBgClass: 'bg-gradient-to-br from-amber-500 to-yellow-600', category: 'utility' },
  { id: 'print-center', title: 'مركز الطباعة', subtitle: 'طباعة المستندات والتقارير', icon: Printer, path: '/dashboard/print-center', iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-600', category: 'utility' },
  { id: 'map-explorer', title: 'مستكشف الخريطة', subtitle: 'استكشاف المواقع على الخريطة', icon: Search, path: '/dashboard/map-explorer', iconBgClass: 'bg-gradient-to-br from-teal-500 to-emerald-600', category: 'utility' },
  { id: 'quotations', title: 'عروض الأسعار', subtitle: 'إدارة عروض الأسعار', icon: FileText, path: '/dashboard/quotations', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'utility' },
  { id: 'hr-payroll', title: 'مسيّر الرواتب', subtitle: 'إدارة رواتب الموظفين', icon: Banknote, path: '/dashboard/hr/payroll', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'utility' },
  { id: 'laws-regulations', title: 'القوانين واللوائح', subtitle: 'مرجع القوانين البيئية', icon: BookOpen, path: '/dashboard/laws-regulations', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'utility' },
];

// ============= ADMIN QUICK ACTIONS =============
// مدير النظام: المراقبة والتحكم الكامل في جميع جوانب المنصة
export const adminQuickActions: QuickActionConfig[] = [
  // 1️⃣ المراقبة المركزية
  { id: 'system-overview', title: 'مركز التحكم الرئيسي', subtitle: 'مراقبة شاملة لجميع العمليات', icon: LayoutDashboard, path: '/dashboard/system-overview', iconBgClass: 'bg-gradient-to-br from-purple-600 to-indigo-700', category: 'primary' },
  { id: 'smart-insights', title: 'العين الذكية', subtitle: 'تحليلات تنبؤية ورؤى استراتيجية', icon: Bot, path: '/dashboard/smart-insights', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'primary' },
  { id: 'activity-log', title: 'سجل النشاطات', subtitle: 'تتبع جميع العمليات والأحداث', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'primary' },
  { id: 'driver-tracking', title: 'مراقبة السائقين', subtitle: 'تتبع لحظي لجميع المواقع', icon: MapPin, path: '/dashboard/driver-tracking', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'primary' },
  
  // 2️⃣ إدارة الشحنات
  { id: 'shipments', title: 'جميع الشحنات', subtitle: 'عرض وتعديل وحذف أي شحنة', icon: Package, path: '/dashboard/shipments', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },
  { id: 'shipments-new', title: 'إنشاء شحنة', subtitle: 'إنشاء شحنة لأي جهة', icon: Plus, path: '/dashboard/shipments/new', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'primary' },
  
  // 3️⃣ الموافقات والأمان
  { id: 'my-requests', title: 'مركز الموافقات', subtitle: 'جميع الطلبات المعلقة', icon: ClipboardList, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'secondary' },
  { id: 'company-approvals', title: 'موافقات الشركات', subtitle: 'قبول أو رفض تسجيل الجهات', icon: Building2, path: '/dashboard/company-approvals', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'secondary' },
  { id: 'driver-approvals', title: 'موافقات السائقين', subtitle: 'اعتماد السائقين الجدد', icon: UserPlus, path: '/dashboard/driver-approvals', iconBgClass: 'bg-gradient-to-br from-cyan-500 to-blue-600', category: 'secondary' },
  { id: 'terms-acceptances', title: 'موافقات الشروط والأحكام', subtitle: 'متابعة موافقات جميع الجهات', icon: FileCheck, path: '/dashboard/terms-acceptances', iconBgClass: 'bg-gradient-to-br from-purple-500 to-violet-600', category: 'secondary' },
  { id: 'document-verification', title: 'التحقق من المستندات', subtitle: 'فحص الوثائق والتراخيص', icon: Shield, path: '/dashboard/document-verification', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'secondary' },
  { id: 'qr-scanner', title: 'ماسح QR', subtitle: 'مسح وتحقق من أي مستند', icon: ScanLine, path: '/scan', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'secondary' },
  
  // 4️⃣ إدارة الشركات والمستخدمين
  { id: 'company-management', title: 'إدارة الشركات', subtitle: 'تحكم في بيانات جميع الجهات', icon: Building2, path: '/dashboard/company-management', iconBgClass: 'bg-gradient-to-br from-slate-600 to-gray-700', category: 'secondary' },
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'صلاحيات وأدوار الحسابات', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-teal-500 to-emerald-600', category: 'secondary' },
  { id: 'user-linking', title: 'ربط المستخدمين', subtitle: 'ربط الحسابات بالشركات', icon: Link, path: '/dashboard/user-linking', iconBgClass: 'bg-gradient-to-br from-pink-500 to-rose-600', category: 'utility' },
  
  // 5️⃣ التقارير والتحليلات
  { id: 'reports', title: 'التقارير المركزية', subtitle: 'تقارير شاملة لجميع الجهات', icon: ChartBar, path: '/dashboard/reports', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'utility' },
  { id: 'ai-tools', title: 'أدوات الذكاء الاصطناعي', subtitle: 'تحليل متقدم للبيانات', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'utility' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة', subtitle: 'الأداء البيئي لجميع الجهات', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'utility' },
  
  // 6️⃣ إعدادات النظام
  { id: 'waste-types', title: 'أنواع المخلفات', subtitle: 'تحرير التصنيفات والفئات', icon: Recycle, path: '/dashboard/waste-types', iconBgClass: 'bg-gradient-to-br from-lime-500 to-green-600', category: 'utility' },
  { id: 'contracts', title: 'جميع العقود', subtitle: 'مراقبة عقود كل الجهات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600', category: 'utility' },
  { id: 'navigation-demo', title: 'محاكاة الملاحة', subtitle: 'اختبار نظام التتبع', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'utility' },
  { id: 'pride-certificates', title: 'شهادات الفخر', subtitle: 'شهادات التقدير لكافة الجهات', icon: Trophy, path: '/dashboard/pride-certificates', iconBgClass: 'bg-gradient-to-br from-yellow-500 to-amber-600', category: 'utility' },
  { id: 'demo-scenario', title: 'تجربة افتراضية', subtitle: 'محاكاة شحنة كاملة بجميع الجهات', icon: Sparkles, path: '/dashboard/demo-scenario', iconBgClass: 'bg-gradient-to-br from-purple-500 to-pink-600', category: 'utility' },
];

// ============= GENERATOR QUICK ACTIONS =============
// الجهة المولدة: التركيز على طلب الجمع وتتبع الشحنات والشهادات البيئية
export const generatorQuickActions: QuickActionConfig[] = [
  // 1️⃣ حرج يومي - طلب جمع المخلفات وتتبعها
  { id: 'shipments', title: 'شحناتي', subtitle: 'عرض وتتبع جميع الشحنات', icon: Package, path: '/dashboard/shipments', iconBgClass: 'bg-gradient-to-br from-primary to-blue-600', category: 'primary' },
  { id: 'collection-requests', title: 'طلب جمع مخلفات', subtitle: 'إرسال طلب جمع لجهة النقل', icon: Truck, path: '/dashboard/collection-requests', iconBgClass: 'bg-gradient-to-br from-orange-500 to-red-500', category: 'primary' },
  { id: 'generator-receipts', title: 'شهادات التسليم', subtitle: 'إصدار وعرض شهادات التسليم والاستلام', icon: FileCheck, path: '/dashboard/generator-receipts', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600', category: 'primary' },
  { id: 'recycling-certificates', title: 'شهادات التدوير', subtitle: 'شهادات إعادة التدوير من المدوّرين', icon: FolderCheck, path: '/dashboard/recycling-certificates', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'qr-scanner', title: 'ماسح QR', subtitle: 'مسح والتحقق من المستندات', icon: ScanLine, path: '/scan', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },

  // 2️⃣ مهم أسبوعي - البيئة والعقود
  { id: 'contracts', title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'secondary' },
  { id: 'carbon-footprint', title: 'البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'secondary' },
  { id: 'partners', title: 'الجهات المرتبطة', subtitle: 'الناقلون والمدوّرون', icon: Factory, path: '/dashboard/partners', iconBgClass: 'bg-gradient-to-br from-slate-500 to-gray-600', category: 'secondary' },
  { id: 'reports', title: 'التقارير', subtitle: 'تقارير الأداء والإحصائيات', icon: TrendingUp, path: '/dashboard/reports', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'secondary' },
  { id: 'ai-tools', title: 'تحليل بالذكاء الاصطناعي', subtitle: 'تحليلات وتوصيات ذكية', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'secondary' },

  // 3️⃣ أدوات وإدارة
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'صلاحيات فريق العمل', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'org-structure', title: 'الهيكل التنظيمي', subtitle: 'الأقسام والمناصب الوظيفية', icon: Network, path: '/dashboard/org-structure', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600', category: 'utility' },
  { id: 'my-requests', title: 'الطلبات', subtitle: 'طلباتي ومراسلات الإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  { id: 'activity-log', title: 'سجل النشاطات', subtitle: 'تتبع جميع العمليات', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'utility' },
  { id: 'pride-certificates', title: 'شهادات الفخر', subtitle: 'شهادات التقدير والإنجازات البيئية', icon: Trophy, path: '/dashboard/pride-certificates', iconBgClass: 'bg-gradient-to-br from-yellow-500 to-amber-600', category: 'utility' },
];

// ============= RECYCLER QUICK ACTIONS =============
// الجهة المدورة: التركيز على استلام المواد، الوزن، وإصدار الشهادات
export const recyclerQuickActions: QuickActionConfig[] = [
  // 1️⃣ حرج يومي - الاستلام والوزن والشهادات
  { id: 'shipments', title: 'الشحنات الواردة', subtitle: 'عرض وإدارة الشحنات المستلمة', icon: Package, path: '/dashboard/shipments', iconBgClass: 'bg-gradient-to-br from-primary to-blue-600', category: 'primary' },
  { id: 'smart-weight-upload', title: 'رفع الوزنة الذكي', subtitle: 'استخراج البيانات من صورة الميزان', icon: Sparkles, onClick: 'openSmartWeightUpload', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'primary' },
  { id: 'issue-recycling-certificates', title: 'إصدار شهادات التدوير', subtitle: 'إصدار شهادات إعادة التدوير', icon: FolderCheck, path: '/dashboard/issue-recycling-certificates', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'external-records', title: 'سجل الكميات الخارجية', subtitle: 'تسجيل كميات من مصادر خارجية', icon: Scale, path: '/dashboard/external-records', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'primary' },
  { id: 'qr-scanner', title: 'ماسح QR', subtitle: 'مسح والتحقق من المستندات', icon: ScanLine, path: '/scan', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },

  // 2️⃣ مهم أسبوعي - التحليلات والعقود
  { id: 'contracts', title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'partners', title: 'الجهات المرتبطة', subtitle: 'المولدون والناقلون', icon: Factory, path: '/dashboard/partners', iconBgClass: 'bg-gradient-to-br from-slate-500 to-gray-600', category: 'secondary' },
  { id: 'reports', title: 'التقارير', subtitle: 'تقارير التدوير والأداء', icon: BarChart3, path: '/dashboard/reports', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'secondary' },
  { id: 'recycler-ai-tools', title: 'تحليلات الذكاء الاصطناعي', subtitle: 'إحصائيات وتحليلات متقدمة', icon: Bot, path: '/dashboard/recycler-ai-tools', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'secondary' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة', subtitle: 'تحليل الأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'secondary' },

  // 3️⃣ أدوات وإدارة
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'صلاحيات فريق العمل', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'org-structure', title: 'الهيكل التنظيمي', subtitle: 'الأقسام والمناصب الوظيفية', icon: Network, path: '/dashboard/org-structure', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600', category: 'utility' },
  { id: 'my-requests', title: 'الطلبات', subtitle: 'طلباتي ومراسلات الإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  { id: 'activity-log', title: 'سجل النشاطات', subtitle: 'تتبع جميع العمليات', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'utility' },
  { id: 'pride-certificates', title: 'شهادات الفخر', subtitle: 'شهادات التقدير والإنجازات البيئية', icon: Trophy, path: '/dashboard/pride-certificates', iconBgClass: 'bg-gradient-to-br from-yellow-500 to-amber-600', category: 'utility' },
];

// ============= DISPOSAL QUICK ACTIONS =============
// جهة التخلص النهائي: التركيز على استقبال ومعالجة المخلفات الخطرة والشهادات
export const disposalQuickActions: QuickActionConfig[] = [
  // 1️⃣ حرج يومي - الاستقبال والمعالجة
  { id: 'disposal-operations', title: 'عمليات التخلص', subtitle: 'عرض وإدارة جميع العمليات', icon: Package, path: '/dashboard/disposal/operations', iconBgClass: 'bg-gradient-to-br from-red-500 to-orange-600', category: 'primary' },
  { id: 'disposal-new-operation', title: 'تسجيل عملية جديدة', subtitle: 'تسجيل عملية تخلص جديدة', icon: Plus, path: '/dashboard/disposal/operations/new', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'disposal-incoming', title: 'الطلبات الواردة', subtitle: 'طلبات التخلص من الجهات المرتبطة', icon: Truck, path: '/dashboard/disposal/incoming-requests', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'primary' },
  { id: 'smart-weight-upload', title: 'رفع الوزنة الذكي', subtitle: 'استخراج البيانات من صورة الميزان', icon: Sparkles, onClick: 'openSmartWeightUpload', iconBgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600', category: 'primary' },
  { id: 'disposal-certificates', title: 'شهادات التخلص', subtitle: 'إصدار وإدارة شهادات التخلص', icon: FileCheck, path: '/dashboard/disposal/certificates', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'register-deposit', title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية', icon: Banknote, onClick: 'openDepositDialog', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600', category: 'primary' },
  { id: 'qr-scanner', title: 'ماسح QR', subtitle: 'مسح والتحقق من المستندات', icon: ScanLine, path: '/scan', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },

  // 2️⃣ مهم أسبوعي - التقارير والعقود
  { id: 'external-records', title: 'سجل الكميات الخارجية', subtitle: 'تسجيل كميات من مصادر خارجية', icon: Scale, path: '/dashboard/external-records', iconBgClass: 'bg-gradient-to-br from-orange-500 to-amber-600', category: 'secondary' },
  { id: 'contracts', title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'partners', title: 'الجهات المرتبطة', subtitle: 'المولدون والناقلون', icon: Factory, path: '/dashboard/partners', iconBgClass: 'bg-gradient-to-br from-slate-500 to-gray-600', category: 'secondary' },
  { id: 'disposal-reports', title: 'التقارير', subtitle: 'تقارير التخلص والأداء', icon: BarChart3, path: '/dashboard/disposal/reports', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'secondary' },
  { id: 'environmental-sustainability', title: 'تقارير الاستدامة', subtitle: 'تحليل الأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600', category: 'secondary' },

  // 3️⃣ أدوات وإدارة
  { id: 'employees', title: 'إدارة الموظفين', subtitle: 'صلاحيات فريق العمل', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'utility' },
  { id: 'org-structure', title: 'الهيكل التنظيمي', subtitle: 'الأقسام والمناصب الوظيفية', icon: Network, path: '/dashboard/org-structure', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-violet-600', category: 'utility' },
  { id: 'my-requests', title: 'الطلبات', subtitle: 'طلباتي ومراسلات الإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  { id: 'activity-log', title: 'سجل النشاطات', subtitle: 'تتبع جميع العمليات', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'utility' },
  { id: 'pride-certificates', title: 'شهادات الفخر', subtitle: 'شهادات التقدير والإنجازات البيئية', icon: Trophy, path: '/dashboard/pride-certificates', iconBgClass: 'bg-gradient-to-br from-yellow-500 to-amber-600', category: 'utility' },
];

// ============= DRIVER QUICK ACTIONS =============
// السائق: فقط الأدوات الأساسية للعمل الميداني اليومي
export const driverQuickActions: QuickActionConfig[] = [
  // 1️⃣ أساسي يومي (حرج ميداني)
  { id: 'transporter-shipments', title: 'شحناتي', subtitle: 'الشحنات المسندة إليك الآن', icon: Package, path: '/dashboard/transporter-shipments', iconBgClass: 'bg-gradient-to-br from-primary to-blue-600', category: 'primary' },
  { id: 'my-location', title: 'موقعي الحالي', subtitle: 'عرض موقعك على الخريطة', icon: Map, onClick: 'openLiveMap', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600', category: 'primary' },
  { id: 'notifications', title: 'الإشعارات', subtitle: 'التنبيهات والطلبات الجديدة', icon: Bell, path: '/dashboard/notifications', iconBgClass: 'bg-gradient-to-br from-red-500 to-rose-600', category: 'primary' },
  { id: 'qr-scanner', title: 'ماسح QR', subtitle: 'مسح مانيفست الشحنة', icon: ScanLine, path: '/scan', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-teal-600', category: 'primary' },

  // 2️⃣ ثانوي مهم
  { id: 'navigation-demo', title: 'نظام الملاحة', subtitle: 'تتبع وتوجيه الرحلات', icon: Navigation, path: '/dashboard/navigation-demo', iconBgClass: 'bg-gradient-to-br from-teal-500 to-cyan-600', category: 'secondary' },
  { id: 'saved-locations', title: 'المواقع المحفوظة', subtitle: 'عناوينك المحفوظة والمتكررة', icon: Bookmark, path: '/dashboard/saved-locations', iconBgClass: 'bg-gradient-to-br from-amber-500 to-orange-600', category: 'secondary' },
  { id: 'driver-profile', title: 'ملف السائق', subtitle: 'بياناتك ورخصتك ومركبتك', icon: User, path: '/dashboard/driver-profile', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600', category: 'secondary' },
  { id: 'chat', title: 'المحادثات', subtitle: 'التواصل مع الفريق والإدارة', icon: MessageCircle, path: '/dashboard/chat', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600', category: 'secondary' },

  // 3️⃣ أدوات وسجلات
  { id: 'my-requests', title: 'طلباتي', subtitle: 'طلباتي ومراسلات الإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600', category: 'utility' },
  { id: 'activity-log', title: 'سجل النشاطات', subtitle: 'تتبع جميع عملياتك', icon: Activity, path: '/dashboard/activity-log', iconBgClass: 'bg-gradient-to-br from-rose-500 to-red-600', category: 'utility' },
  { id: 'support', title: 'الدعم الفني', subtitle: 'تواصل مع فريق الدعم', icon: Headphones, path: '/dashboard/support', iconBgClass: 'bg-gradient-to-br from-indigo-500 to-blue-600', category: 'utility' },
  { id: 'settings', title: 'الإعدادات', subtitle: 'إعدادات حسابك', icon: Settings, onClick: 'openSettings', iconBgClass: 'bg-gradient-to-br from-gray-500 to-slate-600', category: 'utility' },
];

// ============= HELPER FUNCTIONS =============

/**
 * Get quick actions by user type
 */
export function getQuickActionsByType(
  type: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver' | 'disposal' | 'consultant' | 'consulting_office'
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
    case 'disposal':
      return disposalQuickActions;
    case 'consultant':
    case 'consulting_office':
      return generatorQuickActions; // Consultants use generator actions as baseline
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
