import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2, Truck, User, Phone, MapPin } from 'lucide-react';
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

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem',
};

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    language: 'ar',
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Fit bounds to show all drivers
  useEffect(() => {
    if (map && drivers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      drivers.forEach(driver => {
        if (driver.latitude && driver.longitude) {
          bounds.extend({ lat: driver.latitude, lng: driver.longitude });
        }
      });
      map.fitBounds(bounds);
      
      // Don't zoom in too much
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, drivers]);

  // Center on selected driver
  useEffect(() => {
    if (map && selectedDriver?.latitude && selectedDriver?.longitude) {
      map.panTo({ lat: selectedDriver.latitude, lng: selectedDriver.longitude });
      map.setZoom(14);
      setActiveInfoWindow(selectedDriver.id);
    }
  }, [map, selectedDriver]);

  const getVehicleTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      truck: 'شاحنة',
      van: 'فان',
      pickup: 'بيك أب',
    };
    return type ? labels[type] || type : 'غير محدد';
  };

  const getMarkerIcon = (driver: Driver) => {
    const color = driver.is_available ? '#22c55e' : '#f59e0b';
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 12,
    };
  };

  if (loadError) {
    return (
      <div className="h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>فشل تحميل الخريطة</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[500px] rounded-lg bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {drivers.map((driver) => {
        if (!driver.latitude || !driver.longitude) return null;

        return (
          <Marker
            key={driver.id}
            position={{ lat: driver.latitude, lng: driver.longitude }}
            icon={getMarkerIcon(driver)}
            onClick={() => {
              onSelectDriver(driver);
              setActiveInfoWindow(driver.id);
            }}
            animation={selectedDriver?.id === driver.id ? google.maps.Animation.BOUNCE : undefined}
          >
            {activeInfoWindow === driver.id && (
              <InfoWindow
                onCloseClick={() => setActiveInfoWindow(null)}
              >
                <div className="p-2 min-w-[200px] text-right" dir="rtl">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={driver.is_available ? 'default' : 'secondary'} className="text-xs">
                      {driver.is_available ? 'متاح' : 'في مهمة'}
                    </Badge>
                    <span className="font-bold text-sm">{driver.profile?.full_name}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1 justify-end">
                      <span>{driver.organization?.name}</span>
                      <User className="w-3 h-3" />
                    </div>
                    
                    <div className="flex items-center gap-1 justify-end">
                      <span>{driver.vehicle_plate || '-'}</span>
                      <Truck className="w-3 h-3" />
                    </div>
                    
                    <div className="flex items-center gap-1 justify-end">
                      <span>{getVehicleTypeLabel(driver.vehicle_type)}</span>
                    </div>
                    
                    {driver.profile?.phone && (
                      <div className="flex items-center gap-1 justify-end">
                        <span dir="ltr">{driver.profile.phone}</span>
                        <Phone className="w-3 h-3" />
                      </div>
                    )}
                    
                    {driver.last_update && (
                      <div className="text-gray-400 mt-2 pt-2 border-t">
                        آخر تحديث: {new Date(driver.last_update).toLocaleTimeString('ar-SA')}
                      </div>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        );
      })}
    </GoogleMap>
  );
};

export default DriverTrackingMap;
