import { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

const createCircleIcon = (color: string, size = 20) => {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createPinIcon = (color: string) => {
  return L.divIcon({
    html: `<svg width="25" height="41" viewBox="0 0 25 41"><path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${color}" stroke="white" stroke-width="2"/><circle cx="12.5" cy="12.5" r="5" fill="white"/></svg>`,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41],
  });
};

const reverseGeocodeOSM = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`);
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

// Egypt bounds
const EGYPT_BOUNDS: L.LatLngBoundsExpression = [[22.0, 24.7], [31.7, 37.0]];

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
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedMarkerRef = useRef<L.Marker | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      maxBounds: EGYPT_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 5,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    if (clickable && onPositionSelect) {
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const address = await reverseGeocodeOSM(lat, lng);
        onPositionSelect({ lat, lng }, address);
      });
    }

    mapRef.current = map;
    setReady(true);
    onMapLoad?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], undefined, { animate: true });
    }
  }, [center.lat, center.lng]);

  // Update zoom
  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  // Update markers
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markers.forEach(m => {
      const icon = createCircleIcon(colorMap[m.color || 'blue']);
      const marker = L.marker([m.position.lat, m.position.lng], { icon });
      if (m.title) marker.bindPopup(m.title);
      markersLayerRef.current!.addLayer(marker);
    });
  }, [markers]);

  // Handle selected position
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
    if (selectedPosition) {
      selectedMarkerRef.current = L.marker(
        [selectedPosition.lat, selectedPosition.lng],
        { icon: createPinIcon('#ef4444') }
      ).addTo(mapRef.current);
      mapRef.current.setView([selectedPosition.lat, selectedPosition.lng], 15);
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
