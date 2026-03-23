/**
 * منظومة تتبع المسار المتكاملة للسائق
 * - تسجيل الموقع لحظياً على خريطة Leaflet مجانية
 * - رسم خط المسار + نقاط التوقف
 * - عرض المسافة الإجمالية والزمن والسرعة
 */
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Square, MapPin, Clock, Navigation, Gauge, PauseCircle, RotateCcw } from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, TRACKING_ZOOM, reverseGeocodeOSM } from '@/lib/leafletConfig';
import { toast } from 'sonner';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
}

interface StopPoint {
  lat: number;
  lng: number;
  arrivedAt: number;
  leftAt: number | null;
  address: string;
  duration: number; // seconds
}

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h} س ${m} د`;
  if (m > 0) return `${m} د ${s} ث`;
  return `${s} ث`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} كم`;
  return `${Math.round(meters)} م`;
};

const formatClock = (ts: number) =>
  new Date(ts).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const STOP_THRESHOLD_MS = 60_000; // 1 min stationary = stop
const STOP_DISTANCE_M = 30; // within 30m = same location

const DriverSelfTracker = memo(() => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const posMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [stops, setStops] = useState<StopPoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Pending stop detection
  const pendingStopRef = useRef<{ lat: number; lng: number; since: number } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(EGYPT_CENTER, 7);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapInstance.current = map;

    // Fix tile rendering when container size isn't ready yet
    setTimeout(() => map.invalidateSize(), 300);
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!isTracking || !startTime) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [isTracking, startTime]);

  // Position icon
  const createPositionIcon = useCallback(() => {
    return L.divIcon({
      html: `<div style="width:20px;height:20px;background:hsl(160,68%,40%);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);animation:pulse 2s infinite"></div>`,
      iconSize: [20, 20],
      className: '',
    });
  }, []);

  const addStopMarker = useCallback((stop: StopPoint) => {
    if (!mapInstance.current) return;
    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14],
      className: '',
    });
    L.marker([stop.lat, stop.lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`<div dir="rtl" style="font-family:Cairo,sans-serif;font-size:13px"><b>📍 ${stop.address || 'نقطة توقف'}</b><br/>⏱ ${formatTime(stop.duration)}<br/>🕐 ${formatClock(stop.arrivedAt)}</div>`);
  }, []);

  // Handle new position
  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, speed, heading } = pos.coords;
    const now = Date.now();

    const point: TrackPoint = { lat, lng, timestamp: now, speed, heading };

    setPoints(prev => {
      const updated = [...prev, point];

      // Calculate distance from previous point
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = haversine(last.lat, last.lng, lat, lng);
        if (dist > 2) { // ignore jitter < 2m
          setTotalDistance(d => d + dist);
        }

        // Stop detection
        if (dist < STOP_DISTANCE_M) {
          if (!pendingStopRef.current) {
            pendingStopRef.current = { lat, lng, since: now };
          } else if (now - pendingStopRef.current.since > STOP_THRESHOLD_MS) {
            // Already logged? Check last stop
            setStops(prevStops => {
              const lastStop = prevStops[prevStops.length - 1];
              if (lastStop && !lastStop.leftAt && haversine(lastStop.lat, lastStop.lng, lat, lng) < STOP_DISTANCE_M) {
                // Update duration of ongoing stop
                const updatedStops = [...prevStops];
                updatedStops[updatedStops.length - 1] = { ...lastStop, duration: Math.floor((now - lastStop.arrivedAt) / 1000) };
                return updatedStops;
              }
              // New stop
              const newStop: StopPoint = {
                lat: pendingStopRef.current!.lat,
                lng: pendingStopRef.current!.lng,
                arrivedAt: pendingStopRef.current!.since,
                leftAt: null,
                address: 'جاري تحديد العنوان...',
                duration: Math.floor((now - pendingStopRef.current!.since) / 1000),
              };
              // Reverse geocode async
              reverseGeocodeOSM(newStop.lat, newStop.lng).then(addr => {
                setStops(s => s.map(st => st.arrivedAt === newStop.arrivedAt ? { ...st, address: addr } : st));
              });
              addStopMarker(newStop);
              return [...prevStops, newStop];
            });
          }
        } else {
          // Moving — close any open stop
          if (pendingStopRef.current) {
            setStops(prevStops => {
              if (prevStops.length > 0 && !prevStops[prevStops.length - 1].leftAt) {
                const updated = [...prevStops];
                updated[updated.length - 1] = { ...updated[updated.length - 1], leftAt: now };
                return updated;
              }
              return prevStops;
            });
            pendingStopRef.current = null;
          }
        }
      }

      return updated;
    });

    setCurrentSpeed(speed ? speed * 3.6 : 0); // m/s → km/h
    setLastPosition({ lat, lng });

    // Update map
    if (mapInstance.current) {
      if (!posMarkerRef.current) {
        posMarkerRef.current = L.marker([lat, lng], { icon: createPositionIcon() }).addTo(mapInstance.current);
      } else {
        posMarkerRef.current.setLatLng([lat, lng]);
      }

      if (!polylineRef.current) {
        polylineRef.current = L.polyline([[lat, lng]], { color: 'hsl(160,68%,40%)', weight: 4, opacity: 0.85 }).addTo(mapInstance.current);
      } else {
        polylineRef.current.addLatLng([lat, lng]);
      }

      mapInstance.current.setView([lat, lng], mapInstance.current.getZoom() < TRACKING_ZOOM ? TRACKING_ZOOM : mapInstance.current.getZoom());
    }
  }, [createPositionIcon, addStopMarker]);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsTracking(true);
        setStartTime(Date.now());
        setPoints([]);
        setStops([]);
        setTotalDistance(0);
        setElapsed(0);
        pendingStopRef.current = null;

        // Clear old layers
        if (polylineRef.current && mapInstance.current) {
          mapInstance.current.removeLayer(polylineRef.current);
          polylineRef.current = null;
        }
        if (posMarkerRef.current && mapInstance.current) {
          mapInstance.current.removeLayer(posMarkerRef.current);
          posMarkerRef.current = null;
        }

        handlePosition(pos);

        watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, (err) => {
          console.error('Geolocation error:', err);
          toast.error('خطأ في تتبع الموقع: ' + err.message);
        }, {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        });

        toast.success('بدأ تسجيل المسار');
      },
      (err) => {
        toast.error('لا يمكن الوصول للموقع. يرجى تفعيل GPS');
        console.error(err);
      },
      { enableHighAccuracy: true }
    );
  }, [handlePosition]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    toast.info('تم إيقاف تسجيل المسار');
  }, []);

  const resetTracking = useCallback(() => {
    stopTracking();
    setPoints([]);
    setStops([]);
    setTotalDistance(0);
    setStartTime(null);
    setElapsed(0);
    setCurrentSpeed(0);
    setLastPosition(null);
    pendingStopRef.current = null;

    if (mapInstance.current) {
      if (polylineRef.current) {
        mapInstance.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      if (posMarkerRef.current) {
        mapInstance.current.removeLayer(posMarkerRef.current);
        posMarkerRef.current = null;
      }
      // Clear stop markers
      mapInstance.current.eachLayer(layer => {
        if (layer instanceof L.Marker) mapInstance.current!.removeLayer(layer);
      });
      mapInstance.current.setView(EGYPT_CENTER, 7);
    }
  }, [stopTracking]);

  const avgSpeed = elapsed > 0 ? (totalDistance / 1000) / (elapsed / 3600) : 0;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Control Bar */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {!isTracking ? (
              <Button onClick={startTracking} className="gap-2 bg-primary hover:bg-primary/90">
                <Play className="w-4 h-4" />
                بدء التتبع
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                إيقاف
              </Button>
            )}
            <Button onClick={resetTracking} variant="outline" size="sm" className="gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة تعيين
            </Button>

            {isTracking && (
              <Badge variant="outline" className="animate-pulse border-primary text-primary gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                تتبع مباشر
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">المسافة</p>
            <p className="text-lg font-bold">{formatDistance(totalDistance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">الزمن</p>
            <p className="text-lg font-bold">{formatTime(elapsed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Gauge className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xs text-muted-foreground">السرعة الحالية</p>
            <p className="text-lg font-bold">{currentSpeed.toFixed(0)} كم/س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <PauseCircle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">نقاط التوقف</p>
            <p className="text-lg font-bold">{stops.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div ref={mapRef} style={{ height: '450px', width: '100%' }} />
      </Card>

      {/* Stops Log */}
      {stops.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              سجل نقاط التوقف ({stops.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-60">
              <div className="divide-y divide-border">
                {stops.map((stop, i) => (
                  <div key={i} className="p-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{stop.address}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>🕐 وصول: {formatClock(stop.arrivedAt)}</span>
                        {stop.leftAt && <span>🕐 مغادرة: {formatClock(stop.leftAt)}</span>}
                        <span>⏱ مدة: {formatTime(stop.duration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Trip Summary (when stopped with data) */}
      {!isTracking && points.length > 1 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ملخص الرحلة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">المسافة الكلية:</span> <strong>{formatDistance(totalDistance)}</strong></div>
              <div><span className="text-muted-foreground">الزمن الكلي:</span> <strong>{formatTime(elapsed)}</strong></div>
              <div><span className="text-muted-foreground">متوسط السرعة:</span> <strong>{avgSpeed.toFixed(1)} كم/س</strong></div>
              <div><span className="text-muted-foreground">نقاط التوقف:</span> <strong>{stops.length}</strong></div>
              <div><span className="text-muted-foreground">نقاط المسار:</span> <strong>{points.length}</strong></div>
              {startTime && <div><span className="text-muted-foreground">بداية:</span> <strong>{formatClock(startTime)}</strong></div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsla(160,68%,40%,0.4); }
          50% { box-shadow: 0 0 0 10px hsla(160,68%,40%,0); }
        }
      `}</style>
    </div>
  );
});

DriverSelfTracker.displayName = 'DriverSelfTracker';
export default DriverSelfTracker;
