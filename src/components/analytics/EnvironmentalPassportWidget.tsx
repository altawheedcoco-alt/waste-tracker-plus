/**
 * EnvironmentalPassportWidget — جواز السفر البيئي
 * ملخص الأثر البيئي الإجمالي للمنظمة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, TreePine, Droplets, Zap, Car, Factory } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// IPCC-aligned conversion factors
const FACTORS = {
  co2PerTonRecycled: 0.5,      // tons CO2 saved per ton recycled
  treesPerTonCO2: 45,           // trees equivalent per ton CO2
  waterPerTonRecycled: 7000,    // liters water saved per ton recycled
  energyPerTonRecycled: 1400,   // kWh saved per ton recycled
  carsPerTonCO2: 0.22,          // cars removed equivalent per ton CO2
};

interface ImpactMetric {
  icon: typeof Leaf;
  label: string;
  value: string;
  unit: string;
  color: string;
}

export default function EnvironmentalPassportWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['environmental-passport', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const { data: shipments } = await supabase
        .from('shipments')
        .select('actual_weight, status, disposal_type')
        .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
        .in('status', ['delivered', 'completed', 'recycled']);

      let totalRecycledKg = 0;
      (shipments || []).forEach(s => {
        const weight = s.actual_weight || 0;
        const dtype = (s.disposal_type || '').toLowerCase();
        if (dtype.includes('recycl') || dtype.includes('تدوير') || dtype.includes('compost') || dtype.includes('سماد')) {
          totalRecycledKg += weight;
        } else {
          totalRecycledKg += weight * 0.6; // conservative estimate
        }
      });

      const totalRecycledTons = totalRecycledKg / 1000;
      const co2Saved = totalRecycledTons * FACTORS.co2PerTonRecycled;
      const treesEquiv = Math.round(co2Saved * FACTORS.treesPerTonCO2);
      const waterSaved = totalRecycledTons * FACTORS.waterPerTonRecycled;
      const energySaved = totalRecycledTons * FACTORS.energyPerTonRecycled;
      const carsRemoved = Math.round(co2Saved * FACTORS.carsPerTonCO2);

      // Calculate grade
      let grade = 'D';
      if (totalRecycledTons >= 100) grade = 'A+';
      else if (totalRecycledTons >= 50) grade = 'A';
      else if (totalRecycledTons >= 20) grade = 'B+';
      else if (totalRecycledTons >= 10) grade = 'B';
      else if (totalRecycledTons >= 5) grade = 'C+';
      else if (totalRecycledTons >= 1) grade = 'C';

      return {
        totalRecycledTons: Math.round(totalRecycledTons * 10) / 10,
        co2Saved: Math.round(co2Saved * 10) / 10,
        treesEquiv,
        waterSaved: Math.round(waterSaved),
        energySaved: Math.round(energySaved),
        carsRemoved,
        grade,
        totalShipments: (shipments || []).length,
      };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const metrics: ImpactMetric[] = data ? [
    { icon: Factory, label: 'CO₂ تم توفيره', value: data.co2Saved.toLocaleString(), unit: 'طن', color: 'text-green-600' },
    { icon: TreePine, label: 'مكافئ أشجار', value: data.treesEquiv.toLocaleString(), unit: 'شجرة', color: 'text-emerald-600' },
    { icon: Droplets, label: 'مياه تم توفيرها', value: (data.waterSaved / 1000).toFixed(1), unit: 'م³', color: 'text-blue-500' },
    { icon: Zap, label: 'طاقة تم توفيرها', value: (data.energySaved / 1000).toFixed(1), unit: 'MWh', color: 'text-yellow-500' },
    { icon: Car, label: 'سيارات مزاحة', value: data.carsRemoved.toString(), unit: 'سيارة/سنة', color: 'text-purple-500' },
    { icon: Leaf, label: 'إجمالي التدوير', value: data.totalRecycledTons.toLocaleString(), unit: 'طن', color: 'text-primary' },
  ] : [];

  const gradeColor = data?.grade?.startsWith('A') ? 'bg-green-500' : data?.grade?.startsWith('B') ? 'bg-blue-500' : data?.grade?.startsWith('C') ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Leaf className="h-5 w-5 text-green-500" />
            جواز السفر البيئي
          </CardTitle>
          {data && (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${gradeColor} flex items-center justify-center text-white text-sm font-bold`}>
                {data.grade}
              </div>
              <Badge variant="outline" className="text-xs">
                {data.totalShipments} شحنة
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data ? (
          <div className="grid grid-cols-3 gap-3">
            {metrics.map(m => (
              <div key={m.label} className="text-center p-3 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors">
                <m.icon className={`h-5 w-5 mx-auto mb-1.5 ${m.color}`} />
                <p className="text-lg font-bold leading-tight">{m.value}</p>
                <p className="text-[9px] text-muted-foreground">{m.unit}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
