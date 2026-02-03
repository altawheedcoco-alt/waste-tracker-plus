import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface GoogleMapsLocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }, address?: string) => void;
  height?: string;
  showSearch?: boolean;
  label?: string;
}

// Egypt center (Cairo)
const defaultCenter = { lat: 30.0444, lng: 31.2357 };

const libraries: ("places")[] = ["places"];

const GoogleMapsLocationPicker = ({
  value,
  onChange,
  height = '400px',
  showSearch = true,
  label,
}: GoogleMapsLocationPickerProps) => {
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'ar',
    region: 'EG',
  });

  // Initialize services when map loads
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    autocompleteService.current = new google.maps.places.AutocompleteService();
    placesService.current = new google.maps.places.PlacesService(mapInstance);
    geocoder.current = new google.maps.Geocoder();
  }, []);

  // Update position when value changes
  useEffect(() => {
    if (value) {
      setSelectedPosition({ lat: value.lat, lng: value.lng });
    }
  }, [value]);

  // Reverse geocode to get address
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (!geocoder.current) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    try {
      const response = await geocoder.current.geocode({ 
        location: { lat, lng },
        language: 'ar'
      });
      
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const coords = { lat, lng };
    
    setSelectedPosition(coords);
    
    const addressResult = await reverseGeocode(lat, lng);
    setAddress(addressResult);
    onChange(coords, addressResult);
  }, [onChange, reverseGeocode]);

  // Search for places using Autocomplete
  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteService.current || !query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'eg' },
        language: 'ar',
        types: ['establishment', 'geocode'],
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSearchResults(predictions);
          setShowResults(true);
        } else {
          setSearchResults([]);
          setShowResults(false);
        }
      }
    );
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (searchQuery.length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        searchPlaces(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, searchPlaces]);

  // Select a place from results
  const selectPlace = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name'],
        language: 'ar',
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const coords = { lat, lng };
          const fullAddress = place.formatted_address || prediction.description;

          setSelectedPosition(coords);
          setAddress(fullAddress);
          setSearchQuery(prediction.structured_formatting.main_text);
          setShowResults(false);
          onChange(coords, fullAddress);

          // Pan to location
          if (map) {
            map.panTo(coords);
            map.setZoom(16);
          }

          toast.success('تم تحديد الموقع');
        }
      }
    );
  }, [map, onChange]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        
        setSelectedPosition(coords);
        
        const addressResult = await reverseGeocode(latitude, longitude);
        setAddress(addressResult);
        onChange(coords, addressResult);

        if (map) {
          map.panTo(coords);
          map.setZoom(16);
        }

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
  }, [map, onChange, reverseGeocode]);

  if (loadError) {
    return (
      <div className="p-4 text-center text-destructive">
        خطأ في تحميل خرائط جوجل
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن موقع أو عنوان..."
              className="pr-10"
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowResults(false);
                }}
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
                <CardContent className="p-0">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      type="button"
                      className="w-full text-right px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                      onClick={() => selectPlace(result)}
                    >
                      <p className="font-medium text-sm">
                        {result.structured_formatting.main_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {result.structured_formatting.secondary_text}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          
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
        className="relative rounded-lg overflow-hidden border"
        style={{ height }}
      >
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={selectedPosition || defaultCenter}
          zoom={selectedPosition ? 16 : 6}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'greedy',
          }}
        >
          {selectedPosition && (
            <Marker
              position={selectedPosition}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>

        {/* My Location FAB on map */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="absolute bottom-4 right-4 z-10 shadow-lg bg-background hover:bg-accent"
          title="موقعي الحالي"
        >
          {gettingLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Navigation className="w-5 h-5 text-primary" />
          )}
        </Button>
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
          {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
};

export default GoogleMapsLocationPicker;
