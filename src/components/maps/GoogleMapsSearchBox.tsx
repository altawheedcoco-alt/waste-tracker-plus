/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MapPin, X, Building2, Factory, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchEgyptLocations, EgyptLocation } from '@/data/egyptLocations';

interface GoogleMapsSearchBoxProps {
  onSelect: (result: {
    position: { lat: number; lng: number };
    address: string;
    name: string;
    type?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  showLocalResults?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  address: string;
  position: { lat: number; lng: number };
  type: 'local' | 'google';
  category?: string;
}

const GoogleMapsSearchBox = ({
  onSelect,
  placeholder = 'ابحث عن موقع أو مصنع...',
  className = '',
  showLocalResults = true,
}: GoogleMapsSearchBoxProps) => {
  const { isLoaded } = useGoogleMaps();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Initialize services
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
    }
  }, [isLoaded]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const allResults: SearchResult[] = [];

    // Search local Egypt locations first
    if (showLocalResults) {
      const localResults = searchEgyptLocations(searchQuery);
      localResults.slice(0, 5).forEach((loc: EgyptLocation) => {
        allResults.push({
          id: `local-${loc.id}`,
          name: loc.name,
          address: `${loc.name}، ${loc.governorate}`,
          position: { lat: loc.lat, lng: loc.lng },
          type: 'local',
          category: loc.type,
        });
      });
    }

    // Search Google Places
    if (autocompleteServiceRef.current) {
      try {
        const request: google.maps.places.AutocompletionRequest = {
          input: searchQuery,
          componentRestrictions: { country: 'eg' },
          language: 'ar',
        };

        autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            predictions.slice(0, 5).forEach((pred) => {
              allResults.push({
                id: pred.place_id,
                name: pred.structured_formatting.main_text,
                address: pred.description,
                position: { lat: 0, lng: 0 }, // Will be fetched on select
                type: 'google',
              });
            });
          }
          setResults(allResults);
          setShowResults(true);
          setIsSearching(false);
        });
      } catch (error) {
        console.error('Search error:', error);
        setResults(allResults);
        setShowResults(true);
        setIsSearching(false);
      }
    } else {
      setResults(allResults);
      setShowResults(true);
      setIsSearching(false);
    }
  }, [showLocalResults]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'local') {
      setQuery(result.name);
      setShowResults(false);
      onSelect({
        position: result.position,
        address: result.address,
        name: result.name,
        type: result.category,
      });
    } else if (result.type === 'google' && placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId: result.id, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            setQuery(result.name);
            setShowResults(false);
            onSelect({
              position: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
              address: place.formatted_address || result.address,
              name: place.name || result.name,
            });
          }
        }
      );
    }
  };

  const getTypeIcon = (category?: string) => {
    switch (category) {
      case 'industrial':
        return <Factory className="h-4 w-4" />;
      case 'landmark':
        return <Landmark className="h-4 w-4" />;
      case 'city':
      case 'district':
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="pr-10 pl-10"
          dir="rtl"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
          {query && !isSearching && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          <ScrollArea className="max-h-[300px]">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => handleSelect(result)}
              >
                <div className="text-primary flex-shrink-0">
                  {result.type === 'local' ? getTypeIcon(result.category) : <MapPin className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{result.name}</p>
                    {result.type === 'local' && (
                      <Badge variant="secondary" className="text-[10px] px-1">محلي</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{result.address}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 p-4 text-center text-muted-foreground text-sm">
          لا توجد نتائج
        </div>
      )}
    </div>
  );
};

export default GoogleMapsSearchBox;
