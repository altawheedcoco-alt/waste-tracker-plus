/**
 * SmartInsightsWidget — تنبيهات وتوصيات ذكية تلقائية
 * يحلل نشاط المنظمة ويقدم توصيات قابلة للتنفيذ
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  ArrowRight, Sparkles, Target, ShieldCheck, Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'opportunity' | 'tip';
  title: string;
  description: string;
  action?: { label: string; path: string };
  metric?: { value: string; trend: 'up' | 'down' | 'stable' };
  priority: number;
}

const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  opportunity: { icon: Lightbulb, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  tip: { icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
};

const typeLabels = {
  success: 'إنجاز',
  warning: 'تنبيه',
  opportunity: 'فرصة',
  tip: 'نصيحة',
};

export default function SmartInsightsWidget() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;

  const { data: stats } = useQuery({
    queryKey: ['smart-insights-data', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [shipmentsRes, lastMonthRes, pendingRes, partnersRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, status, quantity, unit', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', thisMonth),
        supabase.from('shipments')
          .select('id', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', lastMonth)
          .lt('created_at', thisMonth),
        supabase.from('shipments')
          .select('id', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .in('status', ['new', 'approved'] as any[]),
        supabase.from('organization_partners')
          .select('id', { count: 'exact' })
          .or(`organization_id.eq.${orgId},partner_organization_id.eq.${orgId}`)
          .eq('status', 'active'),
      ]);

      const currentShipments = shipmentsRes.data || [];
      const currentCount = shipmentsRes.count || 0;
      const lastMonthCount = lastMonthRes.count || 0;
      const pendingCount = pendingRes.count || 0;
      const partnersCount = partnersRes.count || 0;
      const completedCount = currentShipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const completionRate = currentCount > 0 ? Math.round((completedCount / currentCount) * 100) : 0;

      return { currentCount, lastMonthCount, pendingCount, partnersCount, completedCount, completionRate };
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const insights = useMemo((): Insight[] => {
    if (!stats) return [];
    const list: Insight[] = [];

    // Growth trend
    if (stats.lastMonthCount > 0) {
      const growth = Math.round(((stats.currentCount - stats.lastMonthCount) / stats.lastMonthCount) * 100);
      if (growth > 20) {
        list.push({
          id: 'growth-up', type: 'success', priority: 1,
          title: 'نمو ملحوظ في النشاط',
          description: `ارتفعت شحناتك ${growth}% مقارنة بالشهر الماضي. استمر!`,
          metric: { value: `+${growth}%`, trend: 'up' },
          action: { label: 'عرض التقارير', path: '/dashboard/reports' },
        });
      } else if (growth < -20) {
        list.push({
          id: 'growth-down', type: 'warning', priority: 2,
          title: 'انخفاض في النشاط',
          description: `انخفضت شحناتك ${Math.abs(growth)}% مقارنة بالشهر الماضي.`,
          metric: { value: `${growth}%`, trend: 'down' },
          action: { label: 'تحليل الأداء', path: '/dashboard/advanced-analytics' },
        });
      }
    }

    // Completion rate
    if (stats.completionRate >= 90) {
      list.push({
        id: 'completion-high', type: 'success', priority: 3,
        title: 'معدل إنجاز ممتاز',
        description: `نسبة إتمام الشحنات ${stats.completionRate}% هذا الشهر.`,
        metric: { value: `${stats.completionRate}%`, trend: 'up' },
      });
    } else if (stats.completionRate < 60 && stats.currentCount > 0) {
      list.push({
        id: 'completion-low', type: 'warning', priority: 1,
        title: 'معدل إنجاز منخفض',
        description: `نسبة إتمام الشحنات ${stats.completionRate}% فقط. راجع الشحنات المعلقة.`,
        metric: { value: `${stats.completionRate}%`, trend: 'down' },
        action: { label: 'الشحنات المعلقة', path: '/dashboard/shipments' },
      });
    }

    // Pending shipments
    if (stats.pendingCount > 5) {
      list.push({
        id: 'pending-high', type: 'warning', priority: 2,
        title: `${stats.pendingCount} شحنات بانتظار الإجراء`,
        description: 'يوجد شحنات معلقة تحتاج متابعة.',
        action: { label: 'متابعة الشحنات', path: '/dashboard/shipments' },
      });
    }

    // Partners
    if (stats.partnersCount < 3) {
      list.push({
        id: 'partners-low', type: 'opportunity', priority: 4,
        title: 'وسّع شبكة شركائك',
        description: 'إضافة شركاء جدد تزيد فرص العمل وتوسع نطاقك.',
        action: { label: 'إضافة شركاء', path: '/dashboard/partners' },
      });
    }

    // Tips
    list.push({
      id: 'tip-analytics', type: 'tip', priority: 5,
      title: 'استفد من التحليلات المتقدمة',
      description: 'تابع أداء منشأتك وقارن مع الفترات السابقة.',
      action: { label: 'التحليلات', path: '/dashboard/advanced-analytics' },
    });

    if (stats.currentCount === 0) {
      list.push({
        id: 'no-activity', type: 'opportunity', priority: 1,
        title: 'ابدأ شهرك بشحنة جديدة',
        description: 'لم تسجل أي شحنات هذا الشهر بعد.',
        action: { label: 'إنشاء شحنة', path: '/dashboard/shipments' },
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [stats]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-5 w-5 text-primary" />
          رؤى وتوصيات ذكية
          {insights.length > 0 && (
            <Badge variant="secondary" className="mr-auto text-xs">{insights.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-4 pb-4">
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Target className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">جاري تحليل بياناتك...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => {
                const config = typeConfig[insight.type];
                const Icon = config.icon;
                return (
                  <div key={insight.id} className={`rounded-lg p-3 ${config.bg} transition-colors`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">{insight.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.badge}`}>
                            {typeLabels[insight.type]}
                          </span>
                          {insight.metric && (
                            <span className="mr-auto flex items-center gap-0.5 text-xs font-semibold">
                              {insight.metric.trend === 'up' ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                              {insight.metric.value}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                        {insight.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 mt-1.5 text-xs"
                            onClick={() => navigate(insight.action!.path)}
                          >
                            {insight.action.label}
                            <ArrowRight className="h-3 w-3 mr-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
