import { useState, useRef, useEffect, memo } from 'react';
import L from 'leaflet';
import { Loader2, MapPin, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Driver {
  id: string;
  name?: string;
  full_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_available?: boolean;
  current_status?: string;
}

interface LeafletDriverTrackingProps {
  drivers: Driver[];
  selectedDriver?: Driver | null;
  onSelectDriver?: (driver: Driver) => void;
  center?: { lat: number; lng: number };
  className?: string;
  height?: string;
  showHeatmap?: boolean;
}

const createDriverIcon = (color: string, size = 28) => L.divIcon({
  html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5A1.5 1.5 0 0 1 4.5 17 1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 7.5 17 1.5 1.5 0 0 1 6 18.5zM20 8l3 4v5h-2a3 3 0 0 1-3 3 3 3 0 0 1-3-3H9a3 3 0 0 1-3 3 3 3 0 0 1-3-3H1V6c0-1.11.89-2 2-2h14v4h3z"/></svg></div>`,
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
  popupAnchor: [0, -size / 2],
});

const LeafletDriverTracking = memo(({
  drivers,
  selectedDriver,
  onSelectDriver,
  center = { lat: 30.0444, lng: 31.2357 },
  className = '',
  height = '500px',
  showHeatmap = false,
}: LeafletDriverTrackingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 10,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    drivers.forEach(driver => {
      if (!driver.latitude || !driver.longitude) return;
      const isActive = driver.is_available || driver.current_status === 'active';
      const isSelected = selectedDriver?.id === driver.id;
      const color = isSelected ? '#8b5cf6' : isActive ? '#22c55e' : '#94a3b8';
      const icon = createDriverIcon(color, isSelected ? 34 : 28);
      const marker = L.marker([driver.latitude, driver.longitude], { icon, zIndexOffset: isSelected ? 1000 : 0 });
      const name = driver.name || driver.full_name || 'سائق';
      marker.bindPopup(`<div dir="rtl" style="min-width:120px;"><b>${name}</b><br/><span style="color:${isActive ? '#22c55e' : '#94a3b8'}">${isActive ? '🟢 متاح' : '⚪ غير متاح'}</span></div>`);
      marker.on('click', () => onSelectDriver?.(driver));
      markersLayerRef.current!.addLayer(marker);
    });

    if (selectedDriver?.latitude && selectedDriver?.longitude) {
      mapRef.current.setView([selectedDriver.latitude, selectedDriver.longitude], 14);
    }
  }, [drivers, selectedDriver, onSelectDriver]);

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-[1000]">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{drivers.filter(d => d.latitude && d.longitude).length} سائق</span>
        </div>
      </div>
    </div>
  );
});

LeafletDriverTracking.displayName = 'LeafletDriverTracking';
export default LeafletDriverTracking;
