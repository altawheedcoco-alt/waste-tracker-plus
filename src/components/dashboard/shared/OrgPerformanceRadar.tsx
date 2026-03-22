import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';

interface RadarAxis {
  metric: string;
  value: number;
  benchmark: number;
  fullMark: number;
}

const OrgPerformanceRadar = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  // 1) Shipment stats - operational & recycling
  const { data: shipmentStats, isLoading: l1 } = useQuery({
    queryKey: ['org-radar-shipments', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data } = await supabase
        .from('shipments')
        .select('id, status, quantity, disposal_type, created_at, confirmed_at')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .gte('created_at', thirtyDaysAgo)
        .limit(500);

      const rows = (data || []) as any[];
      const total = rows.length;
      const completed = rows.filter(s => ['delivered', 'confirmed', 'completed'].includes(s.status)).length;
      const totalQty = rows.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      const recycled = rows.filter(s => s.disposal_type === 'recycling').reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

      const responseTimes = rows
        .filter(s => s.confirmed_at)
        .map(s => (new Date(s.confirmed_at).getTime() - new Date(s.created_at).getTime()) / 3600000);
      const avgResponseHrs = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 48;

      return {
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        recyclingRate: totalQty > 0 ? Math.round((recycled / totalQty) * 100) : 0,
        avgResponseHrs: Math.round(avgResponseHrs),
      };
    },
    enabled: !!orgId,
    staleTime: 300000,
  });

  // 2) Partner ratings
  const { data: ratingStats, isLoading: l2 } = useQuery({
    queryKey: ['org-radar-ratings', orgId],
    queryFn: async () => {
      if (!orgId) return { avgRating: 70 };
      const { data } = await supabase
        .from('partner_ratings')
        .select('overall_rating')
        .eq('rated_organization_id', orgId)
        .limit(100);
      const ratings = ((data || []) as any[]).map(r => r.overall_rating);
      return {
        avgRating: ratings.length > 0 ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 20) : 70,
      };
    },
    enabled: !!orgId,
    staleTime: 300000,
  });

  // 3) Financial (invoices)
  const { data: financialStats, isLoading: l3 } = useQuery({
    queryKey: ['org-radar-financial', orgId],
    queryFn: async () => {
      if (!orgId) return { score: 75 };
      const { data } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('organization_id', orgId)
        .limit(100);
      const rows = (data || []) as any[];
      if (rows.length === 0) return { score: 75 };
      const paid = rows.filter(i => i.status === 'paid').length;
      return { score: Math.round((paid / rows.length) * 100) };
    },
    enabled: !!orgId,
    staleTime: 300000,
  });

  // 4) Training (driver_enrollments or lms_enrollments)
  const { data: trainingStats, isLoading: l4 } = useQuery({
    queryKey: ['org-radar-training', orgId],
    queryFn: async () => {
      if (!orgId) return { score: 60 };
      const { data } = await supabase
        .from('driver_enrollments')
        .select('id, status')
        .eq('organization_id', orgId)
        .limit(200);
      const rows = (data || []) as any[];
      if (rows.length === 0) return { score: 60 };
      const completed = rows.filter(e => e.status === 'completed').length;
      return { score: Math.round((completed / rows.length) * 100) };
    },
    enabled: !!orgId,
    staleTime: 300000,
  });

  // 5) Safety inspections
  const { data: safetyStats, isLoading: l5 } = useQuery({
    queryKey: ['org-radar-safety', orgId],
    queryFn: async () => {
      if (!orgId) return { score: 85 };
      const { data } = await supabase
        .from('safety_inspections')
        .select('id, compliance_score')
        .eq('organization_id', orgId)
        .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
        .limit(50);
      const rows = (data || []) as any[];
      if (rows.length === 0) return { score: 85 };
      const avg = rows.reduce((sum, r) => sum + (Number(r.compliance_score) || 80), 0) / rows.length;
      return { score: Math.round(avg) };
    },
    enabled: !!orgId,
    staleTime: 300000,
  });

  // 6) Compliance (compliance scores from entity_compliance_scores or fallback)
  const { data: complianceStats, isLoading: l6 } = useQuery({
    queryKey: ['org-radar-compliance', orgId],
    queryFn: async () => {
      if (!orgId) return { score: 65 };
      // Query shipments directly since mv_organization_summary may not exist
      const [totalRes, completedRes] = await Promise.all([
        supabase.from('shipments').select('id', { count: 'exact', head: true })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`),
        supabase.from('shipments').select('id', { count: 'exact', head: true })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
          .in('status', ['delivered', 'confirmed']),
      ]);
      const total = totalRes.count || 0;
      const completed = completedRes.count || 0;
      return { score: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 65 };
    },
    enabled: !!orgId,
    staleTime: 300000,
    refetchInterval: 60000,
  });

  const isLoading = l1 || l2 || l3 || l4 || l5 || l6;

  const radarData: RadarAxis[] = useMemo(() => [
    { metric: 'الامتثال البيئي', value: clamp(complianceStats?.score || 0), benchmark: 75, fullMark: 100 },
    { metric: 'النشاط التشغيلي', value: clamp(shipmentStats?.completionRate || 0), benchmark: 80, fullMark: 100 },
    { metric: 'الأداء المالي', value: clamp(financialStats?.score || 0), benchmark: 70, fullMark: 100 },
    { metric: 'إعادة التدوير', value: clamp(shipmentStats?.recyclingRate || 0), benchmark: 60, fullMark: 100 },
    { metric: 'رضا الشركاء', value: clamp(ratingStats?.avgRating || 0), benchmark: 75, fullMark: 100 },
    { metric: 'الاستجابة', value: clamp(shipmentStats?.avgResponseHrs ? Math.max(0, 100 - shipmentStats.avgResponseHrs * 2) : 50), benchmark: 70, fullMark: 100 },
    { metric: 'التدريب', value: clamp(trainingStats?.score || 0), benchmark: 65, fullMark: 100 },
    { metric: 'السلامة', value: clamp(safetyStats?.score || 0), benchmark: 85, fullMark: 100 },
  ], [shipmentStats, ratingStats, complianceStats, trainingStats, financialStats, safetyStats]);

  const overallScore = useMemo(() => {
    return Math.round(radarData.reduce((sum, d) => sum + d.value, 0) / radarData.length);
  }, [radarData]);

  const overallBenchmark = useMemo(() => {
    return Math.round(radarData.reduce((sum, d) => sum + d.benchmark, 0) / radarData.length);
  }, [radarData]);

  const weakAxes = radarData.filter(d => d.value < d.benchmark).sort((a, b) => a.value - b.value);
  const strongAxes = radarData.filter(d => d.value >= d.benchmark).sort((a, b) => b.value - a.value);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Target className="w-5 h-5" /> رادار الأداء</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[350px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={overallScore >= overallBenchmark ? 'default' : 'secondary'} className="gap-1 text-sm font-bold">
            {overallScore >= overallBenchmark ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {overallScore}%
          </Badge>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-primary" />
            رادار أداء الجهة
          </CardTitle>
        </div>
        <CardDescription className="text-right text-xs">
          تحليل شامل لـ 8 محاور أداء مقارنة بمتوسط القطاع
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
            <Radar
              name="متوسط القطاع"
              dataKey="benchmark"
              stroke="hsl(var(--muted-foreground))"
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.1}
              strokeDasharray="5 5"
            />
            <Radar
              name="أداء الجهة"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                direction: 'rtl',
              }}
              formatter={(val: number, name: string) => [`${val}%`, name]}
            />
            <Legend wrapperStyle={{ direction: 'rtl', fontSize: '12px' }} />
          </RadarChart>
        </ResponsiveContainer>

        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {weakAxes.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-xs font-semibold text-destructive mb-2 text-right flex items-center gap-1 justify-end">
                <TrendingDown className="w-3.5 h-3.5" />
                نقاط تحتاج تحسين
              </p>
              <div className="space-y-1">
                {weakAxes.slice(0, 3).map(axis => (
                  <div key={axis.metric} className="flex items-center justify-between text-xs">
                    <span className="text-destructive font-medium">{axis.value}%</span>
                    <span className="text-muted-foreground">{axis.metric}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {strongAxes.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary mb-2 text-right flex items-center gap-1 justify-end">
                <TrendingUp className="w-3.5 h-3.5" />
                نقاط القوة
              </p>
              <div className="space-y-1">
                {strongAxes.slice(0, 3).map(axis => (
                  <div key={axis.metric} className="flex items-center justify-between text-xs">
                    <span className="text-primary font-medium">{axis.value}%</span>
                    <span className="text-muted-foreground">{axis.metric}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export default OrgPerformanceRadar;
