/**
 * مقارنة مع متوسط القطاع - Benchmark مع المنافسين
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

// Industry averages per waste type (estimated, in tons/month)
const INDUSTRY_AVG: Record<string, { recycleRate: number; costPerTon: number; label: string }> = {
  'factory': { recycleRate: 45, costPerTon: 350, label: 'المصانع' },
  'hospital': { recycleRate: 30, costPerTon: 800, label: 'المستشفيات' },
  'hotel': { recycleRate: 35, costPerTon: 400, label: 'الفنادق' },
  'restaurant': { recycleRate: 25, costPerTon: 300, label: 'المطاعم' },
  'default': { recycleRate: 35, costPerTon: 400, label: 'المتوسط العام' },
};

const IndustryBenchmark = () => {
  const { organization } = useAuth();

  const { data: shipments = [] } = useQuery({
    queryKey: ['generator-benchmark', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const sixMonths = new Date(Date.now() - 180 * 86400000).toISOString();
      const { data } = await supabase
        .from('shipments')
        .select('status, quantity, unit')
        .eq('generator_id', organization.id)
        .gte('created_at', sixMonths);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const benchmark = useMemo(() => {
    const industry = INDUSTRY_AVG['default'];
    const total = shipments.length;
    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
    const myRecycleRate = total > 0 ? (completed / total) * 100 : 0;
    const totalTons = shipments.reduce((sum, s) => sum + (s.unit === 'ton' ? (s.quantity || 0) : (s.quantity || 0) / 1000), 0);
    const monthlyAvg = totalTons / 6;

    const metrics = [
      {
        label: 'معدل التدوير',
        yours: myRecycleRate,
        industry: industry.recycleRate,
        unit: '%',
        better: myRecycleRate >= industry.recycleRate,
      },
      {
        label: 'شحنات شهرية',
        yours: total / 6,
        industry: 15,
        unit: 'شحنة',
        better: (total / 6) >= 15,
      },
      {
        label: 'حجم شهري',
        yours: monthlyAvg,
        industry: 5,
        unit: 'طن',
        better: monthlyAvg >= 5,
      },
    ];

    const overallScore = metrics.filter(m => m.better).length;
    const grade = overallScore >= 3 ? 'متفوق' : overallScore >= 2 ? 'جيد' : overallScore >= 1 ? 'متوسط' : 'يحتاج تحسين';

    return { metrics, overallScore, grade, industryLabel: industry.label };
  }, [shipments]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={benchmark.overallScore >= 2 ? 'default' : 'secondary'} className="text-xs">
            {benchmark.grade}
          </Badge>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            مقارنة بالقطاع
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        {benchmark.metrics.map((m, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {m.better ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={m.better ? 'text-green-600' : 'text-red-600'}>
                  {m.yours.toFixed(1)} {m.unit}
                </span>
              </div>
              <span className="font-medium">{m.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-24">متوسط القطاع: {m.industry} {m.unit}</span>
              <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute h-full rounded-full ${m.better ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min((m.yours / Math.max(m.industry, m.yours)) * 100, 100)}%` }}
                />
                <div
                  className="absolute h-full w-0.5 bg-foreground/40"
                  style={{ left: `${(m.industry / Math.max(m.industry, m.yours)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default IndustryBenchmark;
