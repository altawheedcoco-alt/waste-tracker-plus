import { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

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

interface MapboxDriverTripTrackerProps {
  driverId: string;
}

const MapboxDriverTripTracker = ({ driverId }: MapboxDriverTripTrackerProps) => {
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

  const defaultCenter = { lat: 30.0444, lng: 31.2357 };

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
            if (currentTripLocs.length > 1) {
              trips.push(createTripFromLocations(currentTripLocs, tripIndex++));
            }
            currentTripLocs = [loc];
          } else {
            currentTripLocs.push(loc);
          }
        });

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

  const mapCenter = currentLocation || (tripLocations.length > 0
    ? { lat: Number(tripLocations[0].latitude), lng: Number(tripLocations[0].longitude) }
    : defaultCenter);

  // GeoJSON for path
  const pathGeoJSON = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: tripLocations.map(loc => [Number(loc.longitude), Number(loc.latitude)]),
    },
  }), [tripLocations]);

  // GeoJSON for history playback
  const historyFullPathGeoJSON = useMemo(() => {
    if (!selectedHistoryTrip) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: selectedHistoryTrip.locations.map(l => [Number(l.longitude), Number(l.latitude)]),
      },
    };
  }, [selectedHistoryTrip]);

  const historyPlayedPathGeoJSON = useMemo(() => {
    if (!selectedHistoryTrip) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: selectedHistoryTrip.locations.slice(0, playbackIndex + 1).map(l => [Number(l.longitude), Number(l.latitude)]),
      },
    };
  }, [selectedHistoryTrip, playbackIndex]);

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
              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">المسافة: </span>
                  <span className="font-bold">{calculateTotalDistance(tripLocations).toFixed(2)} كم</span>
                </div>
                <div>
                  <span className="text-muted-foreground">النقاط: </span>
                  <span className="font-bold">{tripLocations.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Shipment Selection */}
          {!isTracking && activeShipments.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">ربط بشحنة (اختياري)</label>
              <Select value={selectedShipment} onValueChange={setSelectedShipment}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر شحنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون شحنة محددة</SelectItem>
                  {activeShipments.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipment_number} - {s.waste_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isTracking ? (
              <Button className="flex-1" onClick={startTrip}>
                <Play className="w-4 h-4 mr-2" />
                بدء الرحلة
              </Button>
            ) : (
              <Button className="flex-1" variant="destructive" onClick={endTrip}>
                <Pause className="w-4 h-4 mr-2" />
                إنهاء الرحلة
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
              <History className="w-4 h-4 mr-2" />
              السجل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Trip Map */}
      {isTracking && tripLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right justify-end">
              <Navigation className="h-5 w-5 text-primary" />
              خريطة الرحلة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <Map
                initialViewState={{
                  longitude: mapCenter.lng,
                  latitude: mapCenter.lat,
                  zoom: 15,
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
                locale={{
                  'NavigationControl.ZoomIn': 'تكبير',
                  'NavigationControl.ZoomOut': 'تصغير',
                }}
                onLoad={(e) => {
                  const map = e.target;
                  const arabicLayers = ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label', 'airport-label', 'poi-label', 'road-label'];
                  arabicLayers.forEach(layer => {
                    try { map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch {}
                  });
                }}
              >
                <NavigationControl position="bottom-right" />

                {/* Path */}
                {tripLocations.length > 1 && (
                  <Source id="path" type="geojson" data={pathGeoJSON}>
                    <Layer
                      id="path-line"
                      type="line"
                      paint={{
                        'line-color': '#3b82f6',
                        'line-width': 4,
                        'line-opacity': 0.8,
                      }}
                    />
                  </Source>
                )}

                {/* Start marker */}
                {tripLocations.length > 0 && (
                  <Marker
                    longitude={Number(tripLocations[0].longitude)}
                    latitude={Number(tripLocations[0].latitude)}
                    anchor="center"
                  >
                    <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">S</span>
                    </div>
                  </Marker>
                )}

                {/* Current position */}
                {currentLocation && (
                  <Marker
                    longitude={currentLocation.lng}
                    latitude={currentLocation.lat}
                    anchor="center"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" style={{ width: '24px', height: '24px', marginLeft: '-4px', marginTop: '-4px' }} />
                      <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                    </div>
                  </Marker>
                )}
              </Map>
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

      {/* Trip History */}
      {tripHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right justify-end">
              <History className="h-5 w-5 text-primary" />
              رحلات اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {tripHistory.map((trip, index) => (
                  <div
                    key={trip.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedHistoryTrip(trip);
                      setPlaybackIndex(0);
                      setShowHistoryDialog(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {trip.distance_km} كم
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {trip.duration_minutes} د
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">رحلة {index + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(trip.start_time), 'HH:mm', { locale: ar })}
                          {trip.end_time && ` - ${format(new Date(trip.end_time), 'HH:mm', { locale: ar })}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              تفاصيل الرحلة
            </DialogTitle>
          </DialogHeader>

          {selectedHistoryTrip && (
            <div className="space-y-4">
              {/* Trip stats */}
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
                <Map
                  initialViewState={{
                    longitude: selectedHistoryTrip.start_location?.lng || defaultCenter.lng,
                    latitude: selectedHistoryTrip.start_location?.lat || defaultCenter.lat,
                    zoom: 14,
                  }}
                  mapboxAccessToken={MAPBOX_TOKEN}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  style={{ width: '100%', height: '100%' }}
                  attributionControl={false}
                  onLoad={(e) => {
                    const map = e.target;
                    const arabicLayers = ['country-label', 'state-label', 'settlement-label', 'poi-label', 'road-label'];
                    arabicLayers.forEach(layer => {
                      try { map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch {}
                    });
                  }}
                >
                  <NavigationControl position="bottom-right" />

                  {/* Full path (gray) */}
                  {historyFullPathGeoJSON && (
                    <Source id="full-path" type="geojson" data={historyFullPathGeoJSON}>
                      <Layer
                        id="full-path-line"
                        type="line"
                        paint={{
                          'line-color': '#9ca3af',
                          'line-width': 3,
                          'line-opacity': 0.5,
                        }}
                      />
                    </Source>
                  )}

                  {/* Played path (green) */}
                  {historyPlayedPathGeoJSON && (
                    <Source id="played-path" type="geojson" data={historyPlayedPathGeoJSON}>
                      <Layer
                        id="played-path-line"
                        type="line"
                        paint={{
                          'line-color': '#22c55e',
                          'line-width': 4,
                        }}
                      />
                    </Source>
                  )}

                  {/* Start */}
                  <Marker
                    longitude={Number(selectedHistoryTrip.locations[0].longitude)}
                    latitude={Number(selectedHistoryTrip.locations[0].latitude)}
                    anchor="center"
                  >
                    <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">S</span>
                    </div>
                  </Marker>

                  {/* End */}
                  <Marker
                    longitude={Number(selectedHistoryTrip.locations[selectedHistoryTrip.locations.length - 1].longitude)}
                    latitude={Number(selectedHistoryTrip.locations[selectedHistoryTrip.locations.length - 1].latitude)}
                    anchor="center"
                  >
                    <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">E</span>
                    </div>
                  </Marker>

                  {/* Current playback position */}
                  {selectedHistoryTrip.locations[playbackIndex] && (
                    <Marker
                      longitude={Number(selectedHistoryTrip.locations[playbackIndex].longitude)}
                      latitude={Number(selectedHistoryTrip.locations[playbackIndex].latitude)}
                      anchor="center"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" style={{ width: '24px', height: '24px', marginLeft: '-4px', marginTop: '-4px' }} />
                        <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                      </div>
                    </Marker>
                  )}
                </Map>
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

export default MapboxDriverTripTracker;
