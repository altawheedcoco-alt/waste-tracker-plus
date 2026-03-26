import {
  Truck, Package, Calendar, ClipboardList, Award, UserCheck, Shield, Navigation,
  Fuel, HandMetal, Weight, SearchCheck, FileCheck, XCircle, Trash2, Activity,
  Gauge, FileText, Factory, Recycle, AlertTriangle, Droplets, MapPin, BarChart3,
  type LucideIcon,
} from 'lucide-react';

export interface OrgSlashCommand {
  command: string;
  label: string;
  description: string;
  icon: LucideIcon;
  actionType: string;
  color: string;
}

// ─── مولد مخلفات ───
const GENERATOR_COMMANDS: OrgSlashCommand[] = [
  { command: '/collect', label: 'طلب جمع', description: 'طلب جمع مخلفات من الموقع', icon: Package, actionType: 'schedule_collect', color: 'text-emerald-600 bg-emerald-500/10' },
  { command: '/classify', label: 'تصنيف', description: 'تصنيف نوع النفايات', icon: ClipboardList, actionType: 'classify_waste', color: 'text-violet-600 bg-violet-500/10' },
  { command: '/schedule', label: 'جدولة', description: 'جدولة موعد الجمع القادم', icon: Calendar, actionType: 'schedule', color: 'text-blue-600 bg-blue-500/10' },
  { command: '/work-order', label: 'أمر شغل', description: 'إنشاء أمر شغل رقمي', icon: FileText, actionType: 'work_order', color: 'text-amber-600 bg-amber-500/10' },
  { command: '/cert', label: 'طلب شهادة', description: 'طلب شهادة تدوير', icon: Award, actionType: 'request_cert', color: 'text-teal-600 bg-teal-500/10' },
];

// ─── ناقل ───
const TRANSPORTER_COMMANDS: OrgSlashCommand[] = [
  { command: '/assign-driver', label: 'تعيين سائق', description: 'تعيين سائق لشحنة', icon: UserCheck, actionType: 'assign_driver', color: 'text-blue-600 bg-blue-500/10' },
  { command: '/fleet-check', label: 'فحص مركبة', description: 'فحص سلامة مركبة من الأسطول', icon: Shield, actionType: 'fleet_check', color: 'text-amber-600 bg-amber-500/10' },
  { command: '/route', label: 'تحسين مسار', description: 'تحسين مسار النقل', icon: Navigation, actionType: 'optimize_route', color: 'text-indigo-600 bg-indigo-500/10' },
  { command: '/fuel', label: 'تسجيل وقود', description: 'تسجيل استهلاك الوقود', icon: Fuel, actionType: 'log_fuel', color: 'text-orange-600 bg-orange-500/10' },
  { command: '/handover', label: 'تسليم شحنة', description: 'تسليم شحنة للمستلم', icon: HandMetal, actionType: 'handover', color: 'text-emerald-600 bg-emerald-500/10' },
];

// ─── مدوّر ───
const RECYCLER_COMMANDS: OrgSlashCommand[] = [
  { command: '/receive', label: 'تأكيد استلام', description: 'تأكيد استلام شحنة واردة', icon: Package, actionType: 'receive', color: 'text-emerald-600 bg-emerald-500/10' },
  { command: '/weigh', label: 'تسجيل وزن', description: 'تسجيل الوزن الفعلي عند الاستلام', icon: Weight, actionType: 'weigh', color: 'text-blue-600 bg-blue-500/10' },
  { command: '/quality', label: 'فحص جودة', description: 'فحص جودة المواد الواردة', icon: SearchCheck, actionType: 'quality', color: 'text-violet-600 bg-violet-500/10' },
  { command: '/recycle-cert', label: 'شهادة تدوير', description: 'إصدار شهادة إعادة تدوير', icon: Recycle, actionType: 'recycle_cert', color: 'text-teal-600 bg-teal-500/10' },
  { command: '/reject', label: 'رفض شحنة', description: 'رفض شحنة مع تحديد السبب', icon: XCircle, actionType: 'reject_shipment', color: 'text-rose-600 bg-rose-500/10' },
];

