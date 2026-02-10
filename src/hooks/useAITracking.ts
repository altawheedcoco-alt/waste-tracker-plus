import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { calculateHaversineDistance } from '@/lib/mapUtils';
import { TrackingState } from '@/types/tracking';

interface UseAITrackingOptions {
  shipmentId: string;
  driverId: string;
  pickupCoords: { lat: number; lng: number } | null;
  deliveryCoords: { lat: number; lng: number } | null;
  currentStatus: string;
  enabled?: boolean;
}

interface AIAnalysis {
  estimatedArrival: Date | null;
  confidence: number;
  avgSpeed: number;
  predictedDelay: number; // in minutes
  routeEfficiency: number; // percentage
  drivingPattern: 'normal' | 'fast' | 'slow' | 'irregular';
  recommendations: string[];
}

/**
 * Hook for AI-powered tracking with predictions and analysis
 */
export const useAITracking = ({
  shipmentId,
  driverId,
  pickupCoords,
  deliveryCoords,
  currentStatus,
  enabled = true,
}: UseAITrackingOptions) => {
  const { user } = useAuth();
  const [state, setState] = useState<TrackingState>({
    shipmentId,
    mode: 'ai',
    isActive: false,
    lastUpdate: null,
    progress: 0,
    currentLocation: null,
    estimatedArrival: null,
    distanceRemaining: null,
    autoStatusChanges: false,
  });

  const [analysis, setAnalysis] = useState<AIAnalysis>({
    estimatedArrival: null,
    confidence: 0,
    avgSpeed: 0,
    predictedDelay: 0,
    routeEfficiency: 100,
    drivingPattern: 'normal',
    recommendations: [],
  });

  const [locationHistory, setLocationHistory] = useState<Array<{
    lat: number;
    lng: number;
    speed: number;
    timestamp: Date;
  }>>([]);

  // Fetch historical data for AI analysis
  const fetchHistoricalData = useCallback(async () => {
    if (!driverId) return;

    const { data } = await supabase
      .from('driver_location_logs')
      .select('latitude, longitude, speed, recorded_at')
      .eq('driver_id', driverId)
      .order('recorded_at', { ascending: true })
      .limit(100);

    if (data && data.length > 0) {
      setLocationHistory(data.map(d => ({
        lat: Number(d.latitude),
        lng: Number(d.longitude),
        speed: d.speed || 0,
        timestamp: new Date(d.recorded_at),
      })));
    }
  }, [driverId]);

  // AI Analysis function
  const analyzePattern = useCallback(() => {
    if (locationHistory.length < 5 || !deliveryCoords) return;

    const speeds = locationHistory.map(l => l.speed).filter(s => s > 0);
    const avgSpeed = speeds.length > 0 
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length 
      : 40; // Default 40 km/h

    const lastLocation = locationHistory[locationHistory.length - 1];
    const remainingDistance = calculateHaversineDistance(
      lastLocation.lat,
      lastLocation.lng,
      deliveryCoords.lat,
      deliveryCoords.lng
    );

    // Calculate ETA
    const hoursRemaining = remainingDistance / Math.max(avgSpeed, 20);
    const estimatedArrival = new Date(Date.now() + hoursRemaining * 60 * 60 * 1000);

    // Analyze driving pattern
    const speedVariance = speeds.length > 1 
      ? speeds.reduce((acc, s) => acc + Math.pow(s - avgSpeed, 2), 0) / speeds.length 
      : 0;
    
    let drivingPattern: AIAnalysis['drivingPattern'] = 'normal';
    if (speedVariance > 400) drivingPattern = 'irregular';
    else if (avgSpeed > 80) drivingPattern = 'fast';
    else if (avgSpeed < 30) drivingPattern = 'slow';

    // Calculate route efficiency
    if (locationHistory.length >= 2 && pickupCoords) {
      const directDistance = calculateHaversineDistance(
        pickupCoords.lat, pickupCoords.lng,
        lastLocation.lat, lastLocation.lng
      );
      
      let actualDistance = 0;
      for (let i = 1; i < locationHistory.length; i++) {
        actualDistance += calculateHaversineDistance(
          locationHistory[i-1].lat, locationHistory[i-1].lng,
          locationHistory[i].lat, locationHistory[i].lng
        );
      }
      
      const efficiency = directDistance > 0 
        ? Math.min(100, (directDistance / Math.max(actualDistance, directDistance)) * 100) 
        : 100;
      
      setAnalysis(prev => ({
        ...prev,
        routeEfficiency: Math.round(efficiency),
      }));
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (drivingPattern === 'slow') {
      recommendations.push('السرعة أقل من المتوسط - قد يكون هناك ازدحام');
    }
    if (drivingPattern === 'irregular') {
      recommendations.push('نمط القيادة غير منتظم - يُنصح بمراجعة المسار');
    }
    if (remainingDistance < 2) {
      recommendations.push('السائق قريب جداً من نقطة التسليم');
    }
    if (remainingDistance < 0.5) {
      recommendations.push('السائق وصل تقريباً - يمكن تأكيد التسليم');
    }

    // Confidence based on data quality
    const confidence = Math.min(95, 50 + (locationHistory.length * 2) + (speeds.length > 10 ? 20 : 0));

    const progress = pickupCoords ? calculateProgress(lastLocation, pickupCoords, deliveryCoords) : 0;

    setAnalysis({
      estimatedArrival,
      confidence,
      avgSpeed: Math.round(avgSpeed),
      predictedDelay: 0,
      routeEfficiency: analysis.routeEfficiency,
      drivingPattern,
      recommendations,
    });

    setState(prev => ({
      ...prev,
      estimatedArrival,
      distanceRemaining: remainingDistance,
      progress,
    }));

    // Auto-suggest status change when close to destination
    // This works together with the realtime tracking - AI provides the intelligence
    if (remainingDistance < 0.3 && progress > 95) {
      recommendations.push('🎯 الشحنة وصلت للوجهة - جاهزة للتأكيد');
    }
  }, [locationHistory, deliveryCoords, pickupCoords, analysis.routeEfficiency]);

  const calculateProgress = (
    current: { lat: number; lng: number },
    pickup: { lat: number; lng: number },
    delivery: { lat: number; lng: number }
  ) => {
    const total = calculateHaversineDistance(pickup.lat, pickup.lng, delivery.lat, delivery.lng);
    const remaining = calculateHaversineDistance(current.lat, current.lng, delivery.lat, delivery.lng);
    return Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  };

  // Log AI prediction
  const logAIPrediction = useCallback(async () => {
    if (!shipmentId || !user?.id || !analysis.estimatedArrival) return;

    await supabase.from('shipment_logs').insert({
      shipment_id: shipmentId,
      status: currentStatus as any,
      changed_by: user.id,
      notes: `[تتبع ذكي] توقع الوصول: ${analysis.estimatedArrival.toLocaleTimeString('ar-EG')} | الثقة: ${analysis.confidence}% | السرعة المتوسطة: ${analysis.avgSpeed} كم/س`,
      latitude: locationHistory[locationHistory.length - 1]?.lat,
      longitude: locationHistory[locationHistory.length - 1]?.lng,
    });
  }, [shipmentId, user?.id, analysis, currentStatus, locationHistory]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchHistoricalData();
    }
  }, [enabled, fetchHistoricalData]);

  // Run analysis when history updates
  useEffect(() => {
    if (locationHistory.length >= 5) {
      analyzePattern();
    }
  }, [locationHistory, analyzePattern]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled || !driverId) return;

    const channel = supabase
      .channel(getTabChannelName(`ai-tracking-${shipmentId}`))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const newLocation = payload.new as { latitude: number; longitude: number; speed: number; recorded_at: string };
          setLocationHistory(prev => [...prev.slice(-99), {
            lat: Number(newLocation.latitude),
            lng: Number(newLocation.longitude),
            speed: newLocation.speed || 0,
            timestamp: new Date(newLocation.recorded_at),
          }]);
          
          setState(prev => ({
            ...prev,
            isActive: true,
            lastUpdate: new Date(),
            currentLocation: { lat: Number(newLocation.latitude), lng: Number(newLocation.longitude) },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, driverId, shipmentId]);

  return {
    state,
    analysis,
    locationHistory,
    analyzePattern,
    logAIPrediction,
    refreshData: fetchHistoricalData,
  };
};

export default useAITracking;
