import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Recycle, Clock, CheckCircle2,
  Package, Scale, RefreshCw, ArrowUpRight, AlertTriangle, Factory,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AnimatedNumber = ({ value, decimals = 0 }: { value: number; decimals?: number }) => {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 700;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prev.current = end;
  }, [value]);
  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</>;
};

const RecyclerCommandCenter = () => {
  const { organization } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['recycler-command-center', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayResult, yesterdayResult, awaitingResult, processingResult] = await Promise.all([
        supabase.from('shipments').select('status, quantity, created_at').eq('recycler_id', organization!.id).gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString()),
        supabase.from('shipments').select('id').eq('recycler_id', organization!.id).gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()),
        supabase.from('shipments').select('id').eq('recycler_id', organization!.id).eq('status', 'delivered'),
        supabase.from('shipments').select('id').eq('recycler_id', organization!.id).in('status', ['in_transit', 'collecting']),
      ]);

      const todayData = todayResult.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
      const todayConfirmed = todayData.filter(s => s.status === 'confirmed').length;

      setLastUpdated(new Date());

      return {
        todayReceived: todayData.length,
        yesterdayReceived: yesterdayResult.data?.length || 0,
        todayConfirmed,
        awaitingConfirmation: awaitingResult.data?.length || 0,
        inTransit: processingResult.data?.length || 0,
        todayQuantity,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('recycler-command-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `recycler_id=eq.${organization.id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, refetch]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-muted rounded w-1/3 mr-auto" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = stats ? stats.todayReceived - stats.yesterdayReceived : 0;
  const trendPercent = stats?.yesterdayReceived ? Math.round((trend / stats.yesterdayReceived) * 100) : 0;
  const processRate = stats && stats.todayReceived > 0 ? Math.round((stats.todayConfirmed / stats.todayReceived) * 100) : 0;

  const metrics = [
    { label: 'واردات اليوم', value: stats?.todayReceived || 0, icon: Package, gradient: 'from-emerald-500 to-teal-500', trend, trendLabel: trend >= 0 ? `+${trend}` : `${trend}`, link: '/dashboard/shipments' },
    { label: 'في الطريق', value: stats?.inTransit || 0, icon: Package, gradient: 'from-blue-500 to-indigo-500', pulse: (stats?.inTransit || 0) > 0, link: '/dashboard/tracking-center' },
    { label: 'بانتظار التأكيد', value: stats?.awaitingConfirmation || 0, icon: Clock, gradient: 'from-amber-500 to-orange-500', alert: (stats?.awaitingConfirmation || 0) > 3, link: '/dashboard/shipments' },
    { label: 'تم التأكيد اليوم', value: stats?.todayConfirmed || 0, icon: CheckCircle2, gradient: 'from-green-500 to-emerald-600', link: '/dashboard/shipments' },
    { label: 'كمية اليوم (طن)', value: stats?.todayQuantity || 0, decimals: 1, icon: Scale, gradient: 'from-purple-500 to-violet-600', link: '/dashboard/shipments' },
  ];

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-emerald-500/[0.03]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-gradient-to-l from-emerald-500/5 via-transparent to-transparent">
        <div className="flex items-center gap-2">
          {trend >= 0 ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-500/20">
              <TrendingUp className="w-3 h-3" /> {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
            </Badge>
          ) : (
            <Badge className="gap-1 bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-500/20">
              <TrendingDown className="w-3 h-3" /> {trendPercent}%
            </Badge>
          )}
          <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors">
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isFetching && "animate-spin")} />
          </button>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{format(lastUpdated, 'hh:mm a')}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Factory className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-sm">مركز قيادة المصنع</h3>
            <p className="text-[10px] text-muted-foreground">{format(new Date(), 'EEEE d MMMM', { locale: ar })}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <AnimatePresence mode="popLayout">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.35, type: 'spring', stiffness: 200 }}
                onClick={() => m.link && navigate(m.link)}
                className={cn(
                  "group relative flex flex-col gap-1.5 p-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm",
                  "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-400/30 cursor-pointer",
                  m.alert && "border-orange-300/70 dark:border-orange-700/50"
                )}
              >
                {m.pulse && (
                  <span className="absolute top-2 left-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                )}
                {m.alert && (
                  <span className="absolute top-2 left-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  </span>
                )}
                <div className="flex items-center justify-end">
                  <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", m.gradient)}>
                    <m.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold tabular-nums tracking-tight">
                    <AnimatedNumber value={typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0} decimals={m.decimals} />
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight font-medium">{m.label}</p>
                </div>
                {m.trendLabel && (
                  <div className={cn("text-[10px] font-semibold flex items-center justify-end gap-0.5", (m.trend ?? 0) >= 0 ? "text-emerald-600" : "text-red-500")}>
                    <ArrowUpRight className={cn("w-2.5 h-2.5", (m.trend ?? 0) < 0 && "rotate-90")} />
                    {m.trendLabel}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {stats && stats.todayReceived > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-l from-emerald-500/5 to-transparent border border-border/30">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">معدل المعالجة</span>
            <Progress value={processRate} className="flex-1 h-2.5" />
            <span className="text-xs font-bold text-emerald-600 tabular-nums min-w-[3ch]">{processRate}%</span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecyclerCommandCenter;
