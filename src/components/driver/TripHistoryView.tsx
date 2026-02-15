import { useState, useEffect, useRef, useCallback } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import {
  MapPin,
  Clock,
  Navigation,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Route,
  Calendar as CalendarIcon,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LocationLog {
  id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  accuracy: number | null;
}

interface TripSession {
  id: string;
  start_time: string;
  end_time: string;
  start_location: { lat: number; lng: number };
  end_location: { lat: number; lng: number };
  distance_km: number;
  duration_minutes: number;
  locations: LocationLog[];
  avg_speed: number;
}

interface DaySummary {
  date: Date;
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  trips: TripSession[];
}

interface TripHistoryViewProps {
  driverId: string;
}

const TripHistoryView = ({ driverId }: TripHistoryViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTripDialog, setShowTripDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripSession | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [weekSummary, setWeekSummary] = useState<{ date: string; distance: number; trips: number }[]>([]);

  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineFullRef = useRef<google.maps.Polyline | null>(null);
  const polylinePlayedRef = useRef<google.maps.Polyline | null>(null);
  const playbackMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (driverId) {
      fetchDayData(selectedDate);
      fetchWeekSummary();
    }
  }, [driverId, selectedDate]);

  // Playback effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && selectedTrip && selectedTrip.locations.length > 0) {
      interval = setInterval(() => {
        setPlaybackIndex(prev => {
          if (prev >= selectedTrip.locations.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedTrip]);

  // Initialize map when dialog opens
  useEffect(() => {
    if (showTripDialog && isLoaded && mapContainerRef.current && !mapRef.current && selectedTrip) {
      const centerLat = (selectedTrip.start_location.lat + selectedTrip.end_location.lat) / 2;
      const centerLng = (selectedTrip.start_location.lng + selectedTrip.end_location.lng) / 2;

      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: false,
      });

      // Draw trip on map
      drawTripOnMap(selectedTrip);
    }
  }, [showTripDialog, isLoaded, selectedTrip]);

  // Update playback position
  useEffect(() => {
    if (selectedTrip && mapRef.current && selectedTrip.locations[playbackIndex]) {
      const currentLoc = selectedTrip.locations[playbackIndex];
      const pos = { lat: Number(currentLoc.latitude), lng: Number(currentLoc.longitude) };

      // Update played path
      if (polylinePlayedRef.current) {
        const playedPath = selectedTrip.locations.slice(0, playbackIndex + 1).map(l => ({
          lat: Number(l.latitude),
          lng: Number(l.longitude),
        }));
        polylinePlayedRef.current.setPath(playedPath);
      }

      // Update playback marker
      if (playbackMarkerRef.current) {
        playbackMarkerRef.current.setPosition(pos);
      }
    }
  }, [playbackIndex, selectedTrip]);

  // Cleanup on dialog close
  useEffect(() => {
    if (!showTripDialog) {
      cleanupMap();
    }
  }, [showTripDialog]);

  const cleanupMap = useCallback(() => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    polylineFullRef.current?.setMap(null);
    polylineFullRef.current = null;
    polylinePlayedRef.current?.setMap(null);
    polylinePlayedRef.current = null;
    playbackMarkerRef.current?.setMap(null);
    playbackMarkerRef.current = null;
    mapRef.current = null;
  }, []);

  const drawTripOnMap = (trip: TripSession) => {
    if (!mapRef.current) return;

    // Full path (gray)
    const fullPath = trip.locations.map(l => ({
      lat: Number(l.latitude),
      lng: Number(l.longitude),
    }));

    polylineFullRef.current = new google.maps.Polyline({
      path: fullPath,
      strokeColor: '#9ca3af',
      strokeOpacity: 0.5,
      strokeWeight: 3,
      map: mapRef.current,
    });

    // Played path (green)
    polylinePlayedRef.current = new google.maps.Polyline({
      path: fullPath.slice(0, 1),
      strokeColor: '#22c55e',
      strokeOpacity: 1,
      strokeWeight: 4,
      map: mapRef.current,
    });

    // Start marker
    const startMarker = new google.maps.Marker({
      position: trip.start_location,
      map: mapRef.current,
      label: {
        text: 'S',
        color: 'white',
        fontWeight: 'bold',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#22c55e',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
    });
    markersRef.current.push(startMarker);

    // End marker
    const endMarker = new google.maps.Marker({
      position: trip.end_location,
      map: mapRef.current,
      label: {
        text: 'E',
        color: 'white',
        fontWeight: 'bold',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
    });
    markersRef.current.push(endMarker);

    // Playback marker
    playbackMarkerRef.current = new google.maps.Marker({
      position: trip.start_location,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
      },
    });

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    fullPath.forEach(p => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 50);
  };

  const fetchWeekSummary = async () => {
    const summaries: { date: string; distance: number; trips: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const { data } = await supabase
        .from('driver_location_logs')
        .select('*')
        .eq('driver_id', driverId)
        .gte('recorded_at', start.toISOString())
        .lte('recorded_at', end.toISOString())
        .order('recorded_at', { ascending: true });

      if (data && data.length > 1) {
        const trips = groupLocationsIntoTrips(data as LocationLog[]);
        const totalDistance = trips.reduce((sum, t) => sum + t.distance_km, 0);
        summaries.push({
          date: format(date, 'EEE', { locale: ar }),
          distance: Math.round(totalDistance * 10) / 10,
          trips: trips.length,
        });
      } else {
        summaries.push({
          date: format(date, 'EEE', { locale: ar }),
          distance: 0,
          trips: 0,
        });
      }
    }

    setWeekSummary(summaries);
  };

  const fetchDayData = async (date: Date) => {
    setLoading(true);
    try {
      const start = startOfDay(date);
      const end = endOfDay(date);

      const { data } = await supabase
        .from('driver_location_logs')
        .select('*')
        .eq('driver_id', driverId)
        .gte('recorded_at', start.toISOString())
        .lte('recorded_at', end.toISOString())
        .order('recorded_at', { ascending: true });

      if (data && data.length > 0) {
        const trips = groupLocationsIntoTrips(data);
        const totalDistance = trips.reduce((sum, t) => sum + t.distance_km, 0);
        const totalDuration = trips.reduce((sum, t) => sum + t.duration_minutes, 0);

        setDaySummary({
          date,
          totalTrips: trips.length,
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalDuration,
          trips,
        });
      } else {
        setDaySummary({
          date,
          totalTrips: 0,
          totalDistance: 0,
          totalDuration: 0,
          trips: [],
        });
      }
    } catch (error) {
      console.error('Error fetching day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupLocationsIntoTrips = (locations: LocationLog[]): TripSession[] => {
    if (locations.length < 2) return [];

    const trips: TripSession[] = [];
    let currentTripLocs: LocationLog[] = [];
    let tripIndex = 0;

    locations.forEach((loc, index) => {
      if (index === 0) {
        currentTripLocs.push(loc);
        return;
      }

      const prevTime = new Date(locations[index - 1].recorded_at).getTime();
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

    return trips;
  };

  const createTripFromLocations = (locations: LocationLog[], index: number): TripSession => {
    const distance = calculateTotalDistance(locations);
    const startTime = new Date(locations[0].recorded_at);
    const endTime = new Date(locations[locations.length - 1].recorded_at);
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const avgSpeed = durationMinutes > 0 ? Math.round((distance / durationMinutes) * 60) : 0;

    return {
      id: `trip-${index}`,
      start_time: locations[0].recorded_at,
      end_time: locations[locations.length - 1].recorded_at,
      start_location: { lat: Number(locations[0].latitude), lng: Number(locations[0].longitude) },
      end_location: { lat: Number(locations[locations.length - 1].latitude), lng: Number(locations[locations.length - 1].longitude) },
      distance_km: Math.round(distance * 100) / 100,
      duration_minutes: durationMinutes,
      locations,
      avg_speed: avgSpeed,
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
    return total;
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

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const openTripDetails = (trip: TripSession) => {
    setSelectedTrip(trip);
    setPlaybackIndex(0);
    setIsPlaying(false);
    setShowTripDialog(true);
  };

  const maxWeekDistance = Math.max(...weekSummary.map(d => d.distance), 1);

  return (
    <div className="space-y-6">
      {/* Week Overview Chart */}
      <Card>
        <CardHeader className="text-right pb-2">
          <CardTitle className="text-lg flex items-center gap-2 justify-end">
            <TrendingUp className="h-5 w-5 text-primary" />
            نظرة على الأسبوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-24">
            {weekSummary.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-primary/20 rounded-t relative overflow-hidden"
                  style={{ height: `${Math.max((day.distance / maxWeekDistance) * 80, 4)}px` }}
                >
                  <div 
                    className="absolute bottom-0 w-full bg-primary transition-all"
                    style={{ height: '100%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.date}</span>
                <span className="text-xs font-medium">{day.distance}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">المسافة بالكيلومتر</p>
        </CardContent>
      </Card>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} disabled={selectedDate >= new Date()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(selectedDate, 'EEEE، d MMMM yyyy', { locale: ar })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day Summary */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : daySummary ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Route className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{daySummary.totalTrips}</p>
                <p className="text-xs text-muted-foreground">رحلة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Navigation className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{daySummary.totalDistance}</p>
                <p className="text-xs text-muted-foreground">كيلومتر</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{daySummary.totalDuration}</p>
                <p className="text-xs text-muted-foreground">دقيقة</p>
              </CardContent>
            </Card>
          </div>

          {/* Trips List */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="text-lg">الرحلات</CardTitle>
              <CardDescription>
                {daySummary.totalTrips > 0 
                  ? `${daySummary.totalTrips} رحلة في هذا اليوم`
                  : 'لا توجد رحلات مسجلة في هذا اليوم'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {daySummary.trips.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {daySummary.trips.map((trip, index) => (
                      <div 
                        key={trip.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => openTripDetails(trip)}
                      >
                        <Button variant="outline" size="sm">
                          عرض المسار
                        </Button>
                        <div className="flex-1 text-right mr-4">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Badge variant="outline">{trip.distance_km} كم</Badge>
                            <span className="font-semibold">
                              رحلة {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 justify-end text-sm text-muted-foreground">
                            <span>{trip.duration_minutes} دقيقة</span>
                            <span>•</span>
                            <span>{trip.avg_speed} كم/س</span>
                            <span>•</span>
                            <span>
                              {format(new Date(trip.start_time), 'hh:mm a')} - {format(new Date(trip.end_time), 'hh:mm a')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {trip.locations.length} نقطة تتبع
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Route className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد رحلات مسجلة</p>
                  <p className="text-sm">ابدأ رحلة جديدة من تبويب "تتبع الرحلات"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Trip Details Dialog */}
      <Dialog open={showTripDialog} onOpenChange={setShowTripDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل الرحلة</DialogTitle>
          </DialogHeader>
          
          {selectedTrip && (
            <div className="space-y-4">
              {/* Trip Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedTrip.duration_minutes}</p>
                  <p className="text-xs text-muted-foreground">دقيقة</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedTrip.distance_km}</p>
                  <p className="text-xs text-muted-foreground">كم</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Route className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedTrip.avg_speed}</p>
                  <p className="text-xs text-muted-foreground">كم/س</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{selectedTrip.locations.length}</p>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedTrip.start_time), 'hh:mm a')}
                  </span>
                  <div className="flex items-center gap-2">
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
                      onClick={() => setPlaybackIndex(selectedTrip.locations.length - 1)}
                      disabled={playbackIndex === selectedTrip.locations.length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedTrip.end_time), 'hh:mm a')}
                  </span>
                </div>
                <Slider
                  value={[playbackIndex]}
                  onValueChange={([value]) => setPlaybackIndex(value)}
                  max={selectedTrip.locations.length - 1}
                  step={1}
                  className="w-full"
                />
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {selectedTrip.locations[playbackIndex] && format(new Date(selectedTrip.locations[playbackIndex].recorded_at), 'hh:mm:ss a')}
                </p>
              </div>

              {/* Google Map */}
              <div className="h-[400px] rounded-lg overflow-hidden border">
                {isLoaded ? (
                  <div ref={mapContainerRef} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripHistoryView;
