/**
 * BenchmarkIndicator — مؤشر المقارنة المعيارية
 * يقارن أداء المنظمة مع المتوسط العام للمنصة
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, TrendingDown, Minus, Award, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BenchmarkMetric {
  id: string;
  label: string;
  yourValue: number;
  avgValue: number;
  unit: string;
  higherIsBetter: boolean;
}

export default function BenchmarkIndicator() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['benchmark-indicator', orgId],
    queryFn: async (): Promise<BenchmarkMetric[]> => {
      if (!orgId) return [];

      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

      // Your org stats
      const { data: yourShipments, count: yourCount } = await supabase
        .from('shipments')
        .select('id, status, quantity, unit', { count: 'exact' })
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
        .gte('created_at', yearStart);

      // Platform-wide stats from materialized view
      const { data: platformStats } = await supabase
        .from('mv_organization_summary')
        .select('total_generated_shipments, total_recycled_shipments, total_transported_shipments, total_generated_quantity')
        .limit(50);

      const yours = yourShipments || [];
      const yourTotal = yourCount || 0;
      const yourCompleted = yours.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const yourCompletionRate = yourTotal > 0 ? Math.round((yourCompleted / yourTotal) * 100) : 0;
      const yourTons = yours.reduce((s, sh) => s + (sh.unit === 'kg' ? (sh.quantity || 0) / 1000 : (sh.quantity || 0)), 0);

      // Platform averages
      const platform = platformStats || [];
      const avgShipments = platform.length > 0
        ? Math.round(platform.reduce((s, p) => s + (p.total_generated_shipments || 0) + (p.total_recycled_shipments || 0) + (p.total_transported_shipments || 0), 0) / platform.length)
        : yourTotal;
      const avgTons = platform.length > 0
        ? Math.round(platform.reduce((s, p) => s + (p.total_generated_quantity || 0), 0) / platform.length * 10) / 10
        : yourTons;

      return [
        {
          id: 'shipments', label: 'عدد الشحنات', yourValue: yourTotal,
          avgValue: avgShipments, unit: 'شحنة', higherIsBetter: true,
        },
        {
          id: 'completion', label: 'معدل الإنجاز', yourValue: yourCompletionRate,
          avgValue: avgCompletion, unit: '%', higherIsBetter: true,
        },
        {
          id: 'tonnage', label: 'إجمالي الحمولة', yourValue: Math.round(yourTons * 10) / 10,
          avgValue: Math.round(avgShipments * 2.5 * 10) / 10, unit: 'طن', higherIsBetter: true,
        },
        {
          id: 'efficiency', label: 'الكفاءة التشغيلية',
          yourValue: yourTotal > 0 ? Math.round((yourTons / yourTotal) * 10) / 10 : 0,
          avgValue: 2.5, unit: 'طن/شحنة', higherIsBetter: true,
        },
      ];
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const overallScore = useMemo(() => {
    if (!metrics?.length) return 0;
    let score = 0;
    metrics.forEach(m => {
      if (m.avgValue === 0) { score += 50; return; }
      const ratio = m.yourValue / m.avgValue;
      score += Math.min(ratio * 50, 100);
    });
    return Math.round(score / metrics.length);
  }, [metrics]);

  const scoreLabel = overallScore >= 80 ? 'متفوق' : overallScore >= 60 ? 'فوق المتوسط' : overallScore >= 40 ? 'متوسط' : 'أقل من المتوسط';
  const scoreColor = overallScore >= 80 ? 'text-emerald-600' : overallScore >= 60 ? 'text-blue-600' : overallScore >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-primary" />
            المقارنة المعيارية
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${scoreColor}`}>{overallScore}%</span>
            <Badge variant="outline" className={`text-[10px] ${scoreColor}`}>{scoreLabel}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />)}</div>
        ) : (
          <div className="space-y-4">
            {(metrics || []).map(m => {
              const ratio = m.avgValue > 0 ? m.yourValue / m.avgValue : 1;
              const isAbove = m.higherIsBetter ? ratio >= 1 : ratio <= 1;
              const pct = Math.min(Math.round(ratio * 100), 150);
              const barPct = Math.min(pct, 100);

              return (
                <div key={m.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{m.label}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={isAbove ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {m.yourValue} {m.unit}
                      </span>
                      <span className="text-muted-foreground">/ متوسط: {m.avgValue} {m.unit}</span>
                      {isAbove ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-amber-500" />
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted/40 rounded-full overflow-hidden">
                    {/* Average marker */}
                    <div className="absolute top-0 bottom-0 w-px bg-border z-10" style={{ left: '66%' }} />
                    {/* Your bar */}
                    <div
                      className={`absolute inset-y-0 right-0 rounded-full transition-all duration-700 ${isAbove ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(barPct * 0.66, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> أنت</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-border" /> متوسط المنصة</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
