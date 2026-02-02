import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccounting } from '@/hooks/useAccounting';
import { 
  Receipt, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Users,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import InvoicesTab from '@/components/accounting/InvoicesTab';
import PaymentsTab from '@/components/accounting/PaymentsTab';
import ExpensesTab from '@/components/accounting/ExpensesTab';
import PartnerBalancesTab from '@/components/accounting/PartnerBalancesTab';
import FinancialReportsTab from '@/components/accounting/FinancialReportsTab';
import CreateInvoiceDialog from '@/components/accounting/CreateInvoiceDialog';
import CreatePaymentDialog from '@/components/accounting/CreatePaymentDialog';
import CreateExpenseDialog from '@/components/accounting/CreateExpenseDialog';

export default function Accounting() {
  const { financialSummary, invoicesLoading } = useAccounting();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreatePayment, setShowCreatePayment] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">منظومة الحسابات المالية</h1>
            <p className="text-muted-foreground">إدارة الفواتير والمدفوعات والمصروفات</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowCreateInvoice(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              فاتورة جديدة
            </Button>
            <Button variant="outline" onClick={() => setShowCreatePayment(true)} className="gap-2">
              <CreditCard className="h-4 w-4" />
              تسجيل دفعة
            </Button>
            <Button variant="outline" onClick={() => setShowCreateExpense(true)} className="gap-2">
              <Wallet className="h-4 w-4" />
              تسجيل مصروف
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                المستحقات (لنا)
              </CardTitle>
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(financialSummary.totalReceivables)}
              </div>
              <p className="text-xs text-green-600/70 dark:text-green-400/70">
                {financialSummary.pendingInvoices} فاتورة معلقة
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                المستحقات (علينا)
              </CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(financialSummary.totalPayables)}
              </div>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                {financialSummary.overdueInvoices} فاتورة متأخرة
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                إجمالي الإيرادات
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(financialSummary.totalIncome)}
              </div>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                المدفوعات الواردة
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                إجمالي المصروفات
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(financialSummary.totalExpenses)}
              </div>
              <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                المصروفات التشغيلية
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Net Balance Card */}
        <Card className={`${
          financialSummary.netBalance >= 0 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        } text-white`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">صافي الرصيد</p>
                <p className="text-3xl font-bold">{formatCurrency(financialSummary.netBalance)}</p>
              </div>
              <div className={`p-4 rounded-full ${
                financialSummary.netBalance >= 0 ? 'bg-white/20' : 'bg-white/20'
              }`}>
                {financialSummary.netBalance >= 0 ? (
                  <TrendingUp className="h-8 w-8" />
                ) : (
                  <TrendingDown className="h-8 w-8" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">الفواتير</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">المدفوعات</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">المصروفات</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">أرصدة الشركاء</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">التقارير</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentsTab />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <ExpensesTab />
          </TabsContent>

          <TabsContent value="balances" className="mt-6">
            <PartnerBalancesTab />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <FinancialReportsTab />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateInvoiceDialog 
          open={showCreateInvoice} 
          onOpenChange={setShowCreateInvoice} 
        />
        <CreatePaymentDialog 
          open={showCreatePayment} 
          onOpenChange={setShowCreatePayment} 
        />
        <CreateExpenseDialog 
          open={showCreateExpense} 
          onOpenChange={setShowCreateExpense} 
        />
      </div>
    </DashboardLayout>
  );
}
