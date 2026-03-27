import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import { 
  TrackingSource, 
  ShipmentTrackingConfig, 
  HybridLocationData,
  GPSDevice 
} from '@/types/gpsTracking';
import { toast } from 'sonner';
import { getTabChannelName } from '@/lib/tabSession';

interface UseHybridTrackingOptions {
  shipmentId: string;
  driverId: string | null;
  enabled?: boolean;
}

export const useHybridTracking = ({
  shipmentId,
  driverId,
  enabled = true,
}: UseHybridTrackingOptions) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<ShipmentTrackingConfig | null>(null);
  const [hybridData, setHybridData] = useState<HybridLocationData>({
    mobile: null,
    gps_device: null,
    selected_source: 'mobile',
    deviation_meters: null,
    anomaly_detected: false,
  });
  const [linkedDevice, setLinkedDevice] = useState<GPSDevice | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const configAbortRef = useRef<AbortController | null>(null);

  // Fetch tracking config
  const fetchConfig = useCallback(async () => {
    if (!shipmentId) return;

    configAbortRef.current?.abort();
    const controller = new AbortController();
    configAbortRef.current = controller;

    const { data, error } = await supabase
      .from('shipment_tracking_config')
      .select('*')
      .eq('shipment_id', shipmentId)
      .abortSignal(controller.signal)
      .maybeSingle();

    if (error) {
      if (error.message?.includes('AbortError') || error.message?.includes('aborted')) return;
      console.error('Error fetching tracking config:', error);
      return;
    }

    if (data) {
      setConfig(data as ShipmentTrackingConfig);

      // Fetch linked GPS device if exists
      if (data.gps_device_id) {
        const { data: deviceData } = await supabase
          .from('gps_devices')
          .select('*')
          .eq('id', data.gps_device_id)
          .single();

        if (deviceData) {
          setLinkedDevice(deviceData as GPSDevice);
        }
      }
    }
  }, [shipmentId]);

  // Create or update tracking config
  const setTrackingSource = useCallback(async (
    source: TrackingSource,
    gpsDeviceId?: string | null,
    options?: Partial<ShipmentTrackingConfig>
  ) => {
    if (!shipmentId) return false;

    setIsLoading(true);

    const configData = {
      shipment_id: shipmentId,
      tracking_source: source,
      primary_source: options?.primary_source || source,
      gps_device_id: gpsDeviceId || null,
      fallback_enabled: options?.fallback_enabled ?? true,
      location_sync_interval: options?.location_sync_interval ?? 30,
      anomaly_detection_enabled: options?.anomaly_detection_enabled ?? true,
      max_source_deviation: options?.max_source_deviation ?? 500,
    };

    const { data, error } = await supabase
      .from('shipment_tracking_config')
      .upsert(configData, { onConflict: 'shipment_id' })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error setting tracking source:', error);
      toast.error('فشل في تحديث إعدادات التتبع');
      return false;
    }

    setConfig(data as ShipmentTrackingConfig);
    toast.success('تم تحديث إعدادات التتبع');
    return true;
  }, [shipmentId]);

  // Process mobile location
  const processMobileLocation = useCallback((lat: number, lng: number, accuracy: number) => {
    setHybridData(prev => ({
      ...prev,
      mobile: { lat, lng, accuracy, timestamp: new Date() },
    }));
  }, []);

  // Subscribe to GPS device updates
  useEffect(() => {
    if (!enabled || !config?.gps_device_id) return;

    const channel = supabase
      .channel(getTabChannelName(`gps-location-${config.gps_device_id}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_location_logs',
          filter: `device_id=eq.${config.gps_device_id}`,
        },
        (payload) => {
          const log = payload.new as any;
          setHybridData(prev => ({
            ...prev,
            gps_device: {
              lat: Number(log.latitude),
              lng: Number(log.longitude),
              accuracy: log.accuracy || 10,
              timestamp: new Date(log.recorded_at),
            },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, config?.gps_device_id]);

  // Subscribe to mobile location updates
  useEffect(() => {
    if (!enabled || !driverId) return;

    const channel = supabase
      .channel(getTabChannelName(`driver-location-${driverId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const log = payload.new as any;
          processMobileLocation(
            Number(log.latitude),
            Number(log.longitude),
            log.accuracy || 20
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, driverId, processMobileLocation]);

  // Calculate deviation and detect anomalies
  useEffect(() => {
    const { mobile, gps_device } = hybridData;
    
    if (config?.tracking_source !== 'hybrid' || !mobile || !gps_device) {
      return;
    }

    // Calculate distance between sources
    const deviation = calculateHaversineDistance(
      mobile.lat,
      mobile.lng,
      gps_device.lat,
      gps_device.lng
    ) * 1000; // Convert to meters

    const anomalyDetected = config.anomaly_detection_enabled && 
      deviation > config.max_source_deviation;

    // Select the best source based on freshness and accuracy
    const mobileAge = Date.now() - mobile.timestamp.getTime();
    const gpsAge = Date.now() - gps_device.timestamp.getTime();
    
    let selectedSource: TrackingSource = config.primary_source;
    
    // If primary source is stale (>60 seconds), switch to fallback
    if (config.fallback_enabled) {
      if (config.primary_source === 'mobile' && mobileAge > 60000 && gpsAge < 60000) {
        selectedSource = 'gps_device';
      } else if (config.primary_source === 'gps_device' && gpsAge > 60000 && mobileAge < 60000) {
        selectedSource = 'mobile';
      }
    }

    setHybridData(prev => ({
      ...prev,
      deviation_meters: Math.round(deviation),
      anomaly_detected: anomalyDetected,
      selected_source: selectedSource,
    }));

    // Log anomaly if detected
    if (anomalyDetected && user?.id) {
      supabase.from('shipment_logs').insert({
        shipment_id: shipmentId,
        status: 'in_transit' as any,
        changed_by: user.id,
        notes: `[تنبيه] انحراف كبير بين مصادر التتبع: ${Math.round(deviation)} متر`,
        latitude: mobile.lat,
        longitude: mobile.lng,
      });
    }
  }, [hybridData.mobile, hybridData.gps_device, config, user?.id, shipmentId]);

  // Get current best location
  const getCurrentLocation = useCallback(() => {
    const { mobile, gps_device, selected_source } = hybridData;

    if (config?.tracking_source === 'mobile') {
      return mobile ? { lat: mobile.lat, lng: mobile.lng } : null;
    }
    
    if (config?.tracking_source === 'gps_device') {
      return gps_device ? { lat: gps_device.lat, lng: gps_device.lng } : null;
    }

    // Hybrid mode - use selected source
    if (selected_source === 'mobile' && mobile) {
      return { lat: mobile.lat, lng: mobile.lng };
    }
    
    if (selected_source === 'gps_device' && gps_device) {
      return { lat: gps_device.lat, lng: gps_device.lng };
    }

    // Fallback to any available
    return mobile 
      ? { lat: mobile.lat, lng: mobile.lng }
      : gps_device 
        ? { lat: gps_device.lat, lng: gps_device.lng }
        : null;
  }, [hybridData, config?.tracking_source]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchConfig();
    }
  }, [enabled, fetchConfig]);

  return {
    config,
    hybridData,
    linkedDevice,
    isLoading,
    setTrackingSource,
    getCurrentLocation,
    processMobileLocation,
    refreshConfig: fetchConfig,
  };
};

export default useHybridTracking;
