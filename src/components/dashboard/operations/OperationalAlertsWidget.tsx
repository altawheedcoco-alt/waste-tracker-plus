import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, Clock, ShieldAlert, EyeOff, CheckCircle2, ExternalLink,
  ChevronDown, ChevronUp, Package, FileText, FileWarning, TrendingDown,
  Truck, MapPin, User, Weight, CalendarDays, Sparkles, Loader2, Phone,
  Building2, Route, Fuel, Info
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInHours, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

interface OperationalAlert {
  id: string;
  type: 'overdue' | 'stale' | 'contract_expiry' | 'unpaid' | 'unverified';
  severity: 'critical' | 'warning' | 'info';
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

const STATUS_LABELS: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', in_transit: 'قيد النقل',
  delivered: 'تم التسليم', confirmed: 'مؤكدة', cancelled: 'ملغاة',
  collecting: 'قيد الجمع',
};

const HAZARD_LABELS: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'عالي', critical: 'حرج',
};

const SEVERITY_CONFIG = {
  critical: {
    icon: ShieldAlert,
    color: 'text-destructive',
    bgColor: 'bg-card border-destructive/30',
    badge: 'destructive' as const,
    label: 'حرج',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-primary',
    bgColor: 'bg-card border-primary/30',
    badge: 'secondary' as const,
    label: 'تحذير',
  },
  info: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-card border-border/60',
    badge: 'outline' as const,
    label: 'معلومة',
  },
};

const TYPE_ICONS: Record<string, typeof Package> = {
  overdue: TrendingDown,
  stale: Package,
  contract_expiry: FileWarning,
  unpaid: FileText,
  unverified: FileWarning,
};

const TYPE_LABELS: Record<string, string> = {
  overdue: 'تأخر تسليم',
  stale: 'شحنة معلّقة',
  contract_expiry: 'انتهاء عقد',
  unpaid: 'فاتورة متأخرة',
  unverified: 'وثيقة معلّقة',
};

function analyzeDelayReason(shipment: ShipmentDetail, type: string): string {
  const now = new Date();

  if (type === 'stale') {
    const createdAt = new Date(shipment.created_at);
    const hoursSinceCreation = differenceInHours(now, createdAt);

    if (shipment.status === 'new' && !shipment.approved_at) {
      if (hoursSinceCreation > 72) return 'الشحنة لم تُعتمد منذ أكثر من 3 أيام — قد يكون المدوّر لم يراجعها أو رفض الاستلام ضمنياً';
      return 'الشحنة بانتظار اعتماد المدوّر — لم يتم الرد على طلب الاستلام بعد';
    }
    if (shipment.status === 'approved' && !shipment.in_transit_at) {
      if (!shipment.manual_driver_name && !shipment.driver) return 'تم اعتماد الشحنة لكن لم يتم تعيين سائق لها — قد يكون هناك نقص في السائقين المتاحين';
      return 'الشحنة معتمدة ومعين لها سائق لكنه لم يبدأ الرحلة — قد يكون السائق مشغولاً بشحنة أخرى';
    }
  }

  if (type === 'overdue') {
    const expected = new Date(shipment.expected_delivery_date!);
    const hoursLate = differenceInHours(now, expected);
    const daysLate = differenceInDays(now, expected);

    if (shipment.status === 'in_transit') {
      if (hoursLate > 48) return `الشحنة في الطريق منذ أكثر من ${daysLate} يوم — قد تكون عالقة في الطريق أو يوجد عطل في المركبة أو ازدحام مروري شديد`;
      return `الشحنة متأخرة ${hoursLate} ساعة عن الموعد — قد يكون السائق واجه تأخيراً في الاستلام أو ظروف طريق صعبة`;
    }
    if (shipment.status === 'approved') {
      return 'تجاوزت موعد التسليم المتوقع ولم تبدأ الرحلة بعد — عدم تعيين سائق أو تأخر في جدولة الاستلام';
    }
    if (shipment.status === 'new') {
      return 'الشحنة لم تُعتمد حتى الآن رغم تجاوز موعد التسليم — يجب التواصل الفوري مع المدوّر';
    }
    return `الشحنة متأخرة ${daysLate > 0 ? daysLate + ' يوم' : hoursLate + ' ساعة'} عن الموعد المحدد`;
  }

  return '';
}

