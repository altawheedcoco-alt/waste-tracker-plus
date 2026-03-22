import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle, Clock, ShieldAlert, EyeOff, CheckCircle2, ExternalLink,
  ChevronDown, ChevronUp, Package, FileText, FileWarning, TrendingDown,
  Truck, MapPin, User, Weight, CalendarDays, Sparkles, Phone,
  Building2, Info, RefreshCcw, Zap, Shield, Bell, Wrench,
  FileCheck, Scale, Flame, Timer, Activity
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInHours, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getTabChannelName } from '@/lib/tabSession';

// ── Types ──

interface ShipmentDetail {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  approved_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  notes: string | null;
  generator_notes: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  generator?: { name: string; phone: string; city: string } | null;
  recycler?: { name: string; phone: string; city: string } | null;
  driver?: { vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
}

type AlertCategory = 'all' | 'shipments' | 'contracts' | 'invoices' | 'documents' | 'fleet' | 'compliance';

interface OperationalAlert {
  id: string;
  type: 'overdue' | 'stale' | 'contract_expiry' | 'unpaid' | 'unverified' | 'maintenance' | 'license_expiry' | 'weight_mismatch' | 'hazard' | 'sla_breach';
  severity: 'critical' | 'warning' | 'info';
  category: AlertCategory;
  message: string;
  detail: string;
  timestamp: Date;
  resourceId?: string;
  resourceType?: string;
  shipment?: ShipmentDetail | null;
  delayReason?: string;
  solutions?: string[];
  contractTitle?: string;
  invoiceAmount?: number;
}

// ── Constants ──

const STATUS_LABELS: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', in_transit: 'قيد النقل',
  delivered: 'تم التسليم', confirmed: 'مؤكدة', cancelled: 'ملغاة', collecting: 'قيد الجمع',
};

const HAZARD_LABELS: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'عالي', critical: 'حرج',
};

const SEVERITY_CONFIG = {
  critical: { icon: ShieldAlert, color: 'text-destructive', bgColor: 'bg-card border-destructive/30', badge: 'destructive' as const, label: 'حرج' },
  warning: { icon: AlertTriangle, color: 'text-primary', bgColor: 'bg-card border-primary/30', badge: 'secondary' as const, label: 'تحذير' },
  info: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-card border-border/60', badge: 'outline' as const, label: 'معلومة' },
};

const TYPE_CONFIG: Record<string, { icon: typeof Package; label: string; category: AlertCategory }> = {
  overdue: { icon: TrendingDown, label: 'تأخر تسليم', category: 'shipments' },
  stale: { icon: Package, label: 'شحنة معلّقة', category: 'shipments' },
  contract_expiry: { icon: FileWarning, label: 'انتهاء عقد', category: 'contracts' },
  unpaid: { icon: FileText, label: 'فاتورة متأخرة', category: 'invoices' },
  unverified: { icon: FileWarning, label: 'وثيقة معلّقة', category: 'documents' },
  maintenance: { icon: Wrench, label: 'صيانة مطلوبة', category: 'fleet' },
  license_expiry: { icon: Shield, label: 'ترخيص ينتهي', category: 'compliance' },
  weight_mismatch: { icon: Scale, label: 'فرق أوزان', category: 'shipments' },
  hazard: { icon: Flame, label: 'خطورة عالية', category: 'compliance' },
  sla_breach: { icon: Timer, label: 'خرق SLA', category: 'shipments' },
};

const CATEGORY_TABS: { value: AlertCategory; label: string; icon: typeof Package }[] = [
  { value: 'all', label: 'الكل', icon: Bell },
  { value: 'shipments', label: 'الشحنات', icon: Truck },
  { value: 'invoices', label: 'المالية', icon: FileText },
  { value: 'contracts', label: 'العقود', icon: FileCheck },
  { value: 'fleet', label: 'الأسطول', icon: Wrench },
  { value: 'compliance', label: 'الامتثال', icon: Shield },
  { value: 'documents', label: 'المستندات', icon: FileWarning },
];

// ── Analysis Functions ──

