import { useRef, useEffect, memo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from '@/lib/utils';
import { Truck } from 'lucide-react';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  EGYPT_CENTER,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const driversRef = useRef(drivers);
  const onSelectRef = useRef(onSelectDriver);

  driversRef.current = drivers;
  onSelectRef.current = onSelectDriver;

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: EGYPT_CENTER,
      zoom: 6,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: [
        [EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]],
        [EGYPT_BOUNDS[2], EGYPT_BOUNDS[3]],
      ],
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
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

      const existing = markersRef.current.get(driver.id);

      if (existing) {
        existing.setLngLat([driver.longitude, driver.latitude]);
        // Update element styles
        const el = existing.getElement();
        const circle = el.querySelector('.driver-dot') as HTMLElement;
        if (circle) {
          circle.style.background = color;
          circle.style.width = `${size}px`;
          circle.style.height = `${size}px`;
        }
      } else {
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="driver-dot" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5A1.5 1.5 0 0 1 4.5 17 1.5 1.5 0 0 1 6 15.5 1.5 1.5 0 0 1 7.5 17 1.5 1.5 0 0 1 6 18.5zM20 8l3 4v5h-2a3 3 0 0 1-3 3 3 3 0 0 1-3-3H9a3 3 0 0 1-3 3 3 3 0 0 1-3-3H1V6c0-1.11.89-2 2-2h14v4h3z"/></svg>
          </div>`;
        el.style.cursor = 'pointer';

        const driverId = driver.id;
        el.addEventListener('click', () => {
          const d = driversRef.current.find(dr => dr.id === driverId);
          if (d) onSelectRef.current?.(d);
        });

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(
          `<div dir="rtl" style="min-width:120px;font-family:sans-serif;">
            <b>${name}</b><br/>
            <span style="color:${isActive ? '#22c55e' : '#94a3b8'}">${isActive ? '🟢 متاح' : '⚪ غير متاح'}</span>
            ${driver.vehicle_plate ? `<br/><span>🚛 ${driver.vehicle_plate}</span>` : ''}
            ${driver.organization?.name ? `<br/><span>🏢 ${driver.organization.name}</span>` : ''}
          </div>`
        );

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([driver.longitude, driver.latitude])
          .setPopup(popup)
          .addTo(map);

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
      map.easeTo({
        center: [selectedDriver.longitude, selectedDriver.latitude],
        zoom: 14,
        duration: 500,
      });
    }
  }, [drivers, selectedDriver]);

  const driversOnMap = drivers.filter(d => d.latitude && d.longitude).length;

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-10">
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
