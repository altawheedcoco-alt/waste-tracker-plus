/**
 * CashFlowWaterfallWidget — شلال التدفق النقدي
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function CashFlowWaterfallWidget() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow-waterfall', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const { data } = await supabase
        .from('accounting_ledger')
        .select('entry_type, amount, entry_date')
        .eq('organization_id', orgId!)
        .gte('entry_date', sixMonthsAgo.toISOString().split('T')[0]);
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    const months: Record<string, { income: number; expense: number }> = {};
    data.forEach(e => {
      const m = e.entry_date.substring(0, 7);
      if (!months[m]) months[m] = { income: 0, expense: 0 };
      if (e.entry_type === 'credit') months[m].income += Number(e.amount);
      else months[m].expense += Number(e.amount);
    });
    return Object.entries(months).sort().map(([m, v]) => ({
      month: new Date(m + '-01').toLocaleDateString('ar-EG', { month: 'short' }),
      net: Math.round(v.income - v.expense),
      income: Math.round(v.income),
      expense: Math.round(v.expense),
    }));
  }, [data]);

  if (isLoading) return <Skeleton className="h-[280px] w-full rounded-xl" />;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5 text-primary" />
          شلال التدفق النقدي
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات مالية</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={10} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString('ar-EG')} ج.م`} />
              <Bar dataKey="net" name="الصافي" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.net >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
