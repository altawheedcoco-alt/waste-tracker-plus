import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MapPin, Locate, X, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `
    <div style="
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    ">
      <div style="
        width: 30px;
        height: 30px;
        background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      "></div>
      <div style="
        position: absolute;
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        top: 11px;
      "></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

interface PhotonResult {
  type: string;
  geometry: {
    coordinates: [number, number];
    type: string;
  };
  properties: {
    osm_id: number;
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    street?: string;
    housenumber?: string;
    countrycode?: string;
  };
}

interface FreeInteractiveMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (position: { lat: number; lng: number }, address?: string) => void;
  showSearch?: boolean;
  showCurrentLocation?: boolean;
  className?: string;
  height?: string;
}

// Component to handle map click events
const MapClickHandler = ({
  onPositionSelect,
}: {
  onPositionSelect: (position: { lat: number; lng: number }) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onPositionSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Component to fly to a position
const FlyToPosition = ({ position }: { position: { lat: number; lng: number } | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 16, { duration: 1 });
    }
  }, [position, map]);

  return null;
};

// Photon API for search
const PHOTON_API = 'https://photon.komoot.io/api';

const FreeInteractiveMap = ({
  center = { lat: 30.0444, lng: 31.2357 }, // Cairo default
  zoom = 12,
  selectedPosition,
  onPositionSelect,
  showSearch = true,
  showCurrentLocation = true,
  className = '',
  height = '400px',
}: FreeInteractiveMapProps) => {
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(selectedPosition || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PhotonResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update marker when selectedPosition prop changes
  useEffect(() => {
    if (selectedPosition) {
      setMarkerPosition(selectedPosition);
    }
  }, [selectedPosition]);

  // Close search results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (position: { lat: number; lng: number }) => {
    setMarkerPosition(position);
    
    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=ar`
      );
      const data = await response.json();
      
      if (onPositionSelect) {
        onPositionSelect(position, data.display_name || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
      }
    } catch {
      if (onPositionSelect) {
        onPositionSelect(position, `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
      }
    }
  }, [onPositionSelect]);

  // Search places
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `${PHOTON_API}?q=${encodeURIComponent(query)}&limit=6&lang=ar&lat=30.0444&lon=31.2357`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features) {
        // Prioritize Egypt results
        const filtered = data.features.filter((f: PhotonResult) => {
          const cc = f.properties.countrycode?.toUpperCase();
          return cc === 'EG' || !cc;
        });
        setSearchResults(filtered.slice(0, 6));
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to Nominatim
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=6&accept-language=ar`;
        const response = await fetch(nominatimUrl);
        const data = await response.json();
        
        if (data?.length > 0) {
          const converted = data.map((item: any) => ({
            type: 'Feature',
            geometry: {
              coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
              type: 'Point',
            },
            properties: {
              osm_id: item.osm_id,
              name: item.display_name.split(',')[0],
              city: item.address?.city || item.address?.town,
              state: item.address?.state,
              country: item.address?.country,
            },
          }));
          setSearchResults(converted);
          setShowResults(true);
        }
      } catch {
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(query);
    }, 350);
  };

  // Select search result
  const selectSearchResult = (result: PhotonResult) => {
    const position = {
      lat: result.geometry.coordinates[1],
      lng: result.geometry.coordinates[0],
    };

    setMarkerPosition(position);
    setSearchQuery(result.properties.name || '');
    setShowResults(false);

    // Format address
    const parts: string[] = [];
    if (result.properties.name) parts.push(result.properties.name);
    if (result.properties.city) parts.push(result.properties.city);
    if (result.properties.state) parts.push(result.properties.state);
    const address = parts.join('، ');

    if (onPositionSelect) {
      onPositionSelect(position, address || result.properties.name);
    }

    toast.success('تم تحديد الموقع');
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMarkerPosition(pos);
        
        // Reverse geocode
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&accept-language=ar`
          );
          const data = await response.json();
          
          if (onPositionSelect) {
            onPositionSelect(pos, data.display_name);
          }
          toast.success('تم تحديد موقعك الحالي');
        } catch {
          if (onPositionSelect) {
            onPositionSelect(pos, `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
          }
        }
        
        setIsGettingLocation(false);
      },
      () => {
        toast.error('فشل في تحديد الموقع');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={cn('relative rounded-lg overflow-hidden border', className)} style={{ height }}>
      {/* Search Bar */}
      {showSearch && (
        <div ref={searchRef} className="absolute top-3 left-3 right-3 z-[1000]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="ابحث عن موقع..."
              className="pr-10 pl-10 bg-background/95 backdrop-blur-sm shadow-lg"
              dir="rtl"
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
              {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
              {searchQuery && !isSearching && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden">
              <ScrollArea className="max-h-[200px]">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.properties.osm_id}-${index}`}
                    type="button"
                    className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => selectSearchResult(result)}
                  >
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.properties.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[result.properties.city, result.properties.state].filter(Boolean).join('، ')}
                      </p>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* Current Location Button */}
      {showCurrentLocation && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute bottom-3 right-3 z-[1000] shadow-lg"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          title="موقعي الحالي"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* OpenStreetMap Attribution Badge */}
      <Badge 
        variant="secondary" 
        className="absolute bottom-3 left-3 z-[1000] text-[10px] bg-background/80 backdrop-blur-sm"
      >
        © OpenStreetMap
      </Badge>

      {/* Map */}
      <MapContainer
        center={[markerPosition?.lat || center.lat, markerPosition?.lng || center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onPositionSelect={handleMapClick} />
        <FlyToPosition position={markerPosition} />
        
        {markerPosition && (
          <Marker position={[markerPosition.lat, markerPosition.lng]} icon={customIcon} />
        )}
      </MapContainer>
    </div>
  );
};

export default FreeInteractiveMap;
