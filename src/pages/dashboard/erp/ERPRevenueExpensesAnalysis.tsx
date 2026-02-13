import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useExcelExport } from '@/hooks/useExcelExport';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon,
  Download, Calendar, AlertTriangle, ArrowUpRight, ArrowDownRight,
  Flame, Users, Target, Percent, Eye, X
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const getPeriodDates = (period: string) => {
  const now = new Date();
  let start: Date;
  let end = new Date(now);
  switch (period) {
    case 'current-month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'last-month': start = new Date(now.getFullYear(), now.getMonth() - 1, 1); end = new Date(now.getFullYear(), now.getMonth(), 0); break;
    case 'current-quarter': start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
    case 'current-year': start = new Date(now.getFullYear(), 0, 1); break;
    default: start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0], label: `${start.toLocaleDateString('ar-SA')} - ${end.toLocaleDateString('ar-SA')}` };
};

const getMonthlyPeriods = (count: number) => {
  const periods = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    periods.push({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      label: start.toLocaleDateString('ar-SA', { month: 'short', year: 'numeric' }),
      monthKey: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return periods;
};

const ERPRevenueExpensesAnalysis = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [period, setPeriod] = useState('current-year');
  const [drilldownAccount, setDrilldownAccount] = useState<{ name: string; type: string; id: string } | null>(null);
  const { exportToExcel, isExporting } = useExcelExport({ filename: 'تحليل-مالي' });

  const dates = useMemo(() => getPeriodDates(period), [period]);
  const monthlyPeriods = useMemo(() => getMonthlyPeriods(12), []);

  // Fetch all posted journal lines for the period
  const { data: journalData = [], isLoading } = useQuery({
    queryKey: ['erp-analysis-lines', orgId, dates.start, dates.end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: entries, error: e1 } = await supabase
        .from('erp_journal_entries')
        .select('id, entry_date')
        .eq('organization_id', orgId)
        .eq('status', 'posted')
        .gte('entry_date', dates.start)
        .lte('entry_date', dates.end);
      if (e1) throw e1;
      if (!entries?.length) return [];
      const { data: lines, error: e2 } = await supabase
        .from('erp_journal_lines')
        .select('*, erp_chart_of_accounts!inner(id, account_code, account_name, account_type)')
        .in('journal_entry_id', entries.map(e => e.id));
      if (e2) throw e2;
      // Attach entry_date to each line
      const dateMap = new Map(entries.map(e => [e.id, e.entry_date]));
      return (lines || []).map((l: any) => ({ ...l, entry_date: dateMap.get(l.journal_entry_id) }));
    },
    enabled: !!orgId,
  });

  // Fetch previous period for MoM
  const prevDates = useMemo(() => {
    const d = getPeriodDates('last-month');
    return d;
  }, []);

  const { data: prevJournalData = [] } = useQuery({
    queryKey: ['erp-analysis-lines-prev', orgId, prevDates.start, prevDates.end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: entries, error: e1 } = await supabase
        .from('erp_journal_entries')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'posted')
        .gte('entry_date', prevDates.start)
        .lte('entry_date', prevDates.end);
      if (e1) throw e1;
      if (!entries?.length) return [];
      const { data: lines, error: e2 } = await supabase
        .from('erp_journal_lines')
        .select('*, erp_chart_of_accounts!inner(account_name, account_type)')
        .in('journal_entry_id', entries.map(e => e.id));
      if (e2) throw e2;
      return lines || [];
    },
    enabled: !!orgId,
  });

  // Fetch customers count for ARPU
  const { data: customersCount = 0 } = useQuery({
    queryKey: ['erp-customers-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count, error } = await supabase
        .from('erp_sales_orders')
        .select('customer_name', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      if (error) return 1;
      return Math.max(count || 1, 1);
    },
    enabled: !!orgId,
  });

  // Drilldown lines for a specific account
  const { data: drilldownLines = [] } = useQuery({
    queryKey: ['erp-drilldown', orgId, drilldownAccount?.id, dates.start, dates.end],
    queryFn: async () => {
      if (!orgId || !drilldownAccount?.id) return [];
      const { data: entries, error: e1 } = await supabase
        .from('erp_journal_entries')
        .select('id, entry_number, entry_date, description')
        .eq('organization_id', orgId)
        .eq('status', 'posted')
        .gte('entry_date', dates.start)
        .lte('entry_date', dates.end);
      if (e1) throw e1;
      if (!entries?.length) return [];
      const { data: lines, error: e2 } = await supabase
        .from('erp_journal_lines')
        .select('*')
        .eq('account_id', drilldownAccount.id)
        .in('journal_entry_id', entries.map(e => e.id));
      if (e2) throw e2;
      const dateMap = new Map(entries.map(e => [e.id, { date: e.entry_date, number: e.entry_number, desc: e.description }]));
      return (lines || []).map((l: any) => ({ ...l, entry: dateMap.get(l.journal_entry_id) }));
    },
    enabled: !!orgId && !!drilldownAccount?.id,
  });

  // Budget alerts (expense threshold = 80% of revenue)
  const [budgetThreshold] = useState(0.8);

  // Compute analytics
  const analytics = useMemo(() => {
    // Revenue & expenses by account
    const revenueMap = new Map<string, { name: string; amount: number; id: string }>();
    const expenseMap = new Map<string, { name: string; amount: number; id: string; category: string }>();
    let totalRevenue = 0;
    let totalExpenses = 0;

    journalData.forEach((line: any) => {
      const acc = line.erp_chart_of_accounts;
      if (acc.account_type === 'revenue') {
        const existing = revenueMap.get(acc.id) || { name: acc.account_name, amount: 0, id: acc.id };
        existing.amount += (Number(line.credit) || 0) - (Number(line.debit) || 0);
        revenueMap.set(acc.id, existing);
        totalRevenue += (Number(line.credit) || 0) - (Number(line.debit) || 0);
      } else if (acc.account_type === 'expense') {
        const cat = acc.account_code.startsWith('5') ? 'تشغيلية' : acc.account_code.startsWith('6') ? 'إدارية' : 'أخرى';
        const existing = expenseMap.get(acc.id) || { name: acc.account_name, amount: 0, id: acc.id, category: cat };
        existing.amount += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        expenseMap.set(acc.id, existing);
        totalExpenses += (Number(line.debit) || 0) - (Number(line.credit) || 0);
      }
    });

    const revenues = Array.from(revenueMap.values()).sort((a, b) => b.amount - a.amount);
    const expenses = Array.from(expenseMap.values()).sort((a, b) => b.amount - a.amount);

    // Previous period totals for MoM
    let prevRevenue = 0;
    let prevExpenses = 0;
    prevJournalData.forEach((line: any) => {
      const acc = line.erp_chart_of_accounts;
      if (acc.account_type === 'revenue') prevRevenue += (Number(line.credit) || 0) - (Number(line.debit) || 0);
      else if (acc.account_type === 'expense') prevExpenses += (Number(line.debit) || 0) - (Number(line.credit) || 0);
    });

    const revenueMoM = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;
    const expenseMoM = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses * 100) : 0;

    // ARPU
    const arpu = totalRevenue / Math.max(customersCount, 1);

    // Gross Profit Margin
    const cogs = expenses.filter(e => e.category === 'تشغيلية').reduce((s, e) => s + e.amount, 0);
    const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - cogs) / totalRevenue * 100) : 0;

    // Expense-to-Revenue ratio
    const expenseToRevenueRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0;

    // Burn rate (average monthly)
    const monthsInPeriod = Math.max(1, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const burnRate = totalExpenses / monthsInPeriod;

    // Monthly trend data
    const monthlyTrend = new Map<string, { revenue: number; expenses: number }>();
    journalData.forEach((line: any) => {
      if (!line.entry_date) return;
      const d = new Date(line.entry_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyTrend.get(key) || { revenue: 0, expenses: 0 };
      const acc = line.erp_chart_of_accounts;
      if (acc.account_type === 'revenue') existing.revenue += (Number(line.credit) || 0) - (Number(line.debit) || 0);
      else if (acc.account_type === 'expense') existing.expenses += (Number(line.debit) || 0) - (Number(line.credit) || 0);
      monthlyTrend.set(key, existing);
    });

    const trendData = monthlyPeriods.map(p => {
      const data = monthlyTrend.get(p.monthKey) || { revenue: 0, expenses: 0 };
      return { month: p.label, إيرادات: data.revenue, مصروفات: data.expenses, صافي: data.revenue - data.expenses };
    });

    // Expense pie chart data
    const expensePieData = expenses.map((e, i) => ({
      name: e.name,
      value: e.amount,
      color: COLORS[i % COLORS.length],
    }));

    // Revenue pie chart data
    const revenuePieData = revenues.map((r, i) => ({
      name: r.name,
      value: r.amount,
      color: COLORS[i % COLORS.length],
    }));

    // Fixed vs Variable expenses
    const fixedExpenses = expenses.filter(e => e.category === 'إدارية').reduce((s, e) => s + e.amount, 0);
    const variableExpenses = expenses.filter(e => e.category === 'تشغيلية').reduce((s, e) => s + e.amount, 0);
    const otherExpenses = expenses.filter(e => e.category === 'أخرى').reduce((s, e) => s + e.amount, 0);

    // Budget alert
    const budgetOverrun = totalExpenses > totalRevenue * budgetThreshold;

    return {
      revenues, expenses, totalRevenue, totalExpenses,
      revenueMoM, expenseMoM, arpu, grossProfitMargin,
      expenseToRevenueRatio, burnRate,
      trendData, expensePieData, revenuePieData,
      fixedExpenses, variableExpenses, otherExpenses,
      budgetOverrun, netIncome: totalRevenue - totalExpenses,
    };
  }, [journalData, prevJournalData, customersCount, dates, monthlyPeriods, budgetThreshold]);

  const fmt = (v: number) => v.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg text-right text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)} ر.س</p>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              تحليل الإيرادات والمصروفات
            </h1>
            <p className="text-muted-foreground">تحليل مالي تفصيلي مع رسوم بيانية ومؤشرات أداء</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">الشهر الحالي</SelectItem>
                <SelectItem value="last-month">الشهر السابق</SelectItem>
                <SelectItem value="current-quarter">الربع الحالي</SelectItem>
                <SelectItem value="current-year">السنة الحالية</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => {
              const data = [
                ...analytics.revenues.map(r => ({ type: 'إيرادات', name: r.name, amount: r.amount })),
                ...analytics.expenses.map(e => ({ type: 'مصروفات', name: e.name, amount: e.amount })),
              ];
              exportToExcel(data, [
                { header: 'التصنيف', key: 'type', width: 15 },
                { header: 'البند', key: 'name', width: 30 },
                { header: 'المبلغ', key: 'amount', width: 20 },
              ], 'تحليل-إيرادات-مصروفات');
            }} disabled={isExporting}>
              <Download className="ml-2 h-4 w-4" />Excel
            </Button>
          </div>
        </div>

        {/* Budget Alert */}
        <AnimatePresence>
          {analytics.budgetOverrun && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4 flex items-center gap-3 text-right">
                  <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
                  <div>
                    <p className="font-bold text-destructive">⚠️ تنبيه: تجاوز الميزانية!</p>
                    <p className="text-sm text-muted-foreground">
                      المصروفات ({fmt(analytics.totalExpenses)} ر.س) تجاوزت {(budgetThreshold * 100).toFixed(0)}% من الإيرادات ({fmt(analytics.totalRevenue)} ر.س)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: 'إجمالي الإيرادات',
              value: `${fmt(analytics.totalRevenue)} ر.س`,
              change: fmtPct(analytics.revenueMoM),
              positive: analytics.revenueMoM >= 0,
              icon: TrendingUp,
              iconBg: 'bg-green-100 dark:bg-green-900/30',
              iconColor: 'text-green-600',
            },
            {
              label: 'إجمالي المصروفات',
              value: `${fmt(analytics.totalExpenses)} ر.س`,
              change: fmtPct(analytics.expenseMoM),
              positive: analytics.expenseMoM <= 0,
              icon: TrendingDown,
              iconBg: 'bg-red-100 dark:bg-red-900/30',
              iconColor: 'text-red-600',
            },
            {
              label: 'صافي الربح',
              value: `${fmt(analytics.netIncome)} ر.س`,
              positive: analytics.netIncome >= 0,
              icon: DollarSign,
              iconBg: 'bg-blue-100 dark:bg-blue-900/30',
              iconColor: 'text-blue-600',
            },
            {
              label: 'هامش الربح الإجمالي',
              value: `${analytics.grossProfitMargin.toFixed(1)}%`,
              positive: analytics.grossProfitMargin > 30,
              icon: Target,
              iconBg: 'bg-purple-100 dark:bg-purple-900/30',
              iconColor: 'text-purple-600',
            },
            {
              label: 'متوسط الإيراد/عميل',
              value: `${fmt(analytics.arpu)} ر.س`,
              icon: Users,
              iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
              iconColor: 'text-cyan-600',
            },
            {
              label: 'معدل الحرق الشهري',
              value: `${fmt(analytics.burnRate)} ر.س`,
              icon: Flame,
              iconBg: 'bg-orange-100 dark:bg-orange-900/30',
              iconColor: 'text-orange-600',
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-3 text-right">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg ${kpi.iconBg}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
                  </div>
                  {kpi.change && (
                    <Badge variant={kpi.positive ? 'default' : 'destructive'} className="text-[10px] px-1.5">
                      {kpi.change}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-sm font-bold ${kpi.positive === false ? 'text-destructive' : ''}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Expense-to-Revenue ratio bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2 text-right">
              <Badge variant={analytics.expenseToRevenueRatio > 80 ? 'destructive' : analytics.expenseToRevenueRatio > 60 ? 'secondary' : 'default'}>
                {analytics.expenseToRevenueRatio.toFixed(1)}%
              </Badge>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">نسبة المصروفات إلى الإيرادات</span>
              </div>
            </div>
            <Progress value={Math.min(analytics.expenseToRevenueRatio, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground text-right mt-1">
              كل 1 ر.س إيراد يُستهلك منه {(analytics.expenseToRevenueRatio / 100).toFixed(2)} ر.س مصروفات
            </p>
          </CardContent>
        </Card>

        {/* Charts Row 1: Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-right text-base">الاتجاه الشهري - إيرادات مقابل مصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="صافي" fill="#3b82f620" stroke="#3b82f6" strokeWidth={1} />
                  <Bar dataKey="إيرادات" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="مصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="صافي" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row 2: Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue by Source */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-right text-base flex items-center gap-2 justify-end">
                <span>الإيرادات حسب المصدر</span>
                <PieChartIcon className="h-5 w-5 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.revenuePieData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات إيرادات</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[250px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.revenuePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                          {analytics.revenuePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `${fmt(v)} ر.س`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-right text-sm min-w-[140px]">
                    {analytics.revenues.slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-center gap-2 justify-end cursor-pointer hover:opacity-70" onClick={() => setDrilldownAccount({ name: r.name, type: 'revenue', id: r.id })}>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span>{fmt(r.amount)}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate max-w-[90px]">{r.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Structure */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-right text-base flex items-center gap-2 justify-end">
                <span>هيكل المصروفات</span>
                <PieChartIcon className="h-5 w-5 text-red-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.expensePieData.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات مصروفات</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="h-[250px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analytics.expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                          {analytics.expensePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `${fmt(v)} ر.س`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-right text-sm min-w-[140px]">
                    {analytics.expenses.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-center gap-2 justify-end cursor-pointer hover:opacity-70" onClick={() => setDrilldownAccount({ name: e.name, type: 'expense', id: e.id })}>
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span>{fmt(e.amount)}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="truncate max-w-[90px]">{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fixed vs Variable Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-right text-base">المصروفات الثابتة مقابل المتغيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'مصروفات ثابتة (إدارية)', value: analytics.fixedExpenses, color: '#3b82f6', pct: analytics.totalExpenses > 0 ? (analytics.fixedExpenses / analytics.totalExpenses * 100) : 0 },
                { label: 'مصروفات متغيرة (تشغيلية)', value: analytics.variableExpenses, color: '#f59e0b', pct: analytics.totalExpenses > 0 ? (analytics.variableExpenses / analytics.totalExpenses * 100) : 0 },
                { label: 'مصروفات أخرى', value: analytics.otherExpenses, color: '#8b5cf6', pct: analytics.totalExpenses > 0 ? (analytics.otherExpenses / analytics.totalExpenses * 100) : 0 },
              ].map((item) => (
                <div key={item.label} className="text-right space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{item.pct.toFixed(1)}%</Badge>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Progress value={item.pct} className="h-2" />
                  <p className="text-lg font-bold">{fmt(item.value)} ر.س</p>
                </div>
              ))}
            </div>
            <div className="h-[200px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'ثابتة', value: analytics.fixedExpenses },
                  { name: 'متغيرة', value: analytics.variableExpenses },
                  { name: 'أخرى', value: analytics.otherExpenses },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip formatter={(v: number) => `${fmt(v)} ر.س`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#8b5cf6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-right text-base">تفصيل الإيرادات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المصدر</TableHead>
                    <TableHead className="text-left w-[120px]">المبلغ</TableHead>
                    <TableHead className="text-center w-[60px]">النسبة</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.revenues.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا توجد إيرادات</TableCell></TableRow>
                  ) : analytics.revenues.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-right font-medium">{r.name}</TableCell>
                      <TableCell className="text-left text-green-600">{fmt(r.amount)} ر.س</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {analytics.totalRevenue > 0 ? (r.amount / analytics.totalRevenue * 100).toFixed(1) : 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDrilldownAccount({ name: r.name, type: 'revenue', id: r.id })}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell className="text-right">الإجمالي</TableCell>
                    <TableCell className="text-left text-green-700">{fmt(analytics.totalRevenue)} ر.س</TableCell>
                    <TableCell className="text-center"><Badge>100%</Badge></TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Expense Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-right text-base">تفصيل المصروفات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">البند</TableHead>
                    <TableHead className="text-left w-[120px]">المبلغ</TableHead>
                    <TableHead className="text-center w-[60px]">النسبة</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.expenses.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">لا توجد مصروفات</TableCell></TableRow>
                  ) : analytics.expenses.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-right font-medium">{e.name}</TableCell>
                      <TableCell className="text-left text-red-600">{fmt(e.amount)} ر.س</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {analytics.totalExpenses > 0 ? (e.amount / analytics.totalExpenses * 100).toFixed(1) : 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDrilldownAccount({ name: e.name, type: 'expense', id: e.id })}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell className="text-right">الإجمالي</TableCell>
                    <TableCell className="text-left text-red-700">{fmt(analytics.totalExpenses)} ر.س</TableCell>
                    <TableCell className="text-center"><Badge>100%</Badge></TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Drilldown Dialog */}
        <Dialog open={!!drilldownAccount} onOpenChange={() => setDrilldownAccount(null)}>
          <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-right flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                تفاصيل: {drilldownAccount?.name}
                <Badge variant={drilldownAccount?.type === 'revenue' ? 'default' : 'destructive'} className="mr-2">
                  {drilldownAccount?.type === 'revenue' ? 'إيرادات' : 'مصروفات'}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم القيد</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-left">مدين</TableHead>
                  <TableHead className="text-left">دائن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drilldownLines.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">لا توجد قيود</TableCell></TableRow>
                ) : drilldownLines.map((line: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{line.entry?.number || '-'}</TableCell>
                    <TableCell>{line.entry?.date ? new Date(line.entry.date).toLocaleDateString('ar-SA') : '-'}</TableCell>
                    <TableCell>{line.entry?.desc || line.description || '-'}</TableCell>
                    <TableCell className="text-left">{Number(line.debit) > 0 ? `${fmt(line.debit)} ر.س` : '-'}</TableCell>
                    <TableCell className="text-left">{Number(line.credit) > 0 ? `${fmt(line.credit)} ر.س` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default ERPRevenueExpensesAnalysis;