function analyzeDelayReason(shipment: ShipmentDetail, type: string): string {
  const now = new Date();
  if (type === 'stale') {
    const hours = differenceInHours(now, new Date(shipment.created_at));
    if (shipment.status === 'new' && !shipment.approved_at) {
      return hours > 72
        ? 'الشحنة لم تُعتمد منذ أكثر من 3 أيام — قد يكون المدوّر لم يراجعها أو رفض الاستلام ضمنياً'
        : 'الشحنة بانتظار اعتماد المدوّر — لم يتم الرد على طلب الاستلام بعد';
    }
    if (shipment.status === 'approved' && !shipment.in_transit_at) {
      return !shipment.manual_driver_name && !shipment.driver
        ? 'تم اعتماد الشحنة لكن لم يتم تعيين سائق — نقص في السائقين المتاحين'
        : 'الشحنة معتمدة ومعين لها سائق لكنه لم يبدأ الرحلة';
    }
  }
  if (type === 'overdue' && shipment.expected_delivery_date) {
    const hoursLate = differenceInHours(now, new Date(shipment.expected_delivery_date));
    const daysLate = differenceInDays(now, new Date(shipment.expected_delivery_date));
    if (shipment.status === 'in_transit') {
      return hoursLate > 48
        ? `الشحنة في الطريق منذ أكثر من ${daysLate} يوم — قد تكون عالقة أو يوجد عطل`
        : `متأخرة ${hoursLate} ساعة — تأخير استلام أو ظروف طريق`;
    }
    if (shipment.status === 'approved') return 'تجاوزت الموعد ولم تبدأ الرحلة بعد';
    if (shipment.status === 'new') return 'لم تُعتمد رغم تجاوز الموعد — تواصل فوري مع المدوّر';
    return `متأخرة ${daysLate > 0 ? daysLate + ' يوم' : hoursLate + ' ساعة'}`;
  }
  return '';
}

function generateSolutions(type: string, shipment?: ShipmentDetail): string[] {
  const s: string[] = [];
  if (type === 'stale' && shipment) {
    if (shipment.status === 'new') {
      s.push('تواصل مع المدوّر هاتفياً', 'تحقق من صحة بيانات الشحنة', 'أرسل تذكيراً عبر النظام');
    } else if (shipment.status === 'approved') {
      s.push(!shipment.driver && !shipment.manual_driver_name ? 'قم بتعيين سائق متاح' : 'تواصل مع السائق المعيّن');
    }
  } else if (type === 'overdue' && shipment) {
    if (shipment.status === 'in_transit') s.push('تواصل مع السائق', 'تحقق من الموقع عبر التتبع', 'أبلغ المدوّر بالتأخير', 'جهّز سائق احتياطي');
    else s.push('حدّث موعد التسليم', 'صعّد لمدير العمليات', 'أعد جدولة الشحنة');
  } else if (type === 'contract_expiry') {
    s.push('بادر بالتفاوض على التجديد', 'راجع شروط العقد الحالي', 'جهّز عرض بديل للمقارنة');
  } else if (type === 'unpaid') {
    s.push('أرسل تذكيراً رسمياً', 'تواصل مع قسم المحاسبة', 'راجع شروط الدفع في العقد');
  } else if (type === 'maintenance') {
    s.push('جدول موعد الصيانة فوراً', 'حدد مركبة بديلة مؤقتة', 'أبلغ السائقين المتأثرين');
  } else if (type === 'license_expiry') {
    s.push('بادر بتجديد الترخيص', 'حضّر المستندات المطلوبة', 'تأكد من استمرار العمليات بالتراخيص السارية');
  } else if (type === 'unverified') {
    s.push('تأكد من اكتمال المستندات', 'تواصل مع الدعم الفني');
  }
  return s;
}

// ── Sub-Components ──

