/**
 * تحليل ربحية كل مسار/منطقة - فكرة #63
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function RouteProfitability() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['route-profit', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments' as any)
        .select('pickup_governorate, delivery_governorate, actual_weight, distance_km, price_per_ton, status')
        .eq('transporter_id', orgId!)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', new Date(Date.now() - 90 * 24 * 3600000).toISOString())
        .limit(500);
      return data || [];
    },
  });

  const routes = useMemo(() => {
    const map = new Map<string, { revenue: number; trips: number; totalKm: number; totalWeight: number }>();

    (shipments || []).forEach(s => {
      const key = `${s.pickup_governorate || 'غير محدد'} → ${s.delivery_governorate || 'غير محدد'}`;
      if (!map.has(key)) map.set(key, { revenue: 0, trips: 0, totalKm: 0, totalWeight: 0 });
      const r = map.get(key)!;
      r.trips++;
      r.totalKm += s.distance_km || 0;
      r.totalWeight += s.actual_weight || 0;
      r.revenue += (s.actual_weight || 0) * (s.price_per_ton || 0);
    });

    return Array.from(map.entries())
      .map(([route, data]) => ({
        route,
        ...data,
        avgRevPerTrip: data.trips > 0 ? data.revenue / data.trips : 0,
        avgKm: data.trips > 0 ? data.totalKm / data.trips : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[250px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Route className="h-5 w-5 text-primary" />
          ربحية المسارات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {routes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد بيانات كافية</p>
        ) : (
          <div className="space-y-2">
            {routes.map((r, i) => (
              <div key={r.route} className="flex items-center justify-between p-2 rounded-lg border border-border">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] shrink-0">#{i + 1}</Badge>
                    <p className="text-[11px] font-medium truncate">{r.route}</p>
                  </div>
                  <div className="flex gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span>{r.trips} رحلة</span>
                    <span>{Math.round(r.avgKm)} كم/رحلة</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-xs font-bold">{r.revenue.toLocaleString('ar-EG')}</div>
                  <div className="text-[9px] text-muted-foreground">ج.م</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
