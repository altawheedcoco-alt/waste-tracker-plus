import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, CheckCircle2, Clock, AlertTriangle, Shield, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HealthMetric {
  label: string;
  score: number;
  maxScore: number;
  icon: typeof Activity;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

const OperationalHealthScore = () => {
  const { organization } = useAuth();

  const { data: metrics } = useQuery({
    queryKey: ['health-score', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [shipmentsRes, pendingRes, overdueRes] = await Promise.all([
        supabase.from('shipments').select('id, status', { count: 'exact', head: false })
          .eq('generator_id', organization!.id)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('shipments').select('id', { count: 'exact', head: true })
          .eq('generator_id', organization!.id)
          .eq('status', 'new'),
        supabase.from('shipments').select('id', { count: 'exact', head: true })
          .eq('generator_id', organization!.id)
          .eq('status', 'new')
          .lt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
      ]);

      const total = shipmentsRes.data?.length || 0;
      const confirmed = shipmentsRes.data?.filter(s => s.status === 'confirmed').length || 0;
      const pending = pendingRes.count || 0;
      const overdue = overdueRes.count || 0;

      const completionRate = total > 0 ? Math.round((confirmed / total) * 100) : 100;
      const pendingRate = total > 0 ? Math.max(0, 100 - Math.round((pending / Math.max(total, 1)) * 100)) : 100;
      const overdueScore = Math.max(0, 100 - (overdue * 20));
      const activityScore = Math.min(100, total * 5);

      return { completionRate, pendingRate, overdueScore, activityScore, total, pending, overdue };
    },
    staleTime: 5 * 60 * 1000,
  });

  const healthMetrics: HealthMetric[] = useMemo(() => {
    const m = metrics || { completionRate: 0, pendingRate: 0, overdueScore: 0, activityScore: 0 };
    return [
      { label: 'معدل الإنجاز', score: m.completionRate, maxScore: 100, icon: CheckCircle2, status: m.completionRate >= 80 ? 'excellent' : m.completionRate >= 60 ? 'good' : 'warning' },
      { label: 'سرعة المعالجة', score: m.pendingRate, maxScore: 100, icon: Clock, status: m.pendingRate >= 80 ? 'excellent' : m.pendingRate >= 50 ? 'good' : 'warning' },
      { label: 'عدم التأخير', score: m.overdueScore, maxScore: 100, icon: AlertTriangle, status: m.overdueScore >= 80 ? 'excellent' : m.overdueScore >= 50 ? 'good' : 'critical' },
      { label: 'مستوى النشاط', score: m.activityScore, maxScore: 100, icon: TrendingUp, status: m.activityScore >= 60 ? 'excellent' : m.activityScore >= 30 ? 'good' : 'warning' },
    ];
  }, [metrics]);

  const overallScore = useMemo(() => {
    if (!healthMetrics.length) return 0;
    return Math.round(healthMetrics.reduce((s, m) => s + m.score, 0) / healthMetrics.length);
  }, [healthMetrics]);

  const overallStatus = overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : overallScore >= 40 ? 'warning' : 'critical';
  const statusConfig = {
    excellent: { label: 'ممتاز', color: 'bg-green-500', badge: 'default' as const },
    good: { label: 'جيد', color: 'bg-blue-500', badge: 'secondary' as const },
    warning: { label: 'تحسين', color: 'bg-yellow-500', badge: 'outline' as const },
    critical: { label: 'حرج', color: 'bg-destructive', badge: 'destructive' as const },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            مؤشر الصحة التشغيلية
          </CardTitle>
          <Badge variant={statusConfig[overallStatus].badge}>
            {statusConfig[overallStatus].label} {overallScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall score ring */}
        <div className="flex items-center justify-center mb-2">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                strokeDasharray={`${(overallScore / 100) * 213.6} 213.6`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{overallScore}</span>
            </div>
          </div>
        </div>

        {healthMetrics.map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{m.label}</span>
              </div>
              <span className="font-medium">{m.score}%</span>
            </div>
            <Progress value={m.score} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OperationalHealthScore;
