/**
 * RevenueForecast — لوحة التنبؤ المالي
 * تعرض توقعات الإيرادات بناءً على البيانات التاريخية
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, CalendarDays } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function RevenueForecast() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-forecast', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);

      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Aggregate monthly
      const monthlyMap = new Map<string, { income: number; expense: number }>();
      (ledger || []).forEach(l => {
        const d = new Date(l.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const cur = monthlyMap.get(key) || { income: 0, expense: 0 };
        if (l.entry_type === 'credit') cur.income += l.amount;
        else cur.expense += l.amount;
        monthlyMap.set(key, cur);
      });

      // Build sorted array
      const now = new Date();
      const actual: Array<{ month: string; label: string; income: number; expense: number; net: number }> = [];

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const data = monthlyMap.get(key) || { income: 0, expense: 0 };
        actual.push({
          month: key,
          label: MONTHS_AR[d.getMonth()],
          income: Math.round(data.income),
          expense: Math.round(data.expense),
          net: Math.round(data.income - data.expense),
        });
      }

      // Simple linear forecast for 3 months
      const recentIncomes = actual.slice(-6).map(a => a.income);
      const recentExpenses = actual.slice(-6).map(a => a.expense);
      const avgIncome = recentIncomes.reduce((s, v) => s + v, 0) / Math.max(recentIncomes.length, 1);
      const avgExpense = recentExpenses.reduce((s, v) => s + v, 0) / Math.max(recentExpenses.length, 1);

      // Trend calculation
      const incTrend = recentIncomes.length >= 2
        ? (recentIncomes[recentIncomes.length - 1] - recentIncomes[0]) / recentIncomes.length
        : 0;

      const forecast: typeof actual = [];
      for (let i = 1; i <= 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const projIncome = Math.max(Math.round(avgIncome + incTrend * i), 0);
        const projExpense = Math.round(avgExpense);
        forecast.push({
          month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          label: MONTHS_AR[d.getMonth()],
          income: projIncome,
          expense: projExpense,
          net: projIncome - projExpense,
        });
      }

      const totalActualIncome = actual.reduce((s, a) => s + a.income, 0);
      const totalForecastIncome = forecast.reduce((s, f) => s + f.income, 0);

      return { actual, forecast, totalActualIncome, totalForecastIncome, avgIncome: Math.round(avgIncome) };
    },
    enabled: !!orgId,
    staleTime: 30 * 60 * 1000,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      ...data.actual.map(a => ({ ...a, type: 'actual', forecastIncome: undefined as number | undefined })),
      // Bridge point
      { ...data.actual[data.actual.length - 1], forecastIncome: data.actual[data.actual.length - 1]?.income },
      ...data.forecast.map(f => ({ ...f, type: 'forecast', income: undefined as number | undefined, forecastIncome: f.income })),
    ];
  }, [data]);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-primary" />
            التنبؤ المالي
          </CardTitle>
          <div className="flex items-center gap-3 text-xs">
            {data && (
              <>
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  متوسط شهري: {data.avgIncome.toLocaleString()} ج.م
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <CalendarDays className="h-3 w-3" />
                  توقع 3 أشهر: {data.totalForecastIncome.toLocaleString()} ج.م
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] bg-muted/20 rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, direction: 'rtl' }}
                formatter={(val: number, name: string) => [
                  `${val?.toLocaleString() || 0} ج.م`,
                  name === 'income' ? 'الإيراد الفعلي' : name === 'forecastIncome' ? 'التوقع' : name
                ]}
              />
              <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#incomeGrad)" strokeWidth={2} connectNulls={false} />
              <Area type="monotone" dataKey="forecastIncome" stroke="#8b5cf6" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 5" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center justify-center gap-6 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary rounded" /> فعلي</span>
          <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-purple-500 rounded" style={{ borderTop: '1px dashed' }} /> متوقع</span>
        </div>
      </CardContent>
    </Card>
  );
}
