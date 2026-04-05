/**
 * حاسبة العائد على الاستثمار من إعادة التدوير
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Leaf, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// Estimated savings per ton by waste type
const SAVINGS_PER_TON: Record<string, number> = {
  'بلاستيك': 800, 'ورق': 400, 'كرتون': 350, 'حديد': 1200, 'خردة': 1000,
  'زجاج': 300, 'ألومنيوم': 2500, 'نحاس': 5000, 'إلكترونيات': 3000,
};

const RecyclingROICalculator = () => {
  const { organization } = useAuth();

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-roi-calc', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('waste_type, quantity, unit, status, created_at')
        .eq('generator_id', organization.id)
        .in('status', ['delivered', 'confirmed']);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const roi = useMemo(() => {
    let totalRecycled = 0;
    let estimatedSavings = 0;
    let estimatedLandfillCost = 0;
    const LANDFILL_COST_PER_TON = 250; // Average landfill cost

    for (const s of shipments) {
      const qty = s.quantity || 0;
      const tons = s.unit === 'ton' ? qty : qty / 1000;
      totalRecycled += tons;

      const wasteKey = Object.keys(SAVINGS_PER_TON).find(k => s.waste_type?.includes(k));
      const savingsRate = wasteKey ? SAVINGS_PER_TON[wasteKey] : 200;
      estimatedSavings += tons * savingsRate;
      estimatedLandfillCost += tons * LANDFILL_COST_PER_TON;
    }

    const totalSaved = estimatedSavings + estimatedLandfillCost;
    const roiPercent = estimatedLandfillCost > 0 ? ((estimatedSavings / estimatedLandfillCost) * 100) : 0;

    return { totalRecycled, estimatedSavings, estimatedLandfillCost, totalSaved, roiPercent };
  }, [shipments]);

  return (
    <Card className="border-green-200/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Calculator className="h-4 w-4 text-green-600" />
          عائد الاستثمار من التدوير
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        <div className="text-center p-3 rounded-lg bg-gradient-to-b from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/10">
          <p className="text-xs text-muted-foreground mb-1">إجمالي الوفورات المقدرة</p>
          <p className="text-2xl font-bold text-green-600">{roi.totalSaved.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م</p>
          <Badge className="mt-1 bg-green-100 text-green-700 text-xs">
            <TrendingUp className="h-3 w-3 ml-1" />
            ROI {roi.roiPercent.toFixed(0)}%
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-muted/30">
            <Leaf className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">تم تدوير</p>
            <p className="text-sm font-bold">{roi.totalRecycled.toFixed(1)} طن</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <DollarSign className="h-4 w-4 mx-auto text-blue-500 mb-1" />
            <p className="text-xs text-muted-foreground">قيمة المخلفات</p>
            <p className="text-sm font-bold">{roi.estimatedSavings.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <Calculator className="h-4 w-4 mx-auto text-amber-500 mb-1" />
            <p className="text-xs text-muted-foreground">وفرت من الدفن</p>
            <p className="text-sm font-bold">{roi.estimatedLandfillCost.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecyclingROICalculator;
