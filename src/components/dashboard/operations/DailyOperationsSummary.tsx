import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Package, Truck, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useEffect } from 'react';

interface DailyStats {
  todayShipments: number;
  yesterdayShipments: number;
  todayDelivered: number;
  todayPending: number;
  todayInTransit: number;
  todayNewRequests: number;
}

const DailyOperationsSummary = () => {
  const { organization } = useAuth();
  const orgType = organization?.organization_type;
  const queryClient = useQueryClient();
  const queryKey = ['daily-operations', organization?.id];

  const { data: stats, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<DailyStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const orgField = orgType === 'generator' ? 'generator_id'
        : orgType === 'recycler' ? 'recycler_id'
        : 'transporter_id';

      const [todayResult, yesterdayResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('status, created_at')
          .eq(orgField, organization!.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('shipments')
          .select('id')
          .eq(orgField, organization!.id)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),
      ]);

      const todayData = todayResult.data || [];
      return {
        todayShipments: todayData.length,
        yesterdayShipments: yesterdayResult.data?.length || 0,
        todayDelivered: todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length,
        todayPending: todayData.filter(s => s.status === 'new' || s.status === 'approved').length,
        todayInTransit: todayData.filter(s => s.status === 'in_transit' || s.status === 'collecting').length,
        todayNewRequests: todayData.filter(s => s.status === 'new').length,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  // Realtime: invalidate on shipment changes
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('daily-ops-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
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

  const metrics = [
    {
      label: 'شحنات اليوم',
      value: stats?.todayShipments || 0,
      icon: Package,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'قيد النقل',
      value: stats?.todayInTransit || 0,
      icon: Truck,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'تم التسليم',
      value: stats?.todayDelivered || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'معلّقة',
      value: stats?.todayPending || 0,
      icon: Clock,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    },
  ];

  return (
    <Card className="overflow-hidden border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {trend >= 0 ? (
              <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                <TrendingUp className="w-3 h-3" />
                {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 border-0">
                <TrendingDown className="w-3 h-3" />
                {trendPercent}%
              </Badge>
            )}
          </div>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            ملخص عمليات اليوم
            <span className="text-xs text-muted-foreground font-normal">
              {format(new Date(), 'EEEE d MMMM', { locale: ar })}
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m, idx) => (
            <div
              key={m.label}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-gradient-to-br from-card to-muted/20 hover:shadow-md transition-all duration-300 group"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.color} group-hover:scale-110 transition-transform duration-300`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                <p className="text-[11px] text-muted-foreground truncate">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyOperationsSummary;
