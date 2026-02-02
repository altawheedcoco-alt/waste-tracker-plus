import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Filter,
  Printer,
  Download,
  Eye,
  Calendar,
  Package,
  CreditCard,
  Banknote,
  FileText,
  RotateCcw,
  Loader2,
  Check,
} from 'lucide-react';
import { LedgerEntry } from './AccountLedger';
import { usePDFExport } from '@/hooks/usePDFExport';
import { cn } from '@/lib/utils';
import AccountLedgerPrint from './AccountLedgerPrint';
import { createRoot } from 'react-dom/client';

interface AccountLedgerFilterDialogProps {
  entries: LedgerEntry[];
  partnerName: string;
  partnerType: string;
  organizationName?: string;
  trigger?: React.ReactNode;
}

const entryTypes = [
  { id: 'shipment', label: 'شحنات', icon: Package, color: 'text-blue-600' },
  { id: 'payment', label: 'دفعات', icon: CreditCard, color: 'text-emerald-600' },
  { id: 'deposit', label: 'إيداعات', icon: Banknote, color: 'text-purple-600' },
  { id: 'invoice', label: 'فواتير', icon: FileText, color: 'text-amber-600' },
];

export default function AccountLedgerFilterDialog({
  entries,
  partnerName,
  partnerType,
  organizationName,
  trigger,
}: AccountLedgerFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['shipment', 'payment', 'deposit', 'invoice']);
  const [showCancelled, setShowCancelled] = useState(true);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { exportToPDF, previewPDF } = usePDFExport({
    filename: `كشف-حساب-${partnerName}`,
    orientation: 'portrait',
  });

  // Filter entries
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
      if (!selectedTypes.includes(entry.type)) return false;

      // Cancelled filter
      if (!showCancelled && entry.isCancelled) return false;

      // Amount filter
      const amount = Math.max(entry.debit, entry.credit);
      if (minAmount && amount < Number(minAmount)) return false;
      if (maxAmount && amount > Number(maxAmount)) return false;

      return true;
    });
  }, [entries, dateFrom, dateTo, selectedTypes, showCancelled, minAmount, maxAmount]);

  // Calculate totals for filtered entries
  const totals = useMemo(() => {
    const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
    const balance = totalDebit - totalCredit;
    return { totalDebit, totalCredit, balance };
  }, [filteredEntries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedTypes(['shipment', 'payment', 'deposit', 'invoice']);
    setShowCancelled(true);
    setMinAmount('');
    setMaxAmount('');
  };

  const getTypeConfig = (type: string) => {
    return entryTypes.find(t => t.id === type) || entryTypes[0];
  };

  const renderAndExport = async (action: 'print' | 'pdf' | 'preview') => {
    setIsExporting(true);
    
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const root = createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(
          <AccountLedgerPrint
            partnerName={partnerName}
            partnerType={partnerType}
            entries={filteredEntries}
            organizationName={organizationName}
            printDate={`${format(new Date(), 'dd/MM/yyyy - HH:mm', { locale: ar })} (مفلتر)`}
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
                <title>كشف حساب - ${partnerName}</title>
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
        await exportToPDF(element, `كشف-حساب-${partnerName}-مفلتر`);
      } else if (action === 'preview') {
        await previewPDF(element);
      }

      root.unmount();
      document.body.removeChild(container);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            فلترة وطباعة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فلترة كشف الحساب - {partnerName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Filters Section */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  من تاريخ
                </Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  إلى تاريخ
                </Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="text-xs">الحد الأدنى للمبلغ</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">الحد الأقصى للمبلغ</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">نوع الحركة:</span>
              {entryTypes.map(type => {
                const Icon = type.icon;
                const isSelected = selectedTypes.includes(type.id);
                return (
                  <Button
                    key={type.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={cn('gap-1.5', isSelected && 'bg-primary')}
                    onClick={() => toggleType(type.id)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {type.label}
                    {isSelected && <Check className="h-3 w-3" />}
                  </Button>
                );
              })}

              <Separator orientation="vertical" className="h-6 mx-2" />

              <div className="flex items-center gap-2">
                <Checkbox
                  id="showCancelled"
                  checked={showCancelled}
                  onCheckedChange={(checked) => setShowCancelled(!!checked)}
                />
                <Label htmlFor="showCancelled" className="text-sm cursor-pointer">
                  إظهار الملغاة
                </Label>
              </div>

              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 mr-auto">
                <RotateCcw className="h-3.5 w-3.5" />
                إعادة ضبط
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Badge variant="secondary" className="text-sm py-1 px-3">
                عدد النتائج: {filteredEntries.length} من {entries.length}
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3 text-red-600 border-red-200">
                إجمالي المدين: {formatCurrency(totals.totalDebit)} ج.م
              </Badge>
              <Badge variant="outline" className="text-sm py-1 px-3 text-emerald-600 border-emerald-200">
                إجمالي الدائن: {formatCurrency(totals.totalCredit)} ج.م
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  'text-sm py-1 px-3',
                  totals.balance > 0 ? 'text-red-600 border-red-200' : 'text-emerald-600 border-emerald-200'
                )}
              >
                الرصيد: {formatCurrency(Math.abs(totals.balance))} ج.م ({totals.balance > 0 ? 'علينا' : 'لنا'})
              </Badge>
            </div>
          </div>

          {/* Results Table */}
          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="text-center w-24">التاريخ</TableHead>
                  <TableHead className="text-center w-20">النوع</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead className="text-center w-20">الكمية</TableHead>
                  <TableHead className="text-center w-24">مدين</TableHead>
                  <TableHead className="text-center w-24">دائن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد نتائج تطابق معايير البحث
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry, index) => {
                    const typeConfig = getTypeConfig(entry.type);
                    const Icon = typeConfig.icon;
                    return (
                      <TableRow 
                        key={entry.id}
                        className={cn(entry.isCancelled && 'opacity-50 line-through')}
                      >
                        <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="text-center text-sm">{formatDate(entry.date)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn('gap-1', typeConfig.color)}>
                            <Icon className="h-3 w-3" />
                            {typeConfig.label.slice(0, -2) || typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.description}</div>
                          {entry.reference && (
                            <div className="text-xs text-muted-foreground font-mono">{entry.reference}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {entry.quantity ? `${formatCurrency(entry.quantity)} ${entry.unit || ''}` : '-'}
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              تم تحديد {filteredEntries.length} حركة للتصدير
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => renderAndExport('preview')}
                disabled={isExporting || filteredEntries.length === 0}
                className="gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                معاينة
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => renderAndExport('print')}
                disabled={isExporting || filteredEntries.length === 0}
                className="gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                طباعة
              </Button>
              <Button
                size="sm"
                onClick={() => renderAndExport('pdf')}
                disabled={isExporting || filteredEntries.length === 0}
                className="gap-2"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                تحميل PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
