import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Star } from 'lucide-react';

interface SLAMetric {
  id: string;
  partner_organization_id: string;
  period_month: string;
  total_shipments: number;
  on_time_pickups: number;
  on_time_deliveries: number;
  avg_pickup_delay_minutes: number;
  avg_delivery_delay_minutes: number;
  weight_accuracy_percentage: number;
  damage_incidents: number;
  complaints_count: number;
  sla_score: number;
  partner?: { name: string };
}

const SLADashboard = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: metrics = [], isLoading: loading } = useQuery({
    queryKey: ['sla-metrics', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_sla_metrics')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('period_month', { ascending: false })
        .limit(20);

      if (!data?.length) return [];

      const partnerIds = [...new Set((data as any[]).map(d => d.partner_organization_id))];
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', partnerIds);

      const nameMap = new Map((orgs || []).map(o => [o.id, o.name]));
      return (data as any[]).map(d => ({
        ...d,
        partner: { name: nameMap.get(d.partner_organization_id) || d.partner_organization_id.slice(0, 8) },
      })) as SLAMetric[];
    },
    enabled: !!organization?.id,
    refetchInterval: 60_000,
  });

  // Aggregate stats
  const avgScore = metrics.length > 0
    ? metrics.reduce((s, m) => s + (m.sla_score || 0), 0) / metrics.length
    : 0;
  const totalShipments = metrics.reduce((s, m) => s + (m.total_shipments || 0), 0);
  const avgOnTimeRate = metrics.length > 0
    ? metrics.reduce((s, m) => s + (m.total_shipments > 0 ? (m.on_time_deliveries / m.total_shipments) * 100 : 0), 0) / metrics.length
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: isAr ? 'ممتاز' : 'Excellent', variant: 'default' as const };
    if (score >= 70) return { label: isAr ? 'جيد' : 'Good', variant: 'secondary' as const };
    return { label: isAr ? 'يحتاج تحسين' : 'Needs Improvement', variant: 'destructive' as const };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5 text-primary" />
          {isAr ? 'مؤشرات مستوى الخدمة (SLA)' : 'Service Level Agreement (SLA)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-primary/5 border">
            <Gauge className={`w-8 h-8 mx-auto mb-2 ${getScoreColor(avgScore)}`} />
            <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>{avgScore.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'متوسط SLA' : 'Avg SLA Score'}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-500/5 border">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold text-emerald-600">{avgOnTimeRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'التسليم في الموعد' : 'On-Time Delivery'}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-blue-500/5 border">
            <Star className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">{totalShipments}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي الشحنات' : 'Total Shipments'}</p>
          </div>
        </div>

        {/* Per-Partner Breakdown */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gauge className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد بيانات SLA بعد. ستظهر تلقائياً مع تنفيذ الشحنات.' : 'No SLA data yet. Will appear as shipments are completed.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.map((m) => {
              const badge = getScoreBadge(m.sla_score);
              const onTimeRate = m.total_shipments > 0
                ? ((m.on_time_deliveries / m.total_shipments) * 100)
                : 0;
              return (
                <div key={m.id} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{m.partner?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.period_month).toLocaleDateString(isAr ? 'ar-EG' : 'en', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${getScoreColor(m.sla_score)}`}>
                        {m.sla_score}%
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                  <Progress value={m.sla_score} className="h-2 mb-3" />
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span>{isAr ? 'التزام:' : 'On-time:'} {onTimeRate.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-muted-foreground" />
                      <span>{isAr ? 'تأخير:' : 'Delay:'} {m.avg_delivery_delay_minutes}{isAr ? 'د' : 'm'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span>{isAr ? 'دقة الوزن:' : 'Weight:'} {m.weight_accuracy_percentage}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                      <span>{isAr ? 'شكاوى:' : 'Issues:'} {m.complaints_count + m.damage_incidents}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SLADashboard;
