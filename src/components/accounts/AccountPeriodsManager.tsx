import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Lock,
  Unlock,
  FileText,
  Download,
  Eye,
  Loader2,
  TrendingUp,
  TrendingDown,
  History,
  CalendarRange,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LedgerEntry } from './AccountLedger';
import { usePDFExport } from '@/hooks/usePDFExport';
import { createRoot } from 'react-dom/client';
import AccountLedgerPrint from './AccountLedgerPrint';

interface AccountPeriod {
  id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed';
  opening_balance: number;
  closing_balance: number | null;
  total_shipments_value: number;
  total_deposits: number;
  total_shipments_count: number;
  total_deposits_count: number;
  carry_over_balance: boolean;
  closed_at: string | null;
  notes: string | null;
  created_at: string;
}

interface AccountPeriodsManagerProps {
  organizationId: string;
  partnerOrganizationId?: string;
  externalPartnerId?: string;
  partnerName: string;
  partnerType: string;
  entries: LedgerEntry[];
  currentBalance: number;
  onPeriodChange?: (periodId: string | null) => void;
}

export default function AccountPeriodsManager({
  organizationId,
  partnerOrganizationId,
  externalPartnerId,
  partnerName,
  partnerType,
  entries,
  currentBalance,
  onPeriodChange,
}: AccountPeriodsManagerProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountPeriod | null>(null);
  const [viewPeriodId, setViewPeriodId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Form state for new period
  const [newPeriod, setNewPeriod] = useState({
    periodName: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: '',
  });

  // Close period form state
  const [closePeriodOptions, setClosePeriodOptions] = useState({
    carryOverBalance: false,
    notes: '',
  });

  const { exportToPDF } = usePDFExport({
    filename: `فترة-حساب-${partnerName}`,
    orientation: 'portrait',
  });

  // Fetch periods
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ['account-periods', organizationId, partnerOrganizationId, externalPartnerId],
    queryFn: async () => {
      let query = supabase
        .from('account_periods')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false });

      if (partnerOrganizationId) {
        query = query.eq('partner_organization_id', partnerOrganizationId);
      } else if (externalPartnerId) {
        query = query.eq('external_partner_id', externalPartnerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AccountPeriod[];
    },
  });

  // Get active period
  const activePeriod = useMemo(() => {
    return periods.find(p => p.status === 'active');
  }, [periods]);

  // Get entries for active period
  const periodEntries = useMemo(() => {
    if (!activePeriod) return entries;
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const startDate = new Date(activePeriod.start_date);
      const endDate = new Date(activePeriod.end_date);
      endDate.setHours(23, 59, 59);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }, [entries, activePeriod]);

  // Calculate period totals
  const periodTotals = useMemo(() => {
    const shipmentEntries = periodEntries.filter(e => e.type === 'shipment' && !e.isCancelled);
    const depositEntries = periodEntries.filter(e => e.type === 'deposit');

    return {
      shipmentsCount: shipmentEntries.length,
      shipmentsValue: shipmentEntries.reduce((sum, e) => sum + Math.max(e.debit, e.credit), 0),
      depositsCount: depositEntries.length,
      depositsValue: depositEntries.reduce((sum, e) => sum + Math.max(e.debit, e.credit), 0),
    };
  }, [periodEntries]);

  // Create period mutation
  const createPeriodMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('account_periods')
        .insert({
          organization_id: organizationId,
          partner_organization_id: partnerOrganizationId || null,
          external_partner_id: externalPartnerId || null,
          period_name: newPeriod.periodName,
          start_date: newPeriod.startDate,
          end_date: newPeriod.endDate,
          opening_balance: currentBalance,
          notes: newPeriod.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('تم إنشاء الفترة المحاسبية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['account-periods'] });
      setCreateDialogOpen(false);
      setNewPeriod({
        periodName: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      toast.error('فشل في إنشاء الفترة: ' + error.message);
    },
  });

  // Close period mutation
  const closePeriodMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPeriod) throw new Error('No period selected');

      const closingBalance = periodTotals.shipmentsValue - periodTotals.depositsValue + (selectedPeriod.opening_balance || 0);

      const { data, error } = await supabase
        .from('account_periods')
        .update({
          status: 'closed',
          closing_balance: closingBalance,
          total_shipments_value: periodTotals.shipmentsValue,
          total_deposits: periodTotals.depositsValue,
          total_shipments_count: periodTotals.shipmentsCount,
          total_deposits_count: periodTotals.depositsCount,
          carry_over_balance: closePeriodOptions.carryOverBalance,
          closed_at: new Date().toISOString(),
          notes: closePeriodOptions.notes || selectedPeriod.notes,
        })
        .eq('id', selectedPeriod.id)
        .select()
        .single();

      if (error) throw error;

      // If carry over, create new period with opening balance
      if (closePeriodOptions.carryOverBalance && closingBalance !== 0) {
        const nextStartDate = new Date(selectedPeriod.end_date);
        nextStartDate.setDate(nextStartDate.getDate() + 1);

        const { error: newPeriodError } = await supabase
          .from('account_periods')
          .insert({
            organization_id: organizationId,
            partner_organization_id: partnerOrganizationId || null,
            external_partner_id: externalPartnerId || null,
            period_name: `فترة جديدة - ${format(nextStartDate, 'MMMM yyyy', { locale: ar })}`,
            start_date: format(nextStartDate, 'yyyy-MM-dd'),
            end_date: format(new Date(nextStartDate.getFullYear(), nextStartDate.getMonth() + 1, 0), 'yyyy-MM-dd'),
            opening_balance: closingBalance,
            notes: `رصيد مرحل من الفترة السابقة: ${selectedPeriod.period_name}`,
          });

        if (newPeriodError) throw newPeriodError;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('تم إغلاق الفترة المحاسبية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['account-periods'] });
      setCloseDialogOpen(false);
      setSelectedPeriod(null);
      setClosePeriodOptions({ carryOverBalance: false, notes: '' });
    },
    onError: (error: any) => {
      toast.error('فشل في إغلاق الفترة: ' + error.message);
    },
  });

  // Export period report
  const handleExportPeriod = async (period: AccountPeriod) => {
    setIsExporting(true);
    try {
      const periodEntriesForExport = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        const startDate = new Date(period.start_date);
        const endDate = new Date(period.end_date);
        endDate.setHours(23, 59, 59);
        return entryDate >= startDate && entryDate <= endDate;
      });

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
            entries={periodEntriesForExport}
            printDate={`${period.period_name} | ${format(new Date(period.start_date), 'dd/MM/yyyy', { locale: ar })} - ${format(new Date(period.end_date), 'dd/MM/yyyy', { locale: ar })}`}
            previousBalance={period.opening_balance}
          />
        );
        setTimeout(resolve, 100);
      });

      const element = container.firstChild as HTMLElement;
      await exportToPDF(element, `فترة-${period.period_name}-${partnerName}`);

      root.unmount();
      document.body.removeChild(container);
      toast.success('تم تصدير تقرير الفترة بنجاح');
    } catch (error) {
      toast.error('فشل في تصدير التقرير');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">الحساب الآجل</h3>
          {activePeriod && (
            <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
              <Unlock className="h-3 w-3" />
              فترة نشطة
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Create New Period */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1" disabled={!!activePeriod}>
                <Plus className="h-4 w-4" />
                فترة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  إنشاء فترة محاسبية جديدة
                </DialogTitle>
                <DialogDescription>
                  أنشئ فترة جديدة لتتبع الحساب الآجل مع هذا الشريك
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="periodName">اسم الفترة</Label>
                  <Input
                    id="periodName"
                    placeholder="مثال: حساب يناير 2026"
                    value={newPeriod.periodName}
                    onChange={(e) => setNewPeriod(prev => ({ ...prev, periodName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">تاريخ البداية</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">تاريخ النهاية</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newPeriod.endDate}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">الرصيد الافتتاحي:</p>
                  <p className={cn(
                    'text-lg font-bold',
                    currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-emerald-600' : ''
                  )}>
                    {formatCurrency(Math.abs(currentBalance))} ج.م
                    <span className="text-sm font-normal mr-1">
                      ({currentBalance > 0 ? 'علينا' : currentBalance < 0 ? 'لنا' : 'مسدد'})
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="notes"
                    placeholder="أي ملاحظات إضافية..."
                    value={newPeriod.notes}
                    onChange={(e) => setNewPeriod(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={() => createPeriodMutation.mutate()}
                  disabled={!newPeriod.periodName || !newPeriod.startDate || !newPeriod.endDate || createPeriodMutation.isPending}
                >
                  {createPeriodMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Plus className="h-4 w-4 ml-2" />
                  )}
                  إنشاء الفترة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Close Active Period */}
          {activePeriod && (
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => setSelectedPeriod(activePeriod)}
                >
                  <Lock className="h-4 w-4" />
                  إغلاق الفترة
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <Lock className="h-5 w-5" />
                    إغلاق الفترة المحاسبية
                  </DialogTitle>
                  <DialogDescription>
                    سيتم تثبيت جميع الحركات في هذه الفترة ولن يمكن تعديلها
                  </DialogDescription>
                </DialogHeader>

                {selectedPeriod && (
                  <div className="space-y-4 py-4">
                    {/* Period Summary */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">الفترة:</span>
                        <span className="font-medium">{selectedPeriod.period_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">المدة:</span>
                        <span className="text-sm">
                          {formatDate(selectedPeriod.start_date)} - {formatDate(selectedPeriod.end_date)}
                        </span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                          <p className="text-xs text-muted-foreground">الشحنات</p>
                          <p className="font-bold text-blue-600">{periodTotals.shipmentsCount}</p>
                          <p className="text-xs text-blue-600">{formatCurrency(periodTotals.shipmentsValue)} ج.م</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded">
                          <p className="text-xs text-muted-foreground">الإيداعات</p>
                          <p className="font-bold text-purple-600">{periodTotals.depositsCount}</p>
                          <p className="text-xs text-purple-600">{formatCurrency(periodTotals.depositsValue)} ج.م</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">الرصيد الختامي:</span>
                        <span className={cn(
                          'text-lg font-bold',
                          (periodTotals.shipmentsValue - periodTotals.depositsValue + (selectedPeriod.opening_balance || 0)) > 0 
                            ? 'text-red-600' 
                            : 'text-emerald-600'
                        )}>
                          {formatCurrency(Math.abs(periodTotals.shipmentsValue - periodTotals.depositsValue + (selectedPeriod.opening_balance || 0)))} ج.م
                        </span>
                      </div>
                    </div>

                    {/* Carry Over Option */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">ترحيل الرصيد</p>
                          <p className="text-xs text-muted-foreground">نقل الرصيد المتبقي للفترة التالية</p>
                        </div>
                      </div>
                      <Switch
                        checked={closePeriodOptions.carryOverBalance}
                        onCheckedChange={(checked) => 
                          setClosePeriodOptions(prev => ({ ...prev, carryOverBalance: checked }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="closeNotes">ملاحظات الإغلاق</Label>
                      <Textarea
                        id="closeNotes"
                        placeholder="أي ملاحظات عن إغلاق الفترة..."
                        value={closePeriodOptions.notes}
                        onChange={(e) => setClosePeriodOptions(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-300">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">تحذير:</p>
                        <p>بعد إغلاق الفترة لن يمكن إضافة أو تعديل أي حركات ضمنها</p>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => closePeriodMutation.mutate()}
                    disabled={closePeriodMutation.isPending}
                  >
                    {closePeriodMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Lock className="h-4 w-4 ml-2" />
                    )}
                    تأكيد الإغلاق
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Active Period Card */}
      {activePeriod && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{activePeriod.period_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(activePeriod.start_date)} - {formatDate(activePeriod.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
                  <p className={cn(
                    'font-bold',
                    currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-emerald-600' : ''
                  )}>
                    {formatCurrency(Math.abs(currentBalance))} ج.م
                  </p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">شحنات</p>
                  <p className="font-bold text-blue-600">{periodTotals.shipmentsCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">إيداعات</p>
                  <p className="font-bold text-purple-600">{periodTotals.depositsCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Periods History */}
      {periods.filter(p => p.status === 'closed').length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              سجل الفترات المغلقة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الفترة</TableHead>
                  <TableHead className="text-center">المدة</TableHead>
                  <TableHead className="text-center">الشحنات</TableHead>
                  <TableHead className="text-center">الإيداعات</TableHead>
                  <TableHead className="text-center">الرصيد الختامي</TableHead>
                  <TableHead className="text-center">الترحيل</TableHead>
                  <TableHead className="text-center w-24">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.filter(p => p.status === 'closed').map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{period.period_name}</p>
                        {period.notes && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {period.notes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div>
                        <p className="font-medium">{period.total_shipments_count}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(period.total_shipments_value || 0)} ج.م
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div>
                        <p className="font-medium">{period.total_deposits_count}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(period.total_deposits || 0)} ج.م
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        'font-bold',
                        (period.closing_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                      )}>
                        {formatCurrency(Math.abs(period.closing_balance || 0))} ج.م
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {period.carry_over_balance ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <ArrowLeftRight className="h-3 w-3 ml-1" />
                          مُرحَّل
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-600">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          مُصفَّر
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportPeriod(period)}
                        disabled={isExporting}
                        className="gap-1"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!activePeriod && periods.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <CalendarRange className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h4 className="font-semibold mb-2">لا توجد فترات محاسبية</h4>
            <p className="text-sm text-muted-foreground mb-4">
              أنشئ فترة جديدة لتتبع الحساب الآجل مع هذا الشريك
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              إنشاء فترة جديدة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
