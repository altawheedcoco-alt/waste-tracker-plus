import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useShipmentVisibility } from '@/hooks/useVisibilityGuard';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Building2,
  Truck,
  Recycle,
  RefreshCw,
  CheckCircle2,
  FileText,
  AlertCircle,
  Printer,
  MapPin,
  ChevronDown,
  ChevronUp,
  Settings2,
  Loader2,
  BadgeCheck,
  FileCheck,
  Navigation,
  Eye,
  XCircle,
  Route,
  Lock,
  ScrollText,
  Send,
  ClipboardCheck,
  EyeOff,
  Download,
} from 'lucide-react';
import {
  getStatusConfig,
  canChangeStatus,
  allStatuses,
  wasteTypeLabels,
  mapLegacyStatus,
  getAvailableNextStatuses,
  mapToDbStatus,
  type ShipmentStatus,
} from '@/lib/shipmentStatusConfig';
import StatusChangeDialog from './StatusChangeDialog';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';
import ShipmentQuickPrint from './unified-print/UnifiedShipmentPrint';
import ShipmentRouteMap from '@/components/maps/RouteMapDialog';
import CancelShipmentDialog from './CancelShipmentDialog';
import NavigationButtonGroup from '@/components/navigation/NavigationButtonGroup';
import QuickReceiptButton from '@/components/receipts/QuickReceiptButton';
import GeneratorDeliveryCertificateDialog from '@/components/receipts/GeneratorDeliveryCertificateDialog';
import QuickCertificateButton from '@/components/reports/QuickCertificateButton';
import ManifestPDFButton from './ManifestPDFButton';
import ShipmentApprovalBadge from './ShipmentApprovalBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDeliveryDeclaration, useShipmentDeclarations } from '@/hooks/useDeliveryDeclaration';
import DeliveryDeclarationViewDialog from './DeliveryDeclarationViewDialog';
import CompleteShipmentDocButton from './CompleteShipmentDocButton';
const ShipmentEndorsementButton = lazy(() => import('./ShipmentEndorsementButton'));
import DocumentChainStrip from './DocumentChainStrip';

// Lazy load heavy components
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const ShipmentInlineTrackingMap = lazy(() => import('./ShipmentInlineTrackingMap'));
const GPSTrackingStatusWidget = lazy(() => import('@/components/tracking/GPSTrackingStatusWidget'));
const SupervisorComplianceDashboard = lazy(() => import('@/components/supervisors/SupervisorComplianceDashboard'));

interface ShipmentCardProps {
  shipment: {
    id: string;
    shipment_number: string;
    status: string;
    waste_type: string;
    quantity: number;
    unit?: string;
    created_at: string;
    pickup_address?: string;
    delivery_address?: string;
    driver_id?: string | null;
    generator_id?: string | null;
    recycler_id?: string | null;
    expected_delivery_date?: string | null;
    pickup_date?: string | null;
    approved_at?: string | null;
    collection_started_at?: string | null;
    in_transit_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
    recycler_notes?: string | null;
    generator_notes?: string | null;
    notes?: string | null;
    waste_description?: string | null;
    hazard_level?: string | null;
    packaging_method?: string | null;
    disposal_method?: string | null;
    manual_driver_name?: string | null;
    manual_vehicle_plate?: string | null;
    generator?: { name: string; id?: string; phone?: string; address?: string; city?: string; representative_name?: string | null } | null;
    recycler?: { name: string; id?: string; phone?: string; address?: string; city?: string; representative_name?: string | null } | null;
    transporter?: { name: string; id?: string; phone?: string; address?: string; city?: string; representative_name?: string | null } | null;
    driver?: { license_number?: string; vehicle_type?: string | null; vehicle_plate?: string | null; profile?: { full_name: string; phone?: string | null } } | null;
    has_report?: boolean;
    has_receipt?: boolean;
    has_delivery_certificate?: boolean;
    // Approval status fields
    generator_approval_status?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | null;
    generator_approval_at?: string | null;
    generator_rejection_reason?: string | null;
    generator_auto_approve_deadline?: string | null;
    recycler_approval_status?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | null;
    recycler_approval_at?: string | null;
    recycler_rejection_reason?: string | null;
    recycler_auto_approve_deadline?: string | null;
  };
  onStatusChange?: () => void;
  variant?: 'compact' | 'full';
}

