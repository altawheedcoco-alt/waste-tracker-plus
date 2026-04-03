/**
 * ShipmentVelocityTracker — متتبع سرعة الشحنات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Timer, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function ShipmentVelocityTracker() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['shipment-velocity', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('created_at, delivered_at, status, pickup_date')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .gte('created_at', sixMonthsAgo.toISOString())
        .eq('status', 'delivered');

      const now = new Date();
      const monthlyVelocity: Array<{ month: string; avgDays: number; count: number }> = [];

      for (let i = 5; i >= 0; i--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        let totalDays = 0;
        let count = 0;

        (shipments || []).forEach(s => {
          if (!s.delivered_at || !s.created_at) return;
          const created = new Date(s.created_at);
          if (created >= mStart && created <= mEnd) {
            const start = s.pickup_date ? new Date(s.pickup_date) : created;
            const days = (new Date(s.delivered_at).getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
            if (days >= 0 && days < 365) {
              totalDays += days;
              count++;
            }
          }
        });

        monthlyVelocity.push({
          month: MONTHS_AR[mStart.getMonth()],
          avgDays: count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0,
          count,
        });
      }

      const recentAvg = monthlyVelocity.slice(-3).filter(m => m.count > 0);
      const currentAvg = recentAvg.length > 0 ? recentAvg.reduce((s, m) => s + m.avgDays, 0) / recentAvg.length : 0;

      const olderAvg = monthlyVelocity.slice(0, 3).filter(m => m.count > 0);
      const previousAvg = olderAvg.length > 0 ? olderAvg.reduce((s, m) => s + m.avgDays, 0) / olderAvg.length : 0;

      const trend = previousAvg > 0 ? Math.round(((currentAvg - previousAvg) / previousAvg) * 100) : 0;
      const overallAvg = Math.round(currentAvg * 10) / 10;

      return { monthlyVelocity, overallAvg, trend, totalDelivered: (shipments || []).length };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const TrendIcon = data?.trend === 0 ? Minus : data?.trend && data.trend < 0 ? ArrowDown : ArrowUp;
  const trendColor = data?.trend && data.trend < 0 ? 'text-green-500' : data?.trend === 0 ? 'text-muted-foreground' : 'text-destructive';

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-5 w-5 text-primary" />
            سرعة التسليم
          </CardTitle>
          {data && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Timer className="h-3 w-3" />
                {data.overallAvg} يوم متوسط
              </Badge>
              {data.trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(data.trend)}%
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data?.monthlyVelocity.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthlyVelocity} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" unit=" يوم" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                formatter={(val: number) => [`${val} يوم`, 'متوسط التسليم']} />
              <ReferenceLine y={data.overallAvg} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="avgDays" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">لا توجد بيانات كافية</div>
        )}
      </CardContent>
    </Card>
  );
}
