import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar, ArrowUpRight, ArrowDownRight, Filter, RotateCcw,
  Printer, Download, Eye, Loader2, Pencil, FileImage, Trash2, Unlink,
} from 'lucide-react';
import { LedgerEntry } from './AccountLedger';
import { cn } from '@/lib/utils';
import { usePDFExport } from '@/hooks/usePDFExport';
import AccountLedgerPrint from './AccountLedgerPrint';
import { createRoot } from 'react-dom/client';
import EditDepositDialog from '@/components/deposits/EditDepositDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import LedgerSummaryCards from './ledger/LedgerSummaryCards';

interface Deposit {
  id: string;
  amount: number;
  deposit_date: string;
  depositor_name: string;
  depositor_title?: string;
  depositor_position?: string;
  depositor_phone?: string;
  transfer_method: string;
  bank_name?: string;
  account_number?: string;
  branch_name?: string;
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
  partner_organization_id?: string;
  external_partner_id?: string;
}

interface DetailedAccountLedgerProps {
  partnerName: string;
  partnerType: string;
  entries: LedgerEntry[];
  organizationName?: string;
  isGenerator?: boolean;
  onEntryClick?: (entry: LedgerEntry) => void;
  onDepositUpdated?: () => void;
}

export default function DetailedAccountLedger({
  partnerName,
  partnerType,
  entries,
  organizationName,
  isGenerator = false,
  onEntryClick,
  onDepositUpdated,
}: DetailedAccountLedgerProps) {
  const queryClient = useQueryClient();
  
  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  
  // Edit deposit state
  const [editDepositOpen, setEditDepositOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [loadingDepositId, setLoadingDepositId] = useState<string | null>(null);
  const [deletingDepositId, setDeletingDepositId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [togglingMergeId, setTogglingMergeId] = useState<string | null>(null);

  const handleToggleMerge = async (entryId: string, currentMerged: boolean) => {
    const realId = entryId.replace('manual-', '');
    setTogglingMergeId(realId);
    try {
      await (supabase.from('accounting_ledger').update({ ledger_merged: !currentMerged } as any) as any)
        .eq('id', realId);
      queryClient.invalidateQueries({ queryKey: ['partner-manual-shipment-entries'] });
      toast.success(currentMerged ? 'تم فصل القيد من الحسابات المدمجة' : 'تم دمج القيد مع الحسابات');
    } catch {
      toast.error('فشل في تحديث حالة الدمج');
    }
    setTogglingMergeId(null);
  };

  const { exportToPDF, previewPDF, printContent } = usePDFExport({
    filename: `سجل-حساب-${partnerName}`,
    orientation: 'portrait',
  });
  
  // Function to load deposit details and open edit dialog
  const handleEditDeposit = async (depositId: string) => {
    setLoadingDepositId(depositId);
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single();
      
      if (error) throw error;
      
      setSelectedDeposit(data);
      setEditDepositOpen(true);
    } catch (error) {
      console.error('Error loading deposit:', error);
    } finally {
      setLoadingDepositId(null);
    }
  };
  
  const handleDepositUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['partner-deposits'] });
    onDepositUpdated?.();
  };
  
  // Handle deleting deposit
  const handleDeleteDeposit = async (depositId: string) => {
    setDeletingDepositId(depositId);
    try {
      const { error } = await supabase
        .from('deposits')
        .delete()
        .eq('id', depositId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['partner-deposits'] });
      onDepositUpdated?.();
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Error deleting deposit:', error);
    } finally {
      setDeletingDepositId(null);
    }
  };
  
  // Handle saving shipment notes
  const handleSaveNotes = async (shipmentId: string, notes: string) => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ account_notes: notes })
        .eq('id', shipmentId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['partner-shipments'] });
      setEditingNotesId(null);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

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
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount);
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
            printDate={`${format(new Date(), 'dd/MM/yyyy - hh:mm a', { locale: ar })}${dateFrom || dateTo ? ' (مفلتر)' : ''}`}
          />
        );
        setTimeout(resolve, 100);
      });

      const element = container.firstChild as HTMLElement;

      if (action === 'print') {
        printContent(element);
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

  // Prepare detailed lists for dialogs
  const shipmentEntries = useMemo(() => 
    filteredEntries.filter(e => e.type === 'shipment' && !e.isCancelled), 
    [filteredEntries]
  );
  const depositEntries = useMemo(() => 
    filteredEntries.filter(e => e.type === 'deposit'), 
    [filteredEntries]
  );
  const paymentEntries = useMemo(() => 
    filteredEntries.filter(e => e.type === 'payment'), 
    [filteredEntries]
  );
  const cancelledEntries = useMemo(() => 
    filteredEntries.filter(e => e.isCancelled), 
    [filteredEntries]
  );

  // Group shipments by waste type for quantity breakdown
  const wasteTypeBreakdown = useMemo(() => {
    const breakdown: Record<string, { quantity: number; value: number; count: number }> = {};
    shipmentEntries.forEach(entry => {
      const wasteType = entry.description || 'أخرى';
      if (!breakdown[wasteType]) {
        breakdown[wasteType] = { quantity: 0, value: 0, count: 0 };
      }
      breakdown[wasteType].quantity += entry.quantity || 0;
      breakdown[wasteType].value += Math.max(entry.debit, entry.credit);
      breakdown[wasteType].count += 1;
    });
    return Object.entries(breakdown).sort((a, b) => b[1].quantity - a[1].quantity);
  }, [shipmentEntries]);

  return (
    <div className="space-y-6">
      <LedgerSummaryCards
        totals={totals}
        shipmentEntries={shipmentEntries}
        depositEntries={depositEntries}
        paymentEntries={paymentEntries}
        wasteTypeBreakdown={wasteTypeBreakdown}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onEditDeposit={handleEditDeposit}
        onDeleteDeposit={handleDeleteDeposit}
        loadingDepositId={loadingDepositId}
        deletingDepositId={deletingDepositId}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        handleDeleteDeposit={handleDeleteDeposit}
      />

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
          <div className="border rounded-lg overflow-x-auto">
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
                  <TableHead className="text-center font-bold w-16">الإيصال</TableHead>
                  <TableHead className="text-center font-bold w-40">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithBalance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
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
                      {/* Receipt Column */}
                      <TableCell className="text-center">
                        {entry.type === 'deposit' && entry.receiptUrl ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(entry.receiptUrl, '_blank');
                                  }}
                                >
                                  <FileImage className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-center">
                                  <p className="font-medium">عرض صورة الإيصال</p>
                                  {entry.depositorName && (
                                    <p className="text-xs text-muted-foreground">المودع: {entry.depositorName}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : entry.type === 'deposit' ? (
                          <span className="text-muted-foreground/50 text-xs">-</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {/* Notes/Actions Column */}
                      <TableCell className="text-center">
                        {entry.type === 'deposit' ? (
                          // Deposit Actions - Edit/Delete with tooltip
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const depositId = entry.id.replace('deposit-', '');
                                      handleEditDeposit(depositId);
                                    }}
                                    disabled={loadingDepositId === entry.id.replace('deposit-', '')}
                                  >
                                    {loadingDepositId === entry.id.replace('deposit-', '') ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Pencil className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>تعديل الإيداع</p>
                                  <p className="text-xs text-amber-600">إلغاء تلك الخطوة</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const depositId = entry.id.replace('deposit-', '');
                                      setConfirmDeleteId(depositId);
                                    }}
                                    disabled={deletingDepositId === entry.id.replace('deposit-', '')}
                                  >
                                    {deletingDepositId === entry.id.replace('deposit-', '') ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>حذف الإيداع</p>
                                  <p className="text-xs text-destructive">إلغاء تلك الخطوة</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {/* Confirm Delete Inline */}
                            {confirmDeleteId === entry.id.replace('deposit-', '') && (
                              <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm rounded flex items-center justify-center gap-2 z-10">
                                <span className="text-xs font-medium text-destructive">حذف؟</span>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteDeposit(entry.id.replace('deposit-', ''));
                                  }}
                                >
                                  نعم
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                >
                                  لا
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : entry.type === 'shipment' && entry.shipmentId ? (
                          editingNotesId === entry.shipmentId ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="أضف ملاحظة..."
                                className="h-7 text-xs min-w-[120px]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveNotes(entry.shipmentId!, notesValue);
                                  } else if (e.key === 'Escape') {
                                    setEditingNotesId(null);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleSaveNotes(entry.shipmentId!, notesValue)}
                                disabled={savingNotes}
                              >
                                {savingNotes ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ArrowUpRight className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNotesId(entry.shipmentId!);
                                setNotesValue(entry.notes || '');
                              }}
                            >
                              {entry.notes ? (
                                <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                                  {entry.notes}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">+ ملاحظة</span>
                              )}
                              <Pencil className="h-3 w-3 text-muted-foreground/50" />
                            </div>
                          )
                        ) : entry.id.startsWith('manual-') ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleMerge(entry.id, true);
                                  }}
                                  disabled={togglingMergeId === entry.id.replace('manual-', '')}
                                >
                                  {togglingMergeId === entry.id.replace('manual-', '') ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Unlink className="h-3 w-3" />
                                  )}
                                  فصل
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>فصل هذا القيد من حسابات الشريك</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
      
      {/* Edit Deposit Dialog */}
      <EditDepositDialog
        open={editDepositOpen}
        onOpenChange={setEditDepositOpen}
        deposit={selectedDeposit}
        onSuccess={handleDepositUpdated}
      />
    </div>
  );
}
