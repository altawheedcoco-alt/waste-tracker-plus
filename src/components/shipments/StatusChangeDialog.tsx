import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import { Card } from '@/components/ui/card';
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

interface StatusChangeShipment {
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
}

interface StatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: StatusChangeShipment;
  onStatusChanged?: () => void;
  geofenceRadius?: number;
}

// Inline version props
interface InlineStatusChangeProps {
  shipment: StatusChangeShipment;
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

  const organizationType = (organization?.organization_type || 'generator') as 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin' | 'driver';

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
  const rolePhases: Record<string, string[]> = {
    generator: ['transporter'],
    transporter: ['transporter'],
    recycler: ['recycler'],
    disposal: ['disposal'],
    admin: ['transporter', 'recycler', 'disposal'],
  };
  const allowedPhases = rolePhases[organizationType] || rolePhases.admin;
  const availableStatuses = manualOverride 
    ? allStatuses.filter(s => s.key !== shipment.status && allowedPhases.includes(s.phase)) 
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

      // Auto-create declarations and receipts based on status (all parties)
      try {
        const { autoCreateGeneratorDeclaration, autoCreateRecyclerDeclaration, autoCreateTransporterDeclaration, autoCreateDisposalReceptionDeclaration, autoCreateDisposalCertificate, autoCreateRecyclingCertificate, autoCreateDriverConfirmation, autoCreateTransporterDeliveryDeclaration, autoCreateDriverDeliveryDeclaration } = await import('@/utils/autoDeclarationCreator');
        
        // Generator declaration when shipment is approved/registered
        if (['approved', 'registered'].includes(dbStatus) && shipment.generator_id) {
          await autoCreateGeneratorDeclaration(shipment.id, shipment.generator_id, profile?.id || '');
        }
        
        // Driver confirmation when picked_up/loading
        if (['picked_up', 'loading'].includes(dbStatus) && organization?.organization_type === 'transporter') {
          await autoCreateDriverConfirmation(shipment.id, organization.id, profile?.id || '', profile?.full_name);
        }

        // Transporter transport declaration when in_transit
        if (dbStatus === 'in_transit' && organization?.organization_type === 'transporter') {
          await autoCreateTransporterDeclaration(shipment.id, organization.id, profile?.id || '');
          await autoCreateReceipt(shipment.id, organization.id, profile?.id);
        }

        // Transporter & Driver delivery declarations when delivered
        if (['delivered', 'confirmed'].includes(dbStatus) && organization?.organization_type === 'transporter') {
          await autoCreateTransporterDeliveryDeclaration(shipment.id, organization.id, profile?.id || '');
          await autoCreateDriverDeliveryDeclaration(shipment.id, organization.id, profile?.id || '', profile?.full_name);
        }
        
        // Recycler declaration when shipment is delivered/confirmed
        if (['delivered', 'confirmed'].includes(dbStatus)) {
          const { data: fullShipment } = await supabase
            .from('shipments')
            .select('recycler_id, transporter_id')
            .eq('id', shipment.id)
            .single();
          
          if (fullShipment?.recycler_id) {
            await autoCreateRecyclerDeclaration(shipment.id, fullShipment.recycler_id, profile?.id || '');
          }
          
          if (organization?.organization_type === 'transporter') {
            await autoCreateReceipt(shipment.id, organization.id, profile?.id);
          }
        }

        // Disposal: reception declaration when delivered to disposal
        if (['delivered', 'confirmed'].includes(dbStatus)) {
          if ((organization?.organization_type as string) === 'disposal') {
            await autoCreateDisposalReceptionDeclaration(shipment.id, organization.id, profile?.id || '');
          }
        }

        // Disposal certificate when disposal stages
        if (['disposal_treatment', 'disposal_final', 'disposal_completed'].includes(dbStatus)) {
          if ((organization?.organization_type as string) === 'disposal') {
            await autoCreateDisposalCertificate(shipment.id, organization.id, profile?.id || '');
          }
        }

        // Recycling certificate when recycling complete
        if (['recycling_complete', 'processing_complete', 'completed'].includes(dbStatus)) {
          const { data: fs2 } = await supabase.from('shipments').select('recycler_id').eq('id', shipment.id).single();
          if (fs2?.recycler_id) {
            await autoCreateRecyclingCertificate(shipment.id, fs2.recycler_id, profile?.id || '');
          }
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
          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all min-w-[72px] flex-1",
          isSelected 
            ? "bg-primary/15 ring-2 ring-primary shadow-sm" 
            : isCurrent
            ? "bg-muted/60 cursor-not-allowed"
            : isAvailable
            ? "hover:bg-muted/50 cursor-pointer"
            : "opacity-40 cursor-not-allowed"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
          isSelected
            ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md"
            : isCurrent
            ? cn(status.bgClass, status.textClass, status.borderClass)
            : isAvailable
            ? cn("border-border bg-background", status.textClass)
            : "border-muted bg-muted text-muted-foreground"
        )}>
          {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <StatusIcon className="w-4 h-4" />}
        </div>
        <span className={cn(
          "text-xs font-semibold text-center leading-tight",
          isSelected ? "text-primary" : "",
          isCurrent && "text-muted-foreground",
          !isSelected && !isCurrent && isAvailable && "text-foreground",
          !isAvailable && !isCurrent && "text-muted-foreground"
        )}>
          {status.labelAr}
        </span>
        {isCurrent && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">الحالية</span>
        )}
      </button>
    );
  };

  const statusContent = (
    <div className="space-y-4" dir="rtl">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStatusConfig && (
            <>
              <Badge className={cn(currentStatusConfig.bgClass, currentStatusConfig.textClass, currentStatusConfig.borderClass, "border gap-1")}>
                <currentStatusConfig.icon className="w-3 h-3" />
                {currentStatusConfig.labelAr}
              </Badge>
              <Badge variant="outline" className="text-xs">{getPhaseLabel(currentStatusConfig.phase)}</Badge>
            </>
          )}
        </div>
        {/* Manual Override */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">تجاوز</span>
          <Switch
            checked={manualOverride}
            onCheckedChange={(checked) => { setManualOverride(checked); setSelectedStatus(null); }}
          />
        </div>
      </div>

      {/* Available Statuses - Horizontal */}
      {canChange && availableStatuses.length > 0 ? (
        <div className="flex items-start gap-1 overflow-x-auto pb-2">
          {availableStatuses.map((status, i) => (
            <div key={status.key} className="flex items-center">
              {renderStatusButton(status, true)}
              {i < availableStatuses.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      ) : !canChange ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          {currentStatusConfig?.key === 'completed' ? 'الشحنة مكتملة' : 'لا توجد حالات متاحة'}
        </p>
      ) : null}

      {/* Geofence Warnings */}
      {selectedStatus && geofenceCheck.isInside === false && !geofenceCheck.checking && (
        <div className="p-2 rounded-lg border border-destructive/30 bg-destructive/5 text-right text-xs">
          <span className="text-destructive font-medium">⚠️ خارج نطاق التسليم</span>
          {geofenceCheck.distance != null && <span className="text-muted-foreground mr-1">({geofenceCheck.distance}م)</span>}
          <Button variant="ghost" size="sm" className="h-6 text-xs mr-2" onClick={checkGeofence}>
            <MapPin className="w-3 h-3 ml-1" />إعادة التحقق
          </Button>
        </div>
      )}
      {geofenceCheck.checking && (
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground py-1">
          <Loader2 className="w-3 h-3 animate-spin" />جاري التحقق...
        </div>
      )}
      {geofenceCheck.isInside === true && geofenceCheck.distance != null && (
        <p className="text-xs text-primary text-center">✅ داخل النطاق ({geofenceCheck.distance}م)</p>
      )}

      {/* Weighbridge Photos */}
      {requiresPhoto.pickup && (
        <WeighbridgePhotoUpload shipmentId={shipment.id} type="pickup" label="صورة ميزان الاستلام (اختياري)"
          onPhotoUploaded={(url, meta) => { setPickupPhotoUrl(url); setPickupPhotoMeta(meta); }} />
      )}
      {requiresPhoto.delivery && (
        <WeighbridgePhotoUpload shipmentId={shipment.id} type="delivery" label="صورة ميزان التسليم (اختياري)"
          onPhotoUploaded={(url, meta) => { setDeliveryPhotoUrl(url); setDeliveryPhotoMeta(meta); }} />
      )}
      {requiresPhoto.receiving && (
        <WeighbridgePhotoUpload shipmentId={shipment.id} type="delivery"
          label={organizationType === 'disposal' ? 'صورة ميزان التخلص (اختياري)' : 'صورة ميزان المدوّر (اختياري)'}
          onPhotoUploaded={(url, meta) => { setReceivingPhotoUrl(url); setReceivingPhotoMeta(meta); }} />
      )}

      {/* Recycler Weight */}
      {showRecyclerWeightInput && (
        <div className="text-right space-y-1">
          <Label htmlFor="recyclerWeight" className="text-xs">الوزن المستلم (كجم)</Label>
          <input id="recyclerWeight" type="number" step="0.01" min="0" value={recyclerWeight}
            onChange={(e) => setRecyclerWeight(e.target.value)} placeholder="الوزن الفعلي..."
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" dir="ltr" />
          {shipment.quantity && recyclerWeight && (
            <p className="text-[11px] text-muted-foreground">
              فرق: <span className={cn(
                Math.abs(((parseFloat(recyclerWeight) - shipment.quantity) / shipment.quantity) * 100) > 5
                  ? 'text-destructive font-bold' : 'text-primary'
              )}>{Math.abs(((parseFloat(recyclerWeight) - shipment.quantity) / shipment.quantity) * 100).toFixed(1)}%</span>
            </p>
          )}
        </div>
      )}

      {/* Photos & Notes */}
      {canChange && availableStatuses.length > 0 && (
        <ShipmentPhotoUpload shipmentId={shipment.id} maxPhotos={5} onPhotosChanged={setStatusPhotos} />
      )}
      {canChange && availableStatuses.length > 0 && (
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات (اختياري)..." className="text-sm" dir="rtl" rows={2} />
      )}

      {/* Confirm Button */}
      {canChange && availableStatuses.length > 0 && (
        <Button variant="eco" className="w-full" onClick={handleStatusChange}
          disabled={!selectedStatus || loading || (!manualOverride && isDeliveryBlocked)}>
          {loading ? (
            <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التحديث...</>
          ) : (
            <><ArrowRight className="ml-2 h-4 w-4" />تأكيد التغيير</>
          )}
        </Button>
      )}
    </div>
  );

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
        {statusContent}
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

/**
 * Inline status change component — renders directly in the page without a dialog
 */
export const InlineStatusChange = ({ shipment, onStatusChanged, geofenceRadius = 200 }: InlineStatusChangeProps) => {
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
  const [expanded, setExpanded] = useState(false);
  const [geofenceCheck, setGeofenceCheck] = useState<{
    checking: boolean; isInside: boolean | null; distance: number | null; error: string | null;
  }>({ checking: false, isInside: null, distance: null, error: null });

  const organizationType = (organization?.organization_type || 'generator') as ShipmentOrganizationType;
  const deliveryLat = shipment.gps_delivery_lat ?? shipment.delivery_latitude;
  const deliveryLng = shipment.gps_delivery_lng ?? shipment.delivery_longitude;
  const hasDeliveryCoords = deliveryLat != null && deliveryLng != null;

  const checkGeofence = useCallback(async () => {
    if (!hasDeliveryCoords) { setGeofenceCheck({ checking: false, isInside: true, distance: null, error: null }); return; }
    setGeofenceCheck(prev => ({ ...prev, checking: true, error: null }));
    if (!navigator.geolocation) { setGeofenceCheck({ checking: false, isInside: false, distance: null, error: 'غير متاح' }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = calculateHaversineDistance(pos.coords.latitude, pos.coords.longitude, deliveryLat!, deliveryLng!) * 1000;
        setGeofenceCheck({ checking: false, isInside: d <= geofenceRadius, distance: Math.round(d), error: null });
      },
      (err) => { setGeofenceCheck({ checking: false, isInside: false, distance: null, error: err.message }); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [hasDeliveryCoords, deliveryLat, deliveryLng, geofenceRadius]);

  useEffect(() => {
    const isDeliveryStatus = selectedStatus && ['delivered', 'confirmed'].includes(mapToDbStatus(selectedStatus as ShipmentStatus));
    if (isDeliveryStatus && organizationType === 'transporter' && hasDeliveryCoords) checkGeofence();
    else setGeofenceCheck({ checking: false, isInside: null, distance: null, error: null });
  }, [selectedStatus, organizationType, hasDeliveryCoords, checkGeofence]);

  const requiresPhoto = (() => {
    if (!selectedStatus) return { pickup: false, delivery: false, receiving: false };
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    const isT = organizationType === 'transporter';
    const isR = organizationType === 'recycler';
    const isD = organizationType === 'disposal';
    return {
      pickup: isT && dbStatus === 'in_transit',
      delivery: isT && ['delivered', 'confirmed'].includes(dbStatus),
      receiving: (isR || isD) && ['delivered', 'confirmed'].includes(dbStatus),
    };
  })();

  const isDeliveryBlocked = (() => {
    if (!selectedStatus) return false;
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    if (!['delivered', 'confirmed'].includes(dbStatus) || organizationType !== 'transporter' || !hasDeliveryCoords) return false;
    return geofenceCheck.checking || geofenceCheck.isInside === false;
  })();

  const showRecyclerWeightInput = (() => {
    if (!selectedStatus) return false;
    return organizationType === 'recycler' && mapToDbStatus(selectedStatus as ShipmentStatus) === 'confirmed';
  })();

  const currentStatusConfig = getStatusConfig(shipment.status);
  const rolePhases: Record<string, string[]> = {
    generator: ['transporter'], transporter: ['transporter'],
    recycler: ['recycler'], disposal: ['disposal'],
    admin: ['transporter', 'recycler', 'disposal'],
  };
  const allowedPhases = rolePhases[organizationType] || rolePhases.admin;
  const availableStatuses = manualOverride
    ? allStatuses.filter(s => s.key !== shipment.status && allowedPhases.includes(s.phase))
    : getAvailableNextStatuses(shipment.status, organizationType);
  const canChange = manualOverride || canChangeStatus(shipment.status, organizationType);

  // Reuse same handleStatusChange logic
  const handleStatusChange = async () => {
    if (!selectedStatus) { toast.error('اختر الحالة الجديدة'); return; }
    if (!manualOverride && isDeliveryBlocked) { toast.error('يجب أن تكون داخل نطاق التسليم'); return; }

    const statusConfig = getStatusConfig(selectedStatus);
    if (!statusConfig) return;
    const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
    const isDeliveryStatus = ['in_transit', 'delivered'].includes(dbStatus);
    if (isDeliveryStatus && !showDeclaration && organizationType === 'transporter') {
      setShowDeclaration(true);
      return;
    }
    await executeStatusChange();
  };

  const executeStatusChange = async () => {
    if (!selectedStatus) return;
    setLoading(true);
    try {
      const statusConfig = getStatusConfig(selectedStatus);
      const dbStatus = mapToDbStatus(selectedStatus as ShipmentStatus);
      const statusLabel = statusConfig?.labelAr || selectedStatus;

      const updateData: Record<string, any> = { status: dbStatus };
      const now = new Date().toISOString();
      const tsFields: Record<string, string> = { approved: 'approved_at', in_transit: 'in_transit_at', delivered: 'delivered_at', confirmed: 'confirmed_at' };
      if (tsFields[dbStatus]) updateData[tsFields[dbStatus]] = now;
      if (pickupPhotoUrl) { updateData.pickup_weighbridge_photo_url = pickupPhotoUrl; updateData.pickup_weighbridge_metadata = pickupPhotoMeta; }
      if (deliveryPhotoUrl) { updateData.delivery_weighbridge_photo_url = deliveryPhotoUrl; updateData.delivery_weighbridge_metadata = deliveryPhotoMeta; }
      if (receivingPhotoUrl) { updateData.delivery_weighbridge_photo_url = receivingPhotoUrl; updateData.delivery_weighbridge_metadata = receivingPhotoMeta; }

      if (showRecyclerWeightInput && recyclerWeight && shipment.quantity) {
        const rw = parseFloat(recyclerWeight);
        const gw = shipment.quantity;
        const dispute = checkWeightDispute(gw, rw);
        if (dispute.hasDispute) {
          try { await createWeightDispute(shipment.id, organization?.id || '', gw, rw, dispute.differencePercentage); } catch {}
          toast.warning(`⚠️ فرق الوزن ${dispute.differencePercentage}%`, { duration: 8000 });
          onStatusChanged?.();
          setSelectedStatus(null); setExpanded(false); setLoading(false);
          return;
        }
        updateData.recycler_received_weight = rw;
        updateData.generator_declared_weight = gw;
      }

      const { error: updateError } = await supabase.from('shipments').update(updateData as any).eq('id', shipment.id);
      if (updateError) throw updateError;

      const logEntry: any = { shipment_id: shipment.id, status: dbStatus as any, notes: notes || `تم تغيير الحالة إلى ${statusLabel}`, changed_by: profile?.id };
      if (statusPhotos.length > 0) logEntry.photos = statusPhotos;
      await supabase.from('shipment_logs').insert([logEntry]);

      // Auto documents (all parties)
      try {
        const { autoCreateGeneratorDeclaration, autoCreateRecyclerDeclaration, autoCreateTransporterDeclaration, autoCreateDisposalReceptionDeclaration, autoCreateDisposalCertificate, autoCreateRecyclingCertificate, autoCreateDriverConfirmation, autoCreateTransporterDeliveryDeclaration, autoCreateDriverDeliveryDeclaration } = await import('@/utils/autoDeclarationCreator');
        if (['approved', 'registered'].includes(dbStatus) && shipment.generator_id) await autoCreateGeneratorDeclaration(shipment.id, shipment.generator_id, profile?.id || '');
        if (['picked_up', 'loading'].includes(dbStatus) && organization?.organization_type === 'transporter') await autoCreateDriverConfirmation(shipment.id, organization.id, profile?.id || '', profile?.full_name);
        if (dbStatus === 'in_transit' && organization?.organization_type === 'transporter') {
          await autoCreateTransporterDeclaration(shipment.id, organization.id, profile?.id || '');
          await autoCreateReceipt(shipment.id, organization.id, profile?.id);
        }
        if (['delivered', 'confirmed'].includes(dbStatus) && organization?.organization_type === 'transporter') {
          await autoCreateTransporterDeliveryDeclaration(shipment.id, organization.id, profile?.id || '');
          await autoCreateDriverDeliveryDeclaration(shipment.id, organization.id, profile?.id || '', profile?.full_name);
        }
        if (['delivered', 'confirmed'].includes(dbStatus)) {
          const { data: fs } = await supabase.from('shipments').select('recycler_id, transporter_id').eq('id', shipment.id).single();
          if (fs?.recycler_id) await autoCreateRecyclerDeclaration(shipment.id, fs.recycler_id, profile?.id || '');
          if (organization?.organization_type === 'transporter') await autoCreateReceipt(shipment.id, organization.id, profile?.id);
          if ((organization?.organization_type as string) === 'disposal') await autoCreateDisposalReceptionDeclaration(shipment.id, organization.id, profile?.id || '');
        }
        if (['disposal_treatment', 'disposal_final', 'disposal_completed'].includes(dbStatus) && (organization?.organization_type as string) === 'disposal') {
          await autoCreateDisposalCertificate(shipment.id, organization.id, profile?.id || '');
        }
        if (['recycling_complete', 'processing_complete', 'completed'].includes(dbStatus)) {
          const { data: fs2 } = await supabase.from('shipments').select('recycler_id').eq('id', shipment.id).single();
          if (fs2?.recycler_id) await autoCreateRecyclingCertificate(shipment.id, fs2.recycler_id, profile?.id || '');
        }
      } catch {}

      // Impact
      recordShipmentStatusChange(shipment.id, dbStatus, { shipmentNumber: shipment.shipment_number, previousStatus: shipment.status });

      // Notifications
      try {
        const orgIds = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id].filter(Boolean) as string[];
        const richData = await fetchRichShipmentData(shipment.id, statusLabel, dbStatus);
        const whatsappText = richData ? buildRichWhatsAppMessage(richData) : `📦 تحديث شحنة ${shipment.shipment_number}: ${statusLabel}`;
        const inAppMessage = richData ? buildRichInAppMessage(richData) : `تم تغيير حالة الشحنة إلى "${statusLabel}"`;
        const notifTitle = `📦 تحديث شحنة ${shipment.shipment_number || ''}`;
        await Promise.allSettled(orgIds.map(async (orgId) => {
          const orgType = resolveOrgType(orgId, shipment.generator_id, shipment.transporter_id, shipment.recycler_id);
          const buttons = getStatusButtons(dbStatus, shipment.id, orgType);
          const { data: members } = await supabase.from('profiles').select('id').eq('organization_id', orgId);
          const memberIds = (members || []).map((m: any) => m.id).filter((id: string) => !profile?.id || id !== profile.id);
          if (memberIds.length > 0) {
            await supabase.from('notifications').insert(memberIds.map((uid: string) => ({ user_id: uid, title: notifTitle, message: inAppMessage, type: 'shipment_status', is_read: false, reference_id: shipment.id, reference_type: 'shipment' })));
            await supabase.functions.invoke('whatsapp-send', { body: { action: 'broadcast_to_users', user_ids: memberIds, message_text: whatsappText, organization_id: orgId, notification_type: 'shipment_status', interactive_buttons: buttons, metadata: { shipment_id: shipment.id, shipment_number: shipment.shipment_number, new_status: dbStatus, direct_link: richData?.direct_link } } });
          }
        }));
      } catch {}

      toast.success(`تم تحديث الحالة إلى "${statusLabel}"`);
      setSelectedStatus(null); setNotes(''); setExpanded(false);
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(err.message || 'فشل في تحديث الحالة');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclarationConfirmed = () => { setShowDeclaration(false); executeStatusChange(); };

  if (!canChange || availableStatuses.length === 0) return null;

  const renderStatusBtn = (status: StatusConfig) => {
    const StatusIcon = status.icon;
    const isSelected = selectedStatus === status.key;
    return (
      <button key={status.key} onClick={() => { setSelectedStatus(status.key); setExpanded(true); }}
        className={cn(
          "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all min-w-[72px] flex-1",
          isSelected ? "bg-primary/15 ring-2 ring-primary shadow-sm" : "hover:bg-muted/50 cursor-pointer"
        )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
          isSelected ? "border-primary bg-primary text-primary-foreground scale-110 shadow-md"
            : cn("border-border bg-background", status.textClass)
        )}>
          {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <StatusIcon className="w-4 h-4" />}
        </div>
        <span className={cn("text-xs font-semibold text-center leading-tight",
          isSelected ? "text-primary" : "text-foreground"
        )}>{status.labelAr}</span>
      </button>
    );
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-3 space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">تجاوز</span>
              <Switch checked={manualOverride} onCheckedChange={(c) => { setManualOverride(c); setSelectedStatus(null); }} />
            </div>
            <p className="text-sm font-semibold text-right">تغيير الحالة</p>
          </div>

          {/* Horizontal status buttons */}
          <div className="flex items-start gap-1 overflow-x-auto pb-1">
            {availableStatuses.map((s, i) => (
              <div key={s.key} className="flex items-center">
                {renderStatusBtn(s)}
                {i < availableStatuses.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0 mx-0.5" />
                )}
              </div>
            ))}
          </div>

          {/* Expanded details when status is selected */}
          {expanded && selectedStatus && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              className="space-y-3 border-t pt-3">
              {/* Geofence */}
              {geofenceCheck.isInside === false && !geofenceCheck.checking && (
                <p className="text-xs text-destructive">⚠️ خارج نطاق التسليم {geofenceCheck.distance && `(${geofenceCheck.distance}م)`}</p>
              )}
              {geofenceCheck.checking && <p className="text-xs text-muted-foreground text-center"><Loader2 className="w-3 h-3 animate-spin inline ml-1" />تحقق...</p>}
              {geofenceCheck.isInside === true && geofenceCheck.distance != null && (
                <p className="text-xs text-primary">✅ داخل النطاق ({geofenceCheck.distance}م)</p>
              )}

              {/* Photos */}
              {requiresPhoto.pickup && <WeighbridgePhotoUpload shipmentId={shipment.id} type="pickup" label="صورة ميزان الاستلام" onPhotoUploaded={(u,m) => { setPickupPhotoUrl(u); setPickupPhotoMeta(m); }} />}
              {requiresPhoto.delivery && <WeighbridgePhotoUpload shipmentId={shipment.id} type="delivery" label="صورة ميزان التسليم" onPhotoUploaded={(u,m) => { setDeliveryPhotoUrl(u); setDeliveryPhotoMeta(m); }} />}
              {requiresPhoto.receiving && <WeighbridgePhotoUpload shipmentId={shipment.id} type="delivery" label="صورة ميزان الاستقبال" onPhotoUploaded={(u,m) => { setReceivingPhotoUrl(u); setReceivingPhotoMeta(m); }} />}

              {showRecyclerWeightInput && (
                <input type="number" step="0.01" min="0" value={recyclerWeight} onChange={(e) => setRecyclerWeight(e.target.value)}
                  placeholder="الوزن المستلم (كجم)..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" dir="ltr" />
              )}

              <ShipmentPhotoUpload shipmentId={shipment.id} maxPhotos={3} onPhotosChanged={setStatusPhotos} />
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات..." rows={2} dir="rtl" className="text-sm" />

              <Button variant="eco" className="w-full" onClick={handleStatusChange}
                disabled={!selectedStatus || loading || (!manualOverride && isDeliveryBlocked)}>
                {loading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" />جاري التحديث...</> : <><ArrowRight className="ml-2 h-4 w-4" />تأكيد</>}
              </Button>
            </motion.div>
          )}
        </div>
      </Card>

      <DeliveryDeclarationDialog open={showDeclaration} onOpenChange={setShowDeclaration}
        shipment={{ id: shipment.id, shipment_number: shipment.shipment_number, waste_type: '', quantity: shipment.quantity || 0 }}
        onConfirmed={handleDeclarationConfirmed} />
    </>
  );
};

export default StatusChangeDialog;
