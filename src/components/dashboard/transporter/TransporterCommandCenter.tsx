import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  TrendingUp, TrendingDown, Truck, CheckCircle2, Users, Route, Gauge, Zap, Activity,
  Package, Timer, Fuel, DollarSign, AlertTriangle, Shield, Clock, MapPin, Wallet,
  BarChart3, ArrowUpRight, ArrowDownRight, Target, Sparkles, FileCheck, Eye,
  Signal, Radio, Milestone, ShieldCheck, CircleDot, ChevronDown, ChevronUp,
  Boxes, Navigation, Compass, Workflow, HeartPulse
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const circumference = radius * Math.PI; // semi-circle
  const offset = circumference - (pct / 100) * circumference;
  const statusColor = pct >= 80 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-destructive';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        <path
          d={`M ${6} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round"
        />
        <motion.path
          d={`M ${6} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 6} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }}
        />
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

// ─── Operational Health Calculator ───
const calcHealthScore = (stats: any): { score: number; status: 'healthy' | 'warning' | 'critical'; factors: string[] } => {
  if (!stats) return { score: 0, status: 'critical', factors: [] };
  let score = 100;
  const factors: string[] = [];

  if (stats.overdueCount > 0) { score -= stats.overdueCount * 8; factors.push(`${stats.overdueCount} شحنة متأخرة`); }
  if (stats.pendingShipments > 10) { score -= 10; factors.push('تراكم في طلبات الموافقة'); }
  if (stats.totalDrivers > 0 && stats.availableDrivers === 0) { score -= 20; factors.push('لا يوجد سائقين متاحين'); }
  if (stats.completionRate < 50 && stats.todayTrips > 0) { score -= 15; factors.push('معدل إنجاز منخفض'); }
  if (stats.todayTrips === 0) { score -= 5; factors.push('لا توجد رحلات اليوم بعد'); }

  score = Math.max(0, Math.min(100, score));
  const status = score >= 75 ? 'healthy' : score >= 45 ? 'warning' : 'critical';
  return { score, status, factors };
};

