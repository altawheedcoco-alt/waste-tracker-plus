import { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, Clock, Navigation, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface LocationLog {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

interface MapboxDriverLocationHistoryProps {
  driverId: string;
  driverName: string;
  date?: Date;
  onClose?: () => void;
}

const MapboxDriverLocationHistory = ({ driverId, driverName, date = new Date(), onClose }: MapboxDriverLocationHistoryProps) => {
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const defaultCenter = { lat: 30.0444, lng: 31.2357 };

  useEffect(() => {
    fetchLocationHistory();
  }, [driverId, date]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && locations.length > 0) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= locations.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, locations.length]);

  const fetchLocationHistory = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('driver_location_logs')
        .select('*')
        .eq('driver_id', driverId)
        .gte('recorded_at', startOfDay.toISOString())
        .lte('recorded_at', endOfDay.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching location history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = () => {
    if (locations.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      total += getDistanceFromLatLonInKm(
        Number(prev.latitude), Number(prev.longitude),
        Number(curr.latitude), Number(curr.longitude)
      );
    }
    return total.toFixed(2);
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const mapCenter = locations.length > 0 
    ? { lat: Number(locations[0].latitude), lng: Number(locations[0].longitude) }
    : defaultCenter;

  // GeoJSON for full path
  const fullPathGeoJSON = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: locations.map(loc => [Number(loc.longitude), Number(loc.latitude)]),
    },
  }), [locations]);

  // GeoJSON for played path
  const playedPathGeoJSON = useMemo(() => ({
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: locations.slice(0, playbackIndex + 1).map(loc => [Number(loc.longitude), Number(loc.latitude)]),
    },
  }), [locations, playbackIndex]);

  const currentPosition = locations[playbackIndex] 
    ? { lat: Number(locations[playbackIndex].latitude), lng: Number(locations[playbackIndex].longitude) }
    : null;

  return (
    <Card className="w-full">
      <CardHeader className="text-right pb-2">
        <div className="flex items-center justify-between">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          )}
          <div>
            <CardTitle className="text-lg">سجل مواقع {driverName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(date, 'EEEE، d MMMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{locations.length}</p>
            <p className="text-xs text-muted-foreground">نقطة مسجلة</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{calculateDistance()}</p>
            <p className="text-xs text-muted-foreground">كم مقطوعة</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">
              {locations.length > 0 
                ? Math.round((new Date(locations[locations.length - 1].recorded_at).getTime() - 
                    new Date(locations[0].recorded_at).getTime()) / (1000 * 60 * 60))
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">ساعات نشاط</p>
          </div>
        </div>

        {/* Map */}
        {loading ? (
          <div className="h-[400px] rounded-lg bg-muted flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : locations.length === 0 ? (
          <div className="h-[400px] rounded-lg bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بيانات مواقع لهذا اليوم</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <Map
              initialViewState={{
                longitude: mapCenter.lng,
                latitude: mapCenter.lat,
                zoom: 13,
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
              <Source id="full-path" type="geojson" data={fullPathGeoJSON}>
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

              {/* Played path (green) */}
              <Source id="played-path" type="geojson" data={playedPathGeoJSON}>
                <Layer
                  id="played-path-line"
                  type="line"
                  paint={{
                    'line-color': '#22c55e',
                    'line-width': 4,
                  }}
                />
              </Source>

              {/* Start marker */}
              <Marker
                longitude={Number(locations[0].longitude)}
                latitude={Number(locations[0].latitude)}
                anchor="center"
              >
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
              </Marker>

              {/* End marker */}
              {locations.length > 1 && (
                <Marker
                  longitude={Number(locations[locations.length - 1].longitude)}
                  latitude={Number(locations[locations.length - 1].latitude)}
                  anchor="center"
                >
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                </Marker>
              )}

              {/* Current playback position */}
              {currentPosition && (
                <Marker
                  longitude={currentPosition.lng}
                  latitude={currentPosition.lat}
                  anchor="bottom"
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: '16px solid #3b82f6',
                      filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
                    }}
                  />
                </Marker>
              )}
            </Map>
          </div>
        )}

        {/* Playback controls */}
        {locations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlaybackIndex(0)}
                disabled={playbackIndex === 0}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlaybackIndex(locations.length - 1)}
                disabled={playbackIndex === locations.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 text-left">
                {locations[playbackIndex] && format(new Date(locations[playbackIndex].recorded_at), 'HH:mm')}
              </span>
              <Slider
                value={[playbackIndex]}
                onValueChange={([value]) => setPlaybackIndex(value)}
                max={locations.length - 1}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-16 text-right">
                {locations.length > 0 && format(new Date(locations[locations.length - 1].recorded_at), 'HH:mm')}
              </span>
            </div>
          </div>
        )}

        {/* Timeline */}
        {locations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-right">سجل الأوقات</h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {locations.filter((_, i) => i % Math.max(1, Math.floor(locations.length / 10)) === 0 || i === locations.length - 1).map((loc, index) => (
                  <div
                    key={loc.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-right"
                    onClick={() => {
                      const actualIndex = locations.findIndex(l => l.id === loc.id);
                      setPlaybackIndex(actualIndex);
                    }}
                  >
                    <Badge variant={index === 0 ? 'default' : 'outline'} className="text-xs">
                      {format(new Date(loc.recorded_at), 'HH:mm:ss')}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex-1">
                      {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                    </span>
                    {loc.speed && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(loc.speed)} كم/س
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapboxDriverLocationHistory;
