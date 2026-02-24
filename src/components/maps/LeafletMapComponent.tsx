import { useEffect, useRef, useState, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface LeafletMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    color?: 'blue' | 'green' | 'red' | 'orange';
  }>;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (position: { lat: number; lng: number }, address?: string) => void;
  onMapLoad?: (map: mapboxgl.Map) => void;
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

const reverseGeocodeMapbox = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

const LeafletMapComponent = memo(({
  center = { lat: 26.8, lng: 30.8 },
  zoom = 6,
  markers = [],
  selectedPosition,
  onPositionSelect,
  onMapLoad,
  clickable = true,
  className = '',
  height = '400px',
}: LeafletMapComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize map
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

    if (clickable && onPositionSelect) {
      map.on('click', async (e) => {
        const { lat, lng } = e.lngLat;
        const address = await reverseGeocodeMapbox(lat, lng);
        onPositionSelect({ lat, lng }, address);
      });
    }

    map.on('load', () => {
      setReady(true);
      onMapLoad?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.flyTo({ center: [center.lng, center.lat], duration: 500 });
    }
  }, [center.lat, center.lng]);

  // Update zoom
  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  // Update markers
  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    markers.forEach(m => {
      const color = colorMap[m.color || 'blue'];
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([m.position.lng, m.position.lat]);
      if (m.title) {
        marker.setPopup(new mapboxgl.Popup({ offset: 12 }).setText(m.title));
      }
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [markers]);

  // Handle selected position
  useEffect(() => {
    if (!mapRef.current) return;
    selectedMarkerRef.current?.remove();
    selectedMarkerRef.current = null;

    if (selectedPosition) {
      const el = document.createElement('div');
      el.innerHTML = `<svg width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#ef4444" stroke="white" stroke-width="2"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg>`;
      selectedMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([selectedPosition.lng, selectedPosition.lat])
        .addTo(mapRef.current);
      mapRef.current.flyTo({ center: [selectedPosition.lng, selectedPosition.lat], zoom: 15, duration: 500 });
    }
  }, [selectedPosition]);

  return (
    <div
      ref={containerRef}
      className={cn('rounded-lg overflow-hidden', className)}
      style={{ height, width: '100%' }}
    />
  );
});

LeafletMapComponent.displayName = 'LeafletMapComponent';

export default LeafletMapComponent;
