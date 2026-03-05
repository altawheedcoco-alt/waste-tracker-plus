import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { autoCreateReceipt } from '@/utils/autoReceiptCreator';
import { useAuth } from '@/contexts/AuthContext';
import { notifyOrganizationMembers } from '@/services/unifiedNotifier';
import { 
  fetchRichShipmentData, 
  buildRichWhatsAppMessage, 
  buildRichInAppMessage,
  getStatusButtons,
  resolveOrgType 
} from '@/services/richNotificationBuilder';
import { useImpactRecorder } from '@/hooks/useImpactRecorder';
import DeliveryDeclarationDialog from './DeliveryDeclarationDialog';
import ShipmentPhotoUpload from './ShipmentPhotoUpload';
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
  ShieldOff,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  getStatusConfig,
  getAvailableNextStatuses,
  canChangeStatus,
  allStatuses,
  StatusConfig,
  mapToDbStatus,
  ShipmentStatus,
  getOrganizationTypeLabel,
  type ShipmentOrganizationType,
} from '@/lib/shipmentStatusConfig';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import WeighbridgePhotoUpload from './WeighbridgePhotoUpload';
import { checkWeightDispute, createWeightDispute } from '@/lib/weightDisputeLogic';

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
    quantity?: number | null;
    generator_id?: string | null;
    transporter_id?: string | null;
    recycler_id?: string | null;
  };
  onStatusChanged?: () => void;
  geofenceRadius?: number;
}

