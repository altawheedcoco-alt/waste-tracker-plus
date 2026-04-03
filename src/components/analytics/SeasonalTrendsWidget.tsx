/**
 * SeasonalTrendsWidget — الاتجاهات الموسمية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function SeasonalTrendsWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['seasonal-trends', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const { data } = await supabase
        .from('shipments')
        .select('created_at, actual_weight, total_value')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', oneYearAgo.toISOString());
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!shipments) return [];
    const months: Record<string, { count: number; weight: number; revenue: number }> = {};
    shipments.forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { count: 0, weight: 0, revenue: 0 };
      months[key].count += 1;
      months[key].weight += Number(s.actual_weight) || 0;
      months[key].revenue += Number(s.total_value) || 0;
    });
    return Object.entries(months).sort().map(([m, v]) => ({
      month: new Date(m + '-01').toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' }),
      شحنات: v.count,
      وزن: Math.round(v.weight),
      إيرادات: Math.round(v.revenue),
    }));
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary" />
          الاتجاهات الموسمية (12 شهر)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <XAxis dataKey="month" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Area type="monotone" dataKey="شحنات" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              <Area type="monotone" dataKey="وزن" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
