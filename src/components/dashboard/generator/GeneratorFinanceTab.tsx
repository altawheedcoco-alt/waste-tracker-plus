import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Receipt, TrendingUp, TrendingDown, CreditCard,
  FileText, ArrowUpRight, DollarSign, PiggyBank, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const GeneratorFinanceTab = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: finance, isLoading } = useQuery({
    queryKey: ['generator-finance', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

      const [ledgerThisMonth, ledgerLastMonth, pendingInvoices, allInvoices] = await Promise.all([
        supabase.from('accounting_ledger').select('amount, entry_type, entry_category')
          .eq('organization_id', organization.id)
          .gte('entry_date', startOfMonth),
        supabase.from('accounting_ledger').select('amount, entry_type')
          .eq('organization_id', organization.id)
          .gte('entry_date', startOfLastMonth)
          .lte('entry_date', endOfLastMonth),
        supabase.from('invoices').select('id, total_amount')
          .eq('organization_id', organization.id)
          .eq('status', 'pending'),
        supabase.from('invoices').select('id, total_amount, status, created_at, invoice_number')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const thisMonthData = ledgerThisMonth.data || [];
      const lastMonthData = ledgerLastMonth.data || [];

      const totalExpenses = thisMonthData
        .filter(e => e.entry_type === 'debit')
        .reduce((s, e) => s + Math.abs(Number(e.amount) || 0), 0);

      const totalIncome = thisMonthData
        .filter(e => e.entry_type === 'credit')
        .reduce((s, e) => s + Math.abs(Number(e.amount) || 0), 0);

      const lastMonthTotal = lastMonthData
        .filter(e => e.entry_type === 'debit')
        .reduce((s, e) => s + Math.abs(Number(e.amount) || 0), 0);

      const pendingTotal = (pendingInvoices.data || [])
        .reduce((s, i) => s + (Number(i.total_amount) || 0), 0);

      return {
        totalExpenses,
        totalIncome,
        lastMonthExpenses: lastMonthTotal,
        pendingInvoicesCount: pendingInvoices.data?.length || 0,
        pendingTotal,
        recentInvoices: allInvoices.data || [],
        netBalance: totalIncome - totalExpenses,
        expenseTrend: lastMonthTotal > 0 ? Math.round(((totalExpenses - lastMonthTotal) / lastMonthTotal) * 100) : 0,
      };
    },
    enabled: !!organization?.id,
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const stats = [
    {
      label: isAr ? 'مصروفات الشهر' : 'Monthly Expenses',
      value: `${(finance?.totalExpenses || 0).toLocaleString()} ج.م`,
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      trend: finance?.expenseTrend || 0,
    },
    {
      label: isAr ? 'إيرادات الشهر' : 'Monthly Income',
      value: `${(finance?.totalIncome || 0).toLocaleString()} ج.م`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: isAr ? 'صافي الرصيد' : 'Net Balance',
      value: `${(finance?.netBalance || 0).toLocaleString()} ج.م`,
      icon: Wallet,
      color: (finance?.netBalance || 0) >= 0 ? 'text-primary' : 'text-red-500',
      bg: (finance?.netBalance || 0) >= 0 ? 'bg-primary/10' : 'bg-red-500/10',
    },
    {
      label: isAr ? 'فواتير معلقة' : 'Pending Invoices',
      value: `${finance?.pendingInvoicesCount || 0}`,
      subValue: `${(finance?.pendingTotal || 0).toLocaleString()} ج.م`,
      icon: Receipt,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      alert: (finance?.pendingInvoicesCount || 0) > 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.label} className={cn("border-border/50 transition-all hover:shadow-sm", stat.alert && "border-amber-300/50")}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                </div>
                {stat.trend !== undefined && stat.trend !== 0 && (
                  <Badge variant="outline" className={cn("text-[9px]", stat.trend > 0 ? "text-red-500" : "text-emerald-500")}>
                    {stat.trend > 0 ? '+' : ''}{stat.trend}%
                  </Badge>
                )}
              </div>
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              {stat.subValue && <p className="text-[10px] text-muted-foreground">{stat.subValue}</p>}
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={() => navigate('/dashboard/erp/accounting')}>
          <BarChart3 className="w-3.5 h-3.5" />
          {isAr ? 'دفتر الحسابات' : 'Ledger'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={() => navigate('/dashboard/invoices')}>
          <FileText className="w-3.5 h-3.5" />
          {isAr ? 'الفواتير' : 'Invoices'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={() => navigate('/dashboard/deposits')}>
          <PiggyBank className="w-3.5 h-3.5" />
          {isAr ? 'الإيداعات' : 'Deposits'}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs" onClick={() => navigate('/dashboard/wallet')}>
          <CreditCard className="w-3.5 h-3.5" />
          {isAr ? 'المحفظة' : 'Wallet'}
        </Button>
      </div>

      {/* Recent Invoices */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/dashboard/invoices')}>
              {isAr ? 'عرض الكل' : 'View All'} <ArrowUpRight className="w-3 h-3" />
            </Button>
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              {isAr ? 'آخر الفواتير' : 'Recent Invoices'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {(finance?.recentInvoices?.length || 0) === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">{isAr ? 'لا توجد فواتير' : 'No invoices'}</p>
          ) : (
            <div className="space-y-2">
              {finance?.recentInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                  <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'outline'} className="text-[10px]">
                    {inv.status === 'paid' ? (isAr ? 'مدفوعة' : 'Paid') : inv.status === 'pending' ? (isAr ? 'معلقة' : 'Pending') : inv.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-xs font-semibold">{inv.invoice_number || '#'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {inv.total_amount?.toLocaleString()} ج.م
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratorFinanceTab;
