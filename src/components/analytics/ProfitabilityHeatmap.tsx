/**
 * ProfitabilityHeatmap — خريطة حرارية للربحية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfitabilityHeatmap() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['profitability-heatmap', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('waste_type, pickup_city, total_value, actual_weight')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .not('waste_type', 'is', null)
        .limit(500);
      return data || [];
    },
  });

  const heatData = useMemo(() => {
    if (!shipments) return [];
    const combos: Record<string, { revenue: number; weight: number; count: number }> = {};
    shipments.forEach(s => {
      const key = `${s.waste_type}|${s.pickup_city || 'غير محدد'}`;
      if (!combos[key]) combos[key] = { revenue: 0, weight: 0, count: 0 };
      combos[key].revenue += Number(s.total_value) || 0;
      combos[key].weight += Number(s.actual_weight) || 0;
      combos[key].count += 1;
    });

    return Object.entries(combos)
      .map(([key, stats]) => {
        const [wasteType, city] = key.split('|');
        const perTon = stats.weight > 0 ? Math.round((stats.revenue / stats.weight) * 1000) : 0;
        return { wasteType, city, perTon, count: stats.count, revenue: Math.round(stats.revenue) };
      })
      .sort((a, b) => b.perTon - a.perTon)
      .slice(0, 10);
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[300px] w-full rounded-xl" />;

  const getHeatColor = (perTon: number, max: number) => {
    const ratio = max > 0 ? perTon / max : 0;
    if (ratio > 0.7) return 'bg-primary/30 border-primary/50';
    if (ratio > 0.4) return 'bg-chart-2/20 border-chart-2/30';
    return 'bg-muted/50 border-muted';
  };

  const maxPerTon = heatData.length > 0 ? heatData[0].perTon : 1;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-5 w-5 text-primary" />
          خريطة الربحية (ج.م/طن)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {heatData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
        ) : (
          <div className="space-y-2">
            {heatData.map((d, i) => (
              <div key={i} className={`p-2 rounded-lg border ${getHeatColor(d.perTon, maxPerTon)} flex items-center justify-between`}>
                <div>
                  <span className="text-xs font-medium">{d.wasteType}</span>
                  <span className="text-[10px] text-muted-foreground mr-2">({d.city})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{d.count} شحنة</Badge>
                  <span className="text-sm font-bold text-primary">{d.perTon.toLocaleString('ar-EG')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
