import { useRef, useEffect, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { Truck } from 'lucide-react';
import {
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  EGYPT_BOUNDS,
  EGYPT_CENTER,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/leafletConfig';

interface Driver {
  id: string;
  name?: string;
  full_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_available?: boolean;
  current_status?: string;
  vehicle_plate?: string | null;
  profile?: { full_name: string; phone: string | null; avatar_url: string | null } | null;
  organization?: { name: string } | null;
}

interface MapboxDriverTrackingProps {
  drivers: Driver[];
  selectedDriver?: Driver | null;
  onSelectDriver?: (driver: Driver) => void;
  center?: { lat: number; lng: number };
  className?: string;
  height?: string;
  showHeatmap?: boolean;
}

const MapboxDriverTracking = memo(({
  drivers,
  selectedDriver,
  onSelectDriver,
  className = '',
  height = '500px',
  showHeatmap = false,
}: MapboxDriverTrackingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const driversRef = useRef(drivers);
  const onSelectRef = useRef(onSelectDriver);

  driversRef.current = drivers;
  onSelectRef.current = onSelectDriver;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: EGYPT_CENTER,
      zoom: 6,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: L.latLngBounds(EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]),
    });

    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);
    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const activeIds = new Set<string>();

    drivers.forEach(driver => {
      if (!driver.latitude || !driver.longitude) return;
      activeIds.add(driver.id);

      const isActive = driver.is_available || driver.current_status === 'active';
      const isSelected = selectedDriver?.id === driver.id;
      const color = isSelected ? '#8b5cf6' : isActive ? '#22c55e' : '#94a3b8';
      const size = isSelected ? 34 : 28;
      const name = driver.profile?.full_name || driver.name || driver.full_name || 'سائق';

      const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5A1.5 1.5 0 0 1 4.5 17 1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 7.5 17 1.5 1.5 0 0 1 6 18.5zM20 8l3 4v5h-2a3 3 0 0 1-3 3 3 3 0 0 1-3-3H9a3 3 0 0 1-3 3 3 3 0 0 1-3-3H1V6c0-1.11.89-2 2-2h14v4h3z"/></svg>
        </div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const existing = markersRef.current.get(driver.id);

      if (existing) {
        existing.setLatLng([driver.latitude, driver.longitude]);
        existing.setIcon(icon);
      } else {
        const popupContent = `<div dir="rtl" style="min-width:120px;font-family:sans-serif;">
          <b>${name}</b><br/>
          <span style="color:${isActive ? '#22c55e' : '#94a3b8'}">${isActive ? '🟢 متاح' : '⚪ غير متاح'}</span>
          ${driver.vehicle_plate ? `<br/><span>🚛 ${driver.vehicle_plate}</span>` : ''}
          ${driver.organization?.name ? `<br/><span>🏢 ${driver.organization.name}</span>` : ''}
        </div>`;

        const marker = L.marker([driver.latitude, driver.longitude], { icon })
          .bindPopup(popupContent)
          .addTo(map);

        const driverId = driver.id;
        marker.on('click', () => {
          const d = driversRef.current.find(dr => dr.id === driverId);
          if (d) onSelectRef.current?.(d);
        });

        markersRef.current.set(driver.id, marker);
      }
    });

    // Remove markers for drivers no longer in list
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Center on selected driver
    if (selectedDriver?.latitude && selectedDriver?.longitude) {
      map.setView([selectedDriver.latitude, selectedDriver.longitude], 14, { animate: true });
    }
  }, [drivers, selectedDriver]);

  const driversOnMap = drivers.filter(d => d.latitude && d.longitude).length;

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-[1000]">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{driversOnMap} سائق</span>
        </div>
      </div>
    </div>
  );
});

MapboxDriverTracking.displayName = 'MapboxDriverTracking';
export default MapboxDriverTracking;
