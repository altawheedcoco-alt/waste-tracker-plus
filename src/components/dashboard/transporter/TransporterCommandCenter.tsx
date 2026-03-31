import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  TrendingUp, TrendingDown, Truck, CheckCircle2, Users, Route, Gauge, Zap, Activity,
  Package, Timer, Fuel, DollarSign, AlertTriangle, Shield, Clock, MapPin, Wallet,
  BarChart3, ArrowUpRight, ArrowDownRight, Target, Sparkles, FileCheck, Eye,
  Signal, Radio, Milestone, ShieldCheck, CircleDot, ChevronDown, ChevronUp,
  Boxes, Navigation, Compass, Workflow, HeartPulse, Receipt, FileText,
  Building2, Scale, Leaf, CreditCard, UserCheck, Wrench, Star, Globe,
  BookOpen, BadgeCheck, Handshake, TrendingUp as TUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Lazy-loaded for PDF export — reduces initial bundle
const loadPdfTools = () => Promise.all([
  import('html2canvas'),
  import('jspdf'),
]).then(([h, j]) => ({ html2canvas: h.default, jsPDF: j.default }));

// ─── Animated counter ───
const useAnimatedNumber = (target: number, duration = 1200) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return current;
};

// ─── Animated arc gauge ───
const ArcGauge = ({ value, max = 100, size = 100, label, color, icon: Icon }: {
  value: number; max?: number; size?: number; label: string; color: string; icon: any;
}) => {
  const pct = Math.min(value / max, 1) * 100;
  const radius = (size - 12) / 2;
  const circumference = radius * Math.PI;
  const offset = circumference - (pct / 100) * circumference;
  const statusColor = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        <path d={`M ${6} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
        <motion.path d={`M ${6} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }} />
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" className="fill-foreground text-xl font-black">{Math.round(pct)}%</text>
      </svg>
      <div className="flex items-center gap-1 -mt-1">
        <Icon className={`w-3 h-3 ${statusColor}`} />
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
    </div>
  );
};

// ─── Mini sparkline ───
const MiniSparkline = ({ data, color, height = 28, width = 90 }: { data: number[]; color: string; height?: number; width?: number }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (
        <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
      )}
    </svg>
  );
};

