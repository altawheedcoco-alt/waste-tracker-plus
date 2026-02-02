import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccounting } from '@/hooks/useAccounting';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  FileText, 
  Download, 
  Printer,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export default function FinancialReportsTab() {
  const { invoices, payments, expenses, financialSummary } = useAccounting();
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Generate monthly data for the last 6 months
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthInvoices = invoices.filter(inv => 
      isWithinInterval(new Date(inv.issue_date), { start, end })
    );
    const monthPaymentsIn = payments.filter(p => 
      p.payment_type === 'incoming' && 
      isWithinInterval(new Date(p.payment_date), { start, end })
    );
    const monthPaymentsOut = payments.filter(p => 
      p.payment_type === 'outgoing' && 
      isWithinInterval(new Date(p.payment_date), { start, end })
    );
    const monthExpenses = expenses.filter(e => 
      isWithinInterval(new Date(e.expense_date), { start, end })
    );

    return {
      month: format(date, 'MMM', { locale: ar }),
      invoiced: monthInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      received: monthPaymentsIn.reduce((sum, p) => sum + p.amount, 0),
      paid: monthPaymentsOut.reduce((sum, p) => sum + p.amount, 0),
      expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    };
  });

  // Invoice status distribution
  const invoiceStatusData = [
    { name: 'مدفوعة', value: invoices.filter(i => i.status === 'paid').length, color: '#10B981' },
    { name: 'معلقة', value: invoices.filter(i => i.status === 'pending').length, color: '#F59E0B' },
    { name: 'جزئية', value: invoices.filter(i => i.status === 'partial').length, color: '#3B82F6' },
    { name: 'متأخرة', value: invoices.filter(i => i.status === 'overdue').length, color: '#EF4444' },
  ].filter(d => d.value > 0);

  // Expense by category
  const expenseByCategoryData = Object.entries(
    expenses.reduce((acc, exp) => {
      const cat = exp.category;
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], index) => ({
    name: getCategoryLabel(name),
    value,
    color: COLORS[index % COLORS.length],
  }));

  function getCategoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      fuel: 'وقود',
      maintenance: 'صيانة',
      salaries: 'رواتب',
      rent: 'إيجار',
      utilities: 'مرافق',
      equipment: 'معدات',
      other: 'أخرى',
    };
    return labels[cat] || cat;
  }

  return (
    <div className="space-y-6">
      {/* Report Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              التقارير المالية
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                تصدير Excel
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue & Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              الإيرادات والمصروفات الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `شهر ${label}`}
                />
                <Legend />
                <Bar dataKey="received" name="الإيرادات" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="المصروفات" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cash Flow Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              اتجاه التدفق النقدي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="received" 
                  name="المقبوضات" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="paid" 
                  name="المدفوعات" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-5 w-5" />
              توزيع حالات الفواتير
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد فواتير لعرضها
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-5 w-5" />
              توزيع المصروفات حسب الفئة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {expenseByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد مصروفات لعرضها
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص الفترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-sm text-green-600">إجمالي الفواتير</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-sm text-blue-600">إجمالي المحصل</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.paid_amount, 0))}
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <p className="text-sm text-orange-600">إجمالي المستحق</p>
              <p className="text-xl font-bold text-orange-700">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.remaining_amount, 0))}
              </p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <p className="text-sm text-red-600">إجمالي المصروفات</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
