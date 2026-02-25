import { useEffect, useRef, memo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import {
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  EGYPT_BOUNDS,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  reverseGeocodeOSM,
} from '@/lib/leafletConfig';

interface MapboxMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    color?: 'blue' | 'green' | 'red' | 'orange';
  }>;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (position: { lat: number; lng: number }, address?: string) => void;
  onMapLoad?: (map: L.Map) => void;
  clickable?: boolean;
  className?: string;
  height?: string;
}

const colorMap: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
};

const MapboxMapComponent = memo(({
  center = { lat: 26.8, lng: 30.8 },
  zoom = DEFAULT_ZOOM,
  markers = [],
  selectedPosition,
  onPositionSelect,
  onMapLoad,
  clickable = true,
  className = '',
  height = '400px',
}: MapboxMapComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const onPositionSelectRef = useRef(onPositionSelect);
  onPositionSelectRef.current = onPositionSelect;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: L.latLngBounds(EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]),
    });

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);

    if (clickable) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const address = await reverseGeocodeOSM(lat, lng);
        onPositionSelectRef.current?.({ lat, lng }, address);
      });
    }

    mapRef.current = map;
    onMapLoad?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    mapRef.current?.setView([center.lat, center.lng], undefined, { animate: true });
  }, [center.lat, center.lng]);

  // Update zoom
  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  // Update markers
  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (!mapRef.current) return;

    markers.forEach(m => {
      const color = colorMap[m.color || 'blue'];
      const icon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([m.position.lat, m.position.lng], { icon }).addTo(mapRef.current!);
      if (m.title) marker.bindPopup(m.title);
      markersRef.current.push(marker);
    });
  }, [markers]);

  // Handle selected position
  useEffect(() => {
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
    if (!mapRef.current || !selectedPosition) return;

    const icon = L.divIcon({
      html: `<svg width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#ef4444" stroke="white" stroke-width="2"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg>`,
      className: '',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    selectedMarkerRef.current = L.marker([selectedPosition.lat, selectedPosition.lng], { icon }).addTo(mapRef.current);
    mapRef.current.setView([selectedPosition.lat, selectedPosition.lng], 15, { animate: true });
  }, [selectedPosition]);

  return (
    <div
      ref={containerRef}
      className={cn('rounded-lg overflow-hidden', className)}
      style={{ height, width: '100%' }}
    />
  );
});

MapboxMapComponent.displayName = 'MapboxMapComponent';
export default MapboxMapComponent;
