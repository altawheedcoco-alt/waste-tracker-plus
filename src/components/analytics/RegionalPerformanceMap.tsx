/**
 * RegionalPerformanceMap — أداء المناطق الجغرافية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function RegionalPerformanceMap() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['regional-perf', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('pickup_city, delivery_city, total_value, actual_weight')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .limit(500);
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!shipments) return [];
    const cities: Record<string, { shipments: number; revenue: number; weight: number }> = {};
    shipments.forEach(s => {
      [s.pickup_city, s.delivery_city].filter(Boolean).forEach(city => {
        if (!city) return;
        if (!cities[city]) cities[city] = { shipments: 0, revenue: 0, weight: 0 };
        cities[city].shipments += 1;
        cities[city].revenue += Number(s.total_value) || 0;
        cities[city].weight += Number(s.actual_weight) || 0;
      });
    });
    return Object.entries(cities)
      .map(([city, stats]) => ({ city, ...stats, revenue: Math.round(stats.revenue) }))
      .sort((a, b) => b.shipments - a.shipments)
      .slice(0, 8);
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          أداء المناطق الجغرافية
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" fontSize={10} />
              <YAxis type="category" dataKey="city" fontSize={11} width={70} />
              <Tooltip formatter={(v: number, name: string) => [name === 'shipments' ? `${v} شحنة` : `${v.toLocaleString('ar-EG')} ج.م`, name === 'shipments' ? 'الشحنات' : 'الإيرادات']} />
              <Bar dataKey="shipments" name="الشحنات" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
