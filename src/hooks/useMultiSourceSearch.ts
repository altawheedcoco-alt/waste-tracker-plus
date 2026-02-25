import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EGYPTIAN_INDUSTRIAL_DATA } from '@/data/egyptianIndustrialData';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: 'osm' | 'local' | 'ai' | 'google';
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

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setUserLocation({ lat: 30.0444, lng: 31.2357 })
      );
    }
  }, [userLocation]);

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

  // Search OSM Nominatim (replaces Mapbox geocoding)
  const searchOSM = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=10&accept-language=ar`
      );
      const data = await response.json();
      
      return (data || []).map((item: any, i: number) => ({
        id: `osm-${item.place_id}-${i}`,
        name: item.display_name?.split(',')[0] || '',
        address: item.display_name || '',
        type: 'osm' as const,
        source: 'خرائط',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        relevanceScore: 70,
      }));
    } catch (err) {
      console.error('OSM search error:', err);
      return [];
    }
  }, []);

  const searchGooglePlaces = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('google-places-search', {
        body: { query, userLat: userLocation?.lat || 30.0444, userLng: userLocation?.lng || 31.2357, radius: 100000 }
      });
      if (fnError) return [];
      return (data?.results || []).map((place: any) => ({
        id: place.id, name: place.name, address: place.address,
        type: 'google' as const, source: 'Google Maps',
        lat: place.lat, lng: place.lng, distance: place.distance,
        rank: place.rank, relevanceScore: place.rank ? 100 - place.rank : 50,
      }));
    } catch { return []; }
  }, [userLocation]);

  const searchWithAI = useCallback(async (query: string): Promise<AISearchSuggestion | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-location-search', { body: { query } });
      if (fnError) return null;
      return data;
    } catch { return null; }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setResults([]); setAiSuggestions(null); return; }
    getUserLocation();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const [localResults, osmResults, googleResults, aiData] = await Promise.all([
          Promise.resolve(searchLocalDatabase(query)),
          searchOSM(query),
          searchGooglePlaces(query),
          searchWithAI(query),
        ]);

        const allResults: SearchResult[] = [];
        const seenNames = new Set<string>();

        googleResults.forEach(result => { const key = result.name.toLowerCase(); if (!seenNames.has(key)) { seenNames.add(key); allResults.push(result); } });
        localResults.forEach(result => { const key = result.name.toLowerCase(); if (!seenNames.has(key)) { seenNames.add(key); allResults.push(result); } });
        osmResults.forEach(result => { const key = result.name.toLowerCase(); if (!seenNames.has(key)) { seenNames.add(key); allResults.push(result); } });

        allResults.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        });

        setResults(allResults.slice(0, 50));
        setAiSuggestions(aiData);
      } catch (err) {
        console.error('Search error:', err);
        setError('حدث خطأ أثناء البحث');
      } finally {
        setIsSearching(false);
      }
    }, 200);
  }, [searchLocalDatabase, searchOSM, searchGooglePlaces, searchWithAI, getUserLocation]);

  const clearResults = useCallback(() => { setResults([]); setAiSuggestions(null); setError(null); }, []);

  return { search, results, aiSuggestions, isSearching, error, clearResults, userLocation };
};
