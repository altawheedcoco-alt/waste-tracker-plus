/**
 * CostOptimizationEngine — محرك توصيات تحسين التكلفة
 * يحلل أنماط الإنفاق ويقترح تحسينات
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign, TrendingDown, AlertCircle, Lightbulb,
  ArrowRight, Zap, Truck, Recycle, Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSaving: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  icon: typeof DollarSign;
  action?: { label: string; path: string };
}

const priorityConfig = {
  high: { color: 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200', label: 'عالية' },
  medium: { color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200', label: 'متوسطة' },
  low: { color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200', label: 'منخفضة' },
};

export default function CostOptimizationEngine() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;

  const { data: stats } = useQuery({
    queryKey: ['cost-optimization', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const [shipRes, ledgerRes, pendingRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, status, quantity, unit, waste_type, created_at')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', lastMonth),
        supabase.from('accounting_ledger')
          .select('amount, entry_type, entry_category, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', lastMonth),
        supabase.from('shipments')
          .select('id, created_at', { count: 'exact' })
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .in('status', ['new', 'approved'] as any[]),
      ]);

      const shipments = shipRes.data || [];
      const ledger = ledgerRes.data || [];
      const pendingCount = pendingRes.count || 0;

      const thisMonthShipments = shipments.filter(s => s.created_at >= thisMonth);
      const lastMonthShipments = shipments.filter(s => s.created_at < thisMonth);

      const totalExpense = ledger.filter(l => l.entry_type === 'debit').reduce((s, l) => s + l.amount, 0);
      const totalIncome = ledger.filter(l => l.entry_type === 'credit').reduce((s, l) => s + l.amount, 0);

      const completed = thisMonthShipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
      const completionRate = thisMonthShipments.length > 0 ? (completed / thisMonthShipments.length) * 100 : 100;

      // Waste type diversity
      const wasteTypes = new Set(shipments.map(s => s.waste_type).filter(Boolean));

      // Old pending shipments (> 7 days)
      const oldPending = (pendingRes.data || []).filter(s => {
        const age = (Date.now() - new Date(s.created_at).getTime()) / 86400000;
        return age > 7;
      }).length;

      return {
        totalExpense, totalIncome, pendingCount, completionRate,
        wasteTypeCount: wasteTypes.size, oldPending,
        shipmentCount: thisMonthShipments.length,
        lastMonthCount: lastMonthShipments.length,
      };
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });

  const recommendations = useMemo((): Recommendation[] => {
    if (!stats) return [];
    const list: Recommendation[] = [];

    // Old pending shipments
    if (stats.oldPending > 0) {
      list.push({
        id: 'old-pending', title: 'شحنات معلقة منذ أكثر من أسبوع',
        description: `${stats.oldPending} شحنات لم تتم معالجتها. التأخير يزيد التكاليف التشغيلية.`,
        potentialSaving: 'تقليل 15-20% من تكاليف التأخير',
        priority: 'high', category: 'عمليات', icon: Clock,
        action: { label: 'متابعة الشحنات', path: '/dashboard/shipments' },
      });
    }

    // Low completion rate
    if (stats.completionRate < 70 && stats.shipmentCount > 0) {
      list.push({
        id: 'low-completion', title: 'معدل إنجاز منخفض',
        description: `معدل الإنجاز ${Math.round(stats.completionRate)}% فقط. تحسينه يوفر وقتاً وموارد.`,
        potentialSaving: 'زيادة الكفاءة بنسبة 25%',
        priority: 'high', category: 'كفاءة', icon: Zap,
      });
    }

    // Expense vs income
    if (stats.totalExpense > stats.totalIncome * 0.8 && stats.totalIncome > 0) {
      list.push({
        id: 'expense-ratio', title: 'نسبة مصروفات مرتفعة',
        description: 'المصروفات تشكل أكثر من 80% من الإيرادات. راجع بنود الإنفاق.',
        potentialSaving: `توفير محتمل: ${Math.round(stats.totalExpense * 0.1).toLocaleString()} ج.م`,
        priority: 'medium', category: 'مالية', icon: DollarSign,
        action: { label: 'التقارير المالية', path: '/dashboard/reports' },
      });
    }

    // Low waste diversity
    if (stats.wasteTypeCount < 3 && stats.shipmentCount > 5) {
      list.push({
        id: 'waste-diversity', title: 'تنويع أنواع المخلفات',
        description: 'التعامل مع أنواع متعددة يزيد من فرص الإيرادات.',
        potentialSaving: 'زيادة محتملة 10-15% في الإيرادات',
        priority: 'low', category: 'نمو', icon: Recycle,
      });
    }

    // Batch optimization
    if (stats.shipmentCount > 10) {
      list.push({
        id: 'batch-optimize', title: 'تجميع الشحنات الصغيرة',
        description: 'دمج الشحنات المتقاربة جغرافياً يقلل تكاليف النقل.',
        potentialSaving: 'توفير 10-20% من تكاليف النقل',
        priority: 'medium', category: 'نقل', icon: Truck,
      });
    }

    // General tips
    list.push({
      id: 'digital-docs', title: 'التحول الرقمي للمستندات',
      description: 'استخدم التوقيع الإلكتروني والمستندات الرقمية بدل الورقية.',
      potentialSaving: 'توفير وقت ومال',
      priority: 'low', category: 'تحسين', icon: Lightbulb,
      action: { label: 'مركز المستندات', path: '/dashboard/document-center' },
    });

    return list.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [stats]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="h-5 w-5 text-primary" />
          توصيات تحسين التكلفة
          {recommendations.length > 0 && (
            <Badge variant="secondary" className="mr-auto text-xs">{recommendations.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[340px] px-4 pb-4">
          <div className="space-y-3">
            {recommendations.map(rec => {
              const Icon = rec.icon;
              const pConfig = priorityConfig[rec.priority];
              return (
                <div key={rec.id} className={`rounded-lg p-3 border ${pConfig.color} transition-colors`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{rec.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{rec.category}</Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mr-auto ${pConfig.color}`}>{pConfig.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-1">{rec.description}</p>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">💰 {rec.potentialSaving}</p>
                      {rec.action && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 mt-1.5 text-xs"
                          onClick={() => navigate(rec.action!.path)}
                        >
                          {rec.action.label} <ArrowRight className="h-3 w-3 mr-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
