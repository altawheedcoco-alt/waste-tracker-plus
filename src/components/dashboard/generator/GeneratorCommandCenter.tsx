import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, TrendingUp, TrendingDown, Package, Clock,
  CheckCircle2, Truck, FileText, Weight, AlertTriangle,
  RefreshCw, Activity, ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Animated number counter
const AnimatedNumber = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prev.current = end;
  }, [value]);

  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</>;
};

const GeneratorCommandCenter = () => {
  const { organization } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['generator-command-center', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayResult, yesterdayResult, pendingResult, allActiveResult, receiptsResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('status, quantity, created_at')
          .eq('generator_id', organization!.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('shipments')
          .select('id, quantity')
          .eq('generator_id', organization!.id)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),
        supabase
          .from('shipments')
          .select('id')
          .eq('generator_id', organization!.id)
          .in('status', ['new', 'approved']),
        supabase
          .from('shipments')
          .select('id')
          .eq('generator_id', organization!.id)
          .in('status', ['collecting', 'in_transit']),
        supabase
          .from('shipment_receipts')
          .select('id')
          .eq('generator_id', organization!.id)
          .in('transporter_approval_status', ['pending']),
      ]);

      const todayData = todayResult.data || [];
      const yesterdayData = yesterdayResult.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const yesterdayQuantity = yesterdayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const todayCompleted = todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length;

      setLastUpdated(new Date());

      return {
        todayShipments: todayData.length,
        yesterdayShipments: yesterdayData.length,
        todayInTransit: todayData.filter(s => s.status === 'in_transit').length,
        todayCompleted,
        pendingApproval: pendingResult.data?.length || 0,
        activeTrips: allActiveResult.data?.length || 0,
        pendingCertificates: receiptsResult.data?.length || 0,
        todayQuantity,
        yesterdayQuantity,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 60000,
  });

  // Realtime subscription for instant updates
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('generator-command-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shipments',
        filter: `generator_id=eq.${organization.id}`,
      }, () => {
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3 mr-auto" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = stats ? stats.todayShipments - stats.yesterdayShipments : 0;
  const trendPercent = stats?.yesterdayShipments
    ? Math.round((trend / stats.yesterdayShipments) * 100)
    : 0;

  const qtyTrend = stats ? stats.todayQuantity - stats.yesterdayQuantity : 0;

  // Completion rate for today
  const completionRate = stats && stats.todayShipments > 0
    ? Math.round((stats.todayCompleted / stats.todayShipments) * 100)
    : 0;

  const metrics = [
    {
      label: 'شحنات اليوم',
      value: stats?.todayShipments || 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      trend: trend,
      trendLabel: trend >= 0 ? `+${trend} عن أمس` : `${trend} عن أمس`,
      link: '/dashboard/shipments',
    },
    {
      label: 'بانتظار الموافقة',
      value: stats?.pendingApproval || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      alert: (stats?.pendingApproval || 0) > 5,
      link: '/dashboard/shipments?status=pending',
    },
    {
      label: 'رحلات نشطة',
      value: stats?.activeTrips || 0,
      icon: Truck,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      pulse: (stats?.activeTrips || 0) > 0,
      link: '/dashboard/shipments?status=in_transit',
    },
    {
      label: 'مكتملة اليوم',
      value: stats?.todayCompleted || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      link: '/dashboard/shipments?status=completed',
    },
    {
      label: 'كمية اليوم (طن)',
      value: stats?.todayQuantity || 0,
      decimals: 1,
      icon: Weight,
      color: 'text-teal-600',
      bg: 'bg-teal-100 dark:bg-teal-900/30',
      trend: qtyTrend,
      trendLabel: qtyTrend >= 0 ? `+${qtyTrend.toFixed(1)}` : `${qtyTrend.toFixed(1)}`,
      link: '/dashboard/shipments',
    },
    {
      label: 'شهادات معلّقة',
      value: stats?.pendingCertificates || 0,
      icon: FileText,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      alert: (stats?.pendingCertificates || 0) > 0,
      link: '/dashboard/receipts',
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Left: trend + refresh */}
          <div className="flex items-center gap-2">
            {trend >= 0 ? (
              <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
                {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                <TrendingDown className="w-3 h-3" />
                {trendPercent}%
              </Badge>
            )}
            <button
              onClick={() => refetch()}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="تحديث"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isFetching && "animate-spin")} />
            </button>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              آخر تحديث: {format(lastUpdated, 'hh:mm:ss a')}
            </span>
          </div>

          {/* Right: title */}
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-primary" />
            مركز القيادة
            <span className="text-xs text-muted-foreground font-normal">
              {format(new Date(), 'EEEE d MMMM', { locale: ar })}
            </span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <AnimatePresence mode="popLayout">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => m.link && navigate(m.link)}
                className={cn(
                  "relative flex flex-col gap-1 p-3 rounded-lg border bg-card transition-shadow hover:shadow-md cursor-pointer",
                  m.alert && "border-orange-300 dark:border-orange-700"
                )}
              >
                {/* Pulse indicator for active trips */}
                {m.pulse && (
                  <span className="absolute top-2 left-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                  </span>
                )}

                {/* Alert indicator */}
                {m.alert && (
                  <span className="absolute top-2 left-2">
                    <AlertTriangle className="w-3 h-3 text-orange-500 animate-pulse" />
                  </span>
                )}

                <div className="flex items-center justify-end gap-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.bg)}>
                    <m.icon className={cn("w-4 h-4", m.color)} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums">
                    <AnimatedNumber value={typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0} decimals={m.decimals} />
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
                </div>
                {m.trendLabel && (
                  <div className={cn(
                    "text-[10px] font-medium flex items-center justify-end gap-0.5",
                    (m.trend ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
                  )}>
                    <ArrowUpRight className={cn("w-2.5 h-2.5", (m.trend ?? 0) < 0 && "rotate-90")} />
                    {m.trendLabel}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Completion Progress */}
        {stats && stats.todayShipments > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50"
          >
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              نسبة الإنجاز اليوم
            </span>
            <Progress value={completionRate} className="flex-1 h-2" />
            <span className="text-xs font-bold text-primary tabular-nums">{completionRate}%</span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneratorCommandCenter;
