import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Package, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface ShipmentsAccountViewProps {
  shipments: ShipmentWithPricing[];
  isLoading?: boolean;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  new: { label: 'جديدة', icon: Clock, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  approved: { label: 'موافق عليها', icon: CheckCircle2, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  collecting: { label: 'قيد التجميع', icon: Package, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  in_transit: { label: 'قيد النقل', icon: Package, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  delivered: { label: 'تم التسليم', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  confirmed: { label: 'مؤكدة', icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

export default function ShipmentsAccountView({ shipments, isLoading }: ShipmentsAccountViewProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
  };

  // Summary calculations
  const summary = useMemo(() => {
    const pricedShipments = shipments.filter(s => s.hasPrice);
    const unpricedShipments = shipments.filter(s => !s.hasPrice);
    const totalValue = shipments.reduce((sum, s) => sum + s.calculatedTotal, 0);
    const totalQuantity = shipments.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    
    return {
      total: shipments.length,
      priced: pricedShipments.length,
      unpriced: unpricedShipments.length,
      totalValue,
      totalQuantity,
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

  return (
    <div className="space-y-4">
      {/* Quick Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{summary.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{formatCurrency(summary.totalQuantity)}</p>
          <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
        </div>
        <div className="text-center">
          <p className={cn(
            'text-2xl font-bold',
            summary.priced === summary.total ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {summary.priced}/{summary.total}
          </p>
          <p className="text-xs text-muted-foreground">شحنات مسعّرة</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalValue)}</p>
          <p className="text-xs text-muted-foreground">إجمالي القيمة (ج.م)</p>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="border rounded-xl overflow-hidden">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment, index) => {
              const status = statusConfig[shipment.status] || statusConfig.new;
              const StatusIcon = status.icon;
              
              return (
                <TableRow 
                  key={shipment.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/dashboard/s/${shipment.shipment_number}`)}
                >
                  <TableCell className="text-center text-muted-foreground font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium text-primary">
                      {shipment.shipment_number}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {shipment.waste_description || shipment.waste_type || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold">{formatCurrency(Number(shipment.quantity) || 0)}</span>
                    {shipment.unit && (
                      <span className="text-muted-foreground text-xs mr-1">{shipment.unit}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {shipment.hasPrice ? (
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
                    {shipment.hasPrice ? (
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
}
