import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  MapPin,
  Truck,
  Package,
  Building2,
  Recycle,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Route,
  Activity,
  User,
  Phone,
} from 'lucide-react';
import { getStatusConfig, mapLegacyStatus, allStatuses } from '@/lib/shipmentStatusConfig';
import ShipmentTrackingMap from '@/components/maps/ShipmentTrackingMap';

interface DriverInfo {
  id: string;
  full_name: string;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  last_location?: {
    lat: number;
    lng: number;
    recorded_at: string;
  } | null;
  is_online: boolean;
}

interface ShipmentForTracking {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  approved_at?: string | null;
  collection_started_at?: string | null;
  in_transit_at?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  driver_id?: string | null;
  generator?: { name: string; city?: string } | null;
  transporter?: { name: string; phone?: string } | null;
  recycler?: { name: string; city?: string } | null;
}

interface UnifiedShipmentTrackerProps {
  shipment: ShipmentForTracking;
  showMap?: boolean;
  compact?: boolean;
  onStatusUpdate?: () => void;
}

const UnifiedShipmentTracker = ({
  shipment,
  showMap = true,
  compact = false,
  onStatusUpdate,
}: UnifiedShipmentTrackerProps) => {
  const { organization, roles } = useAuth();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const mappedStatus = mapLegacyStatus(shipment.status);
  const statusConfig = getStatusConfig(mappedStatus);

  // Calculate progress percentage based on status
  const calculateProgress = (): number => {
    const statusOrder = allStatuses.map(s => s.key);
    const currentIndex = statusOrder.indexOf(mappedStatus);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / statusOrder.length) * 100);
  };

  // Fetch driver information and last location
  const fetchDriverInfo = useCallback(async () => {
    if (!shipment.driver_id) {
      setDriverInfo(null);
      return;
    }

    setLoading(true);
    try {
      // Fetch driver details
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select(`
          id,
          vehicle_type,
          vehicle_plate,
          profile:profiles!drivers_profile_id_fkey(full_name, phone)
        `)
        .eq('id', shipment.driver_id)
        .maybeSingle();

      if (driverError) throw driverError;

      if (driver) {
        // Fetch last location
        const { data: locationData } = await supabase
          .from('driver_location_logs')
          .select('latitude, longitude, recorded_at')
          .eq('driver_id', shipment.driver_id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Check if driver is online (location update within last 5 minutes)
        const isOnline = locationData
          ? new Date().getTime() - new Date(locationData.recorded_at).getTime() < 5 * 60 * 1000
          : false;

        setDriverInfo({
          id: driver.id,
          full_name: (driver.profile as any)?.full_name || 'سائق',
          phone: (driver.profile as any)?.phone || null,
          vehicle_type: driver.vehicle_type,
          vehicle_plate: driver.vehicle_plate,
          last_location: locationData ? {
            lat: Number(locationData.latitude),
            lng: Number(locationData.longitude),
            recorded_at: locationData.recorded_at,
          } : null,
          is_online: isOnline,
        });

        setLastUpdate(locationData ? new Date(locationData.recorded_at) : null);
      }
    } catch (error) {
      console.error('Error fetching driver info:', error);
    } finally {
      setLoading(false);
    }
  }, [shipment.driver_id]);

  // Fetch driver info on mount and when driver changes
  useEffect(() => {
    fetchDriverInfo();
  }, [fetchDriverInfo]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!shipment.driver_id) return;

    const channel = supabase
      .channel(getTabChannelName(`shipment-tracking-${shipment.id}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${shipment.driver_id}`,
        },
        (payload) => {
          const newLog = payload.new as any;
          if (newLog) {
            setDriverInfo(prev => prev ? {
              ...prev,
              last_location: {
                lat: Number(newLog.latitude),
                lng: Number(newLog.longitude),
                recorded_at: newLog.recorded_at,
              },
              is_online: true,
            } : null);
            setLastUpdate(new Date(newLog.recorded_at));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
          filter: `id=eq.${shipment.id}`,
        },
        () => {
          onStatusUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shipment.driver_id, shipment.id, onStatusUpdate]);

  // Parse location from address (simplified for demo)
  const parseLocation = (address: string): { lat: number; lng: number } => {
    // Default to Cairo coordinates - in production, would use geocoding
    const coordMatch = address.match(/(\d+\.?\d*),\s*(\d+\.?\d*)/);
    if (coordMatch) {
      return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }
    return { lat: 30.0444, lng: 31.2357 };
  };

  const pickupLocation = parseLocation(shipment.pickup_address);
  const deliveryLocation = parseLocation(shipment.delivery_address);

  const StatusIcon = statusConfig?.icon || Package;

  return (
    <Card className={compact ? '' : 'border-2'}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              تتبع الشحنة
            </CardTitle>
            <Badge
              variant="outline"
              className={`${statusConfig?.bgClass} ${statusConfig?.textClass} ${statusConfig?.borderClass}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig?.labelAr || shipment.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {driverInfo?.is_online && (
              <Badge variant="default" className="bg-green-500 text-white animate-pulse">
                <span className="relative flex h-2 w-2 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                متصل
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={fetchDriverInfo} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>التقدم</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Parties Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Generator */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">الجهة المولدة</span>
            </div>
            <p className="font-semibold text-sm truncate">{shipment.generator?.name || 'غير محدد'}</p>
            <p className="text-xs text-muted-foreground truncate">{shipment.pickup_address}</p>
          </div>

          {/* Transporter */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">الناقل</span>
            </div>
            <p className="font-semibold text-sm truncate">{shipment.transporter?.name || 'غير محدد'}</p>
            {driverInfo && (
              <p className="text-xs text-muted-foreground truncate">
                السائق: {driverInfo.full_name}
              </p>
            )}
          </div>

          {/* Recycler */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Recycle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">جهة التدوير</span>
            </div>
            <p className="font-semibold text-sm truncate">{shipment.recycler?.name || 'غير محدد'}</p>
            <p className="text-xs text-muted-foreground truncate">{shipment.delivery_address}</p>
          </div>
        </div>

        {/* Driver Details */}
        {driverInfo && (
          <>
            <Separator />
            <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{driverInfo.full_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {driverInfo.vehicle_type && <span>{driverInfo.vehicle_type}</span>}
                    {driverInfo.vehicle_plate && (
                      <Badge variant="outline" className="text-xs">
                        {driverInfo.vehicle_plate}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {driverInfo.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${driverInfo.phone}`}>
                      <Phone className="h-4 w-4 mr-1" />
                      اتصال
                    </a>
                  </Button>
                )}
                {lastUpdate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(lastUpdate, 'HH:mm:ss', { locale: ar })}
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Map */}
        {showMap && (
          <div className="rounded-lg overflow-hidden border">
            <ShipmentTrackingMap
              collectionPoint={pickupLocation}
              recyclingCenter={deliveryLocation}
              driverLocation={driverInfo?.last_location || undefined}
              driverId={shipment.driver_id || undefined}
              showDriverTracking={!!shipment.driver_id}
              className="h-[300px]"
            />
          </div>
        )}

        {/* Timeline */}
        {!compact && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                الجدول الزمني
              </h4>
              <div className="space-y-1 text-xs">
                {shipment.created_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>تم الإنشاء: {format(new Date(shipment.created_at), 'PPp', { locale: ar })}</span>
                  </div>
                )}
                {shipment.approved_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>تمت الموافقة: {format(new Date(shipment.approved_at), 'PPp', { locale: ar })}</span>
                  </div>
                )}
                {shipment.collection_started_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>بدء التجميع: {format(new Date(shipment.collection_started_at), 'PPp', { locale: ar })}</span>
                  </div>
                )}
                {shipment.in_transit_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>بدء النقل: {format(new Date(shipment.in_transit_at), 'PPp', { locale: ar })}</span>
                  </div>
                )}
                {shipment.delivered_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>تم التسليم: {format(new Date(shipment.delivered_at), 'PPp', { locale: ar })}</span>
                  </div>
                )}
                {shipment.confirmed_at && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>تم التأكيد: {format(new Date(shipment.confirmed_at), 'PPp', { locale: ar })}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedShipmentTracker;
