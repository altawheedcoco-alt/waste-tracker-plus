import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  MapPin,
  Clock,
  Navigation,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Package,
  Route,
  Timer,
  Truck,
  CheckCircle2,
  AlertCircle,
  Fuel,
  Activity,
  History,
  Target,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const startIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;font-weight:bold;">S</span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const endIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:20px;height:20px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;font-weight:bold;">E</span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const currentIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:24px;height:24px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);animation:pulse 2s infinite;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const pickupIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:32px;height:32px;background:#eab308;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const deliveryIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="width:32px;height:32px;background:#22c55e;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface LocationLog {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  accuracy: number | null;
}

interface ActiveShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  generator: { name: string } | null;
  recycler: { name: string } | null;
}

interface TripSession {
  id: string;
  shipment_id: string | null;
  shipment_number: string | null;
  start_time: string;
  end_time: string | null;
  start_location: { lat: number; lng: number } | null;
  end_location: { lat: number; lng: number } | null;
  distance_km: number;
  duration_minutes: number;
  locations: LocationLog[];
  status: 'active' | 'completed' | 'paused';
}

interface DriverTripTrackerProps {
  driverId: string;
}

// Map panner component
const MapPanner = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.panTo(center);
  }, [center, map]);
  return null;
};

const DriverTripTracker = ({ driverId }: DriverTripTrackerProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<TripSession | null>(null);
  const [tripLocations, setTripLocations] = useState<LocationLog[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeShipments, setActiveShipments] = useState<ActiveShipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<string>('none');
  const [tripHistory, setTripHistory] = useState<TripSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedHistoryTrip, setSelectedHistoryTrip] = useState<TripSession | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch active shipments
  useEffect(() => {
    const fetchActiveShipments = async () => {
      try {
        const { data } = await supabase
          .from('shipments')
          .select(`
            id, shipment_number, status, waste_type, quantity, unit,
            pickup_address, delivery_address,
            generator:organizations!shipments_generator_id_fkey(name),
            recycler:organizations!shipments_recycler_id_fkey(name)
          `)
          .eq('driver_id', driverId)
          .in('status', ['approved', 'collecting', 'in_transit'])
          .order('created_at', { ascending: false });

        if (data) {
          setActiveShipments(data as unknown as ActiveShipment[]);
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (driverId) {
      fetchActiveShipments();
      fetchTripHistory();
    }
  }, [driverId]);

  // Fetch trip history
  const fetchTripHistory = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('driver_location_logs')
        .select('*')
        .eq('driver_id', driverId)
        .gte('recorded_at', today.toISOString())
        .order('recorded_at', { ascending: true });

      if (data && data.length > 0) {
        // Group locations into trips (gap > 30 min = new trip)
        const trips: TripSession[] = [];
        let currentTripLocs: LocationLog[] = [];
        let tripIndex = 0;

        data.forEach((loc, index) => {
          if (index === 0) {
            currentTripLocs.push(loc);
            return;
          }

          const prevTime = new Date(data[index - 1].recorded_at).getTime();
          const currTime = new Date(loc.recorded_at).getTime();
          const gapMinutes = (currTime - prevTime) / (1000 * 60);

          if (gapMinutes > 30) {
            // Save current trip and start new one
            if (currentTripLocs.length > 1) {
              trips.push(createTripFromLocations(currentTripLocs, tripIndex++));
            }
            currentTripLocs = [loc];
          } else {
            currentTripLocs.push(loc);
          }
        });

        // Save last trip
        if (currentTripLocs.length > 1) {
          trips.push(createTripFromLocations(currentTripLocs, tripIndex));
        }

        setTripHistory(trips);
      }
    } catch (error) {
      console.error('Error fetching trip history:', error);
    }
  };

  const createTripFromLocations = (locations: LocationLog[], index: number): TripSession => {
    const distance = calculateTotalDistance(locations);
    const startTime = new Date(locations[0].recorded_at);
    const endTime = new Date(locations[locations.length - 1].recorded_at);
    const durationMs = endTime.getTime() - startTime.getTime();

    return {
      id: `trip-${index}`,
      shipment_id: null,
      shipment_number: null,
      start_time: locations[0].recorded_at,
      end_time: locations[locations.length - 1].recorded_at,
      start_location: { lat: Number(locations[0].latitude), lng: Number(locations[0].longitude) },
      end_location: { lat: Number(locations[locations.length - 1].latitude), lng: Number(locations[locations.length - 1].longitude) },
      distance_km: distance,
      duration_minutes: Math.round(durationMs / (1000 * 60)),
      locations,
      status: 'completed',
    };
  };

  const calculateTotalDistance = (locations: LocationLog[]): number => {
    if (locations.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < locations.length; i++) {
      total += getDistanceFromLatLon(
        Number(locations[i - 1].latitude), Number(locations[i - 1].longitude),
        Number(locations[i].latitude), Number(locations[i].longitude)
      );
    }
    return Math.round(total * 100) / 100;
  };

  const getDistanceFromLatLon = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && tripStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - tripStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, tripStartTime]);

  // Playback effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedHistoryTrip && selectedHistoryTrip.locations.length > 0) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= selectedHistoryTrip.locations.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedHistoryTrip]);

  const saveLocation = useCallback(async (position: GeolocationPosition) => {
    const locData = {
      driver_id: driverId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      recorded_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('driver_location_logs')
        .insert(locData)
        .select()
        .single();

      if (error) throw error;

      setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      if (data) {
        setTripLocations(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, [driverId]);

  const startTrip = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('الموقع الجغرافي غير مدعوم');
      return;
    }

    setIsTracking(true);
    setTripStartTime(new Date());
    setTripLocations([]);
    setElapsedTime(0);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveLocation(position);
        setCurrentTrip({
          id: `trip-${Date.now()}`,
          shipment_id: selectedShipment !== 'none' ? selectedShipment : null,
          shipment_number: activeShipments.find(s => s.id === selectedShipment)?.shipment_number || null,
          start_time: new Date().toISOString(),
          end_time: null,
          start_location: { lat: position.coords.latitude, lng: position.coords.longitude },
          end_location: null,
          distance_km: 0,
          duration_minutes: 0,
          locations: [],
          status: 'active',
        });
        toast.success('تم بدء الرحلة');
      },
      (error) => {
        toast.error('فشل في تحديد الموقع');
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    const id = navigator.geolocation.watchPosition(
      (position) => {
        saveLocation(position);
      },
      (error) => console.error('Watch error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    setWatchId(id);
  }, [driverId, selectedShipment, activeShipments, saveLocation]);

  const endTrip = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setIsTracking(false);
    
    if (currentTrip && tripLocations.length > 0) {
      const distance = calculateTotalDistance(tripLocations);
      const completedTrip: TripSession = {
        ...currentTrip,
        end_time: new Date().toISOString(),
        end_location: currentLocation,
        distance_km: distance,
        duration_minutes: Math.round(elapsedTime / 60),
        locations: tripLocations,
        status: 'completed',
      };
      
      setTripHistory(prev => [completedTrip, ...prev]);
      toast.success(`تم إنهاء الرحلة - ${distance} كم`);
    }

    setCurrentTrip(null);
    setTripStartTime(null);
    fetchTripHistory();
  }, [watchId, currentTrip, tripLocations, currentLocation, elapsedTime]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      approved: { label: 'معتمدة', variant: 'secondary' },
      collecting: { label: 'قيد الجمع', variant: 'default' },
      in_transit: { label: 'في الطريق', variant: 'default' },
    };
    const c = config[status] || { label: status, variant: 'outline' };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const mapCenter: [number, number] = currentLocation 
    ? [currentLocation.lat, currentLocation.lng]
    : tripLocations.length > 0
      ? [Number(tripLocations[0].latitude), Number(tripLocations[0].longitude)]
      : [30.0444, 31.2357];

  const pathCoordinates: [number, number][] = tripLocations.map(loc => 
    [Number(loc.latitude), Number(loc.longitude)]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trip Control Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant={isTracking ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isTracking ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  في مهمة
                </>
              ) : (
                'خامل'
              )}
            </Badge>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Route className="h-5 w-5 text-primary" />
                تتبع الرحلة
              </CardTitle>
              <CardDescription>تتبع مسارك أثناء توصيل الشحنات</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Display */}
          {isTracking && (
            <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">مدة الرحلة</span>
              </div>
              <p className="text-4xl font-mono font-bold text-primary">{formatTime(elapsedTime)}</p>
              {currentTrip?.shipment_number && (
                <Badge variant="outline" className="mt-2">
                  شحنة: {currentTrip.shipment_number}
                </Badge>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{calculateTotalDistance(tripLocations)}</p>
              <p className="text-xs text-muted-foreground">كم مقطوعة</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{tripLocations.length}</p>
              <p className="text-xs text-muted-foreground">نقطة تتبع</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">
                {tripLocations.length > 0 && tripLocations[tripLocations.length - 1].speed 
                  ? Math.round(tripLocations[tripLocations.length - 1].speed!) 
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">كم/ساعة</p>
            </div>
          </div>

          {/* Shipment Selection */}
          {!isTracking && (
            <div className="space-y-2">
              <label className="text-sm font-medium">ربط الرحلة بشحنة (اختياري)</label>
              <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر شحنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون ربط بشحنة</SelectItem>
                  {activeShipments.map(shipment => (
                    <SelectItem key={shipment.id} value={shipment.id}>
                      {shipment.shipment_number} - {shipment.generator?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={startTrip} className="flex-1" variant="eco">
                <Play className="h-4 w-4 ml-2" />
                بدء الرحلة
              </Button>
            ) : (
              <Button onClick={endTrip} variant="destructive" className="flex-1">
                <Pause className="h-4 w-4 ml-2" />
                إنهاء الرحلة
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
              <History className="h-4 w-4 ml-2" />
              السجل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      {(isTracking || tripLocations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right justify-end">
              <Target className="h-5 w-5 text-primary" />
              خريطة الرحلة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapContainer
                center={mapCenter}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {currentLocation && <MapPanner center={[currentLocation.lat, currentLocation.lng]} />}

                {/* Path */}
                {pathCoordinates.length > 1 && (
                  <Polyline
                    positions={pathCoordinates}
                    pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
                  />
                )}

                {/* Start marker */}
                {tripLocations.length > 0 && (
                  <Marker 
                    position={[Number(tripLocations[0].latitude), Number(tripLocations[0].longitude)]} 
                    icon={startIcon}
                  >
                    <Popup>
                      <div className="text-right" dir="rtl">
                        <p className="font-medium">نقطة البداية</p>
                        <p className="text-sm">{format(new Date(tripLocations[0].recorded_at), 'HH:mm:ss')}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Current position */}
                {currentLocation && (
                  <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentIcon}>
                    <Popup>
                      <div className="text-right" dir="rtl">
                        <p className="font-medium">موقعك الحالي</p>
                        <p className="text-sm">{new Date().toLocaleTimeString('ar-EG')}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Shipments */}
      {activeShipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right justify-end">
              <Package className="h-5 w-5 text-primary" />
              الشحنات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeShipments.map(shipment => (
                <div 
                  key={shipment.id} 
                  className={`p-4 rounded-lg border ${
                    currentTrip?.shipment_id === shipment.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(shipment.status)}
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{shipment.shipment_number}</span>
                      {currentTrip?.shipment_id === shipment.id && (
                        <Badge variant="default" className="text-xs">مرتبطة</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-right">
                      <span className="text-muted-foreground">من: </span>
                      <span>{shipment.generator?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">إلى: </span>
                      <span>{shipment.recycler?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Trips Summary */}
      {tripHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right justify-end">
              <Fuel className="h-5 w-5 text-primary" />
              رحلات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{tripHistory.length}</p>
                <p className="text-xs text-muted-foreground">رحلة</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {tripHistory.reduce((sum, t) => sum + t.distance_km, 0).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">كم إجمالي</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {Math.round(tripHistory.reduce((sum, t) => sum + t.duration_minutes, 0) / 60)}
                </p>
                <p className="text-xs text-muted-foreground">ساعة قيادة</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {tripHistory.reduce((sum, t) => sum + t.locations.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">نقطة تتبع</p>
              </div>
            </div>

            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {tripHistory.map((trip, index) => (
                  <div 
                    key={trip.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedHistoryTrip(trip);
                      setPlaybackIndex(0);
                      setShowHistoryDialog(true);
                    }}
                  >
                    <Button variant="ghost" size="sm">
                      عرض
                    </Button>
                    <div className="flex-1 text-right mr-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant="outline">{trip.distance_km} كم</Badge>
                        <span className="font-medium">
                          {format(new Date(trip.start_time), 'HH:mm')} - {format(new Date(trip.end_time!), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trip.duration_minutes} دقيقة • {trip.locations.length} نقطة
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Route className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Trip History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل الرحلة</DialogTitle>
          </DialogHeader>
          
          {selectedHistoryTrip && (
            <div className="space-y-4">
              {/* Trip Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedHistoryTrip.duration_minutes}</p>
                  <p className="text-xs text-muted-foreground">دقيقة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedHistoryTrip.distance_km}</p>
                  <p className="text-xs text-muted-foreground">كم</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedHistoryTrip.locations.length}</p>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">
                    {selectedHistoryTrip.distance_km > 0 && selectedHistoryTrip.duration_minutes > 0
                      ? Math.round((selectedHistoryTrip.distance_km / selectedHistoryTrip.duration_minutes) * 60)
                      : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">متوسط كم/س</p>
                </div>
              </div>

              {/* Playback Map */}
              <div className="h-[400px] rounded-lg overflow-hidden border">
                <MapContainer
                  center={selectedHistoryTrip.start_location 
                    ? [selectedHistoryTrip.start_location.lat, selectedHistoryTrip.start_location.lng]
                    : [30.0444, 31.2357]
                  }
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Full path */}
                  <Polyline
                    positions={selectedHistoryTrip.locations.map(l => [Number(l.latitude), Number(l.longitude)] as [number, number])}
                    pathOptions={{ color: '#9ca3af', weight: 3, opacity: 0.5 }}
                  />

                  {/* Played path */}
                  <Polyline
                    positions={selectedHistoryTrip.locations.slice(0, playbackIndex + 1).map(l => [Number(l.latitude), Number(l.longitude)] as [number, number])}
                    pathOptions={{ color: '#22c55e', weight: 4 }}
                  />

                  {/* Start */}
                  <Marker
                    position={[Number(selectedHistoryTrip.locations[0].latitude), Number(selectedHistoryTrip.locations[0].longitude)]}
                    icon={startIcon}
                  />

                  {/* End */}
                  <Marker
                    position={[
                      Number(selectedHistoryTrip.locations[selectedHistoryTrip.locations.length - 1].latitude),
                      Number(selectedHistoryTrip.locations[selectedHistoryTrip.locations.length - 1].longitude)
                    ]}
                    icon={endIcon}
                  />

                  {/* Current playback position */}
                  {selectedHistoryTrip.locations[playbackIndex] && (
                    <Marker
                      position={[
                        Number(selectedHistoryTrip.locations[playbackIndex].latitude),
                        Number(selectedHistoryTrip.locations[playbackIndex].longitude)
                      ]}
                      icon={currentIcon}
                    />
                  )}
                </MapContainer>
              </div>

              {/* Playback Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <Button variant="outline" size="icon" onClick={() => setPlaybackIndex(0)}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setPlaybackIndex(selectedHistoryTrip.locations.length - 1)}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">
                    {selectedHistoryTrip.locations[playbackIndex] && 
                      format(new Date(selectedHistoryTrip.locations[playbackIndex].recorded_at), 'HH:mm')}
                  </span>
                  <Slider
                    value={[playbackIndex]}
                    onValueChange={([val]) => setPlaybackIndex(val)}
                    max={selectedHistoryTrip.locations.length - 1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {format(new Date(selectedHistoryTrip.locations[selectedHistoryTrip.locations.length - 1].recorded_at), 'HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverTripTracker;