// ─── تخلص نهائي ───
const DISPOSAL_COMMANDS: OrgSlashCommand[] = [
  { command: '/dispose', label: 'تخلص آمن', description: 'تأكيد التخلص الآمن من الشحنة', icon: Trash2, actionType: 'dispose', color: 'text-rose-600 bg-rose-500/10' },
  { command: '/monitor', label: 'رصد بيئي', description: 'تسجيل قراءات الرصد البيئي', icon: Activity, actionType: 'monitor', color: 'text-emerald-600 bg-emerald-500/10' },
  { command: '/capacity', label: 'سعة المدفن', description: 'تحديث السعة المتبقية', icon: Gauge, actionType: 'update_capacity', color: 'text-amber-600 bg-amber-500/10' },
  { command: '/dispose-cert', label: 'شهادة تخلص', description: 'إصدار شهادة تخلص آمن', icon: FileCheck, actionType: 'dispose_cert', color: 'text-teal-600 bg-teal-500/10' },
  { command: '/leachate', label: 'تقرير رشيح', description: 'تسجيل قراءات الرشيح', icon: Droplets, actionType: 'leachate_report', color: 'text-blue-600 bg-blue-500/10' },
];

const ORG_COMMANDS_MAP: Record<string, OrgSlashCommand[]> = {
  generator: GENERATOR_COMMANDS,
  transporter: TRANSPORTER_COMMANDS,
  recycler: RECYCLER_COMMANDS,
  disposal: DISPOSAL_COMMANDS,
};

/**
 * إرجاع الأوامر المخصصة لنوع جهة معين
 */
export const getOrgCommands = (orgType?: string): OrgSlashCommand[] => {
  if (!orgType) return [];
  return ORG_COMMANDS_MAP[orgType] || [];
};

/**
 * إرجاع أوامر الإجراءات السريعة حسب نوع الجهة + نوع الشريك
 */
export interface QuickAction {
  label: string;
  icon: LucideIcon;
  actionType: string;
  color: string;
}

const QUICK_ACTIONS_MAP: Record<string, Record<string, QuickAction[]>> = {
  generator: {
    transporter: [
      { label: 'طلب جمع', icon: Package, actionType: 'schedule_collect', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'تتبع', icon: MapPin, actionType: 'track', color: 'bg-blue-500/10 text-blue-600' },
      { label: 'جدولة', icon: Calendar, actionType: 'schedule', color: 'bg-violet-500/10 text-violet-600' },
    ],
    recycler: [
      { label: 'طلب شهادة', icon: Award, actionType: 'request_cert', color: 'bg-teal-500/10 text-teal-600' },
      { label: 'تقرير', icon: BarChart3, actionType: 'report', color: 'bg-blue-500/10 text-blue-600' },
    ],
    _default: [
      { label: 'طلب جمع', icon: Package, actionType: 'schedule_collect', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'تصنيف', icon: ClipboardList, actionType: 'classify_waste', color: 'bg-violet-500/10 text-violet-600' },
    ],
  },
  transporter: {
    generator: [
      { label: 'تعيين سائق', icon: UserCheck, actionType: 'assign_driver', color: 'bg-blue-500/10 text-blue-600' },
      { label: 'تتبع', icon: MapPin, actionType: 'track', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'تسليم', icon: HandMetal, actionType: 'handover', color: 'bg-amber-500/10 text-amber-600' },
    ],
    recycler: [
      { label: 'تسليم', icon: HandMetal, actionType: 'handover', color: 'bg-amber-500/10 text-amber-600' },
      { label: 'تتبع', icon: MapPin, actionType: 'track', color: 'bg-emerald-500/10 text-emerald-600' },
    ],
    disposal: [
      { label: 'تسليم', icon: HandMetal, actionType: 'handover', color: 'bg-amber-500/10 text-amber-600' },
      { label: 'تتبع', icon: MapPin, actionType: 'track', color: 'bg-emerald-500/10 text-emerald-600' },
    ],
    _default: [
      { label: 'تعيين سائق', icon: UserCheck, actionType: 'assign_driver', color: 'bg-blue-500/10 text-blue-600' },
      { label: 'مسار', icon: Navigation, actionType: 'optimize_route', color: 'bg-indigo-500/10 text-indigo-600' },
    ],
  },
  recycler: {
    transporter: [
      { label: 'تأكيد استلام', icon: Package, actionType: 'receive', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'تسجيل وزن', icon: Weight, actionType: 'weigh', color: 'bg-blue-500/10 text-blue-600' },
      { label: 'فحص جودة', icon: SearchCheck, actionType: 'quality', color: 'bg-violet-500/10 text-violet-600' },
    ],
    generator: [
      { label: 'شهادة تدوير', icon: Recycle, actionType: 'recycle_cert', color: 'bg-teal-500/10 text-teal-600' },
      { label: 'تقرير جودة', icon: BarChart3, actionType: 'report', color: 'bg-blue-500/10 text-blue-600' },
    ],
    _default: [
      { label: 'تأكيد استلام', icon: Package, actionType: 'receive', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'فحص جودة', icon: SearchCheck, actionType: 'quality', color: 'bg-violet-500/10 text-violet-600' },
    ],
  },
  disposal: {
    transporter: [
      { label: 'تأكيد استقبال', icon: Package, actionType: 'receive', color: 'bg-emerald-500/10 text-emerald-600' },
      { label: 'تخلص آمن', icon: Trash2, actionType: 'dispose', color: 'bg-rose-500/10 text-rose-600' },
      { label: 'رصد بيئي', icon: Activity, actionType: 'monitor', color: 'bg-teal-500/10 text-teal-600' },
    ],
    _default: [
      { label: 'تخلص آمن', icon: Trash2, actionType: 'dispose', color: 'bg-rose-500/10 text-rose-600' },
      { label: 'شهادة تخلص', icon: FileCheck, actionType: 'dispose_cert', color: 'bg-teal-500/10 text-teal-600' },
    ],
  },
};

