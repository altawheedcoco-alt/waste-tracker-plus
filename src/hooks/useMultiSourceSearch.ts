import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EGYPTIAN_INDUSTRIAL_DATA } from '@/data/egyptianIndustrialData';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: 'mapbox' | 'local' | 'ai';
  source: string;
  lat: number;
  lng: number;
  relevanceScore?: number;
  distance?: number;
  rank?: number;
}

export interface AISearchSuggestion {
  alternativeQueries: string[];
  suggestedLocations: {
    name: string;
    type: string;
    city: string;
  }[];
  correctedQuery?: string;
}

// Re-export for backward compatibility
export { EGYPTIAN_INDUSTRIAL_DATA };

export const useMultiSourceSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Get user location on first use
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Cairo
          setUserLocation({ lat: 30.0444, lng: 31.2357 });
        }
      );
    }
  }, [userLocation]);

  // Search local database
  const searchLocalDatabase = useCallback((query: string): SearchResult[] => {
    const normalizedQuery = query.toLowerCase().trim();
    const arabicQuery = query.trim();
    
    return EGYPTIAN_INDUSTRIAL_DATA
      .filter(item => 
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.name.includes(arabicQuery) ||
        item.city.toLowerCase().includes(normalizedQuery) ||
        item.city.includes(arabicQuery) ||
        item.type.toLowerCase().includes(normalizedQuery)
      )
      .map((item, index) => ({
        id: `local-${index}`,
        name: item.name,
        address: item.city,
        type: 'local' as const,
        source: item.type === 'zone' ? 'منطقة صناعية' : item.type === 'factory' ? 'مصنع' : 'منشأة',
        lat: item.lat,
        lng: item.lng,
        relevanceScore: item.name.includes(arabicQuery) ? 100 : 80,
      }))
      .slice(0, 10);
  }, []);

  // Search Mapbox Geocoding
  const searchMapbox = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=ar&country=eg&limit=10&types=address,place,locality,neighborhood,poi`
      );
      const data = await response.json();
      
      if (data.features) {
        return data.features.map((feature: any) => ({
          id: feature.id,
          name: feature.text,
          address: feature.place_name,
          type: 'mapbox' as const,
          source: 'خرائط',
          lat: feature.center[1],
          lng: feature.center[0],
          relevanceScore: feature.relevance ? feature.relevance * 100 : 70,
        }));
      }
      return [];
    } catch (err) {
      console.error('Mapbox search error:', err);
      return [];
    }
  }, []);

  // Search using AI assistant
  const searchWithAI = useCallback(async (query: string): Promise<AISearchSuggestion | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-location-search', {
        body: { query }
      });
      
      if (fnError) {
        console.error('AI search error:', fnError);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('AI search error:', err);
      return null;
    }
  }, []);

  // Combined search - starts from 2 characters
  const search = useCallback(async (query: string) => {
    // Start search from 2 characters
    if (!query || query.length < 2) {
      setResults([]);
      setAiSuggestions(null);
      return;
    }

    // Get user location if not set
    getUserLocation();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        // Run all searches in parallel
        const [localResults, mapboxResults, aiData] = await Promise.all([
          Promise.resolve(searchLocalDatabase(query)),
          searchMapbox(query),
          searchWithAI(query),
        ]);

        // Combine and deduplicate results
        const allResults: SearchResult[] = [];
        const seenNames = new Set<string>();

        // Add local results (high priority)
        localResults.forEach(result => {
          const key = result.name.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            allResults.push(result);
          }
        });

        // Add mapbox results
        mapboxResults.forEach(result => {
          const key = result.name.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            allResults.push(result);
          }
        });

        // Sort by distance if available, then by relevance
        allResults.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });

        // Take top 50 results
        setResults(allResults.slice(0, 50));
        setAiSuggestions(aiData);
      } catch (err) {
        console.error('Search error:', err);
        setError('حدث خطأ أثناء البحث');
      } finally {
        setIsSearching(false);
      }
    }, 200); // Faster debounce for better responsiveness
  }, [searchLocalDatabase, searchMapbox, searchWithAI, getUserLocation]);

  const clearResults = useCallback(() => {
    setResults([]);
    setAiSuggestions(null);
    setError(null);
  }, []);

  return {
    search,
    results,
    aiSuggestions,
    isSearching,
    error,
    clearResults,
    userLocation,
  };
};