const TransporterCommandCenter = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['transporter-command-center-v3', organization?.id],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today); monthAgo.setDate(monthAgo.getDate() - 30);

      const [todayR, yesterdayR, activeR, driversR, weekR, ledgerR, pendingR, overdueR, monthR, partnersR] = await Promise.all([
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
        supabase.from('shipments').select('id').eq('transporter_id', organization!.id).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
        supabase.from('shipments').select('id, status, driver_id').eq('transporter_id', organization!.id).in('status', ['in_transit', 'approved', 'collecting'] as any),
        supabase.from('drivers').select('id, is_available').eq('organization_id', organization!.id),
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', weekAgo.toISOString()),
        supabase.from('accounting_ledger').select('amount, entry_type, entry_category, created_at').eq('organization_id', organization!.id),
        supabase.from('shipments').select('id').eq('transporter_id', organization!.id).in('status', ['new'] as any),
        supabase.from('shipments').select('id, expected_delivery_date, status').eq('transporter_id', organization!.id).not('status', 'in', '("delivered","confirmed","cancelled","completed")'),
        supabase.from('shipments').select('id, status, quantity').eq('transporter_id', organization!.id).gte('created_at', monthAgo.toISOString()),
        supabase.from('organization_bindings').select('id').or(`source_organization_id.eq.${organization!.id},target_organization_id.eq.${organization!.id}`),
      ]);

      const todayData = todayR.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const delivered = todayData.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;

      const ledgerEntries = ledgerR.data || [];
      const totalRevenue = ledgerEntries.filter(e => e.entry_type === 'credit' || e.entry_category === 'shipment_income').reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const pendingPayments = ledgerEntries.filter(e => e.entry_type === 'debit').reduce((sum, e) => sum + Math.abs(e.amount), 0);

      // Monthly revenue sparkline
      const monthlyRevenue: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const dayRev = ledgerEntries
          .filter(e => (e.entry_type === 'credit') && new Date(e.created_at) >= d && new Date(e.created_at) < next)
          .reduce((sum, e) => sum + Math.abs(e.amount), 0);
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

      // Unique active drivers
      const activeDriverIds = new Set((activeR.data || []).map(s => s.driver_id).filter(Boolean));

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
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  const health = useMemo(() => calcHealthScore(stats), [stats]);

  const animatedTrips = useAnimatedNumber(stats?.todayTrips || 0);
  const animatedInTransit = useAnimatedNumber(stats?.inTransit || 0);
  const animatedDelivered = useAnimatedNumber(stats?.todayDelivered || 0);
  const animatedDrivers = useAnimatedNumber(stats?.totalDrivers || 0);
  const animatedRevenue = useAnimatedNumber(Math.round((stats?.totalRevenue || 0) / 1000));
  const animatedPending = useAnimatedNumber(stats?.pendingShipments || 0);
  const animatedOverdue = useAnimatedNumber(stats?.overdueCount || 0);
  const animatedActive = useAnimatedNumber(stats?.activeShipments || 0);
  const animatedMonthTotal = useAnimatedNumber(stats?.monthTotal || 0);
  const animatedPartners = useAnimatedNumber(stats?.partnersCount || 0);

  const trend = stats ? stats.todayTrips - stats.yesterdayTrips : 0;
  const trendPercent = stats?.yesterdayTrips ? Math.round((trend / stats.yesterdayTrips) * 100) : 0;

  const toggleSection = useCallback((id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  }, []);

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
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted/30 rounded-xl" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <Card className="overflow-hidden border border-border/40 shadow-2xl bg-card relative">
          {/* ─── Animated Background ─── */}
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
                {/* Health Score Badge */}
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
                      <ul className="text-[11px] space-y-0.5">
                        {health.factors.map((f, i) => <li key={i}>⚠ {f}</li>)}
                      </ul>
                    ) : <p className="text-[11px]">كل الأنظمة تعمل بكفاءة</p>}
                  </TooltipContent>
                </Tooltip>

                {/* Trend Badge */}
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

                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {stats?.weekTotal || 0} شحنة هذا الأسبوع • {stats?.partnersCount || 0} شريك
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2 justify-end">
                    مركز القيادة والسيطرة
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
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card"
                    animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            </div>

            {/* ═══════════ PRIMARY METRICS (4 Heroic Cards) ═══════════ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                {
                  label: 'رحلات اليوم', value: animatedTrips, raw: stats?.todayTrips || 0,
                  icon: Truck, gradient: 'from-blue-500 to-cyan-400', color: '#3B82F6',
                  sub: `${stats?.yesterdayTrips || 0} أمس`, sparkData: stats?.weeklySparkline,
                  onClick: () => navigate('/dashboard/transporter-shipments'),
                },
                {
                  label: 'على الطريق', value: animatedInTransit, raw: stats?.inTransit || 0,
                  icon: Route, gradient: 'from-amber-500 to-orange-400', color: '#F59E0B',
                  sub: `${stats?.collecting || 0} قيد الجمع`, sparkData: null,
                  onClick: () => navigate('/dashboard/tracking-center'),
                },
                {
                  label: 'تم التسليم', value: animatedDelivered, raw: stats?.todayDelivered || 0,
                  icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-400', color: '#10B981',
                  sub: `إنجاز ${stats?.completionRate || 0}%`, sparkData: null,
                  onClick: () => navigate('/dashboard/transporter-shipments'),
                },
                {
                  label: 'السائقون', value: animatedDrivers, raw: stats?.totalDrivers || 0,
                  icon: Users, gradient: 'from-violet-500 to-purple-400', color: '#8B5CF6',
                  sub: `${stats?.availableDrivers || 0} متاح · ${stats?.activeDrivers || 0} نشط`,
                  sparkData: null, onClick: () => navigate('/dashboard/drivers'),
                },
              ].map((m, index) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.07, duration: 0.5, type: 'spring', stiffness: 200 }}
                  whileHover={{ y: -3, scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={m.onClick}
                  className="relative group rounded-xl sm:rounded-2xl border border-border/30 bg-card/80 backdrop-blur-md p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-border/60 overflow-hidden"
                >
                  {/* Hover gradient overlay */}
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
                    <motion.div
                      className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: m.color }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.25 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            {/* ═══════════ OPERATIONAL MATRIX (Expandable) ═══════════ */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="mt-3"
            >
              {/* Status strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'الإيرادات', value: `${animatedRevenue}K`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', sparkData: stats?.revenueSparkline, sparkColor: '#10B981' },
                  { label: 'بانتظار الموافقة', value: animatedPending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/15', alert: (stats?.pendingShipments || 0) > 5 },
                  { label: 'متأخرة', value: animatedOverdue, icon: AlertTriangle, color: (stats?.overdueCount || 0) > 0 ? 'text-destructive' : 'text-emerald-500', bg: (stats?.overdueCount || 0) > 0 ? 'bg-destructive/8' : 'bg-emerald-500/8', border: (stats?.overdueCount || 0) > 0 ? 'border-destructive/15' : 'border-emerald-500/15', alert: (stats?.overdueCount || 0) > 0 },
                  { label: 'نشطة', value: animatedActive, icon: Activity, color: 'text-primary', bg: 'bg-primary/8', border: 'border-primary/15' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.06 }}
                    className={`flex items-center gap-2 ${m.bg} rounded-xl py-2 px-3 border ${m.border} relative overflow-hidden`}
                  >
                    {m.alert && <motion.div className="absolute inset-0 bg-destructive/5" animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 2, repeat: Infinity }} />}
                    <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
                    <div className="flex-1 min-w-0 text-right">
                      <p className={`text-sm font-bold ${m.color} tabular-nums`}>{m.value}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{m.label}</p>
                    </div>
                    {m.sparkData && <MiniSparkline data={m.sparkData} color={m.sparkColor!} height={20} width={50} />}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ═══════════ EXPANDABLE INSIGHTS PANEL ═══════════ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-3">
              <button
                onClick={() => toggleSection('insights')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: expandedSection === 'insights' ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {expandedSection === 'insights' ? 'إخفاء التفاصيل' : 'عرض المزيد من المؤشرات'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {stats && stats.todayQuantity > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Package className="w-3 h-3 text-primary" />
                      {stats.todayQuantity.toLocaleString('ar-SA')} طن اليوم
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-primary" />
                    {stats?.awaitingPickup || 0} بانتظار الاستلام
                  </span>
                  {stats?.weeklySparkline && (
                    <div className="hidden sm:flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-primary" />
                      <MiniSparkline data={stats.weeklySparkline} color="hsl(var(--primary))" height={16} width={60} />
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Fuel className="w-3 h-3 text-primary" />
                    <span>مباشر</span>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedSection === 'insights' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Gauges */}
                      <div className="flex items-center justify-around p-3 rounded-xl bg-muted/20 border border-border/30">
                        <ArcGauge value={stats?.completionRate || 0} label="الإنجاز" color="hsl(var(--primary))" icon={Target} size={80} />
                        <ArcGauge value={stats?.driverUtilization || 0} label="استخدام الأسطول" color="#F59E0B" icon={Truck} size={80} />
                      </div>

                      {/* Monthly summary */}
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-right space-y-2">
                        <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 justify-end">
                          ملخص الشهر
                          <Compass className="w-3.5 h-3.5 text-primary" />
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 rounded-lg bg-card/60 border border-border/20">
                            <p className="text-lg font-black text-foreground tabular-nums">{animatedMonthTotal}</p>
                            <p className="text-[9px] text-muted-foreground">شحنة</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-card/60 border border-border/20">
                            <p className="text-lg font-black text-foreground tabular-nums">{(stats?.monthQuantity || 0).toLocaleString('ar-SA')}</p>
                            <p className="text-[9px] text-muted-foreground">طن</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-card/60 border border-border/20">
                            <p className="text-lg font-black text-emerald-500 tabular-nums">{stats?.monthDelivered || 0}</p>
                            <p className="text-[9px] text-muted-foreground">تم التسليم</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-card/60 border border-border/20">
                            <p className="text-lg font-black text-foreground tabular-nums">{animatedPartners}</p>
                            <p className="text-[9px] text-muted-foreground">شريك</p>
                          </div>
                        </div>
                      </div>

                      {/* Weekly Quantity Trend */}
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/30 text-right space-y-2">
                        <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5 justify-end">
                          اتجاه الكميات (أسبوعي)
                          <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        </p>
                        <div className="flex items-end gap-1 h-16 justify-center">
                          {(stats?.weeklyQuantitySparkline || []).map((qty, i) => {
                            const max = Math.max(...(stats?.weeklyQuantitySparkline || [1]), 1);
                            const pct = Math.max((qty / max) * 100, 4);
                            const isToday = i === (stats?.weeklyQuantitySparkline?.length || 0) - 1;
                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    className={`w-6 sm:w-8 rounded-t-md ${isToday ? 'bg-primary' : 'bg-primary/30'}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${pct}%` }}
                                    transition={{ delay: 0.9 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {qty.toLocaleString('ar-SA')} طن
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[8px] text-muted-foreground/50 px-1">
                          <span>اليوم</span>
                          <span>قبل ٧ أيام</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
};

export default TransporterCommandCenter;
