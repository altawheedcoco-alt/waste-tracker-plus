import { LucideIcon, Package, Wallet, BarChart3, Bell, TrendingUp, Truck, Users, FileCheck, QrCode, Printer, Activity, MapPin, Scale, ClipboardList, Recycle, Factory, Leaf, Shield, Bot, Calendar, Zap, AlertTriangle, FileText, Gauge, Navigation, Radio, Wrench, BadgeCheck, Landmark, BookOpen, Briefcase, HeartPulse, FlaskConical, LayoutGrid, CreditCard, BarChart, ShieldCheck, Globe, Coins, Cpu, Brain, Star, Search, ScrollText, Lock, IdCard, MessageCircle } from 'lucide-react';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: 'quick_action' | 'stats' | 'data' | 'financial' | 'operations' | 'compliance' | 'ai' | 'advanced';
  /** Which org types can see this widget */
  availableFor: Array<'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin'>;
  /** Default order position (lower = higher) */
  defaultOrder: number;
  /** Is it pinned by default? */
  defaultPinned: boolean;
  /** Size: small = 1 col, medium = 2 cols, large = full width */
  size: 'small' | 'medium' | 'large';
}

export const dashboardWidgets: DashboardWidgetConfig[] = [
  // === مركز التواصل والمشاركة ===
  {
    id: 'communication_hub',
    title: 'التواصل والمشاركة',
    description: 'رسائل، إشعارات، ملاحظات، حالات — كل قنوات التواصل في مكان واحد',
    icon: MessageCircle,
    category: 'quick_action',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: -1,
    defaultPinned: true,
    size: 'large',
  },

  // === بطاقة الهوية التعريفية الرقمية ===
  {
    id: 'digital_identity_card',
    title: 'بطاقة الهوية التعريفية الرقمية',
    description: 'بيانات الجهة القانونية والتشغيلية وإحصائيات الشركاء والعمالة',
    icon: IdCard,
    category: 'stats',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 0,
    defaultPinned: true,
    size: 'large',
  },

  // === إجراءات سريعة ===
  {
    id: 'quick_actions',
    title: 'الإجراءات السريعة',
    description: 'إنشاء شحنة، مسح QR، طباعة تقرير',
    icon: QrCode,
    category: 'quick_action',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 1,
    defaultPinned: true,
    size: 'large',
  },

  // === بطاقات إحصائية ===
  {
    id: 'kpi_cards',
    title: 'مؤشرات الأداء (KPIs)',
    description: 'عدد الشحنات، الإيرادات، المهام المعلقة',
    icon: TrendingUp,
    category: 'stats',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 2,
    defaultPinned: true,
    size: 'large',
  },

  // === الشحنات الأخيرة ===
  {
    id: 'recent_shipments',
    title: 'الشحنات الأخيرة',
    description: 'آخر الشحنات مع حالتها',
    icon: Package,
    category: 'data',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 3,
    defaultPinned: true,
    size: 'large',
  },

  // === المحفظة والمالية ===
  {
    id: 'wallet_summary',
    title: 'المحفظة والمالية',
    description: 'رصيد المحفظة وآخر المعاملات',
    icon: Wallet,
    category: 'financial',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal'],
    defaultOrder: 4,
    defaultPinned: false,
    size: 'medium',
  },

  // === التنبيهات التشغيلية ===
  {
    id: 'alerts',
    title: 'التنبيهات التشغيلية',
    description: 'تنبيهات وإشعارات مهمة',
    icon: Bell,
    category: 'operations',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 5,
    defaultPinned: false,
    size: 'medium',
  },

  // === ملخص العمليات اليومي ===
  {
    id: 'daily_operations',
    title: 'ملخص العمليات اليومي',
    description: 'إحصائيات اليوم ومقارنتها بالأمس',
    icon: Activity,
    category: 'operations',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 6,
    defaultPinned: false,
    size: 'large',
  },

  // === تتبع السائقين ===
  {
    id: 'driver_tracking',
    title: 'تتبع السائقين',
    description: 'مراقبة مواقع السائقين لحظياً',
    icon: MapPin,
    category: 'operations',
    availableFor: ['transporter', 'admin'],
    defaultOrder: 7,
    defaultPinned: false,
    size: 'medium',
  },

  // === الموافقات المعلقة ===
  {
    id: 'pending_approvals',
    title: 'الموافقات المعلقة',
    description: 'طلبات تنتظر الموافقة',
    icon: ClipboardList,
    category: 'operations',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 8,
    defaultPinned: false,
    size: 'medium',
  },

  // === الرسم البياني الأسبوعي ===
  {
    id: 'weekly_chart',
    title: 'الرسم البياني الأسبوعي',
    description: 'عدد الشحنات هذا الأسبوع',
    icon: BarChart3,
    category: 'stats',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 9,
    defaultPinned: false,
    size: 'medium',
  },

  // === تقارير الاستدامة ===
  {
    id: 'sustainability',
    title: 'مؤشرات الاستدامة',
    description: 'البصمة الكربونية ومؤشرات ESG',
    icon: Leaf,
    category: 'stats',
    availableFor: ['generator', 'transporter', 'recycler', 'admin'],
    defaultOrder: 10,
    defaultPinned: false,
    size: 'medium',
  },

  // === الجهات المرتبطة ===
  {
    id: 'partners_summary',
    title: 'الجهات المرتبطة',
    description: 'قائمة الشركاء وحالة العلاقات',
    icon: Factory,
    category: 'data',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal'],
    defaultOrder: 11,
    defaultPinned: false,
    size: 'medium',
  },

  // ═══════════════════════════════════════
  // === الويدجت الإضافية الجديدة ===
  // ═══════════════════════════════════════

  // === النبض اليومي ===
  {
    id: 'daily_pulse',
    title: 'النبض اليومي',
    description: 'ملخص سريع لنشاط اليوم والمهام العاجلة',
    icon: Zap,
    category: 'operations',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 12,
    defaultPinned: false,
    size: 'large',
  },

  // === مركز القيادة ===
  {
    id: 'command_center',
    title: 'مركز القيادة',
    description: 'لوحة تحكم مركزية للعمليات اللحظية',
    icon: LayoutGrid,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 13,
    defaultPinned: true,
    size: 'large',
  },

  // === تنبيهات SLA ===
  {
    id: 'sla_alerts',
    title: 'تنبيهات مستوى الخدمة (SLA)',
    description: 'مراقبة الالتزام بمواعيد التسليم',
    icon: AlertTriangle,
    category: 'operations',
    availableFor: ['transporter', 'recycler', 'disposal'],
    defaultOrder: 14,
    defaultPinned: false,
    size: 'medium',
  },

  // === موافقات التسليم ===
  {
    id: 'delivery_approvals',
    title: 'موافقات التسليم',
    description: 'طلبات تأكيد التسليم المعلقة',
    icon: BadgeCheck,
    category: 'operations',
    availableFor: ['transporter', 'recycler', 'disposal'],
    defaultOrder: 15,
    defaultPinned: false,
    size: 'medium',
  },

  // === الطلبات الواردة ===
  {
    id: 'incoming_requests',
    title: 'الطلبات الواردة',
    description: 'طلبات الجمع والنقل من المولدين',
    icon: ClipboardList,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 16,
    defaultPinned: false,
    size: 'medium',
  },

  // === الإشعارات ===
  {
    id: 'notifications',
    title: 'الإشعارات',
    description: 'إشعارات النظام والتنبيهات',
    icon: Bell,
    category: 'operations',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal'],
    defaultOrder: 17,
    defaultPinned: false,
    size: 'medium',
  },

  // === البحث الموحد عن المستندات ===
  {
    id: 'document_search',
    title: 'البحث في المستندات',
    description: 'بحث موحد في جميع المستندات والشهادات',
    icon: Search,
    category: 'data',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal'],
    defaultOrder: 18,
    defaultPinned: false,
    size: 'medium',
  },

  // === التحقق من المستندات ===
  {
    id: 'document_verification',
    title: 'التحقق من المستندات',
    description: 'التحقق من صحة المستندات عبر QR أو الرقم',
    icon: FileCheck,
    category: 'data',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal'],
    defaultOrder: 19,
    defaultPinned: false,
    size: 'small',
  },

  // === استخدام الأسطول ===
  {
    id: 'fleet_utilization',
    title: 'استخدام الأسطول',
    description: 'معدل استغلال المركبات والكفاءة التشغيلية',
    icon: Truck,
    category: 'stats',
    availableFor: ['transporter'],
    defaultOrder: 20,
    defaultPinned: false,
    size: 'medium',
  },

  // === الرسوم البيانية للأداء ===
  {
    id: 'performance_charts',
    title: 'الرسوم البيانية للأداء',
    description: 'تحليل بصري لمؤشرات الأداء',
    icon: BarChart,
    category: 'stats',
    availableFor: ['transporter', 'generator', 'recycler'],
    defaultOrder: 21,
    defaultPinned: false,
    size: 'large',
  },

  // === التقرير المجمع ===
  {
    id: 'aggregate_report',
    title: 'التقرير المجمع',
    description: 'تقرير شامل لجميع العمليات',
    icon: FileText,
    category: 'data',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 22,
    defaultPinned: false,
    size: 'large',
  },

  // === تحليلات الذكاء الاصطناعي ===
  {
    id: 'ai_insights',
    title: 'تحليلات الذكاء الاصطناعي',
    description: 'توصيات واقتراحات ذكية لتحسين العمليات',
    icon: Brain,
    category: 'ai',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 23,
    defaultPinned: false,
    size: 'large',
  },

  // === أداء السائقين ===
  {
    id: 'driver_performance',
    title: 'أداء السائقين',
    description: 'تقييم وتحليل أداء السائقين',
    icon: Gauge,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 24,
    defaultPinned: false,
    size: 'large',
  },

  // === إدارة تكاليف الرحلات ===
  {
    id: 'trip_costs',
    title: 'إدارة تكاليف الرحلات',
    description: 'حساب ومتابعة تكاليف كل رحلة',
    icon: CreditCard,
    category: 'financial',
    availableFor: ['transporter'],
    defaultOrder: 25,
    defaultPinned: false,
    size: 'medium',
  },

  // === تنبيهات السائقين الذكية ===
  {
    id: 'smart_driver_notifications',
    title: 'تنبيهات السائقين الذكية',
    description: 'إشعارات استباقية للسائقين',
    icon: Radio,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 26,
    defaultPinned: false,
    size: 'medium',
  },

  // === جدولة الصيانة ===
  {
    id: 'maintenance_scheduler',
    title: 'جدولة الصيانة',
    description: 'صيانة المركبات والتنبيهات الدورية',
    icon: Wrench,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 27,
    defaultPinned: false,
    size: 'medium',
  },

  // === مساعد السائق (Copilot) ===
  {
    id: 'driver_copilot',
    title: 'مساعد السائق',
    description: 'مساعد ذكي لتوجيه السائق وتحسين المسارات',
    icon: Navigation,
    category: 'ai',
    availableFor: ['transporter'],
    defaultOrder: 28,
    defaultPinned: false,
    size: 'large',
  },

  // === التسعير الديناميكي ===
  {
    id: 'dynamic_pricing',
    title: 'التسعير الديناميكي',
    description: 'محرك تسعير ذكي حسب العرض والطلب',
    icon: Scale,
    category: 'financial',
    availableFor: ['transporter'],
    defaultOrder: 29,
    defaultPinned: false,
    size: 'large',
  },

  // === بورصة المخلفات ===
  {
    id: 'waste_marketplace',
    title: 'بورصة المخلفات',
    description: 'سوق العرض والطلب على المخلفات',
    icon: Recycle,
    category: 'advanced',
    availableFor: ['transporter', 'generator', 'recycler'],
    defaultOrder: 30,
    defaultPinned: false,
    size: 'large',
  },

  // === صيانة الأسطول التنبؤية ===
  {
    id: 'predictive_fleet',
    title: 'صيانة الأسطول التنبؤية',
    description: 'توقع الأعطال وجدولة الصيانة الوقائية',
    icon: Wrench,
    category: 'advanced',
    availableFor: ['transporter'],
    defaultOrder: 31,
    defaultPinned: false,
    size: 'large',
  },

  // === كشف الاحتيال ===
  {
    id: 'fraud_detection',
    title: 'كشف الاحتيال',
    description: 'رصد التلاعب بالأوزان والمخالفات',
    icon: ShieldCheck,
    category: 'advanced',
    availableFor: ['transporter', 'admin'],
    defaultOrder: 32,
    defaultPinned: false,
    size: 'large',
  },

  // === تحليل مخاطر الشركاء ===
  {
    id: 'partner_risk',
    title: 'تحليل مخاطر الشركاء',
    description: 'تقييم مخاطر التعامل مع الشركاء',
    icon: Shield,
    category: 'advanced',
    availableFor: ['transporter', 'generator'],
    defaultOrder: 33,
    defaultPinned: false,
    size: 'large',
  },

  // === سلسلة الحفظ ===
  {
    id: 'chain_of_custody',
    title: 'سلسلة الحفظ',
    description: 'تتبع مسار المخلفات من المولد للمستقبل',
    icon: Lock,
    category: 'compliance',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 34,
    defaultPinned: false,
    size: 'large',
  },

  // === البوابة الحكومية ===
  {
    id: 'government_reporting',
    title: 'البوابة الحكومية',
    description: 'إعداد وتقديم التقارير الحكومية',
    icon: Landmark,
    category: 'compliance',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 35,
    defaultPinned: false,
    size: 'large',
  },

  // === أرصدة الكربون ===
  {
    id: 'carbon_credits',
    title: 'أرصدة الكربون',
    description: 'إدارة وتداول شهادات الكربون',
    icon: Coins,
    category: 'advanced',
    availableFor: ['transporter', 'recycler'],
    defaultOrder: 36,
    defaultPinned: false,
    size: 'large',
  },

  // === مراقبة IoT ===
  {
    id: 'iot_monitoring',
    title: 'مراقبة IoT',
    description: 'بيانات أجهزة الاستشعار والتتبع',
    icon: Cpu,
    category: 'advanced',
    availableFor: ['transporter'],
    defaultOrder: 37,
    defaultPinned: false,
    size: 'large',
  },

  // === التقويم ===
  {
    id: 'shipment_calendar',
    title: 'تقويم الشحنات',
    description: 'عرض الشحنات المجدولة على التقويم',
    icon: Calendar,
    category: 'data',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 38,
    defaultPinned: false,
    size: 'large',
  },

  // === الذكاء التشغيلي ===
  {
    id: 'operational_intelligence',
    title: 'الذكاء التشغيلي',
    description: 'جدولة ذكية، تحسين المسارات، ربحية الشركاء',
    icon: Brain,
    category: 'ai',
    availableFor: ['transporter'],
    defaultOrder: 39,
    defaultPinned: false,
    size: 'large',
  },

  // === تقييمات الشركاء ===
  {
    id: 'partner_ratings',
    title: 'تقييمات الشركاء',
    description: 'التقييم المتبادل مع الشركاء',
    icon: Star,
    category: 'data',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 40,
    defaultPinned: false,
    size: 'medium',
  },

  // === إشارة التتبع ===
  {
    id: 'signal_monitor',
    title: 'إشارة التتبع',
    description: 'مراقبة حالة اتصال السائقين',
    icon: Radio,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 41,
    defaultPinned: false,
    size: 'small',
  },

  // === ربط السائقين ===
  {
    id: 'driver_linking',
    title: 'ربط السائقين',
    description: 'ربط السائقين الجدد عبر كود',
    icon: Users,
    category: 'operations',
    availableFor: ['transporter'],
    defaultOrder: 42,
    defaultPinned: false,
    size: 'small',
  },

  // === الامتثال القانوني ===
  {
    id: 'legal_compliance',
    title: 'الامتثال القانوني',
    description: 'متابعة التراخيص والامتثال البيئي',
    icon: BookOpen,
    category: 'compliance',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 43,
    defaultPinned: false,
    size: 'large',
  },

  // === الأرشيف القانوني ===
  {
    id: 'legal_archive',
    title: 'الأرشيف القانوني',
    description: 'أرشيف الوثائق والسجلات القانونية',
    icon: ScrollText,
    category: 'compliance',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 44,
    defaultPinned: false,
    size: 'large',
  },

  // === امتثال المركبات ===
  {
    id: 'vehicle_compliance',
    title: 'امتثال المركبات',
    description: 'إدارة تراخيص وتأمين المركبات',
    icon: Truck,
    category: 'compliance',
    availableFor: ['transporter'],
    defaultOrder: 45,
    defaultPinned: false,
    size: 'medium',
  },

  // === امتثال السائقين ===
  {
    id: 'driver_compliance',
    title: 'امتثال السائقين',
    description: 'إدارة رخص وشهادات السائقين',
    icon: BadgeCheck,
    category: 'compliance',
    availableFor: ['transporter'],
    defaultOrder: 46,
    defaultPinned: false,
    size: 'medium',
  },

  // === إدارة الحوادث ===
  {
    id: 'incident_reports',
    title: 'إدارة الحوادث',
    description: 'تسجيل ومتابعة الحوادث والمخالفات',
    icon: AlertTriangle,
    category: 'compliance',
    availableFor: ['transporter'],
    defaultOrder: 47,
    defaultPinned: false,
    size: 'medium',
  },

  // === السلامة المهنية ===
  {
    id: 'ohs_safety',
    title: 'السلامة والصحة المهنية',
    description: 'تقارير السلامة المهنية وإدارة المخاطر',
    icon: HeartPulse,
    category: 'compliance',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 48,
    defaultPinned: false,
    size: 'large',
  },

  // === الملخص المالي (المولد) ===
  {
    id: 'financial_summary',
    title: 'الملخص المالي',
    description: 'ملخص الإيرادات والمصروفات والأرصدة',
    icon: Wallet,
    category: 'financial',
    availableFor: ['generator'],
    defaultOrder: 49,
    defaultPinned: false,
    size: 'medium',
  },

  // === تتبع المولدات ===
  {
    id: 'generator_tracking',
    title: 'تتبع الشحنات',
    description: 'تتبع مسار شحنات المولد لحظياً',
    icon: Navigation,
    category: 'operations',
    availableFor: ['generator'],
    defaultOrder: 50,
    defaultPinned: false,
    size: 'medium',
  },

  // === أوامر الشغل ===
  {
    id: 'work_orders',
    title: 'أوامر الشغل',
    description: 'إنشاء ومتابعة أوامر الشغل الرقمية',
    icon: Briefcase,
    category: 'operations',
    availableFor: ['generator'],
    defaultOrder: 51,
    defaultPinned: false,
    size: 'medium',
  },

  // === الوزنة الذكية ===
  {
    id: 'smart_weight_upload',
    title: 'الوزنة الذكية',
    description: 'رفع صور تذاكر الوزنة واستخراج البيانات بالذكاء الاصطناعي',
    icon: Scale,
    category: 'ai',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 52,
    defaultPinned: false,
    size: 'small',
  },

  // === طباعة التقارير ===
  {
    id: 'print_reports',
    title: 'طباعة التقارير',
    description: 'طباعة إيصال حراري أو تقرير A4 أو تقرير شامل',
    icon: Printer,
    category: 'quick_action',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal'],
    defaultOrder: 53,
    defaultPinned: false,
    size: 'small',
  },

  // === إنشاء شحنة ===
  {
    id: 'create_shipment',
    title: 'إنشاء شحنة',
    description: 'إنشاء شحنة جديدة بسرعة',
    icon: Package,
    category: 'quick_action',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 54,
    defaultPinned: false,
    size: 'small',
  },

  // === إعدادات الأتمتة ===
  {
    id: 'automation_settings',
    title: 'إعدادات الأتمتة',
    description: 'تخصيص الإجراءات التلقائية وضبط الأتمتة',
    icon: Bot,
    category: 'advanced',
    availableFor: ['transporter', 'generator', 'recycler', 'disposal'],
    defaultOrder: 55,
    defaultPinned: false,
    size: 'small',
  },

  // === تقرير الاستدامة المتقدم ===
  {
    id: 'sustainability_report_generator',
    title: 'مولد تقارير الاستدامة',
    description: 'إنشاء تقارير استدامة شاملة',
    icon: Globe,
    category: 'compliance',
    availableFor: ['transporter', 'recycler'],
    defaultOrder: 56,
    defaultPinned: false,
    size: 'large',
  },

  // === ربحية الشركاء ===
  {
    id: 'partner_profitability',
    title: 'ربحية الشركاء',
    description: 'تحليل الربحية لكل شريك',
    icon: TrendingUp,
    category: 'financial',
    availableFor: ['transporter'],
    defaultOrder: 57,
    defaultPinned: false,
    size: 'medium',
  },

  // === تحسين المسارات ===
  {
    id: 'route_optimizer',
    title: 'تحسين المسارات',
    description: 'اقتراح أفضل المسارات وتوفير الوقود',
    icon: Navigation,
    category: 'ai',
    availableFor: ['transporter'],
    defaultOrder: 58,
    defaultPinned: false,
    size: 'medium',
  },

  // === رادار أداء الجهة ===
  {
    id: 'org_performance_radar',
    title: 'رادار أداء الجهة',
    description: 'تحليل شامل لـ 8 محاور أداء مقارنة بمتوسط القطاع',
    icon: Activity,
    category: 'advanced',
    availableFor: ['generator', 'transporter', 'recycler', 'disposal', 'admin'],
    defaultOrder: 59,
    defaultPinned: false,
    size: 'large',
  },
];

/**
 * Get widgets available for a specific organization type
 */
export function getWidgetsByOrgType(
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin'
): DashboardWidgetConfig[] {
  return dashboardWidgets
    .filter(w => w.availableFor.includes(orgType))
    .sort((a, b) => a.defaultOrder - b.defaultOrder);
}

/**
 * Get default pinned widget IDs for an org type
 */
export function getDefaultPinnedWidgets(
  orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin'
): string[] {
  return getWidgetsByOrgType(orgType)
    .filter(w => w.defaultPinned)
    .map(w => w.id);
}
