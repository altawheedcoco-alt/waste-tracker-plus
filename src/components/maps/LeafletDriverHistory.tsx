import { useEffect, useRef, memo, useState, useCallback } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface Props {
  driverId: string;
  driverName: string;
  date: Date;
  path?: [number, number][];
  height?: string;
  className?: string;
  [key: string]: any;
}

const LeafletDriverHistory = memo(({ driverId, driverName, date, path: externalPath, height = '400px', className }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [path, setPath] = useState<[number, number][]>(externalPath || []);

  // Fetch history from DB if no external path provided
  const fetchHistory = useCallback(async () => {
    if (externalPath) return;
    if (!driverId || !date) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      const { data } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude')
        .eq('driver_id', driverId)
        .gte('recorded_at', startOfDay.toISOString())
        .lte('recorded_at', endOfDay.toISOString())
        .order('recorded_at', { ascending: true })
        .limit(500);

      if (data && data.length > 0) {
        setPath(data.map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]));
      } else {
        setPath([]);
      }
    } catch (err) {
      console.error('Error fetching driver history:', err);
    }
  }, [driverId, date, externalPath]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: true }).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapInstanceRef.current = map;

    if (path.length > 1) {
      const polyline = L.polyline(path, { color: '#8b5cf6', weight: 3, opacity: 0.8 }).addTo(map);
      const startIcon = L.divIcon({
        html: '<div style="background:#22c55e;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
        iconSize: [16, 16], className: '',
      });
      const endIcon = L.divIcon({
        html: '<div style="background:#ef4444;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>',
        iconSize: [16, 16], className: '',
      });
      L.marker(path[0], { icon: startIcon }).addTo(map).bindPopup(`بداية رحلة ${driverName}`);
      L.marker(path[path.length - 1], { icon: endIcon }).addTo(map).bindPopup(`نهاية رحلة ${driverName}`);
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }

    // Fix grey tiles: invalidateSize after container is fully rendered (especially inside dialogs)
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 600),
    ];

    // Also listen for resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapRef.current) resizeObserver.observe(mapRef.current);

    return () => {
      timers.forEach(clearTimeout);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [path, driverName]);

  return (
    <div>
      {path.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          لا توجد بيانات مسار لهذا اليوم
        </div>
      )}
      <div ref={mapRef} className={className} style={{ height, minHeight: '300px' }} />
    </div>
  );
});

LeafletDriverHistory.displayName = 'LeafletDriverHistory';
export default LeafletDriverHistory;
