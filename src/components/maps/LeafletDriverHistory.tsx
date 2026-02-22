import { useState, useRef, useEffect, memo } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Route, Calendar, Clock, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LocationLog { id: string; latitude: number; longitude: number; recorded_at: string; speed?: number; }

interface LeafletDriverHistoryProps {
  driverId: string;
  driverName?: string;
  date?: Date;
  className?: string;
  height?: string;
}

const createCircleIcon = (color: string) => L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: '', iconSize: [20, 20], iconAnchor: [10, 10],
});

const currentIcon = L.divIcon({
  html: `<div style="width:24px;height:40px;"><svg width="24" height="40" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#8b5cf6" stroke="white" stroke-width="2"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg></div>`,
  className: '', iconSize: [24, 40], iconAnchor: [12, 40],
});

const LeafletDriverHistory = memo(({
  driverId, driverName, date = new Date(), className = '', height = '500px',
}: LeafletDriverHistoryProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const s = new Date(date); s.setHours(0,0,0,0);
        const e = new Date(date); e.setHours(23,59,59,999);
        const { data, error } = await supabase.from('driver_location_logs')
          .select('id, latitude, longitude, recorded_at, speed')
          .eq('driver_id', driverId).gte('recorded_at', s.toISOString()).lte('recorded_at', e.toISOString())
          .order('recorded_at', { ascending: true });
        if (error) throw error;
        setLocations(data || []);
      } catch (error) { console.error('Error fetching location history:', error); }
      finally { setLoading(false); }
    };
    if (driverId) fetchHistory();
  }, [driverId, date]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [30.0444, 31.2357], zoom: 12 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current || locations.length === 0) return;
    layerRef.current.clearLayers();
    const path: L.LatLngExpression[] = locations.map(l => [l.latitude, l.longitude]);
    L.polyline(path, { color: '#22c55e', weight: 4, opacity: 0.8 }).addTo(layerRef.current);
    L.marker(path[0] as L.LatLngExpression, { icon: createCircleIcon('#22c55e') }).bindPopup('نقطة البداية').addTo(layerRef.current);
    L.marker(path[path.length - 1] as L.LatLngExpression, { icon: createCircleIcon('#ef4444') }).bindPopup('نقطة النهاية').addTo(layerRef.current);
    mapRef.current.fitBounds(L.latLngBounds(path as L.LatLngExpression[]), { padding: [50, 50] });
  }, [locations]);

  useEffect(() => {
    if (isPlaying && locations.length > 0) {
      animationRef.current = setInterval(() => {
        setCurrentIndex(prev => { if (prev >= locations.length - 1) { setIsPlaying(false); return 0; } return prev + 1; });
      }, 500);
    } else if (animationRef.current) clearInterval(animationRef.current);
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [isPlaying, locations.length]);

  useEffect(() => {
    if (!mapRef.current || locations.length === 0 || currentIndex === 0) return;
    if (currentMarkerRef.current) currentMarkerRef.current.remove();
    const loc = locations[currentIndex];
    currentMarkerRef.current = L.marker([loc.latitude, loc.longitude], { icon: currentIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
    mapRef.current.panTo([loc.latitude, loc.longitude]);
  }, [currentIndex, locations]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2"><Route className="w-5 h-5 text-primary" />سجل الحركة{driverName && <span className="font-normal text-muted-foreground">- {driverName}</span>}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1"><Calendar className="w-3 h-3" />{format(date, 'yyyy/MM/dd', { locale: ar })}</Badge>
            <Badge variant="secondary" className="gap-1"><MapPin className="w-3 h-3" />{locations.length} نقطة</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : locations.length === 0 ? (
          <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height }}><div className="text-center text-muted-foreground"><MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">لا توجد بيانات موقع لهذا اليوم</p></div></div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)} className="gap-1">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{isPlaying ? 'إيقاف' : 'تشغيل'}</Button>
              {isPlaying && <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />{format(new Date(locations[currentIndex].recorded_at), 'hh:mm:ss a', { locale: ar })}</Badge>}
            </div>
            <div className="rounded-lg overflow-hidden border" style={{ height }}><div ref={containerRef} className="w-full h-full" /></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

LeafletDriverHistory.displayName = 'LeafletDriverHistory';
export default LeafletDriverHistory;
