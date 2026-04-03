import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText, Download, TrendingUp, TrendingDown, Minus,
  Truck, Recycle, DollarSign, Target, Award, Calendar, Printer
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const ExecutiveSummaryPage = () => {
  const { organization, user } = useAuth();
  const now = new Date();
  const currentMonth = MONTHS_AR[now.getMonth()];
  const currentYear = now.getFullYear();

  const { data, isLoading } = useQuery({
    queryKey: ['executive-summary', organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const [currentRes, prevRes, ledgerRes, prevLedgerRes] = await Promise.all([
        supabase.from('shipments').select('id, status, quantity, waste_type')
          .eq('generator_id', organization!.id)
          .gte('created_at', monthStart.toISOString()),
        supabase.from('shipments').select('id, status, quantity')
          .eq('generator_id', organization!.id)
          .gte('created_at', prevMonthStart.toISOString())
          .lt('created_at', monthStart.toISOString()),
        supabase.from('accounting_ledger').select('amount, entry_type')
          .eq('organization_id', organization!.id)
          .gte('entry_date', monthStart.toISOString().split('T')[0]),
        supabase.from('accounting_ledger').select('amount, entry_type')
          .eq('organization_id', organization!.id)
          .gte('entry_date', prevMonthStart.toISOString().split('T')[0])
          .lt('entry_date', monthStart.toISOString().split('T')[0]),
      ]);

      const calc = (items: any[]) => ({
        count: items.length,
        tons: items.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
        confirmed: items.filter(i => i.status === 'confirmed').length,
      });

      const calcFinance = (items: any[]) => {
        let income = 0, expenses = 0;
        items.forEach(e => {
          if (e.entry_type === 'credit') income += Number(e.amount);
          else expenses += Number(e.amount);
        });
        return { income, expenses, profit: income - expenses };
      };

      const current = calc(currentRes.data || []);
      const previous = calc(prevRes.data || []);
      const finance = calcFinance(ledgerRes.data || []);
      const prevFinance = calcFinance(prevLedgerRes.data || []);

      // Waste type breakdown
      const wasteBreakdown = new Map<string, number>();
      (currentRes.data || []).forEach(s => {
        const wt = s.waste_type || 'أخرى';
        wasteBreakdown.set(wt, (wasteBreakdown.get(wt) || 0) + (Number(s.quantity) || 0));
      });

      const pct = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

      return {
        current, previous, finance, prevFinance,
        changes: {
          shipments: pct(current.count, previous.count),
          tons: pct(current.tons, previous.tons),
          income: pct(finance.income, prevFinance.income),
          profit: pct(finance.profit, prevFinance.profit),
        },
        wasteBreakdown: Array.from(wasteBreakdown.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([type, tons]) => ({ type, tons: Math.round(tons * 100) / 100 })),
        completionRate: current.count > 0 ? Math.round((current.confirmed / current.count) * 100) : 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const handlePrint = () => window.print();

  const TrendBadge = ({ val }: { val: number }) => (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${val > 0 ? 'text-green-600' : val < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
      {val > 0 ? <TrendingUp className="h-3 w-3" /> : val < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {val > 0 ? '+' : ''}{val}%
    </span>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        </div>
      </DashboardLayout>
    );
  }

  const d = data!;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6 print:p-2" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                الملخص التنفيذي
              </h1>
              <p className="text-sm text-muted-foreground">{currentMonth} {currentYear} — {organization?.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold">الملخص التنفيذي الشهري</h1>
          <p className="text-sm">{organization?.name} — {currentMonth} {currentYear}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'الشحنات', value: d.current.count, icon: Truck, change: d.changes.shipments },
            { label: 'الأطنان', value: `${d.current.tons.toFixed(1)}`, icon: Recycle, change: d.changes.tons },
            { label: 'الإيرادات', value: `${(d.finance.income / 1000).toFixed(1)}K`, icon: DollarSign, change: d.changes.income },
            { label: 'نسبة الإنجاز', value: `${d.completionRate}%`, icon: Target, change: d.completionRate - (d.previous.count > 0 ? Math.round((d.previous.confirmed / d.previous.count) * 100) : 0) },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <kpi.icon className="h-4 w-4 text-primary" />
                  <TrendBadge val={kpi.change} />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waste breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Recycle className="h-4 w-4 text-primary" />
                توزيع المخلفات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.wasteBreakdown.slice(0, 6).map((w, i) => {
                const maxTons = d.wasteBreakdown[0]?.tons || 1;
                return (
                  <div key={w.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{w.type}</span>
                      <span className="font-medium">{w.tons} طن</span>
                    </div>
                    <Progress value={(w.tons / maxTons) * 100} className="h-1.5" />
                  </div>
                );
              })}
              {d.wasteBreakdown.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>

          {/* Financial summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                الملخص المالي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'الإيرادات', value: d.finance.income, change: d.changes.income, color: 'text-green-600' },
                { label: 'المصروفات', value: d.finance.expenses, change: 0, color: 'text-destructive' },
                { label: 'صافي الربح', value: d.finance.profit, change: d.changes.profit, color: d.finance.profit >= 0 ? 'text-green-600' : 'text-destructive' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${item.color}`}>
                      {item.value.toLocaleString('ar-EG')} ج.م
                    </span>
                    {item.change !== 0 && <TrendBadge val={item.change} />}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Achievements & recommendations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              الإنجازات والتوصيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">✅ إنجازات الشهر</p>
                <ul className="text-sm space-y-1">
                  {d.current.count > 0 && <li>• تم معالجة {d.current.count} شحنة بإجمالي {d.current.tons.toFixed(1)} طن</li>}
                  {d.completionRate >= 80 && <li>• نسبة إنجاز ممتازة ({d.completionRate}%)</li>}
                  {d.changes.shipments > 0 && <li>• نمو في الشحنات بنسبة {d.changes.shipments}%</li>}
                  {d.finance.profit > 0 && <li>• تحقيق ربح صافي {d.finance.profit.toLocaleString('ar-EG')} ج.م</li>}
                  {d.current.count === 0 && <li className="text-muted-foreground">لا توجد شحنات مسجلة هذا الشهر</li>}
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">💡 توصيات</p>
                <ul className="text-sm space-y-1">
                  {d.completionRate < 80 && <li>• رفع نسبة الإنجاز عبر تسريع تأكيد الشحنات</li>}
                  {d.changes.shipments < 0 && <li>• مراجعة أسباب تراجع عدد الشحنات</li>}
                  {d.finance.profit <= 0 && <li>• مراجعة هيكل التكاليف لتحسين الربحية</li>}
                  <li>• تنويع مصادر المخلفات لتحسين الاستدامة</li>
                  <li>• الاستفادة من نظام النقاط لتعزيز التصنيف</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ExecutiveSummaryPage;
