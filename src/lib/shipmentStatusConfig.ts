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
  Search,
  Tags,
  Flame,
  ShieldCheck,
} from 'lucide-react';

// All possible shipment statuses
export type OrgTypeForStatus = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'driver';

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
  | 'completed'      // الاكتمال
  // Disposal statuses (التخلص النهائي)
  | 'disposal_receiving'    // استقبال المخلفات
  | 'disposal_weighing'     // وزن المخلفات
  | 'disposal_inspection'   // فحص المخلفات
  | 'disposal_classification' // تصنيف المخلفات
  | 'disposal_treatment'    // معالجة المخلفات
  | 'disposal_final'        // دفن/حرق
  | 'disposal_completed';   // اكتمال التخلص

export interface StatusConfig {
  key: ShipmentStatus;
  label: string;
  labelAr: string;
  icon: any;
  colorClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  phase: 'transporter' | 'recycler' | 'disposal';
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

// Disposal phase statuses (جهة التخلص النهائي)
export const disposalStatuses: StatusConfig[] = [
  {
    key: 'disposal_receiving',
    label: 'Receiving',
    labelAr: 'استقبال المخلفات',
    icon: Inbox,
    colorClass: 'bg-red-400',
    bgClass: 'bg-red-50 dark:bg-red-900/40',
    textClass: 'text-red-900 dark:text-red-100',
    borderClass: 'border-red-300 dark:border-red-600',
    phase: 'disposal',
    order: 20
  },
  {
    key: 'disposal_weighing',
    label: 'Weighing',
    labelAr: 'وزن المخلفات',
    icon: Scale,
    colorClass: 'bg-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-900/40',
    textClass: 'text-orange-900 dark:text-orange-100',
    borderClass: 'border-orange-300 dark:border-orange-600',
    phase: 'disposal',
    order: 21
  },
  {
    key: 'disposal_inspection',
    label: 'Inspection',
    labelAr: 'فحص المخلفات',
    icon: Search,
    colorClass: 'bg-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-900/40',
    textClass: 'text-amber-900 dark:text-amber-100',
    borderClass: 'border-amber-300 dark:border-amber-600',
    phase: 'disposal',
    order: 22
  },
  {
    key: 'disposal_classification',
    label: 'Classification',
    labelAr: 'تصنيف المخلفات',
    icon: Tags,
    colorClass: 'bg-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/40',
    textClass: 'text-yellow-900 dark:text-yellow-100',
    borderClass: 'border-yellow-300 dark:border-yellow-600',
    phase: 'disposal',
    order: 23
  },
  {
    key: 'disposal_treatment',
    label: 'Treatment',
    labelAr: 'معالجة المخلفات',
    icon: Cog,
    colorClass: 'bg-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-900/40',
    textClass: 'text-violet-900 dark:text-violet-100',
    borderClass: 'border-violet-300 dark:border-violet-600',
    phase: 'disposal',
    order: 24
  },
  {
    key: 'disposal_final',
    label: 'Final Disposal',
    labelAr: 'دفن / حرق',
    icon: Flame,
    colorClass: 'bg-rose-500',
    bgClass: 'bg-rose-50 dark:bg-rose-900/40',
    textClass: 'text-rose-900 dark:text-rose-100',
    borderClass: 'border-rose-300 dark:border-rose-600',
    phase: 'disposal',
    order: 25
  },
  {
    key: 'disposal_completed',
    label: 'Disposal Completed',
    labelAr: 'اكتمال التخلص',
    icon: ShieldCheck,
    colorClass: 'bg-green-500',
    bgClass: 'bg-green-100 dark:bg-green-900/50',
    textClass: 'text-green-900 dark:text-green-100',
    borderClass: 'border-green-400 dark:border-green-600',
    phase: 'disposal',
    order: 26
  },
];

// All statuses combined in order
export const allStatuses: StatusConfig[] = [...transporterStatuses, ...recyclerStatuses, ...disposalStatuses];

// Get status config by key (resolves legacy DB statuses automatically)
export const getStatusConfig = (status: string): StatusConfig | undefined => {
  const direct = allStatuses.find(s => s.key === status);
  if (direct) return direct;
  // Try legacy mapping (e.g. 'new' → 'pending', 'approved' → 'registered')
  const mapped = legacyStatusMapping[status];
  if (mapped) return allStatuses.find(s => s.key === mapped);
  return undefined;
};

// Get statuses by phase
export const getStatusesByPhase = (phase: 'transporter' | 'recycler' | 'disposal'): StatusConfig[] => {
  if (phase === 'transporter') return transporterStatuses;
  if (phase === 'disposal') return disposalStatuses;
  return recyclerStatuses;
};

/**
 * Get the statuses visible to a specific organization type.
 * Each party sees ONLY their own phase statuses.
 * Admin sees all.
 */
export const getStatusesForOrgType = (orgType: OrgTypeForStatus): StatusConfig[] => {
  switch (orgType) {
    case 'generator':
    case 'transporter':
    case 'driver':
      return transporterStatuses;
    case 'recycler':
      return recyclerStatuses;
    case 'disposal':
      return disposalStatuses;
    case 'admin':
      return allStatuses;
    default:
      return allStatuses;
  }
};

// Get available next statuses based on current status and organization type
export const getAvailableNextStatuses = (
  currentStatus: string,
  organizationType: OrgTypeForStatus,
  options?: { hasAssignedDriver?: boolean; driverBelongsToTransporter?: boolean }
): StatusConfig[] => {
  const currentConfig = getStatusConfig(currentStatus);
  if (!currentConfig) return allStatuses;

  // Admin can change to any status
  if (organizationType === 'admin') {
    return allStatuses.filter(s => s.key !== currentStatus);
  }

  // Generator can only hand over (mark as picked_up)
  if (organizationType === 'generator') {
    const generatorAllowed = transporterStatuses
      .filter(s => ['picked_up'].includes(s.key))
      .map(s => ({ ...s, labelAr: 'تم التسليم' }));
    return generatorAllowed.filter(s => s.key !== currentStatus);
  }

  // Driver: full freedom on all transporter phase statuses
  if (organizationType === 'driver') {
    return transporterStatuses.filter(s => s.key !== currentStatus);
  }

  // Transporter: can change transporter phase statuses
  // Rule: allowed if no driver assigned OR driver belongs to this transporter
  if (organizationType === 'transporter') {
    const hasDriver = options?.hasAssignedDriver ?? false;
    const driverIsOwn = options?.driverBelongsToTransporter ?? true;

    // If there's an external driver (not belonging to transporter), transporter cannot change status
    if (hasDriver && !driverIsOwn) {
      return [];
    }

    if (currentConfig.phase === 'transporter') {
      return transporterStatuses.filter(s => s.key !== currentStatus);
    }
    return transporterStatuses;
  }

  // Recycler can change all recycler phase statuses
  if (organizationType === 'recycler') {
    if (currentConfig.key === 'delivering' || currentConfig.phase === 'recycler') {
      return recyclerStatuses.filter(s => s.key !== currentStatus);
    }
    if (currentConfig.phase === 'transporter') {
      return recyclerStatuses;
    }
    return recyclerStatuses;
  }

  // Disposal can change all disposal phase statuses
  if (organizationType === 'disposal') {
    if (currentConfig.key === 'delivering' || currentConfig.phase === 'disposal') {
      return disposalStatuses.filter(s => s.key !== currentStatus);
    }
    if (currentConfig.phase === 'transporter') {
      return disposalStatuses;
    }
    return disposalStatuses;
  }

  return [];
};

// Check if organization can change status
export const canChangeStatus = (
  currentStatus: string,
  organizationType: OrgTypeForStatus,
  options?: { hasAssignedDriver?: boolean; driverBelongsToTransporter?: boolean }
): boolean => {
  if (organizationType === 'admin') return true;
  return getAvailableNextStatuses(currentStatus, organizationType, options).length > 0;
};

// Get phase for a status
export const getStatusPhase = (status: string): 'transporter' | 'recycler' | 'disposal' | null => {
  const config = getStatusConfig(status);
  return config?.phase || null;
};

// Legacy status mapping (for backward compatibility with existing data)
export const legacyStatusMapping: Record<string, ShipmentStatus> = {
  'new': 'pending',
  'approved': 'registered',
  'collecting': 'in_transit',
  'in_transit': 'in_transit',
  'delivered': 'received',
  'confirmed': 'completed',
};

// Reverse mapping: new UI status keys to old DB enum values
export const reverseStatusMapping: Record<ShipmentStatus, string> = {
  'pending': 'new',
  'registered': 'approved',
  'loading': 'in_transit',
  'weighing': 'in_transit',
  'weighed': 'in_transit',
  'picked_up': 'in_transit',
  'on_the_way': 'in_transit',
  'in_transit': 'in_transit',
  'delivering': 'in_transit',
  'receiving': 'delivered',
  'received': 'delivered',
  'sorting': 'delivered',
  'processing': 'delivered',
  'recycling': 'delivered',
  'completed': 'confirmed',
  // Disposal statuses map to DB statuses
  'disposal_receiving': 'delivered',
  'disposal_weighing': 'delivered',
  'disposal_inspection': 'delivered',
  'disposal_classification': 'delivered',
  'disposal_treatment': 'delivered',
  'disposal_final': 'delivered',
  'disposal_completed': 'confirmed',
};

// Map legacy status to new status (for display)
export const mapLegacyStatus = (status: string): ShipmentStatus => {
  return (legacyStatusMapping[status] as ShipmentStatus) || (status as ShipmentStatus);
};

// Map new status to legacy status (for database updates)
export const mapToDbStatus = (status: ShipmentStatus): string => {
  return reverseStatusMapping[status] || status;
};

// Waste type labels (general - for recyclers)
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

// Waste type labels specific to disposal facilities (التخلص النهائي)
// جهة التخلص النهائي هي جهة مستقبلة لكل أنواع المخلفات (خطرة وغير خطرة) حسب ترخيصها
export const disposalWasteTypeLabels: Record<string, string> = {
  // === المخلفات الخطرة ===
  chemical: 'مخلفات كيميائية',
  electronic: 'مخلفات إلكترونية',
  medical: 'مخلفات طبية ورعاية صحية',
  industrial: 'مخلفات صناعية خطرة',
  pharmaceutical: 'مخلفات دوائية',
  sludge: 'حمأة صناعية',
  asbestos: 'مخلفات أسبستوس',
  radioactive: 'مخلفات مشعة',
  petroleum: 'مخلفات بترولية',
  contaminated_soil: 'تربة ملوثة',
  incineration_ash: 'رماد حرق',
  hazardous_solid: 'مخلفات خطرة صلبة',
  hazardous_liquid: 'مخلفات خطرة سائلة',
  // === المخلفات غير الخطرة ===
  plastic: 'بلاستيك',
  paper: 'ورق وكرتون',
  metal: 'معادن',
  glass: 'زجاج',
  organic: 'مخلفات عضوية وأخشاب',
  construction: 'مخلفات بناء وهدم',
  expired_products: 'منتجات منتهية الصلاحية',
  other: 'مخلفات أخرى',
};

// Disposal methods (طرق التخلص النهائي)
export const disposalMethodLabels: Record<string, string> = {
  sanitary_landfill: 'الدفن الصحي الآمن',
  incineration: 'الحرق المتحكم فيه',
  chemical_treatment: 'المعالجة الكيميائية',
  thermal_treatment: 'المعالجة الحرارية',
  encapsulation: 'التغليف والتثبيت',
  deep_well_injection: 'الحقن في الآبار العميقة',
  biological_treatment: 'المعالجة البيولوجية',
  solidification: 'التصلب والتثبيت',
};

// Organization type labels (centralized - DRY)
export type OrganizationType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'transport_office';
export type ShipmentOrganizationType = 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';

export const organizationTypeLabels: Record<string, string> = {
  generator: 'جهة مولدة',
  transporter: 'جهة ناقلة',
  recycler: 'جهة مدورة',
  disposal: 'جهة تخلص نهائي',
  admin: 'مدير النظام',
  transport_office: 'مكتب نقل',
};

export const getOrganizationTypeLabel = (type: string): string => {
  return organizationTypeLabels[type] || type;
};

export const getOrganizationTypeCast = (orgType?: string | null): OrganizationType => {
  return (orgType || 'generator') as OrganizationType;
};
