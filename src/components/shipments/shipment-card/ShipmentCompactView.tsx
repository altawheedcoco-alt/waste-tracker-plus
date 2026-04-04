import { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useShipmentVisibility } from '@/hooks/useVisibilityGuard';
import {
  Navigation, MapPin, Printer, Download, Lock,
  CheckCircle2, FileCheck, XCircle, RefreshCw, ChevronDown,
  Settings2, Loader2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getStatusConfig, canChangeStatus, getStatusesForOrgType,
  wasteTypeLabels, mapLegacyStatus, getAvailableNextStatuses, mapToDbStatus,
  type ShipmentStatus,
} from '@/lib/shipmentStatusConfig';
import StatusChangeDialog from '../StatusChangeDialog';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';
import ShipmentQuickPrint from '../unified-print/UnifiedShipmentPrint';
import ShipmentRouteMap from '@/components/maps/RouteMapDialog';
import CancelShipmentDialog from '../CancelShipmentDialog';
import QuickReceiptButton from '@/components/receipts/QuickReceiptButton';
import QuickCertificateButton from '@/components/reports/QuickCertificateButton';
import DocumentChainStrip from '../DocumentChainStrip';
import GeneratorDeliveryCertificateDialog from '@/components/receipts/GeneratorDeliveryCertificateDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDeliveryDeclaration, useShipmentDeclarations } from '@/hooks/useDeliveryDeclaration';
import type { ShipmentData, OrganizationType } from './ShipmentCardTypes';

const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));

interface CompactViewProps {
  shipment: ShipmentData;
  onStatusChange?: () => void;
}

