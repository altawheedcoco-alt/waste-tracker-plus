/**
 * ودجة تحليل الإيرادات — خاص بمكتب النقل
 * يعرض توزيع الإيرادات والمصروفات
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const RevenueBreakdownWidget = () => {
  const { organization } = useAuth();

  const { data: revenue } = useQuery({
    queryKey: ['transport-office-revenue', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('entry_type, amount, entry_category')
        .eq('organization_id', organization.id)
        .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(500);

      if (!ledger?.length) return null;

      const income = ledger
        .filter((e: any) => e.entry_type === 'credit')
        .reduce((a, e: any) => a + Math.abs(Number(e.amount) || 0), 0);
      const expenses = ledger
        .filter((e: any) => e.entry_type === 'debit')
        .reduce((a, e: any) => a + Math.abs(Number(e.amount) || 0), 0);
      const net = income - expenses;
      const margin = income > 0 ? Math.round((net / income) * 100) : 0;

      return { income, expenses, net, margin, txCount: ledger.length };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          تحليل الإيرادات الشهري
          {revenue && (
            <Badge variant="outline" className={`text-[9px] mr-auto border-0 ${
              revenue.margin >= 0 ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'
            }`}>
              هامش {revenue.margin}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!revenue ? (
          <div className="text-center py-4">
            <DollarSign className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد معاملات مالية</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs">الإيرادات</span>
                </div>
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  {revenue.income.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-xs">المصروفات</span>
                </div>
                <span className="text-sm font-bold text-red-700 dark:text-red-300">
                  {revenue.expenses.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              <div className={`flex items-center justify-between p-2 rounded-lg ${revenue.net >= 0 ? 'bg-primary/5' : 'bg-destructive/5'}`}>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className={`h-4 w-4 ${revenue.net >= 0 ? 'text-primary' : 'text-destructive'}`} />
                  <span className="text-xs font-medium">صافي الربح</span>
                </div>
                <span className={`text-sm font-bold ${revenue.net >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {revenue.net.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {revenue.txCount} معاملة في آخر 30 يوم
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueBreakdownWidget;
