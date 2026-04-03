import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, TrendingUp, FileText, Download, Recycle, DollarSign,
  Truck, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(48, 96%, 53%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 98%, 48%)',
  'hsl(0, 84%, 60%)',
];

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const AdvancedAnalyticsPage = () => {
  const { organization } = useAuth();
  const [period, setPeriod] = useState('6months');

  const { data: shipmentStats, isLoading } = useQuery({
    queryKey: ['advanced-analytics', organization?.id, period],
    enabled: !!organization?.id,
    queryFn: async () => {
      const months = period === '3months' ? 3 : period === '12months' ? 12 : 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, status, quantity, waste_type, created_at, updated_at')
        .eq('generator_id', organization!.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Monthly aggregation
      const monthly = new Map<string, { count: number; tons: number; confirmed: number }>();
      const wasteTypes = new Map<string, number>();

      (shipments || []).forEach(s => {
        const d = new Date(s.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const existing = monthly.get(key) || { count: 0, tons: 0, confirmed: 0 };
        existing.count += 1;
        existing.tons += Number(s.quantity) || 0;
        if (s.status === 'confirmed') existing.confirmed += 1;
        monthly.set(key, existing);

        const wt = s.waste_type || 'أخرى';
        wasteTypes.set(wt, (wasteTypes.get(wt) || 0) + (Number(s.quantity) || 0));
      });

      const monthlyData = Array.from(monthly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => {
          const [, m] = key.split('-');
          return { month: MONTHS_AR[parseInt(m)], ...val };
        });

      const wasteData = Array.from(wasteTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

      const totalShipments = (shipments || []).length;
      const totalTons = (shipments || []).reduce((s, sh) => s + (Number(sh.quantity) || 0), 0);
      const confirmedCount = (shipments || []).filter(s => s.status === 'confirmed').length;
      const completionRate = totalShipments ? Math.round((confirmedCount / totalShipments) * 100) : 0;

      return { monthlyData, wasteData, totalShipments, totalTons, confirmedCount, completionRate };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Financial data
  const { data: financialData } = useQuery({
    queryKey: ['financial-analytics', organization?.id, period],
    enabled: !!organization?.id,
    queryFn: async () => {
      const months = period === '3months' ? 3 : period === '12months' ? 12 : 6;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: ledger } = await supabase
        .from('accounting_ledger')
        .select('amount, entry_type, entry_date, entry_category')
        .eq('organization_id', organization!.id)
        .gte('entry_date', startDate.toISOString().split('T')[0]);

      let income = 0, expenses = 0;
      const monthlyFinance = new Map<string, { income: number; expenses: number }>();

      (ledger || []).forEach(e => {
        const d = new Date(e.entry_date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const existing = monthlyFinance.get(key) || { income: 0, expenses: 0 };

        if (e.entry_type === 'credit') {
          income += Number(e.amount);
          existing.income += Number(e.amount);
        } else {
          expenses += Number(e.amount);
          existing.expenses += Number(e.amount);
        }
        monthlyFinance.set(key, existing);
      });

      const chartData = Array.from(monthlyFinance.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => {
          const [, m] = key.split('-');
          return { month: MONTHS_AR[parseInt(m)], ...val, profit: val.income - val.expenses };
        });

      return { income, expenses, profit: income - expenses, chartData };
    },
  });

  const handleExportCSV = () => {
    if (!shipmentStats?.monthlyData) return;
    const bom = '\uFEFF';
    const header = 'الشهر,عدد الشحنات,الأطنان,المؤكدة\n';
    const rows = shipmentStats.monthlyData.map(d => `${d.month},${d.count},${d.tons.toFixed(2)},${d.confirmed}`).join('\n');
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  const stats = shipmentStats || { totalShipments: 0, totalTons: 0, confirmedCount: 0, completionRate: 0, monthlyData: [], wasteData: [] };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">التقارير والتحليلات المتقدمة</h1>
              <p className="text-sm text-muted-foreground">رؤية شاملة لأداء الجهة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 أشهر</SelectItem>
                <SelectItem value="6months">6 أشهر</SelectItem>
                <SelectItem value="12months">سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الشحنات', value: stats.totalShipments, icon: Truck, color: 'text-primary', trend: '+12%' },
            { label: 'إجمالي الأطنان', value: `${stats.totalTons.toFixed(1)} طن`, icon: Recycle, color: 'text-green-500', trend: '+8%' },
            { label: 'نسبة الإنجاز', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-blue-500', trend: stats.completionRate > 80 ? '+' : '-' },
            { label: 'صافي الربح', value: `${((financialData?.profit || 0) / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-emerald-500', trend: (financialData?.profit || 0) > 0 ? '+' : '-' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  {kpi.trend.startsWith('+') ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="shipments" dir="rtl">
          <TabsList className="mb-4">
            <TabsTrigger value="shipments" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> الشحنات</TabsTrigger>
            <TabsTrigger value="financial" className="gap-1"><DollarSign className="h-3.5 w-3.5" /> المالية</TabsTrigger>
            <TabsTrigger value="waste" className="gap-1"><Recycle className="h-3.5 w-3.5" /> المخلفات</TabsTrigger>
          </TabsList>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الشحنات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="count" name="العدد" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                      <Area type="monotone" dataKey="tons" name="الأطنان" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">الإيرادات والمصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData?.chartData || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" name="إيرادات" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="مصروفات" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waste">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">توزيع أنواع المخلفات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.wasteData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.wasteData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">تفاصيل المخلفات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.wasteData.map((w, i) => (
                      <div key={w.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm">{w.name}</span>
                        </div>
                        <Badge variant="secondary">{w.value} طن</Badge>
                      </div>
                    ))}
                    {stats.wasteData.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdvancedAnalyticsPage;
