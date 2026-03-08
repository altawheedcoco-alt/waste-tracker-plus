import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CalendarDays, TrendingUp } from 'lucide-react';
import { AnalyticsData } from '@/hooks/useVisitorAnalyticsData';

interface Props {
  analytics: AnalyticsData;
}

const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const HeatBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
  const intensity = max > 0 ? value / max : 0;
  return (
    <div
      className={`rounded h-6 flex items-center justify-center text-[9px] font-bold transition-colors ${value > 0 ? 'text-white' : 'text-muted-foreground'}`}
      style={{ backgroundColor: value > 0 ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})` : 'hsl(var(--muted))' }}
    >
      {value > 0 ? value : ''}
    </div>
  );
};

const VisitorTemporalTab = ({ analytics }: Props) => {
  const maxHourly = Math.max(...analytics.hourlyDistribution, 1);
  const maxDaily = Math.max(...analytics.dailyDistribution, 1);
  const maxTrend = Math.max(...analytics.weeklyTrend.map(w => w.count), 1);

  return (
    <div className="space-y-4">
      {/* Trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> اتجاه الزيارات (آخر 14 يوم)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {analytics.weeklyTrend.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[8px] text-muted-foreground">{day.count || ''}</span>
                <div
                  className="w-full bg-primary/80 rounded-t transition-all min-h-[2px]"
                  style={{ height: `${maxTrend ? (day.count / maxTrend) * 100 : 0}%` }}
                />
                <span className="text-[7px] text-muted-foreground" dir="ltr">
                  {day.date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Hourly distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> التوزيع بالساعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-1">
              {analytics.hourlyDistribution.map((count, hour) => (
                <div key={hour} className="text-center">
                  <span className="text-[8px] text-muted-foreground block mb-0.5">{hour}:00</span>
                  <HeatBar value={count} max={maxHourly} color="primary" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>🌙 أقل نشاطاً</span>
              <span>☀️ أكثر نشاطاً</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> التوزيع بالأيام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayNames.map((name, i) => {
                const count = analytics.dailyDistribution[i];
                return (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs w-16 shrink-0">{name}</span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${maxDaily ? (count / maxDaily) * 100 : 0}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="text-[10px] min-w-[28px] justify-center">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xl font-black text-primary">{analytics.todayVisits}</p>
              <p className="text-[10px] text-muted-foreground">زيارات اليوم</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xl font-black text-primary">{analytics.thisWeekVisits}</p>
              <p className="text-[10px] text-muted-foreground">زيارات الأسبوع</p>
            </div>
            <div className="p-3 bg-muted/40 rounded-lg">
              <p className="text-xl font-black text-primary">{analytics.total}</p>
              <p className="text-[10px] text-muted-foreground">إجمالي مُسجَّل</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorTemporalTab;
