import { useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, FileText, CreditCard, ArrowUpRight, ArrowDownRight, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'shipment' | 'invoice' | 'payment' | 'deposit' | 'cancellation';
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  debit: number;  // ما علينا (مدين)
  credit: number; // ما لنا (دائن)
  reference?: string;
  isCancelled?: boolean;
}

interface AccountLedgerProps {
  entries: LedgerEntry[];
  previousBalance?: number;
  onEntryClick?: (entry: LedgerEntry) => void;
}

export default function AccountLedger({ 
  entries, 
  previousBalance = 0,
  onEntryClick 
}: AccountLedgerProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  // Calculate running balance
  const entriesWithBalance = useMemo(() => {
    let runningBalance = previousBalance;
    return entries.map(entry => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance,
      };
    });
  }, [entries, previousBalance]);

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
  const finalBalance = previousBalance + totalDebit - totalCredit;

  const getTypeIcon = (type: string, isCancelled?: boolean) => {
    if (isCancelled) {
      return <Package className="h-4 w-4 line-through opacity-50" />;
    }
    switch (type) {
      case 'shipment':
        return <Package className="h-4 w-4" />;
      case 'invoice':
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'deposit':
        return <Banknote className="h-4 w-4" />;
      case 'cancellation':
        return <Package className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string, isCancelled?: boolean) => {
    if (isCancelled) {
      return 'ملغاة';
    }
    switch (type) {
      case 'shipment':
        return 'شحنة';
      case 'invoice':
        return 'فاتورة';
      case 'payment':
        return 'دفعة';
      case 'deposit':
        return 'إيداع';
      case 'cancellation':
        return 'إلغاء';
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string, isCancelled?: boolean) => {
    if (isCancelled) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 line-through';
    }
    switch (type) {
      case 'shipment':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'invoice':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'payment':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'deposit':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'cancellation':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return '';
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">لا توجد حركات مالية</p>
        <p className="text-sm">ستظهر الحركات هنا عند إنشاء الشحنات والفواتير</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Previous Balance */}
      {previousBalance !== 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
          <span className="text-muted-foreground">الرصيد السابق</span>
          <span className={cn(
            'font-bold',
            previousBalance > 0 ? 'text-red-600' : previousBalance < 0 ? 'text-emerald-600' : ''
          )}>
            {formatCurrency(Math.abs(previousBalance))} ج.م
            {previousBalance > 0 && <Badge variant="outline" className="mr-2 text-xs">مدين</Badge>}
            {previousBalance < 0 && <Badge variant="outline" className="mr-2 text-xs">دائن</Badge>}
          </span>
        </div>
      )}

      {/* Ledger Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center font-bold">#</TableHead>
              <TableHead className="text-center font-bold w-24">التاريخ</TableHead>
              <TableHead className="text-center font-bold w-20">النوع</TableHead>
              <TableHead className="font-bold">البيان</TableHead>
              <TableHead className="text-center font-bold w-20">الكمية</TableHead>
              <TableHead className="text-center font-bold w-24">السعر</TableHead>
              <TableHead className="text-center font-bold w-24">مدين (علينا)</TableHead>
              <TableHead className="text-center font-bold w-24">دائن (لنا)</TableHead>
              <TableHead className="text-center font-bold w-28">الرصيد</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entriesWithBalance.map((entry, index) => (
              <TableRow 
                key={entry.id}
                className={cn(
                  'transition-colors',
                  onEntryClick && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onEntryClick?.(entry)}
              >
                <TableCell className="text-center text-muted-foreground font-medium">
                  {index + 1}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className={cn('gap-1', getTypeBadgeVariant(entry.type, entry.isCancelled))}>
                    {getTypeIcon(entry.type, entry.isCancelled)}
                    {getTypeLabel(entry.type, entry.isCancelled)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{entry.description}</p>
                    {entry.reference && (
                      <p className="text-xs text-muted-foreground font-mono">{entry.reference}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {entry.quantity ? (
                    <span className="text-sm">
                      {formatCurrency(entry.quantity)}
                      {entry.unit && <span className="text-muted-foreground text-xs mr-1">{entry.unit}</span>}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {entry.unitPrice ? (
                    <span className="text-sm">{formatCurrency(entry.unitPrice)} ج.م</span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {entry.debit > 0 ? (
                    <span className="text-red-600 font-medium">{formatCurrency(entry.debit)}</span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {entry.credit > 0 ? (
                    <span className="text-emerald-600 font-medium">{formatCurrency(entry.credit)}</span>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {entry.balance > 0 ? (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    ) : entry.balance < 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : null}
                    <span className={cn(
                      'font-bold',
                      entry.balance > 0 ? 'text-red-600' : entry.balance < 0 ? 'text-emerald-600' : ''
                    )}>
                      {formatCurrency(Math.abs(entry.balance))}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-muted/30 rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-1">عدد الحركات</p>
          <p className="text-lg font-bold">{entries.length}</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-center border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 mb-1">إجمالي المدين</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{formatCurrency(totalDebit)} ج.م</p>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">إجمالي الدائن</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalCredit)} ج.م</p>
        </div>
        <div className={cn(
          'p-3 rounded-lg text-center border',
          finalBalance > 0 
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
            : finalBalance < 0 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-muted/30 border-border'
        )}>
          <p className={cn(
            'text-xs mb-1',
            finalBalance > 0 ? 'text-red-600' : finalBalance < 0 ? 'text-emerald-600' : 'text-muted-foreground'
          )}>
            الرصيد النهائي
          </p>
          <p className={cn(
            'text-lg font-bold',
            finalBalance > 0 ? 'text-red-700 dark:text-red-300' : finalBalance < 0 ? 'text-emerald-700 dark:text-emerald-300' : ''
          )}>
            {formatCurrency(Math.abs(finalBalance))} ج.م
          </p>
          <p className={cn(
            'text-xs',
            finalBalance > 0 ? 'text-red-600' : finalBalance < 0 ? 'text-emerald-600' : 'text-muted-foreground'
          )}>
            {finalBalance > 0 ? 'علينا' : finalBalance < 0 ? 'لنا' : 'مسدد'}
          </p>
        </div>
      </div>
    </div>
  );
}
