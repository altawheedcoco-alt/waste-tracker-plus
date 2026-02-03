import { useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

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

interface MapboxDriverTrackingMapProps {
  drivers: Driver[];
  selectedDriver: Driver | null;
  onSelectDriver: (driver: Driver) => void;
  center?: { lat: number; lng: number };
}

const defaultCenter = {
  lat: 30.0444,
  lng: 31.2357,
};

const MapboxDriverTrackingMap = ({ 
  drivers, 
  selectedDriver, 
  onSelectDriver,
  center = defaultCenter 
}: MapboxDriverTrackingMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [popupInfo, setPopupInfo] = useState<Driver | null>(null);
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 10,
  });

  const getVehicleTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      truck: 'شاحنة',
      van: 'فان',
      pickup: 'بيك أب',
    };
    return type ? labels[type] || type : 'غير محدد';
  };

  // Calculate bounds for all drivers
  const bounds = useMemo(() => {
    const driversWithLocation = drivers.filter(d => d.latitude && d.longitude);
    if (driversWithLocation.length === 0) return null;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    driversWithLocation.forEach(d => {
      if (d.latitude! < minLat) minLat = d.latitude!;
      if (d.latitude! > maxLat) maxLat = d.latitude!;
      if (d.longitude! < minLng) minLng = d.longitude!;
      if (d.longitude! > maxLng) maxLng = d.longitude!;
    });
    
    return { minLat, maxLat, minLng, maxLng };
  }, [drivers]);

  // Fit to bounds on mount or when drivers change
  useEffect(() => {
    if (bounds) {
      const centerLat = (bounds.minLat + bounds.maxLat) / 2;
      const centerLng = (bounds.minLng + bounds.maxLng) / 2;
      setViewState(prev => ({
        ...prev,
        latitude: centerLat,
        longitude: centerLng,
        zoom: 10,
      }));
    }
    setIsLoading(false);
  }, [bounds]);

  // Pan to selected driver
  useEffect(() => {
    if (selectedDriver?.latitude && selectedDriver?.longitude) {
      setViewState(prev => ({
        ...prev,
        longitude: selectedDriver.longitude!,
        latitude: selectedDriver.latitude!,
        zoom: 14,
      }));
      setPopupInfo(selectedDriver);
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
      `}</style>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div className="w-full h-[500px] rounded-lg overflow-hidden border">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            <NavigationControl position="top-left" />

            {drivers.map((driver) => {
              if (!driver.latitude || !driver.longitude) return null;
              
              const isSelected = selectedDriver?.id === driver.id;
              const color = driver.is_available ? '#22c55e' : '#f59e0b';
              
              return (
                <Marker
                  key={driver.id}
                  longitude={driver.longitude}
                  latitude={driver.latitude}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    onSelectDriver(driver);
                    setPopupInfo(driver);
                  }}
                >
                  <div className="cursor-pointer relative">
                    {/* Pulse animation for selected */}
                    {isSelected && (
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                          width: '48px',
                          height: '48px',
                          marginLeft: '-12px',
                          marginTop: '-12px',
                          animation: 'selectedPulse 1.5s infinite',
                        }}
                      />
                    )}
                    {/* Driver marker */}
                    <div
                      style={{
                        width: isSelected ? '36px' : '28px',
                        height: isSelected ? '36px' : '28px',
                        background: color,
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg width={isSelected ? '18' : '14'} height={isSelected ? '18' : '14'} viewBox="0 0 24 24" fill="white">
                        <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
                      </svg>
                    </div>
                  </div>
                </Marker>
              );
            })}

            {popupInfo && popupInfo.latitude && popupInfo.longitude && (
              <Popup
                longitude={popupInfo.longitude}
                latitude={popupInfo.latitude}
                anchor="top"
                onClose={() => setPopupInfo(null)}
                closeOnClick={false}
              >
                <div className="min-w-[180px] text-right p-2" dir="rtl">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ background: popupInfo.is_available ? '#22c55e' : '#f59e0b' }}
                    >
                      {popupInfo.is_available ? 'متاح' : 'في مهمة'}
                    </span>
                    <strong className="text-sm">{popupInfo.profile?.full_name || 'غير معروف'}</strong>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{popupInfo.organization?.name || '-'}</div>
                    <div>{popupInfo.vehicle_plate || '-'}</div>
                    <div>{getVehicleTypeLabel(popupInfo.vehicle_type)}</div>
                    {popupInfo.profile?.phone && (
                      <div dir="ltr">{popupInfo.profile.phone}</div>
                    )}
                    {popupInfo.last_update && (
                      <div className="text-muted-foreground border-t pt-1 mt-1">
                        آخر تحديث: {new Date(popupInfo.last_update).toLocaleTimeString('ar-SA')}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg z-10">
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

export default MapboxDriverTrackingMap;
