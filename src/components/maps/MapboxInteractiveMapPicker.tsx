import { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Loader2, MapPin, X, Navigation, Crosshair, Copy, Check, LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface MapboxInteractiveMapPickerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (position: { lat: number; lng: number }, address?: string) => void;
  showSearch?: boolean;
  showCurrentLocation?: boolean;
  showCoordinatesInput?: boolean;
  className?: string;
  height?: string;
  markerColor?: 'blue' | 'green' | 'red';
  label?: string;
  // Legacy prop support
  value?: { lat: number; lng: number } | null;
  onChange?: (coords: { lat: number; lng: number }, address?: string) => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  text: string;
  context?: { text: string }[];
}

const MapboxInteractiveMapPicker = ({
  center = { lat: 30.0444, lng: 31.2357 },
  zoom = 12,
  selectedPosition,
  onPositionSelect,
  showSearch = true,
  showCurrentLocation = true,
  showCoordinatesInput = true,
  className = '',
  height = '400px',
  markerColor = 'blue',
  label,
  // Legacy props
  value,
  onChange,
}: MapboxInteractiveMapPickerProps) => {
  // Support legacy props
  const effectivePosition = selectedPosition || value;
  const effectiveOnChange = onPositionSelect || onChange;
  const [viewState, setViewState] = useState({
    longitude: effectivePosition?.lng || center.lng,
    latitude: effectivePosition?.lat || center.lat,
    zoom: effectivePosition ? 15 : zoom,
  });
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(effectivePosition || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coordsInput, setCoordsInput] = useState({ lat: '', lng: '' });
  const [showCoordsInput, setShowCoordsInput] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const geolocateRef = useRef<any>(null);

  const colorMap = {
    blue: '#3b82f6',
    green: '#22c55e',
    red: '#ef4444',
  };

  // Update marker when position prop changes
  useEffect(() => {
    if (effectivePosition) {
      setMarkerPosition(effectivePosition);
      setViewState(prev => ({
        ...prev,
        longitude: effectivePosition.lng,
        latitude: effectivePosition.lat,
        zoom: 15,
      }));
    }
  }, [effectivePosition]);

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

  // Reverse geocode using Mapbox
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Handle map click
  const handleMapClick = useCallback(async (event: any) => {
    const { lngLat } = event;
    const position = { lat: lngLat.lat, lng: lngLat.lng };
    setMarkerPosition(position);
    
    const addressResult = await reverseGeocode(position.lat, position.lng);
    setAddress(addressResult);
    
    if (effectiveOnChange) {
      effectiveOnChange(position, addressResult);
    }
    toast.success('تم تحديد الموقع');
  }, [effectiveOnChange]);

  // Get current location manually
  const getCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setMarkerPosition(newPosition);
      setViewState({
        longitude: newPosition.lng,
        latitude: newPosition.lat,
        zoom: 16,
      });

      const addressResult = await reverseGeocode(newPosition.lat, newPosition.lng);
      setAddress(addressResult);

      if (effectiveOnChange) {
        effectiveOnChange(newPosition, addressResult);
      }

      toast.success('تم تحديد موقعك الحالي بنجاح');
    } catch (error: any) {
      if (error.code === 1) {
        toast.error('يرجى السماح بالوصول للموقع من إعدادات المتصفح');
      } else if (error.code === 2) {
        toast.error('معلومات الموقع غير متوفرة');
      } else if (error.code === 3) {
        toast.error('انتهت مهلة تحديد الموقع');
      } else {
        toast.error('فشل في تحديد الموقع');
      }
    } finally {
      setIsLocating(false);
    }
  }, [effectiveOnChange]);

  // Navigate to coordinates input
  const navigateToCoordinates = useCallback(async () => {
    const lat = parseFloat(coordsInput.lat);
    const lng = parseFloat(coordsInput.lng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('يرجى إدخال إحداثيات صحيحة');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('الإحداثيات خارج النطاق المسموح');
      return;
    }

    const position = { lat, lng };
    setMarkerPosition(position);
    setViewState({
      longitude: lng,
      latitude: lat,
      zoom: 15,
    });

    const addressResult = await reverseGeocode(lat, lng);
    setAddress(addressResult);

    if (effectiveOnChange) {
      effectiveOnChange(position, addressResult);
    }

    setShowCoordsInput(false);
    toast.success('تم الانتقال للإحداثيات المحددة');
  }, [coordsInput, effectiveOnChange]);

  // Copy coordinates to clipboard
  const copyCoordinates = useCallback(() => {
    if (!markerPosition) return;
    
    const coordsText = `${markerPosition.lat.toFixed(6)}, ${markerPosition.lng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsText);
    setCopied(true);
    toast.success('تم نسخ الإحداثيات');
    setTimeout(() => setCopied(false), 2000);
  }, [markerPosition]);

  // Search places using Mapbox Geocoding
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=ar&country=eg&limit=6&types=address,place,locality,neighborhood,poi`
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
  const selectSearchResult = async (result: SearchResult) => {
    const position = {
      lat: result.center[1],
      lng: result.center[0],
    };

    setMarkerPosition(position);
    setViewState({
      longitude: position.lng,
      latitude: position.lat,
      zoom: 15,
    });
    setSearchQuery(result.text);
    setAddress(result.place_name);
    setShowResults(false);

    if (effectiveOnChange) {
      effectiveOnChange(position, result.place_name);
    }

    toast.success('تم تحديد الموقع');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {label}
        </label>
      )}

      <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
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

        {/* Floating Action Buttons */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {/* Current Location FAB */}
          {showCurrentLocation && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      'w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors',
                      'bg-primary hover:bg-primary/90 text-primary-foreground',
                      'disabled:opacity-50'
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {isLocating ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="icon"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <LocateFixed className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>موقعي الحالي</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Coordinates Input Toggle */}
          {showCoordinatesInput && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    onClick={() => setShowCoordsInput(!showCoordsInput)}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    className={cn(
                      'w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors',
                      showCoordsInput 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'bg-background border text-foreground hover:bg-accent'
                    )}
                  >
                    <Crosshair className="h-5 w-5" />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>إدخال إحداثيات</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Coordinates Input Panel */}
        <AnimatePresence>
          {showCoordsInput && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-16 left-3 z-10 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 w-64"
            >
              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">إدخال إحداثيات جغرافية</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">خط العرض (Lat)</label>
                    <Input
                      type="number"
                      step="any"
                      value={coordsInput.lat}
                      onChange={(e) => setCoordsInput(prev => ({ ...prev, lat: e.target.value }))}
                      placeholder="30.0444"
                      className="text-xs h-8"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">خط الطول (Lng)</label>
                    <Input
                      type="number"
                      step="any"
                      value={coordsInput.lng}
                      onChange={(e) => setCoordsInput(prev => ({ ...prev, lng: e.target.value }))}
                      placeholder="31.2357"
                      className="text-xs h-8"
                      dir="ltr"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-2"
                  onClick={navigateToCoordinates}
                >
                  <Navigation className="h-4 w-4" />
                  انتقل للموقع
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OpenStreetMap Attribution Badge */}
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
          locale={{ 'NavigationControl.ZoomIn': 'تكبير', 'NavigationControl.ZoomOut': 'تصغير', 'NavigationControl.ResetBearing': 'إعادة الاتجاه', 'GeolocateControl.FindMyLocation': 'موقعي', 'GeolocateControl.LocationNotAvailable': 'الموقع غير متاح' }}
          onLoad={(e) => {
            const map = e.target;
            const arabicLayers = ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label', 'airport-label', 'poi-label', 'road-label', 'natural-point-label', 'natural-line-label', 'waterway-label', 'water-point-label', 'water-line-label'];
            arabicLayers.forEach(layer => {
              try { map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch {}
            });
          }}
        >
          <NavigationControl position="bottom-right" />
          {showCurrentLocation && (
            <GeolocateControl
              ref={geolocateRef}
              position="bottom-right"
              trackUserLocation
              showUserHeading
              onGeolocate={async (e) => {
                const position = { lat: e.coords.latitude, lng: e.coords.longitude };
                setMarkerPosition(position);
                const addressResult = await reverseGeocode(position.lat, position.lng);
                setAddress(addressResult);
                if (effectiveOnChange) {
                  effectiveOnChange(position, addressResult);
                }
                toast.success('تم تحديد موقعك الحالي');
              }}
            />
          )}
          
          {markerPosition && (
            <Marker
              longitude={markerPosition.lng}
              latitude={markerPosition.lat}
              anchor="bottom"
            >
              <motion.div
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  width: '32px',
                  height: '32px',
                  background: colorMap[markerColor],
                  border: '4px solid white',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                }}
              />
            </Marker>
          )}
        </Map>
      </div>

      {/* Selected location info */}
      {address && (
        <div className="p-3 bg-muted/50 rounded-lg border text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <p className="leading-relaxed flex-1">{address}</p>
          </div>
        </div>
      )}

      {/* Coordinates display with copy button */}
      {markerPosition && (
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground" dir="ltr">
            {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyCoordinates}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>نسخ الإحداثيات</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};

export default MapboxInteractiveMapPicker;
