import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useExcelExport } from '@/hooks/useExcelExport';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Area, Cell,
  AreaChart, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, TrendingDown, Download, Calendar, ArrowUpRight,
  ArrowDownRight, Scale, GitCompareArrows, Target, BarChart3, Percent, Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

const COLORS_POSITIVE = '#10b981';
const COLORS_NEGATIVE = '#ef4444';
const COLORS_REVENUE = '#3b82f6';
const COLORS_COST = '#f59e0b';

// Helper: get month range
const getMonthRange = (year: number, month: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: start.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
    shortLabel: start.toLocaleDateString('ar-EG', { month: 'short' }),
  };
};

// Fetch journal aggregates for a date range
const fetchPeriodTotals = async (orgId: string, startDate: string, endDate: string) => {
  const { data: entries } = await supabase
    .from('erp_journal_entries')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'posted')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);
  if (!entries?.length) return { revenue: 0, expenses: 0, cogs: 0, netIncome: 0, items: [] };

  const { data: lines } = await supabase
    .from('erp_journal_lines')
    .select('debit, credit, erp_chart_of_accounts!inner(account_name, account_type, account_code)')
    .in('journal_entry_id', entries.map(e => e.id));

  let revenue = 0, expenses = 0, cogs = 0;
  const itemMap = new Map<string, { name: string; type: string; amount: number }>();

  (lines || []).forEach((l: any) => {
    const acc = l.erp_chart_of_accounts;
    const amount = acc.account_type === 'revenue'
      ? (Number(l.credit) || 0) - (Number(l.debit) || 0)
      : (Number(l.debit) || 0) - (Number(l.credit) || 0);

    if (acc.account_type === 'revenue') revenue += amount;
    else if (acc.account_type === 'expense') {
      expenses += amount;
      if (acc.account_code.startsWith('5')) cogs += amount;
    }

    const existing = itemMap.get(acc.account_name) || { name: acc.account_name, type: acc.account_type, amount: 0 };
    existing.amount += amount;
    itemMap.set(acc.account_name, existing);
  });

  return { revenue, expenses, cogs, netIncome: revenue - expenses, items: Array.from(itemMap.values()) };
};

