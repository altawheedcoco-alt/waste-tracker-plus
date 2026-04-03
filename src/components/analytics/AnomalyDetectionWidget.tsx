/**
 * AnomalyDetectionWidget — كاشف الشذوذ الذكي
 * يكتشف الأنماط غير الطبيعية في العمليات
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Anomaly {
  id: string;
  type: 'weight' | 'frequency' | 'financial' | 'timing';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  metric: string;
  deviation: number;
}

const SEVERITY_STYLES = {
  high: { badge: 'destructive' as const, bg: 'bg-destructive/10', text: 'text-destructive' },
  medium: { badge: 'secondary' as const, bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
  low: { badge: 'outline' as const, bg: 'bg-muted/30', text: 'text-muted-foreground' },
};

export default function AnomalyDetectionWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['anomaly-detection', orgId],
    queryFn: async () => {
      if (!orgId) return { anomalies: [], score: 100 };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Fetch recent and historical shipments
      const [recentRes, historicalRes] = await Promise.all([
        supabase.from('shipments')
          .select('actual_weight, total_value, created_at, status')
          .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('shipments')
          .select('actual_weight, total_value, created_at, status')
          .or(`generator_id.eq.${orgId},recycler_id.eq.${orgId},transporter_id.eq.${orgId}`)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
      ]);

      const recent = recentRes.data || [];
      const historical = historicalRes.data || [];
      const anomalies: Anomaly[] = [];

      // 1. Weight anomaly detection
      const recentWeights = recent.filter(s => s.actual_weight).map(s => s.actual_weight!);
      const histWeights = historical.filter(s => s.actual_weight).map(s => s.actual_weight!);
      if (recentWeights.length > 0 && histWeights.length > 0) {
        const avgRecent = recentWeights.reduce((s, w) => s + w, 0) / recentWeights.length;
        const avgHist = histWeights.reduce((s, w) => s + w, 0) / histWeights.length;
        const deviation = avgHist > 0 ? ((avgRecent - avgHist) / avgHist) * 100 : 0;
        if (Math.abs(deviation) > 30) {
          anomalies.push({
            id: 'weight-1', type: 'weight',
            severity: Math.abs(deviation) > 60 ? 'high' : 'medium',
            title: deviation > 0 ? 'ارتفاع غير طبيعي في الأوزان' : 'انخفاض غير طبيعي في الأوزان',
            description: `متوسط الأوزان ${deviation > 0 ? 'ارتفع' : 'انخفض'} بنسبة ${Math.abs(Math.round(deviation))}% مقارنة بالشهر السابق`,
            metric: `${Math.round(avgRecent)} كجم ← ${Math.round(avgHist)} كجم`,
            deviation: Math.round(deviation),
          });
        }
      }

      // 2. Volume anomaly
      const volDeviation = historical.length > 0 ? ((recent.length - historical.length) / historical.length) * 100 : 0;
      if (Math.abs(volDeviation) > 40) {
        anomalies.push({
          id: 'vol-1', type: 'frequency',
          severity: Math.abs(volDeviation) > 70 ? 'high' : 'medium',
          title: volDeviation > 0 ? 'زيادة مفاجئة في حجم الشحنات' : 'تراجع ملحوظ في حجم الشحنات',
          description: `عدد الشحنات ${volDeviation > 0 ? 'زاد' : 'قل'} بنسبة ${Math.abs(Math.round(volDeviation))}%`,
          metric: `${recent.length} شحنة ← ${historical.length} شحنة`,
          deviation: Math.round(volDeviation),
        });
      }

      // 3. Financial anomaly
      const recentVals = recent.filter(s => s.total_value).map(s => s.total_value!);
      const histVals = historical.filter(s => s.total_value).map(s => s.total_value!);
      if (recentVals.length > 0 && histVals.length > 0) {
        const avgRV = recentVals.reduce((s, v) => s + v, 0) / recentVals.length;
        const avgHV = histVals.reduce((s, v) => s + v, 0) / histVals.length;
        const finDev = avgHV > 0 ? ((avgRV - avgHV) / avgHV) * 100 : 0;
        if (Math.abs(finDev) > 25) {
          anomalies.push({
            id: 'fin-1', type: 'financial',
            severity: Math.abs(finDev) > 50 ? 'high' : 'medium',
            title: 'تغير غير متوقع في متوسط القيمة',
            description: `متوسط قيمة الشحنة ${finDev > 0 ? 'ارتفع' : 'انخفض'} بنسبة ${Math.abs(Math.round(finDev))}%`,
            metric: `${Math.round(avgRV)} ج.م ← ${Math.round(avgHV)} ج.م`,
            deviation: Math.round(finDev),
          });
        }
      }

      // 4. Cancellation rate anomaly
      const recentCancelled = recent.filter(s => s.status === 'cancelled').length;
      const histCancelled = historical.filter(s => s.status === 'cancelled').length;
      const cancelRate = recent.length > 0 ? (recentCancelled / recent.length) * 100 : 0;
      const histCancelRate = historical.length > 0 ? (histCancelled / historical.length) * 100 : 0;
      if (cancelRate > 15 && cancelRate > histCancelRate * 1.5) {
        anomalies.push({
          id: 'cancel-1', type: 'timing',
          severity: cancelRate > 30 ? 'high' : 'medium',
          title: 'ارتفاع معدل الإلغاءات',
          description: `نسبة الإلغاء وصلت ${Math.round(cancelRate)}% مقارنة بـ ${Math.round(histCancelRate)}% سابقاً`,
          metric: `${recentCancelled}/${recent.length} ملغاة`,
          deviation: Math.round(cancelRate - histCancelRate),
        });
      }

      const score = Math.max(0, 100 - anomalies.reduce((s, a) => s + (a.severity === 'high' ? 25 : a.severity === 'medium' ? 10 : 3), 0));

      return { anomalies: anomalies.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.severity] - order[b.severity];
      }), score };
    },
    enabled: !!orgId,
    staleTime: 15 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-5 w-5 text-primary" />
            كاشف الشذوذ الذكي
          </CardTitle>
          {data && (
            <div className="flex items-center gap-2">
              <Badge variant={data.score >= 80 ? 'default' : data.score >= 50 ? 'secondary' : 'destructive'} className="gap-1">
                <Shield className="h-3 w-3" />
                سلامة: {data.score}%
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] bg-muted/20 rounded animate-pulse" />
        ) : data?.anomalies.length ? (
          <div className="space-y-2">
            {data.anomalies.map(a => {
              const style = SEVERITY_STYLES[a.severity];
              return (
                <div key={a.id}
                  className={`p-3 rounded-lg ${style.bg} border border-border/50 cursor-pointer transition-all hover:shadow-sm`}
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{a.title}</p>
                        <Badge variant={style.badge} className="text-[10px] flex-shrink-0">
                          {a.deviation > 0 ? '+' : ''}{a.deviation}%
                        </Badge>
                      </div>
                      {expanded === a.id && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          <p>{a.description}</p>
                          <p className="font-mono text-[10px]">{a.metric}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="h-10 w-10 text-green-500 mb-2" />
            <p className="text-sm font-medium">لا توجد حالات شاذة</p>
            <p className="text-xs text-muted-foreground">كل العمليات تسير بشكل طبيعي</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
