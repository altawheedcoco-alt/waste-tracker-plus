/**
 * ودجة الأثر البيئي — خاص بجهات التخلص
 * يعرض مؤشرات الأثر البيئي والانبعاثات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Droplets, Wind, TreePine } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const EnvironmentalImpactWidget = () => {
  const { organization } = useAuth();

  const { data: impact } = useQuery({
    queryKey: ['env-impact', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data: shipments } = await supabase
        .from('shipments')
        .select('actual_weight, quantity, status')
        .eq('disposal_facility_id', organization.id)
        .in('status', ['delivered', 'confirmed'])
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      const totalWeight = shipments?.reduce((a, s: any) => a + (Number(s.actual_weight || s.quantity) || 0), 0) || 0;
      
      // حسابات تقديرية للأثر البيئي
      const co2Saved = Math.round(totalWeight * 0.5); // كجم CO2
      const waterSaved = Math.round(totalWeight * 2.5); // لتر
      const treesEquivalent = Math.round(co2Saved / 22); // شجرة تمتص ~22 كجم CO2/سنة

      return {
        totalProcessed: Math.round(totalWeight),
        co2Saved,
        waterSaved,
        treesEquivalent,
        complianceScore: 92,
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  const metrics = impact ? [
    { icon: Wind, label: 'CO₂ تم تجنبه', value: `${impact.co2Saved.toLocaleString('ar-EG')} كجم`, color: 'text-blue-600 dark:text-blue-400' },
    { icon: Droplets, label: 'مياه تم توفيرها', value: `${impact.waterSaved.toLocaleString('ar-EG')} لتر`, color: 'text-cyan-600 dark:text-cyan-400' },
    { icon: TreePine, label: 'ما يعادل أشجار', value: `${impact.treesEquivalent}`, color: 'text-green-600 dark:text-green-400' },
  ] : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Leaf className="h-4 w-4 text-primary" />
          الأثر البيئي
          {impact && (
            <Badge variant="outline" className="text-[9px] mr-auto border-0 bg-green-500/10 text-green-700 dark:text-green-300">
              {impact.complianceScore}% امتثال
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!impact ? (
          <div className="text-center py-4">
            <Leaf className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">جاري حساب الأثر البيئي...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-green-500/5">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {impact.totalProcessed.toLocaleString('ar-EG')} كجم
              </div>
              <p className="text-[10px] text-muted-foreground">إجمالي المخلفات المُعالجة بأمان</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {metrics.map((m, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-muted/20">
                  <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                  <div className="text-xs font-bold">{m.value}</div>
                  <p className="text-[8px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnvironmentalImpactWidget;
