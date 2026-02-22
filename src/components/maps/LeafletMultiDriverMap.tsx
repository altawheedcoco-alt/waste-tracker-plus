import { useRef, useEffect, memo } from 'react';
import L from 'leaflet';

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
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapRef.current);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (markers.length === 0) return;

    const bounds = L.latLngBounds([]);

    markers.forEach(m => {
      const isAvailable = m.label === '🟢';
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${isAvailable ? '#22c55e' : '#eab308'};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM20 8l3 4v5h-2a3 3 0 1 1-6 0H9a3 3 0 1 1-6 0H1V6c0-1.11.89-2 2-2h14v4h3z"/></svg></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([m.position.lat, m.position.lng], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`<b>${m.title}</b><br/>${isAvailable ? 'متاح' : 'في مهمة'}`);

      if (onMarkerClick && m.id) {
        marker.on('click', () => onMarkerClick(m.id!));
      }

      markersRef.current.push(marker);
      bounds.extend([m.position.lat, m.position.lng]);
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers, onMarkerClick]);

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
  );
});

LeafletMultiDriverMap.displayName = 'LeafletMultiDriverMap';
export default LeafletMultiDriverMap;
