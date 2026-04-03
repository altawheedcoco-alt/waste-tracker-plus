import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Recycle, TrendingUp, Droplets, Zap, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CircularEconomyIndex = () => {
  const { organization } = useAuth();

  const { data } = useQuery({
    queryKey: ['circular-economy-idx', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('quantity, status, waste_type')
        .eq('generator_id', organization!.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const total = (shipments || []).reduce((s, sh) => s + (Number(sh.quantity) || 0), 0);
      const recycled = (shipments || []).filter(s => s.status === 'confirmed').reduce((s, sh) => s + (Number(sh.quantity) || 0), 0);
      const diversionRate = total > 0 ? Math.round((recycled / total) * 100) : 0;

      // Simulate circular metrics based on real data
      const resourceEfficiency = Math.min(100, diversionRate + 15);
      const wasteReduction = Math.min(100, Math.round(diversionRate * 0.85));
      const carbonOffset = Math.round(recycled * 0.42); // ~0.42 tCO2e per ton recycled

      return {
        diversionRate,
        resourceEfficiency,
        wasteReduction,
        carbonOffset,
        totalProcessed: Math.round(total * 100) / 100,
        metrics: [
          { label: 'معدل التحويل', value: diversionRate, icon: Recycle, color: 'text-green-600' },
          { label: 'كفاءة الموارد', value: resourceEfficiency, icon: Zap, color: 'text-blue-600' },
          { label: 'خفض النفايات', value: wasteReduction, icon: TrendingUp, color: 'text-purple-600' },
        ],
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const overallIndex = data ? Math.round((data.diversionRate + data.resourceEfficiency + data.wasteReduction) / 3) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Leaf className="h-4 w-4 text-green-600" />
            مؤشر الاقتصاد الدائري
          </CardTitle>
          <Badge variant={overallIndex >= 70 ? 'default' : 'outline'} className="text-xs">
            {overallIndex}% CEI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main circular gauge */}
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
              <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(142, 76%, 36%)" strokeWidth="7"
                strokeDasharray={`${(overallIndex / 100) * 251.3} 251.3`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{overallIndex}%</span>
              <span className="text-[10px] text-muted-foreground">دائرية</span>
            </div>
          </div>
        </div>

        {/* Carbon offset highlight */}
        <div className="bg-green-500/10 rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <Droplets className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-medium">تعويض كربوني: {data?.carbonOffset || 0} طن CO₂e</span>
          </div>
        </div>

        {/* Individual metrics */}
        {data?.metrics.map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
                <span>{m.label}</span>
              </div>
              <span className="font-medium">{m.value}%</span>
            </div>
            <Progress value={m.value} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CircularEconomyIndex;
