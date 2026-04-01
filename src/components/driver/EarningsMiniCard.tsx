/**
 * ملخص الأرباح المصغر — يظهر في الرئيسية للسائق المستقل
 */
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface EarningsMiniCardProps {
  driverId: string;
}

const EarningsMiniCard = ({ driverId }: EarningsMiniCardProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-earnings-mini', driverId],
    enabled: !!driverId,
    refetchInterval: 120000,
    queryFn: async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, quantity, delivered_at')
        .eq('driver_id', driverId)
        .in('status', ['delivered', 'confirmed']);

      if (!shipments) return { today: 0, todayTrips: 0, week: 0, weekTrips: 0 };

      const RATE_PER_TRIP = 150;
      const RATE_PER_TON = 25;

      const todayDelivered = shipments.filter(s => s.delivered_at?.startsWith(todayStr));
      const weekDelivered = shipments.filter(s => s.delivered_at && new Date(s.delivered_at) >= weekAgo);

      const calc = (list: typeof shipments) =>
        list.reduce((sum, s) => sum + RATE_PER_TRIP + (s.quantity || 0) * RATE_PER_TON, 0);

      return {
        today: calc(todayDelivered),
        todayTrips: todayDelivered.length,
        week: calc(weekDelivered),
        weekTrips: weekDelivered.length,
      };
    },
  });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <Card className="border-border/40">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold">{data.today.toLocaleString('ar-SA')} <span className="text-[10px] text-muted-foreground font-normal">ج.م</span></p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Truck className="w-2.5 h-2.5" /> {data.todayTrips} رحلة اليوم
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-bold">{data.week.toLocaleString('ar-SA')} <span className="text-[10px] text-muted-foreground font-normal">ج.م</span></p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Truck className="w-2.5 h-2.5" /> {data.weekTrips} هذا الأسبوع
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsMiniCard;