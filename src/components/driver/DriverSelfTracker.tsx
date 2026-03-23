/**
 * منظومة تتبع المسار المتكاملة للسائق — النسخة المطورة v2
 * إضافات: سرعة قصوى، ارتفاع، رسم بياني، تصدير، بوصلة، طبقات خريطة، تنبيهات سرعة
 */
import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Play, Square, MapPin, Clock, Navigation, Gauge, PauseCircle, RotateCcw,
  Mountain, TrendingUp, Download, Share2, Compass, Layers, AlertTriangle,
  Fuel, Timer, ArrowUp, ArrowDown, Activity, Map as MapIcon, BarChart3,
  Zap, Eye, Target, Route, Thermometer, Battery, Wifi, WifiOff, ChevronDown, ChevronUp
} from 'lucide-react';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, TRACKING_ZOOM, reverseGeocodeOSM } from '@/lib/leafletConfig';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

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
  altitude: number | null;
  accuracy: number | null;
}

interface StopPoint {
  lat: number;
  lng: number;
  arrivedAt: number;
  leftAt: number | null;
  address: string;
  duration: number;
}

interface SpeedAlert {
  speed: number;
  timestamp: number;
  lat: number;
  lng: number;
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

const STOP_THRESHOLD_MS = 60_000;
const STOP_DISTANCE_M = 30;
const SPEED_LIMIT_KMH = 120; // تنبيه تجاوز السرعة

const DriverSelfTracker = memo(() => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const posMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  const [isTracking, setIsTracking] = useState(false);
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [stops, setStops] = useState<StopPoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [currentAltitude, setCurrentAltitude] = useState<number | null>(null);
  const [minAltitude, setMinAltitude] = useState<number | null>(null);
  const [maxAltitude, setMaxAltitude] = useState<number | null>(null);
  const [currentHeading, setCurrentHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speedAlerts, setSpeedAlerts] = useState<SpeedAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'active' | 'reconnecting'>('connecting');
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('street');
  const [followDriver, setFollowDriver] = useState(true);
  const [showStopsPanel, setShowStopsPanel] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const autoStartedRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastPosition, setLastPosition] = useState<{ lat: number; lng: number } | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [movingTime, setMovingTime] = useState(0);
  const [stoppedTime, setStoppedTime] = useState(0);
  const lastMovingCheckRef = useRef<{ timestamp: number; wasMoving: boolean }>({ timestamp: 0, wasMoving: false });

  const pendingStopRef = useRef<{ lat: number; lng: number; since: number } | null>(null);

  // Tile layer URLs
  const TILE_LAYERS = useMemo(() => ({
    street: { url: OSM_TILE_URL, attr: OSM_ATTRIBUTION },
    satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Esri' },
    terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: 'OpenTopoMap' },
  }), []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(EGYPT_CENTER, 7);
    const tileLayer = L.tileLayer(TILE_LAYERS.street.url, { attribution: TILE_LAYERS.street.attr, maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tileLayer;
    mapInstance.current = map;

    setTimeout(() => map.invalidateSize(), 300);
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Switch map layer
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;
    const config = TILE_LAYERS[mapLayer];
    tileLayerRef.current.setUrl(config.url);
  }, [mapLayer, TILE_LAYERS]);

