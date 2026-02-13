import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, Recycle, Clock, CheckCircle2, Package, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const RecyclerCommandCenter = () => {
  const { organization } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['recycler-command-center', organization?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayResult, yesterdayResult, awaitingResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('status, quantity, created_at')
          .eq('recycler_id', organization!.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('shipments')
          .select('id')
          .eq('recycler_id', organization!.id)
          .gte('created_at', yesterday.toISOString())
          .lt('created_at', today.toISOString()),
        supabase
          .from('shipments')
          .select('id')
          .eq('recycler_id', organization!.id)
          .eq('status', 'delivered'),
      ]);

      const todayData = todayResult.data || [];
      const todayQuantity = todayData.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

      return {
        todayReceived: todayData.length,
        yesterdayReceived: yesterdayResult.data?.length || 0,
        todayProcessing: todayData.filter(s => s.status === 'delivered').length,
        todayConfirmed: todayData.filter(s => s.status === 'confirmed').length,
        awaitingConfirmation: awaitingResult.data?.length || 0,
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

  const trend = stats ? stats.todayReceived - stats.yesterdayReceived : 0;
  const trendPercent = stats?.yesterdayReceived
    ? Math.round((trend / stats.yesterdayReceived) * 100)
    : 0;

  const metrics = [
    {
      label: 'واردات اليوم',
      value: stats?.todayReceived || 0,
      icon: Package,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'بانتظار التأكيد',
      value: stats?.awaitingConfirmation || 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'تم التأكيد اليوم',
      value: stats?.todayConfirmed || 0,
      icon: CheckCircle2,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'كمية اليوم (طن)',
      value: stats?.todayQuantity?.toFixed(1) || '0',
      icon: Scale,
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
            مركز القيادة - المدور
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

export default RecyclerCommandCenter;