const ERPFinancialComparisons = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const { exportToExcel, isExporting } = useExcelExport({ filename: 'مقارنات-مالية' });

  const now = new Date();
  const [tab, setTab] = useState('mom');

  // MoM / YoY states
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Budget state
  const [budgetRevenue, setBudgetRevenue] = useState(0);
  const [budgetExpenses, setBudgetExpenses] = useState(0);

  // Fetch last 13 months for MoM + YoY
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ['erp-comparisons-monthly', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const results = [];
      for (let i = 12; i >= 0; i--) {
        const m = new Date(currentYear, currentMonth - i, 1);
        const range = getMonthRange(m.getFullYear(), m.getMonth());
        const totals = await fetchPeriodTotals(orgId, range.start, range.end);
        results.push({ ...range, ...totals, month: m.getMonth(), year: m.getFullYear() });
      }
      return results;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Same month last year for YoY
  const { data: lastYearSameMonth } = useQuery({
    queryKey: ['erp-yoy-comparison', orgId, currentMonth, currentYear],
    queryFn: async () => {
      if (!orgId) return null;
      const range = getMonthRange(currentYear - 1, currentMonth);
      return { ...range, ...(await fetchPeriodTotals(orgId, range.start, range.end)) };
    },
    enabled: !!orgId,
  });

  const current = monthlyData?.[monthlyData.length - 1];
  const previous = monthlyData?.[monthlyData.length - 2];

  const calcChange = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / Math.abs(prev)) * 100;

  const fmt = (v: number) => v.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

  // MoM comparison table data
  const momRows = useMemo(() => {
    if (!current || !previous) return [];
    return [
      { label: 'إجمالي الإيرادات', current: current.revenue, previous: previous.revenue },
      { label: 'تكلفة البضاعة المباعة (COGS)', current: current.cogs, previous: previous.cogs },
      { label: 'إجمالي المصروفات', current: current.expenses, previous: previous.expenses },
      { label: 'صافي الربح', current: current.netIncome, previous: previous.netIncome },
    ].map(r => ({
      ...r,
      change: calcChange(r.current, r.previous),
      status: r.label.includes('مصروف') || r.label.includes('تكلفة')
        ? (r.current <= r.previous ? 'improved' : 'declined')
        : (r.current >= r.previous ? 'improved' : 'declined'),
    }));
  }, [current, previous]);

  // YoY comparison
  const yoyRows = useMemo(() => {
    if (!current || !lastYearSameMonth) return [];
    return [
      { label: 'إجمالي الإيرادات', current: current.revenue, previous: lastYearSameMonth.revenue },
      { label: 'تكلفة البضاعة المباعة (COGS)', current: current.cogs, previous: lastYearSameMonth.cogs },
      { label: 'إجمالي المصروفات', current: current.expenses, previous: lastYearSameMonth.expenses },
      { label: 'صافي الربح', current: current.netIncome, previous: lastYearSameMonth.netIncome },
    ].map(r => ({
      ...r,
      change: calcChange(r.current, r.previous),
      status: r.label.includes('مصروف') || r.label.includes('تكلفة')
        ? (r.current <= r.previous ? 'improved' : 'declined')
        : (r.current >= r.previous ? 'improved' : 'declined'),
    }));
  }, [current, lastYearSameMonth]);

  // Cost vs Revenue trend (last 12 months)
  const costVsRevenueTrend = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.slice(1).map(m => ({
      month: m.shortLabel,
      إيرادات: m.revenue,
      تكاليف: m.expenses,
      فجوة: m.revenue - m.expenses,
    }));
  }, [monthlyData]);

  // Break-even point
  const breakEvenMonth = useMemo(() => {
    if (!costVsRevenueTrend.length) return null;
    const idx = costVsRevenueTrend.findIndex(d => d.فجوة < 0);
    return idx >= 0 ? costVsRevenueTrend[idx].month : null;
  }, [costVsRevenueTrend]);

  // Opex Ratio analytics
  const opexAnalytics = useMemo(() => {
    if (!current || !previous || !monthlyData) return null;

    // Current month opex items (expenses only, excluding COGS which starts with 5)
    const opexItems = current.items
      .filter(i => i.type === 'expense')
      .map(i => ({
        name: i.name,
        amount: i.amount,
        ratioToSales: current.revenue > 0 ? (i.amount / current.revenue * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Previous month opex items for comparison
    const prevItemMap = new Map<string, { name: string; type: string; amount: number }>(previous.items.filter(i => i.type === 'expense').map(i => [i.name, i]));

    const opexItemsWithChange = opexItems.map(item => {
      const prevItem = prevItemMap.get(item.name);
      const prevRatio = prevItem && previous.revenue > 0 ? (prevItem.amount / previous.revenue * 100) : 0;
      return {
        ...item,
        prevAmount: prevItem?.amount || 0,
        prevRatio,
        ratioChange: item.ratioToSales - prevRatio,
        status: item.ratioToSales <= prevRatio ? 'improved' as const : item.ratioToSales === prevRatio ? 'stable' as const : 'declined' as const,
      };
    });

    const totalOpex = current.expenses;
    const opexRatio = current.revenue > 0 ? (totalOpex / current.revenue * 100) : 0;
    const prevOpexRatio = previous.revenue > 0 ? (previous.expenses / previous.revenue * 100) : 0;
    const opexRatioChange = opexRatio - prevOpexRatio;

    // Trend data for area chart
    const opexTrend = monthlyData.slice(1).map(m => ({
      month: m.shortLabel,
      مبيعات: m.revenue,
      'مصاريف تشغيلية': m.expenses,
      'نسبة الكفاءة': m.revenue > 0 ? +(m.expenses / m.revenue * 100).toFixed(1) : 0,
    }));

    return {
      totalOpex,
      opexRatio,
      prevOpexRatio,
      opexRatioChange,
      opexItemsWithChange,
      opexTrend,
    };
  }, [current, previous, monthlyData]);

  // Budget vs Actual
  const budgetComparison = useMemo(() => {
    if (!current) return [];
    return [
      {
        label: 'الإيرادات',
        budget: budgetRevenue,
        actual: current.revenue,
        variance: current.revenue - budgetRevenue,
        variancePct: budgetRevenue > 0 ? ((current.revenue - budgetRevenue) / budgetRevenue * 100) : 0,
        positive: current.revenue >= budgetRevenue,
      },
      {
        label: 'المصروفات',
        budget: budgetExpenses,
        actual: current.expenses,
        variance: current.expenses - budgetExpenses,
        variancePct: budgetExpenses > 0 ? ((current.expenses - budgetExpenses) / budgetExpenses * 100) : 0,
        positive: current.expenses <= budgetExpenses,
      },
      {
        label: 'صافي الربح',
        budget: budgetRevenue - budgetExpenses,
        actual: current.netIncome,
        variance: current.netIncome - (budgetRevenue - budgetExpenses),
        variancePct: (budgetRevenue - budgetExpenses) !== 0 ? ((current.netIncome - (budgetRevenue - budgetExpenses)) / Math.abs(budgetRevenue - budgetExpenses) * 100) : 0,
        positive: current.netIncome >= (budgetRevenue - budgetExpenses),
      },
    ];
  }, [current, budgetRevenue, budgetExpenses]);

  const ComparisonTable = ({ rows, currentLabel, previousLabel }: {
    rows: { label: string; current: number; previous: number; change: number; status: string }[];
    currentLabel: string;
    previousLabel: string;
  }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">البند</TableHead>
          <TableHead className="text-center">{currentLabel}</TableHead>
          <TableHead className="text-center">{previousLabel}</TableHead>
          <TableHead className="text-center">التغير (%)</TableHead>
          <TableHead className="text-center">الحالة</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا توجد بيانات كافية للمقارنة</TableCell></TableRow>
        ) : rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell className="text-right font-medium">{r.label}</TableCell>
            <TableCell className="text-center font-mono">{fmt(r.current)} ج.م</TableCell>
            <TableCell className="text-center font-mono text-muted-foreground">{fmt(r.previous)} ج.م</TableCell>
            <TableCell className="text-center">
              <Badge variant={r.status === 'improved' ? 'default' : 'destructive'} className="gap-1">
                {r.status === 'improved' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {fmtPct(r.change)}
              </Badge>
            </TableCell>
            <TableCell className="text-center">
              {r.status === 'improved' ? '🟢 متحسن' : '🔴 متراجع'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg text-right text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)} ج.م</p>
        ))}
      </div>
    );
  };

  const handleExport = () => {
    const data = momRows.map(r => ({
      البند: r.label,
      'الشهر الحالي': r.current,
      'الشهر السابق': r.previous,
      'التغير (%)': `${fmtPct(r.change)}`,
      الحالة: r.status === 'improved' ? 'متحسن' : 'متراجع',
    }));
    exportToExcel(data, [
      { header: 'البند', key: 'البند', width: 25 },
      { header: 'الشهر الحالي', key: 'الشهر الحالي', width: 18 },
      { header: 'الشهر السابق', key: 'الشهر السابق', width: 18 },
      { header: 'التغير (%)', key: 'التغير (%)', width: 12 },
      { header: 'الحالة', key: 'الحالة', width: 10 },
    ], 'مقارنات-مالية');
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" dir="rtl">
        <BackButton />
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitCompareArrows className="h-7 w-7 text-primary" />
              المقارنات المالية
            </h1>
            <p className="text-muted-foreground">مقارنة شهرية وسنوية • تكلفة مقابل إيراد • ميزانية مقابل فعلي</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting || isLoading}>
            <Download className="ml-2 h-4 w-4" />Excel
          </Button>
        </div>

        {/* KPI Summary */}
        {current && previous && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'نمو الإيرادات (MoM)', value: fmtPct(calcChange(current.revenue, previous.revenue)), positive: current.revenue >= previous.revenue, icon: TrendingUp },
              { label: 'تغير المصروفات (MoM)', value: fmtPct(calcChange(current.expenses, previous.expenses)), positive: current.expenses <= previous.expenses, icon: TrendingDown },
              { label: 'هامش الربح الحالي', value: `${current.revenue > 0 ? ((current.netIncome / current.revenue) * 100).toFixed(1) : 0}%`, positive: current.netIncome > 0, icon: Target },
              { label: 'نقطة التعادل', value: breakEvenMonth ? `تحت التعادل في ${breakEvenMonth}` : 'فوق التعادل ✓', positive: !breakEvenMonth, icon: Scale },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="p-3 text-right">
                  <div className="flex items-center justify-between mb-1">
                    <div className={`p-1.5 rounded-lg ${kpi.positive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <kpi.icon className={`h-4 w-4 ${kpi.positive ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-sm font-bold ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} dir="rtl">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="mom">شهرية (MoM)</TabsTrigger>
            <TabsTrigger value="yoy">سنوية (YoY)</TabsTrigger>
            <TabsTrigger value="cost-revenue">تكلفة vs إيراد</TabsTrigger>
            <TabsTrigger value="opex">الكفاءة التشغيلية</TabsTrigger>
            <TabsTrigger value="budget">ميزانية vs فعلي</TabsTrigger>
          </TabsList>

          {/* MoM Tab */}
          <TabsContent value="mom" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-base">
                  المقارنة الشهرية (Month-over-Month)
                  {current && previous && (
                    <span className="text-sm font-normal text-muted-foreground mr-2">
                      {current.label} مقابل {previous.label}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonTable
                  rows={momRows}
                  currentLabel="الشهر الحالي"
                  previousLabel="الشهر السابق"
                />
              </CardContent>
            </Card>

            {/* MoM Trend Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-base">اتجاه النمو الشهري (آخر 12 شهر)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costVsRevenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="إيرادات" fill={COLORS_REVENUE} radius={[4, 4, 0, 0]} barSize={18} />
                      <Bar dataKey="تكاليف" fill={COLORS_COST} radius={[4, 4, 0, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* YoY Tab */}
          <TabsContent value="yoy" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-base">
                  المقارنة السنوية (Year-over-Year)
                  {current && lastYearSameMonth && (
                    <span className="text-sm font-normal text-muted-foreground mr-2">
                      {current.label} مقابل {lastYearSameMonth.label}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonTable
                  rows={yoyRows}
                  currentLabel={`${new Date().toLocaleDateString('ar-EG', { month: 'long' })} ${currentYear}`}
                  previousLabel={`${new Date().toLocaleDateString('ar-EG', { month: 'long' })} ${currentYear - 1}`}
                />
              </CardContent>
            </Card>

            {/* YoY item-level comparison */}
            {current && lastYearSameMonth && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-right text-base">مقارنة تفصيلية حسب البند</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">البند</TableHead>
                        <TableHead className="text-center">النوع</TableHead>
                        <TableHead className="text-center">{currentYear}</TableHead>
                        <TableHead className="text-center">{currentYear - 1}</TableHead>
                        <TableHead className="text-center">التغير</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {current.items.map((item, i) => {
                        const prevItem = lastYearSameMonth.items.find(p => p.name === item.name);
                        const prev = prevItem?.amount || 0;
                        const change = calcChange(item.amount, prev);
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-right">{item.name}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{item.type === 'revenue' ? 'إيرادات' : 'مصروفات'}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-mono">{fmt(item.amount)}</TableCell>
                            <TableCell className="text-center font-mono text-muted-foreground">{fmt(prev)}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={change >= 0 ? 'default' : 'destructive'}>{fmtPct(change)}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Cost vs Revenue Tab */}
          <TabsContent value="cost-revenue" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-base">التكلفة مقابل الإيراد (آخر 12 شهر)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={costVsRevenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="فجوة" fill={COLORS_POSITIVE + '20'} stroke={COLORS_POSITIVE} strokeWidth={1} name="فجوة الربح" />
                      <Line type="monotone" dataKey="إيرادات" stroke={COLORS_REVENUE} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="تكاليف" stroke={COLORS_NEGATIVE} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {breakEvenMonth && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-lg text-right">
                    <p className="text-sm font-medium text-destructive">
                      ⚠️ تنبيه: التكاليف تجاوزت الإيرادات في شهر {breakEvenMonth} - الفجوة تضيق!
                    </p>
                  </div>
                )}
                {!breakEvenMonth && costVsRevenueTrend.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-right">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      ✅ الإيرادات تتفوق على التكاليف في جميع الأشهر - الوضع المالي سليم
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gap Analysis Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-base">تحليل الفجوة الشهرية</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشهر</TableHead>
                      <TableHead className="text-center">الإيرادات</TableHead>
                      <TableHead className="text-center">التكاليف</TableHead>
                      <TableHead className="text-center">الفجوة</TableHead>
                      <TableHead className="text-center">الهامش %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costVsRevenueTrend.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-right font-medium">{d.month}</TableCell>
                        <TableCell className="text-center font-mono">{fmt(d.إيرادات)}</TableCell>
                        <TableCell className="text-center font-mono">{fmt(d.تكاليف)}</TableCell>
                        <TableCell className={`text-center font-mono font-bold ${d.فجوة >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(d.فجوة)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={d.إيرادات > 0 && (d.فجوة / d.إيرادات * 100) > 20 ? 'default' : 'destructive'}>
                            {d.إيرادات > 0 ? (d.فجوة / d.إيرادات * 100).toFixed(1) : 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opex Ratio Tab */}
          <TabsContent value="opex" className="space-y-4">
            {opexAnalytics && (
              <>
                {/* Opex KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-right">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                          <Percent className="h-5 w-5 text-orange-600" />
                        </div>
                        <Badge variant={opexAnalytics.opexRatioChange <= 0 ? 'default' : 'destructive'} className="gap-1">
                          {opexAnalytics.opexRatioChange <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {fmtPct(opexAnalytics.opexRatioChange)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">نسبة المصاريف التشغيلية للمبيعات</p>
                      <p className={`text-2xl font-bold ${opexAnalytics.opexRatio > 70 ? 'text-red-600' : opexAnalytics.opexRatio > 50 ? 'text-orange-600' : 'text-green-600'}`}>
                        {opexAnalytics.opexRatio.toFixed(1)}%
                      </p>
                      <Progress value={Math.min(opexAnalytics.opexRatio, 100)} className="h-2 mt-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-right">
                      <p className="text-xs text-muted-foreground">إجمالي المبيعات (الشهر الحالي)</p>
                      <p className="text-xl font-bold text-green-600">{fmt(current?.revenue || 0)} ج.م</p>
                      <p className="text-xs text-muted-foreground mt-2">إجمالي المصاريف التشغيلية</p>
                      <p className="text-xl font-bold text-red-600">{fmt(opexAnalytics.totalOpex)} ج.م</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-right">
                      <p className="text-xs text-muted-foreground">الشهر السابق</p>
                      <p className="text-lg font-bold">{opexAnalytics.prevOpexRatio.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground mt-2">التفسير</p>
                      <p className="text-sm">
                        كل <span className="font-bold">1 ج.م</span> مبيعات يُستهلك منه{' '}
                        <span className={`font-bold ${opexAnalytics.opexRatio > 70 ? 'text-red-600' : 'text-green-600'}`}>
                          {(opexAnalytics.opexRatio / 100).toFixed(2)} ج.م
                        </span>{' '}
                        مصاريف تشغيلية
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alert */}
                {opexAnalytics.opexRatioChange > 2 && (
                  <Card className="border-destructive bg-destructive/5">
                    <CardContent className="p-4 text-right">
                      <p className="font-bold text-destructive">⚠️ نسبة المصاريف التشغيلية ارتفعت بـ {opexAnalytics.opexRatioChange.toFixed(1)} نقطة مئوية مقارنة بالشهر السابق</p>
                      <p className="text-sm text-muted-foreground">يُنصح بمراجعة بنود المصاريف أدناه لتحديد مصدر الزيادة</p>
                    </CardContent>
                  </Card>
                )}

                {/* Area Chart: Sales vs Opex trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-right text-base">اتجاه المبيعات مقابل المصاريف التشغيلية (12 شهر)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={opexAnalytics.opexTrend}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                          <YAxis yAxisId="amount" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <YAxis yAxisId="pct" orientation="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                          <Tooltip content={({ active, payload, label }: any) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg text-right text-sm">
                                <p className="font-semibold mb-1">{label}</p>
                                {payload.map((p: any, i: number) => (
                                  <p key={i} style={{ color: p.color }}>
                                    {p.name}: {p.name === 'نسبة الكفاءة' ? `${p.value}%` : `${fmt(p.value)} ج.م`}
                                  </p>
                                ))}
                              </div>
                            );
                          }} />
                          <Legend />
                          <Area yAxisId="amount" type="monotone" dataKey="مبيعات" fill={COLORS_REVENUE + '20'} stroke={COLORS_REVENUE} strokeWidth={2} />
                          <Area yAxisId="amount" type="monotone" dataKey="مصاريف تشغيلية" fill={COLORS_NEGATIVE + '20'} stroke={COLORS_NEGATIVE} strokeWidth={2} />
                          <Line yAxisId="pct" type="monotone" dataKey="نسبة الكفاءة" stroke={COLORS_COST} strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Opex Breakdown Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-right text-base">تفصيل نسبة كل بند تشغيلي من المبيعات</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">البند</TableHead>
                          <TableHead className="text-center">القيمة (ج.م)</TableHead>
                          <TableHead className="text-center">النسبة من المبيعات</TableHead>
                          <TableHead className="text-center">الشهر السابق</TableHead>
                          <TableHead className="text-center">التغير عن الشهر السابق</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {opexAnalytics.opexItemsWithChange.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد بيانات</TableCell></TableRow>
                        ) : (
                          <>
                            {opexAnalytics.opexItemsWithChange.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-right font-medium">{item.name}</TableCell>
                                <TableCell className="text-center font-mono">{fmt(item.amount)}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{item.ratioToSales.toFixed(1)}%</Badge>
                                </TableCell>
                                <TableCell className="text-center font-mono text-muted-foreground">{item.prevRatio.toFixed(1)}%</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant={item.status === 'improved' ? 'default' : item.status === 'stable' ? 'secondary' : 'destructive'} className="gap-1">
                                    {item.status === 'improved' ? <ArrowDownRight className="h-3 w-3" /> : item.status === 'stable' ? null : <ArrowUpRight className="h-3 w-3" />}
                                    {item.ratioChange === 0 ? 'ثابت' : fmtPct(item.ratioChange)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {item.status === 'improved' ? '🟢 متحسن' : item.status === 'stable' ? '⚪ ثابت' : '🔴 تحتاج مراجعة'}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Total Row */}
                            <TableRow className="bg-muted/50 font-bold border-t-2">
                              <TableCell className="text-right">الإجمالي</TableCell>
                              <TableCell className="text-center font-mono">{fmt(opexAnalytics.totalOpex)}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={opexAnalytics.opexRatio > 70 ? 'bg-red-600' : ''}>{opexAnalytics.opexRatio.toFixed(1)}%</Badge>
                              </TableCell>
                              <TableCell className="text-center">{opexAnalytics.prevOpexRatio.toFixed(1)}%</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={opexAnalytics.opexRatioChange <= 0 ? 'default' : 'destructive'}>
                                  {fmtPct(opexAnalytics.opexRatioChange)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {opexAnalytics.opexRatioChange <= 0 ? '🟢' : '🔴'}
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
            {!opexAnalytics && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  لا توجد بيانات كافية لتحليل الكفاءة التشغيلية
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Budget vs Actual Tab */}
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-right text-base">تحديد الميزانية التقديرية للشهر الحالي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label>الإيرادات المستهدفة (ج.م)</Label>
                    <Input
                      type="number"
                      value={budgetRevenue || ''}
                      onChange={(e) => setBudgetRevenue(Number(e.target.value))}
                      placeholder="أدخل الإيرادات المستهدفة..."
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label>المصروفات المخصصة (ج.م)</Label>
                    <Input
                      type="number"
                      value={budgetExpenses || ''}
                      onChange={(e) => setBudgetExpenses(Number(e.target.value))}
                      placeholder="أدخل الميزانية المخصصة للمصاريف..."
                      className="text-right"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {(budgetRevenue > 0 || budgetExpenses > 0) && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-right text-base">الميزانية التقديرية مقابل الفعلية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">البند</TableHead>
                          <TableHead className="text-center">المخصص (Budget)</TableHead>
                          <TableHead className="text-center">الفعلي (Actual)</TableHead>
                          <TableHead className="text-center">الانحراف</TableHead>
                          <TableHead className="text-center">نسبة الانحراف</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetComparison.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-right font-medium">{r.label}</TableCell>
                            <TableCell className="text-center font-mono">{fmt(r.budget)} ج.م</TableCell>
                            <TableCell className="text-center font-mono">{fmt(r.actual)} ج.م</TableCell>
                            <TableCell className={`text-center font-mono font-bold ${r.positive ? 'text-green-600' : 'text-red-600'}`}>
                              {r.variance >= 0 ? '+' : ''}{fmt(r.variance)} ج.م
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={r.positive ? 'default' : 'destructive'}>
                                {fmtPct(r.variancePct)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {r.positive ? '🟢 ضمن الحدود' : '🔴 تجاوز'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Budget vs Actual Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-right text-base">رسم بياني: المخصص مقابل الفعلي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetComparison} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => `${fmt(v)} ج.م`} />
                          <Legend />
                          <Bar dataKey="budget" name="المخصص" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={16} />
                          <Bar dataKey="actual" name="الفعلي" radius={[0, 4, 4, 0]} barSize={16}>
                            {budgetComparison.map((entry, i) => (
                              <Cell key={i} fill={entry.positive ? COLORS_POSITIVE : COLORS_NEGATIVE} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ERPFinancialComparisons;