export const getQuickActions = (orgType?: string, partnerType?: string): QuickAction[] => {
  if (!orgType) return [];
  const orgMap = QUICK_ACTIONS_MAP[orgType];
  if (!orgMap) return [];
  if (partnerType && orgMap[partnerType]) return orgMap[partnerType];
  return orgMap._default || [];
};

/**
 * أزرار بطاقة الشحنة الذكية حسب نوع الجهة
 */
export interface CardActionConfig {
  label: string;
  icon: LucideIcon;
  action: string;
  variant?: 'default' | 'destructive';
}

export const getShipmentCardActions = (orgType?: string): CardActionConfig[] => {
  switch (orgType) {
    case 'generator':
      return [
        { label: 'تتبع', icon: MapPin, action: 'track' },
        { label: 'تصنيف', icon: ClipboardList, action: 'classify_waste' },
        { label: 'وقّع', icon: FileCheck, action: 'sign_shipment' },
        { label: 'شهادة', icon: Award, action: 'request_cert' },
      ];
    case 'transporter':
      return [
        { label: 'تتبع', icon: Navigation, action: 'track' },
        { label: 'سائق', icon: UserCheck, action: 'assign_driver' },
        { label: 'حالة', icon: Gauge, action: 'change_status' },
        { label: 'وقّع', icon: FileCheck, action: 'sign_shipment' },
      ];
    case 'recycler':
      return [
        { label: 'استلام', icon: Package, action: 'receive' },
        { label: 'وزن', icon: Weight, action: 'weigh' },
        { label: 'جودة', icon: SearchCheck, action: 'quality' },
        { label: 'رفض', icon: XCircle, action: 'reject_shipment', variant: 'destructive' },
      ];
    case 'disposal':
      return [
        { label: 'استقبال', icon: Package, action: 'receive' },
        { label: 'تخلص', icon: Trash2, action: 'dispose' },
        { label: 'رصد', icon: Activity, action: 'monitor' },
        { label: 'شهادة', icon: FileCheck, action: 'dispose_cert' },
      ];
    default:
      return [
        { label: 'تتبع', icon: Navigation, action: 'track' },
        { label: 'حالة', icon: Gauge, action: 'change_status' },
        { label: 'وقّع', icon: FileCheck, action: 'sign_shipment' },
        { label: 'اختم', icon: Award, action: 'stamp_shipment' },
      ];
  }
};

export const filterOrgCommands = (commands: OrgSlashCommand[], search: string): OrgSlashCommand[] => {
  if (!search) return commands;
  const q = search.toLowerCase().replace('/', '');
  return commands.filter(c => c.command.includes(q) || c.label.includes(q) || c.description.includes(q));
};
