import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Driver {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  profile: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  organization: {
    name: string;
  } | null;
  latitude?: number;
  longitude?: number;
  last_update?: string;
}

interface DriverTrackingMapProps {
  drivers: Driver[];
  selectedDriver: Driver | null;
  onSelectDriver: (driver: Driver) => void;
  center?: { lat: number; lng: number };
}

// Egypt - Cairo as default center
const defaultCenter = {
  lat: 30.0444,
  lng: 31.2357,
};

const DriverTrackingMap = ({ 
  drivers, 
  selectedDriver, 
  onSelectDriver,
  center = defaultCenter 
}: DriverTrackingMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const getVehicleTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      truck: 'شاحنة',
      van: 'فان',
      pickup: 'بيك أب',
    };
    return type ? labels[type] || type : 'غير محدد';
  };

  const createDriverIcon = useCallback((driver: Driver, isSelected: boolean) => {
    const color = driver.is_available ? '#22c55e' : '#f59e0b';
    const size = isSelected ? 48 : 36;
    const pulseAnimation = isSelected ? 'animation: selectedPulse 1.5s infinite;' : '';
    
    return L.divIcon({
      className: 'driver-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
        ">
          <div style="
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, ${color}40 0%, transparent 70%);
            border-radius: 50%;
            ${pulseAnimation}
          "></div>
          <div style="
            width: ${size * 0.6}px;
            height: ${size * 0.6}px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
          ">
            <svg width="${size * 0.3}px" height="${size * 0.3}px" viewBox="0 0 24 24" fill="white">
              <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, []);

  const createPopupContent = useCallback((driver: Driver) => {
    const statusBadge = driver.is_available 
      ? '<span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">متاح</span>'
      : '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">في مهمة</span>';
    
    return `
      <div style="min-width: 180px; text-align: right; direction: rtl; padding: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end; margin-bottom: 8px;">
          ${statusBadge}
          <strong style="font-size: 14px;">${driver.profile?.full_name || 'غير معروف'}</strong>
        </div>
        <div style="font-size: 12px; color: #666; space-y: 4px;">
          <div style="display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-bottom: 4px;">
            <span>${driver.organization?.name || '-'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-bottom: 4px;">
            <span>${driver.vehicle_plate || '-'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/></svg>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-bottom: 4px;">
            <span>${getVehicleTypeLabel(driver.vehicle_type)}</span>
          </div>
          ${driver.profile?.phone ? `
            <div style="display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-bottom: 4px;">
              <span dir="ltr">${driver.profile.phone}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </div>
          ` : ''}
          ${driver.last_update ? `
            <div style="color: #999; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px;">
              آخر تحديث: ${new Date(driver.last_update).toLocaleTimeString('ar-SA')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 10,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(mapInstance.current);

      setIsLoading(false);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current.clear();
      }
    };
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const currentMarkers = markersRef.current;

    // Remove markers for drivers no longer in the list
    const driverIds = new Set(drivers.map(d => d.id));
    currentMarkers.forEach((marker, id) => {
      if (!driverIds.has(id)) {
        map.removeLayer(marker);
        currentMarkers.delete(id);
      }
    });

    // Add or update markers for each driver
    const bounds: L.LatLngBounds | null = drivers.some(d => d.latitude && d.longitude)
      ? L.latLngBounds([])
      : null;

    drivers.forEach((driver) => {
      if (!driver.latitude || !driver.longitude) return;

      const isSelected = selectedDriver?.id === driver.id;
      const position: L.LatLngTuple = [driver.latitude, driver.longitude];

      if (bounds) {
        bounds.extend(position);
      }

      if (currentMarkers.has(driver.id)) {
        // Update existing marker
        const marker = currentMarkers.get(driver.id)!;
        marker.setLatLng(position);
        marker.setIcon(createDriverIcon(driver, isSelected));
        marker.getPopup()?.setContent(createPopupContent(driver));
      } else {
        // Create new marker
        const marker = L.marker(position, {
          icon: createDriverIcon(driver, isSelected),
        });

        marker.bindPopup(createPopupContent(driver), {
          offset: [0, -10],
        });

        marker.on('click', () => {
          onSelectDriver(driver);
        });

        marker.addTo(map);
        currentMarkers.set(driver.id, marker);
      }
    });

    // Fit bounds if we have drivers with locations
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [drivers, selectedDriver, createDriverIcon, createPopupContent, onSelectDriver]);

  // Pan to selected driver
  useEffect(() => {
    if (!mapInstance.current || !selectedDriver?.latitude || !selectedDriver?.longitude) return;

    mapInstance.current.flyTo(
      [selectedDriver.latitude, selectedDriver.longitude],
      14,
      { duration: 0.5 }
    );

    // Open popup for selected driver
    const marker = markersRef.current.get(selectedDriver.id);
    if (marker) {
      marker.openPopup();
    }
  }, [selectedDriver]);

  return (
    <>
      <style>{`
        @keyframes selectedPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
      `}</style>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-[500px] rounded-lg overflow-hidden border"
          style={{ zIndex: 0 }}
        />
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg z-[1000]">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 justify-end">
              <span>متاح</span>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span>في مهمة</span>
              <div className="w-3 h-3 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DriverTrackingMap;
