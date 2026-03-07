import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, Lightbulb, RefreshCw, ChevronDown, ChevronUp 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface AIInsightsPanelProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'trend';
  titleKey: string;
  description: string;
  metric?: string;
  change?: number;
}

const AIInsightsPanel = ({ organizationId, dateRange }: AIInsightsPanelProps) => {
  const [expanded, setExpanded] = useState(true);
  const { t, language } = useLanguage();

  const { data: insights, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-insights', organizationId, dateRange.from.toISOString(), dateRange.to.toISOString(), language],
    queryFn: async (): Promise<Insight[]> => {
      if (!organizationId) return [];

      const [shipmentsRes, invoicesRes, ledgerRes] = await Promise.all([
        supabase.from('shipments').select('id, status, quantity, waste_type, created_at')
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', dateRange.from.toISOString()).lte('created_at', dateRange.to.toISOString()),
        supabase.from('invoices').select('total_amount, status, created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.from.toISOString()).lte('created_at', dateRange.to.toISOString()),
        supabase.from('accounting_ledger').select('amount, entry_type, entry_category')
          .eq('organization_id', organizationId)
          .gte('entry_date', dateRange.from.toISOString().split('T')[0]).lte('entry_date', dateRange.to.toISOString().split('T')[0]),
      ]);

      const periodLen = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - periodLen);
      const { data: prevShipments } = await supabase.from('shipments').select('id, status, quantity')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', prevFrom.toISOString()).lte('created_at', dateRange.from.toISOString());

      const shipments = shipmentsRes.data || [];
      const invoices = invoicesRes.data || [];
      const ledger = ledgerRes.data || [];
      const prev = prevShipments || [];
      const results: Insight[] = [];

      const currentCount = shipments.length;
      const prevCount = prev.length;
      const volumeChange = prevCount > 0 ? Math.round(((currentCount - prevCount) / prevCount) * 100) : 0;

      const isAr = language === 'ar';
      
      if (volumeChange > 20) {
        results.push({
          type: 'success', titleKey: 'analytics.insightShipmentGrowth',
          description: isAr 
            ? `ارتفع عدد الشحنات بنسبة ${volumeChange}% مقارنة بالفترة السابقة. هذا يشير لنمو تشغيلي إيجابي.`
            : `Shipment volume increased by ${volumeChange}% compared to the previous period, indicating positive operational growth.`,
          metric: `${currentCount} ${isAr ? 'شحنة' : 'shipments'}`, change: volumeChange,
        });
      } else if (volumeChange < -20) {
        results.push({
          type: 'warning', titleKey: 'analytics.insightShipmentDecline',
          description: isAr
            ? `انخفض عدد الشحنات بنسبة ${Math.abs(volumeChange)}%. يُوصى بمراجعة الشراكات وخطط التوسع.`
            : `Shipment volume decreased by ${Math.abs(volumeChange)}%. Review partnerships and expansion plans.`,
          metric: `${currentCount} ${isAr ? 'شحنة' : 'shipments'}`, change: volumeChange,
        });
      }

      const confirmed = shipments.filter(s => s.status === 'confirmed' || s.status === 'delivered').length;
      const completionRate = currentCount > 0 ? Math.round((confirmed / currentCount) * 100) : 0;
      
      if (completionRate >= 80) {
        results.push({
          type: 'success', titleKey: 'analytics.insightHighCompletion',
          description: isAr
            ? `نسبة الإنجاز ${completionRate}% — أداء تشغيلي متميز يعكس كفاءة الفريق.`
            : `Completion rate at ${completionRate}% — excellent operational performance reflecting team efficiency.`,
          metric: `${completionRate}%`,
        });
      } else if (completionRate < 50 && currentCount > 0) {
        results.push({
          type: 'warning', titleKey: 'analytics.insightLowCompletion',
          description: isAr
            ? `نسبة الإنجاز ${completionRate}% فقط. تحقق من العوائق التشغيلية وأسباب التأخير.`
            : `Completion rate is only ${completionRate}%. Check operational bottlenecks and delay causes.`,
          metric: `${completionRate}%`,
        });
      }

      const totalRevenue = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
      const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
      const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
      
      if (pendingAmount > totalRevenue * 0.4 && pendingAmount > 0) {
        results.push({
          type: 'warning', titleKey: 'analytics.insightPendingPayments',
          description: isAr
            ? `${pendingInvoices.length} فاتورة معلقة بقيمة ${pendingAmount.toLocaleString('en-US')} ج.م — يُوصى بمتابعة التحصيل.`
            : `${pendingInvoices.length} pending invoices worth ${pendingAmount.toLocaleString('en-US')} EGP — follow up on collection.`,
          metric: `${pendingAmount.toLocaleString('en-US')} ${t('analytics.egp')}`,
        });
      }

      const expenses = ledger.filter(l => l.entry_type === 'debit').reduce((s, l) => s + Math.abs(l.amount), 0);
      if (totalRevenue > 0 && expenses > totalRevenue * 0.8) {
        results.push({
          type: 'warning', titleKey: 'analytics.insightThinMargin',
          description: isAr
            ? `المصروفات تشكل ${Math.round((expenses / totalRevenue) * 100)}% من الإيرادات. راجع بنود التكلفة لتحسين الهامش.`
            : `Expenses are ${Math.round((expenses / totalRevenue) * 100)}% of revenue. Review cost items to improve margins.`,
          metric: `${Math.round((expenses / totalRevenue) * 100)}%`,
        });
      } else if (totalRevenue > 0 && expenses < totalRevenue * 0.5) {
        results.push({
          type: 'success', titleKey: 'analytics.insightHealthyMargin',
          description: isAr
            ? `نسبة المصروفات ${Math.round((expenses / totalRevenue) * 100)}% فقط من الإيرادات — أداء مالي ممتاز.`
            : `Expenses are only ${Math.round((expenses / totalRevenue) * 100)}% of revenue — excellent financial performance.`,
          metric: `${Math.round(totalRevenue - expenses).toLocaleString('en-US')} ${t('analytics.egp')} ${isAr ? 'صافي' : 'net'}`,
        });
      }

      const cancelled = shipments.filter(s => s.status === 'cancelled').length;
      const cancelRate = currentCount > 0 ? Math.round((cancelled / currentCount) * 100) : 0;
      if (cancelRate > 15) {
        results.push({
          type: 'warning', titleKey: 'analytics.insightHighCancellation',
          description: isAr
            ? `${cancelRate}% من الشحنات ملغاة (${cancelled} شحنة). حلل أسباب الإلغاء لتحسين العمليات.`
            : `${cancelRate}% of shipments cancelled (${cancelled}). Analyze cancellation reasons to improve operations.`,
          metric: `${cancelRate}%`,
        });
      }

      if (results.length === 0) {
        results.push({
          type: 'info', titleKey: 'analytics.insightStablePerformance',
          description: isAr
            ? 'لا توجد تغييرات جوهرية في هذه الفترة. استمر في مراقبة المؤشرات بانتظام.'
            : 'No significant changes in this period. Continue monitoring indicators regularly.',
        });
      }

      return results;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  const iconMap = { success: CheckCircle, warning: AlertTriangle, info: Lightbulb, trend: TrendingUp };
  const colorMap = { success: 'text-emerald-600 bg-emerald-100', warning: 'text-amber-600 bg-amber-100', info: 'text-blue-600 bg-blue-100', trend: 'text-purple-600 bg-purple-100' };
  const badgeMap = { success: 'bg-emerald-100 text-emerald-700 border-emerald-200', warning: 'bg-amber-100 text-amber-700 border-amber-200', info: 'bg-blue-100 text-blue-700 border-blue-200', trend: 'bg-purple-100 text-purple-700 border-purple-200' };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{t('analytics.aiInsights')}</CardTitle>
            <Badge variant="outline" className="text-xs">AI</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <CardDescription>{t('analytics.aiInsightsDesc')}</CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {insights?.map((insight, i) => {
                const Icon = iconMap[insight.type];
                const colors = colorMap[insight.type].split(' ');
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className={cn("p-2 rounded-full h-fit", colors[1])}>
                      <Icon className={cn("h-4 w-4", colors[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{t(insight.titleKey)}</h4>
                        {insight.change !== undefined && (
                          <Badge variant="outline" className={cn("text-xs", badgeMap[insight.type])}>
                            {insight.change >= 0 ? <TrendingUp className="h-3 w-3 ml-1 rtl:ml-1 ltr:mr-1" /> : <TrendingDown className="h-3 w-3 ml-1 rtl:ml-1 ltr:mr-1" />}
                            {insight.change >= 0 ? '+' : ''}{insight.change}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      {insight.metric && <p className="text-sm font-semibold mt-1 text-foreground">{insight.metric}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AIInsightsPanel;
