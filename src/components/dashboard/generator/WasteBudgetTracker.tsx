/**
 * تتبع ميزانية النفايات السنوية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const WasteBudgetTracker = () => {
  const { organization } = useAuth();

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['generator-budget-tracker', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const { data } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type, entry_date, entry_category')
        .eq('organization_id', organization.id)
        .gte('entry_date', yearStart);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const stats = useMemo(() => {
    const totalSpent = ledgerEntries
      .filter(e => e.entry_type === 'debit')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const totalIncome = ledgerEntries
      .filter(e => e.entry_type === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlySpending: number[] = Array(12).fill(0);
    ledgerEntries.filter(e => e.entry_type === 'debit').forEach(e => {
      const month = new Date(e.entry_date).getMonth();
      monthlySpending[month] += Math.abs(e.amount);
    });

    const currentMonth = new Date().getMonth();
    const avgMonthly = currentMonth > 0 ? totalSpent / (currentMonth + 1) : totalSpent;
    const projectedAnnual = avgMonthly * 12;
    const estimatedBudget = projectedAnnual * 1.1; // 10% buffer

    return { totalSpent, totalIncome, netCost: totalSpent - totalIncome, avgMonthly, projectedAnnual, estimatedBudget, monthlySpending };
  }, [ledgerEntries]);

  const budgetUsed = stats.estimatedBudget > 0 ? (stats.totalSpent / stats.estimatedBudget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Wallet className="h-4 w-4 text-primary" />
          ميزانية النفايات {new Date().getFullYear()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{budgetUsed.toFixed(0)}% مستهلك</span>
            <span className="font-medium">{stats.totalSpent.toLocaleString('ar-EG')} ج.م من {stats.estimatedBudget.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م</span>
          </div>
          <Progress value={Math.min(budgetUsed, 100)} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <p className="text-xs text-muted-foreground">إنفاق شهري متوسط</p>
            <p className="text-sm font-bold text-red-600">{stats.avgMonthly.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م</p>
          </div>
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
            <Target className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">إيرادات (مبيعات مخلفات)</p>
            <p className="text-sm font-bold text-green-600">{stats.totalIncome.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م</p>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-muted/30">
          <div className="flex justify-between items-center">
            <Badge variant={stats.netCost > stats.estimatedBudget * 0.8 ? 'destructive' : 'secondary'} className="text-xs">
              {stats.netCost > stats.estimatedBudget * 0.8 ? (
                <><AlertTriangle className="h-3 w-3 ml-1" /> تحذير</>
              ) : 'طبيعي'}
            </Badge>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">صافي التكلفة</p>
              <p className="text-sm font-bold">{stats.netCost.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WasteBudgetTracker;
