import { useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Plus, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  invoice_type: string;
  notes?: string;
}

interface InvoicesAccountViewProps {
  invoices: Invoice[];
  isLoading?: boolean;
  onCreateInvoice?: () => void;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  draft: { label: 'مسودة', icon: FileText, color: 'bg-muted text-foreground dark:bg-card dark:text-gray-300' },
  pending: { label: 'معلقة', icon: Clock, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  partial: { label: 'مدفوعة جزئياً', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  paid: { label: 'مدفوعة', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  overdue: { label: 'متأخرة', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  cancelled: { label: 'ملغاة', icon: XCircle, color: 'bg-muted text-muted-foreground dark:bg-card dark:text-muted-foreground' },
};

export default function InvoicesAccountView({ 
  invoices, 
  isLoading,
  onCreateInvoice 
}: InvoicesAccountViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  // Summary calculations
  const summary = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const pendingCount = invoices.filter(inv => ['pending', 'partial', 'overdue'].includes(inv.status)).length;
    
    return {
      total: invoices.length,
      totalInvoiced,
      totalPaid,
      remaining: totalInvoiced - totalPaid,
      paidCount,
      pendingCount,
    };
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">لا توجد فواتير</p>
        <p className="text-sm mb-4">ستظهر الفواتير هنا بعد إنشائها</p>
        {onCreateInvoice && (
          <Button onClick={onCreateInvoice} className="gap-2">
            <Plus className="h-4 w-4" />
            إنشاء فاتورة جديدة
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{summary.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي الفواتير</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{formatCurrency(summary.totalInvoiced)}</p>
          <p className="text-xs text-muted-foreground">إجمالي المبالغ (ج.م)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalPaid)}</p>
          <p className="text-xs text-muted-foreground">المدفوع (ج.م)</p>
        </div>
        <div className="text-center">
          <p className={cn(
            'text-2xl font-bold',
            summary.remaining > 0 ? 'text-amber-600' : 'text-emerald-600'
          )}>
            {formatCurrency(summary.remaining)}
          </p>
          <p className="text-xs text-muted-foreground">المتبقي (ج.م)</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="border rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 text-center font-bold">#</TableHead>
              <TableHead className="font-bold">رقم الفاتورة</TableHead>
              <TableHead className="text-center font-bold">التاريخ</TableHead>
              <TableHead className="text-center font-bold">المبلغ</TableHead>
              <TableHead className="text-center font-bold">المدفوع</TableHead>
              <TableHead className="text-center font-bold">المتبقي</TableHead>
              <TableHead className="text-center font-bold">الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice, index) => {
              const remaining = (Number(invoice.total_amount) || 0) - (Number(invoice.paid_amount) || 0);
              const status = statusConfig[invoice.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              
              return (
                <TableRow 
                  key={invoice.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="text-center text-muted-foreground font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium text-primary">
                      {invoice.invoice_number}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {formatDate(invoice.issue_date)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatCurrency(Number(invoice.total_amount) || 0)} ج.م
                  </TableCell>
                  <TableCell className="text-center text-emerald-600 font-medium">
                    {formatCurrency(Number(invoice.paid_amount) || 0)} ج.م
                  </TableCell>
                  <TableCell className={cn(
                    'text-center font-bold',
                    remaining > 0 ? 'text-amber-600' : 'text-muted-foreground'
                  )}>
                    {formatCurrency(remaining)} ج.م
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={cn('gap-1', status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create Invoice Button */}
      {onCreateInvoice && (
        <div className="flex justify-center">
          <Button onClick={onCreateInvoice} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            إنشاء فاتورة جديدة
          </Button>
        </div>
      )}
    </div>
  );
}
