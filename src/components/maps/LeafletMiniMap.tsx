import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';

// Fix default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface LeafletMiniMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: string;
  className?: string;
  label?: string;
  [key: string]: any;
}

const LeafletMiniMap = ({ latitude, longitude, zoom = 14, height = '200px', className, label }: LeafletMiniMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const lat = latitude || EGYPT_CENTER[0];
    const lng = longitude || EGYPT_CENTER[1];
    const z = latitude && longitude ? zoom : DEFAULT_ZOOM;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([lat, lng], z);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);

    if (latitude && longitude) {
      const marker = L.marker([lat, lng]).addTo(map);
      if (label) marker.bindPopup(label).openPopup();
    }

    mapInstanceRef.current = map;

    // Fix grey tiles when inside dialogs/tabs
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, zoom, label]);

  return <div ref={mapRef} className={cn('rounded-lg border border-border', className)} style={{ height }} />;
};

export default LeafletMiniMap;
