import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { autoCreateReceipt } from '@/utils/autoReceiptCreator';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getStatusConfig,
  getAvailableNextStatuses,
  canChangeStatus,
  allStatuses,
  StatusConfig,
  mapToDbStatus,
  ShipmentStatus,
} from '@/lib/shipmentStatusConfig';
import { calculateHaversineDistance } from '@/lib/mapUtils';

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: {
    id: string;
    shipment_number: string;
    status: string;
    delivery_latitude?: number | null;
    delivery_longitude?: number | null;
    gps_delivery_lat?: number | null;
    gps_delivery_lng?: number | null;
  };
  onStatusChanged?: () => void;
  geofenceRadius?: number; // in meters, default 200
}

const StatusChangeDialog = ({ isOpen, onClose, shipment, onStatusChanged, geofenceRadius = 200 }: StatusChangeDialogProps) => {
  const { profile, organization } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [geofenceCheck, setGeofenceCheck] = useState<{
    checking: boolean;
    isInside: boolean | null;
    distance: number | null;
    error: string | null;
  }>({ checking: false, isInside: null, distance: null, error: null });

  const organizationType = (organization?.organization_type || 'generator') as 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin';

  // Get delivery coordinates from shipment
  const deliveryLat = shipment.gps_delivery_lat ?? shipment.delivery_latitude;
  const deliveryLng = shipment.gps_delivery_lng ?? shipment.delivery_longitude;
  const hasDeliveryCoords = deliveryLat != null && deliveryLng != null;

  // Check geofence when "delivered" is selected
  const checkGeofence = useCallback(async () => {
    if (!hasDeliveryCoords) {
      setGeofenceCheck({ checking: false, isInside: true, distance: null, error: null });
      return;
    }

    setGeofenceCheck(prev => ({ ...prev, checking: true, error: null }));

    if (!navigator.geolocation) {
      setGeofenceCheck({ checking: false, isInside: false, distance: null, error: 'الموقع الجغرافي غير متاح' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distanceKm = calculateHaversineDistance(latitude, longitude, deliveryLat!, deliveryLng!);
        const distanceM = distanceKm * 1000;
        const isInside = distanceM <= geofenceRadius;

        setGeofenceCheck({ checking: false, isInside, distance: Math.round(distanceM), error: null });

        if (!isInside) {
          toast.error(`أنت تبعد ${Math.round(distanceM)} متر عن موقع التسليم. يجب أن تكون ضمن ${geofenceRadius} متر.`);
        }
      },
      (geoError) => {
        setGeofenceCheck({ checking: false, isInside: false, distance: null, error: geoError.message || 'تعذر الحصول على الموقع' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [hasDeliveryCoords, deliveryLat, deliveryLng, geofenceRadius]);

  // Trigger geofence check when "delivered" or "confirmed" is selected by transporter
  useEffect(() => {
    const isDeliveryStatus = selectedStatus && ['delivered', 'confirmed'].includes(mapToDbStatus(selectedStatus as ShipmentStatus));
    const isTransporter = organizationType === 'transporter';

    if (isDeliveryStatus && isTransporter && hasDeliveryCoords) {
      checkGeofence();
    } else {
      setGeofenceCheck({ checking: false, isInside: null, distance: null, error: null });
    }
  }, [selectedStatus, organizationType, hasDeliveryCoords, checkGeofence]);

  // Determine if delivery button should be blocked
  const isDeliveryBlocked = (() => {
    if (!selectedStatus) return false;
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    const isDeliveryStatus = ['delivered', 'confirmed'].includes(dbStatus);
    const isTransporter = organizationType === 'transporter';
    if (!isDeliveryStatus || !isTransporter || !hasDeliveryCoords) return false;
    return geofenceCheck.checking || geofenceCheck.isInside === false;
  })();

  const currentStatusConfig = getStatusConfig(shipment.status);
  const availableStatuses = getAvailableNextStatuses(shipment.status, organizationType);
  const canChange = canChangeStatus(shipment.status, organizationType);

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error('يرجى اختيار الحالة الجديدة');
      return;
    }

    if (isDeliveryBlocked) {
      toast.error('يجب أن تكون داخل نطاق موقع التسليم لتأكيد التسليم');
      return;
    }

    setLoading(true);
    try {
      // Map UI status to DB status
      const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
      console.log('Updating shipment status:', { selectedStatus, dbStatus, shipmentId: shipment.id });
      
      // Build update object based on status
      const updateData: Record<string, any> = {
        status: dbStatus,
      };

      // Set timestamp fields based on new status
      const now = new Date().toISOString();
      const timestampFields: Record<string, string> = {
        'approved': 'approved_at',
        'in_transit': 'in_transit_at',
        'delivered': 'delivered_at',
        'confirmed': 'confirmed_at',
      };

      if (timestampFields[dbStatus]) {
        updateData[timestampFields[dbStatus]] = now;
      }

      // Update shipment
      const { error: updateError } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);

      if (updateError) throw updateError;

      // Log the status change
      const statusConfig = getStatusConfig(selectedStatus);
      const { error: logError } = await supabase
        .from('shipment_logs')
        .insert([{
          shipment_id: shipment.id,
          status: dbStatus as any,
          notes: notes || `تم تغيير الحالة إلى ${statusConfig?.labelAr || selectedStatus}`,
          changed_by: profile?.id,
        }]);

      if (logError) {
        console.error('Error logging status change:', logError);
      }

      // Auto-create receipt when transporter delivers/receives shipment
      if (['delivered', 'in_transit'].includes(dbStatus) && organization?.organization_type === 'transporter') {
        try {
          await autoCreateReceipt(shipment.id, organization.id, profile?.id);
        } catch (receiptError) {
          console.error('Auto receipt creation failed:', receiptError);
          // Don't block the status change if receipt creation fails
        }
      }

      toast.success(`تم تحديث الحالة إلى "${statusConfig?.labelAr || selectedStatus}"`);
      onStatusChanged?.();
      handleClose();
    } catch (error: any) {
      console.error('Error updating shipment status:', error);
      console.error('Error details:', error?.message, error?.details, error?.code);
      toast.error(`حدث خطأ أثناء تحديث الحالة: ${error?.message || 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setNotes('');
    onClose();
  };

  const getPhaseLabel = (phase: 'transporter' | 'recycler' | 'disposal') => {
    if (phase === 'transporter') return 'مرحلة النقل';
    if (phase === 'disposal') return 'مرحلة التخلص النهائي';
    return 'مرحلة التدوير';
  };

  const renderStatusButton = (status: StatusConfig, isAvailable: boolean) => {
    const StatusIcon = status.icon;
    const isSelected = selectedStatus === status.key;
    const isCurrent = status.key === shipment.status;

    return (
      <button
        key={status.key}
        onClick={() => isAvailable && !isCurrent && setSelectedStatus(status.key)}
        disabled={!isAvailable || isCurrent}
        className={cn(
          "w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between",
          isSelected 
            ? "border-primary bg-primary/10" 
            : isCurrent
            ? "border-muted bg-muted/50 cursor-not-allowed"
            : isAvailable
            ? "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
            : "border-muted bg-muted/30 cursor-not-allowed opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
          {isCurrent && <Badge variant="outline" className="text-xs">الحالية</Badge>}
          {!isAvailable && !isCurrent && <Lock className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "font-medium",
            isSelected && "text-primary",
            isCurrent && "text-muted-foreground"
          )}>
            {status.labelAr}
          </span>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            status.bgClass,
            status.textClass,
            status.borderClass,
            "border"
          )}>
            <StatusIcon className="w-4 h-4" />
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>تغيير حالة الشحنة</DialogTitle>
          <DialogDescription>
            شحنة رقم: <span className="font-mono font-bold">{shipment.shipment_number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="text-right">
            <Label className="text-sm text-muted-foreground">الحالة الحالية</Label>
            <div className="mt-2 flex items-center gap-2 justify-end">
              {currentStatusConfig && (
                <>
                  <Badge className={cn(currentStatusConfig.bgClass, currentStatusConfig.textClass, currentStatusConfig.borderClass, "border gap-1")}>
                    <currentStatusConfig.icon className="w-3 h-3" />
                    {currentStatusConfig.labelAr}
                  </Badge>
                  <Badge variant="outline">{getPhaseLabel(currentStatusConfig.phase)}</Badge>
                </>
              )}
            </div>
          </div>

          {/* Organization Type Info */}
          <div className="p-3 bg-muted/50 rounded-lg text-right">
            <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <span>
                أنت تعمل كـ <strong>{organizationType === 'transporter' ? 'جهة نقل' : organizationType === 'recycler' ? 'جهة تدوير' : organizationType === 'disposal' ? 'جهة تخلص نهائي' : 'جهة مولدة'}</strong>
              </span>
            </div>
            {!canChange && (
              <p className="text-sm text-muted-foreground mt-2">
                {organizationType === 'generator' 
                  ? 'الجهات المولدة لا يمكنها تغيير حالات الشحنات'
                  : organizationType === 'transporter' && (currentStatusConfig?.phase === 'recycler' || currentStatusConfig?.phase === 'disposal')
                  ? 'هذه الشحنة في مرحلة الوجهة - فقط جهة الاستلام يمكنها تغيير الحالة'
                  : organizationType === 'recycler' && currentStatusConfig?.phase === 'transporter'
                  ? 'هذه الشحنة في مرحلة النقل - فقط جهة النقل يمكنها تغيير الحالة'
                  : organizationType === 'disposal' && currentStatusConfig?.phase === 'transporter'
                  ? 'هذه الشحنة في مرحلة النقل - فقط جهة النقل يمكنها تغيير الحالة'
                  : 'لا توجد حالات متاحة للتغيير'
                }
              </p>
            )}
          </div>

          {/* Available Statuses */}
          {canChange && availableStatuses.length > 0 ? (
            <div className="text-right">
              <Label className="text-sm text-muted-foreground mb-3 block">اختر الحالة الجديدة</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {availableStatuses.map((status) => renderStatusButton(status, true))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {currentStatusConfig?.key === 'completed' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <p>هذه الشحنة مكتملة ولا يمكن تغيير حالتها</p>
                </>
              ) : (
                <>
                  <Lock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p>ليس لديك صلاحية لتغيير حالة هذه الشحنة</p>
                </>
              )}
            </div>
          )}

          {/* Geofence Warning */}
          {selectedStatus && geofenceCheck.isInside === false && !geofenceCheck.checking && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-right">
              <div className="flex items-center gap-2 justify-end text-destructive font-medium text-sm">
                <span>⚠️ أنت خارج نطاق التسليم</span>
                <MapPin className="w-4 h-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {geofenceCheck.distance != null
                  ? `المسافة: ${geofenceCheck.distance} متر (الحد المسموح: ${geofenceRadius} متر)`
                  : geofenceCheck.error || 'تعذر التحقق من الموقع'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={checkGeofence}
              >
                <MapPin className="w-3 h-3 ml-1" />
                إعادة التحقق من الموقع
              </Button>
            </div>
          )}

          {geofenceCheck.checking && (
            <div className="p-3 rounded-lg border bg-muted/50 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">جاري التحقق من الموقع الجغرافي...</p>
            </div>
          )}

          {geofenceCheck.isInside === true && geofenceCheck.distance != null && (
            <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 text-right">
              <div className="flex items-center gap-2 justify-end text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                <span>✅ أنت داخل نطاق التسليم ({geofenceCheck.distance} متر)</span>
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Notes */}
          {canChange && availableStatuses.length > 0 && (
            <div className="text-right">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أضف ملاحظات حول تغيير الحالة..."
                className="mt-2"
                dir="rtl"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              إلغاء
            </Button>
            {canChange && availableStatuses.length > 0 && (
              <Button 
                variant="eco" 
                onClick={handleStatusChange}
                disabled={!selectedStatus || loading || isDeliveryBlocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    تأكيد التغيير
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeDialog;
