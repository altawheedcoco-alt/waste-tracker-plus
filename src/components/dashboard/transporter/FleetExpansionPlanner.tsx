/**
 * تخطيط توسع الأسطول - فكرة #25
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Truck, BarChart3, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function FleetExpansionPlanner() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['fleet-expansion', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [vehicles, shipments] = await Promise.all([
        supabase.from('vehicles' as any).select('id, capacity_tons, status').eq('organization_id', orgId!),
        supabase.from('shipments' as any).select('id, actual_weight, status, created_at')
          .eq('transporter_id', orgId!)
          .in('status', ['delivered', 'confirmed'])
          .gte('created_at', new Date(Date.now() - 30 * 24 * 3600000).toISOString()),
      ]);
      return {
        vehicles: vehicles.data || [],
        shipments: shipments.data || [],
      };
    },
  });

  const analysis = useMemo(() => {
    if (!data) return null;
    const activeVehicles = data.vehicles.filter(v => v.status === 'active');
    const totalCapacity = activeVehicles.reduce((s, v) => s + (v.capacity_tons || 5), 0);
    const monthlyWeight = data.shipments.reduce((s, sh) => s + (sh.actual_weight || 0), 0);
    const monthlyTrips = data.shipments.length;
    const tripsPerVehicle = activeVehicles.length > 0 ? monthlyTrips / activeVehicles.length : 0;
    const utilizationRate = totalCapacity > 0 ? Math.min(100, Math.round((monthlyWeight / (totalCapacity * 30)) * 100)) : 0;
    const needExpansion = utilizationRate > 75 || tripsPerVehicle > 20;

    return {
      totalVehicles: data.vehicles.length,
      activeVehicles: activeVehicles.length,
      totalCapacity,
      monthlyWeight: Math.round(monthlyWeight),
      monthlyTrips,
      tripsPerVehicle: tripsPerVehicle.toFixed(1),
      utilizationRate,
      needExpansion,
      suggestedAdditional: needExpansion ? Math.ceil((monthlyWeight / (totalCapacity || 1)) * 0.3) : 0,
    };
  }, [data]);

  if (isLoading) return <Skeleton className="h-[250px] w-full rounded-xl" />;
  if (!analysis) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-primary" />
          تخطيط الأسطول
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">معدل استغلال الأسطول</span>
            <span className="font-bold">{analysis.utilizationRate}%</span>
          </div>
          <Progress value={analysis.utilizationRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <Truck className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{analysis.activeVehicles}/{analysis.totalVehicles}</div>
            <div className="text-[9px] text-muted-foreground">مركبة نشطة</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <BarChart3 className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-sm font-bold">{analysis.tripsPerVehicle}</div>
            <div className="text-[9px] text-muted-foreground">رحلة/مركبة/شهر</div>
          </div>
        </div>

        {analysis.needExpansion && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">توصية بالتوسع</span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              الأسطول الحالي يعمل بـ {analysis.utilizationRate}% من طاقته.
              يُنصح بإضافة {analysis.suggestedAdditional} مركبة لتلبية الطلب المتزايد.
            </p>
          </div>
        )}

        {!analysis.needExpansion && (
          <p className="text-[10px] text-emerald-600 text-center">✅ الأسطول الحالي يغطي الطلب بشكل جيد</p>
        )}
      </CardContent>
    </Card>
  );
}