const ShipmentCompactView = ({ shipment, onStatusChange }: CompactViewProps) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printAutoAction, setPrintAutoAction] = useState<'print' | 'pdf' | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isLiveTrackingOpen, setIsLiveTrackingOpen] = useState(false);
  const [isQuickStatusChanging, setIsQuickStatusChanging] = useState(false);
  const [isDeliveryCertOpen, setIsDeliveryCertOpen] = useState(false);

  const visibility = useShipmentVisibility(shipment.id);
  const { data: allDeclarations = [] } = useShipmentDeclarations(shipment.id, organization?.id);

  const hasGeneratorDeclaration = allDeclarations.some((d: Record<string, unknown>) => d.declaration_type === 'generator');

  const mappedStatus = mapLegacyStatus(shipment.status);
  const currentStatusConfig = getStatusConfig(mappedStatus);
  const organizationType = (organization?.organization_type || 'generator') as OrganizationType;
  const canChange = canChangeStatus(mappedStatus, organizationType);
  const isRecycler = organizationType === 'recycler';
  const isTransporter = organizationType === 'transporter';
  const isGenerator = organizationType === 'generator';
  const isCompleted = shipment.status === 'completed' || shipment.status === 'confirmed';
  const availableNextStatuses = getAvailableNextStatuses(mappedStatus, organizationType);
  const orgStatuses = getStatusesForOrgType(organizationType);
  const allStatusesForDropdown = orgStatuses.filter(s => s.key !== mappedStatus);

  const handleCardClick = () => navigate(`/dashboard/s/${shipment.shipment_number}`);

  const handleQuickStatusChange = async (newStatus: ShipmentStatus) => {
    setIsQuickStatusChanging(true);
    try {
      const dbStatus = mapToDbStatus(newStatus);
      const { error } = await supabase
        .from('shipments')
        .update({ status: dbStatus } as Record<string, unknown>)
        .eq('id', shipment.id);
      if (error) throw error;
      toast.success(`تم تغيير الحالة إلى: ${getStatusConfig(newStatus)?.labelAr}`);
      onStatusChange?.();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`حدث خطأ أثناء تغيير الحالة: ${msg}`);
    } finally {
      setIsQuickStatusChanging(false);
    }
  };

  return (
    <>
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="cursor-pointer" onClick={handleCardClick}>
        <Card className={cn("hover:shadow-md transition-shadow border-r-4")}
          style={{ borderRightColor: currentStatusConfig?.colorClass.replace('bg-', '').includes('-') ? undefined : currentStatusConfig?.colorClass.replace('bg-', '') }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {shipment.driver_id && visibility.canViewTracking && (
                  <Button size="sm" variant="default" onClick={(e) => { e.stopPropagation(); setIsLiveTrackingOpen(true); }}
                    className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" title="التتبع المباشر">
                    <Navigation className="w-3 h-3" />مباشر
                  </Button>
                )}
                {shipment.driver_id && !visibility.canViewTracking && !visibility.isOwner && (
                  <div className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 bg-amber-50 rounded">
                    <Lock className="w-3 h-3" /><span>مقفل</span>
                  </div>
                )}
                {visibility.canViewMaps && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsMapDialogOpen(true); }} className="gap-1 text-xs" title="تتبع على الخريطة">
                    <MapPin className="w-3 h-3" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setPrintAutoAction('print'); setIsPrintDialogOpen(true); }} className="gap-1 text-xs" title="طباعة مباشرة">
                  <Printer className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setPrintAutoAction('pdf'); setIsPrintDialogOpen(true); }} className="gap-1 text-xs" title="تحميل PDF">
                  <Download className="w-3 h-3" />
                </Button>
                {(isRecycler || isTransporter) && (
                  <QuickCertificateButton shipment={{ ...shipment, unit: shipment.unit || 'كجم', has_report: shipment.has_report }} onSuccess={onStatusChange} variant="outline" size="sm" showLabel={false} />
                )}
                {isTransporter && (
                  <QuickReceiptButton
                    shipment={{ ...shipment, unit: shipment.unit || 'كجم', pickup_address: shipment.pickup_address || '', generator_id: shipment.generator_id || shipment.generator?.id || '', generator: shipment.generator, recycler: shipment.recycler, driver_id: shipment.driver_id || null, driver: shipment.driver ? { profile: shipment.driver.profile || null } : null, has_receipt: shipment.has_receipt } as any}
                    onSuccess={onStatusChange} variant="outline" size="sm"
                  />
                )}
                {isGenerator && (
                  hasGeneratorDeclaration ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3" />تم إقرار التسليم
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setIsDeliveryCertOpen(true); }}
                      className="gap-1 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/30" title="إقرار تسليم الشحنة">
                      <FileCheck className="w-3 h-3" />إقرار تسليم
                    </Button>
                  )
                )}
                <CancelShipmentDialog shipmentId={shipment.id} shipmentNumber={shipment.shipment_number} currentStatus={shipment.status} onSuccess={onStatusChange}
                  trigger={<Button size="sm" variant="ghost" className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => e.stopPropagation()}><XCircle className="w-3 h-3" /></Button>}
                />
                {canChange && !isCompleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="eco" className="gap-1 text-xs" disabled={isQuickStatusChanging}>
                        {isQuickStatusChanging ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        تغيير<ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-52 bg-popover z-50 max-h-72 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">الحالة الحالية</div>
                      {currentStatusConfig && (() => {
                        const CurIcon = currentStatusConfig.icon;
                        return (
                          <DropdownMenuItem disabled className="gap-2 opacity-100 bg-primary/10 border border-primary/20 rounded-md mx-1 mb-1">
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", currentStatusConfig.bgClass)}><CurIcon className="w-3 h-3" /></div>
                            <span className="font-bold text-primary">{currentStatusConfig.labelAr} ✓</span>
                          </DropdownMenuItem>
                        );
                      })()}
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">تغيير إلى</div>
                      {allStatusesForDropdown.map((status) => {
                        const StatusIcon = status.icon;
                        const isRecommended = availableNextStatuses.some(s => s.key === status.key);
                        return (
                          <DropdownMenuItem key={status.key} onClick={() => handleQuickStatusChange(status.key)} className={cn("gap-2 cursor-pointer", isRecommended && "font-medium")}>
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", status.bgClass)}><StatusIcon className="w-3 h-3" /></div>
                            <span>{status.labelAr}</span>
                            {isRecommended && <span className="text-[9px] text-primary mr-auto">مقترح</span>}
                          </DropdownMenuItem>
                        );
                      })}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsStatusDialogOpen(true); }} className="gap-2 cursor-pointer text-muted-foreground">
                        <Settings2 className="w-4 h-4" /><span>تغيير متقدم...</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 justify-end flex-wrap">
                  {shipment.has_delivery_certificate && (
                    <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 gap-1"><FileCheck className="w-3 h-3" />إقرار تسليم</Badge>
                  )}
                  {shipment.has_receipt && (isGenerator || isTransporter) && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700 gap-1"><FileCheck className="w-3 h-3" />{isTransporter ? 'تم إصدار شهادة استلام' : 'تم استلام الشحنة'}</Badge>
                  )}
                  {shipment.has_report && (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 gap-1"><FileCheck className="w-3 h-3" />تم إصدار شهادة التدوير</Badge>
                  )}
                  {currentStatusConfig && (
                    <Badge className={cn(currentStatusConfig.bgClass, currentStatusConfig.borderClass, "border gap-1.5 font-semibold text-black dark:text-white")}>
                      <currentStatusConfig.icon className="w-3.5 h-3.5" />{currentStatusConfig.labelAr}
                    </Badge>
                  )}
                  <span className="font-mono font-bold">{shipment.shipment_number}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {wasteTypeLabels[shipment.waste_type] || shipment.waste_type} - {shipment.quantity} {shipment.unit || 'كجم'}
                </p>
                <DocumentChainStrip shipmentId={shipment.id} variant="minimal" orgType={organization?.organization_type as OrganizationType} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <StatusChangeDialog isOpen={isStatusDialogOpen} onClose={() => setIsStatusDialogOpen(false)} shipment={{ ...shipment, status: mappedStatus }} onStatusChanged={() => { setIsStatusDialogOpen(false); onStatusChange?.(); }} />
      {(isRecycler || isTransporter) && <RecyclingCertificateDialog isOpen={isReportDialogOpen} onClose={() => setIsReportDialogOpen(false)} shipment={shipment as any} />}
      <ShipmentQuickPrint isOpen={isPrintDialogOpen} onClose={() => { setIsPrintDialogOpen(false); setPrintAutoAction(null); }} shipmentId={shipment.id} autoAction={printAutoAction} />
      <ShipmentRouteMap isOpen={isMapDialogOpen} onClose={() => setIsMapDialogOpen(false)} pickupAddress={shipment.pickup_address || 'غير محدد'} deliveryAddress={shipment.delivery_address || 'غير محدد'} shipmentNumber={shipment.shipment_number} driverId={shipment.driver_id} shipmentStatus={shipment.status} />
      {isLiveTrackingOpen && shipment.driver_id && (
        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
          <LiveTrackingMapDialog isOpen={isLiveTrackingOpen} onClose={() => setIsLiveTrackingOpen(false)} driverId={shipment.driver_id} shipmentNumber={shipment.shipment_number} pickupAddress={shipment.pickup_address || 'غير محدد'} deliveryAddress={shipment.delivery_address || 'غير محدد'} shipmentStatus={shipment.status} />
        </Suspense>
      )}
      <GeneratorDeliveryCertificateDialog open={isDeliveryCertOpen} onOpenChange={setIsDeliveryCertOpen}
        shipment={{ id: shipment.id, shipment_number: shipment.shipment_number, waste_type: shipment.waste_type, quantity: shipment.quantity, unit: shipment.unit || 'كجم', status: shipment.status, created_at: shipment.created_at, pickup_address: shipment.pickup_address || '', delivery_address: shipment.delivery_address || '', generator: shipment.generator ? { name: shipment.generator.name, city: shipment.generator.city } : undefined, transporter: shipment.transporter ? { name: shipment.transporter.name, city: shipment.transporter.city } : undefined, recycler: shipment.recycler ? { name: shipment.recycler.name, city: shipment.recycler.city } : undefined } as any}
        onSuccess={onStatusChange}
      />
    </>
  );
};

export default ShipmentCompactView;