const ShipmentCard = ({ 
  shipment, 
  onStatusChange, 
  variant = 'full',
}: ShipmentCardProps) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printAutoAction, setPrintAutoAction] = useState<'print' | 'pdf' | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isLiveTrackingOpen, setIsLiveTrackingOpen] = useState(false);
  const [isQuickStatusChanging, setIsQuickStatusChanging] = useState(false);
  const [isDeclarationViewOpen, setIsDeclarationViewOpen] = useState(false);
  const [isDeliveryCertOpen, setIsDeliveryCertOpen] = useState(false);
  const [showInlineMap, setShowInlineMap] = useState(false);

  // استخدام hook صلاحيات الرؤية
  const visibility = useShipmentVisibility(shipment.id);
  const { data: declarationData } = useDeliveryDeclaration(shipment.id);
  const { data: allDeclarations = [] } = useShipmentDeclarations(shipment.id, organization?.id);

  // Fetch linked receipts/certificates for this shipment
  const { data: linkedReceipts = [] } = useQuery({
    queryKey: ['shipment-receipts-summary', shipment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_receipts')
        .select('id, receipt_number, status, receipt_type, created_at, actual_weight, unit')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: true });
      if (error) { if (!error.message?.includes('AbortError')) console.error(error); return []; }
      return data || [];
    },
    enabled: !!shipment.id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch recycling reports/certificates
  const { data: linkedReports = [] } = useQuery({
    queryKey: ['shipment-reports-summary', shipment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recycling_reports')
        .select('id, report_number, status, created_at')
        .eq('shipment_id', shipment.id)
        .order('created_at', { ascending: true });
      if (error) { console.error(error); return []; }
      return data || [];
    },
    enabled: !!shipment.id,
    staleTime: 1000 * 60 * 5,
  });

  const totalDocuments = linkedReceipts.length + linkedReports.length + allDeclarations.length;
  
  // Check if specific declaration types already exist
  const hasGeneratorDeclaration = allDeclarations.some((d: any) => d.declaration_type === 'generator');
  const hasRecyclerDeclaration = allDeclarations.some((d: any) => d.declaration_type === 'recycler');
  const hasAnyReceipt = linkedReceipts.length > 0 || shipment.has_receipt;
  const hasAnyReport = linkedReports.length > 0 || shipment.has_report;
  
  const mappedStatus = mapLegacyStatus(shipment.status);
  const currentStatusConfig = getStatusConfig(mappedStatus);
  
  const organizationType = (organization?.organization_type || 'generator') as 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'driver';
  const isAdmin = organizationType === 'admin';
  const canChange = canChangeStatus(mappedStatus, organizationType);
  const isRecycler = organizationType === 'recycler';
  const isTransporter = organizationType === 'transporter';
  const isGenerator = organizationType === 'generator';
  const isCompleted = shipment.status === 'completed' || shipment.status === 'confirmed';

  // Get available next statuses for quick change
  const availableNextStatuses = getAvailableNextStatuses(mappedStatus, organizationType);

  // Calculate current status index for progress display
  const currentStatusIndex = allStatuses.findIndex(s => s.key === mappedStatus);

  const handleCardClick = () => {
    navigate(`/dashboard/s/${shipment.shipment_number}`);
  };

  const handleStatusButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStatusDialogOpen(true);
  };

  const handleStatusChanged = () => {
    setIsStatusDialogOpen(false);
    onStatusChange?.();
  };

  // Quick status change handler
  const handleQuickStatusChange = async (newStatus: ShipmentStatus) => {
    setIsQuickStatusChanging(true);
    try {
      const dbStatus = mapToDbStatus(newStatus);
      
      const { error } = await supabase
        .from('shipments')
        .update({ status: dbStatus as any })
        .eq('id', shipment.id);

      if (error) throw error;

      toast.success(`تم تغيير الحالة إلى: ${getStatusConfig(newStatus)?.labelAr}`);
      onStatusChange?.();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('حدث خطأ أثناء تغيير الحالة');
    } finally {
      setIsQuickStatusChanging(false);
    }
  };

  const handleReportButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReportDialogOpen(true);
  };

  const handlePrintButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintAutoAction(null);
    setIsPrintDialogOpen(true);
  };

  const handleDirectPrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintAutoAction('print');
    setIsPrintDialogOpen(true);
  };

  const handleDirectPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintAutoAction('pdf');
    setIsPrintDialogOpen(true);
  };

  const handleMapButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMapDialogOpen(true);
  };

  const handleLiveTrackingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiveTrackingOpen(true);
  };

  if (variant === 'compact') {
    return (
      <>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="cursor-pointer"
          onClick={handleCardClick}
        >
          <Card className={cn(
            "hover:shadow-md transition-shadow border-r-4",
            currentStatusConfig?.colorClass ? `border-r-${currentStatusConfig.colorClass.replace('bg-', '')}` : ''
          )} style={{ borderRightColor: currentStatusConfig?.colorClass.replace('bg-', '').includes('-') ? undefined : currentStatusConfig?.colorClass.replace('bg-', '') }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {/* Live tracking button - only show if driver is assigned AND visibility allowed */}
                  {shipment.driver_id && visibility.canViewTracking && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleLiveTrackingClick}
                      className="gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
                      title="التتبع المباشر"
                    >
                      <Navigation className="w-3 h-3" />
                      مباشر
                    </Button>
                  )}
                  {/* Locked indicator when tracking is blocked */}
                  {shipment.driver_id && !visibility.canViewTracking && !visibility.isOwner && (
                    <div className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 bg-amber-50 rounded">
                      <Lock className="w-3 h-3" />
                      <span>مقفل</span>
                    </div>
                  )}
                  {/* Map button - only show if visibility allowed */}
                  {visibility.canViewMaps && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMapButtonClick}
                      className="gap-1 text-xs"
                      title="تتبع على الخريطة"
                    >
                      <MapPin className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDirectPrint}
                    className="gap-1 text-xs"
                    title="طباعة مباشرة"
                  >
                    <Printer className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDirectPDF}
                    className="gap-1 text-xs"
                    title="تحميل PDF"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                  {/* Show recycling certificate button for recycler (to issue) or transporter (to view) */}
                  {(isRecycler || isTransporter) && (
                    <QuickCertificateButton
                      shipment={{
                        ...shipment,
                        unit: shipment.unit || 'كجم',
                        has_report: shipment.has_report,
                      }}
                      onSuccess={onStatusChange}
                      variant="outline"
                      size="sm"
                      showLabel={false}
                    />
                  )}
{/* Quick Receipt Button - only for transporter */}
                  {isTransporter && (
                    <QuickReceiptButton
                      shipment={{
                        ...shipment,
                        unit: shipment.unit || 'كجم',
                        pickup_address: shipment.pickup_address || '',
                        generator_id: shipment.generator_id || shipment.generator?.id || '',
                        generator: shipment.generator,
                        recycler: shipment.recycler,
                        driver_id: shipment.driver_id || null,
                        driver: shipment.driver ? { profile: shipment.driver.profile || null } : null,
                        has_receipt: shipment.has_receipt,
                      } as any}
                      onSuccess={onStatusChange}
                      variant="outline"
                      size="sm"
                    />
                  )}
                  {/* Generator Delivery Certificate Button */}
                  {isGenerator && (
                    hasGeneratorDeclaration ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 gap-1 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        تم إقرار التسليم
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setIsDeliveryCertOpen(true); }}
                        className="gap-1 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/30"
                        title="إقرار تسليم الشحنة"
                      >
                        <FileCheck className="w-3 h-3" />
                        إقرار تسليم
                      </Button>
                    )
                  )}
                  {/* Cancel Shipment Button */}
                  <CancelShipmentDialog
                    shipmentId={shipment.id}
                    shipmentNumber={shipment.shipment_number}
                    currentStatus={shipment.status}
                    onSuccess={onStatusChange}
                    trigger={
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    }
                  />
                  {canChange && !isCompleted && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="eco"
                          className="gap-1 text-xs"
                          disabled={isQuickStatusChanging}
                        >
                          {isQuickStatusChanging ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          تغيير
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="start" 
                        className="w-48 bg-popover z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {availableNextStatuses.slice(0, 3).map((status) => {
                          const StatusIcon = status.icon;
                          return (
                            <DropdownMenuItem
                              key={status.key}
                              onClick={() => handleQuickStatusChange(status.key)}
                              className="gap-2 cursor-pointer"
                            >
                              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", status.bgClass)}>
                                <StatusIcon className="w-3 h-3" />
                              </div>
                              <span>{status.labelAr}</span>
                            </DropdownMenuItem>
                          );
                        })}
                        {availableNextStatuses.length > 3 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={handleStatusButtonClick}
                              className="gap-2 cursor-pointer"
                            >
                              <Settings2 className="w-4 h-4" />
                              <span>المزيد من الخيارات...</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {availableNextStatuses.length <= 3 && availableNextStatuses.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={handleStatusButtonClick}
                              className="gap-2 cursor-pointer text-muted-foreground"
                            >
                              <Settings2 className="w-4 h-4" />
                              <span>تغيير متقدم...</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {/* Delivery Certificate Badge */}
                    {shipment.has_delivery_certificate && (
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700 gap-1">
                        <FileCheck className="w-3 h-3" />
                        إقرار تسليم
                      </Badge>
                    )}
                    {/* Receipt Issued Badge - Show to Generator and Transporter */}
                    {shipment.has_receipt && (isGenerator || isTransporter) && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700 gap-1">
                        <FileCheck className="w-3 h-3" />
                        {isTransporter ? 'تم إصدار شهادة استلام' : 'تم استلام الشحنة'}
                      </Badge>
                    )}
                    {/* Recycling Report Issued Badge */}
                    {shipment.has_report && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 gap-1">
                        <FileCheck className="w-3 h-3" />
                        تم إصدار شهادة التدوير
                      </Badge>
                    )}
                    {currentStatusConfig && (
                      <Badge className={cn(
                        currentStatusConfig.bgClass,
                        currentStatusConfig.borderClass,
                        "border gap-1.5 font-semibold text-black dark:text-white"
                      )}>
                        <currentStatusConfig.icon className="w-3.5 h-3.5" />
                        {currentStatusConfig.labelAr}
                      </Badge>
                    )}
                    <span className="font-mono font-bold">{shipment.shipment_number}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {wasteTypeLabels[shipment.waste_type] || shipment.waste_type} - {shipment.quantity} {shipment.unit || 'كجم'}
                  </p>
                  <DocumentChainStrip shipmentId={shipment.id} variant="minimal" orgType={organization?.organization_type as any} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <StatusChangeDialog
          isOpen={isStatusDialogOpen}
          onClose={() => setIsStatusDialogOpen(false)}
          shipment={{ ...shipment, status: mappedStatus }}
          onStatusChanged={handleStatusChanged}
        />

        {/* Show certificate dialog for both recycler (issue) and transporter (view) */}
        {(isRecycler || isTransporter) && (
          <RecyclingCertificateDialog
            isOpen={isReportDialogOpen}
            onClose={() => setIsReportDialogOpen(false)}
            shipment={shipment as any}
          />
        )}

        <ShipmentQuickPrint
          isOpen={isPrintDialogOpen}
          onClose={() => { setIsPrintDialogOpen(false); setPrintAutoAction(null); }}
          shipmentId={shipment.id}
          autoAction={printAutoAction}
        />

        <ShipmentRouteMap
          isOpen={isMapDialogOpen}
          onClose={() => setIsMapDialogOpen(false)}
          pickupAddress={shipment.pickup_address || 'غير محدد'}
          deliveryAddress={shipment.delivery_address || 'غير محدد'}
          shipmentNumber={shipment.shipment_number}
          driverId={shipment.driver_id}
          shipmentStatus={shipment.status}
        />

        {/* Live Tracking Map Dialog */}
        {isLiveTrackingOpen && shipment.driver_id && (
          <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }>
            <LiveTrackingMapDialog
              isOpen={isLiveTrackingOpen}
              onClose={() => setIsLiveTrackingOpen(false)}
              driverId={shipment.driver_id}
              shipmentNumber={shipment.shipment_number}
              pickupAddress={shipment.pickup_address || 'غير محدد'}
              deliveryAddress={shipment.delivery_address || 'غير محدد'}
              shipmentStatus={shipment.status}
            />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.005, y: -2 }}
        whileTap={{ scale: 0.995 }}
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        <Card className="hover:shadow-lg transition-all duration-300 border-r-4 overflow-hidden group border-border/40"
          style={{ borderRightColor: currentStatusConfig ? `var(--${currentStatusConfig.key}-color, #94a3b8)` : undefined }}
        >
          <CardContent className="p-0 overflow-hidden">
            {/* Hover accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Main Content */}
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-3">
                {/* Shipment Info */}
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-1.5 justify-end flex-wrap">
                    {/* Generator Approval Badge */}
                    {shipment.generator_id && visibility.canViewGeneratorInfo && (
                      <ShipmentApprovalBadge
                        status={shipment.generator_approval_status}
                        approvalAt={shipment.generator_approval_at}
                        rejectionReason={shipment.generator_rejection_reason}
                        deadline={shipment.generator_auto_approve_deadline}
                        type="generator"
                        compact
                      />
                    )}
                    {/* Recycler Approval Badge */}
                    {shipment.recycler_id && visibility.canViewRecyclerInfo && (
                      <ShipmentApprovalBadge
                        status={shipment.recycler_approval_status}
                        approvalAt={shipment.recycler_approval_at}
                        rejectionReason={shipment.recycler_rejection_reason}
                        deadline={shipment.recycler_auto_approve_deadline}
                        type="recycler"
                        compact
                      />
                    )}
                    {/* Delivery Certificate Badge */}
                    {shipment.has_delivery_certificate && (
                      <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700 gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        إقرار تسليم
                      </Badge>
                    )}
                    {/* Receipt Issued Badge - Show to Generator and Transporter */}
                    {shipment.has_receipt && (isGenerator || isTransporter) && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        {isTransporter ? 'تم إصدار شهادة استلام' : 'تم استلام الشحنة'}
                      </Badge>
                    )}
                    {/* Recycling Report Issued Badge - Prominent indicator */}
                    {shipment.has_report && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 gap-1.5 animate-pulse">
                        <FileCheck className="w-4 h-4" />
                        تم إصدار شهادة التدوير
                      </Badge>
                    )}
                    {currentStatusConfig && (
                      <Badge className={cn(
                        currentStatusConfig.bgClass,
                        currentStatusConfig.borderClass,
                        "border gap-1.5 font-semibold text-black dark:text-white"
                      )}>
                        <currentStatusConfig.icon className="w-3.5 h-3.5" />
                        {currentStatusConfig.labelAr}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {currentStatusConfig?.phase === 'transporter' ? 'مرحلة النقل' : 'مرحلة التدوير'}
                    </Badge>
                    <span className="font-mono font-bold text-base sm:text-lg truncate">{shipment.shipment_number}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm">
                    {visibility.canViewGeneratorInfo && (
                      <div className="flex items-center gap-1 justify-end text-muted-foreground">
                        <span>{shipment.generator?.name || '-'}</span>
                        <Building2 className="w-4 h-4" />
                      </div>
                    )}
                    {!visibility.canViewGeneratorInfo && !visibility.isOwner && (
                      <div className="flex items-center gap-1 justify-end text-muted-foreground/50">
                        <span>محجوب</span>
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                    <div className="flex items-center gap-1 justify-end text-muted-foreground">
                      <span>{shipment.transporter?.name || '-'}</span>
                      <Truck className="w-4 h-4" />
                    </div>
                    {visibility.canViewRecyclerInfo && (
                      <div className="flex items-center gap-1 justify-end text-muted-foreground">
                        <span>{shipment.recycler?.name || '-'}</span>
                        <Recycle className="w-4 h-4" />
                      </div>
                    )}
                    {!visibility.canViewRecyclerInfo && !visibility.isOwner && (
                      <div className="flex items-center gap-1 justify-end text-muted-foreground/50">
                        <span>محجوب</span>
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Comprehensive Data Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 mt-3 text-xs border-t border-border/30 pt-3">
                    {/* Waste Info */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-foreground font-medium">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</span>
                      <span className="text-muted-foreground">النوع:</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-foreground font-semibold">{shipment.quantity} {shipment.unit || 'كجم'}</span>
                      <span className="text-muted-foreground">الكمية:</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-foreground">{format(new Date(shipment.created_at), 'PP', { locale: ar })}</span>
                      <span className="text-muted-foreground">الإنشاء:</span>
                    </div>
                    {shipment.expected_delivery_date && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{format(new Date(shipment.expected_delivery_date), 'PP', { locale: ar })}</span>
                        <span className="text-muted-foreground">التسليم المتوقع:</span>
                      </div>
                    )}

                    {/* Addresses */}
                    {shipment.pickup_address && (
                      <div className="flex items-center gap-1.5 justify-end col-span-2">
                        <span className="text-foreground truncate max-w-[200px]">{shipment.pickup_address}</span>
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground shrink-0">الاستلام:</span>
                      </div>
                    )}
                    {shipment.delivery_address && (
                      <div className="flex items-center gap-1.5 justify-end col-span-2">
                        <span className="text-foreground truncate max-w-[200px]">{shipment.delivery_address}</span>
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span className="text-muted-foreground shrink-0">التسليم:</span>
                      </div>
                    )}

                    {/* Driver Info */}
                    {(shipment.driver?.profile?.full_name || shipment.manual_driver_name) && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{shipment.driver?.profile?.full_name || shipment.manual_driver_name}</span>
                        <span className="text-muted-foreground">السائق:</span>
                      </div>
                    )}
                    {(shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate) && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate}</Badge>
                        <span className="text-muted-foreground">اللوحة:</span>
                      </div>
                    )}
                    {shipment.driver?.vehicle_type && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{shipment.driver.vehicle_type}</span>
                        <Truck className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">المركبة:</span>
                      </div>
                    )}

                    {/* Hazard & Packaging */}
                    {shipment.hazard_level && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <Badge className={cn("text-[10px] h-5 px-1.5", 
                          shipment.hazard_level === 'high' ? 'bg-destructive/20 text-destructive border-destructive/30' :
                          shipment.hazard_level === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                        )}>
                          {shipment.hazard_level === 'high' ? 'عالي' : shipment.hazard_level === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">الخطورة:</span>
                      </div>
                    )}
                    {shipment.packaging_method && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{shipment.packaging_method}</span>
                        <span className="text-muted-foreground">التغليف:</span>
                      </div>
                    )}
                    {shipment.disposal_method && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{shipment.disposal_method}</span>
                        <span className="text-muted-foreground">طريقة التخلص:</span>
                      </div>
                    )}

                    {/* Key Timestamps */}
                    {shipment.pickup_date && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{format(new Date(shipment.pickup_date), 'PP', { locale: ar })}</span>
                        <span className="text-muted-foreground">موعد الاستلام:</span>
                      </div>
                    )}
                    {shipment.approved_at && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{format(new Date(shipment.approved_at), 'Pp', { locale: ar })}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-muted-foreground">الاعتماد:</span>
                      </div>
                    )}
                    {shipment.in_transit_at && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{format(new Date(shipment.in_transit_at), 'Pp', { locale: ar })}</span>
                        <Truck className="w-3 h-3 text-blue-600" />
                        <span className="text-muted-foreground">بدء النقل:</span>
                      </div>
                    )}
                    {shipment.delivered_at && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{format(new Date(shipment.delivered_at), 'Pp', { locale: ar })}</span>
                        <span className="text-muted-foreground">التسليم:</span>
                      </div>
                    )}
                    {shipment.confirmed_at && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{format(new Date(shipment.confirmed_at), 'Pp', { locale: ar })}</span>
                        <BadgeCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-muted-foreground">التأكيد:</span>
                      </div>
                    )}

                    {/* Contact Info */}
                    {shipment.generator?.phone && visibility.canViewGeneratorInfo && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground font-mono text-[10px]" dir="ltr">{shipment.generator.phone}</span>
                        <span className="text-muted-foreground">هاتف المولّد:</span>
                      </div>
                    )}
                    {shipment.recycler?.phone && visibility.canViewRecyclerInfo && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground font-mono text-[10px]" dir="ltr">{shipment.recycler.phone}</span>
                        <span className="text-muted-foreground">هاتف المدوّر:</span>
                      </div>
                    )}
                    {shipment.generator?.representative_name && visibility.canViewGeneratorInfo && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{shipment.generator.representative_name}</span>
                        <span className="text-muted-foreground">ممثل المولّد:</span>
                      </div>
                    )}
                    {shipment.recycler?.representative_name && visibility.canViewRecyclerInfo && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-foreground">{shipment.recycler.representative_name}</span>
                        <span className="text-muted-foreground">ممثل المدوّر:</span>
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  {(shipment.notes || shipment.waste_description || shipment.generator_notes) && (
                    <div className="mt-2 space-y-1 text-xs border-t border-border/30 pt-2">
                      {shipment.waste_description && (
                        <div className="flex items-start gap-1.5 justify-end text-muted-foreground">
                          <span className="text-foreground">{shipment.waste_description}</span>
                          <span className="shrink-0">وصف المخلفات:</span>
                        </div>
                      )}
                      {shipment.notes && (
                        <div className="flex items-start gap-1.5 justify-end text-muted-foreground">
                          <span className="text-foreground">{shipment.notes}</span>
                          <span className="shrink-0">ملاحظات:</span>
                        </div>
                      )}
                      {shipment.generator_notes && visibility.canViewGeneratorInfo && (
                        <div className="flex items-start gap-1.5 justify-end text-muted-foreground">
                          <span className="text-foreground">{shipment.generator_notes}</span>
                          <span className="shrink-0">ملاحظات المولّد:</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Navigation Button Group - Google Maps & Waze - only if maps allowed */}
                    {visibility.canViewMaps && (
                      <NavigationButtonGroup
                        pickupAddress={shipment.pickup_address}
                        deliveryAddress={shipment.delivery_address}
                        size="sm"
                      />
                    )}
                    {/* Live Tracking Button - shows when driver is assigned AND visibility allowed */}
                    {shipment.driver_id && visibility.canViewTracking && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleLiveTrackingClick}
                        className="gap-2"
                        title="التتبع المباشر للسائق"
                      >
                        <Eye className="w-4 h-4" />
                        تتبع مباشر
                      </Button>
                    )}
                    {/* Locked indicator when tracking is blocked */}
                    {shipment.driver_id && !visibility.canViewTracking && !visibility.isOwner && (
                      <div className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                        <Lock className="w-3 h-3" />
                        <span>التتبع مقفل</span>
                      </div>
                    )}
                    {/* GPS Tracking Status Widget */}
                    <Suspense fallback={null}>
                      <GPSTrackingStatusWidget
                        shipmentId={shipment.id}
                        driverId={shipment.driver_id || null}
                        compact={true}
                        onClick={() => {
                          navigate(`/dashboard/s/${shipment.shipment_number}?tab=tracking`);
                        }}
                      />
                    </Suspense>
                    {/* Map Button - only if maps allowed */}
                    {visibility.canViewMaps && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMapButtonClick}
                        className="gap-2"
                        title="تتبع على الخريطة"
                      >
                        <MapPin className="w-4 h-4" />
                        الخريطة
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDirectPrint}
                      className="gap-2"
                      title="طباعة مباشرة"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDirectPDF}
                      className="gap-2"
                      title="تحميل PDF"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <ManifestPDFButton
                      shipmentId={shipment.id}
                      shipmentNumber={shipment.shipment_number || ''}
                      variant="ghost"
                      size="sm"
                    />
                    {/* Show recycling certificate button for recycler (to issue) or transporter/admin (to view) */}
                    {(isRecycler || isTransporter || shipment.has_report) && (
                      <QuickCertificateButton
                        shipment={{
                          ...shipment,
                          unit: shipment.unit || 'كجم',
                          has_report: shipment.has_report,
                        }}
                        onSuccess={onStatusChange}
                        variant="outline"
                        size="sm"
                        showLabel={true}
                      />
                    )}
                    {/* Quick Receipt Button - only for transporter */}
                    {isTransporter && (
                      <QuickReceiptButton
                        shipment={{
                          ...shipment,
                          unit: shipment.unit || 'كجم',
                          pickup_address: shipment.pickup_address || '',
                          generator_id: shipment.generator_id || shipment.generator?.id || '',
                          generator: shipment.generator,
                          recycler: shipment.recycler,
                          driver_id: shipment.driver_id || null,
                          driver: shipment.driver ? { profile: shipment.driver.profile || null } : null,
                          has_receipt: shipment.has_receipt,
                        }}
                        onSuccess={onStatusChange}
                        variant="outline"
                        size="sm"
                      />
                    )}
                    {/* Generator Delivery Certificate Button */}
                    {isGenerator && (
                      hasGeneratorDeclaration ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setIsDeclarationViewOpen(true); }}
                          className="gap-2 text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:bg-emerald-900/30"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          تم إقرار التسليم ✓
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setIsDeliveryCertOpen(true); }}
                          className="gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/30"
                        >
                          <FileCheck className="w-4 h-4" />
                          إقرار تسليم
                        </Button>
                      )
                    )}
                    {canChange && availableNextStatuses.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="eco"
                            className="gap-2 w-full sm:w-auto"
                            disabled={isQuickStatusChanging}
                          >
                            {isQuickStatusChanging ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            تغيير الحالة
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="start" 
                          className="w-56 bg-popover z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {availableNextStatuses.slice(0, 5).map((status) => {
                            const StatusIcon = status.icon;
                            return (
                              <DropdownMenuItem
                                key={status.key}
                                onClick={() => handleQuickStatusChange(status.key)}
                                className="gap-3 cursor-pointer py-2"
                              >
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", status.bgClass)}>
                                  <StatusIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">{status.labelAr}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {status.phase === 'transporter' ? 'مرحلة النقل' : 'مرحلة التدوير'}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                          {availableNextStatuses.length > 5 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={handleStatusButtonClick}
                                className="gap-2 cursor-pointer"
                              >
                                <Settings2 className="w-4 h-4" />
                                <span>عرض جميع الخيارات ({availableNextStatuses.length})</span>
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleStatusButtonClick}
                            className="gap-2 cursor-pointer text-muted-foreground"
                          >
                            <Settings2 className="w-4 h-4" />
                            <span>تغيير متقدم مع ملاحظات...</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : isCompleted && !isAdmin ? (
                      <Badge className="bg-emerald-500 text-white gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        مكتملة
                      </Badge>
                    ) : null}

                    {/* Declaration View Button */}
                    {declarationData && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={(e) => { e.stopPropagation(); setIsDeclarationViewOpen(true); }}
                      >
                        <FileText className="w-4 h-4" />
                        إقرار التسليم
                      </Button>
                    )}

                    {/* Cancel Shipment Button - Full View */}
                    <CancelShipmentDialog
                      shipmentId={shipment.id}
                      shipmentNumber={shipment.shipment_number}
                      currentStatus={shipment.status}
                      onSuccess={onStatusChange}
                      trigger={
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <XCircle className="w-4 h-4" />
                          إلغاء
                        </Button>
                      }
                    />
                    {/* Per-shipment recycler hiding toggle - Transporter only */}
                    {isTransporter && shipment.generator_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-muted-foreground"
                        title={
                          (shipment as any).hide_recycler_from_generator
                            ? 'المدوّر مخفي عن المولّد - اضغط للإظهار'
                            : 'إخفاء المدوّر عن المولّد'
                        }
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newVal = !(shipment as any).hide_recycler_from_generator;
                          const { error } = await supabase
                            .from('shipments')
                            .update({ hide_recycler_from_generator: newVal } as any)
                            .eq('id', shipment.id);
                          if (error) {
                            toast.error('فشل تحديث الإعداد');
                          } else {
                            toast.success(newVal ? 'تم إخفاء المدوّر عن المولّد' : 'تم إظهار المدوّر للمولّد');
                            onStatusChange?.();
                          }
                        }}
                      >
                        <EyeOff className={cn("w-3.5 h-3.5", (shipment as any).hide_recycler_from_generator && "text-amber-600")} />
                        {(shipment as any).hide_recycler_from_generator ? 'مخفي' : 'إخفاء'}
                      </Button>
                    )}
                    {/* Per-shipment generator hiding toggle - Transporter only */}
                    {isTransporter && shipment.recycler_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs text-muted-foreground"
                        title={
                          (shipment as any).hide_generator_from_recycler
                            ? 'المولّد مخفي عن المدوّر - اضغط للإظهار'
                            : 'إخفاء المولّد عن المدوّر'
                        }
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newVal = !(shipment as any).hide_generator_from_recycler;
                          const { error } = await supabase
                            .from('shipments')
                            .update({ hide_generator_from_recycler: newVal } as any)
                            .eq('id', shipment.id);
                          if (error) {
                            toast.error('فشل تحديث الإعداد');
                          } else {
                            toast.success(newVal ? 'تم إخفاء المولّد عن المدوّر' : 'تم إظهار المولّد للمدوّر');
                            onStatusChange?.();
                          }
                        }}
                      >
                        <EyeOff className={cn("w-3.5 h-3.5", (shipment as any).hide_generator_from_recycler && "text-amber-600")} />
                        {(shipment as any).hide_generator_from_recycler ? 'مولّد مخفي' : 'إخفاء مولّد'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recycler Notes Section - Visible to Transporter */}
            {isTransporter && shipment.recycler_notes && (
              <div className="border-t bg-green-50 dark:bg-green-950/30 p-3">
                <div className="flex items-start gap-2">
                  <Recycle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      ملاحظات جهة التدوير:
                    </span>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {shipment.recycler_notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Tracking Map - Collapsible */}
            {shipment.driver_id && (
              <div className="border-t">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between px-4 py-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInlineMap(!showInlineMap);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-primary" />
                    <span>خريطة التتبع</span>
                  </div>
                  {showInlineMap ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <AnimatePresence>
                  {showInlineMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Suspense fallback={
                        <div className="h-[200px] flex items-center justify-center bg-muted/30">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      }>
                        <ShipmentInlineTrackingMap
                          shipmentId={shipment.id}
                          pickupAddress={shipment.pickup_address || ''}
                          deliveryAddress={shipment.delivery_address || ''}
                          driverId={shipment.driver_id}
                          status={shipment.status}
                          collapsible={false}
                          defaultExpanded={true}
                          height={180}
                          onExpandClick={() => setIsLiveTrackingOpen(true)}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Document Chain Strip — سلسلة المستندات المباشرة */}
            <div className="border-t px-4 py-2.5 bg-muted/30" onClick={(e) => e.stopPropagation()}>
              <DocumentChainStrip shipmentId={shipment.id} variant="full" orgType={organization?.organization_type as any} />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <CompleteShipmentDocButton
                  shipmentId={shipment.id}
                  shipmentNumber={shipment.shipment_number}
                  shipmentStatus={shipment.status}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-5 px-2"
                />
                <Suspense fallback={null}>
                  <ShipmentEndorsementButton
                    shipmentId={shipment.id}
                    shipmentNumber={shipment.shipment_number}
                    shipmentStatus={mappedStatus}
                  />
                </Suspense>
              </div>
            </div>

            {/* Supervisor Compliance Dashboard */}
            <div className="border-t px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
              <Suspense fallback={<div className="h-8 flex items-center justify-center text-xs text-muted-foreground">جاري تحميل لوحة الامتثال...</div>}>
                <SupervisorComplianceDashboard shipment={shipment} compact />
              </Suspense>
            </div>

            {/* Simplified Progress Steps — 5 key milestones only */}
            <div className="border-t bg-gradient-to-l from-muted/50 to-transparent px-4 py-2">
              <div className="flex items-center justify-between gap-1">
                {allStatuses.filter((_, i) => i % 2 === 0).slice(0, 5).map((status, index, arr) => {
                  const origIndex = allStatuses.findIndex(s => s.key === status.key);
                  const isActive = origIndex <= currentStatusIndex;
                  const isCurrent = status.key === mappedStatus;
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={status.key} className="flex items-center gap-0.5 flex-1">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                        isActive ? status.colorClass : 'bg-muted',
                        isCurrent && 'ring-2 ring-offset-1 ring-primary'
                      )}>
                        <StatusIcon className={cn(
                          "w-3 h-3",
                          isActive ? 'text-white' : 'text-muted-foreground'
                        )} />
                      </div>
                      {index < arr.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 rounded transition-all",
                          origIndex < currentStatusIndex ? status.colorClass : 'bg-muted'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <StatusChangeDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        shipment={{ ...shipment, status: mappedStatus }}
        onStatusChanged={handleStatusChanged}
      />

      {isRecycler && (
        <RecyclingCertificateDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          shipment={shipment as any}
        />
      )}

      <ShipmentQuickPrint
        isOpen={isPrintDialogOpen}
        onClose={() => { setIsPrintDialogOpen(false); setPrintAutoAction(null); }}
        shipmentId={shipment.id}
        autoAction={printAutoAction}
      />

      <ShipmentRouteMap
        isOpen={isMapDialogOpen}
        onClose={() => setIsMapDialogOpen(false)}
        pickupAddress={shipment.pickup_address || 'غير محدد'}
        deliveryAddress={shipment.delivery_address || 'غير محدد'}
        shipmentNumber={shipment.shipment_number}
        driverId={shipment.driver_id}
        shipmentStatus={shipment.status}
      />

      {/* Live Tracking Map Dialog */}
      {isLiveTrackingOpen && shipment.driver_id && (
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <LiveTrackingMapDialog
            isOpen={isLiveTrackingOpen}
            onClose={() => setIsLiveTrackingOpen(false)}
            driverId={shipment.driver_id}
            shipmentNumber={shipment.shipment_number}
            pickupAddress={shipment.pickup_address || 'غير محدد'}
            deliveryAddress={shipment.delivery_address || 'غير محدد'}
            shipmentStatus={shipment.status}
          />
        </Suspense>
      )}

      {/* Delivery Declaration View Dialog */}
      {declarationData && (
        <DeliveryDeclarationViewDialog
          open={isDeclarationViewOpen}
          onOpenChange={setIsDeclarationViewOpen}
          declaration={declarationData as any}
        />
      )}

      {/* Generator Delivery Certificate Dialog */}
      <GeneratorDeliveryCertificateDialog
        open={isDeliveryCertOpen}
        onOpenChange={setIsDeliveryCertOpen}
        shipment={{
          id: shipment.id,
          shipment_number: shipment.shipment_number,
          waste_type: shipment.waste_type,
          quantity: shipment.quantity,
          unit: shipment.unit || 'كجم',
          status: shipment.status,
          created_at: shipment.created_at,
          pickup_address: shipment.pickup_address || '',
          delivery_address: shipment.delivery_address || '',
          generator: shipment.generator ? { name: shipment.generator.name, city: (shipment.generator as any)?.city } : undefined,
          transporter: shipment.transporter ? { name: shipment.transporter.name, city: (shipment.transporter as any)?.city } : undefined,
          recycler: shipment.recycler ? { name: shipment.recycler.name, city: (shipment.recycler as any)?.city } : undefined,
        } as any}
        onSuccess={onStatusChange}
      />
    </>
  );
};

export default ShipmentCard;
