import { useEffect, useRef, memo, useState, useCallback } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RefreshCw, Filter } from 'lucide-react';

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
  phone?: string;
  currentShipment?: string | null;
  speed?: number | null;
}

interface MapMarker {
  position: { lat: number; lng: number };
  title?: string;
  label?: string;
  type?: 'pickup' | 'delivery' | 'facility';
}

interface Props {
  drivers?: DriverPin[];
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onDriverClick?: (driverId: string) => void;
  height?: string;
  className?: string;
  showControls?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  [key: string]: any;
}

const getDriverIcon = (isOnline: boolean, hasShipment: boolean) => {
  const bg = isOnline ? (hasShipment ? '#3b82f6' : '#22c55e') : '#9ca3af';
  const emoji = hasShipment ? '🚛' : '🚐';
  const pulse = isOnline ? 'animation:pulse 2s infinite;' : '';
  return L.divIcon({
    html: `<div style="position:relative;">
      <div style="background:${bg};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;${pulse}">${emoji}</div>
      ${isOnline ? `<span style="position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#22c55e;border:2px solid white;border-radius:50%;"></span>` : ''}
    </div>`,
    iconSize: [32, 32],
    className: '',
  });
};

const facilityIcons: Record<string, string> = {
  pickup: '📦',
  delivery: '📍',
  facility: '🏭',
};

const LeafletMultiDriverMap = memo(({
  drivers = [], markers = [], center, zoom, onDriverClick,
  height = '100%', className, showControls = true,
  autoRefresh = false, refreshInterval = 30000,
}: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'busy'>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const filteredDrivers = drivers.filter(d => {
    if (filter === 'online') return d.isOnline;
    if (filter === 'busy') return d.isOnline && d.currentShipment;
    return true;
  });

  const onlineCount = drivers.filter(d => d.isOnline).length;
  const busyCount = drivers.filter(d => d.isOnline && d.currentShipment).length;

  const renderMap = useCallback(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const mapCenter = center ? [center.lat, center.lng] as [number, number] : EGYPT_CENTER;
    const mapZoom = zoom || DEFAULT_ZOOM;
    const map = L.map(mapRef.current, { zoomControl: true }).setView(mapCenter, mapZoom);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapInstanceRef.current = map;

    const bounds = L.latLngBounds([]);

    // Render driver pins
    filteredDrivers.forEach(d => {
      const icon = getDriverIcon(!!d.isOnline, !!d.currentShipment);
      const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);
      
      const popupContent = `
        <div style="text-align:right;direction:rtl;min-width:160px;">
          <b style="font-size:13px;">${d.name}</b><br/>
          ${d.vehiclePlate ? `<span style="color:#666;">🚗 ${d.vehiclePlate}</span><br/>` : ''}
          ${d.phone ? `<span style="color:#666;">📱 ${d.phone}</span><br/>` : ''}
          ${d.speed != null ? `<span style="color:#666;">⚡ ${d.speed} كم/س</span><br/>` : ''}
          <span style="color:${d.isOnline ? '#22c55e' : '#ef4444'};">
            ${d.isOnline ? '🟢 متصل' : '🔴 غير متصل'}
          </span>
          ${d.currentShipment ? `<br/><span style="color:#3b82f6;">📦 شحنة نشطة</span>` : ''}
        </div>
      `;
      marker.bindPopup(popupContent);
      if (onDriverClick) marker.on('click', () => onDriverClick(d.id));
      bounds.extend([d.lat, d.lng]);
    });

    // Render additional markers (facilities, etc.)
    markers.forEach(m => {
      const emoji = facilityIcons[m.type || 'facility'] || '📍';
      const markerColor = m.type === 'pickup' ? '#22c55e' : m.type === 'delivery' ? '#ef4444' : '#8b5cf6';
      const icon = L.divIcon({
        html: `<div style="background:${markerColor};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">${emoji}</div>`,
        iconSize: [24, 24], className: '',
      });
      const mk = L.marker([m.position.lat, m.position.lng], { icon }).addTo(map);
      if (m.title) mk.bindPopup(`<b>${m.title}</b>${m.label ? `<br/>${m.label}` : ''}`);
      bounds.extend([m.position.lat, m.position.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Fix grey tiles inside dialogs/tabs - force recalculation
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 300);
    setTimeout(() => map.invalidateSize(), 600);

    setLastRefresh(new Date());
  }, [filteredDrivers, markers, center, zoom, onDriverClick]);

  useEffect(() => {
    renderMap();

    // ResizeObserver to handle container size changes
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    if (mapRef.current) observer.observe(mapRef.current);

    return () => {
      observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [renderMap]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(renderMap, refreshInterval);
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, renderMap]);

  // Add CSS animation for pulsing
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="relative">
      {/* Stats bar */}
      {showControls && (
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {onlineCount} متصل
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {busyCount} في مهمة
            </Badge>
            <Badge variant="outline" className="text-xs">
              {drivers.length} إجمالي
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button" variant={filter === 'all' ? 'default' : 'ghost'} size="sm"
              className="h-7 text-[10px]" onClick={() => setFilter('all')}
            >الكل</Button>
            <Button
              type="button" variant={filter === 'online' ? 'default' : 'ghost'} size="sm"
              className="h-7 text-[10px]" onClick={() => setFilter('online')}
            >متصلون</Button>
            <Button
              type="button" variant={filter === 'busy' ? 'default' : 'ghost'} size="sm"
              className="h-7 text-[10px]" onClick={() => setFilter('busy')}
            >في مهمة</Button>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={renderMap}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-xl border border-border overflow-hidden shadow-sm">
        <div ref={mapRef} className={className} style={{ height: expanded ? '700px' : (height || '500px') }} />
        
        {showControls && (
          <Button
            type="button" variant="secondary" size="icon"
            className="absolute top-3 right-3 z-[1000] h-8 w-8 shadow-lg"
            onClick={() => {
              setExpanded(!expanded);
              setTimeout(() => mapInstanceRef.current?.invalidateSize(), 350);
            }}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-2 border shadow-sm">
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-sm" />
              متاح
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm" />
              في مهمة
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-400 border border-white shadow-sm" />
              غير متصل
            </span>
          </div>
        </div>

        {/* Empty state */}
        {filteredDrivers.length === 0 && markers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-[1px] z-[500]">
            <div className="text-center">
              <span className="text-4xl mb-2 block">🚛</span>
              <p className="text-sm text-muted-foreground">لا يوجد سائقين {filter !== 'all' ? 'مطابقين للفلتر' : 'على الخريطة'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LeafletMultiDriverMap.displayName = 'LeafletMultiDriverMap';
export default LeafletMultiDriverMap;
