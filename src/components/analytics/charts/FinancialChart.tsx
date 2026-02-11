import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, eachMonthOfInterval, eachWeekOfInterval, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FinancialChartProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
  revenueChange: number;
  expenseChange: number;
}

const FinancialChart = ({ organizationId, dateRange }: FinancialChartProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['financial-analytics', organizationId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!organizationId) return { summary: null, timeline: [] };

      // Fetch invoices (revenue)
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, status, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      // Fetch accounting ledger (expenses & deposits)
      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type, entry_category, entry_date')
        .eq('organization_id', organizationId)
        .gte('entry_date', dateRange.from.toISOString().split('T')[0])
        .lte('entry_date', dateRange.to.toISOString().split('T')[0]);

      // Previous period for comparison
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - periodLength);
      const { data: prevInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('organization_id', organizationId)
        .gte('created_at', prevFrom.toISOString())
        .lte('created_at', dateRange.from.toISOString());

      const { data: prevLedger } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type')
        .eq('organization_id', organizationId)
        .gte('entry_date', prevFrom.toISOString().split('T')[0])
        .lte('entry_date', dateRange.from.toISOString().split('T')[0]);

      const allInvoices = invoices || [];
      const allLedger = ledger || [];

      const totalRevenue = allInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const pendingPayments = allInvoices
        .filter(i => i.status === 'pending' || i.status === 'sent')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0);
      
      const totalExpenses = allLedger
        .filter(l => l.entry_type === 'debit')
        .reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);

      const prevTotalRevenue = (prevInvoices || []).reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const prevTotalExpenses = (prevLedger || [])
        .filter(l => l.entry_type === 'debit')
        .reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);

      const calcChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100);

      const summary: FinancialSummary = {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingPayments,
        revenueChange: calcChange(totalRevenue, prevTotalRevenue),
        expenseChange: calcChange(totalExpenses, prevTotalExpenses),
      };

      // Build timeline
      const daysDiff = differenceInDays(dateRange.to, dateRange.from);
      const intervals = daysDiff <= 60
        ? eachWeekOfInterval({ start: dateRange.from, end: dateRange.to })
        : eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });

      const timeline = intervals.map(date => {
        const periodEnd = daysDiff <= 60
          ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
          : new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const periodRevenue = allInvoices
          .filter(i => { const d = new Date(i.created_at); return d >= date && d <= periodEnd; })
          .reduce((s, i) => s + (i.total_amount || 0), 0);

        const periodExpenses = allLedger
          .filter(l => {
            if (l.entry_type !== 'debit') return false;
            const d = new Date(l.entry_date);
            return d >= date && d <= periodEnd;
          })
          .reduce((s, l) => s + Math.abs(l.amount || 0), 0);

        return {
          name: format(date, daysDiff <= 60 ? 'dd MMM' : 'MMM yyyy', { locale: ar }),
          revenue: periodRevenue,
          expenses: periodExpenses,
          profit: periodRevenue - periodExpenses,
        };
      });

      return { summary, timeline };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-[350px] w-full" /></CardContent></Card>
      </div>
    );
  }

  const { summary, timeline } = data || { summary: null, timeline: [] };

  const financialCards = [
    { title: 'إجمالي الإيرادات', value: summary?.totalRevenue || 0, change: summary?.revenueChange || 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'إجمالي المصروفات', value: summary?.totalExpenses || 0, change: summary?.expenseChange || 0, icon: CreditCard, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'صافي الربح', value: summary?.netProfit || 0, change: 0, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'مدفوعات معلقة', value: summary?.pendingPayments || 0, change: 0, icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-right">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('en-US')} ج.م
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Financial KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {financialCards.map((card, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold">{card.value.toLocaleString('en-US')} ج.م</p>
                </div>
                <div className={cn("p-2.5 rounded-full", card.bg)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
              </div>
              {card.change !== 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  {card.change >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                  <span className={cn("text-xs font-medium", card.change >= 0 ? "text-emerald-600" : "text-red-600")}>
                    {card.change >= 0 ? '+' : ''}{card.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">مقارنة بالفترة السابقة</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            الإيرادات مقابل المصروفات
          </CardTitle>
          <CardDescription>مقارنة التدفقات المالية عبر الزمن</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={timeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="الإيرادات" fill="hsl(142, 71%, 45%)" fillOpacity={0.1} stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="المصروفات" fill="hsl(0, 84%, 60%)" fillOpacity={0.1} stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" name="صافي الربح" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialChart;
