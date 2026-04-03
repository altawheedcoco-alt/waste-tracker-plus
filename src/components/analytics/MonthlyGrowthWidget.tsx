/**
 * MonthlyGrowthWidget — معدل النمو الشهري
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function MonthlyGrowthWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['monthly-growth', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data } = await supabase
        .from('shipments')
        .select('created_at')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString());
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!shipments) return [];
    const months: Record<string, number> = {};
    shipments.forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });

    const sorted = Object.entries(months).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([month, count], i) => {
      const prev = i > 0 ? sorted[i - 1][1] : count;
      const growth = prev > 0 ? Math.round(((count - prev) / prev) * 100) : 0;
      const label = new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short' });
      return { month: label, count, growth };
    });
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          معدل النمو الشهري
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="growth" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
