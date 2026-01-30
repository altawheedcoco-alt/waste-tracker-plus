import { 
  Package, 
  CheckCircle2, 
  Truck, 
  PackageCheck, 
  ArrowDown, 
  Layers,
  Scale,
  ClipboardCheck,
  Download,
  Navigation,
  PackageOpen,
  Inbox,
  Filter,
  Cog,
  Recycle,
  CheckCheck,
} from 'lucide-react';

// All possible shipment statuses
export type ShipmentStatus = 
  // Transporter statuses
  | 'pending'        // معلق
  | 'registered'     // مسجل
  | 'loading'        // قيد التحميل
  | 'weighing'       // قيد الوزن
  | 'weighed'        // تم الوزن
  | 'picked_up'      // تم الاستلام
  | 'on_the_way'     // في الطريق
  | 'in_transit'     // قيد النقل
  | 'delivering'     // قيد التسليم
  // Recycler statuses
  | 'receiving'      // قيد الاستقبال
  | 'received'       // قيد الاستلام
  | 'sorting'        // قيد الفرز
  | 'processing'     // قيد المعالجة
  | 'recycling'      // قيد التدوير
  | 'completed';     // الاكتمال

export interface StatusConfig {
  key: ShipmentStatus;
  label: string;
  labelAr: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  phase: 'transporter' | 'recycler';
  order: number;
}

// Transporter phase statuses
export const transporterStatuses: StatusConfig[] = [
  { 
    key: 'pending', 
    label: 'Pending', 
    labelAr: 'معلق', 
    icon: Package, 
    colorClass: 'bg-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-800/50',
    textClass: 'text-slate-900 dark:text-slate-100',
    borderClass: 'border-slate-300 dark:border-slate-600',
    phase: 'transporter',
    order: 1
  },
  { 
    key: 'registered', 
    label: 'Registered', 
    labelAr: 'مسجل', 
    icon: ClipboardCheck, 
    colorClass: 'bg-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-900/40',
    textClass: 'text-blue-900 dark:text-blue-100',
    borderClass: 'border-blue-300 dark:border-blue-600',
    phase: 'transporter',
    order: 2
  },
  { 
    key: 'loading', 
    label: 'Loading', 
    labelAr: 'قيد التحميل', 
    icon: PackageCheck, 
    colorClass: 'bg-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-900/40',
    textClass: 'text-amber-900 dark:text-amber-100',
    borderClass: 'border-amber-300 dark:border-amber-600',
    phase: 'transporter',
    order: 3
  },
  { 
    key: 'weighing', 
    label: 'Weighing', 
    labelAr: 'قيد الوزن', 
    icon: Scale, 
    colorClass: 'bg-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-900/40',
    textClass: 'text-orange-900 dark:text-orange-100',
    borderClass: 'border-orange-300 dark:border-orange-600',
    phase: 'transporter',
    order: 4
  },
  { 
    key: 'weighed', 
    label: 'Weighed', 
    labelAr: 'تم الوزن', 
    icon: CheckCircle2, 
    colorClass: 'bg-lime-400',
    bgClass: 'bg-lime-50 dark:bg-lime-900/40',
    textClass: 'text-lime-900 dark:text-lime-100',
    borderClass: 'border-lime-300 dark:border-lime-600',
    phase: 'transporter',
    order: 5
  },
  { 
    key: 'picked_up', 
    label: 'Picked Up', 
    labelAr: 'تم الاستلام', 
    icon: Download, 
    colorClass: 'bg-green-400',
    bgClass: 'bg-green-50 dark:bg-green-900/40',
    textClass: 'text-green-900 dark:text-green-100',
    borderClass: 'border-green-300 dark:border-green-600',
    phase: 'transporter',
    order: 6
  },
  { 
    key: 'on_the_way', 
    label: 'On The Way', 
    labelAr: 'في الطريق', 
    icon: Navigation, 
    colorClass: 'bg-cyan-400',
    bgClass: 'bg-cyan-50 dark:bg-cyan-900/40',
    textClass: 'text-cyan-900 dark:text-cyan-100',
    borderClass: 'border-cyan-300 dark:border-cyan-600',
    phase: 'transporter',
    order: 7
  },
  { 
    key: 'in_transit', 
    label: 'In Transit', 
    labelAr: 'قيد النقل', 
    icon: Truck, 
    colorClass: 'bg-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-900/40',
    textClass: 'text-purple-900 dark:text-purple-100',
    borderClass: 'border-purple-300 dark:border-purple-600',
    phase: 'transporter',
    order: 8
  },
  { 
    key: 'delivering', 
    label: 'Delivering', 
    labelAr: 'قيد التسليم', 
    icon: PackageOpen, 
    colorClass: 'bg-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-900/40',
    textClass: 'text-indigo-900 dark:text-indigo-100',
    borderClass: 'border-indigo-300 dark:border-indigo-600',
    phase: 'transporter',
    order: 9
  },
];