const StatusChangeDialog = ({ isOpen, onClose, shipment, onStatusChanged, geofenceRadius = 200 }: StatusChangeDialogProps) => {
  const { profile, organization } = useAuth();
  const { recordShipmentStatusChange } = useImpactRecorder();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string | null>(null);
  const [pickupPhotoMeta, setPickupPhotoMeta] = useState<any>(null);
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState<string | null>(null);
  const [deliveryPhotoMeta, setDeliveryPhotoMeta] = useState<any>(null);
  const [receivingPhotoUrl, setReceivingPhotoUrl] = useState<string | null>(null);
  const [receivingPhotoMeta, setReceivingPhotoMeta] = useState<any>(null);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const [recyclerWeight, setRecyclerWeight] = useState('');
  const [manualOverride, setManualOverride] = useState(false);
  const [statusPhotos, setStatusPhotos] = useState<string[]>([]);
  const [geofenceCheck, setGeofenceCheck] = useState<{
    checking: boolean;
    isInside: boolean | null;
    distance: number | null;
    error: string | null;
  }>({ checking: false, isInside: null, distance: null, error: null });

  const organizationType = (organization?.organization_type || 'generator') as ShipmentOrganizationType;

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

  // Determine if photo is required for current status change
  const requiresPhoto = (() => {
    if (!selectedStatus) return { pickup: false, delivery: false, receiving: false };
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    const isTransporter = organizationType === 'transporter';
    const isRecycler = organizationType === 'recycler';
    const isDisposal = organizationType === 'disposal';

    return {
      // Transporter: pickup weighbridge when starting transit
      pickup: isTransporter && dbStatus === 'in_transit',
      // Transporter: delivery weighbridge when delivering
      delivery: isTransporter && ['delivered', 'confirmed'].includes(dbStatus),
      // Recycler/Disposal: receiving weighbridge when confirming receipt
      receiving: (isRecycler || isDisposal) && ['delivered', 'confirmed'].includes(dbStatus),
    };
  })();

  // Photos are optional - no blocking

  const isDeliveryBlocked = (() => {
    if (!selectedStatus) return false;
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    const isDeliveryStatus = ['delivered', 'confirmed'].includes(dbStatus);
    const isTransporter = organizationType === 'transporter';
    if (!isDeliveryStatus || !isTransporter || !hasDeliveryCoords) return false;
    return geofenceCheck.checking || geofenceCheck.isInside === false;
  })();

  // Show recycler weight input for recycler confirming delivery
  const showRecyclerWeightInput = (() => {
    if (!selectedStatus) return false;
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    return organizationType === 'recycler' && dbStatus === 'confirmed';
  })();

  const currentStatusConfig = getStatusConfig(shipment.status);
  const availableStatuses = manualOverride 
    ? allStatuses.filter(s => s.key !== shipment.status) 
    : getAvailableNextStatuses(shipment.status, organizationType);
  const canChange = manualOverride || canChangeStatus(shipment.status, organizationType);

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error('يرجى اختيار الحالة الجديدة');
      return;
    }

    if (!manualOverride && isDeliveryBlocked) {
      toast.error('يجب أن تكون داخل نطاق موقع التسليم لتأكيد التسليم');
      return;
    }

    // Photos are optional - no blocking check

    // Show delivery declaration for transporter when delivering (skip in manual mode)
    const dbStatusCheck = mapToDbStatus(selectedStatus as ShipmentStatus);
    if (!manualOverride && organizationType === 'transporter' && ['delivered', 'confirmed'].includes(dbStatusCheck)) {
      setShowDeclaration(true);
      return;
    }

    await executeStatusChange();
  };

  const executeStatusChange = async () => {
    if (!selectedStatus) return;

    setLoading(true);
    try {
      const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
      console.log('Updating shipment status:', { selectedStatus, dbStatus, shipmentId: shipment.id });
      
      const updateData: Record<string, any> = {
        status: dbStatus,
      };

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

      // Add photo URLs and metadata
      if (pickupPhotoUrl) {
        updateData.pickup_weighbridge_photo_url = pickupPhotoUrl;
        updateData.pickup_weighbridge_metadata = pickupPhotoMeta;
      }
      if (deliveryPhotoUrl) {
        updateData.delivery_weighbridge_photo_url = deliveryPhotoUrl;
        updateData.delivery_weighbridge_metadata = deliveryPhotoMeta;
      }
      if (receivingPhotoUrl) {
        updateData.delivery_weighbridge_photo_url = receivingPhotoUrl;
        updateData.delivery_weighbridge_metadata = receivingPhotoMeta;
      }

      // Status photos will be saved in shipment_logs below

      // Check weight dispute when recycler confirms with weight
      if (showRecyclerWeightInput && recyclerWeight && shipment.quantity) {
        const recyclerW = parseFloat(recyclerWeight);
        const generatorW = shipment.quantity;
        const disputeResult = checkWeightDispute(generatorW, recyclerW);

        if (disputeResult.hasDispute) {
          // Auto-hold: don't change status, create dispute
          try {
            await createWeightDispute(
              shipment.id,
              organization?.id || '',
              generatorW,
              recyclerW,
              disputeResult.differencePercentage
            );
          } catch (err) {
            console.error('Dispute creation error:', err);
          }
          toast.warning(
            `⚠️ تم تعليق الشحنة تلقائياً! فرق الوزن ${disputeResult.differencePercentage}% (المولد: ${generatorW} كجم، المدور: ${recyclerW} كجم). تم إبلاغ الإدارة للمراجعة.`,
            { duration: 8000 }
          );
          onStatusChanged?.();
          handleClose();
          setLoading(false);
          return;
        }

        updateData.recycler_received_weight = recyclerW;
        updateData.generator_declared_weight = generatorW;
      }

      const { error: updateError } = await supabase
        .from('shipments')
        .update(updateData as any)
        .eq('id', shipment.id);

      if (updateError) throw updateError;

      const statusConfig = getStatusConfig(selectedStatus);
      const logEntry: any = {
        shipment_id: shipment.id,
        status: dbStatus as any,
        notes: notes || `تم تغيير الحالة إلى ${statusConfig?.labelAr || selectedStatus}`,
        changed_by: profile?.id,
      };
      if (statusPhotos.length > 0) {
        logEntry.photos = statusPhotos;
      }
      const { error: logError } = await supabase
        .from('shipment_logs')
        .insert([logEntry]);

      if (logError) {
        console.error('Error logging status change:', logError);
      }

      // Auto-create declarations and receipts based on status
      try {
        const { autoCreateGeneratorDeclaration, autoCreateRecyclerDeclaration } = await import('@/utils/autoDeclarationCreator');
        
        // Generator declaration when shipment is approved/registered
        if (['approved', 'registered'].includes(dbStatus) && shipment.generator_id) {
          await autoCreateGeneratorDeclaration(shipment.id, shipment.generator_id, profile?.id || '');
          console.log('Auto generator declaration created');
        }
        
        // Recycler declaration when shipment is delivered/confirmed
        if (['delivered', 'confirmed'].includes(dbStatus)) {
          // Fetch recycler_id from shipment
          const { data: fullShipment } = await supabase
            .from('shipments')
            .select('recycler_id, transporter_id')
            .eq('id', shipment.id)
            .single();
          
          if (fullShipment?.recycler_id) {
            await autoCreateRecyclerDeclaration(shipment.id, fullShipment.recycler_id, profile?.id || '');
            console.log('Auto recycler declaration created');
          }
          
          // Auto-create receipt for transporter
          if (organization?.organization_type === 'transporter') {
            await autoCreateReceipt(shipment.id, organization.id, profile?.id);
            console.log('Auto receipt created');
          }
        }
        
        // Also create receipt when in_transit (transporter picking up)
        if (dbStatus === 'in_transit' && organization?.organization_type === 'transporter') {
          await autoCreateReceipt(shipment.id, organization.id, profile?.id);
          console.log('Auto receipt created on in_transit');
        }
      } catch (autoError) {
        console.error('Auto document creation failed (non-blocking):', autoError);
      }

      // Record impact chain event
      recordShipmentStatusChange(shipment.id, dbStatus, {
        shipmentNumber: shipment.shipment_number,
        previousStatus: shipment.status,
      });

      // === Rich Dual Notification: إشعار داخلي + واتساب بالبيانات الكاملة ===
      try {
        const statusLabel = statusConfig?.labelAr || selectedStatus;
        const orgIds = [
          shipment.generator_id,
          shipment.transporter_id,
          shipment.recycler_id,
        ].filter(Boolean) as string[];

        // Fetch rich shipment data for WhatsApp
        const richData = await fetchRichShipmentData(shipment.id, statusLabel, dbStatus);
        const whatsappText = richData ? buildRichWhatsAppMessage(richData) : `📦 تحديث شحنة ${shipment.shipment_number}: ${statusLabel}`;
        const inAppMessage = richData ? buildRichInAppMessage(richData) : `تم تغيير حالة الشحنة إلى "${statusLabel}"`;
        const notifTitle = `📦 تحديث شحنة ${shipment.shipment_number || ''}`;

        // Send to all relevant organizations with rich data + buttons
        await Promise.allSettled(
          orgIds.map(async (orgId) => {
            const orgType = resolveOrgType(orgId, shipment.generator_id, shipment.transporter_id, shipment.recycler_id);
            const buttons = getStatusButtons(dbStatus, shipment.id, orgType);

            // 1. In-app notification
            const { data: members } = await supabase
              .from('profiles')
              .select('id')
              .eq('organization_id', orgId);

            const memberIds = (members || [])
              .map((m: any) => m.id)
              .filter((id: string) => !profile?.id || id !== profile.id);

            if (memberIds.length > 0) {
              await supabase.from('notifications').insert(
                memberIds.map((uid: string) => ({
                  user_id: uid,
                  title: notifTitle,
                  message: inAppMessage,
                  type: 'shipment_status',
                  is_read: false,
                  reference_id: shipment.id,
                  reference_type: 'shipment',
                }))
              );
            }

            // 2. WhatsApp with rich data + buttons
            await supabase.functions.invoke('whatsapp-send', {
              body: {
                action: 'broadcast_to_users',
                user_ids: memberIds,
                message_text: whatsappText,
                organization_id: orgId,
                notification_type: 'shipment_status',
                interactive_buttons: buttons,
                metadata: {
                  shipment_id: shipment.id,
                  shipment_number: shipment.shipment_number,
                  new_status: dbStatus,
                  direct_link: richData?.direct_link,
                },
              },
            });
          })
        );
        console.log('[DualNotify] Rich notifications sent to', orgIds.length, 'orgs');
      } catch (notifErr) {
        console.warn('[DualNotify] Non-blocking notification error:', notifErr);
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
    setPickupPhotoUrl(null);
    setPickupPhotoMeta(null);
    setDeliveryPhotoUrl(null);
    setDeliveryPhotoMeta(null);
    setReceivingPhotoUrl(null);
    setReceivingPhotoMeta(null);
    setRecyclerWeight('');
    setStatusPhotos([]);
    setShowDeclaration(false);
    onClose();
  };

  const handleDeclarationConfirmed = () => {
    setShowDeclaration(false);
    executeStatusChange();
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
    <>
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
                أنت تعمل كـ <strong>{getOrganizationTypeLabel(organizationType)}</strong>
              </span>
            </div>
            {!canChange && (
              <p className="text-sm text-muted-foreground mt-2">
                {organizationType === 'generator' 
                  ? 'الشحنة تجاوزت مرحلة التسليم - لا يمكن للجهة المولدة تغيير الحالة الآن'
                  : organizationType === 'transporter' && (currentStatusConfig?.phase === 'recycler' || currentStatusConfig?.phase === 'disposal')
                  ? 'هذه الشحنة في مرحلة الوجهة - فقط جهة الاستلام يمكنها تغيير الحالة'
                  : organizationType === 'recycler' && currentStatusConfig?.phase === 'transporter'
                  ? 'هذه الشحنة في مرحلة النقل - فقط جهة النقل يمكنها تغيير الحالة'
                  : organizationType === 'disposal' && currentStatusConfig?.phase === 'transporter'
                  ? 'هذه الشحنة في مرحلة النقل - فقط جهة النقل يمكنها تغيير الحالة'
                  : 'لا توجد حالات متاحة للتغيير حالياً'
                }
              </p>
            )}
          </div>

          {/* Manual Override Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20">
            <Switch
              checked={manualOverride}
              onCheckedChange={(checked) => {
                setManualOverride(checked);
                setSelectedStatus(null);
              }}
            />
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-medium">تغيير يدوي بدون ضوابط</p>
                <p className="text-xs text-muted-foreground">تجاوز جميع القيود والضوابط</p>
              </div>
              <ShieldOff className="w-5 h-5 text-orange-500" />
            </div>
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

          {/* Weighbridge Photo Upload - Pickup (اختياري) */}
          {requiresPhoto.pickup && (
            <WeighbridgePhotoUpload
              shipmentId={shipment.id}
              type="pickup"
              label="صورة إيصال ميزان الاستلام (اختياري)"
              onPhotoUploaded={(url, meta) => { setPickupPhotoUrl(url); setPickupPhotoMeta(meta); }}
            />
          )}

          {/* Weighbridge Photo Upload - Delivery (اختياري) */}
          {requiresPhoto.delivery && (
            <WeighbridgePhotoUpload
              shipmentId={shipment.id}
              type="delivery"
              label="صورة إيصال ميزان التسليم (اختياري)"
              onPhotoUploaded={(url, meta) => { setDeliveryPhotoUrl(url); setDeliveryPhotoMeta(meta); }}
            />
          )}

          {/* Weighbridge Photo Upload - Receiving (اختياري) */}
          {requiresPhoto.receiving && (
            <WeighbridgePhotoUpload
              shipmentId={shipment.id}
              type="delivery"
              label={organizationType === 'disposal' ? 'صورة إيصال ميزان الاستلام - التخلص النهائي (اختياري)' : 'صورة إيصال ميزان الاستلام - المدوّر (اختياري)'}
              onPhotoUploaded={(url, meta) => { setReceivingPhotoUrl(url); setReceivingPhotoMeta(meta); }}
            />
          )}

          {showRecyclerWeightInput && (
            <div className="text-right space-y-2">
              <Label htmlFor="recyclerWeight">
                الوزن المستلم (كجم) - اختياري
              </Label>
              <input
                id="recyclerWeight"
                type="number"
                step="0.01"
                min="0"
                value={recyclerWeight}
                onChange={(e) => setRecyclerWeight(e.target.value)}
                placeholder="أدخل الوزن الفعلي المستلم..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                dir="ltr"
              />
              {shipment.quantity && (
                <p className="text-xs text-muted-foreground">
                  الوزن المعلن من المولد: <strong>{shipment.quantity} كجم</strong>
                  {recyclerWeight && (
                    <span className={cn(
                      'mr-2',
                      Math.abs(((parseFloat(recyclerWeight) - shipment.quantity) / shipment.quantity) * 100) > 5
                        ? 'text-destructive font-bold'
                        : 'text-emerald-600'
                    )}>
                      (فرق: {Math.abs(((parseFloat(recyclerWeight) - shipment.quantity) / shipment.quantity) * 100).toFixed(1)}%)
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Shipment Photos */}
          {canChange && availableStatuses.length > 0 && (
            <ShipmentPhotoUpload
              shipmentId={shipment.id}
              maxPhotos={5}
              onPhotosChanged={setStatusPhotos}
            />
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
                disabled={!selectedStatus || loading || (!manualOverride && isDeliveryBlocked)}
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

    <DeliveryDeclarationDialog
      open={showDeclaration}
      onOpenChange={setShowDeclaration}
      shipment={{
        id: shipment.id,
        shipment_number: shipment.shipment_number,
        waste_type: '',
        quantity: shipment.quantity || 0,
      }}
      onConfirmed={handleDeclarationConfirmed}
    />
  </>
  );
};

export default StatusChangeDialog;
