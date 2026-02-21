import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, CheckCircle2, AlertCircle, Clock, XCircle, ExternalLink, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import CancelShipmentDialog from '@/components/shipments/CancelShipmentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { WasteTypeInline } from './WasteTypeDetailsBadge';

interface ShipmentWithPricing {
  id: string;
  shipment_number: string;
  waste_description?: string;
  waste_type?: string;
  quantity: number;
  unit?: string;
  status: string;
  created_at: string;
  pricePerUnit: number;
  calculatedTotal: number;
  hasPrice: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
}

interface ShipmentsAccountViewProps {
  shipments: ShipmentWithPricing[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  new: { label: 'جديدة', icon: Clock, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  approved: { label: 'موافق عليها', icon: CheckCircle2, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  collecting: { label: 'قيد التجميع', icon: Package, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  in_transit: { label: 'قيد النقل', icon: Package, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  delivered: { label: 'تم التسليم', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  confirmed: { label: 'مؤكدة', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: 'ملغاة', icon: AlertCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function ShipmentsAccountView({ shipments, isLoading, onRefresh }: ShipmentsAccountViewProps) {
  const navigate = useNavigate();
  const { organization, roles } = useAuth();
  const [activeTab, setActiveTab] = useState('active');

  // Check if user can cancel shipments (transporter or admin)
  const isAdmin = roles?.includes('admin');
  const canCancel = isAdmin || organization?.organization_type === 'transporter';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  // Split shipments into active and cancelled
  const { activeShipments, cancelledShipments, summary } = useMemo(() => {
    const active = shipments.filter(s => !s.cancelled_at);
    const cancelled = shipments.filter(s => !!s.cancelled_at);
    const pricedShipments = active.filter(s => s.hasPrice);
    const unpricedShipments = active.filter(s => !s.hasPrice);
    const totalValue = active.reduce((sum, s) => sum + s.calculatedTotal, 0);
    const totalQuantity = active.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const cancelledValue = cancelled.reduce((sum, s) => sum + (s.pricePerUnit * (Number(s.quantity) || 0)), 0);
    const cancelledQuantity = cancelled.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    
    return {
      activeShipments: active,
      cancelledShipments: cancelled,
      summary: {
        total: shipments.length,
        active: active.length,
        cancelled: cancelled.length,
        priced: pricedShipments.length,
        unpriced: unpricedShipments.length,
        totalValue,
        totalQuantity,
        cancelledValue,
        cancelledQuantity,
      }
    };
  }, [shipments]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (shipments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">لا توجد شحنات</p>
        <p className="text-sm">ستظهر الشحنات هنا بعد إنشائها مع هذا الشريك</p>
      </div>
    );
  }

  const renderShipmentTable = (shipmentsToRender: ShipmentWithPricing[], isCancelledSection: boolean) => (
    <div className="border rounded-xl overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12 text-center font-bold">#</TableHead>
            <TableHead className="font-bold">رقم الشحنة</TableHead>
            <TableHead className="font-bold">نوع المخلف</TableHead>
            <TableHead className="text-center font-bold">الكمية</TableHead>
            <TableHead className="text-center font-bold">سعر الوحدة</TableHead>
            <TableHead className="text-center font-bold">الإجمالي</TableHead>
            <TableHead className="text-center font-bold">الحالة</TableHead>
            <TableHead className="text-center font-bold">التاريخ</TableHead>
            {isCancelledSection && <TableHead className="font-bold">سبب الإلغاء</TableHead>}
            {!isCancelledSection && canCancel && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipmentsToRender.map((shipment, index) => {
            const isCancelled = !!shipment.cancelled_at;
            const status = isCancelled 
              ? statusConfig.cancelled 
              : (statusConfig[shipment.status] || statusConfig.new);
            const StatusIcon = status.icon;
            
            return (
              <TableRow 
                key={shipment.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  isCancelled && "bg-red-50/50 dark:bg-red-950/10"
                )}
                onClick={() => navigate(`/dashboard/s/${shipment.shipment_number}`)}
              >
                <TableCell className="text-center text-muted-foreground font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-mono font-medium",
                    isCancelled ? "text-muted-foreground line-through" : "text-primary"
                  )}>
                    {shipment.shipment_number}
                  </span>
                </TableCell>
                <TableCell>
                  <div className={cn(isCancelled && "opacity-50")}>
                    <WasteTypeInline
                      wasteDescription={shipment.waste_description}
                      wasteType={shipment.waste_type}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn("font-bold", isCancelled && "line-through text-muted-foreground")}>
                    {formatCurrency(Number(shipment.quantity) || 0)}
                  </span>
                  {shipment.unit && (
                    <span className="text-muted-foreground text-xs mr-1">{shipment.unit}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {isCancelled ? (
                    <span className="text-muted-foreground line-through">
                      {shipment.hasPrice ? `${formatCurrency(shipment.pricePerUnit)} ج.م` : '-'}
                    </span>
                  ) : shipment.hasPrice ? (
                    <span className="text-emerald-600 font-medium">
                      {formatCurrency(shipment.pricePerUnit)} ج.م
                    </span>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                      <AlertCircle className="h-3 w-3" />
                      غير محدد
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {isCancelled ? (
                    <span className="text-red-500 font-bold line-through">
                      {formatCurrency(shipment.pricePerUnit * (Number(shipment.quantity) || 0))} ج.م
                    </span>
                  ) : shipment.hasPrice ? (
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(shipment.calculatedTotal)} ج.م
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className={cn('gap-1', status.color)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {formatDate(shipment.created_at)}
                </TableCell>
                {isCancelledSection && (
                  <TableCell className="max-w-[200px]">
                    <span className="text-sm text-red-600 dark:text-red-400 line-clamp-2">
                      {shipment.cancellation_reason || 'لم يتم تحديد السبب'}
                    </span>
                  </TableCell>
                )}
                {!isCancelledSection && canCancel && (
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => navigate(`/dashboard/s/${shipment.shipment_number}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <CancelShipmentDialog
                        shipmentId={shipment.id}
                        shipmentNumber={shipment.shipment_number}
                        currentStatus={shipment.status}
                        onSuccess={onRefresh}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="active" className="gap-2">
            <Package className="h-4 w-4" />
            الشحنات النشطة
            <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">
              {summary.active}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <Ban className="h-4 w-4" />
            الشحنات الملغاة
            {summary.cancelled > 0 && (
              <span className="bg-red-500/20 text-red-600 dark:text-red-400 text-xs px-1.5 rounded-full">
                {summary.cancelled}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Shipments Tab */}
        <TabsContent value="active" className="mt-0 space-y-4">
          {/* Quick Summary for Active */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{summary.active}</p>
              <p className="text-xs text-muted-foreground">شحنات نشطة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(summary.totalQuantity)}</p>
              <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'text-2xl font-bold',
                summary.priced === summary.active ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {summary.priced}/{summary.active}
              </p>
              <p className="text-xs text-muted-foreground">شحنات مسعّرة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalValue)}</p>
              <p className="text-xs text-muted-foreground">إجمالي القيمة (ج.م)</p>
            </div>
          </div>

          {activeShipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">لا توجد شحنات نشطة</p>
            </div>
          ) : (
            renderShipmentTable(activeShipments, false)
          )}

          {/* Unpriced Warning */}
          {summary.unpriced > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">يوجد {summary.unpriced} شحنات بدون سعر محدد</p>
                <p className="text-sm opacity-80">أضف أسعار المخلفات في قسم "أنواع المخلفات المشتركة" لحساب قيمتها تلقائياً</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Cancelled Shipments Tab */}
        <TabsContent value="cancelled" className="mt-0 space-y-4">
          {/* Summary for Cancelled */}
          {summary.cancelled > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{summary.cancelled}</p>
                <p className="text-xs text-red-600/80">شحنات ملغاة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.cancelledQuantity)}</p>
                <p className="text-xs text-red-600/80">إجمالي الكمية الملغاة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 line-through">{formatCurrency(summary.cancelledValue)}</p>
                <p className="text-xs text-red-600/80">قيمة غير محتسبة (ج.م)</p>
              </div>
            </div>
          )}

          {cancelledShipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ban className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">لا توجد شحنات ملغاة</p>
              <p className="text-sm">جميع الشحنات مع هذا الشريك نشطة</p>
            </div>
          ) : (
            renderShipmentTable(cancelledShipments, true)
          )}

          {/* Cancelled Info */}
          {summary.cancelled > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg text-muted-foreground">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">الشحنات الملغاة لا تُحتسب في كشف الحساب</p>
                <p className="text-sm">قيمة الشحنات الملغاة ({formatCurrency(summary.cancelledValue)} ج.م) غير مشمولة في الإجماليات</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