// ─── Status Dot ───
const StatusDot = ({ status }: { status: 'healthy' | 'warning' | 'critical' }) => {
  const colors = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-destructive' };
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-40`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
};

// ─── Health Calculator ───
const calcHealthScore = (stats: any): { score: number; status: 'healthy' | 'warning' | 'critical'; factors: string[] } => {
  if (!stats) return { score: 0, status: 'critical', factors: [] };
  let score = 100;
  const factors: string[] = [];

  if (stats.overdueCount > 0) { score -= stats.overdueCount * 8; factors.push(`${stats.overdueCount} شحنة متأخرة`); }
  if (stats.pendingShipments > 10) { score -= 10; factors.push('تراكم في طلبات الموافقة'); }
  if (stats.totalDrivers > 0 && stats.availableDrivers === 0) { score -= 20; factors.push('لا يوجد سائقين متاحين'); }
  if (stats.completionRate < 50 && stats.todayTrips > 0) { score -= 15; factors.push('معدل إنجاز منخفض'); }
  if (stats.todayTrips === 0) { score -= 5; factors.push('لا توجد رحلات اليوم بعد'); }
  if (stats.unpaidInvoices > 3) { score -= 10; factors.push(`${stats.unpaidInvoices} فاتورة غير مسددة`); }
  if (stats.expiringDocs > 0) { score -= stats.expiringDocs * 5; factors.push(`${stats.expiringDocs} مستند يحتاج تجديد`); }

  score = Math.max(0, Math.min(100, score));
  const status = score >= 75 ? 'healthy' : score >= 45 ? 'warning' : 'critical';
  return { score, status, factors };
};

// ─── Stat Micro Card with drill-down ───
const StatMicro = ({ icon: Icon, label, value, color, alert, onClick, sub, details }: {
  icon: any; label: string; value: string | number; color: string; alert?: boolean; onClick?: () => void; sub?: string;
  details?: { items: { label: string; value: string | number }[]; actionLabel?: string };
}) => {
  const content = (
    <motion.div
      whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
      onClick={details ? undefined : onClick}
      className={`flex items-center gap-2 rounded-xl py-2 px-2.5 border relative overflow-hidden transition-all ${onClick || details ? 'cursor-pointer hover:shadow-md' : ''} ${
        alert ? 'bg-destructive/8 border-destructive/15' : 'bg-muted/20 border-border/30'
      }`}
    >
      {alert && <motion.div className="absolute inset-0 bg-destructive/5" animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 2, repeat: Infinity }} />}
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <div className="flex-1 min-w-0 text-right">
        <p className={`text-sm font-bold ${color} tabular-nums`}>{value}</p>
        <p className="text-[9px] text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-[8px] text-muted-foreground/60 truncate">{sub}</p>}
      </div>
    </motion.div>
  );

  if (!details) return content;

  return (
    <Popover>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent className="w-56 p-0 rounded-xl overflow-hidden" align="center" dir="rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="p-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            {label}
          </span>
          <Badge variant="outline" className="text-[9px] h-4">{value}</Badge>
        </div>
        <div className="p-2 space-y-1">
          {details.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 px-1.5 text-[11px] rounded hover:bg-muted/30">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
        {onClick && (
          <button
            onClick={onClick}
            className="w-full text-center py-2 text-[10px] font-bold text-primary hover:bg-primary/5 border-t border-border/30 transition-colors"
          >
            {details.actionLabel || 'عرض التفاصيل الكاملة'} →
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

type TimePeriod = 'today' | 'week' | 'month';
const PERIOD_LABELS: Record<TimePeriod, string> = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر' };

const TransporterCommandCenter = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [period, setPeriod] = useState<TimePeriod>('today');
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      pdf.save(`مركز-القيادة-${format(now, 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, now]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['transporter-command-center-v5', organization?.id, period],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      // Period-based start date
      const periodStart = new Date(today);
      if (period === 'week') periodStart.setDate(periodStart.getDate() - 7);
      else if (period === 'month') periodStart.setDate(periodStart.getDate() - 30);
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

      const [
        todayR, yesterdayR, activeR, driversR, weekR, ledgerR, pendingR, overdueR, monthR, partnersR,
        invoicesR, receiptsR, employeesR, vehiclesR, docsR, contractsR, depositsR
      ] = await Promise.all([
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', periodStart.toISOString()).lt('created_at', tomorrow.toISOString()),
        supabase.from('shipments').select('id').eq('transporter_id', organization!.id).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
        supabase.from('shipments').select('id, status, driver_id').eq('transporter_id', organization!.id).in('status', ['in_transit', 'approved', 'collecting'] as any),
        supabase.from('drivers').select('id, is_available').eq('organization_id', organization!.id),
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', weekAgo.toISOString()),
        supabase.from('accounting_ledger').select('amount, entry_type, entry_category, created_at').eq('organization_id', organization!.id),
        supabase.from('shipments').select('id').eq('transporter_id', organization!.id).in('status', ['new'] as any),
        supabase.from('shipments').select('id, expected_delivery_date, status').eq('transporter_id', organization!.id).not('status', 'in', '("delivered","confirmed","cancelled")'),
        supabase.from('shipments').select('id, status, quantity').eq('transporter_id', organization!.id).gte('created_at', monthAgo.toISOString()),
        supabase.from('external_partners').select('id').eq('organization_id', organization!.id),
        // NEW: Full org data
        supabase.from('invoices').select('id, status, total_amount').eq('organization_id', organization!.id),
        supabase.from('shipment_receipts').select('id, status, created_at').eq('transporter_id', organization!.id),
        supabase.from('organization_members').select('id, status').eq('organization_id', organization!.id),
        supabase.from('fleet_vehicles').select('id, status').eq('organization_id', organization!.id),
        supabase.from('entity_documents').select('id, document_category, created_at').eq('organization_id', organization!.id),
        supabase.from('contracts').select('id, status').eq('organization_id', organization!.id),
        supabase.from('deposits').select('id, amount').eq('organization_id', organization!.id),
      ]);

      const todayData = todayR.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const delivered = todayData.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;

      const ledgerEntries = ledgerR.data || [];
      const totalRevenue = ledgerEntries.filter(e => e.entry_type === 'credit' || e.entry_category === 'shipment_income').reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const pendingPayments = ledgerEntries.filter(e => e.entry_type === 'debit').reduce((sum, e) => sum + Math.abs(e.amount), 0);

      const monthlyRevenue: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const dayRev = ledgerEntries.filter(e => (e.entry_type === 'credit') && new Date(e.created_at) >= d && new Date(e.created_at) < next).reduce((sum, e) => sum + Math.abs(e.amount), 0);
        monthlyRevenue.push(dayRev);
      }

      const allDrivers = driversR.data || [];
      const availableDrivers = allDrivers.filter(d => d.is_available).length;
      const nowDate = new Date();
      const overdueCount = (overdueR.data || []).filter(s => s.expected_delivery_date && new Date(s.expected_delivery_date) < nowDate).length;

      const weekData = weekR.data || [];
      const dailyCounts: number[] = [];
      const dailyQuantities: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const dayShipments = weekData.filter(s => new Date(s.created_at) >= d && new Date(s.created_at) < next);
        dailyCounts.push(dayShipments.length);
        dailyQuantities.push(dayShipments.reduce((a, s) => a + (Number(s.quantity) || 0), 0));
      }

      const monthData = monthR.data || [];
      const monthDelivered = monthData.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const monthTotal = monthData.length;
      const monthQuantity = monthData.reduce((a, s) => a + (Number(s.quantity) || 0), 0);
      const activeDriverIds = new Set((activeR.data || []).map(s => s.driver_id).filter(Boolean));

      // NEW calculated stats
      const allInvoices = invoicesR.data || [];
      const unpaidInvoices = allInvoices.filter(i => i.status === 'unpaid' || i.status === 'pending' || i.status === 'draft').length;
      const invoicesTotal = allInvoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

      const allReceipts = receiptsR.data || [];
      const todayReceipts = allReceipts.filter(r => new Date(r.created_at) >= today).length;

      const members = employeesR.data || [];
      const activeMembers = members.filter(m => m.status === 'active').length;

      const vehicles = vehiclesR.data || [];
      const activeVehicles = vehicles.filter(v => v.status === 'active').length;

      const docs = docsR.data || [];
      // Check for contracts expiring within 30 days (entity_documents has no expiry_date)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const { count: expiringContractsCount } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .lte('end_date', thirtyDaysFromNow.toISOString())
        .gte('end_date', new Date().toISOString());
      const expiringDocs = expiringContractsCount || 0;
      
      const { count: expiredContractsCount } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization!.id)
        .lt('end_date', new Date().toISOString())
        .in('status', ['active', 'signed'] as any);
      const expiredDocs = expiredContractsCount || 0;

      const contracts = contractsR.data || [];
      const activeContracts = contracts.filter(c => c.status === 'active' || c.status === 'signed').length;

      const deposits = depositsR.data || [];
      const totalDeposits = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const pendingDeposits = 0;

      return {
        todayTrips: todayData.length,
        yesterdayTrips: yesterdayR.data?.length || 0,
        activeShipments: activeR.data?.length || 0,
        todayDelivered: delivered,
        totalDrivers: allDrivers.length,
        availableDrivers,
        activeDrivers: activeDriverIds.size,
        todayQuantity,
        completionRate: todayData.length > 0 ? Math.round((delivered / todayData.length) * 100) : 0,
        totalRevenue,
        pendingPayments,
        pendingShipments: pendingR.data?.length || 0,
        overdueCount,
        weeklySparkline: dailyCounts,
        weeklyQuantitySparkline: dailyQuantities,
        revenueSparkline: monthlyRevenue,
        weekTotal: weekData.length,
        inTransit: (activeR.data || []).filter(s => s.status === 'in_transit').length,
        awaitingPickup: (activeR.data || []).filter(s => s.status === 'approved').length,
        collecting: (activeR.data || []).filter(s => s.status === 'collecting').length,
        monthDelivered,
        monthTotal,
        monthQuantity,
        partnersCount: partnersR.data?.length || 0,
        driverUtilization: allDrivers.length > 0 ? Math.round((activeDriverIds.size / allDrivers.length) * 100) : 0,
        // NEW
        totalInvoices: allInvoices.length,
        unpaidInvoices,
        invoicesTotal,
        totalReceipts: allReceipts.length,
        todayReceipts,
        totalMembers: members.length,
        activeMembers,
        totalVehicles: vehicles.length,
        activeVehicles,
        totalDocs: docs.length,
        expiringDocs,
        expiredDocs,
        totalContracts: contracts.length,
        activeContracts,
        totalDeposits,
        pendingDeposits,
      };
    },
    enabled: !!organization?.id,
    staleTime: 2 * 60 * 1000,       // 2 minutes
    gcTime: 10 * 60 * 1000,         // 10 minutes
    refetchInterval: 60000,          // every 60s instead of 30s
    refetchOnWindowFocus: false,
  });

  const health = useMemo(() => calcHealthScore(stats), [stats]);

  // Animated numbers
  const a = {
    trips: useAnimatedNumber(stats?.todayTrips || 0),
    inTransit: useAnimatedNumber(stats?.inTransit || 0),
    delivered: useAnimatedNumber(stats?.todayDelivered || 0),
    drivers: useAnimatedNumber(stats?.totalDrivers || 0),
    revenue: useAnimatedNumber(Math.round((stats?.totalRevenue || 0) / 1000)),
    pending: useAnimatedNumber(stats?.pendingShipments || 0),
    overdue: useAnimatedNumber(stats?.overdueCount || 0),
    active: useAnimatedNumber(stats?.activeShipments || 0),
    monthTotal: useAnimatedNumber(stats?.monthTotal || 0),
    partners: useAnimatedNumber(stats?.partnersCount || 0),
    invoices: useAnimatedNumber(stats?.totalInvoices || 0),
    receipts: useAnimatedNumber(stats?.totalReceipts || 0),
    members: useAnimatedNumber(stats?.totalMembers || 0),
    vehicles: useAnimatedNumber(stats?.totalVehicles || 0),
    contracts: useAnimatedNumber(stats?.totalContracts || 0),
    docs: useAnimatedNumber(stats?.totalDocs || 0),
  };

  const trend = stats ? stats.todayTrips - stats.yesterdayTrips : 0;
  const trendPercent = stats?.yesterdayTrips ? Math.round((trend / stats.yesterdayTrips) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-2xl bg-card">
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3 mr-auto" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/50 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <motion.div ref={cardRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <Card className="overflow-hidden border border-border/40 shadow-2xl bg-card relative">
          {/* Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/[0.04] rounded-full blur-[120px]"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 10, repeat: Infinity }} />
            <motion.div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary/[0.03] rounded-full blur-[100px]"
              animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity }} />
            <div className="absolute inset-0 opacity-[0.015]"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>

          <CardContent className="p-3 sm:p-5 relative z-10">

            {/* ═══════════ HEADER ═══════════ */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-default text-xs font-bold ${
                        health.status === 'healthy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                        health.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
                        'bg-destructive/10 border-destructive/20 text-destructive'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      <StatusDot status={health.status} />
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>{health.score}%</span>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[260px] text-right">
                    <p className="font-bold mb-1">صحة العمليات: {health.score}%</p>
                    {health.factors.length > 0 ? (
                      <ul className="text-[11px] space-y-0.5">{health.factors.map((f, i) => <li key={i}>⚠ {f}</li>)}</ul>
                    ) : <p className="text-[11px]">كل الأنظمة تعمل بكفاءة</p>}
                  </TooltipContent>
                </Tooltip>

                {trend >= 0 ? (
                  <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 text-xs">
                    <TrendingUp className="w-3 h-3" /> {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20 text-xs">
                    <TrendingDown className="w-3 h-3" /> {trendPercent}%
                  </Badge>
                )}

                {(stats?.overdueCount || 0) > 0 && (
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Badge className="gap-1 bg-destructive/15 text-destructive border-destructive/20 text-[10px]">
                      <AlertTriangle className="w-3 h-3" /> {stats?.overdueCount} متأخرة
                    </Badge>
                  </motion.div>
                )}

                {(stats?.expiredDocs || 0) > 0 && (
                  <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                    <Shield className="w-3 h-3" /> {stats?.expiredDocs} مستند منتهي
                  </Badge>
                )}

                {(stats?.unpaidInvoices || 0) > 0 && (
                  <Badge className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                    <CreditCard className="w-3 h-3" /> {stats?.unpaidInvoices} فاتورة معلقة
                  </Badge>
                )}
                {/* Period Toggle */}
                <div className="flex items-center gap-0.5 bg-muted/30 rounded-lg p-0.5 border border-border/30">
                  {(['today', 'week', 'month'] as TimePeriod[]).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        period === p ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>

                {/* PDF Export */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleExportPDF} disabled={isExporting}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-[10px] font-bold disabled:opacity-50">
                      <FileText className="w-3 h-3" />
                      {isExporting ? '...' : 'PDF'}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>تصدير كـ PDF</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2 justify-end">
                    مركز القيادة الشامل
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                      <Gauge className="w-5 h-5 text-primary" />
                    </motion.div>
                  </h2>
                  <div className="flex items-center gap-2 justify-end mt-0.5">
                    <span className="text-[10px] font-mono text-primary/70">{format(now, 'hh:mm a', { locale: ar })}</span>
                    <span className="text-[10px] text-muted-foreground">{format(now, 'EEEE d MMMM', { locale: ar })}</span>
                  </div>
                </div>
                <motion.div
                  className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20"
                  whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}
                >
                  <Activity className="w-5 h-5 text-primary-foreground" />
                  <motion.div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card"
                    animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                </motion.div>
              </div>
            </div>

            {/* ═══════════ PRIMARY METRICS (4 Hero Cards) ═══════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                {
                  label: `رحلات ${PERIOD_LABELS[period]}`, value: a.trips, raw: stats?.todayTrips || 0,
                  icon: Truck, gradient: 'from-blue-500 to-cyan-400', color: '#3B82F6',
                  sub: `${stats?.yesterdayTrips || 0} أمس`, sparkData: stats?.weeklySparkline,
                  onClick: () => navigate('/dashboard/transporter-shipments'),
                },
                {
                  label: 'على الطريق', value: a.inTransit, raw: stats?.inTransit || 0,
                  icon: Route, gradient: 'from-amber-500 to-orange-400', color: '#F59E0B',
                  sub: `${stats?.collecting || 0} قيد الجمع`, sparkData: null,
                  onClick: () => navigate('/dashboard/tracking-center'),
                },
                {
                  label: 'تم التسليم', value: a.delivered, raw: stats?.todayDelivered || 0,
                  icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-400', color: '#10B981',
                  sub: `إنجاز ${stats?.completionRate || 0}%`, sparkData: null,
                  onClick: () => navigate('/dashboard/transporter-shipments'),
                },
                {
                  label: 'السائقون', value: a.drivers, raw: stats?.totalDrivers || 0,
                  icon: Users, gradient: 'from-violet-500 to-purple-400', color: '#8B5CF6',
                  sub: `${stats?.availableDrivers || 0} متاح · ${stats?.activeDrivers || 0} نشط`,
                  sparkData: null, onClick: () => navigate('/dashboard/transporter-drivers'),
                },
              ].map((m, index) => (
                <motion.div key={m.label}
                  initial={{ opacity: 0, y: 24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.07, duration: 0.5, type: 'spring', stiffness: 200 }}
                  whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.98 }}
                  onClick={m.onClick}
                  className="relative group rounded-xl sm:rounded-2xl border border-border/30 bg-card/80 backdrop-blur-md p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-border/60 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                  <div className="flex items-start justify-between mb-2 relative z-10">
                    {m.sparkData && <MiniSparkline data={m.sparkData} color={m.color} height={24} width={60} />}
                    {!m.sparkData && <div className="w-[60px]" />}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg`}>
                      <m.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums leading-none">{m.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-semibold">{m.label}</p>
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5">{m.sub}</p>
                  </div>
                  {m.raw > 0 && (
                    <motion.div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.25 }} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* ═══════════ FULL ORG DASHBOARD GRID — Always Visible ═══════════ */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-3">
              
              {/* Row 1: Operations */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                <StatMicro icon={DollarSign} label="إجمالي الإيرادات" value={`${a.revenue}K`} color="text-emerald-500"
                  sub={stats?.revenueSparkline ? undefined : undefined} onClick={() => navigate('/dashboard/erp/accounting')} />
                <StatMicro icon={Clock} label="بانتظار الموافقة" value={a.pending} color="text-amber-500" alert={(stats?.pendingShipments || 0) > 5}
                  onClick={() => navigate('/dashboard/transporter-shipments?status=new')} />
                <StatMicro icon={AlertTriangle} label="متأخرة" value={a.overdue}
                  color={(stats?.overdueCount || 0) > 0 ? 'text-destructive' : 'text-emerald-500'} alert={(stats?.overdueCount || 0) > 0}
                  onClick={() => navigate('/dashboard/transporter-shipments?status=overdue')} />
                <StatMicro icon={Activity} label="شحنات نشطة" value={a.active} color="text-primary"
                  onClick={() => navigate('/dashboard/tracking-center')} />
              </div>

              {/* Row 2: Organization Resources */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                <StatMicro icon={Receipt} label="الفواتير" value={a.invoices} color="text-blue-500"
                  sub={stats?.unpaidInvoices ? `${stats.unpaidInvoices} معلقة` : 'مسددة'}
                  onClick={() => navigate('/dashboard/erp/accounting')} />
                <StatMicro icon={FileCheck} label="الشهادات/الإيصالات" value={a.receipts} color="text-teal-500"
                  sub={stats?.todayReceipts ? `${stats.todayReceipts} اليوم` : undefined}
                  onClick={() => navigate('/dashboard/transporter-receipts')} />
                <StatMicro icon={UserCheck} label="فريق العمل" value={a.members} color="text-violet-500"
                  sub={`${stats?.activeMembers || 0} نشط`}
                  onClick={() => navigate('/dashboard/org-structure')} />
                <StatMicro icon={Truck} label="المركبات" value={a.vehicles} color="text-orange-500"
                  sub={`${stats?.activeVehicles || 0} فعّال`}
                  onClick={() => navigate('/dashboard/transporter-drivers')} />
                <StatMicro icon={Handshake} label="العقود" value={a.contracts} color="text-indigo-500"
                  sub={`${stats?.activeContracts || 0} سارٍ`}
                  onClick={() => navigate('/dashboard/contracts')} />
                <StatMicro icon={FileText} label="المستندات" value={a.docs} color="text-cyan-500"
                  sub={stats?.expiringDocs ? `${stats.expiringDocs} تنتهي قريباً` : 'سليمة'}
                  alert={(stats?.expiringDocs || 0) > 0}
                  onClick={() => navigate('/dashboard/document-center')} />
              </div>

              {/* Row 3: Financial & Compliance Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatMicro icon={Wallet} label="المدفوعات المعلقة" value={`${Math.round((stats?.pendingPayments || 0) / 1000)}K`} color="text-amber-500"
                  onClick={() => navigate('/dashboard/erp/accounting')} />
                <StatMicro icon={CreditCard} label="الإيداعات" value={`${Math.round((stats?.totalDeposits || 0) / 1000)}K`} color="text-emerald-500"
                  sub={stats?.pendingDeposits ? `${stats.pendingDeposits} قيد المراجعة` : undefined}
                  onClick={() => navigate('/dashboard/quick-deposit-links')} />
                <StatMicro icon={Handshake} label="الشركاء" value={a.partners} color="text-indigo-500"
                  onClick={() => navigate('/dashboard/partners')} />
                <StatMicro icon={MapPin} label="بانتظار الاستلام" value={stats?.awaitingPickup || 0} color="text-primary"
                  sub={`${stats?.todayQuantity?.toLocaleString('ar-SA') || 0} طن اليوم`}
                  onClick={() => navigate('/dashboard/transporter-shipments?status=new')} />
              </div>
            </motion.div>

            {/* ═══════════ GAUGES + MONTHLY SUMMARY ═══════════ */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gauges */}
                <div className="flex items-center justify-around p-3 rounded-xl bg-muted/20 border border-border/30">
                  <ArcGauge value={stats?.completionRate || 0} label="الإنجاز" color="hsl(var(--primary))" icon={Target} size={80} />
                  <ArcGauge value={stats?.driverUtilization || 0} label="استخدام الأسطول" color="#F59E0B" icon={Truck} size={80} />
                </div>

                {/* Monthly Summary */}
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-right space-y-2">
                  <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 justify-end">
                    ملخص الشهر <Compass className="w-3.5 h-3.5 text-primary" />
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: a.monthTotal, l: 'شحنة' },
                      { v: (stats?.monthQuantity || 0).toLocaleString('ar-SA'), l: 'طن' },
                      { v: stats?.monthDelivered || 0, l: 'تم التسليم', c: 'text-emerald-500' },
                      { v: a.partners, l: 'شريك' },
                    ].map((item, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-card/60 border border-border/20">
                        <p className={`text-lg font-black tabular-nums ${item.c || 'text-foreground'}`}>{item.v}</p>
                        <p className="text-[9px] text-muted-foreground">{item.l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Quantity Bars */}
                <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-right space-y-2">
                  <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 justify-end">
                    اتجاه الكميات (أسبوعي) <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  </p>
                  <div className="flex items-end gap-1 h-16 justify-center">
                    {(stats?.weeklyQuantitySparkline || []).map((qty, i) => {
                      const max = Math.max(...(stats?.weeklyQuantitySparkline || [1]), 1);
                      const pct = Math.max((qty / max) * 100, 4);
                      const isToday = i === (stats?.weeklyQuantitySparkline?.length || 0) - 1;
                      return (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <motion.div className={`w-6 sm:w-8 rounded-t-md ${isToday ? 'bg-primary' : 'bg-primary/30'}`}
                              initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                              transition={{ delay: 0.7 + i * 0.05, duration: 0.5, ease: 'easeOut' }} />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">{qty.toLocaleString('ar-SA')} طن</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[8px] text-muted-foreground/50 px-1">
                    <span>قبل ٧ أيام</span>
                    <span>اليوم</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══════════ LIVE PULSE FOOTER ═══════════ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/10 border border-border/20 flex-wrap"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="font-bold text-foreground">{stats?.weekTotal || 0}</span> شحنة الأسبوع
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Package className="w-3 h-3 text-primary" />
                  <span className="font-bold text-foreground">{stats?.todayQuantity?.toLocaleString('ar-SA') || 0}</span> طن اليوم
                </div>
                {stats?.weeklySparkline && (
                  <div className="hidden sm:flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-primary" />
                    <MiniSparkline data={stats.weeklySparkline} color="hsl(var(--primary))" height={16} width={60} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span className="font-bold">{stats?.totalMembers || 0}</span> عضو
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Truck className="w-3 h-3 text-primary" />
                  <span className="font-bold">{stats?.totalVehicles || 0}</span> مركبة
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Fuel className="w-3 h-3 text-primary" />
                  <span>مباشر</span>
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
              </div>
            </motion.div>

          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default TransporterCommandCenter;
