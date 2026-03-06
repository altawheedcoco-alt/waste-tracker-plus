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
  Pencil,
  FileImage,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Link,
  Unlink,
} from 'lucide-react';
import { LedgerEntry } from './AccountLedger';
import { cn } from '@/lib/utils';
import { usePDFExport } from '@/hooks/usePDFExport';
import AccountLedgerPrint from './AccountLedgerPrint';
import { createRoot } from 'react-dom/client';
import { WasteTypeInline } from './WasteTypeDetailsBadge';
import { wasteTypeLabels, getWasteTypeCode, isHazardousWasteType } from '@/lib/wasteClassification';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table as DetailTable,
  TableBody as DetailTableBody,
  TableCell as DetailTableCell,
  TableHead as DetailTableHead,
  TableHeader as DetailTableHeader,
  TableRow as DetailTableRow,
} from '@/components/ui/table';
import EditDepositDialog from '@/components/deposits/EditDepositDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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
      {/* Summary Cards with Dialogs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Shipments Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all">
              <CardContent className="p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-xs text-muted-foreground mb-1">الشحنات</p>
                <p className="text-lg font-bold">{totals.shipmentCount}</p>
                <p className="text-xs text-blue-600">{formatCurrency(totals.totalShipmentValue)} ج.م</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                تفاصيل الشحنات ({totals.shipmentCount} شحنة)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">عدد الشحنات</p>
                  <p className="text-xl font-bold text-blue-600">{totals.shipmentCount}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalQuantity)} كجم</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalShipmentValue)} ج.م</p>
                </div>
              </div>

              {/* Waste Type Breakdown */}
              {wasteTypeBreakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    توزيع أنواع المخلفات
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {wasteTypeBreakdown.map(([wasteType, data]) => (
                      <div key={wasteType} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate max-w-[180px]">{wasteType}</span>
                          <Badge variant="secondary" className="text-[10px]">{data.count} شحنة</Badge>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">{formatCurrency(data.quantity)} كجم</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(data.value)} ج.م</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Shipments */}
              <div>
                <h4 className="text-sm font-semibold mb-2">آخر الشحنات</h4>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <DetailTable>
                    <DetailTableHeader>
                      <DetailTableRow>
                        <DetailTableHead className="text-right">التاريخ</DetailTableHead>
                        <DetailTableHead className="text-right">النوع</DetailTableHead>
                        <DetailTableHead className="text-right">الكمية</DetailTableHead>
                        <DetailTableHead className="text-right">المبلغ</DetailTableHead>
                      </DetailTableRow>
                    </DetailTableHeader>
                    <DetailTableBody>
                      {shipmentEntries.slice(0, 10).map((entry, idx) => (
                        <DetailTableRow key={idx}>
                          <DetailTableCell className="text-sm">{formatDate(entry.date)}</DetailTableCell>
                          <DetailTableCell className="text-sm truncate max-w-[150px]">{entry.description}</DetailTableCell>
                          <DetailTableCell className="text-sm">{entry.quantity ? `${formatCurrency(entry.quantity)} كجم` : '-'}</DetailTableCell>
                          <DetailTableCell className="text-sm font-semibold">{formatCurrency(Math.max(entry.debit, entry.credit))} ج.م</DetailTableCell>
                        </DetailTableRow>
                      ))}
                    </DetailTableBody>
                  </DetailTable>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Total Quantity Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all">
              <CardContent className="p-4 text-center">
                <Scale className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-muted-foreground mb-1">إجمالي الكمية</p>
                <p className="text-lg font-bold">{formatCurrency(totals.totalQuantity)}</p>
                <p className="text-xs text-muted-foreground">كجم</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-slate-600" />
                تفاصيل الكميات
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">إجمالي الكميات</p>
                <p className="text-3xl font-bold">{formatCurrency(totals.totalQuantity)}</p>
                <p className="text-lg text-muted-foreground">كيلوجرام</p>
              </div>
              
              <Separator />
              
              <h4 className="text-sm font-semibold">توزيع الكميات حسب نوع المخلف:</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {wasteTypeBreakdown.map(([wasteType, data]) => {
                  const percentage = totals.totalQuantity > 0 ? (data.quantity / totals.totalQuantity) * 100 : 0;
                  return (
                    <div key={wasteType} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate max-w-[200px]">{wasteType}</span>
                        <span className="text-sm font-bold">{formatCurrency(data.quantity)} كجم</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-500 rounded-full" 
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-left">{percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Deposits Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all">
              <CardContent className="p-4 text-center">
                <Banknote className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-xs text-muted-foreground mb-1">الإيداعات</p>
                <p className="text-lg font-bold">{totals.depositCount}</p>
                <p className="text-xs text-purple-600">{formatCurrency(totals.totalDeposits)} ج.م</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-purple-600" />
                تفاصيل الإيداعات ({totals.depositCount} إيداع)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">إجمالي الإيداعات</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(totals.totalDeposits)}</p>
                <p className="text-lg text-muted-foreground">جنيه مصري</p>
              </div>
              
              {depositEntries.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {depositEntries.map((entry, idx) => {
                    // Extract deposit ID from entry.id (format: deposit-{uuid})
                    const depositId = entry.id.replace('deposit-', '');
                    const isLoading = loadingDepositId === depositId;
                    const isDeleting = deletingDepositId === depositId;
                    const showConfirmDelete = confirmDeleteId === depositId;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group relative">
                        {/* Confirm Delete Overlay */}
                        {showConfirmDelete && (
                          <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm rounded-lg flex items-center justify-center gap-3 z-10">
                            <span className="text-sm font-medium text-destructive">تأكيد الحذف؟</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDeposit(depositId);
                              }}
                              disabled={isDeleting}
                              className="gap-1"
                            >
                              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              حذف
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                            >
                              إلغاء
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                          {entry.reference && <p className="text-xs font-mono text-muted-foreground">{entry.reference}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(Math.max(entry.debit, entry.credit))} ج.م</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDeposit(depositId);
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pencil className="h-4 w-4 text-amber-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(depositId);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد إيداعات</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Payments Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all">
              <CardContent className="p-4 text-center">
                <CreditCard className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
                <p className="text-xs text-muted-foreground mb-1">المدفوعات</p>
                <p className="text-lg font-bold">{totals.paymentCount}</p>
                <p className="text-xs text-emerald-600">{formatCurrency(totals.totalPayments)} ج.م</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                تفاصيل المدفوعات ({totals.paymentCount} دفعة)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">إجمالي المدفوعات</p>
                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totals.totalPayments)}</p>
                <p className="text-lg text-muted-foreground">جنيه مصري</p>
              </div>
              
              {paymentEntries.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {paymentEntries.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                        {entry.reference && <p className="text-xs font-mono text-muted-foreground">{entry.reference}</p>}
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(Math.max(entry.debit, entry.credit))} ج.م</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد مدفوعات</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Total Paid Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-xs text-muted-foreground mb-1">إجمالي المدفوع</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
                <p className="text-xs text-muted-foreground">ج.م</p>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                ملخص إجمالي المدفوعات
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">إجمالي ما تم دفعه</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totals.totalPaid)}</p>
                <p className="text-lg text-muted-foreground">جنيه مصري</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">الإيداعات</span>
                    <Badge variant="secondary" className="text-[10px]">{totals.depositCount}</Badge>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{formatCurrency(totals.totalDeposits)} ج.م</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium">المدفوعات</span>
                    <Badge variant="secondary" className="text-[10px]">{totals.paymentCount}</Badge>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{formatCurrency(totals.totalPayments)} ج.م</span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-semibold">المجموع</span>
                  <span className="text-xl font-bold">{formatCurrency(totals.totalPaid)} ج.م</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Balance Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className={cn(
              'border-2 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all',
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
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {totals.balance > 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                )}
                تفاصيل الرصيد النهائي
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Final Balance */}
              <div className={cn(
                'rounded-lg p-4 text-center',
                totals.balance > 0 ? 'bg-red-50 dark:bg-red-950/30' :
                totals.balance < 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                'bg-slate-50 dark:bg-slate-950/30'
              )}>
                <p className="text-sm text-muted-foreground mb-1">
                  {totals.balance > 0 ? 'المبلغ المستحق علينا' : totals.balance < 0 ? 'المبلغ المستحق لنا' : 'الحساب مسدد'}
                </p>
                <p className={cn(
                  'text-4xl font-bold',
                  totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : ''
                )}>
                  {formatCurrency(Math.abs(totals.balance))}
                </p>
                <p className="text-lg text-muted-foreground">جنيه مصري</p>
              </div>
              
              {/* Calculation Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">تفصيل الحساب:</h4>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">قيمة الشحنات</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(totals.totalShipmentValue)} ج.م</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">إجمالي المدفوع</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">- {formatCurrency(totals.totalPaid)} ج.م</span>
                </div>
                
                <Separator />
                
                <div className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  totals.balance > 0 ? 'bg-red-100 dark:bg-red-900/30' : 
                  totals.balance < 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 
                  'bg-muted'
                )}>
                  <span className="text-sm font-semibold">
                    {totals.balance > 0 ? 'الباقي علينا' : totals.balance < 0 ? 'الفائض لنا' : 'الرصيد'}
                  </span>
                  <span className={cn(
                    'text-xl font-bold',
                    totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : ''
                  )}>
                    {formatCurrency(Math.abs(totals.balance))} ج.م
                  </span>
                </div>
              </div>
              
              {/* Cancelled shipments note */}
              {totals.cancelledCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-sm">
                  <p className="text-amber-700 dark:text-amber-300">
                    ⚠️ ملاحظة: يوجد {totals.cancelledCount} شحنة ملغاة غير محسوبة في الرصيد
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
