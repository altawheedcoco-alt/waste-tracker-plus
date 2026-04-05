/**
 * البصمة الكربونية للأسطول - فكرة #89
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, TreePine, Droplets, Wind } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const CO2_PER_LITER_DIESEL = 2.68; // kg CO2
const CO2_PER_KM = 0.8; // average kg CO2 for heavy vehicles

export default function FleetCarbonFootprint() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['fleet-carbon', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments' as any)
        .select('actual_weight, distance_km, status')
        .eq('transporter_id', orgId!)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', new Date(Date.now() - 90 * 24 * 3600000).toISOString())
        .limit(500);
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    const totalDistance = (shipments || []).reduce((sum, s) => sum + (s.distance_km || 30), 0);
    const totalWeight = (shipments || []).reduce((sum, s) => sum + (s.actual_weight || 0), 0);
    const co2Emitted = totalDistance * CO2_PER_KM;
    const co2Saved = totalWeight * 0.5; // simplified: recycling saves ~0.5 kg CO2 per kg
    const netImpact = co2Saved - co2Emitted;
    const treesEquiv = Math.round(Math.abs(netImpact) / 21); // 1 tree absorbs ~21 kg CO2/year

    return {
      co2Emitted: Math.round(co2Emitted),
      co2Saved: Math.round(co2Saved),
      netImpact: Math.round(netImpact),
      treesEquiv,
      totalDistance: Math.round(totalDistance),
      shipmentCount: (shipments || []).length,
    };
  }, [shipments]);

  if (isLoading) return <Skeleton className="h-[240px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Leaf className="h-5 w-5 text-emerald-500" />
          البصمة الكربونية
          <Badge variant="outline" className="text-[10px]">90 يوم</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`text-center p-3 rounded-lg ${
          metrics.netImpact >= 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}>
          <div className={`text-2xl font-bold ${metrics.netImpact >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {metrics.netImpact >= 0 ? '+' : ''}{(metrics.netImpact / 1000).toFixed(1)} طن
          </div>
          <div className="text-[10px] text-muted-foreground">
            {metrics.netImpact >= 0 ? 'صافي CO₂ موفّر' : 'صافي CO₂ منبعث'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <Wind className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <div className="text-xs font-bold">{(metrics.co2Emitted / 1000).toFixed(1)}</div>
            <div className="text-[9px] text-muted-foreground">طن CO₂ منبعث</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-500/5">
            <Leaf className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <div className="text-xs font-bold text-emerald-600">{(metrics.co2Saved / 1000).toFixed(1)}</div>
            <div className="text-[9px] text-muted-foreground">طن CO₂ موفّر</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-primary/5">
            <TreePine className="h-4 w-4 text-primary mx-auto mb-1" />
            <div className="text-xs font-bold text-primary">{metrics.treesEquiv}</div>
            <div className="text-[9px] text-muted-foreground">شجرة مكافئة</div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          {metrics.shipmentCount} شحنة • {metrics.totalDistance.toLocaleString('ar-EG')} كم مقطوعة
        </p>
      </CardContent>
    </Card>
  );
}
