import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  Package,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RotateCcw,
  Printer,
  Download,
  Eye,
  Loader2,
  Info,
} from 'lucide-react';
import { LedgerEntry } from './AccountLedger';
import { cn } from '@/lib/utils';
import { usePDFExport } from '@/hooks/usePDFExport';
import AccountLedgerPrint from './AccountLedgerPrint';
import { createRoot } from 'react-dom/client';
import { WasteTypeInline } from './WasteTypeDetailsBadge';
import { wasteTypeLabels, getWasteTypeCode, isHazardousWasteType } from '@/lib/wasteClassification';

interface DetailedAccountLedgerProps {
  partnerName: string;
  partnerType: string;
  entries: LedgerEntry[];
  organizationName?: string;
  isGenerator?: boolean;
  onEntryClick?: (entry: LedgerEntry) => void;
}

export default function DetailedAccountLedger({
  partnerName,
  partnerType,
  entries,
  organizationName,
  isGenerator = false,
  onEntryClick,
}: DetailedAccountLedgerProps) {
  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const { exportToPDF, previewPDF } = usePDFExport({
    filename: `سجل-حساب-${partnerName}`,
    orientation: 'portrait',
  });

  // Filter entries by date range and type
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Date filter
      if (dateFrom) {
        const entryDate = new Date(entry.date);
        const fromDate = new Date(dateFrom);
        if (entryDate < fromDate) return false;
      }
      if (dateTo) {
        const entryDate = new Date(entry.date);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        if (entryDate > toDate) return false;
      }
      
      // Type filter
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;

      return true;
    });
  }, [entries, dateFrom, dateTo, typeFilter]);

  // Calculate comprehensive totals
  const totals = useMemo(() => {
    const shipmentEntries = filteredEntries.filter(e => e.type === 'shipment' && !e.isCancelled);
    const depositEntries = filteredEntries.filter(e => e.type === 'deposit');
    const paymentEntries = filteredEntries.filter(e => e.type === 'payment');
    const cancelledEntries = filteredEntries.filter(e => e.isCancelled);

    const totalShipmentValue = shipmentEntries.reduce((sum, e) => sum + Math.max(e.debit, e.credit), 0);
    const totalQuantity = shipmentEntries.reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalDeposits = depositEntries.reduce((sum, e) => sum + Math.max(e.debit, e.credit), 0);
    const totalPayments = paymentEntries.reduce((sum, e) => sum + Math.max(e.debit, e.credit), 0);
    const totalPaid = totalDeposits + totalPayments;

    const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
    const balance = totalDebit - totalCredit;

    return {
      shipmentCount: shipmentEntries.length,
      totalShipmentValue,
      totalQuantity,
      depositCount: depositEntries.length,
      totalDeposits,
      paymentCount: paymentEntries.length,
      totalPayments,
      totalPaid,
      cancelledCount: cancelledEntries.length,
      totalDebit,
      totalCredit,
      balance,
    };
  }, [filteredEntries]);

  // Calculate running balance
  const entriesWithBalance = useMemo(() => {
    let runningBalance = 0;
    return filteredEntries.map(entry => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });
  }, [filteredEntries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTypeFilter('all');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'shipment': return 'شحنة';
      case 'deposit': return 'إيداع';
      case 'payment': return 'دفعة';
      case 'invoice': return 'فاتورة';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string, isCancelled?: boolean) => {
    if (isCancelled) return 'bg-red-100 text-red-700 dark:bg-red-900/30';
    switch (type) {
      case 'shipment': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
      case 'deposit': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30';
      case 'payment': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30';
      case 'invoice': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30';
      default: return '';
    }
  };

  const handleExport = async (action: 'print' | 'pdf' | 'preview') => {
    setIsExporting(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(
          <AccountLedgerPrint
            partnerName={partnerName}
            partnerType={partnerType}
            entries={filteredEntries}
            organizationName={organizationName}
            printDate={`${format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ar })}${dateFrom || dateTo ? ' (مفلتر)' : ''}`}
          />
        );
        setTimeout(resolve, 100);
      });

      const element = container.firstChild as HTMLElement;

      if (action === 'print') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
              <head>
                <meta charset="UTF-8">
                <title>سجل حساب - ${partnerName}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
                  body { direction: rtl; background: white; }
                  @media print { @page { size: A4; margin: 10mm; } }
                </style>
              </head>
              <body>${element.outerHTML}</body>
            </html>
          `);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 300);
        }
      } else if (action === 'pdf') {
        await exportToPDF(element, `سجل-حساب-${partnerName}`);
      } else {
        await previewPDF(element);
      }

      root.unmount();
      document.body.removeChild(container);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Shipments */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground mb-1">الشحنات</p>
            <p className="text-lg font-bold">{totals.shipmentCount}</p>
            <p className="text-xs text-blue-600">{formatCurrency(totals.totalShipmentValue)} ج.م</p>
          </CardContent>
        </Card>

        {/* Total Quantity */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 text-center">
            <Scale className="h-6 w-6 mx-auto mb-2 text-slate-600" />
            <p className="text-xs text-muted-foreground mb-1">إجمالي الكمية</p>
            <p className="text-lg font-bold">{formatCurrency(totals.totalQuantity)}</p>
            <p className="text-xs text-muted-foreground">كجم</p>
          </CardContent>
        </Card>

        {/* Deposits */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <Banknote className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-xs text-muted-foreground mb-1">الإيداعات</p>
            <p className="text-lg font-bold">{totals.depositCount}</p>
            <p className="text-xs text-purple-600">{formatCurrency(totals.totalDeposits)} ج.م</p>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
            <p className="text-xs text-muted-foreground mb-1">المدفوعات</p>
            <p className="text-lg font-bold">{totals.paymentCount}</p>
            <p className="text-xs text-emerald-600">{formatCurrency(totals.totalPayments)} ج.م</p>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-xs text-muted-foreground mb-1">إجمالي المدفوع</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
            <p className="text-xs text-muted-foreground">ج.م</p>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className={cn(
          'border-2',
          totals.balance > 0 ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20' :
          totals.balance < 0 ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20' :
          'border-slate-300 dark:border-slate-600'
        )}>
          <CardContent className="p-4 text-center">
            {totals.balance > 0 ? (
              <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-600" />
            ) : (
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
            )}
            <p className="text-xs text-muted-foreground mb-1">الرصيد النهائي</p>
            <p className={cn(
              'text-xl font-bold',
              totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : ''
            )}>
              {formatCurrency(Math.abs(totals.balance))}
            </p>
            <p className={cn(
              'text-xs font-medium',
              totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : 'text-muted-foreground'
            )}>
              {totals.balance > 0 ? 'علينا' : totals.balance < 0 ? 'لنا' : 'مسدد'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">تصفية المدة:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">من</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="dateTo" className="text-xs text-muted-foreground">إلى</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 w-40"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="shipment">شحنات</SelectItem>
                <SelectItem value="deposit">إيداعات</SelectItem>
                <SelectItem value="payment">دفعات</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              إعادة ضبط
            </Button>

            <div className="mr-auto flex items-center gap-2">
              <Badge variant="secondary">
                {filteredEntries.length} حركة
              </Badge>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('preview')}
                disabled={isExporting}
                className="gap-1"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                معاينة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('print')}
                disabled={isExporting}
                className="gap-1"
              >
                <Printer className="h-3.5 w-3.5" />
                طباعة
              </Button>
              <Button
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            سجل الحركات المالية
            {(dateFrom || dateTo) && (
              <Badge variant="outline" className="text-xs font-normal">
                <Calendar className="h-3 w-3 ml-1" />
                {dateFrom && formatDate(dateFrom)}
                {dateFrom && dateTo && ' - '}
                {dateTo && formatDate(dateTo)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center font-bold">#</TableHead>
                  <TableHead className="text-center font-bold w-24">التاريخ</TableHead>
                  <TableHead className="text-center font-bold w-20">النوع</TableHead>
                  <TableHead className="font-bold">البيان</TableHead>
                  <TableHead className="text-center font-bold w-20">الكمية</TableHead>
                  <TableHead className="text-center font-bold w-24">سعر الوحدة</TableHead>
                  <TableHead className="text-center font-bold w-24">مدين</TableHead>
                  <TableHead className="text-center font-bold w-24">دائن</TableHead>
                  <TableHead className="text-center font-bold w-28">الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithBalance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      لا توجد حركات في الفترة المحددة
                    </TableCell>
                  </TableRow>
                ) : (
                  entriesWithBalance.map((entry, index) => (
                    <TableRow 
                      key={entry.id}
                      className={cn(
                        'transition-colors',
                        onEntryClick && 'cursor-pointer hover:bg-muted/50',
                        entry.isCancelled && 'opacity-50'
                      )}
                      onClick={() => onEntryClick?.(entry)}
                    >
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="text-center text-sm">{formatDate(entry.date)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn('text-xs', getTypeBadgeColor(entry.type, entry.isCancelled))}>
                          {entry.isCancelled ? 'ملغاة' : getTypeLabel(entry.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn('cursor-help', entry.isCancelled && 'line-through opacity-60')}>
                                <p className="text-sm font-medium">{entry.description}</p>
                                {entry.reference && (
                                  <p className="text-xs text-muted-foreground font-mono">{entry.reference}</p>
                                )}
                                {entry.type === 'shipment' && entry.quantity && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Intl.NumberFormat('ar-EG').format(entry.quantity)} {entry.unit || 'كجم'} × {entry.unitPrice ? `${new Intl.NumberFormat('ar-EG').format(entry.unitPrice)} ج.م` : '-'}
                                  </p>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1 text-sm">
                                <p className="font-bold">{entry.description}</p>
                                {entry.type === 'shipment' && (
                                  <>
                                    <p className="text-xs">الكمية: {entry.quantity ? `${new Intl.NumberFormat('ar-EG').format(entry.quantity)} ${entry.unit || 'كجم'}` : '-'}</p>
                                    <p className="text-xs">سعر الوحدة: {entry.unitPrice ? `${new Intl.NumberFormat('ar-EG').format(entry.unitPrice)} ج.م` : 'غير محدد'}</p>
                                    {entry.debit > 0 && <p className="text-xs text-red-400">المبلغ: {new Intl.NumberFormat('ar-EG').format(entry.debit)} ج.م (مدين)</p>}
                                    {entry.credit > 0 && <p className="text-xs text-emerald-400">المبلغ: {new Intl.NumberFormat('ar-EG').format(entry.credit)} ج.م (دائن)</p>}
                                  </>
                                )}
                                {entry.reference && <p className="text-xs text-muted-foreground">المرجع: {entry.reference}</p>}
                                {entry.isCancelled && <p className="text-xs text-red-400">⚠️ هذه الحركة ملغاة</p>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {entry.quantity ? `${formatCurrency(entry.quantity)} ${entry.unit || ''}` : '-'}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {entry.unitPrice ? `${formatCurrency(entry.unitPrice)} ج.م` : '-'}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Totals */}
          {entriesWithBalance.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30">
              <div className="text-center p-3 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">عدد الحركات</p>
                <p className="text-lg font-bold">{filteredEntries.length}</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 mb-1">إجمالي المدين</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(totals.totalDebit)} ج.م</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 mb-1">إجمالي الدائن</p>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(totals.totalCredit)} ج.م</p>
              </div>
              <div className={cn(
                'text-center p-3 rounded-lg border',
                totals.balance > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 
                totals.balance < 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' : 
                'bg-muted/30'
              )}>
                <p className={cn(
                  'text-xs mb-1',
                  totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : 'text-muted-foreground'
                )}>
                  الرصيد النهائي
                </p>
                <p className={cn(
                  'text-lg font-bold',
                  totals.balance > 0 ? 'text-red-700' : totals.balance < 0 ? 'text-emerald-700' : ''
                )}>
                  {formatCurrency(Math.abs(totals.balance))} ج.م
                  <span className="text-sm font-normal mr-1">
                    ({totals.balance > 0 ? 'علينا' : totals.balance < 0 ? 'لنا' : 'مسدد'})
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
