import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, Navigation, X, Search, Building2, Globe, Locate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FreeLocationSearchProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }, placeId?: string) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  disabled?: boolean;
  countryCode?: string;
}

interface PhotonResult {
  type: string;
  geometry: {
    coordinates: [number, number]; // [lng, lat]
    type: string;
  };
  properties: {
    osm_id: number;
    osm_type: string;
    extent?: number[];
    country?: string;
    osm_key?: string;
    city?: string;
    countrycode?: string;
    osm_value?: string;
    postcode?: string;
    name?: string;
    state?: string;
    street?: string;
    housenumber?: string;
    type?: string;
  };
}

// Photon API for places search (free, based on OpenStreetMap)
const PHOTON_API = 'https://photon.komoot.io/api';

/**
 * Free Location Search component using Photon API (OpenStreetMap-based)
 * Completely free alternative to Google Places
 */
const FreeLocationSearch = ({
  value,
  onChange,
  placeholder = 'ابحث عن عنوان أو مكان...',
  className = '',
  showCurrentLocation = true,
  disabled = false,
  countryCode = 'EG',
}: FreeLocationSearchProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<PhotonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for places using Photon API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Photon API with Egypt bias and Arabic language
      const url = `${PHOTON_API}?q=${encodeURIComponent(query)}&limit=8&lang=ar&lat=30.0444&lon=31.2357`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Photon API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features) {
        // Filter results to prioritize Egypt
        const filtered = data.features
          .filter((f: PhotonResult) => {
            const cc = f.properties.countrycode?.toUpperCase();
            return !countryCode || cc === countryCode || !cc;
          })
          .slice(0, 6);
        
        setResults(filtered);
        setShowDropdown(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Photon search error:', error);
      // Fallback to Nominatim if Photon fails
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=6&accept-language=ar`;
        const nominatimResponse = await fetch(nominatimUrl);
        const nominatimData = await nominatimResponse.json();
        
        if (nominatimData?.length > 0) {
          // Convert Nominatim results to Photon format
          const converted = nominatimData.map((item: any) => ({
            type: 'Feature',
            geometry: {
              coordinates: [parseFloat(item.lon), parseFloat(item.lat)],
              type: 'Point',
            },
            properties: {
              osm_id: item.osm_id,
              name: item.display_name.split(',')[0],
              city: item.address?.city || item.address?.town || item.address?.village,
              state: item.address?.state,
              country: item.address?.country,
              countrycode: 'EG',
            },
          }));
          setResults(converted);
          setShowDropdown(true);
        }
      } catch {
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [countryCode]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 350);
  };

  // Format address from Photon result
  const formatAddress = (result: PhotonResult): string => {
    const props = result.properties;
    const parts: string[] = [];

    if (props.name) parts.push(props.name);
    if (props.street) {
      if (props.housenumber) {
        parts.push(`${props.street} ${props.housenumber}`);
      } else {
        parts.push(props.street);
      }
    }
    if (props.city) parts.push(props.city);
    if (props.state && props.state !== props.city) parts.push(props.state);
    if (props.country) parts.push(props.country);

    return parts.length > 0 ? parts.join('، ') : `${result.geometry.coordinates[1]}, ${result.geometry.coordinates[0]}`;
  };

  // Get display name from result
  const getDisplayName = (result: PhotonResult): string => {
    return result.properties.name || result.properties.street || formatAddress(result).split('،')[0];
  };

  // Get secondary text (city, state)
  const getSecondaryText = (result: PhotonResult): string => {
    const props = result.properties;
    const parts: string[] = [];
    if (props.city) parts.push(props.city);
    if (props.state && props.state !== props.city) parts.push(props.state);
    if (props.country) parts.push(props.country);
    return parts.join('، ');
  };

  // Select a place
  const selectPlace = (result: PhotonResult) => {
    const address = formatAddress(result);
    const coords = {
      lat: result.geometry.coordinates[1],
      lng: result.geometry.coordinates[0],
    };

    setInputValue(address);
    onChange(address, coords, `osm-${result.properties.osm_id}`);
    setShowDropdown(false);
    setResults([]);
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
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const data = await response.json();

          setIsGettingLocation(false);
          if (data.display_name) {
            setInputValue(data.display_name);
            onChange(data.display_name, { lat: latitude, lng: longitude });
            toast.success('تم تحديد موقعك الحالي');
          } else {
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setInputValue(address);
            onChange(address, { lat: latitude, lng: longitude });
          }
        } catch {
          setIsGettingLocation(false);
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setInputValue(address);
          onChange(address, { lat: latitude, lng: longitude });
        }
      },
      (error) => {
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
        toast.error('تعذر تحديد موقعك الحالي');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setResults([]);
    setShowDropdown(false);
  };

  // Get icon based on result type
  const getResultIcon = (result: PhotonResult) => {
    const type = result.properties.osm_value || result.properties.type;
    const key = result.properties.osm_key;

    if (key === 'amenity' || type === 'company' || type === 'industrial') {
      return <Building2 className="h-4 w-4 text-primary" />;
    }
    return <MapPin className="h-4 w-4 text-primary" />;
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10 pl-20"
          dir="rtl"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {inputValue && !isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {showCurrentLocation && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              title="استخدم موقعي الحالي"
            >
              {isGettingLocation ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Locate className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                <Globe className="w-3 h-3 mr-1" />
                OpenStreetMap
              </Badge>
              <span className="text-xs text-muted-foreground">نتائج مجانية بالكامل</span>
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            {results.map((result, index) => (
              <button
                key={`${result.properties.osm_id}-${index}`}
                type="button"
                className="w-full px-3 py-2.5 text-right hover:bg-accent transition-colors flex items-start gap-3"
                onClick={() => selectPlace(result)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getResultIcon(result)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {getDisplayName(result)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getSecondaryText(result)}
                  </p>
                </div>
              </button>
            ))}
          </ScrollArea>
          {/* OpenStreetMap Attribution */}
          <div className="px-3 py-1.5 border-t bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              © OpenStreetMap contributors
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {showDropdown && results.length === 0 && !isLoading && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg p-3 text-center text-sm text-muted-foreground">
          لا توجد نتائج للبحث
        </div>
      )}
    </div>
  );
};

export default FreeLocationSearch;