const ShipmentDetailCard = ({ shipment }: { shipment: ShipmentDetail }) => (
  <div className="bg-background/60 rounded-lg border border-border/50 p-3 space-y-2.5 text-right" dir="rtl">
    <div className="flex items-center justify-between flex-wrap gap-2">
      <Badge variant="outline" className="text-xs gap-1"><Package className="h-3 w-3" />{shipment.shipment_number}</Badge>
      <div className="flex items-center gap-2">
        <Badge className="text-[10px]">{STATUS_LABELS[shipment.status] || shipment.status}</Badge>
        {shipment.hazard_level && (
          <Badge variant={shipment.hazard_level === 'high' || shipment.hazard_level === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
            خطورة: {HAZARD_LABELS[shipment.hazard_level] || shipment.hazard_level}
          </Badge>
        )}
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
      <div className="flex items-center gap-1.5"><span className="text-muted-foreground">النوع:</span><span className="font-medium">{shipment.waste_type}</span></div>
      <div className="flex items-center gap-1.5"><Weight className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{shipment.quantity} {shipment.unit}</span></div>
      {shipment.packaging_method && <div className="flex items-center gap-1.5"><span className="text-muted-foreground">التعبئة:</span><span className="font-medium">{shipment.packaging_method}</span></div>}
    </div>
    <Separator className="my-1" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
      <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><div><span className="text-muted-foreground block">الاستلام:</span><span className="font-medium">{shipment.pickup_address || '—'}</span></div></div>
      <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" /><div><span className="text-muted-foreground block">التسليم:</span><span className="font-medium">{shipment.delivery_address || '—'}</span></div></div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
      <div className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">الإنشاء:</span><span>{format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}</span></div>
      {shipment.expected_delivery_date && (
        <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">المتوقع:</span>
          <span className={new Date(shipment.expected_delivery_date) < new Date() ? 'text-destructive font-bold' : ''}>{format(new Date(shipment.expected_delivery_date), 'dd/MM/yyyy', { locale: ar })}</span>
        </div>
      )}
    </div>
    <Separator className="my-1" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
      {shipment.generator && (
        <div className="flex items-start gap-1.5"><Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><div><span className="text-muted-foreground block">المولّد:</span><span className="font-medium">{shipment.generator.name}</span>{shipment.generator.phone && <span className="block text-muted-foreground">{shipment.generator.phone}</span>}</div></div>
      )}
      {shipment.recycler && (
        <div className="flex items-start gap-1.5"><Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><div><span className="text-muted-foreground block">المدوّر:</span><span className="font-medium">{shipment.recycler.name}</span></div></div>
      )}
      {(shipment.driver || shipment.manual_driver_name) && (
        <div className="flex items-start gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /><div><span className="text-muted-foreground block">السائق:</span><span className="font-medium">{shipment.driver?.profile?.full_name || shipment.manual_driver_name || '—'}</span><span className="block text-muted-foreground">{shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate || '—'}</span></div></div>
      )}
    </div>
    {(shipment.notes || shipment.generator_notes) && (
      <><Separator className="my-1" /><div className="text-xs text-muted-foreground">{shipment.notes && <p>📝 {shipment.notes}</p>}{shipment.generator_notes && <p>📋 ملاحظات المولّد: {shipment.generator_notes}</p>}</div></>
    )}
  </div>
);

const AlertHealthBar = ({ alerts }: { alerts: OperationalAlert[] }) => {
  const critical = alerts.filter(a => a.severity === 'critical').length;
  const warning = alerts.filter(a => a.severity === 'warning').length;
  const info = alerts.filter(a => a.severity === 'info').length;
  const total = alerts.length;
  if (total === 0) return null;

  const healthScore = Math.max(0, 100 - (critical * 25) - (warning * 10) - (info * 2));

  return (
    <div className="space-y-2 mb-3">
      <div className="flex items-center justify-between text-xs">
        <Badge variant={healthScore > 70 ? 'secondary' : healthScore > 40 ? 'outline' : 'destructive'} className="text-[10px] gap-1">
          <Activity className="w-3 h-3" />
          {healthScore > 70 ? 'حالة جيدة' : healthScore > 40 ? 'تحتاج انتباه' : 'حالة حرجة'}
        </Badge>
        <span className="text-muted-foreground">مؤشر الصحة التشغيلية: {healthScore}%</span>
      </div>
      <Progress value={healthScore} className={`h-2 ${healthScore > 70 ? '' : healthScore > 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-destructive'}`} />
    </div>
  );
};

// ── Main Component ──

const OperationalAlertsWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orgType = organization?.organization_type;
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AlertCategory>('all');

  // ── Realtime ──
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(getTabChannelName('operational-alerts-rt'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['operational-alerts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        queryClient.invalidateQueries({ queryKey: ['operational-alerts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['operational-alerts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fleet_vehicles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['operational-alerts'] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [organization?.id, queryClient]);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['operational-alerts', organization?.id],
    queryFn: async (): Promise<OperationalAlert[]> => {
      const result: OperationalAlert[] = [];
      const now = new Date();
      const orgField = orgType === 'generator' ? 'generator_id' : orgType === 'recycler' ? 'recycler_id' : 'transporter_id';

      // Fetch stale shipments
      const staleThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const [staleRes, delayedRes, contractsRes, invoicesRes, docsRes, vehiclesRes, licensesRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, shipment_number, waste_type, quantity, unit, status, pickup_address, delivery_address, pickup_date, expected_delivery_date, created_at, approved_at, in_transit_at, delivered_at, hazard_level, packaging_method, notes, generator_notes, manual_driver_name, manual_vehicle_plate, generator_id, recycler_id, driver_id')
          .eq(orgField, organization!.id).in('status', ['new', 'approved']).lt('created_at', staleThreshold.toISOString()).limit(5),
        supabase.from('shipments')
          .select('id, shipment_number, waste_type, quantity, unit, status, pickup_address, delivery_address, pickup_date, expected_delivery_date, created_at, approved_at, in_transit_at, delivered_at, hazard_level, packaging_method, notes, generator_notes, manual_driver_name, manual_vehicle_plate, generator_id, recycler_id, driver_id')
          .eq(orgField, organization!.id).in('status', ['new', 'approved', 'in_transit', 'confirmed']).not('expected_delivery_date', 'is', null).lt('expected_delivery_date', now.toISOString()).limit(10),
        supabase.from('contracts').select('id, title, end_date').eq('organization_id', organization!.id).eq('status', 'active')
          .lte('end_date', new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()).gte('end_date', now.toISOString()).limit(5),
        supabase.from('invoices').select('id, invoice_number, due_date, total_amount').eq('organization_id', organization!.id).eq('status', 'overdue').limit(5),
        supabase.from('organization_documents').select('id, document_type, created_at').eq('organization_id', organization!.id).eq('verification_status', 'pending').limit(3),
        // Fleet: vehicles with expiring insurance/license
        supabase.from('fleet_vehicles').select('id, plate_number, insurance_expiry, license_expiry').eq('organization_id', organization!.id).eq('status', 'active')
          .not('insurance_expiry', 'is', null).lt('insurance_expiry', new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()).gte('insurance_expiry', now.toISOString()).limit(5),
        // Licenses expiring - use legal_licenses which has expiry_date
        supabase.from('legal_licenses' as any).select('id, license_name, expiry_date').eq('organization_id', organization!.id)
          .not('expiry_date', 'is', null).lt('expiry_date', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()).gte('expiry_date', now.toISOString()).limit(3),
      ]);

      // Batch fetch related data
      const allShipments = [...(staleRes.data || []), ...(delayedRes.data || [])];
      const orgIds = [...new Set(allShipments.flatMap(s => [s.generator_id, s.recycler_id].filter(Boolean)))] as string[];
      const driverIds = [...new Set(allShipments.map(s => s.driver_id).filter(Boolean))] as string[];

      const [orgsData, driversData] = await Promise.all([
        orgIds.length > 0 ? supabase.from('organizations').select('id, name, phone, city').in('id', orgIds) : { data: [] },
        driverIds.length > 0 ? supabase.from('drivers').select('id, vehicle_plate, profile:profiles(full_name, phone)').in('id', driverIds) : { data: [] },
      ]);

      const orgsMap: Record<string, any> = {};
      (orgsData.data || []).forEach(o => { orgsMap[o.id] = o; });
      const driversMap: Record<string, any> = {};
      (driversData.data || []).forEach(d => { driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile }; });

      const enrichShipment = (s: any): ShipmentDetail => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: s.driver_id ? driversMap[s.driver_id] || null : null,
      });

      // Process stale
      staleRes.data?.forEach(s => {
        const shipment = enrichShipment(s);
        result.push({
          id: `stale-${s.id}`, type: 'stale', severity: 'warning', category: 'shipments',
          message: `شحنة ${s.shipment_number} معلّقة منذ فترة طويلة`,
          detail: `تم إنشاؤها منذ ${formatDistanceToNow(new Date(s.created_at), { locale: ar })}`,
          timestamp: new Date(s.created_at), resourceId: s.id, resourceType: 'shipment',
          shipment, delayReason: analyzeDelayReason(shipment, 'stale'), solutions: generateSolutions('stale', shipment),
        });
      });

      // Process delayed
      delayedRes.data?.forEach(s => {
        const shipment = enrichShipment(s);
        const hoursLate = Math.round((now.getTime() - new Date(s.expected_delivery_date!).getTime()) / 3600000);
        result.push({
          id: `delayed-${s.id}`, type: 'overdue', severity: hoursLate > 48 ? 'critical' : 'warning', category: 'shipments',
          message: `شحنة ${s.shipment_number} متأخرة عن موعد التسليم`,
          detail: `متأخرة بـ ${formatDistanceToNow(new Date(s.expected_delivery_date!), { locale: ar })}`,
          timestamp: new Date(s.expected_delivery_date!), resourceId: s.id, resourceType: 'shipment',
          shipment, delayReason: analyzeDelayReason(shipment, 'overdue'), solutions: generateSolutions('overdue', shipment),
        });
        // Hazard alert for high-risk delayed shipments
        if (s.hazard_level === 'high' || s.hazard_level === 'critical') {
          result.push({
            id: `hazard-${s.id}`, type: 'hazard', severity: 'critical', category: 'compliance',
            message: `⚠️ شحنة خطرة متأخرة: ${s.shipment_number}`,
            detail: `مستوى الخطورة: ${HAZARD_LABELS[s.hazard_level!] || s.hazard_level} — يجب التعامل الفوري`,
            timestamp: new Date(s.expected_delivery_date!), resourceId: s.id, resourceType: 'shipment',
            shipment, delayReason: 'شحنة ذات خطورة عالية تتأخر عن الموعد — خطر بيئي وقانوني محتمل',
            solutions: ['إبلاغ الجهة الرقابية فوراً', 'تأمين المخلفات في مكان آمن', 'تفعيل خطة الطوارئ'],
          });
        }
      });

      // Contracts
      contractsRes.data?.forEach(c => {
        result.push({
          id: `contract-${c.id}`, type: 'contract_expiry', severity: 'critical', category: 'contracts',
          message: `عقد "${c.title}" ينتهي قريباً`,
          detail: `ينتهي ${formatDistanceToNow(new Date(c.end_date!), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(c.end_date!), resourceId: c.id, resourceType: 'contract',
          contractTitle: c.title,
          delayReason: 'العقد يقترب من تاريخ الانتهاء', solutions: generateSolutions('contract_expiry'),
        });
      });

      // Invoices
      invoicesRes.data?.forEach(inv => {
        result.push({
          id: `invoice-${inv.id}`, type: 'unpaid', severity: 'critical', category: 'invoices',
          message: `فاتورة ${inv.invoice_number} متأخرة السداد`,
          detail: inv.due_date ? `استحقت ${formatDistanceToNow(new Date(inv.due_date), { locale: ar, addSuffix: true })} — ${inv.total_amount?.toLocaleString() || '—'} ج.م` : '',
          timestamp: new Date(inv.due_date || now), resourceId: inv.id, resourceType: 'invoice',
          invoiceAmount: inv.total_amount || 0,
          delayReason: 'فاتورة تجاوزت تاريخ الاستحقاق', solutions: generateSolutions('unpaid'),
        });
      });

      // Documents
      docsRes.data?.forEach(doc => {
        result.push({
          id: `doc-${doc.id}`, type: 'unverified', severity: 'info', category: 'documents',
          message: `وثيقة "${doc.document_type}" بانتظار التحقق`,
          detail: `مرفوعة ${formatDistanceToNow(new Date(doc.created_at), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(doc.created_at), resourceId: doc.id, resourceType: 'document',
          solutions: generateSolutions('unverified'),
        });
      });

      // Fleet - insurance expiry
      vehiclesRes.data?.forEach((v: any) => {
        if (v.insurance_expiry) {
          const daysLeft = differenceInDays(new Date(v.insurance_expiry), now);
          result.push({
            id: `ins-${v.id}`, type: 'license_expiry', severity: daysLeft <= 3 ? 'critical' : 'warning', category: 'fleet',
            message: `تأمين مركبة ${v.plate_number} ينتهي قريباً`,
            detail: `ينتهي ${formatDistanceToNow(new Date(v.insurance_expiry), { locale: ar, addSuffix: true })}`,
            timestamp: new Date(v.insurance_expiry), resourceId: v.id, resourceType: 'vehicle',
            solutions: ['جدد التأمين فوراً', 'أوقف المركبة من الخدمة إذا انتهى التأمين'],
          });
        }
        if (v.license_expiry) {
          const daysLeft = differenceInDays(new Date(v.license_expiry), now);
          if (daysLeft <= 14) {
            result.push({
              id: `vlicense-${v.id}`, type: 'license_expiry', severity: daysLeft <= 3 ? 'critical' : 'warning', category: 'fleet',
              message: `رخصة مركبة ${v.plate_number} تنتهي قريباً`,
              detail: `تنتهي ${formatDistanceToNow(new Date(v.license_expiry), { locale: ar, addSuffix: true })}`,
              timestamp: new Date(v.license_expiry), resourceId: v.id, resourceType: 'vehicle',
              solutions: ['جدد رخصة المركبة فوراً', 'جهّز مركبة بديلة'],
            });
          }
        }
      });

      // License expiry
      licensesRes.data?.forEach((lic: any) => {
        result.push({
          id: `lic-${lic.id}`, type: 'license_expiry', severity: differenceInDays(new Date(lic.expiry_date), now) <= 7 ? 'critical' : 'warning', category: 'compliance',
          message: `ترخيص "${lic.document_type}" ينتهي قريباً`,
          detail: `ينتهي ${formatDistanceToNow(new Date(lic.expiry_date), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(lic.expiry_date), resourceId: lic.id, resourceType: 'document',
          solutions: generateSolutions('license_expiry'),
        });
      });

      return result.sort((a, b) => {
        const so = { critical: 0, warning: 1, info: 2 };
        return so[a.severity] - so[b.severity];
      });
    },
    enabled: !!organization?.id,
    refetchInterval: 60000,
  });

  const handleDismiss = useCallback((id: string) => { setDismissedIds(prev => new Set([...prev, id])); }, []);
  const handleDismissAll = useCallback(() => { setDismissedIds(prev => { const n = new Set(prev); alerts.forEach(a => n.add(a.id)); return n; }); toast.success('تم إخفاء جميع التنبيهات'); }, [alerts]);
  const handleResolve = useCallback((alert: OperationalAlert) => { setResolvedIds(prev => new Set([...prev, alert.id])); toast.success('تم تحديد كمحلول'); }, []);

  const handleQuickAction = useCallback((alert: OperationalAlert) => {
    const routes: Record<string, string> = { shipment: `/dashboard/shipments/${alert.resourceId}`, contract: '/dashboard/contracts', invoice: '/dashboard/invoices', document: '/dashboard/settings', vehicle: '/dashboard/fleet' };
    navigate(routes[alert.resourceType || ''] || '/dashboard');
  }, [navigate]);

  const visibleAlerts = useMemo(() => alerts.filter(a => !dismissedIds.has(a.id) && !resolvedIds.has(a.id)), [alerts, dismissedIds, resolvedIds]);

  const filteredAlerts = useMemo(() =>
    activeCategory === 'all' ? visibleAlerts : visibleAlerts.filter(a => a.category === activeCategory),
    [visibleAlerts, activeCategory]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<AlertCategory, number> = { all: visibleAlerts.length, shipments: 0, contracts: 0, invoices: 0, documents: 0, fleet: 0, compliance: 0 };
    visibleAlerts.forEach(a => { if (a.category in counts) counts[a.category]++; });
    return counts;
  }, [visibleAlerts]);

  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;

  if (isLoading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-muted rounded w-1/3" /><div className="h-14 bg-muted rounded" /><div className="h-14 bg-muted rounded" /></div></CardContent></Card>;
  }

  if (visibleAlerts.length === 0) return null;

  return (
    <Card className="border-border/40 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => queryClient.invalidateQueries({ queryKey: ['operational-alerts'] })}>
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDismissAll}>
              <EyeOff className="ml-1 h-3 w-3" />إخفاء الكل
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-primary" />
              تنبيهات تشغيلية
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 animate-pulse">{criticalCount} حرج</Badge>}
              <Badge variant="outline" className="text-[10px] px-1.5">{visibleAlerts.length} إجمالي</Badge>
            </div>
          </div>
        </div>

        {/* Health Bar */}
        <AlertHealthBar alerts={visibleAlerts} />

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AlertCategory)}>
          <TabsList className="w-full grid grid-cols-7 h-auto">
            {CATEGORY_TABS.map(tab => {
              const Icon = tab.icon;
              const count = categoryCounts[tab.value];
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-[10px] px-1 py-1.5 gap-0.5 flex-col h-auto">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {count > 0 && <Badge variant="secondary" className="text-[9px] h-3.5 px-1 mt-0.5">{count}</Badge>}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/60 hover:scrollbar-thumb-border scrollbar-track-transparent" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border) / 0.6) transparent' }}>
          <div className="space-y-2">
            <AnimatePresence>
              {filteredAlerts.map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity];
                const SeverityIcon = config.icon;
                const typeConfig = TYPE_CONFIG[alert.type] || { icon: Package, label: alert.type, category: 'all' };
                const TypeIcon = typeConfig.icon;
                const isExpanded = expandedId === alert.id;

                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50, height: 0 }}
                    className={`rounded-xl border transition-all relative overflow-hidden ${config.bgColor}`}
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3 p-3 cursor-pointer relative" onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                      <div className="flex-1 text-right min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{alert.detail}</p>
                        {alert.solutions && alert.solutions.length > 0 && !isExpanded && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            <Sparkles className="w-3 h-3 text-primary shrink-0" />
                            {alert.solutions.slice(0, 2).map((sol, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-accent text-primary border-primary/20" onClick={(e) => e.stopPropagation()}>
                                {sol.length > 35 ? sol.slice(0, 35) + '…' : sol}
                              </Badge>
                            ))}
                            {alert.solutions.length > 2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">+{alert.solutions.length - 2}</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <Badge variant="outline" className="text-[10px] gap-0.5"><TypeIcon className="w-3 h-3" />{typeConfig.label}</Badge>
                        <Badge variant={config.badge} className="text-[10px]">{config.label}</Badge>
                        <SeverityIcon className={`w-4 h-4 ${config.color}`} />
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3 space-y-3 border-t border-dashed border-current/10">
                            {alert.shipment && <div className="mt-3"><ShipmentDetailCard shipment={alert.shipment} /></div>}
                            {alert.delayReason && (
                              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-right" dir="rtl">
                                <div className="flex items-center gap-2 mb-1.5"><Info className="h-4 w-4 text-destructive" /><span className="text-xs font-bold text-destructive">سبب المشكلة:</span></div>
                                <p className="text-xs text-destructive/80 leading-relaxed">{alert.delayReason}</p>
                              </div>
                            )}
                            {alert.solutions && alert.solutions.length > 0 && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-right" dir="rtl">
                                <div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-primary" /><span className="text-xs font-bold text-primary">الحلول المقترحة:</span></div>
                                <ul className="space-y-1.5">
                                  {alert.solutions.map((sol, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                                      <span className="bg-primary/20 text-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                                      <span className="leading-relaxed">{sol}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="text-[11px] text-muted-foreground text-right">
                              📅 {format(alert.timestamp, 'dd/MM/yyyy hh:mm a', { locale: ar })} — {formatDistanceToNow(alert.timestamp, { locale: ar, addSuffix: true })}
                            </p>
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}>
                                <EyeOff className="ml-1 h-3 w-3" />إخفاء
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleQuickAction(alert); }}>
                                <ExternalLink className="ml-1 h-3 w-3" />معالجة مباشرة
                              </Button>
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleResolve(alert); }}>
                                <CheckCircle2 className="ml-1 h-3 w-3" />تم الحل
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium">لا توجد تنبيهات في هذا القسم</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalAlertsWidget;
