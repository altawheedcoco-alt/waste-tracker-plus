/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import GoogleMapComponent from './GoogleMapComponent';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, MapPin, X, Navigation, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GoogleMapsLocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }, address?: string) => void;
  height?: string;
  showSearch?: boolean;
  showCurrentLocation?: boolean;
  label?: string;
  className?: string;
  placeholder?: string;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const GoogleMapsLocationPicker = ({
  value,
  onChange,
  height = '400px',
  showSearch = true,
  showCurrentLocation = true,
  label,
  className = '',
  placeholder = 'ابحث عن موقع في مصر...',
}: GoogleMapsLocationPickerProps) => {
  const { isLoaded } = useGoogleMaps();
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize Places services
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      
      // Create a dummy div for PlacesService (required by API)
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
    }
  }, [isLoaded]);

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search places
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);
    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'eg' },
        language: 'ar',
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results as PlacePrediction[]);
          setShowResults(true);
        } else {
          setPredictions([]);
        }
        setIsSearching(false);
      });
    } catch (error) {
      console.error('Search error:', error);
      setPredictions([]);
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
    }, 300);
  };

  // Select a prediction
  const selectPrediction = (prediction: PlacePrediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry', 'formatted_address'] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const position = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          const address = place.formatted_address || prediction.description;

          setSearchQuery(prediction.structured_formatting.main_text);
          setSelectedAddress(address);
          setShowResults(false);
          onChange(position, address);
          toast.success('تم تحديد الموقع');
        }
      }
    );
  };

  // Handle map position select
  const handlePositionSelect = (position: { lat: number; lng: number }, address?: string) => {
    setSelectedAddress(address || '');
    onChange(position, address);
    toast.success('تم تحديد الموقع');
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('متصفحك لا يدعم تحديد الموقع');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Reverse geocode
        let address = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        if (window.google) {
          const geocoder = new window.google.maps.Geocoder();
          try {
            const result = await geocoder.geocode({ location: coords });
            if (result.results[0]) {
              address = result.results[0].formatted_address;
            }
          } catch (error) {
            console.error('Geocoding error:', error);
          }
        }

        setSelectedAddress(address);
        onChange(coords, address);
        toast.success('تم تحديد موقعك الحالي');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('فشل تحديد الموقع');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Copy coordinates
  const copyCoordinates = () => {
    if (value) {
      const text = `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`;
      navigator.clipboard.writeText(text);
      toast.success('تم نسخ الإحداثيات');
    }
  };

  // Open in Google Maps
  const openInGoogleMaps = () => {
    if (value) {
      const url = `https://www.google.com/maps?q=${value.lat},${value.lng}`;
      window.open(url, '_blank');
    }
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
                onFocus={() => predictions.length > 0 && setShowResults(true)}
                placeholder={placeholder}
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
                      setPredictions([]);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {showResults && predictions.length > 0 && (
              <div className="mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden">
                <ScrollArea className="max-h-[200px]">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      type="button"
                      className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => selectPrediction(prediction)}
                    >
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {prediction.structured_formatting.main_text}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prediction.structured_formatting.secondary_text}
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
            className="absolute bottom-16 right-3 z-10 h-10 w-10 rounded-full shadow-lg bg-background"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Map */}
        <GoogleMapComponent
          center={value || { lat: 30.0444, lng: 31.2357 }}
          zoom={value ? 15 : 12}
          selectedPosition={value}
          onPositionSelect={handlePositionSelect}
          height={height}
          clickable={true}
        />
      </div>

      {/* Selected location info */}
      {selectedAddress && (
        <div className="p-3 bg-muted/50 rounded-lg border text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <p className="leading-relaxed flex-1">{selectedAddress}</p>
          </div>
        </div>
      )}

      {/* Coordinates display with actions */}
      {value && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span dir="ltr">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={copyCoordinates}
              title="نسخ الإحداثيات"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={openInGoogleMaps}
              title="فتح في خرائط جوجل"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsLocationPicker;