  // Elapsed timer + moving/stopped time
  useEffect(() => {
    if (!isTracking || !startTime) return;
    const iv = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
      
      const isMoving = currentSpeed > 2;
      if (lastMovingCheckRef.current.timestamp > 0) {
        const dt = (now - lastMovingCheckRef.current.timestamp) / 1000;
        if (isMoving) {
          setMovingTime(t => t + dt);
        } else {
          setStoppedTime(t => t + dt);
        }
      }
      lastMovingCheckRef.current = { timestamp: now, wasMoving: isMoving };
    }, 1000);
    return () => clearInterval(iv);
  }, [isTracking, startTime, currentSpeed]);

  const createPositionIcon = useCallback(() => {
    return L.divIcon({
      html: `<div style="width:22px;height:22px;background:hsl(var(--primary));border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);position:relative">
        <div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid hsl(var(--primary) / 0.3);animation:pulse 2s infinite"></div>
      </div>`,
      iconSize: [22, 22],
      className: '',
    });
  }, []);

  const addStopMarker = useCallback((stop: StopPoint) => {
    if (!mapInstance.current) return;
    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:hsl(var(--chart-4));border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
      iconSize: [14, 14],
      className: '',
    });
    L.marker([stop.lat, stop.lng], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`<div dir="rtl" style="font-family:Cairo,sans-serif;font-size:13px"><b>📍 ${stop.address || 'نقطة توقف'}</b><br/>⏱ ${formatTime(stop.duration)}<br/>🕐 ${formatClock(stop.arrivedAt)}</div>`);
  }, []);

  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, speed, heading, altitude, accuracy: acc } = pos.coords;
    const now = Date.now();

    const point: TrackPoint = { lat, lng, timestamp: now, speed, heading, altitude: altitude ?? null, accuracy: acc ?? null };

    // Update altitude
    if (altitude !== null && altitude !== undefined) {
      setCurrentAltitude(altitude);
      setMinAltitude(prev => prev === null ? altitude : Math.min(prev, altitude));
      setMaxAltitude(prev => prev === null ? altitude : Math.max(prev, altitude));
    }

    // Update heading
    if (heading !== null) setCurrentHeading(heading);
    if (acc !== null) setAccuracy(acc);

    // Speed tracking
    const speedKmh = speed ? speed * 3.6 : 0;
    setCurrentSpeed(speedKmh);
    if (speedKmh > maxSpeed) setMaxSpeed(speedKmh);

    // Speed alert
    if (speedKmh > SPEED_LIMIT_KMH) {
      setSpeedAlerts(prev => {
        const lastAlert = prev[prev.length - 1];
        if (!lastAlert || now - lastAlert.timestamp > 30000) {
          toast.warning(`⚠️ تجاوز السرعة: ${speedKmh.toFixed(0)} كم/س`);
          return [...prev, { speed: speedKmh, timestamp: now, lat, lng }];
        }
        return prev;
      });
    }

    setPoints(prev => {
      const updated = [...prev, point];

      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = haversine(last.lat, last.lng, lat, lng);
        if (dist > 2) {
          setTotalDistance(d => d + dist);
        }

        // Stop detection
        if (dist < STOP_DISTANCE_M) {
          if (!pendingStopRef.current) {
            pendingStopRef.current = { lat, lng, since: now };
          } else if (now - pendingStopRef.current.since > STOP_THRESHOLD_MS) {
            setStops(prevStops => {
              const lastStop = prevStops[prevStops.length - 1];
              if (lastStop && !lastStop.leftAt && haversine(lastStop.lat, lastStop.lng, lat, lng) < STOP_DISTANCE_M) {
                const updatedStops = [...prevStops];
                updatedStops[updatedStops.length - 1] = { ...lastStop, duration: Math.floor((now - lastStop.arrivedAt) / 1000) };
                return updatedStops;
              }
              const newStop: StopPoint = {
                lat: pendingStopRef.current!.lat,
                lng: pendingStopRef.current!.lng,
                arrivedAt: pendingStopRef.current!.since,
                leftAt: null,
                address: 'جاري تحديد العنوان...',
                duration: Math.floor((now - pendingStopRef.current!.since) / 1000),
              };
              reverseGeocodeOSM(newStop.lat, newStop.lng).then(addr => {
                setStops(s => s.map(st => st.arrivedAt === newStop.arrivedAt ? { ...st, address: addr } : st));
              });
              addStopMarker(newStop);
              return [...prevStops, newStop];
            });
          }
        } else {
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

    setLastPosition({ lat, lng });

    // Update map
    if (mapInstance.current) {
      if (!posMarkerRef.current) {
        posMarkerRef.current = L.marker([lat, lng], { icon: createPositionIcon() }).addTo(mapInstance.current);
      } else {
        posMarkerRef.current.setLatLng([lat, lng]);
      }

      // Accuracy circle
      if (acc && acc < 100) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle([lat, lng], {
            radius: acc,
            color: 'hsl(160,68%,40%)',
            fillColor: 'hsl(160,68%,40%)',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
          }).addTo(mapInstance.current);
        } else {
          accuracyCircleRef.current.setLatLng([lat, lng]);
          accuracyCircleRef.current.setRadius(acc);
        }
      }

      if (!polylineRef.current) {
        polylineRef.current = L.polyline([[lat, lng]], { color: 'hsl(160,68%,40%)', weight: 4, opacity: 0.85 }).addTo(mapInstance.current);
      } else {
        polylineRef.current.addLatLng([lat, lng]);
      }

      if (followDriver) {
        mapInstance.current.setView([lat, lng], mapInstance.current.getZoom() < TRACKING_ZOOM ? TRACKING_ZOOM : mapInstance.current.getZoom());
      }
    }
  }, [createPositionIcon, addStopMarker, maxSpeed, followDriver]);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setConnectionStatus('connecting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!startTime) {
          setStartTime(Date.now());
          setPoints([]);
          setStops([]);
          setTotalDistance(0);
          setElapsed(0);
          setMaxSpeed(0);
          setMovingTime(0);
          setStoppedTime(0);
          setSpeedAlerts([]);
          setMinAltitude(null);
          setMaxAltitude(null);
          pendingStopRef.current = null;
          lastMovingCheckRef.current = { timestamp: Date.now(), wasMoving: false };

          if (polylineRef.current && mapInstance.current) {
            mapInstance.current.removeLayer(polylineRef.current);
            polylineRef.current = null;
          }
          if (posMarkerRef.current && mapInstance.current) {
            mapInstance.current.removeLayer(posMarkerRef.current);
            posMarkerRef.current = null;
          }
          if (accuracyCircleRef.current && mapInstance.current) {
            mapInstance.current.removeLayer(accuracyCircleRef.current);
            accuracyCircleRef.current = null;
          }
        }

        setIsTracking(true);
        setConnectionStatus('active');
        handlePosition(pos);

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, (err) => {
          console.error('Geolocation error:', err);
          setConnectionStatus('reconnecting');
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => startTracking(), 3000);
        }, {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        });
      },
      (err) => {
        console.error('GPS error:', err);
        setConnectionStatus('reconnecting');
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => startTracking(), 5000);
      },
      { enableHighAccuracy: true }
    );
  }, [handlePosition, startTime]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setIsTracking(false);
    setConnectionStatus('connecting');
  }, []);

  const resetTracking = useCallback(() => {
    stopTracking();
    setPoints([]);
    setStops([]);
    setTotalDistance(0);
    setStartTime(null);
    setElapsed(0);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setMovingTime(0);
    setStoppedTime(0);
    setSpeedAlerts([]);
    setCurrentAltitude(null);
    setMinAltitude(null);
    setMaxAltitude(null);
    setCurrentHeading(null);
    setAccuracy(null);
    setLastPosition(null);
    pendingStopRef.current = null;

    if (mapInstance.current) {
      if (polylineRef.current) { mapInstance.current.removeLayer(polylineRef.current); polylineRef.current = null; }
      if (posMarkerRef.current) { mapInstance.current.removeLayer(posMarkerRef.current); posMarkerRef.current = null; }
      if (accuracyCircleRef.current) { mapInstance.current.removeLayer(accuracyCircleRef.current); accuracyCircleRef.current = null; }
      mapInstance.current.eachLayer(layer => {
        if (layer instanceof L.Marker) mapInstance.current!.removeLayer(layer);
      });
      mapInstance.current.setView(EGYPT_CENTER, 7);
    }
  }, [stopTracking]);

  const avgSpeed = elapsed > 0 ? (totalDistance / 1000) / (elapsed / 3600) : 0;
  const avgMovingSpeed = movingTime > 0 ? (totalDistance / 1000) / (movingTime / 3600) : 0;

  // Speed chart data (last 60 points sampled)
  const speedChartData = useMemo(() => {
    if (points.length < 2) return [];
    const step = Math.max(1, Math.floor(points.length / 60));
    return points.filter((_, i) => i % step === 0).map((p, i) => ({
      index: i,
      speed: p.speed ? Math.round(p.speed * 3.6) : 0,
      altitude: p.altitude ? Math.round(p.altitude) : 0,
      time: formatClock(p.timestamp),
    }));
  }, [points]);

  // Altitude chart data
  const altitudeChartData = useMemo(() => {
    return speedChartData.filter(d => d.altitude > 0);
  }, [speedChartData]);

  // Export trip data
  const exportTrip = useCallback(() => {
    if (points.length === 0) return;
    
    const tripData = {
      summary: {
        startTime: startTime ? new Date(startTime).toISOString() : null,
        totalDistance: `${(totalDistance / 1000).toFixed(2)} كم`,
        totalTime: formatTime(elapsed),
        movingTime: formatTime(Math.floor(movingTime)),
        stoppedTime: formatTime(Math.floor(stoppedTime)),
        avgSpeed: `${avgSpeed.toFixed(1)} كم/س`,
        avgMovingSpeed: `${avgMovingSpeed.toFixed(1)} كم/س`,
        maxSpeed: `${maxSpeed.toFixed(0)} كم/س`,
        totalStops: stops.length,
        speedAlerts: speedAlerts.length,
        pointsRecorded: points.length,
      },
      stops: stops.map(s => ({
        address: s.address,
        arrivedAt: formatClock(s.arrivedAt),
        leftAt: s.leftAt ? formatClock(s.leftAt) : 'لم يغادر بعد',
        duration: formatTime(s.duration),
      })),
      speedAlerts: speedAlerts.map(a => ({
        speed: `${a.speed.toFixed(0)} كم/س`,
        time: formatClock(a.timestamp),
        location: `${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}`,
      })),
    };

    const blob = new Blob([JSON.stringify(tripData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير بيانات الرحلة');
  }, [points, stops, speedAlerts, totalDistance, elapsed, movingTime, stoppedTime, avgSpeed, avgMovingSpeed, maxSpeed, startTime]);

  // Share location
  const shareLocation = useCallback(() => {
    if (!lastPosition) return;
    const url = `https://www.openstreetmap.org/?mlat=${lastPosition.lat}&mlon=${lastPosition.lng}#map=16/${lastPosition.lat}/${lastPosition.lng}`;
    if (navigator.share) {
      navigator.share({ title: 'موقعي الحالي', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط الموقع');
    }
  }, [lastPosition]);

  // Auto-start
  useEffect(() => {
    if (!autoStartedRef.current) {
      autoStartedRef.current = true;
      startTracking();
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [startTracking]);

  // Reconnect on visibility
  useEffect(() => {
    const handleVis = () => {
      if (document.visibilityState === 'visible' && !isTracking) {
        setConnectionStatus('reconnecting');
        startTracking();
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [isTracking, startTracking]);

  // Keep-alive: if no position received for 30s, force reconnect
  useEffect(() => {
    if (!isTracking) return;
    const keepAlive = setInterval(() => {
      const lastPt = points[points.length - 1];
      if (lastPt && Date.now() - lastPt.timestamp > 30000) {
        setConnectionStatus('reconnecting');
        startTracking();
      }
    }, 15000);
    return () => clearInterval(keepAlive);
  }, [isTracking, points, startTracking]);

  const statusConfig = {
    connecting: { label: 'جاري الاتصال...', color: 'bg-amber-500', icon: Wifi, textColor: 'text-amber-600' },
    active: { label: 'متصل — تتبع مباشر', color: 'bg-primary', icon: Wifi, textColor: 'text-primary' },
    reconnecting: { label: 'إعادة الاتصال...', color: 'bg-orange-500', icon: WifiOff, textColor: 'text-orange-600' },
  };

  const status = statusConfig[connectionStatus];
  const StatusIcon = status.icon;

  // Heading direction name
  const getDirection = (deg: number | null) => {
    if (deg === null) return '—';
    const dirs = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
    return dirs[Math.round(deg / 45) % 8];
  };

  // Moving percentage
  const movingPct = elapsed > 0 ? Math.min(100, (movingTime / elapsed) * 100) : 0;

  return (
    <div className="space-y-3" dir="rtl">
      {/* Connection Status Bar */}
      <Card className="border-primary/20 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`gap-1.5 ${status.textColor} border-current animate-pulse`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </Badge>
              {accuracy !== null && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  دقة ±{Math.round(accuracy)}م
                </span>
              )}
              {points.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{points.length} نقطة</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button onClick={shareLocation} variant="ghost" size="icon" className="h-7 w-7" disabled={!lastPosition}>
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button onClick={exportTrip} variant="ghost" size="icon" className="h-7 w-7" disabled={points.length === 0}>
                <Download className="w-3.5 h-3.5" />
              </Button>
              <Button onClick={resetTracking} variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <RotateCcw className="w-3 h-3" />
                تعيين
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Alert Banner */}
      {currentSpeed > SPEED_LIMIT_KMH && (
        <Card className="border-destructive/50 bg-destructive/10 animate-pulse">
          <CardContent className="p-3 flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">⚠️ تجاوز السرعة! {currentSpeed.toFixed(0)} كم/س (الحد: {SPEED_LIMIT_KMH})</span>
          </CardContent>
        </Card>
      )}

      {/* Primary Stats — Speed & Distance big */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <Gauge className="w-5 h-5 mx-auto mb-0.5 text-primary" />
            <p className="text-[10px] text-muted-foreground">السرعة الحالية</p>
            <p className="text-2xl font-black text-primary">{currentSpeed.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">كم/س</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <Navigation className="w-5 h-5 mx-auto mb-0.5 text-blue-500" />
            <p className="text-[10px] text-muted-foreground">المسافة</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatDistance(totalDistance)}</p>
            <p className="text-[10px] text-muted-foreground">{points.length > 0 ? 'مسجلة' : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        <Card>
          <CardContent className="p-2 text-center">
            <Clock className="w-4 h-4 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-[9px] text-muted-foreground">الزمن</p>
            <p className="text-sm font-bold">{formatTime(elapsed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Zap className="w-4 h-4 mx-auto mb-0.5 text-red-500" />
            <p className="text-[9px] text-muted-foreground">سرعة قصوى</p>
            <p className="text-sm font-bold">{maxSpeed.toFixed(0)} <span className="text-[8px]">كم/س</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <PauseCircle className="w-4 h-4 mx-auto mb-0.5 text-amber-500" />
            <p className="text-[9px] text-muted-foreground">وقفات</p>
            <p className="text-sm font-bold">{stops.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Mountain className="w-4 h-4 mx-auto mb-0.5 text-emerald-600" />
            <p className="text-[9px] text-muted-foreground">الارتفاع</p>
            <p className="text-sm font-bold">{currentAltitude !== null ? `${Math.round(currentAltitude)}م` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Compass & Heading Row */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Compass className="w-10 h-10 text-muted-foreground/30" />
                {currentHeading !== null && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ transform: `rotate(${currentHeading}deg)` }}
                  >
                    <ArrowUp className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">{getDirection(currentHeading)}</p>
                <p className="text-[10px] text-muted-foreground">{currentHeading !== null ? `${Math.round(currentHeading)}°` : 'بدون بوصلة'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="text-center">
                <p>متوسط سرعة</p>
                <p className="text-sm font-bold text-foreground">{avgSpeed.toFixed(1)}</p>
              </div>
              <div className="text-center border-x border-border px-3">
                <p>متوسط حركة</p>
                <p className="text-sm font-bold text-foreground">{avgMovingSpeed.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p>% حركة</p>
                <p className="text-sm font-bold text-primary">{movingPct.toFixed(0)}%</p>
              </div>
            </div>
          </div>
          {/* Moving vs Stopped bar */}
          <div className="mt-2">
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> حركة: {formatTime(Math.floor(movingTime))}</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> توقف: {formatTime(Math.floor(stoppedTime))}</span>
            </div>
            <Progress value={movingPct} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Map with layer controls */}
      <Card className="overflow-hidden relative">
        {/* Map layer switcher */}
        <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-1">
          <Button
            size="icon"
            variant={mapLayer === 'street' ? 'default' : 'secondary'}
            className="h-7 w-7 shadow-md"
            onClick={() => setMapLayer('street')}
          >
            <MapIcon className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant={mapLayer === 'satellite' ? 'default' : 'secondary'}
            className="h-7 w-7 shadow-md"
            onClick={() => setMapLayer('satellite')}
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant={mapLayer === 'terrain' ? 'default' : 'secondary'}
            className="h-7 w-7 shadow-md"
            onClick={() => setMapLayer('terrain')}
          >
            <Mountain className="w-3.5 h-3.5" />
          </Button>
        </div>
        {/* Follow toggle */}
        <div className="absolute top-2 right-2 z-[1000]">
          <Button
            size="icon"
            variant={followDriver ? 'default' : 'secondary'}
            className="h-7 w-7 shadow-md"
            onClick={() => setFollowDriver(!followDriver)}
          >
            <Target className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
      </Card>

      {/* Tabs: Charts / Stops / Alerts / Summary */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <TabsList className="w-full grid grid-cols-4 h-9">
          <TabsTrigger value="live" className="text-xs gap-1"><Activity className="w-3 h-3" /> مباشر</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs gap-1"><BarChart3 className="w-3 h-3" /> رسوم</TabsTrigger>
          <TabsTrigger value="stops" className="text-xs gap-1"><MapPin className="w-3 h-3" /> وقفات</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" /> تنبيهات</TabsTrigger>
        </TabsList>

        {/* Live Tab — Altitude details */}
        <TabsContent value="live" className="mt-2 space-y-2">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Mountain className="w-4 h-4 text-emerald-600" /> بيانات الارتفاع</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground text-[9px]">الحالي</p>
                  <p className="font-bold">{currentAltitude !== null ? `${Math.round(currentAltitude)} م` : '—'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground text-[9px] flex items-center justify-center gap-0.5"><ArrowDown className="w-2.5 h-2.5" /> أدنى</p>
                  <p className="font-bold">{minAltitude !== null ? `${Math.round(minAltitude)} م` : '—'}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground text-[9px] flex items-center justify-center gap-0.5"><ArrowUp className="w-2.5 h-2.5" /> أعلى</p>
                  <p className="font-bold">{maxAltitude !== null ? `${Math.round(maxAltitude)} م` : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Summary */}
          {points.length > 1 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm">ملخص الرحلة</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 text-xs space-y-1.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">المسافة:</span> <strong>{formatDistance(totalDistance)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">الزمن:</span> <strong>{formatTime(elapsed)}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">وقت الحركة:</span> <strong>{formatTime(Math.floor(movingTime))}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">وقت التوقف:</span> <strong>{formatTime(Math.floor(stoppedTime))}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">متوسط سرعة:</span> <strong>{avgSpeed.toFixed(1)} كم/س</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">سرعة قصوى:</span> <strong>{maxSpeed.toFixed(0)} كم/س</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">الوقفات:</span> <strong>{stops.length}</strong></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">النقاط:</span> <strong>{points.length}</strong></div>
                  {startTime && <div className="flex justify-between col-span-2"><span className="text-muted-foreground">البداية:</span> <strong>{formatClock(startTime)}</strong></div>}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="mt-2 space-y-2">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Gauge className="w-4 h-4 text-primary" /> رسم بياني للسرعة</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {speedChartData.length > 2 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={speedChartData}>
                    <defs>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160,68%,40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(160,68%,40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="index" hide />
                    <YAxis width={30} fontSize={10} />
                    <Tooltip formatter={(v: number) => [`${v} كم/س`, 'السرعة']} labelFormatter={() => ''} />
                    <Area type="monotone" dataKey="speed" stroke="hsl(160,68%,40%)" fill="url(#speedGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8">ابدأ التتبع لرؤية رسم السرعة</p>
              )}
            </CardContent>
          </Card>

          {altitudeChartData.length > 2 && (
            <Card>
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Mountain className="w-4 h-4 text-emerald-600" /> رسم الارتفاع</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={altitudeChartData}>
                    <defs>
                      <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="index" hide />
                    <YAxis width={35} fontSize={10} />
                    <Tooltip formatter={(v: number) => [`${v} م`, 'الارتفاع']} labelFormatter={() => ''} />
                    <Area type="monotone" dataKey="altitude" stroke="#059669" fill="url(#altGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stops Tab */}
        <TabsContent value="stops" className="mt-2">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                سجل نقاط التوقف ({stops.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stops.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-6">لا توجد نقاط توقف حتى الآن</p>
              ) : (
                <ScrollArea className="max-h-60">
                  <div className="divide-y divide-border">
                    {stops.map((stop, i) => (
                      <div key={i} className="p-3 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{stop.address}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span>🕐 {formatClock(stop.arrivedAt)}</span>
                            {stop.leftAt && <span>→ {formatClock(stop.leftAt)}</span>}
                            <span>⏱ {formatTime(stop.duration)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-2">
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                تنبيهات تجاوز السرعة ({speedAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {speedAlerts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">لا توجد تنبيهات — حد السرعة {SPEED_LIMIT_KMH} كم/س</p>
                  <p className="text-[10px] text-muted-foreground mt-1">✅ قيادة آمنة</p>
                </div>
              ) : (
                <ScrollArea className="max-h-48">
                  <div className="divide-y divide-border">
                    {speedAlerts.map((alert, i) => (
                      <div key={i} className="p-3 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 shrink-0">
                          <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-destructive">{alert.speed.toFixed(0)} كم/س</p>
                          <p className="text-[10px] text-muted-foreground">{formatClock(alert.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsla(var(--primary), 0.4); }
          50% { box-shadow: 0 0 0 10px hsla(var(--primary), 0); }
        }
      `}</style>
    </div>
  );
});

DriverSelfTracker.displayName = 'DriverSelfTracker';
export default DriverSelfTracker;
