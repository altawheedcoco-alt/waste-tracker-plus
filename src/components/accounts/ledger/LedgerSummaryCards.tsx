/**
 * بطاقات ملخص الحساب — مستخرجة من DetailedAccountLedger
 */
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Package, CreditCard, Banknote, TrendingUp, TrendingDown, Scale,
  Pencil, Trash2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LedgerEntry } from '../AccountLedger';

interface LedgerTotals {
  shipmentCount: number;
  totalShipmentValue: number;
  totalQuantity: number;
  depositCount: number;
  totalDeposits: number;
  paymentCount: number;
  totalPayments: number;
  totalPaid: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
  cancelledCount: number;
}

interface LedgerSummaryCardsProps {
  totals: LedgerTotals;
  shipmentEntries: LedgerEntry[];
  depositEntries: LedgerEntry[];
  paymentEntries: LedgerEntry[];
  wasteTypeBreakdown: [string, { quantity: number; value: number; count: number }][];
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string) => string;
  onEditDeposit: (depositId: string) => void;
  onDeleteDeposit: (depositId: string) => void;
  loadingDepositId: string | null;
  deletingDepositId: string | null;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  handleDeleteDeposit: (depositId: string) => void;
}

export default function LedgerSummaryCards({
  totals, shipmentEntries, depositEntries, paymentEntries,
  wasteTypeBreakdown, formatCurrency, formatDate,
  onEditDeposit, loadingDepositId, deletingDepositId,
  confirmDeleteId, setConfirmDeleteId, handleDeleteDeposit,
}: LedgerSummaryCardsProps) {
  return (
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
            <div>
              <h4 className="text-sm font-semibold mb-2">آخر الشحنات</h4>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipmentEntries.slice(0, 10).map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">{entry.description}</TableCell>
                        <TableCell className="text-sm">{entry.quantity ? `${formatCurrency(entry.quantity)} كجم` : '-'}</TableCell>
                        <TableCell className="text-sm font-semibold">{formatCurrency(Math.max(entry.debit, entry.credit))} ج.م</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quantity Dialog */}
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
                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${percentage}%` }} />
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
                  const depositId = entry.id.replace('deposit-', '');
                  const isLoading = loadingDepositId === depositId;
                  const isDeleting = deletingDepositId === depositId;
                  const showConfirmDelete = confirmDeleteId === depositId;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group relative">
                      {showConfirmDelete && (
                        <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm rounded-lg flex items-center justify-center gap-3 z-10">
                          <span className="text-sm font-medium text-destructive">تأكيد الحذف؟</span>
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDeleteDeposit(depositId); }} disabled={isDeleting} className="gap-1">
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} حذف
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}>إلغاء</Button>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                        {entry.reference && <p className="text-xs font-mono text-muted-foreground">{entry.reference}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-purple-600">{formatCurrency(Math.max(entry.debit, entry.credit))} ج.م</p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onEditDeposit(depositId); }} disabled={isLoading}>
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4 text-amber-600" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(depositId); }}>
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
              <p className={cn('text-xl font-bold', totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : '')}>
                {formatCurrency(Math.abs(totals.balance))}
              </p>
              <p className={cn('text-xs font-medium', totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : 'text-muted-foreground')}>
                {totals.balance > 0 ? 'علينا' : totals.balance < 0 ? 'لنا' : 'مسدد'}
              </p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {totals.balance > 0 ? <TrendingDown className="h-5 w-5 text-red-600" /> : <TrendingUp className="h-5 w-5 text-emerald-600" />}
              تفاصيل الرصيد النهائي
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className={cn('rounded-lg p-4 text-center',
              totals.balance > 0 ? 'bg-red-50 dark:bg-red-950/30' : totals.balance < 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-slate-50 dark:bg-slate-950/30'
            )}>
              <p className="text-sm text-muted-foreground mb-1">
                {totals.balance > 0 ? 'المبلغ المستحق علينا' : totals.balance < 0 ? 'المبلغ المستحق لنا' : 'الحساب مسدد'}
              </p>
              <p className={cn('text-4xl font-bold', totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : '')}>
                {formatCurrency(Math.abs(totals.balance))}
              </p>
              <p className="text-lg text-muted-foreground">جنيه مصري</p>
            </div>
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
              <div className={cn('flex items-center justify-between p-3 rounded-lg',
                totals.balance > 0 ? 'bg-red-100 dark:bg-red-900/30' : totals.balance < 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
              )}>
                <span className="text-sm font-semibold">
                  {totals.balance > 0 ? 'الباقي علينا' : totals.balance < 0 ? 'الفائض لنا' : 'الرصيد'}
                </span>
                <span className={cn('text-xl font-bold', totals.balance > 0 ? 'text-red-600' : totals.balance < 0 ? 'text-emerald-600' : '')}>
                  {formatCurrency(Math.abs(totals.balance))} ج.م
                </span>
              </div>
            </div>
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
  );
}
