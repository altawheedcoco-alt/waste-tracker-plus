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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccounting, Invoice } from '@/hooks/useAccounting';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Printer, 
  Send,
  CheckCircle,
  XCircle,
  FileText,
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

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  pending: { label: 'معلقة', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  sent: { label: 'مرسلة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  partial: { label: 'جزئية', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  overdue: { label: 'متأخرة', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'ملغاة', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' },
};

const invoiceTypeLabels: Record<string, string> = {
  sales: 'مبيعات',
  purchase: 'مشتريات',
  service: 'خدمات',
};

export default function InvoicesTab() {
  const { invoices, invoicesLoading, updateInvoiceStatus } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (invoice.partner_organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (invoicesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الفواتير</CardTitle>
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
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            الفواتير ({filteredInvoices.length})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالرقم أو الشريك..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-full sm:w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد فواتير</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">الشريك</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الاستحقاق</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">المدفوع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.partner_organization?.name || invoice.partner_name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {invoiceTypeLabels[invoice.invoice_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {invoice.due_date 
                        ? format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ar })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(invoice.paid_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[invoice.status]?.color || ''}>
                        {statusConfig[invoice.status]?.label || invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Printer className="h-4 w-4" />
                            طباعة
                          </DropdownMenuItem>
                          {invoice.status === 'draft' && (
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'sent' })}
                            >
                              <Send className="h-4 w-4" />
                              إرسال للشريك
                            </DropdownMenuItem>
                          )}
                          {['pending', 'sent', 'partial'].includes(invoice.status) && (
                            <DropdownMenuItem 
                              className="gap-2 text-green-600"
                              onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'paid' })}
                            >
                              <CheckCircle className="h-4 w-4" />
                              تحديد كمدفوعة
                            </DropdownMenuItem>
                          )}
                          {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                            <DropdownMenuItem 
                              className="gap-2 text-red-600"
                              onClick={() => updateInvoiceStatus.mutate({ id: invoice.id, status: 'cancelled' })}
                            >
                              <XCircle className="h-4 w-4" />
                              إلغاء
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
