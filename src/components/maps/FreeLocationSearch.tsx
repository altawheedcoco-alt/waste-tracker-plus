import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MapPin, Navigation, X, Search, Building2, Globe, Locate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface FreeLocationSearchProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }, placeId?: string) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  disabled?: boolean;
  countryCode?: string;
}

interface MapboxResult {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  context?: { id: string; text: string }[];
  properties?: {
    category?: string;
    maki?: string;
  };
  place_type?: string[];
}

/**
 * Location Search component using Mapbox Geocoding API
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
  const [results, setResults] = useState<MapboxResult[]>([]);
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

  // Search for places using Mapbox Geocoding API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=ar&country=${countryCode.toLowerCase()}&limit=8&types=address,place,locality,neighborhood,poi`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features) {
        setResults(data.features);
        setShowDropdown(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Mapbox search error:', error);
      setResults([]);
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

  // Get display name from result
  const getDisplayName = (result: MapboxResult): string => {
    return result.text || result.place_name.split(',')[0];
  };

  // Get secondary text (context)
  const getSecondaryText = (result: MapboxResult): string => {
    if (result.context) {
      return result.context.map(c => c.text).join('، ');
    }
    const parts = result.place_name.split(',').slice(1);
    return parts.join('،').trim();
  };

  // Select a place
  const selectPlace = (result: MapboxResult) => {
    const coords = {
      lat: result.center[1],
      lng: result.center[0],
    };

    setInputValue(result.place_name);
    onChange(result.place_name, coords, result.id);
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
          // Reverse geocode using Mapbox
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
          );
          const data = await response.json();

          setIsGettingLocation(false);
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            setInputValue(address);
            onChange(address, { lat: latitude, lng: longitude });
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
  const getResultIcon = (result: MapboxResult) => {
    const placeType = result.place_type?.[0];
    
    if (placeType === 'poi' || result.properties?.category) {
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
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                <Globe className="w-3 h-3 mr-1" />
                Mapbox
              </Badge>
              <span className="text-xs text-muted-foreground">نتائج البحث</span>
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            {results.map((result, index) => (
              <button
                key={`${result.id}-${index}`}
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
          {/* Mapbox Attribution */}
          <div className="px-3 py-1.5 border-t bg-muted/20">
            <p className="text-[10px] text-muted-foreground text-center">
              © Mapbox
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
