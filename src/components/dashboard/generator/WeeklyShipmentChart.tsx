import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const WeeklyShipmentChart = () => {
  const { organization } = useAuth();

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['weekly-shipments-chart', organization?.id],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: startOfDay(date).toISOString(),
          label: format(date, 'EEE', { locale: ar }),
          fullDate: format(date, 'dd/MM'),
          count: 0,
        };
      });

      const weekAgo = days[0].date;
      const { data } = await supabase
        .from('shipments')
        .select('created_at')
        .eq('generator_id', organization?.id)
        .gte('created_at', weekAgo);

      if (data) {
        data.forEach((s) => {
          const dayStr = startOfDay(new Date(s.created_at)).toISOString();
          const match = days.find((d) => d.date === dayStr);
          if (match) match.count++;
        });
      }

      return days;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...(chartData?.map((d) => d.count) || [1]), 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base justify-end">
          <BarChart3 className="w-5 h-5 text-primary" />
          نشاط الشحنات - آخر 7 أيام
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-right">
                      <p className="text-xs text-muted-foreground">{d.fullDate}</p>
                      <p className="font-bold text-sm">{d.count} شحنة</p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyShipmentChart;
