/**
 * مؤشر الاستدامة مقارنة بالمنافسين
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const SustainabilityIndex = () => {
  const { organization } = useAuth();

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-sustainability-idx', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { data } = await supabase
        .from('shipments')
        .select('status, quantity, unit, waste_type')
        .eq('generator_id', organization.id)
        .gte('created_at', yearStart);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const index = useMemo(() => {
    const total = shipments.length;
    if (total === 0) return { score: 0, grade: 'N/A', percentile: 0, factors: [] };

    const recycled = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
    const recycleRate = (recycled / total) * 100;
    const wasteTypes = new Set(shipments.map(s => s.waste_type).filter(Boolean)).size;
    const totalTons = shipments.reduce((sum, s) => sum + (s.unit === 'ton' ? (s.quantity || 0) : (s.quantity || 0) / 1000), 0);

    let score = 0;
    score += Math.min(recycleRate / 100 * 40, 40); // 40% weight on recycle rate
    score += Math.min(wasteTypes / 5 * 20, 20); // 20% on variety
    score += Math.min(total / 50 * 20, 20); // 20% on volume
    score += Math.min(totalTons / 100 * 20, 20); // 20% on tonnage

    const grade = score >= 85 ? 'A+' : score >= 75 ? 'A' : score >= 65 ? 'B+' : score >= 55 ? 'B' : score >= 45 ? 'C' : 'D';
    const percentile = Math.min(Math.round(score * 1.1), 99);

    return {
      score: Math.round(score),
      grade,
      percentile,
      factors: [
        { label: 'معدل التدوير', value: `${recycleRate.toFixed(0)}%`, weight: '40%' },
        { label: 'تنوع المخلفات', value: `${wasteTypes} أنواع`, weight: '20%' },
        { label: 'حجم العمليات', value: `${total} شحنة`, weight: '20%' },
        { label: 'إجمالي الأطنان', value: `${totalTons.toFixed(1)} طن`, weight: '20%' },
      ],
    };
  }, [shipments]);

  return (
    <Card className="border-emerald-200/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Leaf className="h-4 w-4 text-emerald-600" />
          مؤشر الاستدامة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        <div className="text-center p-3 rounded-lg bg-gradient-to-b from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/10">
          <div className="flex items-center justify-center gap-3">
            <div>
              <p className="text-3xl font-bold text-emerald-600">{index.grade}</p>
              <p className="text-xs text-muted-foreground">{index.score}/100</p>
            </div>
            <div className="text-right">
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                <Award className="h-3 w-3 ml-1" />
                أفضل من {index.percentile}% من القطاع
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {index.factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/20">
              <div className="flex items-center gap-1">
                <span className="font-medium">{f.value}</span>
                <span className="text-[10px] text-muted-foreground">({f.weight})</span>
              </div>
              <span className="text-muted-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SustainabilityIndex;
