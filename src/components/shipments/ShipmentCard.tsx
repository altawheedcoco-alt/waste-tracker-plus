import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format, differenceInSeconds, differenceInMinutes, differenceInHours } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import {
  Clock,
  Timer,
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
} from 'lucide-react';
import {
  getStatusConfig,
  canChangeStatus,
  allStatuses,
  wasteTypeLabels,
  mapLegacyStatus,
} from '@/lib/shipmentStatusConfig';
import StatusChangeDialog from './StatusChangeDialog';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';
import ShipmentQuickPrint from './ShipmentQuickPrint';
import ShipmentRouteMap from './ShipmentRouteMap';

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
    expected_delivery_date?: string | null;
    approved_at?: string | null;
    collection_started_at?: string | null;
    in_transit_at?: string | null;
    delivered_at?: string | null;
    confirmed_at?: string | null;
    recycler_notes?: string | null;
    generator?: { name: string } | null;
    recycler?: { name: string } | null;
    transporter?: { name: string } | null;
  };
  onStatusChange?: () => void;
  showAutoTimer?: boolean;
  variant?: 'compact' | 'full';
  countdown?: { minutes: number; seconds: number };
}

// Auto-status configuration - same as in hook
const AUTO_STATUS_CONFIG = {
  autoReceiveMinutes: 2,
  autoConfirmHours: 6,
};

