import { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mapbox Access Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface SearchResult {
  id: string;
  place_name: string;
  place_name_ar?: string;
  center: [number, number];
  text: string;
  context?: Array<{ text: string }>;
}

interface MapboxInteractiveMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (position: { lat: number; lng: number }, address?: string) => void;
  showSearch?: boolean;
  showCurrentLocation?: boolean;
  className?: string;
  height?: string;
}

const MapboxInteractiveMap = ({
  center = { lat: 30.0444, lng: 31.2357 }, // Cairo default
  zoom = 12,
  selectedPosition,
  onPositionSelect,
  showSearch = true,
  showCurrentLocation = true,
  className = '',
  height = '400px',
}: MapboxInteractiveMapProps) => {
  const [viewState, setViewState] = useState({
    longitude: selectedPosition?.lng || center.lng,
    latitude: selectedPosition?.lat || center.lat,
    zoom: zoom,
  });
  
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    selectedPosition || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update marker when selectedPosition prop changes
  useEffect(() => {
    if (selectedPosition) {
      setMarkerPosition(selectedPosition);
      setViewState(prev => ({
        ...prev,
        longitude: selectedPosition.lng,
        latitude: selectedPosition.lat,
        zoom: 16,
      }));
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
  const handleMapClick = useCallback(async (event: any) => {
    const { lng, lat } = event.lngLat;
    const position = { lat, lng };
    setMarkerPosition(position);
    
    // Fly to position
    setViewState(prev => ({
      ...prev,
      longitude: lng,
      latitude: lat,
      zoom: 16,
    }));

    // Reverse geocode using Mapbox
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        if (onPositionSelect) {
          onPositionSelect(position, address);
        }
      } else {
        if (onPositionSelect) {
          onPositionSelect(position, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      }
    } catch {
      if (onPositionSelect) {
        onPositionSelect(position, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    }
  }, [onPositionSelect]);

  // Search places using Mapbox Geocoding API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search with Egypt bias
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=eg&language=ar&limit=6&bbox=24.7,22,37,32`
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
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
  const selectSearchResult = (result: SearchResult) => {
    const position = {
      lat: result.center[1],
      lng: result.center[0],
    };

    setMarkerPosition(position);
    setSearchQuery(result.text);
    setShowResults(false);

    // Fly to location
    setViewState(prev => ({
      ...prev,
      longitude: position.lng,
      latitude: position.lat,
      zoom: 16,
    }));

    if (onPositionSelect) {
      onPositionSelect(position, result.place_name);
    }

    toast.success('تم تحديد الموقع');
  };

  // Handle geolocate
  const handleGeolocate = (e: any) => {
    const { longitude, latitude } = e.coords;
    const position = { lat: latitude, lng: longitude };
    setMarkerPosition(position);
    
    // Reverse geocode
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=ar`
    )
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          if (onPositionSelect) {
            onPositionSelect(position, data.features[0].place_name);
          }
        } else {
          if (onPositionSelect) {
            onPositionSelect(position, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        }
        toast.success('تم تحديد موقعك الحالي');
      })
      .catch(() => {
        if (onPositionSelect) {
          onPositionSelect(position, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      });
  };

  return (
    <div className={cn('relative rounded-lg overflow-hidden border', className)} style={{ height }}>
      {/* Search Bar */}
      {showSearch && (
        <div ref={searchRef} className="absolute top-3 left-3 right-3 z-10">
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
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => selectSearchResult(result)}
                  >
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.text}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {result.context?.map(c => c.text).join('، ') || ''}
                      </p>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* Mapbox Attribution Badge */}
      <Badge 
        variant="secondary" 
        className="absolute bottom-3 left-3 z-10 text-[10px] bg-background/80 backdrop-blur-sm"
      >
        © Mapbox
      </Badge>

      {/* Map */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />
        
        {showCurrentLocation && (
          <GeolocateControl
            position="bottom-right"
            onGeolocate={handleGeolocate}
            trackUserLocation={false}
          />
        )}

        {markerPosition && (
          <Marker
            longitude={markerPosition.lng}
            latitude={markerPosition.lat}
            anchor="bottom"
          >
            <div className="relative">
              <div 
                className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                style={{
                  transform: 'translateY(-50%)',
                }}
              >
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid hsl(var(--primary))',
                }}
              />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
};

export default MapboxInteractiveMap;
