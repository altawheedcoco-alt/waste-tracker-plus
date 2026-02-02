import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccounting } from '@/hooks/useAccounting';
import { useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Users,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Factory,
  Recycle
} from 'lucide-react';

export default function Accounting() {
  const navigate = useNavigate();
  const { financialSummary } = useAccounting();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const sections = [
    {
      id: 'invoices',
      title: 'الفواتير',
      description: 'إدارة فواتير المبيعات والمشتريات',
      icon: FileText,
      path: '/dashboard/accounting/invoices',
      color: 'from-blue-500 to-blue-600',
      stats: `${financialSummary.pendingInvoices} فاتورة معلقة`,
    },
    {
      id: 'payments',
      title: 'المدفوعات',
      description: 'تتبع المدفوعات الواردة والصادرة',
      icon: CreditCard,
      path: '/dashboard/accounting/payments',
      color: 'from-green-500 to-green-600',
      stats: formatCurrency(financialSummary.totalIncome),
    },
    {
      id: 'expenses',
      title: 'المصروفات',
      description: 'تتبع المصروفات التشغيلية',
      icon: Wallet,
      path: '/dashboard/accounting/expenses',
      color: 'from-orange-500 to-orange-600',
      stats: formatCurrency(financialSummary.totalExpenses),
    },
    {
      id: 'partners',
      title: 'حسابات الشركاء',
      description: 'أرصدة المولدين والمدورين',
      icon: Users,
      path: '/dashboard/accounting/partners',
      color: 'from-purple-500 to-purple-600',
      stats: 'كشوف الحسابات',
    },
    {
      id: 'reports',
      title: 'التقارير المالية',
      description: 'تقارير وإحصائيات شاملة',
      icon: Receipt,
      path: '/dashboard/accounting/reports',
      color: 'from-slate-500 to-slate-600',
      stats: 'عرض التقارير',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">الحسابات المالية</h1>
          <p className="text-muted-foreground">اختر القسم الذي تريد إدارته</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">لنا</span>
              </div>
              <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                {formatCurrency(financialSummary.totalReceivables)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">علينا</span>
              </div>
              <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">
                {formatCurrency(financialSummary.totalPayables)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-400">الإيرادات</span>
              </div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {formatCurrency(financialSummary.totalIncome)}
              </p>
            </CardContent>
          </Card>

          <Card className={`${
            financialSummary.netBalance >= 0 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {financialSummary.netBalance >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                )}
                <span className={`text-sm ${
                  financialSummary.netBalance >= 0 
                    ? 'text-emerald-700 dark:text-emerald-400' 
                    : 'text-rose-700 dark:text-rose-400'
                }`}>الصافي</span>
              </div>
              <p className={`text-xl font-bold mt-1 ${
                financialSummary.netBalance >= 0 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-rose-700 dark:text-rose-300'
              }`}>
                {formatCurrency(financialSummary.netBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
                onClick={() => navigate(section.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${section.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
                  </div>
                  <h3 className="text-lg font-semibold mt-4">{section.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                  <p className="text-sm font-medium text-primary mt-3">{section.stats}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access: Partner Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">وصول سريع للحسابات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/dashboard/accounting/partners?type=generators')}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Factory className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">حسابات المولدين</p>
                    <p className="text-sm text-muted-foreground">الجهات المولدة للنفايات</p>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/dashboard/accounting/partners?type=recyclers')}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Recycle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">حسابات المدورين</p>
                    <p className="text-sm text-muted-foreground">جهات إعادة التدوير</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
