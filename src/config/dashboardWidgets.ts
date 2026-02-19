import { LucideIcon, Package, Wallet, BarChart3, Bell, TrendingUp, Truck, Users, FileCheck, QrCode, Printer, Activity, MapPin, Scale, ClipboardList, Recycle, Factory, Leaf, Shield, Bot } from 'lucide-react';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: 'quick_action' | 'stats' | 'data' | 'financial' | 'operations';
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