function generateSolutions(shipment: ShipmentDetail, type: string): string[] {
  const solutions: string[] = [];

  if (type === 'stale') {
    if (shipment.status === 'new') {
      solutions.push('تواصل مع المدوّر هاتفياً للتأكد من استلام طلب الشحنة');
      solutions.push('تحقق من صحة بيانات الشحنة (النوع والكمية) لأن خطأ فيها قد يسبب تأخير الاعتماد');
      solutions.push('أرسل تذكيراً عبر النظام للمدوّر لمراجعة الشحنة');
      if (!shipment.hazard_level || shipment.hazard_level === 'high') {
        solutions.push('⚠️ تأكد من أن المدوّر لديه الترخيص المناسب لهذا النوع من المخلفات');
      }
    }
    if (shipment.status === 'approved') {
      if (!shipment.driver && !shipment.manual_driver_name) {
        solutions.push('قم بتعيين سائق متاح للشحنة من صفحة إدارة السائقين');
        solutions.push('تحقق من توفر مركبة مناسبة لنوع المخلفات');
      } else {
        solutions.push('تواصل مع السائق المعيّن للتأكد من جاهزيته');
        solutions.push('تحقق من عدم وجود تعارض في جدول السائق');
      }
    }
  }

  if (type === 'overdue') {
    if (shipment.status === 'in_transit') {
      solutions.push('تواصل مع السائق للاطمئنان على حالته ومعرفة سبب التأخير');
      solutions.push('تحقق من موقع السائق عبر نظام التتبع');
      solutions.push('أبلغ المدوّر بالتأخير المتوقع لتجنب إغلاق الميزان');
      solutions.push('جهّز خطة بديلة (سائق احتياطي) في حال وجود عطل');
    } else {
      solutions.push('حدّث موعد التسليم المتوقع ليعكس الواقع');
      solutions.push('قم بتصعيد الشحنة لمدير العمليات');
      solutions.push('فكّر في إعادة جدولة الشحنة مع تاريخ واقعي');
    }
  }

  if (type === 'contract_expiry') {
    solutions.push('بادر بالتفاوض على تجديد العقد قبل انتهائه');
    solutions.push('راجع شروط العقد الحالي وحدد النقاط المطلوب تعديلها');
    solutions.push('جهّز عرض بديل من شريك آخر للمقارنة');
  }

  if (type === 'unpaid') {
    solutions.push('أرسل تذكيراً رسمياً بالفاتورة المستحقة');
    solutions.push('تواصل مع قسم المحاسبة للشريك');
    solutions.push('راجع شروط الدفع في العقد المرتبط');
  }

  if (type === 'unverified') {
    solutions.push('تأكد من اكتمال جميع المستندات المطلوبة');
    solutions.push('تواصل مع الدعم الفني إذا استمر التأخير');
  }

  return solutions;
}

