import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  type: 'saved' | 'nominatim' | 'organization';
  latitude?: number;
  longitude?: number;
  distance?: number; // km from reference point
  organizationName?: string;
}

interface UseEnhancedLocationSearchOptions {
  referencePoint?: { lat: number; lng: number } | null;
  includeAllOrganizations?: boolean;
}

// Haversine formula to calculate distance between two points
const calculateDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useEnhancedLocationSearch = (options: UseEnhancedLocationSearchOptions = {}) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allResults: SearchResult[] = [];

      // 1. Search in organization_locations table (saved locations)
      const { data: savedLocations } = await supabase
        .from('organization_locations')
        .select(`
          id,
          location_name,
          address,
          city,
          latitude,
          longitude,
          organization:organizations(name)
        `)
        .or(`location_name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (savedLocations) {
        savedLocations.forEach((loc: any) => {
          const result: SearchResult = {
            id: `saved-${loc.id}`,
            name: loc.location_name,
            address: loc.city ? `${loc.address}, ${loc.city}` : loc.address,
            type: 'saved',
            latitude: loc.latitude,
            longitude: loc.longitude,
            organizationName: loc.organization?.name,
          };

          // Calculate distance if reference point is available
          if (options.referencePoint && loc.latitude && loc.longitude) {
            result.distance = calculateDistance(
              options.referencePoint.lat,
              options.referencePoint.lng,
              loc.latitude,
              loc.longitude
            );
          }

          allResults.push(result);
        });
      }

      // 2. Search in organizations table
      if (options.includeAllOrganizations) {
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id, name, address, city')
          .or(`name.ilike.%${query}%,address.ilike.%${query}%,name_en.ilike.%${query}%`)
          .eq('is_verified', true)
          .eq('is_active', true)
          .limit(10);

        if (organizations) {
          organizations.forEach((org) => {
            allResults.push({
              id: `org-${org.id}`,
              name: org.name,
              address: org.city ? `${org.address}, ${org.city}` : org.address,
              type: 'organization',
              organizationName: org.name,
            });
          });
        }
      }

      // 3. Search using Nominatim API with enhanced query
      const enhancedQueries = [
        `${query}, Egypt`,
        `${query}, مصر`,
        query,
      ];

      for (const searchQuery of enhancedQueries) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=eg&limit=5&accept-language=ar&addressdetails=1`
          );
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            data.forEach((item: any) => {
              // Avoid duplicates
              const exists = allResults.some(r => 
                r.address === item.display_name ||
                (r.latitude === parseFloat(item.lat) && r.longitude === parseFloat(item.lon))
              );
              
              if (!exists) {
                const result: SearchResult = {
                  id: `nominatim-${item.place_id}`,
                  name: item.name || item.display_name.split(',')[0],
                  address: item.display_name,
                  type: 'nominatim',
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                };

                // Calculate distance if reference point is available
                if (options.referencePoint) {
                  result.distance = calculateDistance(
                    options.referencePoint.lat,
                    options.referencePoint.lng,
                    parseFloat(item.lat),
                    parseFloat(item.lon)
                  );
                }

                allResults.push(result);
              }
            });
            break; // Stop if we found results
          }
        } catch (err) {
          console.error('Nominatim search error:', err);
        }
      }

      // Sort by distance if reference point is available, otherwise by type priority
      allResults.sort((a, b) => {
        // Prioritize saved locations and organizations
        const typePriority = { saved: 0, organization: 1, nominatim: 2 };
        
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        
        return typePriority[a.type] - typePriority[b.type];
      });

      setResults(allResults.slice(0, 15)); // Limit total results
    } catch (err) {
      console.error('Enhanced search error:', err);
      setError('خطأ في البحث');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [options.referencePoint, options.includeAllOrganizations]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
};