// Recycler phase statuses
export const recyclerStatuses: StatusConfig[] = [
  { 
    key: 'receiving', 
    label: 'Receiving', 
    labelAr: 'قيد الاستقبال', 
    icon: Inbox, 
    colorClass: 'bg-teal-400',
    bgClass: 'bg-teal-50 dark:bg-teal-900/40',
    textClass: 'text-teal-900 dark:text-teal-100',
    borderClass: 'border-teal-300 dark:border-teal-600',
    phase: 'recycler',
    order: 10
  },
  { 
    key: 'received', 
    label: 'Received', 
    labelAr: 'قيد الاستلام', 
    icon: ArrowDown, 
    colorClass: 'bg-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-900/40',
    textClass: 'text-emerald-900 dark:text-emerald-100',
    borderClass: 'border-emerald-300 dark:border-emerald-600',
    phase: 'recycler',
    order: 11
  },
  { 
    key: 'sorting', 
    label: 'Sorting', 
    labelAr: 'قيد الفرز', 
    icon: Filter, 
    colorClass: 'bg-sky-400',
    bgClass: 'bg-sky-50 dark:bg-sky-900/40',
    textClass: 'text-sky-900 dark:text-sky-100',
    borderClass: 'border-sky-300 dark:border-sky-600',
    phase: 'recycler',
    order: 12
  },
  { 
    key: 'processing', 
    label: 'Processing', 
    labelAr: 'قيد المعالجة', 
    icon: Cog, 
    colorClass: 'bg-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-900/40',
    textClass: 'text-violet-900 dark:text-violet-100',
    borderClass: 'border-violet-300 dark:border-violet-600',
    phase: 'recycler',
    order: 13
  },
  { 
    key: 'recycling', 
    label: 'Recycling', 
    labelAr: 'قيد التدوير', 
    icon: Recycle, 
    colorClass: 'bg-fuchsia-400',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-900/40',
    textClass: 'text-fuchsia-900 dark:text-fuchsia-100',
    borderClass: 'border-fuchsia-300 dark:border-fuchsia-600',
    phase: 'recycler',
    order: 14
  },
  { 
    key: 'completed', 
    label: 'Completed', 
    labelAr: 'مكتمل', 
    icon: CheckCheck, 
    colorClass: 'bg-green-500',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    textClass: 'text-green-900 dark:text-green-100',
    borderClass: 'border-green-400 dark:border-green-600',
    phase: 'recycler',
    order: 15
  },
];

// All statuses combined in order
export const allStatuses: StatusConfig[] = [...transporterStatuses, ...recyclerStatuses];

// Get status config by key
export const getStatusConfig = (status: string): StatusConfig | undefined => {
  return allStatuses.find(s => s.key === status);
};

// Get statuses by phase
export const getStatusesByPhase = (phase: 'transporter' | 'recycler'): StatusConfig[] => {
  return phase === 'transporter' ? transporterStatuses : recyclerStatuses;
};

// Get available next statuses based on current status and organization type
export const getAvailableNextStatuses = (
  currentStatus: string,
  organizationType: 'generator' | 'transporter' | 'recycler'
): StatusConfig[] => {
  const currentConfig = getStatusConfig(currentStatus);
  if (!currentConfig) return [];

  // Only transporter and recycler can change statuses
  if (organizationType === 'generator') return [];

  // Transporter can only change transporter phase statuses
  if (organizationType === 'transporter') {
    // If current status is in transporter phase, return next transporter statuses
    if (currentConfig.phase === 'transporter') {
      return transporterStatuses.filter(s => s.order > currentConfig.order);
    }
    // Transporter cannot change recycler phase statuses
    return [];
  }

  // Recycler can only change recycler phase statuses
  if (organizationType === 'recycler') {
    // If current status is delivering (last transporter status), recycler can start receiving
    if (currentConfig.key === 'delivering') {
      return recyclerStatuses;
    }
    // If current status is in recycler phase, return next recycler statuses
    if (currentConfig.phase === 'recycler') {
      return recyclerStatuses.filter(s => s.order > currentConfig.order);
    }
    return [];
  }

  return [];
};

// Check if organization can change status
export const canChangeStatus = (
  currentStatus: string,
  organizationType: 'generator' | 'transporter' | 'recycler'
): boolean => {
  return getAvailableNextStatuses(currentStatus, organizationType).length > 0;
};

// Get phase for a status
export const getStatusPhase = (status: string): 'transporter' | 'recycler' | null => {
  const config = getStatusConfig(status);
  return config?.phase || null;
};

// Legacy status mapping (for backward compatibility with existing data)
// Maps old DB enum values to new UI status keys
export const legacyStatusMapping: Record<string, ShipmentStatus> = {
  'new': 'pending',
  'approved': 'registered',
  'collecting': 'loading',
  'in_transit': 'in_transit',
  'delivered': 'received',
  'confirmed': 'completed',
};

// Reverse mapping: new UI status keys to old DB enum values
export const reverseStatusMapping: Record<ShipmentStatus, string> = {
  'pending': 'new',
  'registered': 'approved',
  'loading': 'collecting',
  'weighing': 'collecting',
  'weighed': 'collecting',
  'picked_up': 'collecting',
  'on_the_way': 'in_transit',
  'in_transit': 'in_transit',
  'delivering': 'in_transit',
  'receiving': 'delivered',
  'received': 'delivered',
  'sorting': 'delivered',
  'processing': 'delivered',
  'recycling': 'delivered',
  'completed': 'confirmed',
};

// Map legacy status to new status (for display)
export const mapLegacyStatus = (status: string): ShipmentStatus => {
  return (legacyStatusMapping[status] as ShipmentStatus) || (status as ShipmentStatus);
};

// Map new status to legacy status (for database updates)
export const mapToDbStatus = (status: ShipmentStatus): string => {
  return reverseStatusMapping[status] || status;
};

// Waste type labels
export const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};
