/**
 * ودجة تكلفة الكيلوجرام — خاص بالمولدين
 * يعرض متوسط تكلفة التخلص لكل كجم مع توصيات الخفض
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const CostPerKgWidget = () => {
  const { organization } = useAuth();

  const { data: costData } = useQuery({
    queryKey: ['cost-per-kg', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const [shipmentsRes, ledgerRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('actual_weight, quantity')
          .eq('generator_id', organization.id)
          .in('status', ['delivered', 'confirmed'])
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(200),
        supabase
          .from('accounting_ledger')
          .select('amount, entry_type')
          .eq('organization_id', organization.id)
          .eq('entry_type', 'debit')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(500),
      ]);

      const totalWeight = shipmentsRes.data?.reduce((a, s: any) => a + (Number(s.actual_weight || s.quantity) || 0), 0) || 0;
      const totalCost = ledgerRes.data?.reduce((a, e: any) => a + Math.abs(Number(e.amount) || 0), 0) || 0;
      
      const costPerKg = totalWeight > 0 ? totalCost / totalWeight : 0;
      const industryAvg = 2.5; // متوسط صناعي تقديري
      const savings = totalWeight * Math.max(0, costPerKg - industryAvg);

      return {
        costPerKg: Math.round(costPerKg * 100) / 100,
        totalWeight: Math.round(totalWeight),
        totalCost: Math.round(totalCost),
        industryAvg,
        isAboveAvg: costPerKg > industryAvg,
        potentialSavings: Math.round(savings),
        tips: costPerKg > industryAvg
          ? ['فرز المخلفات قبل النقل', 'التعاقد مع مدور مباشر', 'تقليل عدد الشحنات بالتجميع']
          : ['الحفاظ على مستوى التكلفة الحالي', 'استكشاف فرص التدوير المباشر'],
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          تكلفة الكيلوجرام
          {costData && (
            <Badge 
              variant="outline" 
              className={`text-[9px] mr-auto border-0 ${costData.isAboveAvg ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'bg-green-500/10 text-green-700 dark:text-green-300'}`}
            >
              {costData.isAboveAvg ? 'أعلى من المتوسط' : 'ضمن المتوسط'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!costData ? (
          <div className="text-center py-4">
            <Calculator className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات كافية</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary">
                {costData.costPerKg.toLocaleString('ar-EG')} ج.م/كجم
              </div>
              <p className="text-[10px] text-muted-foreground">
                متوسط الصناعة: {costData.industryAvg} ج.م/كجم
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/20">
                <div className="text-sm font-bold">{costData.totalWeight.toLocaleString('ar-EG')}</div>
                <p className="text-[9px] text-muted-foreground">كجم إجمالي</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/20">
                <div className="text-sm font-bold">{costData.totalCost.toLocaleString('ar-EG')}</div>
                <p className="text-[9px] text-muted-foreground">ج.م تكلفة</p>
              </div>
            </div>

            {costData.tips.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/5 space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  <Lightbulb className="h-3 w-3" />
                  توصيات لخفض التكلفة
                </div>
                {costData.tips.slice(0, 2).map((tip, i) => (
                  <p key={i} className="text-[9px] text-muted-foreground pr-4">• {tip}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CostPerKgWidget;
