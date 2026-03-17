import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, Truck, CheckCircle2, Users, Route, Gauge, Zap, Activity, 
  Package, Timer, Fuel, DollarSign, AlertTriangle, Shield, Clock, MapPin, Wallet,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus, Target, Sparkles, FileCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';

// Animated counter hook
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

// Progress ring component
const ProgressRing = ({ progress, size = 56, stroke = 4, color }: { progress: number; size?: number; stroke?: number; color: string }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-white/5" />
      <motion.circle
        cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
        strokeDasharray={circumference}
      />
    </svg>
  );
};

// Mini sparkline component
const MiniSparkline = ({ data, color, height = 24 }: { data: number[]; color: string; height?: number }) => {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const TransporterCommandCenter = () => {
  const { organization } = useAuth();
  const [now, setNow] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['transporter-command-center-v2', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [todayResult, yesterdayResult, activeResult, driversResult, weekResult, ledgerResult, pendingResult, overdueResult] = await Promise.all([
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
        supabase.from('shipments').select('id').eq('transporter_id', organization!.id).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
        supabase.from('shipments').select('id, status').eq('transporter_id', organization!.id).in('status', ['in_transit', 'approved', 'picked_up', 'loading']),
        supabase.from('drivers').select('id, is_available').eq('organization_id', organization!.id),
        supabase.from('shipments').select('status, quantity, created_at').eq('transporter_id', organization!.id).gte('created_at', weekAgo.toISOString()),
        supabase.from('accounting_ledger').select('amount, entry_type, entry_category').eq('organization_id', organization!.id),
        supabase.from('shipments').select('id').eq('transporter_id', organization!.id).in('status', ['pending', 'new']),
        supabase.from('shipments').select('id, expected_delivery_date').eq('transporter_id', organization!.id).not('status', 'in', '("delivered","confirmed","cancelled","completed")'),
      ]);

      const todayData = todayResult.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const delivered = todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length;

      // Financial calculations
      const ledgerEntries = ledgerResult.data || [];
      const totalRevenue = ledgerEntries
        .filter(e => e.entry_type === 'credit' || e.entry_category === 'shipment_income')
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);
      const pendingPayments = ledgerEntries
        .filter(e => e.entry_type === 'debit')
        .reduce((sum, e) => sum + Math.abs(e.amount), 0);

      // Drivers
      const allDrivers = driversResult.data || [];
      const availableDrivers = allDrivers.filter(d => d.is_available).length;

      // Overdue
      const nowDate = new Date();
      const overdueCount = (overdueResult.data || []).filter(s => 
        s.expected_delivery_date && new Date(s.expected_delivery_date) < nowDate
      ).length;

      // Weekly sparkline data (last 7 days)
      const weekData = weekResult.data || [];
      const dailyCounts: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        dailyCounts.push(weekData.filter(s => new Date(s.created_at) >= d && new Date(s.created_at) < next).length);
      }

      return {
        todayTrips: todayData.length,
        yesterdayTrips: yesterdayResult.data?.length || 0,
        activeShipments: activeResult.data?.length || 0,
        todayDelivered: delivered,
        totalDrivers: allDrivers.length,
        availableDrivers,
        todayQuantity,
        completionRate: todayData.length > 0 ? Math.round((delivered / todayData.length) * 100) : 0,
        totalRevenue,
        pendingPayments,
        pendingShipments: pendingResult.data?.length || 0,
        overdueCount,
        weeklySparkline: dailyCounts,
        weekTotal: weekData.length,
        inTransit: (activeResult.data || []).filter(s => s.status === 'in_transit').length,
        awaitingPickup: (activeResult.data || []).filter(s => s.status === 'approved').length,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  const animatedTrips = useAnimatedNumber(stats?.todayTrips || 0);
  const animatedActive = useAnimatedNumber(stats?.activeShipments || 0);
  const animatedDelivered = useAnimatedNumber(stats?.todayDelivered || 0);
  const animatedDrivers = useAnimatedNumber(stats?.totalDrivers || 0);
  const animatedRevenue = useAnimatedNumber(Math.round((stats?.totalRevenue || 0) / 1000));
  const animatedPending = useAnimatedNumber(stats?.pendingShipments || 0);
  const animatedOverdue = useAnimatedNumber(stats?.overdueCount || 0);
  const animatedInTransit = useAnimatedNumber(stats?.inTransit || 0);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-2xl bg-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 bg-muted/50 rounded-2xl" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = stats ? stats.todayTrips - stats.yesterdayTrips : 0;
  const trendPercent = stats?.yesterdayTrips ? Math.round((trend / stats.yesterdayTrips) * 100) : 0;

  // Primary metrics row
  const primaryMetrics = [
    { label: 'رحلات اليوم', value: animatedTrips, raw: stats?.todayTrips || 0, icon: Truck, gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/30', ring: 'ring-blue-400/20', bg: 'bg-blue-500/8', color: '#3B82F6', accent: 'text-blue-400' },
    { label: 'على الطريق', value: animatedInTransit, raw: stats?.inTransit || 0, icon: Route, gradient: 'from-amber-500 to-orange-400', glow: 'shadow-amber-500/30', ring: 'ring-amber-400/20', bg: 'bg-amber-500/8', color: '#F59E0B', accent: 'text-amber-400' },
    { label: 'تم التسليم', value: animatedDelivered, raw: stats?.todayDelivered || 0, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/30', ring: 'ring-emerald-400/20', bg: 'bg-emerald-500/8', color: '#10B981', accent: 'text-emerald-400' },
    { label: 'السائقون', value: animatedDrivers, raw: stats?.totalDrivers || 0, icon: Users, gradient: 'from-violet-500 to-purple-400', glow: 'shadow-violet-500/30', ring: 'ring-violet-400/20', bg: 'bg-violet-500/8', color: '#8B5CF6', accent: 'text-violet-400', sub: `${stats?.availableDrivers || 0} متاح` },
  ];

  // Secondary metrics row
  const secondaryMetrics = [
    { label: 'الإيرادات (ألف)', value: `${animatedRevenue}K`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' },
    { label: 'بانتظار الموافقة', value: animatedPending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/20', alert: (stats?.pendingShipments || 0) > 5 },
    { label: 'متأخرة', value: animatedOverdue, icon: AlertTriangle, color: (stats?.overdueCount || 0) > 0 ? 'text-destructive' : 'text-emerald-500', bg: (stats?.overdueCount || 0) > 0 ? 'bg-destructive/8' : 'bg-emerald-500/8', border: (stats?.overdueCount || 0) > 0 ? 'border-destructive/20' : 'border-emerald-500/20', alert: (stats?.overdueCount || 0) > 0 },
    { label: 'نشطة إجمالي', value: animatedActive, icon: Activity, color: 'text-primary', bg: 'bg-primary/8', border: 'border-primary/20' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
      <Card className="overflow-hidden border border-border/50 shadow-2xl bg-card relative">
        {/* Animated background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/[0.05] rounded-full blur-[100px]" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 8, repeat: Infinity }} />
          <motion.div className="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/[0.04] rounded-full blur-[80px]" animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 10, repeat: Infinity }} />
          <motion.div className="absolute top-1/2 left-1/3 w-72 h-20 bg-primary/[0.03] rounded-full blur-[60px]" animate={{ x: [-20, 20, -20] }} transition={{ duration: 12, repeat: Infinity }} />
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        <CardContent className="p-3 sm:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-3">
              {/* Live pulse indicator */}
              <div className="relative">
                <motion.div className="w-2.5 h-2.5 rounded-full bg-primary" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary/40 animate-ping" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {trend >= 0 ? (
                  <Badge className="gap-1.5 bg-primary/15 text-primary border-primary/20 backdrop-blur-sm text-xs">
                    <TrendingUp className="w-3 h-3" />
                    {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
                  </Badge>
                ) : (
                  <Badge className="gap-1.5 bg-destructive/15 text-destructive border-destructive/20 backdrop-blur-sm text-xs">
                    <TrendingDown className="w-3 h-3" />
                    {trendPercent}%
                  </Badge>
                )}
                {(stats?.overdueCount || 0) > 0 && (
                  <Badge className="gap-1 bg-destructive/15 text-destructive border-destructive/20 text-[10px] animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    {stats?.overdueCount} متأخرة
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground hidden sm:inline">مقارنة بالأمس • {stats?.weekTotal || 0} شحنة هذا الأسبوع</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 justify-end">
                  مركز القيادة والسيطرة
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                    <Gauge className="w-5 h-5 text-primary" />
                  </motion.div>
                </h2>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-primary/60 font-mono">
                    {format(now, 'hh:mm a', { locale: ar })}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {format(now, 'EEEE d MMMM', { locale: ar })}
                  </p>
                </div>
              </div>
              <motion.div
                className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Activity className="w-6 h-6 text-primary-foreground" />
                <div className="absolute -inset-1">
                  <ProgressRing progress={stats?.completionRate || 0} size={56} stroke={2} color="hsl(var(--primary))" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {primaryMetrics.map((m, index) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.08, duration: 0.5, type: 'spring', stiffness: 180 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`relative group rounded-xl sm:rounded-2xl border border-border/30 ${m.bg} backdrop-blur-md p-3 sm:p-4 ring-1 ${m.ring} transition-all duration-300 hover:shadow-xl ${m.glow} cursor-default overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex items-center justify-between mb-2">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + index * 0.1, type: 'spring' }}>
                    <Zap className={`w-3.5 h-3.5 ${m.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </motion.div>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg ${m.glow}`}>
                      <m.icon className="w-5 h-5 text-white" />
                    </div>
                    {m.raw > 0 && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-card"
                        style={{ backgroundColor: m.color }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums">{m.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">{m.label}</p>
                  {m.sub && <p className="text-[9px] text-muted-foreground/70 mt-0.5">{m.sub}</p>}
                </div>
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${m.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`} />
              </motion.div>
            ))}
          </div>

          {/* Secondary Metrics Strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            {secondaryMetrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className={`flex items-center gap-2.5 ${m.bg} rounded-xl py-2.5 px-3 border ${m.border} relative overflow-hidden`}
              >
                {m.alert && (
                  <motion.div className="absolute inset-0 bg-destructive/5" animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                )}
                <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
                <div className="flex-1 min-w-0 text-right">
                  <p className={`text-sm sm:text-base font-bold ${m.color} tabular-nums`}>{m.value}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{m.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom status bar with sparkline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-3 flex items-center gap-2 flex-wrap"
          >
            {stats && stats.todayQuantity > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-xl py-2 px-3 border border-border/30">
                <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>الكمية:</span>
                <span className="font-bold text-foreground">{stats.todayQuantity.toLocaleString('ar-SA')}</span>
                <span>طن</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-xl py-2 px-3 border border-border/30">
              <Timer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>الإنجاز:</span>
              <span className="font-bold text-foreground">{stats?.completionRate || 0}%</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-xl py-2 px-3 border border-border/30">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>بانتظار الاستلام:</span>
              <span className="font-bold text-foreground">{stats?.awaitingPickup || 0}</span>
            </div>
            {stats?.weeklySparkline && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-xl py-2 px-3 border border-border/30">
                <BarChart3 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>الأسبوع:</span>
                <MiniSparkline data={stats.weeklySparkline} color="hsl(var(--primary))" />
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-xl py-2 px-3 border border-border/30 mr-auto">
              <Fuel className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>تحديث مباشر</span>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransporterCommandCenter;