const ShipmentDetailCard = ({ shipment }: { shipment: ShipmentDetail }) => {
  const generator = shipment.generator;
  const recycler = shipment.recycler;
  const driver = shipment.driver;

  return (
    <div className="bg-background/60 rounded-lg border border-border/50 p-3 space-y-3 text-right" dir="rtl">
      {/* Header Row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Badge variant="outline" className="text-xs gap-1">
          <Package className="h-3 w-3" />
          {shipment.shipment_number}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge className="text-[10px]">{STATUS_LABELS[shipment.status] || shipment.status}</Badge>
          {shipment.hazard_level && (
            <Badge variant={shipment.hazard_level === 'high' || shipment.hazard_level === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
              خطورة: {HAZARD_LABELS[shipment.hazard_level] || shipment.hazard_level}
            </Badge>
          )}
        </div>
      </div>

      {/* Waste Info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">النوع:</span>
          <span className="font-medium">{shipment.waste_type}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Weight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{shipment.quantity} {shipment.unit}</span>
        </div>
        {shipment.packaging_method && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">التعبئة:</span>
            <span className="font-medium">{shipment.packaging_method}</span>
          </div>
        )}
      </div>

      <Separator className="my-1" />

      {/* Locations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
          <div>
            <span className="text-muted-foreground block">الاستلام:</span>
            <span className="font-medium">{shipment.pickup_address || '—'}</span>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
          <div>
            <span className="text-muted-foreground block">التسليم:</span>
            <span className="font-medium">{shipment.delivery_address || '—'}</span>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">الإنشاء:</span>
          <span>{format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
        </div>
        {shipment.expected_delivery_date && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">المتوقع:</span>
            <span className={new Date(shipment.expected_delivery_date) < new Date() ? 'text-destructive font-bold' : ''}>
              {format(new Date(shipment.expected_delivery_date), 'dd/MM/yyyy', { locale: ar })}
            </span>
          </div>
        )}
        {shipment.pickup_date && (
          <div className="flex items-center gap-1.5">
            <Truck className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">الاستلام:</span>
            <span>{format(new Date(shipment.pickup_date), 'dd/MM/yyyy', { locale: ar })}</span>
          </div>
        )}
      </div>

      <Separator className="my-1" />

      {/* Parties */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {generator && (
          <div className="flex items-start gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="text-muted-foreground block">المولّد:</span>
              <span className="font-medium">{generator.name}</span>
              {generator.phone && <span className="block text-muted-foreground">{generator.phone}</span>}
            </div>
          </div>
        )}
        {recycler && (
          <div className="flex items-start gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="text-muted-foreground block">المدوّر:</span>
              <span className="font-medium">{recycler.name}</span>
              {recycler.phone && <span className="block text-muted-foreground">{recycler.phone}</span>}
            </div>
          </div>
        )}
        {(driver || shipment.manual_driver_name) && (
          <div className="flex items-start gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-muted-foreground block">السائق:</span>
              <span className="font-medium">{driver?.profile?.full_name || shipment.manual_driver_name || '—'}</span>
              <span className="block text-muted-foreground">
                {driver?.vehicle_plate || shipment.manual_vehicle_plate || '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {(shipment.notes || shipment.generator_notes) && (
        <>
          <Separator className="my-1" />
          <div className="text-xs text-muted-foreground">
            {shipment.notes && <p>📝 {shipment.notes}</p>}
            {shipment.generator_notes && <p>📋 ملاحظات المولّد: {shipment.generator_notes}</p>}
          </div>
        </>
      )}
    </div>
  );
};

const OperationalAlertsWidget = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgType = organization?.organization_type;
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['operational-alerts', organization?.id],
    queryFn: async (): Promise<OperationalAlert[]> => {
      const result: OperationalAlert[] = [];
      const now = new Date();
      const orgField = orgType === 'generator' ? 'generator_id'
        : orgType === 'recycler' ? 'recycler_id'
        : 'transporter_id';

      // Fetch stale shipments with full details
      const staleThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const { data: staleShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, pickup_address, delivery_address, pickup_date, expected_delivery_date, created_at, approved_at, in_transit_at, delivered_at, hazard_level, packaging_method, notes, generator_notes, manual_driver_name, manual_vehicle_plate, generator_id, recycler_id, driver_id')
        .eq(orgField, organization!.id)
        .in('status', ['new', 'approved'])
        .lt('created_at', staleThreshold.toISOString())
        .limit(5);

      // Fetch delayed shipments with full details
      const { data: delayedShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, pickup_address, delivery_address, pickup_date, expected_delivery_date, created_at, approved_at, in_transit_at, delivered_at, hazard_level, packaging_method, notes, generator_notes, manual_driver_name, manual_vehicle_plate, generator_id, recycler_id, driver_id')
        .eq(orgField, organization!.id)
        .in('status', ['new', 'approved', 'in_transit', 'confirmed'])
        .not('expected_delivery_date', 'is', null)
        .lt('expected_delivery_date', now.toISOString())
        .limit(10);

      // Collect all related IDs for batch fetch
      const allShipments = [...(staleShipments || []), ...(delayedShipments || [])];
      const orgIds = [...new Set(allShipments.flatMap(s => [s.generator_id, s.recycler_id].filter(Boolean)))] as string[];
      const driverIds = [...new Set(allShipments.map(s => s.driver_id).filter(Boolean))] as string[];

      // Batch fetch orgs, drivers, contracts, invoices, docs in parallel
      const [orgsRes, driversRes, expiringContracts, overdueInvoices, unverifiedDocs] = await Promise.all([
        orgIds.length > 0 ? supabase.from('organizations').select('id, name, phone, city').in('id', orgIds) : { data: [] },
        driverIds.length > 0 ? supabase.from('drivers').select('id, vehicle_plate, profile:profiles(full_name, phone)').in('id', driverIds) : { data: [] },
        supabase.from('contracts').select('id, title, end_date')
          .eq('organization_id', organization!.id).eq('status', 'active')
          .lte('end_date', new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString())
          .gte('end_date', now.toISOString()).limit(5),
        supabase.from('invoices').select('id, invoice_number, due_date, total_amount')
          .eq('organization_id', organization!.id).eq('status', 'overdue').limit(5),
        supabase.from('organization_documents').select('id, document_type, created_at')
          .eq('organization_id', organization!.id).eq('verification_status', 'pending').limit(3),
      ]);

      const orgsMap: Record<string, any> = {};
      (orgsRes.data || []).forEach(o => { orgsMap[o.id] = o; });
      const driversMap: Record<string, any> = {};
      (driversRes.data || []).forEach(d => {
        driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile };
      });

      const enrichShipment = (s: any): ShipmentDetail => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: s.driver_id ? driversMap[s.driver_id] || null : null,
      });

      // Process stale shipments
      staleShipments?.forEach(s => {
        const shipment = enrichShipment(s);
        const delayReason = analyzeDelayReason(shipment, 'stale');
        const solutions = generateSolutions(shipment, 'stale');
        result.push({
          id: `stale-${s.id}`, type: 'stale', severity: 'warning',
          message: `شحنة ${s.shipment_number} معلّقة منذ فترة طويلة`,
          detail: `تم إنشاؤها منذ ${formatDistanceToNow(new Date(s.created_at), { locale: ar })} ولم يتم تحريكها`,
          timestamp: new Date(s.created_at),
          resourceId: s.id, resourceType: 'shipment',
          shipment, delayReason, solutions,
        });
      });

      // Process delayed shipments
      delayedShipments?.forEach(s => {
        const shipment = enrichShipment(s);
        const expectedDate = new Date(s.expected_delivery_date!);
        const hoursLate = Math.round((now.getTime() - expectedDate.getTime()) / (1000 * 60 * 60));
        const delayReason = analyzeDelayReason(shipment, 'overdue');
        const solutions = generateSolutions(shipment, 'overdue');
        result.push({
          id: `delayed-${s.id}`, type: 'overdue',
          severity: hoursLate > 48 ? 'critical' : 'warning',
          message: `شحنة ${s.shipment_number} متأخرة عن موعد التسليم`,
          detail: `متأخرة بـ ${formatDistanceToNow(expectedDate, { locale: ar })}`,
          timestamp: expectedDate,
          resourceId: s.id, resourceType: 'shipment',
          shipment, delayReason, solutions,
        });
      });

      // Contracts
      expiringContracts.data?.forEach(c => {
        result.push({
          id: `contract-${c.id}`, type: 'contract_expiry', severity: 'critical',
          message: `عقد "${c.title}" ينتهي قريباً`,
          detail: `ينتهي ${formatDistanceToNow(new Date(c.end_date!), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(c.end_date!),
          resourceId: c.id, resourceType: 'contract',
          contractTitle: c.title,
          delayReason: 'العقد يقترب من تاريخ الانتهاء — قد يتوقف العمل مع هذا الشريك إذا لم يتم التجديد',
          solutions: generateSolutions({} as any, 'contract_expiry'),
        });
      });

      // Invoices
      overdueInvoices.data?.forEach(inv => {
        result.push({
          id: `invoice-${inv.id}`, type: 'unpaid', severity: 'critical',
          message: `فاتورة ${inv.invoice_number} متأخرة السداد`,
          detail: inv.due_date
            ? `استحقت ${formatDistanceToNow(new Date(inv.due_date), { locale: ar, addSuffix: true })} — المبلغ: ${inv.total_amount?.toLocaleString() || '—'} ج.م`
            : '',
          timestamp: new Date(inv.due_date || now),
          resourceId: inv.id, resourceType: 'invoice',
          invoiceAmount: inv.total_amount || 0,
          delayReason: 'الفاتورة تجاوزت تاريخ الاستحقاق — قد يكون الشريك يواجه مشاكل مالية أو لم يصله الإشعار',
          solutions: generateSolutions({} as any, 'unpaid'),
        });
      });

      // Documents
      unverifiedDocs.data?.forEach(doc => {
        result.push({
          id: `doc-${doc.id}`, type: 'unverified', severity: 'info',
          message: `وثيقة "${doc.document_type}" بانتظار التحقق`,
          detail: `مرفوعة ${formatDistanceToNow(new Date(doc.created_at), { locale: ar, addSuffix: true })}`,
          timestamp: new Date(doc.created_at),
          resourceId: doc.id, resourceType: 'document',
          delayReason: 'الوثيقة مرفوعة ولكن لم تتم مراجعتها من الإدارة بعد',
          solutions: generateSolutions({} as any, 'unverified'),
        });
      });

      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    },
    enabled: !!organization?.id,
    refetchInterval: 120000,
  });

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    toast.success('تم إخفاء التنبيه');
  }, []);

  const handleDismissAll = useCallback(() => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      alerts.forEach(a => next.add(a.id));
      return next;
    });
    toast.success('تم إخفاء جميع التنبيهات');
  }, [alerts]);

  const handleResolve = useCallback((alert: OperationalAlert) => {
    setResolvedIds(prev => new Set([...prev, alert.id]));
    toast.success(`تم تحديد "${alert.message}" كمحلول`);
  }, []);

  const handleQuickAction = useCallback((alert: OperationalAlert) => {
    switch (alert.resourceType) {
      case 'shipment':
        navigate(`/dashboard/shipments/${alert.resourceId}`);
        break;
      case 'contract':
        navigate(`/dashboard/contracts`);
        break;
      case 'invoice':
        navigate(`/dashboard/invoices`);
        break;
      case 'document':
        navigate(`/dashboard/settings`);
        break;
      default:
        navigate('/dashboard');
    }
  }, [navigate]);

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id) && !resolvedIds.has(a.id));
  const criticalCount = visibleAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = visibleAlerts.filter(a => a.severity === 'warning').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-14 bg-muted rounded" />
            <div className="h-14 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) return null;

  return (
    <Card className="border-border/40 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleDismissAll}>
              <EyeOff className="ml-1 h-3 w-3" />
              إخفاء الكل
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-primary" />
              تنبيهات تشغيلية
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5">{criticalCount} حرج</Badge>
              )}
              {warningCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5">{warningCount} تحذير</Badge>
              )}
              <Badge variant="outline" className="text-[10px] px-1.5">{visibleAlerts.length} إجمالي</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          <AnimatePresence>
            {visibleAlerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              const SeverityIcon = config.icon;
              const TypeIcon = TYPE_ICONS[alert.type] || Package;
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
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <svg className="absolute -top-2 -left-2 w-12 h-12 text-current opacity-[0.03]" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="24" cy="24" r="10" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                    <svg className="absolute -bottom-1 -right-1 w-10 h-10 text-current opacity-[0.03]" viewBox="0 0 40 40">
                      <rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(12 20 20)"/>
                    </svg>
                  </div>
                  {/* Collapsed header */}
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer relative"
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    <div className="flex-1 text-right min-w-0 space-y-1.5">
                      <p className="text-sm font-semibold truncate">{alert.message}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{alert.detail}</p>
                      
                      {/* Quick solutions preview - always visible */}
                      {alert.solutions && alert.solutions.length > 0 && !isExpanded && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <Sparkles className="w-3 h-3 text-primary shrink-0" />
                          {alert.solutions.slice(0, 2).map((sol, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5 bg-accent text-primary border-primary/20 cursor-default"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {sol.length > 40 ? sol.slice(0, 40) + '…' : sol}
                            </Badge>
                          ))}
                          {alert.solutions.length > 2 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                              +{alert.solutions.length - 2} حلول
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">
                        {TYPE_LABELS[alert.type] || alert.type}
                      </Badge>
                      <Badge variant={config.badge} className="text-[10px]">
                        {config.label}
                      </Badge>
                      <SeverityIcon className={`w-4 h-4 ${config.color}`} />
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-3 border-t border-dashed border-current/10">
                          {/* Shipment Detail Card */}
                          {alert.shipment && (
                            <div className="mt-3">
                              <ShipmentDetailCard shipment={alert.shipment} />
                            </div>
                          )}

                          {/* Delay Reason */}
                          {alert.delayReason && (
                            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-right" dir="rtl">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Info className="h-4 w-4 text-destructive" />
                                <span className="text-xs font-bold text-destructive">سبب المشكلة:</span>
                              </div>
                              <p className="text-xs text-destructive/80 leading-relaxed">{alert.delayReason}</p>
                            </div>
                          )}

                          {/* Solutions */}
                          {alert.solutions && alert.solutions.length > 0 && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-right" dir="rtl">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-primary">الحلول المقترحة:</span>
                              </div>
                              <ul className="space-y-1.5">
                                {alert.solutions.map((solution, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                                    <span className="bg-primary/20 text-primary rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <span className="leading-relaxed">{solution}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Timestamp */}
                          <p className="text-[11px] text-muted-foreground text-right">
                            {alert.timestamp && `📅 ${format(alert.timestamp, 'dd/MM/yyyy hh:mm a', { locale: ar })} — ${formatDistanceToNow(alert.timestamp, { locale: ar, addSuffix: true })}`}
                          </p>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}
                            >
                              <EyeOff className="ml-1 h-3 w-3" />
                              إخفاء
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction(alert); }}
                            >
                              <ExternalLink className="ml-1 h-3 w-3" />
                              معالجة مباشرة
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); handleResolve(alert); }}
                            >
                              <CheckCircle2 className="ml-1 h-3 w-3" />
                              تم الحل
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
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationalAlertsWidget;
