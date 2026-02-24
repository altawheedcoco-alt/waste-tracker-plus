import { useRef, useEffect, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface DriverMarker {
  position: { lat: number; lng: number };
  title: string;
  label: string;
  id?: string;
}

interface LeafletMultiDriverMapProps {
  markers: DriverMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
}

const LeafletMultiDriverMap = memo(({
  markers,
  center = { lat: 30.0444, lng: 31.2357 },
  zoom = 10,
  height = '350px',
  onMarkerClick,
}: LeafletMultiDriverMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [center.lng, center.lat],
      zoom,
      maxBounds: [
        [EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]],
        [EGYPT_BOUNDS[2], EGYPT_BOUNDS[3]],
      ],
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (markers.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    markers.forEach(m => {
      const isAvailable = m.label === '🟢';
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:${isAvailable ? '#22c55e' : '#eab308'};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 1 1-6 0H9a3 3 0 1 1-6 0H1V6c0-1.11.89-2 2-2h14v4h3z"/></svg></div>`;

      const popup = new mapboxgl.Popup({ offset: 20, maxWidth: '200px' })
        .setHTML(`<div style="direction:rtl;text-align:right;"><b>${m.title}</b><br/>${isAvailable ? '✅ متاح' : '🟡 في مهمة'}</div>`);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.position.lng, m.position.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      if (onMarkerClick && m.id) {
        el.addEventListener('click', () => onMarkerClick(m.id!));
      }

      markersRef.current.push(marker);
      bounds.extend([m.position.lng, m.position.lat]);
    });

    mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 14 });
  }, [markers, onMarkerClick]);

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
  );
});

LeafletMultiDriverMap.displayName = 'LeafletMultiDriverMap';
export default LeafletMultiDriverMap;
