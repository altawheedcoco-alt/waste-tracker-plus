import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { 
  Search, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentMethodLabels: Record<string, string> = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  check: 'شيك',
  card: 'بطاقة',
  other: 'أخرى',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'ملغى', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
  bounced: { label: 'مرتجع', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export default function PaymentsTab() {
  const { payments, paymentsLoading } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.partner_organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || payment.payment_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalIncoming = filteredPayments
    .filter(p => p.payment_type === 'incoming' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalOutgoing = filteredPayments
    .filter(p => p.payment_type === 'outgoing' && p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (paymentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المدفوعات</CardTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/20 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">المدفوعات الواردة</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(totalIncoming)}
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                <ArrowDownRight className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/30 dark:to-rose-900/20 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">المدفوعات الصادرة</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(totalOutgoing)}
                </p>
              </div>
              <div className="p-3 bg-red-200 dark:bg-red-800 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              سجل المدفوعات ({filteredPayments.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-full sm:w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="incoming">وارد</SelectItem>
                  <SelectItem value="outgoing">صادر</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مدفوعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الدفعة</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الشريك</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الفاتورة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.payment_number}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={payment.payment_type === 'incoming' 
                            ? 'border-green-500 text-green-600' 
                            : 'border-red-500 text-red-600'
                          }
                        >
                          {payment.payment_type === 'incoming' ? (
                            <><ArrowDownRight className="h-3 w-3 ml-1" /> وارد</>
                          ) : (
                            <><ArrowUpRight className="h-3 w-3 ml-1" /> صادر</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.partner_organization?.name || payment.partner_name || '-'}
                      </TableCell>
                      <TableCell>
                        {paymentMethodLabels[payment.payment_method]}
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className={`font-semibold ${
                        payment.payment_type === 'incoming' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.payment_type === 'incoming' ? '+' : '-'}
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.invoice?.invoice_number || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusLabels[payment.status]?.color || ''}>
                          {statusLabels[payment.status]?.label || payment.status}
                        </Badge>
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
