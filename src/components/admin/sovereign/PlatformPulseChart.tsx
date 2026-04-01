/**
 * نبض المنصة — رسم بياني مصغر يعرض نشاط الشحنات خلال آخر 7 أيام
 */
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PlatformPulseChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['platform-pulse-7d'],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return {
          date: format(d, 'yyyy-MM-dd'),
          label: format(d, 'EEE', { locale: ar }),
          start: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(),
          end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).toISOString(),
        };
      });

      const results = await Promise.all(
        days.map(async (day) => {
          const { count } = await supabase
            .from('shipments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', day.start)
            .lte('created_at', day.end);
          return { name: day.label, value: count || 0 };
        })
      );

      return results;
    },
    refetchInterval: 60_000,
  });

  if (isLoading || !chartData) {
    return <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />;
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);
  const avg = Math.round(total / 7);

  return (
    <Card className="border-border/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold">نبض المنصة</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">المعدل: {avg}/يوم</span>
            <span className="text-[10px] font-bold text-primary">{total} شحنة</span>
          </div>
        </div>
        <div className="h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{ fontSize: '10px', borderRadius: '8px', direction: 'rtl' }}
                formatter={(value: number) => [`${value} شحنة`, 'العدد']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#pulseGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-1">
          {chartData.map((d, i) => (
            <span key={i} className="text-[8px] text-muted-foreground">{d.name}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformPulseChart;
