import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

// Egyptian industrial zones and factories database
export const EGYPTIAN_INDUSTRIAL_DATA = [
  // Industrial Zones
  { name: 'المنطقة الصناعية بالسادس من أكتوبر', type: 'zone', city: 'السادس من أكتوبر', lat: 29.9375, lng: 30.9278 },
  { name: 'المنطقة الصناعية بالعاشر من رمضان', type: 'zone', city: 'العاشر من رمضان', lat: 30.2833, lng: 31.7500 },
  { name: 'المنطقة الصناعية ببرج العرب', type: 'zone', city: 'الإسكندرية', lat: 30.8575, lng: 29.5433 },
  { name: 'المنطقة الصناعية بالسويس', type: 'zone', city: 'السويس', lat: 29.9833, lng: 32.5500 },
  { name: 'المنطقة الصناعية ببنها', type: 'zone', city: 'بنها', lat: 30.4667, lng: 31.1833 },
  { name: 'المنطقة الصناعية بالسادات', type: 'zone', city: 'مدينة السادات', lat: 30.3708, lng: 30.5106 },
  { name: 'المنطقة الصناعية بقويسنا', type: 'zone', city: 'قويسنا', lat: 30.5583, lng: 31.1583 },
  { name: 'المنطقة الصناعية بطنطا', type: 'zone', city: 'طنطا', lat: 30.7833, lng: 31.0000 },
  { name: 'المنطقة الصناعية بدمياط', type: 'zone', city: 'دمياط', lat: 31.4175, lng: 31.8144 },
  { name: 'المنطقة الصناعية بالمحلة الكبرى', type: 'zone', city: 'المحلة الكبرى', lat: 30.9667, lng: 31.1667 },
  { name: 'المنطقة الصناعية بالفيوم', type: 'zone', city: 'الفيوم', lat: 29.3100, lng: 30.8417 },
  { name: 'المنطقة الصناعية بأسيوط', type: 'zone', city: 'أسيوط', lat: 27.1833, lng: 31.1833 },
  { name: 'المنطقة الصناعية بسوهاج', type: 'zone', city: 'سوهاج', lat: 26.5567, lng: 31.6950 },
  { name: 'المنطقة الصناعية بأسوان', type: 'zone', city: 'أسوان', lat: 24.0875, lng: 32.8994 },
  { name: 'المنطقة الصناعية بالإسماعيلية', type: 'zone', city: 'الإسماعيلية', lat: 30.6000, lng: 32.2667 },
  { name: 'المنطقة الصناعية ببورسعيد', type: 'zone', city: 'بورسعيد', lat: 31.2589, lng: 32.2847 },
  { name: 'المنطقة الحرة بالمنطقة الاقتصادية بقناة السويس', type: 'zone', city: 'العين السخنة', lat: 29.5500, lng: 32.3667 },
  { name: 'المنطقة الصناعية بالروبيكي', type: 'zone', city: 'الروبيكي', lat: 30.0500, lng: 31.4500 },
  { name: 'مدينة الأثاث بدمياط', type: 'zone', city: 'دمياط', lat: 31.4200, lng: 31.8200 },
  { name: 'مجمع البتروكيماويات بالعين السخنة', type: 'zone', city: 'العين السخنة', lat: 29.5833, lng: 32.3500 },
  // Major Factories
  { name: 'مصنع حديد عز - السادس من أكتوبر', type: 'factory', city: 'السادس من أكتوبر', lat: 29.9600, lng: 30.9100 },
  { name: 'مصنع السكر والصناعات التكاملية - الحوامدية', type: 'factory', city: 'الحوامدية', lat: 29.9000, lng: 31.2333 },
  { name: 'مصنع الأسمنت - السويس', type: 'factory', city: 'السويس', lat: 29.9667, lng: 32.5333 },
  { name: 'مصنع الأسمنت - طرة', type: 'factory', city: 'طرة', lat: 29.9333, lng: 31.2833 },
  { name: 'مصانع النسيج - المحلة الكبرى', type: 'factory', city: 'المحلة الكبرى', lat: 30.9750, lng: 31.1667 },
  { name: 'مصنع السيراميك - السويس', type: 'factory', city: 'السويس', lat: 29.9500, lng: 32.5500 },
  { name: 'مصنع الزجاج - أبو رواش', type: 'factory', city: 'أبو رواش', lat: 30.0500, lng: 31.1000 },
  { name: 'مصنع البلاستيك - العاشر من رمضان', type: 'factory', city: 'العاشر من رمضان', lat: 30.2900, lng: 31.7600 },
  { name: 'مصانع الغزل والنسيج - كفر الدوار', type: 'factory', city: 'كفر الدوار', lat: 31.1333, lng: 30.1333 },
  { name: 'مصنع الألومنيوم - نجع حمادي', type: 'factory', city: 'نجع حمادي', lat: 26.0500, lng: 32.2333 },
  { name: 'مصنع الحديد والصلب - حلوان', type: 'factory', city: 'حلوان', lat: 29.8500, lng: 31.3000 },
  { name: 'مصنع الأسمدة - طلخا', type: 'factory', city: 'طلخا', lat: 31.0667, lng: 31.3667 },
  { name: 'مصانع البترول - مسطرد', type: 'factory', city: 'مسطرد', lat: 30.1333, lng: 31.2833 },
  { name: 'مصنع الورق - قنا', type: 'factory', city: 'قنا', lat: 26.1667, lng: 32.7167 },
  { name: 'مجمع الصناعات الغذائية - أبو رواش', type: 'factory', city: 'أبو رواش', lat: 30.0600, lng: 31.0900 },
  { name: 'مصنع التوحيد للأخشاب - السادس من أكتوبر', type: 'factory', city: 'السادس من أكتوبر', lat: 29.9375, lng: 30.9278 },
  // Waste Management Facilities
  { name: 'مدفن صحي - العاشر من رمضان', type: 'facility', city: 'العاشر من رمضان', lat: 30.3000, lng: 31.7700 },
  { name: 'محطة تدوير النفايات - السادس من أكتوبر', type: 'facility', city: 'السادس من أكتوبر', lat: 29.9200, lng: 30.9000 },
  { name: 'مصنع تدوير البلاستيك - برج العرب', type: 'facility', city: 'برج العرب', lat: 30.8600, lng: 29.5500 },
  { name: 'محطة معالجة النفايات - أبو رواش', type: 'facility', city: 'أبو رواش', lat: 30.0400, lng: 31.0800 },
  { name: 'مصنع تدوير الورق - العبور', type: 'facility', city: 'العبور', lat: 30.2167, lng: 31.4667 },
];

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: 'mapbox' | 'local' | 'ai';
  source: string;
  lat: number;
  lng: number;
  relevanceScore?: number;
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

export const useMultiSourceSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

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
      .slice(0, 5);
  }, []);

  // Search Mapbox Geocoding
  const searchMapbox = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&language=ar&country=eg&limit=5&types=address,place,locality,neighborhood,poi`
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
    } catch (error) {
      console.error('Mapbox search error:', error);
      return [];
    }
  }, []);

  // Search using AI assistant
  const searchWithAI = useCallback(async (query: string): Promise<AISearchSuggestion | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-location-search', {
        body: { query }
      });
      
      if (error) {
        console.error('AI search error:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('AI search error:', error);
      return null;
    }
  }, []);

  // Combined search
  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      setAiSuggestions(null);
      return;
    }

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

        // Add local results first (higher priority)
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

        // Sort by relevance
        allResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

        setResults(allResults.slice(0, 10));
        setAiSuggestions(aiData);
      } catch (err) {
        console.error('Search error:', err);
        setError('حدث خطأ أثناء البحث');
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [searchLocalDatabase, searchMapbox, searchWithAI]);

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
  };
};
