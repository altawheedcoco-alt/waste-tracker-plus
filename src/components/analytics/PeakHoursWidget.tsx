/**
 * PeakHoursWidget — ساعات الذروة
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function PeakHoursWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['peak-hours', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('created_at')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`);
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    (shipments || []).forEach(s => {
      const h = new Date(s.created_at).getHours();
      hours[h].count += 1;
    });
    return hours;
  }, [shipments]);

  const peakHour = useMemo(() => {
    const max = chartData.reduce((a, b) => (b.count > a.count ? b : a), chartData[0]);
    return max;
  }, [chartData]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          ساعات الذروة
          {peakHour && peakHour.count > 0 && (
            <span className="text-xs text-muted-foreground mr-auto">الذروة: {peakHour.hour}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="hour" fontSize={9} interval={2} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="count" name="شحنات" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
