/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Navigation, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GooglePlacesSearchProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }, placeId?: string) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocation?: boolean;
  disabled?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Google Places Autocomplete component for address search
 * Uses Google Places API for accurate Egyptian location data
 */
const GooglePlacesSearch = ({
  value,
  onChange,
  placeholder = 'ابحث عن عنوان...',
  className = '',
  showCurrentLocation = true,
  disabled = false,
}: GooglePlacesSearchProps) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize Google Places services
  useEffect(() => {
    const initServices = () => {
      if (typeof google !== 'undefined' && google.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        // Create a dummy div for PlacesService (required)
        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        setIsGoogleReady(true);
      }
    };

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps?.places) {
      initServices();
    } else {
      // Wait for Google Maps to load
      const checkInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps?.places) {
          initServices();
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup after 10 seconds
      const timeout = setTimeout(() => clearInterval(checkInterval), 10000);
      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, []);

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

  // Search for predictions
  const searchPredictions = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'eg' }, // Restrict to Egypt
        types: ['geocode', 'establishment'],
        language: 'ar', // Arabic results
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.slice(0, 5) as unknown as PlacePrediction[]);
          setShowDropdown(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

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
      searchPredictions(newValue);
    }, 300);
  };

  // Get place details and coordinates
  const selectPlace = (prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    setIsLoading(true);
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'name'],
      },
      (place, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const address = place.formatted_address || prediction.description;
          const coords = place.geometry?.location
            ? {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }
            : undefined;

          setInputValue(address);
          onChange(address, coords, prediction.place_id);
          setShowDropdown(false);
          setPredictions([]);
        }
      }
    );
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

        // Reverse geocode using Google
        if (typeof google !== 'undefined' && google.maps) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsGettingLocation(false);
              if (status === 'OK' && results?.[0]) {
                const address = results[0].formatted_address;
                setInputValue(address);
                onChange(address, { lat: latitude, lng: longitude });
                toast.success('تم تحديد موقعك الحالي');
              } else {
                // Fallback to coordinates
                const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setInputValue(address);
                onChange(address, { lat: latitude, lng: longitude });
              }
            }
          );
        } else {
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
    setPredictions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
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
                <Navigation className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Not ready message */}
      {!isGoogleReady && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg p-3 text-center text-sm text-muted-foreground">
          جاري تحميل خدمة البحث...
        </div>
      )}

      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30">
                <span className="mr-1">🇪🇬</span> مصر
              </Badge>
              <span className="text-xs text-muted-foreground">نتائج من Google Maps</span>
            </div>
          </div>
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="w-full px-3 py-2.5 text-right hover:bg-accent transition-colors flex items-start gap-3"
              onClick={() => selectPlace(prediction)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Google Attribution */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute bottom-[-20px] left-0 right-0 flex justify-end">
          <img
            src="https://developers.google.com/static/maps/documentation/images/powered_by_google_on_white.png"
            alt="Powered by Google"
            className="h-4 opacity-70"
          />
        </div>
      )}
    </div>
  );
};

export default GooglePlacesSearch;
