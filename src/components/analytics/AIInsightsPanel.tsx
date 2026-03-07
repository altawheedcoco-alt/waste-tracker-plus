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

interface AIInsightsPanelProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'trend';
  title: string;
  description: string;
  metric?: string;
  change?: number;
}

const AIInsightsPanel = ({ organizationId, dateRange }: AIInsightsPanelProps) => {
  const [expanded, setExpanded] = useState(true);

  const { data: insights, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-insights', organizationId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<Insight[]> => {
      if (!organizationId) return [];

      // Fetch current period data
      const [shipmentsRes, invoicesRes, ledgerRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('id, status, quantity, waste_type, created_at')
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString()),
        supabase
          .from('invoices')
          .select('total_amount, status, created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString()),
        supabase
          .from('accounting_ledger')
          .select('amount, entry_type, entry_category')
          .eq('organization_id', organizationId)
          .gte('entry_date', dateRange.from.toISOString().split('T')[0])
          .lte('entry_date', dateRange.to.toISOString().split('T')[0]),
      ]);

      // Previous period
      const periodLen = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - periodLen);
      const { data: prevShipments } = await supabase
        .from('shipments')
        .select('id, status, quantity')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', dateRange.from.toISOString());

      const shipments = shipmentsRes.data || [];
      const invoices = invoicesRes.data || [];
      const ledger = ledgerRes.data || [];
      const prev = prevShipments || [];

      const results: Insight[] = [];

      // 1. Shipment volume trend
      const currentCount = shipments.length;
      const prevCount = prev.length;
      const volumeChange = prevCount > 0 ? Math.round(((currentCount - prevCount) / prevCount) * 100) : 0;
      
      if (volumeChange > 20) {
        results.push({
          type: 'success',
          title: 'نمو ملحوظ في حجم الشحنات',
          description: `ارتفع عدد الشحنات بنسبة ${volumeChange}% مقارنة بالفترة السابقة. هذا يشير لنمو تشغيلي إيجابي.`,
          metric: `${currentCount} شحنة`,
          change: volumeChange,
        });
      } else if (volumeChange < -20) {
        results.push({
          type: 'warning',
          title: 'انخفاض في حجم الشحنات',
          description: `انخفض عدد الشحنات بنسبة ${Math.abs(volumeChange)}%. يُوصى بمراجعة الشراكات وخطط التوسع.`,
          metric: `${currentCount} شحنة`,
          change: volumeChange,
        });
      }

      // 2. Completion rate
      const confirmed = shipments.filter(s => s.status === 'confirmed' || s.status === 'delivered').length;
      const completionRate = currentCount > 0 ? Math.round((confirmed / currentCount) * 100) : 0;
      
      if (completionRate >= 80) {
        results.push({
          type: 'success',
          title: 'معدل إنجاز ممتاز',
          description: `نسبة الإنجاز ${completionRate}% — أداء تشغيلي متميز يعكس كفاءة الفريق.`,
          metric: `${completionRate}%`,
        });
      } else if (completionRate < 50 && currentCount > 0) {
        results.push({
          type: 'warning',
          title: 'معدل إنجاز منخفض',
          description: `نسبة الإنجاز ${completionRate}% فقط. تحقق من العوائق التشغيلية وأسباب التأخير.`,
          metric: `${completionRate}%`,
        });
      }

      // 3. Revenue insight
      const totalRevenue = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
      const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent');
      const pendingAmount = pendingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);
      
      if (pendingAmount > totalRevenue * 0.4 && pendingAmount > 0) {
        results.push({
          type: 'warning',
          title: 'مدفوعات معلقة كبيرة',
          description: `${pendingInvoices.length} فاتورة معلقة بقيمة ${pendingAmount.toLocaleString('en-US')} ج.م — يُوصى بمتابعة التحصيل.`,
          metric: `${pendingAmount.toLocaleString('en-US')} ج.م`,
        });
      }

      // 4. Expense analysis
      const expenses = ledger.filter(l => l.entry_type === 'debit').reduce((s, l) => s + Math.abs(l.amount), 0);
      if (totalRevenue > 0 && expenses > totalRevenue * 0.8) {
        results.push({
          type: 'warning',
          title: 'هامش ربح ضيق',
          description: `المصروفات تشكل ${Math.round((expenses / totalRevenue) * 100)}% من الإيرادات. راجع بنود التكلفة لتحسين الهامش.`,
          metric: `${Math.round((expenses / totalRevenue) * 100)}%`,
        });
      } else if (totalRevenue > 0 && expenses < totalRevenue * 0.5) {
        results.push({
          type: 'success',
          title: 'هامش ربح صحي',
          description: `نسبة المصروفات ${Math.round((expenses / totalRevenue) * 100)}% فقط من الإيرادات — أداء مالي ممتاز.`,
          metric: `${Math.round(totalRevenue - expenses).toLocaleString('en-US')} ج.م صافي`,
        });
      }

      // 5. Waste type concentration
      const wasteMap: Record<string, number> = {};
      shipments.forEach(s => { wasteMap[s.waste_type || 'other'] = (wasteMap[s.waste_type || 'other'] || 0) + 1; });
      const wasteEntries = Object.entries(wasteMap).sort((a, b) => b[1] - a[1]);
      if (wasteEntries.length > 0 && currentCount > 5) {
        const topType = wasteEntries[0];
        const concentration = Math.round((topType[1] / currentCount) * 100);
        if (concentration > 70) {
          results.push({
            type: 'info',
            title: 'تركّز عالي في نوع نفايات واحد',
            description: `${concentration}% من الشحنات من نوع "${topType[0]}". تنويع الأنواع يقلل المخاطر التشغيلية.`,
            metric: `${topType[0]}: ${concentration}%`,
          });
        }
      }

      // 6. Cancellation alert
      const cancelled = shipments.filter(s => s.status === 'cancelled').length;
      const cancelRate = currentCount > 0 ? Math.round((cancelled / currentCount) * 100) : 0;
      if (cancelRate > 15) {
        results.push({
          type: 'warning',
          title: 'معدل إلغاء مرتفع',
          description: `${cancelRate}% من الشحنات ملغاة (${cancelled} شحنة). حلل أسباب الإلغاء لتحسين العمليات.`,
          metric: `${cancelRate}%`,
        });
      }

      // Always show at least one insight
      if (results.length === 0) {
        results.push({
          type: 'info',
          title: 'أداء مستقر',
          description: 'لا توجد تغييرات جوهرية في هذه الفترة. استمر في مراقبة المؤشرات بانتظام.',
        });
      }

      return results;
    },
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });

  const iconMap = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Lightbulb,
    trend: TrendingUp,
  };

  const colorMap = {
    success: 'text-emerald-600 bg-emerald-100',
    warning: 'text-amber-600 bg-amber-100',
    info: 'text-blue-600 bg-blue-100',
    trend: 'text-purple-600 bg-purple-100',
  };

  const badgeMap = {
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    trend: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">رؤى ذكية</CardTitle>
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
        <CardDescription>تحليل ذكي للبيانات مع توصيات عملية</CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
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
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {insight.change !== undefined && (
                          <Badge variant="outline" className={cn("text-xs", badgeMap[insight.type])}>
                            {insight.change >= 0 ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />}
                            {insight.change >= 0 ? '+' : ''}{insight.change}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      {insight.metric && (
                        <p className="text-sm font-semibold mt-1 text-foreground">{insight.metric}</p>
                      )}
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
