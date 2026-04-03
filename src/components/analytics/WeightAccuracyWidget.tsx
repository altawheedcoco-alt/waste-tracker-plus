/**
 * WeightAccuracyWidget — دقة الأوزان (المقدر vs الفعلي)
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Scale } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function WeightAccuracyWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['weight-accuracy', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('quantity, actual_weight')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .not('actual_weight', 'is', null)
        .not('quantity', 'is', null)
        .gt('actual_weight', 0)
        .gt('quantity', 0)
        .limit(200);
      return data || [];
    },
  });

  const { chartData, accuracy } = useMemo(() => {
    if (!shipments || shipments.length === 0) return { chartData: [], accuracy: 0 };
    const cd = shipments.map(s => ({
      estimated: Number(s.quantity),
      actual: Number(s.actual_weight),
    }));
    const totalDev = cd.reduce((s, d) => s + Math.abs(d.estimated - d.actual) / Math.max(d.actual, 1), 0);
    const acc = Math.max(0, Math.round((1 - totalDev / cd.length) * 100));
    return { chartData: cd, accuracy: acc };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-5 w-5 text-primary" />
          دقة تقدير الأوزان
          <span className="mr-auto text-sm font-bold text-primary">{accuracy}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات أوزان</p>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground mb-2">كل نقطة = شحنة (المحور X = المقدر، Y = الفعلي)</p>
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <XAxis dataKey="estimated" name="المقدر" fontSize={10} unit=" كجم" />
                <YAxis dataKey="actual" name="الفعلي" fontSize={10} unit=" كجم" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 50000, y: 50000 }]} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                <Scatter data={chartData} fill="hsl(var(--primary))" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
