/**
 * ActivityHeatmap — خريطة حرارية للنشاط اليومي (على طراز GitHub)
 * تعرض كثافة النشاط على مدار الأشهر الماضية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const LEVELS = [
  'bg-muted/40',
  'bg-emerald-200 dark:bg-emerald-900/50',
  'bg-emerald-400 dark:bg-emerald-700/70',
  'bg-emerald-600 dark:bg-emerald-500',
  'bg-emerald-800 dark:bg-emerald-400',
];

export default function ActivityHeatmap() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data } = useQuery({
    queryKey: ['activity-heatmap', orgId],
    queryFn: async () => {
      if (!orgId) return new Map<string, number>();

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('created_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString());

      const dayMap = new Map<string, number>();
      (shipments || []).forEach(s => {
        const key = s.created_at.slice(0, 10);
        dayMap.set(key, (dayMap.get(key) || 0) + 1);
      });
      return dayMap;
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const { weeks, totalActivity, maxCount, monthLabels } = useMemo(() => {
    const dayMap = data || new Map<string, number>();
    const now = new Date();
    const weeks: Array<Array<{ date: string; count: number; day: number }>> = [];
    let currentWeek: Array<{ date: string; count: number; day: number }> = [];
    let total = 0;
    let max = 0;
    const months = new Map<number, string>();

    // Go back ~26 weeks
    const start = new Date(now);
    start.setDate(start.getDate() - 182);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const count = dayMap.get(key) || 0;
      total += count;
      if (count > max) max = count;

      if (d.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      // Track month transitions
      if (d.getDate() <= 7 && d.getDay() === 0) {
        months.set(weeks.length, MONTHS_AR[d.getMonth()]);
      }

      currentWeek.push({ date: key, count, day: d.getDay() });
    }
    if (currentWeek.length) weeks.push(currentWeek);

    return { weeks, totalActivity: total, maxCount: max, monthLabels: months };
  }, [data]);

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (maxCount <= 0) return 1;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            خريطة النشاط
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {totalActivity} نشاط في 6 أشهر
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex gap-0 mr-8 mb-1">
              {weeks.map((_, wIdx) => (
                <div key={wIdx} className="w-[13px] mx-[1px] text-[9px] text-muted-foreground">
                  {monthLabels.get(wIdx) || ''}
                </div>
              ))}
            </div>

            <div className="flex gap-0">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] ml-1 shrink-0 w-7">
                {[0, 1, 2, 3, 4, 5, 6].map(d => (
                  <div key={d} className="h-[13px] text-[9px] text-muted-foreground flex items-center">
                    {d % 2 === 1 ? DAYS_AR[d]?.slice(0, 2) : ''}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              <div className="flex gap-[2px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[2px]">
                    {Array(7).fill(null).map((_, dIdx) => {
                      const cell = week.find(c => c.day === dIdx);
                      if (!cell) return <div key={dIdx} className="w-[13px] h-[13px]" />;
                      const level = getLevel(cell.count);
                      return (
                        <Tooltip key={dIdx}>
                          <TooltipTrigger asChild>
                            <div className={`w-[13px] h-[13px] rounded-[2px] ${LEVELS[level]} transition-colors cursor-default`} />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{cell.count} نشاط</p>
                            <p className="text-muted-foreground">{cell.date}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 justify-end">
              <span className="text-[10px] text-muted-foreground">أقل</span>
              {LEVELS.map((cls, i) => (
                <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${cls}`} />
              ))}
              <span className="text-[10px] text-muted-foreground">أكثر</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
