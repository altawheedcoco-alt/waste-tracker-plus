import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAccounting } from '@/hooks/useAccounting';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PartnerBalancesTab() {
  const { partnerBalances, balancesLoading } = useAccounting();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalOwedToUs = partnerBalances
    .filter(b => b.balance > 0)
    .reduce((sum, b) => sum + b.balance, 0);

  const totalWeOwe = partnerBalances
    .filter(b => b.balance < 0)
    .reduce((sum, b) => sum + Math.abs(b.balance), 0);

  if (balancesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>أرصدة الشركاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">لنا عند الشركاء</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(totalOwedToUs)}
                </p>
                <p className="text-xs text-green-600/70 mt-1">
                  {partnerBalances.filter(b => b.balance > 0).length} شريك
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/20 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">علينا للشركاء</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(totalWeOwe)}
                </p>
                <p className="text-xs text-red-600/70 mt-1">
                  {partnerBalances.filter(b => b.balance < 0).length} شريك
                </p>
              </div>
              <div className="p-3 bg-red-200 dark:bg-red-800 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          totalOwedToUs - totalWeOwe >= 0 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-900/20 border-blue-200'
            : 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/30 dark:to-amber-900/20 border-orange-200'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${totalOwedToUs - totalWeOwe >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  صافي الرصيد
                </p>
                <p className={`text-2xl font-bold ${totalOwedToUs - totalWeOwe >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                  {formatCurrency(totalOwedToUs - totalWeOwe)}
                </p>
                <p className={`text-xs mt-1 ${totalOwedToUs - totalWeOwe >= 0 ? 'text-blue-600/70' : 'text-orange-600/70'}`}>
                  {totalOwedToUs - totalWeOwe >= 0 ? 'لصالحنا' : 'علينا'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalOwedToUs - totalWeOwe >= 0 ? 'bg-blue-200 dark:bg-blue-800' : 'bg-orange-200 dark:bg-orange-800'}`}>
                {totalOwedToUs - totalWeOwe === 0 ? (
                  <Minus className="h-6 w-6" />
                ) : totalOwedToUs - totalWeOwe > 0 ? (
                  <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-orange-700 dark:text-orange-300" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            كشف حسابات الشركاء ({partnerBalances.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partnerBalances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد أرصدة مع الشركاء</p>
              <p className="text-sm">ستظهر الأرصدة هنا بعد إنشاء الفواتير والمدفوعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الشريك</TableHead>
                    <TableHead className="text-right">إجمالي الفواتير</TableHead>
                    <TableHead className="text-right">إجمالي المدفوع</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">آخر معاملة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerBalances.map((balance) => (
                    <TableRow key={balance.id}>
                      <TableCell className="font-medium">
                        {balance.partner_organization?.name || '-'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(balance.total_invoiced)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(balance.total_paid)}
                      </TableCell>
                      <TableCell className={`font-bold ${
                        balance.balance > 0 
                          ? 'text-green-600' 
                          : balance.balance < 0 
                            ? 'text-red-600' 
                            : ''
                      }`}>
                        {formatCurrency(Math.abs(balance.balance))}
                        {balance.balance !== 0 && (
                          <span className="text-xs mr-1">
                            {balance.balance > 0 ? '(لنا)' : '(علينا)'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {balance.balance > 0 ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <TrendingUp className="h-3 w-3 ml-1" />
                            دائن
                          </Badge>
                        ) : balance.balance < 0 ? (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <TrendingDown className="h-3 w-3 ml-1" />
                            مدين
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Minus className="h-3 w-3 ml-1" />
                            متوازن
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {balance.last_transaction_date 
                          ? format(new Date(balance.last_transaction_date), 'dd/MM/yyyy', { locale: ar })
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
