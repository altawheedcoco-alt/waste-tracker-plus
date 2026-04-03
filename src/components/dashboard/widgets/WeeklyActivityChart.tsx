import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const WeeklyActivityChart = () => {
  const { organization } = useAuth();

  const { data: chartData = [] } = useQuery({
    queryKey: ['weekly-activity', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const now = new Date();
      const days: { day: string; count: number; date: string }[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('ar-EG', { weekday: 'short' });

        const { count } = await supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('generator_id', organization!.id)
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);

        days.push({ day: dayName, count: count || 0, date: dateStr });
      }
      return days;
    },
    staleTime: 5 * 60 * 1000,
  });

  const total = chartData.reduce((s, d) => s + d.count, 0);
  const prevWeekAvg = total / 7;
  const todayCount = chartData[chartData.length - 1]?.count || 0;
  const trend = todayCount > prevWeekAvg ? 'up' : todayCount < prevWeekAvg ? 'down' : 'neutral';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            النشاط الأسبوعي
          </CardTitle>
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />}
            {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
            {trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className="font-semibold">{total} شحنة</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [`${v} شحنة`, 'العدد']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={index === chartData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyActivityChart;
