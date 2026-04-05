/**
 * متتبع وقت الاستجابة - فكرة #59
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function ResponseTimeTracker() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['response-time', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments' as any)
        .select('created_at, approved_at, collected_at, delivered_at, status')
        .eq('transporter_id', orgId!)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString())
        .limit(200);
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    const valid = (shipments || []).filter(s => s.created_at && s.approved_at);
    if (!valid.length) return null;

    const responseTimes = valid.map(s => {
      const created = new Date(s.created_at).getTime();
      const approved = new Date(s.approved_at!).getTime();
      return (approved - created) / (1000 * 60); // minutes
    });

    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const under30 = responseTimes.filter(t => t <= 30).length;
    const under60 = responseTimes.filter(t => t <= 60).length;

    return {
      avgMinutes: Math.round(avg),
      under30Pct: Math.round((under30 / responseTimes.length) * 100),
      under60Pct: Math.round((under60 / responseTimes.length) * 100),
      total: responseTimes.length,
      fastest: Math.round(Math.min(...responseTimes)),
      slowest: Math.round(Math.max(...responseTimes)),
    };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[200px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-primary" />
          وقت الاستجابة
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!metrics ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات كافية</p>
        ) : (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{metrics.avgMinutes}</div>
              <div className="text-xs text-muted-foreground">دقيقة متوسط الاستجابة</div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span>أقل من 30 دقيقة</span>
                  <span className="font-medium">{metrics.under30Pct}%</span>
                </div>
                <Progress value={metrics.under30Pct} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span>أقل من ساعة</span>
                  <span className="font-medium">{metrics.under60Pct}%</span>
                </div>
                <Progress value={metrics.under60Pct} className="h-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-1.5 rounded bg-emerald-500/5">
                <div className="text-xs font-bold text-emerald-600">{metrics.fastest}د</div>
                <div className="text-[9px] text-muted-foreground">أسرع</div>
              </div>
              <div className="p-1.5 rounded bg-primary/5">
                <div className="text-xs font-bold text-primary">{metrics.total}</div>
                <div className="text-[9px] text-muted-foreground">عملية</div>
              </div>
              <div className="p-1.5 rounded bg-amber-500/5">
                <div className="text-xs font-bold text-amber-600">{metrics.slowest}د</div>
                <div className="text-[9px] text-muted-foreground">أبطأ</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
