import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
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
import { useLanguage } from '@/contexts/LanguageContext';

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

const getStatusConfig = (t: (key: string) => string): Record<string, { label: string; icon: any; color: string }> => ({
  new: { label: t('shipmentStatus.new'), icon: Clock, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  approved: { label: t('shipmentStatus.approved'), icon: CheckCircle2, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  collecting: { label: t('shipmentStatus.collecting'), icon: Package, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  in_transit: { label: t('shipmentStatus.in_transit'), icon: Package, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  delivered: { label: t('shipmentStatus.delivered'), icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  confirmed: { label: t('shipmentStatus.confirmed'), icon: CheckCircle2, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  cancelled: { label: t('shipmentStatus.cancelled'), icon: AlertCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
});

export default function ShipmentsAccountView({ shipments, isLoading, onRefresh }: ShipmentsAccountViewProps) {
  const navigate = useNavigate();
  const { organization, roles } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('active');
  const statusConfig = getStatusConfig(t);
  // Check if user can cancel shipments (transporter or admin)
  const isAdmin = roles?.includes('admin');
  const canCancel = isAdmin || organization?.organization_type === 'transporter';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: language === 'ar' ? ar : enUS });
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
        <p className="text-lg font-medium">{t('shipmentsAccount.noShipments')}</p>
        <p className="text-sm">{t('shipmentsAccount.shipmentsAppearHere')}</p>
      </div>
    );
  }

  const renderShipmentTable = (shipmentsToRender: ShipmentWithPricing[], isCancelledSection: boolean) => (
    <div className="border rounded-xl overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12 text-center font-bold">#</TableHead>
            <TableHead className="font-bold">{t('shipmentsAccount.shipmentNumber')}</TableHead>
            <TableHead className="font-bold">{t('shipmentsAccount.wasteType')}</TableHead>
            <TableHead className="text-center font-bold">{t('shipmentsAccount.quantity')}</TableHead>
            <TableHead className="text-center font-bold">{t('shipmentsAccount.unitPrice')}</TableHead>
            <TableHead className="text-center font-bold">{t('shipmentsAccount.totalAmount')}</TableHead>
            <TableHead className="text-center font-bold">{t('shipmentsAccount.status')}</TableHead>
            <TableHead className="text-center font-bold">{t('shipmentsAccount.date')}</TableHead>
            {isCancelledSection && <TableHead className="font-bold">{t('shipmentsAccount.cancellationReason')}</TableHead>}
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
                    {shipment.hasPrice ? `${formatCurrency(shipment.pricePerUnit)} ${t('transportOffice.currency')}` : '-'}
                    </span>
                  ) : shipment.hasPrice ? (
                    <span className="text-emerald-600 font-medium">
                      {formatCurrency(shipment.pricePerUnit)} {t('transportOffice.currency')}
                    </span>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                      <AlertCircle className="h-3 w-3" />
                      {t('shipmentsAccount.notDetermined')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {isCancelled ? (
                    <span className="text-red-500 font-bold line-through">
                      {formatCurrency(shipment.pricePerUnit * (Number(shipment.quantity) || 0))} {t('transportOffice.currency')}
                    </span>
                  ) : shipment.hasPrice ? (
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(shipment.calculatedTotal)} {t('transportOffice.currency')}
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
                      {shipment.cancellation_reason || t('shipmentsAccount.noReasonSpecified')}
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
            {t('shipmentsAccount.activeShipments')}
            <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">
              {summary.active}
            </span>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <Ban className="h-4 w-4" />
            {t('shipmentsAccount.cancelledShipments')}
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
              <p className="text-xs text-muted-foreground">{t('shipmentsAccount.activeCount')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(summary.totalQuantity)}</p>
              <p className="text-xs text-muted-foreground">{t('shipmentsAccount.totalQuantity')}</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'text-2xl font-bold',
                summary.priced === summary.active ? 'text-emerald-600' : 'text-amber-600'
              )}>
                {summary.priced}/{summary.active}
              </p>
              <p className="text-xs text-muted-foreground">{t('shipmentsAccount.pricedShipments')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalValue)}</p>
              <p className="text-xs text-muted-foreground">{t('shipmentsAccount.totalValueEgp')}</p>
            </div>
          </div>

          {activeShipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">{t('shipmentsAccount.noActiveShipments')}</p>
            </div>
          ) : (
            renderShipmentTable(activeShipments, false)
          )}

          {/* Unpriced Warning */}
          {summary.unpriced > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">{t('shipmentsAccount.unpricedWarning').replace('{count}', String(summary.unpriced))}</p>
                <p className="text-sm opacity-80">{t('shipmentsAccount.unpricedHint')}</p>
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
                <p className="text-xs text-red-600/80">{t('shipmentsAccount.cancelledCount')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.cancelledQuantity)}</p>
                <p className="text-xs text-red-600/80">{t('shipmentsAccount.cancelledQuantity')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600 line-through">{formatCurrency(summary.cancelledValue)}</p>
                <p className="text-xs text-red-600/80">{t('shipmentsAccount.uncountedValue')}</p>
              </div>
            </div>
          )}

          {cancelledShipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ban className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">{t('shipmentsAccount.noCancelledShipments')}</p>
              <p className="text-sm">{t('shipmentsAccount.allShipmentsActive')}</p>
            </div>
          ) : (
            renderShipmentTable(cancelledShipments, true)
          )}

          {/* Cancelled Info */}
          {summary.cancelled > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg text-muted-foreground">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">{t('shipmentsAccount.cancelledNotCounted')}</p>
                <p className="text-sm">{t('shipmentsAccount.cancelledValueExcluded').replace('{value}', formatCurrency(summary.cancelledValue))}</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