const ShipmentCard = ({ 
  shipment, 
  onStatusChange, 
  showAutoTimer = true,
  variant = 'full',
  countdown,
}: ShipmentCardProps) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<{ minutes: number; seconds: number } | null>(null);

  // Map legacy status to new status
  const mappedStatus = mapLegacyStatus(shipment.status);
  const currentStatusConfig = getStatusConfig(mappedStatus);
  
  const organizationType = organization?.organization_type || 'generator';
  const canChange = canChangeStatus(mappedStatus, organizationType);
  const isRecycler = organizationType === 'recycler';
  const isTransporter = organizationType === 'transporter';
  const isCompleted = shipment.status === 'completed' || shipment.status === 'confirmed';

  // Calculate current status index for progress display
  const currentStatusIndex = allStatuses.findIndex(s => s.key === mappedStatus);

  // Calculate auto-status countdown
  useEffect(() => {
    if (!showAutoTimer || isCompleted) {
      setAutoCountdown(null);
      return;
    }

    const calculateAutoCountdown = () => {
      const now = new Date();
      const createdAt = new Date(shipment.created_at);
      const status = shipment.status; // Use original status for comparison

      // For in_transit or delivering - countdown to auto-receive
      if (status === 'in_transit' || status === 'delivering') {
        const autoReceiveTime = new Date(createdAt.getTime() + AUTO_STATUS_CONFIG.autoReceiveMinutes * 60 * 1000);
        const remainingMs = autoReceiveTime.getTime() - now.getTime();

        if (remainingMs > 0) {
          const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
          const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
          setAutoCountdown({ minutes: remainingMinutes, seconds: remainingSeconds });
        } else {
          setAutoCountdown(null);
        }
      }
      // For delivered - countdown to auto-confirm
      else if (status === 'delivered') {
        const autoConfirmTime = new Date(createdAt.getTime() + AUTO_STATUS_CONFIG.autoConfirmHours * 60 * 60 * 1000);
        const remainingMs = autoConfirmTime.getTime() - now.getTime();

        if (remainingMs > 0) {
          const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
          const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
          setAutoCountdown({ minutes: remainingMinutes, seconds: remainingSeconds });
        } else {
          setAutoCountdown(null);
        }
      } else {
        setAutoCountdown(null);
      }
    };

    calculateAutoCountdown();
    const interval = setInterval(calculateAutoCountdown, 1000);

    return () => clearInterval(interval);
  }, [shipment.created_at, shipment.status, showAutoTimer, isCompleted]);

  const handleCardClick = () => {
    navigate(`/dashboard/shipments/${shipment.id}`);
  };

  const handleStatusButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStatusDialogOpen(true);
  };

  const handleStatusChanged = () => {
    setIsStatusDialogOpen(false);
    onStatusChange?.();
  };

  const handleReportButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReportDialogOpen(true);
  };

  const handlePrintButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPrintDialogOpen(true);
  };

  const handleMapButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMapDialogOpen(true);
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleMapButtonClick}
                    className="gap-1 text-xs"
                    title="تتبع على الخريطة"
                  >
                    <MapPin className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePrintButtonClick}
                    className="gap-1 text-xs"
                    title="طباعة نموذج التتبع"
                  >
                    <Printer className="w-3 h-3" />
                  </Button>
                  {isRecycler && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReportButtonClick}
                      className="gap-1 text-xs"
                    >
                      <FileText className="w-3 h-3" />
                      تقرير
                    </Button>
                  )}
                  {canChange && !isCompleted && (
                    <Button
                      size="sm"
                      variant="eco"
                      onClick={handleStatusButtonClick}
                      className="gap-1 text-xs"
                    >
                      <RefreshCw className="w-3 h-3" />
                      تغيير
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
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
          onClose={() => setIsPrintDialogOpen(false)}
          shipmentId={shipment.id}
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
      </>
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className="cursor-pointer"
        onClick={handleCardClick}
      >
        <Card className="hover:shadow-lg transition-all border-r-4 overflow-hidden"
          style={{ borderRightColor: currentStatusConfig ? `var(--${currentStatusConfig.key}-color, #94a3b8)` : undefined }}
        >
          <CardContent className="p-0">
            {/* Main Content */}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Right Side - Shipment Info */}
                <div className="flex-1 text-right order-1 sm:order-2">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
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
                    <span className="font-mono font-bold text-lg">{shipment.shipment_number}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm">
                    <div className="flex items-center gap-1 justify-end text-muted-foreground">
                      <span>{shipment.generator?.name || '-'}</span>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1 justify-end text-muted-foreground">
                      <span>{shipment.transporter?.name || '-'}</span>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1 justify-end text-muted-foreground">
                      <span>{shipment.recycler?.name || '-'}</span>
                      <Recycle className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground justify-end flex-wrap">
                    <span>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</span>
                    <span className="font-semibold">{shipment.quantity} {shipment.unit || 'كجم'}</span>
                    <span>{format(new Date(shipment.created_at), 'PP', { locale: ar })}</span>
                  </div>
                </div>

                {/* Left Side - Action Buttons */}
                <div className="flex flex-col items-start gap-2 order-2 sm:order-1 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMapButtonClick}
                      className="gap-2"
                      title="تتبع على الخريطة"
                    >
                      <MapPin className="w-4 h-4" />
                      تتبع الخريطة
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrintButtonClick}
                      className="gap-2"
                      title="طباعة نموذج التتبع"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة
                    </Button>
                    {isRecycler && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReportButtonClick}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        تقرير التدوير
                      </Button>
                    )}
                    {canChange && !isCompleted ? (
                      <Button
                        variant="eco"
                        onClick={handleStatusButtonClick}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4" />
                        تغيير الحالة
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    ) : isCompleted ? (
                      <Badge className="bg-emerald-500 text-white gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        مكتملة
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Status Countdown Timer */}
            {showAutoTimer && autoCountdown && !isCompleted && (
              <div className="border-t bg-amber-50 dark:bg-amber-950/30 p-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      {(shipment.status === 'in_transit' || shipment.status === 'delivering') 
                        ? 'تغيير الحالة تلقائياً خلال:' 
                        : 'الإقرار التلقائي خلال:'}
                    </span>
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-200">
                      {autoCountdown.minutes > 0 
                        ? `${autoCountdown.minutes} دقيقة ${autoCountdown.seconds} ثانية`
                        : `${autoCountdown.seconds} ثانية`}
                    </span>
                  </div>
                  <Badge className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 gap-1">
                    <Timer className="w-3 h-3" />
                    {(shipment.status === 'in_transit' || shipment.status === 'delivering') 
                      ? `${AUTO_STATUS_CONFIG.autoReceiveMinutes} دقيقة للاستلام التلقائي`
                      : `${AUTO_STATUS_CONFIG.autoConfirmHours} ساعات للإقرار التلقائي`}
                  </Badge>
                </div>
              </div>
            )}

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

            {/* Timer Section */}
            {showAutoTimer && shipment.expected_delivery_date && !isCompleted && (
              <div className="border-t bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">الوقت المتبقي:</span>
                    <span className={cn(
                      "font-semibold",
                      timeRemaining === 'متأخرة' ? 'text-destructive' : 'text-primary'
                    )}>
                      {timeRemaining || 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>الوصول المتوقع: {format(new Date(shipment.expected_delivery_date), 'PPp', { locale: ar })}</span>
                  </div>
                </div>
                <Progress value={progress} className="mt-2 h-2" />
              </div>
            )}

            {/* Progress Steps - Show relevant phase only */}
            <div className="border-t bg-gradient-to-l from-muted/50 to-transparent px-4 py-3">
              <div className="flex items-center justify-between gap-1">
                {allStatuses.slice(0, 10).map((status, index) => {
                  const isActive = index <= currentStatusIndex;
                  const isCurrent = status.key === mappedStatus;
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={status.key} className="flex items-center gap-1 flex-1">
                      <div className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all",
                        isActive ? status.colorClass : 'bg-muted',
                        isCurrent && 'ring-2 ring-offset-1 ring-primary'
                      )}>
                        <StatusIcon className={cn(
                          "w-2.5 h-2.5 sm:w-3 sm:h-3",
                          isActive ? 'text-white' : 'text-muted-foreground'
                        )} />
                      </div>
                      {index < 9 && (
                        <div className={cn(
                          "flex-1 h-0.5 rounded transition-all",
                          index < currentStatusIndex ? status.colorClass : 'bg-muted'
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
        onClose={() => setIsPrintDialogOpen(false)}
        shipmentId={shipment.id}
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
    </>
  );
};

export default ShipmentCard;
