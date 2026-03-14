import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Package, Truck, CheckCircle2, Clock, Recycle, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AdminDailyStats {
  todayShipments: number;
  yesterdayShipments: number;
  todayDelivered: number;
  todayPending: number;
  todayInTransit: number;
  todayNewRequests: number;
  todayNewOrgs: number;
}

const AdminDailyOperationsSummary = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-daily-operations'],
    queryFn: async (): Promise<AdminDailyStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayResult, yesterdayResult, newOrgsResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('status, created_at')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('shipments')
          .select('id')
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),
        supabase
          .from('organizations')
          .select('id')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
      ]);

      const todayData = todayResult.data || [];
      return {
        todayShipments: todayData.length,
        yesterdayShipments: yesterdayResult.data?.length || 0,
        todayDelivered: todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length,
        todayPending: todayData.filter(s => s.status === 'new' || s.status === 'approved').length,
        todayInTransit: todayData.filter(s => s.status === 'in_transit' || s.status === 'collecting').length,
        todayNewRequests: todayData.filter(s => s.status === 'new').length,
        todayNewOrgs: newOrgsResult.data?.length || 0,
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted rounded" />)}
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
    { label: 'شحنات اليوم', value: stats?.todayShipments || 0, icon: Package, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'قيد النقل', value: stats?.todayInTransit || 0, icon: Truck, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    { label: 'تم التسليم', value: stats?.todayDelivered || 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'معلّقة', value: stats?.todayPending || 0, icon: Clock, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
    { label: 'جهات جديدة', value: stats?.todayNewOrgs || 0, icon: Building2, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {trend >= 0 ? (
              <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="w-3 h-3" />
                {trendPercent > 0 ? `+${trendPercent}%` : 'مستقر'}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 text-red-700 bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="w-3 h-3" />
                {trendPercent}%
              </Badge>
            )}
          </div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="w-5 h-5 text-primary" />
            ملخص عمليات اليوم — كل الجهات
            <span className="text-xs text-muted-foreground font-normal">
              {format(new Date(), 'EEEE d MMMM', { locale: ar })}
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
                <m.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-lg sm:text-2xl font-bold">{m.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDailyOperationsSummary;
