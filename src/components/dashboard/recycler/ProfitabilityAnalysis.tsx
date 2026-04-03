/**
 * تحليل الربحية — خاص بالمدورين
 * يعرض تحليل الإيرادات مقابل التكاليف لكل نوع مادة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ProfitabilityAnalysis = () => {
  const { organization } = useAuth();

  const { data: profitData } = useQuery({
    queryKey: ['recycler-profitability', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('entry_type, entry_category, amount, created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      if (!ledger?.length) return null;

      let totalRevenue = 0;
      let totalCost = 0;

      ledger.forEach((entry: any) => {
        if (entry.entry_type === 'credit' || entry.entry_category === 'revenue') {
          totalRevenue += Math.abs(Number(entry.amount) || 0);
        } else {
          totalCost += Math.abs(Number(entry.amount) || 0);
        }
      });

      const profit = totalRevenue - totalCost;
      const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

      return {
        totalRevenue: Math.round(totalRevenue),
        totalCost: Math.round(totalCost),
        profit: Math.round(profit),
        margin,
        transactionCount: ledger.length,
        isProfit: profit >= 0,
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          تحليل الربحية
          {profitData && (
            <Badge 
              variant="outline" 
              className={`text-[9px] mr-auto border-0 ${profitData.isProfit ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}
            >
              {profitData.isProfit ? 'ربح' : 'خسارة'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!profitData ? (
          <div className="text-center py-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد بيانات مالية كافية</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-lg bg-primary/5">
              <div className={`text-2xl font-bold ${profitData.isProfit ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {profitData.isProfit ? '+' : ''}{profitData.profit.toLocaleString('ar-EG')} ج.م
              </div>
              <p className="text-[10px] text-muted-foreground">صافي الربح — آخر 30 يوم</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-green-500/10 text-center">
                <TrendingUp className="h-3.5 w-3.5 text-green-600 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-700 dark:text-green-300">
                  {profitData.totalRevenue.toLocaleString('ar-EG')}
                </div>
                <p className="text-[9px] text-muted-foreground">إيرادات</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10 text-center">
                <TrendingDown className="h-3.5 w-3.5 text-red-600 mx-auto mb-1" />
                <div className="text-sm font-bold text-red-700 dark:text-red-300">
                  {profitData.totalCost.toLocaleString('ar-EG')}
                </div>
                <p className="text-[9px] text-muted-foreground">تكاليف</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
              <span className="text-muted-foreground">هامش الربح</span>
              <span className={`font-bold ${profitData.margin >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {profitData.margin}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitabilityAnalysis;
