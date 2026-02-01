import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface InteractiveMapPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }, address?: string) => void;
  height?: string;
  showSearch?: boolean;
  markerColor?: 'blue' | 'green' | 'red';
  label?: string;
}

// Custom marker icon
const createMarkerIcon = (color: string) => {
  return new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 32px;
      height: 32px;
      background: ${color};
      border: 4px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Egypt center (Cairo)
const defaultCenter: [number, number] = [30.0444, 31.2357];

// Map click handler component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// Map center updater component
const MapCenterUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 0.5 });
    }
  }, [center, map]);
  
  return null;
};

const InteractiveMapPicker = ({
  value,
  onChange,
  height = '400px',
  showSearch = true,
  markerColor = 'blue',
  label,
}: InteractiveMapPickerProps) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    value ? [value.lat, value.lng] : null
  );
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const colorMap = {
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
  };

  const markerIcon = createMarkerIcon(colorMap[markerColor]);

  // Update selected position when value changes
  useEffect(() => {
    if (value) {
      setSelectedPosition([value.lat, value.lng]);
    }
  }, [value]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Handle map click
  const handleLocationSelect = useCallback(async (latlng: L.LatLng) => {
    const coords = { lat: latlng.lat, lng: latlng.lng };
    setSelectedPosition([latlng.lat, latlng.lng]);
    
    const addressResult = await reverseGeocode(latlng.lat, latlng.lng);
    setAddress(addressResult);
    onChange(coords, addressResult);
  }, [onChange]);

  // Search for location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=eg&limit=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        setSelectedPosition([lat, lng]);
        setAddress(result.display_name);
        onChange({ lat, lng }, result.display_name);
        toast.success('تم العثور على الموقع');
      } else {
        toast.error('لم يتم العثور على نتائج');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('خطأ في البحث');
    } finally {
      setSearchLoading(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedPosition([latitude, longitude]);
        
        const addressResult = await reverseGeocode(latitude, longitude);
        setAddress(addressResult);
        onChange({ lat: latitude, lng: longitude }, addressResult);
        toast.success('تم تحديد موقعك الحالي');
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('فشل في تحديد الموقع');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {label}
        </label>
      )}

      {/* Search and Current Location */}
      {showSearch && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن موقع..."
              className="pr-10"
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute left-10 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={searchLocation}
            disabled={searchLoading || !searchQuery.trim()}
          >
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'بحث'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            title="موقعي الحالي"
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}

      {/* Map Container */}
      <div 
        className="relative rounded-lg overflow-hidden border bg-muted"
        style={{ height }}
      >
        <MapContainer
          center={selectedPosition || defaultCenter}
          zoom={selectedPosition ? 15 : 6}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          whenReady={() => setMapReady(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <MapCenterUpdater center={selectedPosition} />
          
          {selectedPosition && (
            <Marker position={selectedPosition} icon={markerIcon}>
              <Popup>
                <div className="text-right" dir="rtl">
                  <p className="font-medium text-sm">الموقع المحدد</p>
                  {address && <p className="text-xs text-muted-foreground mt-1">{address}</p>}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Crosshair overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 rounded-full" />
        </div>

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Selected location info */}
      {address && (
        <div className="p-3 bg-muted/50 rounded-lg border text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <p className="leading-relaxed">{address}</p>
          </div>
        </div>
      )}

      {/* Coordinates display */}
      {selectedPosition && (
        <p className="text-xs text-muted-foreground text-center" dir="ltr">
          {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default InteractiveMapPicker;
