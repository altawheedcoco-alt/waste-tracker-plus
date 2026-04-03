/**
 * DemandForecastWidget — توقع الطلب المستقبلي
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function DemandForecastWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['demand-forecast', orgId],
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
      const key = s.created_at.substring(0, 7);
      months[key] = (months[key] || 0) + 1;
    });

    const sorted = Object.entries(months).sort();
    const actual = sorted.map(([m, c]) => ({
      month: new Date(m + '-01').toLocaleDateString('ar-EG', { month: 'short' }),
      فعلي: c,
      متوقع: null as number | null,
    }));

    // Simple linear forecast for 3 months
    if (sorted.length >= 2) {
      const vals = sorted.map(([, c]) => c);
      const trend = (vals[vals.length - 1] - vals[0]) / Math.max(vals.length - 1, 1);
      const last = vals[vals.length - 1];
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        actual.push({
          month: futureDate.toLocaleDateString('ar-EG', { month: 'short' }),
          فعلي: null as any,
          متوقع: Math.max(0, Math.round(last + trend * i)),
        });
      }
    }

    return actual;
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          توقع الطلب المستقبلي (AI)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="فعلي" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              <Line type="monotone" dataKey="متوقع" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" dot />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
