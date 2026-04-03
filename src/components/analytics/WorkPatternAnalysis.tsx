/**
 * WorkPatternAnalysis — تحليل أنماط العمل
 * يعرض أوقات الذروة وتوزيع النشاط حسب أيام الأسبوع والساعات
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const HOURS_LABELS = ['12ص', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12م', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export default function WorkPatternAnalysis() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['work-pattern', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('created_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .gte('created_at', threeMonthsAgo.toISOString());

      // Build heatmap: day x hour
      const grid: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
      const dayTotals = Array(7).fill(0);
      const hourTotals = Array(24).fill(0);

      (shipments || []).forEach(s => {
        const d = new Date(s.created_at);
        const day = d.getDay();
        const hour = d.getHours();
        grid[day][hour]++;
        dayTotals[day]++;
        hourTotals[hour]++;
      });

      const maxVal = Math.max(...grid.flat(), 1);
      const peakDay = dayTotals.indexOf(Math.max(...dayTotals));
      const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
      const total = (shipments || []).length;

      return { grid, dayTotals, hourTotals, maxVal, peakDay, peakHour, total };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const getIntensity = (val: number) => {
    if (!data || val === 0) return 'bg-muted/30';
    const ratio = val / data.maxVal;
    if (ratio <= 0.2) return 'bg-primary/10';
    if (ratio <= 0.4) return 'bg-primary/25';
    if (ratio <= 0.6) return 'bg-primary/40';
    if (ratio <= 0.8) return 'bg-primary/60';
    return 'bg-primary/80';
  };

  // Show only business hours (6am-10pm) for cleaner view
  const hourRange = useMemo(() => {
    const hours: number[] = [];
    for (let h = 6; h <= 22; h++) hours.push(h);
    return hours;
  }, []);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            أنماط العمل
          </CardTitle>
          {data && data.total > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                ذروة: {DAYS_AR[data.peakDay]}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                أنشط ساعة: {data.peakHour}:00
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : !data || data.total === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
            لا توجد بيانات كافية لتحليل الأنماط
          </div>
        ) : (
          <>
            {/* Day x Hour heatmap */}
            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Hour labels */}
                <div className="flex items-center gap-0 mr-16 mb-1">
                  {hourRange.map(h => (
                    <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">
                      {h % 3 === 0 ? HOURS_LABELS[h] : ''}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <div key={day} className="flex items-center gap-0 mb-[2px]">
                    <span className="w-16 text-[10px] text-muted-foreground text-right pl-2 shrink-0">
                      {DAYS_AR[day]}
                    </span>
                    <div className="flex-1 flex gap-[1px]">
                      {hourRange.map(h => (
                        <div
                          key={h}
                          className={`flex-1 h-5 rounded-[2px] ${getIntensity(data.grid[day][h])} transition-colors`}
                          title={`${DAYS_AR[day]} ${h}:00 — ${data.grid[day][h]} نشاط`}
                        />
                      ))}
                    </div>
                    <span className="w-8 text-[9px] text-muted-foreground text-center shrink-0">
                      {data.dayTotals[day]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day summary bar */}
            <div className="mt-4 flex items-end gap-1 h-12">
              {data.dayTotals.map((count, idx) => {
                const maxDay = Math.max(...data.dayTotals, 1);
                const heightPct = (count / maxDay) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-t bg-primary/60 transition-all duration-500"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <span className="text-[8px] text-muted-foreground">{DAYS_AR[idx].slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-muted-foreground">أقل</span>
              {['bg-muted/30', 'bg-primary/10', 'bg-primary/25', 'bg-primary/40', 'bg-primary/60', 'bg-primary/80'].map((cls, i) => (
                <div key={i} className={`w-3 h-3 rounded-[2px] ${cls}`} />
              ))}
              <span className="text-[10px] text-muted-foreground">أكثر</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
