import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Truck, Clock, CheckCircle2, Users, Route } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TransporterCommandCenter = () => {
  const { organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['transporter-command-center', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayResult = await supabase
        .from('shipments')
        .select('status, quantity, created_at')
        .eq('transporter_id', organization!.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const yesterdayResult = await supabase
        .from('shipments')
        .select('id')
        .eq('transporter_id', organization!.id)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      const activeResult = await supabase
        .from('shipments')
        .select('id')
        .eq('transporter_id', organization!.id)
        .in('status', ['in_transit', 'approved']);

      const driversResult = await supabase
        .from('drivers')
        .select('id')
        .eq('organization_id', organization!.id);

      const todayData = todayResult.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

      return {
        todayTrips: todayData.length,
        yesterdayTrips: yesterdayResult.data?.length || 0,
        activeShipments: activeResult.data?.length || 0,
        todayDelivered: todayData.filter(s => s.status === 'delivered' || s.status === 'confirmed').length,
        activeDrivers: driversResult.data?.length || 0,
        todayQuantity,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 60000,
  });

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

  const trend = stats ? stats.todayTrips - stats.yesterdayTrips : 0;
  const trendPercent = stats?.yesterdayTrips
    ? Math.round((trend / stats.yesterdayTrips) * 100)
    : 0;

  const metrics = [
    {
      label: 'رحلات اليوم',
      value: stats?.todayTrips || 0,
      icon: Truck,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'شحنات نشطة',
      value: stats?.activeShipments || 0,
      icon: Route,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'تم التسليم اليوم',
      value: stats?.todayDelivered || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'سائقين نشطين',
      value: stats?.activeDrivers || 0,
      icon: Users,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
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
            مركز القيادة - الناقل
            <span className="text-xs text-muted-foreground font-normal">
              {format(new Date(), 'EEEE d MMMM', { locale: ar })}
            </span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-2xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground truncate">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransporterCommandCenter;
