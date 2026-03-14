import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, BarChart3, Clock,
  Package, DollarSign, CheckCircle2, XCircle, Loader2,
  ArrowUp, ArrowDown, Minus,
} from 'lucide-react';

const MyStatsTab = () => {
  const { user, organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-stats-detailed', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return null;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      // This month shipments
      const { count: thisMonthShipments } = await (supabase.from('shipments') as any)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .gte('created_at', thisMonthStart);

      // Last month shipments
      const { count: lastMonthShipments } = await (supabase.from('shipments') as any)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      // Delivered this month
      const { count: deliveredThisMonth } = await (supabase.from('shipments') as any)
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'delivered')
        .gte('created_at', thisMonthStart);

      // My actions this month
      const { count: myActionsThisMonth } = await supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thisMonthStart);

      // My actions last month
      const { count: myActionsLastMonth } = await supabase
        .from('activity_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      // Deposits this month
      const { data: depositsData } = await supabase
        .from('deposits')
        .select('amount')
        .eq('organization_id', organization.id)
        .gte('created_at', thisMonthStart);

      const totalDeposits = (depositsData || []).reduce((sum, d) => sum + (d.amount || 0), 0);

      // Weekly activity (last 7 days)
      const weeklyActivity: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { count } = await supabase
          .from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        weeklyActivity.push(count || 0);
      }

      return {
        thisMonthShipments: thisMonthShipments || 0,
        lastMonthShipments: lastMonthShipments || 0,
        deliveredThisMonth: deliveredThisMonth || 0,
        myActionsThisMonth: myActionsThisMonth || 0,
        myActionsLastMonth: myActionsLastMonth || 0,
        totalDeposits,
        weeklyActivity,
      };
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const shipmentChange = stats.lastMonthShipments > 0
    ? Math.round(((stats.thisMonthShipments - stats.lastMonthShipments) / stats.lastMonthShipments) * 100)
    : stats.thisMonthShipments > 0 ? 100 : 0;

  const actionsChange = stats.myActionsLastMonth > 0
    ? Math.round(((stats.myActionsThisMonth - stats.myActionsLastMonth) / stats.myActionsLastMonth) * 100)
    : stats.myActionsThisMonth > 0 ? 100 : 0;

  const TrendIcon = (change: number) => change > 0 ? ArrowUp : change < 0 ? ArrowDown : Minus;
  const trendColor = (change: number) => change > 0 ? 'text-emerald-600' : change < 0 ? 'text-destructive' : 'text-muted-foreground';

  const kpis = [
    {
      title: 'شحنات هذا الشهر',
      value: stats.thisMonthShipments,
      change: shipmentChange,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'شحنات تم تسليمها',
      value: stats.deliveredThisMonth,
      change: null,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'إجراءاتي هذا الشهر',
      value: stats.myActionsThisMonth,
      change: actionsChange,
      icon: Activity,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'إجمالي الإيداعات',
      value: `${stats.totalDeposits.toLocaleString()}`,
      suffix: 'ج.م',
      change: null,
      icon: DollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
  ];

  const maxActivity = Math.max(...stats.weeklyActivity, 1);
  const dayLabels = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const todayIndex = new Date().getDay();

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const Trend = kpi.change !== null ? TrendIcon(kpi.change) : null;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="border-border/30 h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                    {kpi.change !== null && Trend && (
                      <div className={`flex items-center gap-0.5 text-xs font-semibold ${trendColor(kpi.change)}`}>
                        <Trend className="w-3 h-3" />
                        {Math.abs(kpi.change)}%
                      </div>
                    )}
                  </div>
                  <p className="text-xl font-bold">
                    {kpi.value}
                    {kpi.suffix && <span className="text-xs text-muted-foreground mr-1">{kpi.suffix}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly Activity Chart */}
      <Card className="border-border/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-primary" />
            نشاطك خلال الأسبوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {stats.weeklyActivity.map((count, i) => {
              const height = (count / maxActivity) * 100;
              const dayIndex = (todayIndex - 6 + i + 7) % 7;
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">{count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 4)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                    className={`w-full rounded-t-md min-h-[4px] ${
                      isToday
                        ? 'bg-gradient-to-t from-primary to-primary/60'
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                  <span className={`text-[9px] ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {dayLabels[dayIndex]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm">ملخص الأداء</h4>
              <p className="text-[10px] text-muted-foreground">مقارنة بالشهر السابق</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border/30">
              <p className="text-[10px] text-muted-foreground mb-1">معدل التسليم</p>
              <p className="text-lg font-bold">
                {stats.thisMonthShipments > 0
                  ? `${Math.round((stats.deliveredThisMonth / stats.thisMonthShipments) * 100)}%`
                  : '—'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/30">
              <p className="text-[10px] text-muted-foreground mb-1">متوسط النشاط اليومي</p>
              <p className="text-lg font-bold">
                {Math.round(stats.weeklyActivity.reduce((a, b) => a + b, 0) / 7)}
                <span className="text-xs text-muted-foreground mr-1">إجراء</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyStatsTab;
