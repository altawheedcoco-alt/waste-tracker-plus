/**
 * حاسبة الأثر البيئي - أشجار منقذة، مياه، طاقة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreePine, Droplets, Zap, Recycle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// Environmental impact factors per ton recycled
const IMPACT = {
  trees: 17, // trees saved per ton of paper
  water: 26000, // liters saved per ton
  energy: 4100, // kWh saved per ton
  co2: 2.5, // tons CO2 avoided per ton recycled
};

const EnvironmentalImpactCalculator = () => {
  const { organization } = useAuth();

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-env-impact', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('quantity, unit, waste_type')
        .eq('generator_id', organization.id)
        .in('status', ['delivered', 'confirmed']);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const impact = useMemo(() => {
    const totalTons = shipments.reduce((sum, s) => {
      return sum + (s.unit === 'ton' ? (s.quantity || 0) : (s.quantity || 0) / 1000);
    }, 0);

    return {
      totalTons,
      trees: Math.round(totalTons * IMPACT.trees),
      water: Math.round(totalTons * IMPACT.water),
      energy: Math.round(totalTons * IMPACT.energy),
      co2: (totalTons * IMPACT.co2).toFixed(1),
    };
  }, [shipments]);

  const items = [
    { icon: TreePine, label: 'أشجار مُنقذة', value: impact.trees.toLocaleString('ar-EG'), color: 'text-green-600 bg-green-50 dark:bg-green-950/20' },
    { icon: Droplets, label: 'لتر مياه موفرة', value: impact.water.toLocaleString('ar-EG'), color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
    { icon: Zap, label: 'كيلوواط طاقة', value: impact.energy.toLocaleString('ar-EG'), color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
    { icon: Recycle, label: 'طن CO₂ مجنبة', value: impact.co2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
  ];

  return (
    <Card className="border-green-200/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <TreePine className="h-4 w-4 text-green-600" />
          الأثر البيئي الإيجابي
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => (
            <div key={i} className={`p-3 rounded-lg ${item.color} text-center`}>
              <item.icon className="h-5 w-5 mx-auto mb-1" />
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-[10px] opacity-80">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          * محسوب على أساس {impact.totalTons.toFixed(1)} طن تم تدويره
        </p>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalImpactCalculator;
