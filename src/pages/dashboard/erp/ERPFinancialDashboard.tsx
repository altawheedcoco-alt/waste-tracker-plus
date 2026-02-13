import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useExcelExport } from '@/hooks/useExcelExport';
import {
  FileText, TrendingUp, TrendingDown, DollarSign, BarChart3,
  Download, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight,
  Wallet, PiggyBank, Activity, Clock
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Types
interface AccountBalance {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
}

interface ReportData {
  income_statement: IncomeStatement;
  balance_sheet: BalanceSheet;
  cash_flow: CashFlow;
}

interface IncomeStatement {
  revenues: { account_name: string; amount: number }[];
  expenses: { account_name: string; amount: number }[];
  total_revenue: number;
  total_expenses: number;
  net_income: number;
}

interface BalanceSheet {
  current_assets: { account_name: string; amount: number }[];
  fixed_assets: { account_name: string; amount: number }[];
  current_liabilities: { account_name: string; amount: number }[];
  long_term_liabilities: { account_name: string; amount: number }[];
  equity: { account_name: string; amount: number }[];
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
}

interface CashFlow {
  operating: { description: string; amount: number }[];
  investing: { description: string; amount: number }[];
  financing: { description: string; amount: number }[];
  total_operating: number;
  total_investing: number;
  total_financing: number;
  net_cash_change: number;
}

const getPeriodDates = (period: string) => {
  const now = new Date();
  let start: Date;
  let end = new Date(now);

  switch (period) {
    case 'current-month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last-month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'current-quarter':
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'current-year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label: `${start.toLocaleDateString('ar-EG')} - ${end.toLocaleDateString('ar-EG')}`,
  };
};

const ERPFinancialDashboard = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;
  const [period, setPeriod] = useState('current-month');
  const { exportToExcel, isExporting } = useExcelExport({ filename: 'تقارير-مالية' });

  const dates = useMemo(() => getPeriodDates(period), [period]);

  // Fetch accounts with balances
  const { data: accounts = [] } = useQuery({
    queryKey: ['erp-accounts-financial', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_chart_of_accounts')
        .select('id, account_code, account_name, account_type, balance')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('account_code');
      if (error) throw error;
      return (data || []) as AccountBalance[];
    },
    enabled: !!orgId,
  });

  // Fetch journal lines for the period (posted entries only)
  const { data: journalLines = [], isLoading } = useQuery({
    queryKey: ['erp-journal-lines-period', orgId, dates.start, dates.end],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: entries, error: entriesError } = await supabase
        .from('erp_journal_entries')
        .select('id')
        .eq('organization_id', orgId)
        .eq('status', 'posted')
        .gte('entry_date', dates.start)
        .lte('entry_date', dates.end);
      if (entriesError) throw entriesError;
      if (!entries?.length) return [];

      const entryIds = entries.map(e => e.id);
      const { data: lines, error: linesError } = await supabase
        .from('erp_journal_lines')
        .select('*, erp_chart_of_accounts!inner(account_code, account_name, account_type)')
        .in('journal_entry_id', entryIds);
      if (linesError) throw linesError;
      return lines || [];
    },
    enabled: !!orgId,
  });

  // Fetch saved reports
  const { data: savedReports = [] } = useQuery({
    queryKey: ['erp-saved-reports', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('erp_financial_reports')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Generate report data from journal lines
  const reportData = useMemo((): ReportData => {
    const accountMap = new Map<string, { name: string; type: string; debit: number; credit: number }>();

    journalLines.forEach((line: any) => {
      const acc = line.erp_chart_of_accounts;
      const key = line.account_id;
      const existing = accountMap.get(key) || { name: acc.account_name, type: acc.account_type, debit: 0, credit: 0 };
      existing.debit += Number(line.debit) || 0;
      existing.credit += Number(line.credit) || 0;
      accountMap.set(key, existing);
    });

    // Income Statement
    const revenues: { account_name: string; amount: number }[] = [];
    const expenses: { account_name: string; amount: number }[] = [];
    accountMap.forEach((v) => {
      if (v.type === 'revenue') revenues.push({ account_name: v.name, amount: v.credit - v.debit });
      if (v.type === 'expense') expenses.push({ account_name: v.name, amount: v.debit - v.credit });
    });
    const total_revenue = revenues.reduce((s, r) => s + r.amount, 0);
    const total_expenses = expenses.reduce((s, e) => s + e.amount, 0);

    // Balance Sheet (from current balances)
    const current_assets: { account_name: string; amount: number }[] = [];
    const fixed_assets: { account_name: string; amount: number }[] = [];
    const current_liabilities: { account_name: string; amount: number }[] = [];
    const long_term_liabilities: { account_name: string; amount: number }[] = [];
    const equity: { account_name: string; amount: number }[] = [];

    accounts.forEach(acc => {
      const bal = acc.balance || 0;
      if (bal === 0) return;
      if (acc.account_type === 'asset') {
        // Simple heuristic: codes starting with 1 are current, 2 are fixed
        if (acc.account_code.startsWith('1')) current_assets.push({ account_name: acc.account_name, amount: bal });
        else fixed_assets.push({ account_name: acc.account_name, amount: bal });
      } else if (acc.account_type === 'liability') {
        if (acc.account_code.startsWith('3')) current_liabilities.push({ account_name: acc.account_name, amount: bal });
        else long_term_liabilities.push({ account_name: acc.account_name, amount: bal });
      } else if (acc.account_type === 'equity') {
        equity.push({ account_name: acc.account_name, amount: bal });
      }
    });

    const total_assets_val = [...current_assets, ...fixed_assets].reduce((s, a) => s + a.amount, 0);
    const total_liabilities_val = [...current_liabilities, ...long_term_liabilities].reduce((s, a) => s + a.amount, 0);
    const total_equity_val = equity.reduce((s, a) => s + a.amount, 0);

    // Cash Flow (Direct Method) - track cash account movements
    const operating: { description: string; amount: number }[] = [];
    const investing: { description: string; amount: number }[] = [];
    const financing: { description: string; amount: number }[] = [];

    accountMap.forEach((v) => {
      const net = v.debit - v.credit;
      if (v.type === 'revenue' || v.type === 'expense') {
        operating.push({ description: v.name, amount: v.type === 'revenue' ? (v.credit - v.debit) : -(v.debit - v.credit) });
      }
    });

    const total_operating = operating.reduce((s, o) => s + o.amount, 0);
    const total_investing = investing.reduce((s, i) => s + i.amount, 0);
    const total_financing = financing.reduce((s, f) => s + f.amount, 0);

    return {
      income_statement: { revenues, expenses, total_revenue, total_expenses, net_income: total_revenue - total_expenses },
      balance_sheet: { current_assets, fixed_assets, current_liabilities, long_term_liabilities, equity, total_assets: total_assets_val, total_liabilities: total_liabilities_val, total_equity: total_equity_val },
      cash_flow: { operating, investing, financing, total_operating, total_investing, total_financing, net_cash_change: total_operating + total_investing + total_financing },
    };
  }, [journalLines, accounts]);

  // Save report snapshot
  const saveReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_financial_reports').insert({
        organization_id: orgId,
        report_type: reportType,
        period_start: dates.start,
        period_end: dates.end,
        report_data: reportData as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-saved-reports'] });
      toast.success('تم حفظ التقرير بنجاح');
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Export functions
  const exportIncomeStatement = () => {
    const data = [
      ...reportData.income_statement.revenues.map(r => ({ type: 'إيرادات', name: r.account_name, amount: r.amount })),
      ...reportData.income_statement.expenses.map(e => ({ type: 'مصروفات', name: e.account_name, amount: e.amount })),
      { type: 'الإجمالي', name: 'صافي الربح/الخسارة', amount: reportData.income_statement.net_income },
    ];
    exportToExcel(data, [
      { header: 'التصنيف', key: 'type', width: 15 },
      { header: 'البند', key: 'name', width: 30 },
      { header: 'المبلغ (ج.م)', key: 'amount', width: 20 },
    ], 'قائمة-الدخل');
  };

  const exportBalanceSheet = () => {
    const data = [
      ...reportData.balance_sheet.current_assets.map(a => ({ section: 'أصول متداولة', name: a.account_name, amount: a.amount })),
      ...reportData.balance_sheet.fixed_assets.map(a => ({ section: 'أصول ثابتة', name: a.account_name, amount: a.amount })),
      ...reportData.balance_sheet.current_liabilities.map(l => ({ section: 'التزامات قصيرة الأجل', name: l.account_name, amount: l.amount })),
      ...reportData.balance_sheet.long_term_liabilities.map(l => ({ section: 'التزامات طويلة الأجل', name: l.account_name, amount: l.amount })),
      ...reportData.balance_sheet.equity.map(e => ({ section: 'حقوق الملكية', name: e.account_name, amount: e.amount })),
    ];
    exportToExcel(data, [
      { header: 'القسم', key: 'section', width: 25 },
      { header: 'البند', key: 'name', width: 30 },
      { header: 'المبلغ (ج.م)', key: 'amount', width: 20 },
    ], 'المركز-المالي');
  };

  const exportCashFlow = () => {
    const data = [
      ...reportData.cash_flow.operating.map(o => ({ activity: 'أنشطة تشغيلية', desc: o.description, amount: o.amount })),
      ...reportData.cash_flow.investing.map(i => ({ activity: 'أنشطة استثمارية', desc: i.description, amount: i.amount })),
      ...reportData.cash_flow.financing.map(f => ({ activity: 'أنشطة تمويلية', desc: f.description, amount: f.amount })),
      { activity: 'الإجمالي', desc: 'صافي التغير في النقد', amount: reportData.cash_flow.net_cash_change },
    ];
    exportToExcel(data, [
      { header: 'النشاط', key: 'activity', width: 20 },
      { header: 'الوصف', key: 'desc', width: 30 },
      { header: 'المبلغ (ج.م)', key: 'amount', width: 20 },
    ], 'التدفقات-النقدية');
  };

  const formatCurrency = (val: number) => val.toLocaleString('ar-EG', { minimumFractionDigits: 2 });

  const SectionRow = ({ label, amount, bold = false, isTotal = false }: { label: string; amount: number; bold?: boolean; isTotal?: boolean }) => (
    <TableRow className={isTotal ? 'bg-muted/50 font-bold border-t-2' : ''}>
      <TableCell className={`text-right ${bold ? 'font-bold' : ''}`}>{label}</TableCell>
      <TableCell className={`text-left ${bold ? 'font-bold' : ''} ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(amount)} ج.م
      </TableCell>
    </TableRow>
  );

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              لوحة التقارير المالية
            </h1>
            <p className="text-muted-foreground">قائمة الدخل • المركز المالي • التدفقات النقدية</p>
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
            <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['erp-journal-lines-period'] })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-right">
          الفترة: {dates.label}
        </p>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(reportData.income_statement.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(reportData.income_statement.total_expenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">صافي الربح</p>
                  <p className={`text-lg font-bold ${reportData.income_statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.income_statement.net_income)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-right">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">صافي التدفق النقدي</p>
                  <p className={`text-lg font-bold ${reportData.cash_flow.net_cash_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(reportData.cash_flow.net_cash_change)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="income" dir="rtl">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="income">قائمة الدخل</TabsTrigger>
            <TabsTrigger value="balance">المركز المالي</TabsTrigger>
            <TabsTrigger value="cashflow">التدفقات النقدية</TabsTrigger>
            <TabsTrigger value="history">التقارير المحفوظة</TabsTrigger>
          </TabsList>

          {/* Income Statement */}
          <TabsContent value="income" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportIncomeStatement} disabled={isExporting}>
                  <Download className="ml-2 h-4 w-4" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => saveReportMutation.mutate('income_statement')} disabled={saveReportMutation.isPending}>
                  <FileText className="ml-2 h-4 w-4" />حفظ نسخة
                </Button>
              </div>
              <h2 className="text-lg font-semibold">قائمة الدخل</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البند</TableHead>
                      <TableHead className="text-left w-[200px]">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold text-right text-green-700">الإيرادات</TableCell></TableRow>
                    {reportData.income_statement.revenues.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">لا توجد إيرادات مسجلة</TableCell></TableRow>
                    )}
                    {reportData.income_statement.revenues.map((r, i) => <SectionRow key={i} label={r.account_name} amount={r.amount} />)}
                    <SectionRow label="إجمالي الإيرادات" amount={reportData.income_statement.total_revenue} bold isTotal />

                    <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold text-right text-red-700">المصروفات</TableCell></TableRow>
                    {reportData.income_statement.expenses.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">لا توجد مصروفات مسجلة</TableCell></TableRow>
                    )}
                    {reportData.income_statement.expenses.map((e, i) => <SectionRow key={i} label={e.account_name} amount={-e.amount} />)}
                    <SectionRow label="إجمالي المصروفات" amount={-reportData.income_statement.total_expenses} bold isTotal />

                    <TableRow className="bg-primary/10 border-t-2 border-primary">
                      <TableCell className="text-right font-bold text-lg">صافي الربح / الخسارة</TableCell>
                      <TableCell className={`text-left font-bold text-lg ${reportData.income_statement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.income_statement.net_income)} ج.م
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance Sheet */}
          <TabsContent value="balance" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportBalanceSheet} disabled={isExporting}>
                  <Download className="ml-2 h-4 w-4" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => saveReportMutation.mutate('balance_sheet')} disabled={saveReportMutation.isPending}>
                  <FileText className="ml-2 h-4 w-4" />حفظ نسخة
                </Button>
              </div>
              <h2 className="text-lg font-semibold">قائمة المركز المالي (الميزانية العمومية)</h2>
            </div>

            {/* Balance equation check */}
            <Card className={reportData.balance_sheet.total_assets === (reportData.balance_sheet.total_liabilities + reportData.balance_sheet.total_equity) ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant={reportData.balance_sheet.total_assets === (reportData.balance_sheet.total_liabilities + reportData.balance_sheet.total_equity) ? 'default' : 'destructive'}>
                    {reportData.balance_sheet.total_assets === (reportData.balance_sheet.total_liabilities + reportData.balance_sheet.total_equity) ? '✓ المعادلة متوازنة' : '✗ المعادلة غير متوازنة'}
                  </Badge>
                  <div className="text-right font-mono text-xs">
                    الأصول ({formatCurrency(reportData.balance_sheet.total_assets)}) = الالتزامات ({formatCurrency(reportData.balance_sheet.total_liabilities)}) + حقوق الملكية ({formatCurrency(reportData.balance_sheet.total_equity)})
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Assets */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-right flex items-center gap-2 justify-end">
                    <span>الأصول</span>
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-right">أصول متداولة</TableCell></TableRow>
                      {reportData.balance_sheet.current_assets.map((a, i) => <SectionRow key={i} label={a.account_name} amount={a.amount} />)}
                      <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-right">أصول ثابتة</TableCell></TableRow>
                      {reportData.balance_sheet.fixed_assets.map((a, i) => <SectionRow key={i} label={a.account_name} amount={a.amount} />)}
                      <SectionRow label="إجمالي الأصول" amount={reportData.balance_sheet.total_assets} bold isTotal />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Liabilities + Equity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-right flex items-center gap-2 justify-end">
                    <span>الالتزامات وحقوق الملكية</span>
                    <PiggyBank className="h-5 w-5 text-orange-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-right">التزامات قصيرة الأجل</TableCell></TableRow>
                      {reportData.balance_sheet.current_liabilities.map((l, i) => <SectionRow key={i} label={l.account_name} amount={l.amount} />)}
                      <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-right">التزامات طويلة الأجل</TableCell></TableRow>
                      {reportData.balance_sheet.long_term_liabilities.map((l, i) => <SectionRow key={i} label={l.account_name} amount={l.amount} />)}
                      <SectionRow label="إجمالي الالتزامات" amount={reportData.balance_sheet.total_liabilities} bold isTotal />
                      <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-right">حقوق الملكية</TableCell></TableRow>
                      {reportData.balance_sheet.equity.map((e, i) => <SectionRow key={i} label={e.account_name} amount={e.amount} />)}
                      <SectionRow label="إجمالي حقوق الملكية" amount={reportData.balance_sheet.total_equity} bold isTotal />
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cash Flow */}
          <TabsContent value="cashflow" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCashFlow} disabled={isExporting}>
                  <Download className="ml-2 h-4 w-4" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => saveReportMutation.mutate('cash_flow')} disabled={saveReportMutation.isPending}>
                  <FileText className="ml-2 h-4 w-4" />حفظ نسخة
                </Button>
              </div>
              <h2 className="text-lg font-semibold">قائمة التدفقات النقدية (الطريقة المباشرة)</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">البند</TableHead>
                      <TableHead className="text-left w-[200px]">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                      <TableCell colSpan={2} className="font-bold text-right flex items-center gap-2 justify-end">
                        <span>أنشطة تشغيلية</span>
                        <ArrowUpRight className="h-4 w-4 text-blue-600" />
                      </TableCell>
                    </TableRow>
                    {reportData.cash_flow.operating.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">لا توجد أنشطة تشغيلية</TableCell></TableRow>
                    )}
                    {reportData.cash_flow.operating.map((o, i) => <SectionRow key={i} label={o.description} amount={o.amount} />)}
                    <SectionRow label="صافي الأنشطة التشغيلية" amount={reportData.cash_flow.total_operating} bold isTotal />

                    <TableRow className="bg-green-50 dark:bg-green-900/20">
                      <TableCell colSpan={2} className="font-bold text-right flex items-center gap-2 justify-end">
                        <span>أنشطة استثمارية</span>
                        <ArrowDownRight className="h-4 w-4 text-green-600" />
                      </TableCell>
                    </TableRow>
                    {reportData.cash_flow.investing.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">لا توجد أنشطة استثمارية</TableCell></TableRow>
                    )}
                    {reportData.cash_flow.investing.map((i, idx) => <SectionRow key={idx} label={i.description} amount={i.amount} />)}
                    <SectionRow label="صافي الأنشطة الاستثمارية" amount={reportData.cash_flow.total_investing} bold isTotal />

                    <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                      <TableCell colSpan={2} className="font-bold text-right flex items-center gap-2 justify-end">
                        <span>أنشطة تمويلية</span>
                        <Wallet className="h-4 w-4 text-purple-600" />
                      </TableCell>
                    </TableRow>
                    {reportData.cash_flow.financing.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4">لا توجد أنشطة تمويلية</TableCell></TableRow>
                    )}
                    {reportData.cash_flow.financing.map((f, i) => <SectionRow key={i} label={f.description} amount={f.amount} />)}
                    <SectionRow label="صافي الأنشطة التمويلية" amount={reportData.cash_flow.total_financing} bold isTotal />

                    <TableRow className="bg-primary/10 border-t-2 border-primary">
                      <TableCell className="text-right font-bold text-lg">صافي التغير في النقد</TableCell>
                      <TableCell className={`text-left font-bold text-lg ${reportData.cash_flow.net_cash_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.cash_flow.net_cash_change)} ج.م
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Reports History */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-lg font-semibold text-right">التقارير المحفوظة</h2>
            {savedReports.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد تقارير محفوظة بعد</p>
                  <p className="text-sm">احفظ نسخة من أي تقرير لتظهر هنا</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedReports.map((report: any) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-right">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline">
                          {report.report_type === 'income_statement' ? 'قائمة الدخل' :
                           report.report_type === 'balance_sheet' ? 'المركز المالي' :
                           report.report_type === 'cash_flow' ? 'التدفقات النقدية' : report.report_type}
                        </Badge>
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {new Date(report.period_start).toLocaleDateString('ar-EG')} - {new Date(report.period_end).toLocaleDateString('ar-EG')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        تم الحفظ: {new Date(report.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ERPFinancialDashboard;
