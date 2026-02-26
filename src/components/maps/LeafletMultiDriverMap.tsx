import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface DriverPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isOnline?: boolean;
  vehiclePlate?: string;
}

interface MapMarker {
  position: { lat: number; lng: number };
  title?: string;
  label?: string;
}

interface Props {
  drivers?: DriverPin[];
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onDriverClick?: (driverId: string) => void;
  height?: string;
  className?: string;
  [key: string]: any;
}

const LeafletMultiDriverMap = memo(({ drivers = [], markers = [], center, zoom, onDriverClick, height = '100%', className }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const mapCenter = center ? [center.lat, center.lng] as [number, number] : EGYPT_CENTER;
    const mapZoom = zoom || DEFAULT_ZOOM;
    const map = L.map(mapRef.current).setView(mapCenter, mapZoom);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);

    const bounds = L.latLngBounds([]);

    // Render driver pins
    drivers.forEach(d => {
      const color = d.isOnline ? '#22c55e' : '#ef4444';
      const icon = L.divIcon({
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;">🚛</div>`,
        iconSize: [28, 28], className: '',
      });
      const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${d.name}</b><br/>${d.vehiclePlate || ''}<br/>${d.isOnline ? '🟢 متصل' : '🔴 غير متصل'}`);
      if (onDriverClick) marker.on('click', () => onDriverClick(d.id));
      bounds.extend([d.lat, d.lng]);
    });

    // Render generic markers (from TransporterDriverTracking)
    markers.forEach(m => {
      const icon = L.divIcon({
        html: `<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">${m.label || '📍'}</div>`,
        iconSize: [24, 24], className: '',
      });
      const marker = L.marker([m.position.lat, m.position.lng], { icon }).addTo(map);
      if (m.title) marker.bindPopup(m.title);
      bounds.extend([m.position.lat, m.position.lng]);
    });

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

    return () => { map.remove(); };
  }, [drivers, markers, center, zoom, onDriverClick]);

  return <div ref={mapRef} className={className} style={{ height, minHeight: '300px' }} />;
});

LeafletMultiDriverMap.displayName = 'LeafletMultiDriverMap';
export default LeafletMultiDriverMap;
