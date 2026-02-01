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
  matchScore?: number; // similarity score for sorting
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

// Fuzzy string matching - calculate similarity score (0-1)
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Check word-by-word matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchedWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1.includes(w2) || w2.includes(w1)) {
        matchedWords++;
        break;
      }
    }
  }
  
  if (matchedWords > 0) {
    return 0.5 + (matchedWords / Math.max(words1.length, words2.length)) * 0.4;
  }
  
  // Levenshtein-based similarity for typos
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 1;
  
  // Simple character overlap check
  let matches = 0;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return matches / maxLen * 0.5;
};

// Egyptian industrial zones for enhanced search
const EGYPTIAN_INDUSTRIAL_ZONES = [
  { name: 'المنطقة الصناعية ببرج العرب', nameEn: 'Borg El Arab Industrial Zone', city: 'الإسكندرية', lat: 30.8418, lng: 29.5728 },
  { name: 'المنطقة الصناعية بالعاشر من رمضان', nameEn: '10th of Ramadan Industrial Zone', city: 'الشرقية', lat: 30.2833, lng: 31.7333 },
  { name: 'المنطقة الصناعية بالسادات', nameEn: 'Sadat City Industrial Zone', city: 'المنوفية', lat: 30.3667, lng: 30.5167 },
  { name: 'المنطقة الصناعية بالعبور', nameEn: 'El Obour Industrial Zone', city: 'القليوبية', lat: 30.2167, lng: 31.4833 },
  { name: 'المنطقة الصناعية ببدر', nameEn: 'Badr City Industrial Zone', city: 'القاهرة', lat: 30.1333, lng: 31.7167 },
  { name: 'المنطقة الصناعية بالقاهرة الجديدة', nameEn: 'New Cairo Industrial Zone', city: 'القاهرة', lat: 30.0131, lng: 31.4089 },
  { name: 'المنطقة الصناعية بأكتوبر', nameEn: '6th of October Industrial Zone', city: 'الجيزة', lat: 29.9285, lng: 30.9188 },
  { name: 'المنطقة الصناعية ببني سويف', nameEn: 'Beni Suef Industrial Zone', city: 'بني سويف', lat: 29.0667, lng: 31.0833 },
  { name: 'المنطقة الصناعية بالمنيا', nameEn: 'Minya Industrial Zone', city: 'المنيا', lat: 28.1099, lng: 30.7503 },
  { name: 'المنطقة الصناعية بطنطا', nameEn: 'Tanta Industrial Zone', city: 'الغربية', lat: 30.7865, lng: 31.0004 },
  { name: 'المنطقة الصناعية ببنها', nameEn: 'Benha Industrial Zone', city: 'القليوبية', lat: 30.4667, lng: 31.1833 },
  { name: 'المنطقة الصناعية بالزقازيق', nameEn: 'Zagazig Industrial Zone', city: 'الشرقية', lat: 30.5833, lng: 31.5167 },
  { name: 'المنطقة الصناعية بالإسماعيلية', nameEn: 'Ismailia Industrial Zone', city: 'الإسماعيلية', lat: 30.5833, lng: 32.2667 },
  { name: 'المنطقة الصناعية ببورسعيد', nameEn: 'Port Said Industrial Zone', city: 'بورسعيد', lat: 31.2653, lng: 32.3019 },
  { name: 'المنطقة الصناعية بدمياط', nameEn: 'Damietta Industrial Zone', city: 'دمياط', lat: 31.4167, lng: 31.8167 },
  { name: 'المنطقة الصناعية بالمحلة', nameEn: 'El Mahalla Industrial Zone', city: 'الغربية', lat: 30.9667, lng: 31.1667 },
  { name: 'المنطقة الصناعية بكفر الدوار', nameEn: 'Kafr El Dawar Industrial Zone', city: 'البحيرة', lat: 31.1333, lng: 30.1333 },
  { name: 'المنطقة الصناعية بالروبيكي', nameEn: 'Robeiki Industrial Zone', city: 'القاهرة', lat: 30.1833, lng: 31.6333 },
  { name: 'المنطقة الصناعية بسوهاج', nameEn: 'Sohag Industrial Zone', city: 'سوهاج', lat: 26.5569, lng: 31.6948 },
  { name: 'المنطقة الصناعية بأسيوط', nameEn: 'Assiut Industrial Zone', city: 'أسيوط', lat: 27.1783, lng: 31.1859 },
];

export const useEnhancedLocationSearch = (options: UseEnhancedLocationSearchOptions = {}) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allResults: SearchResult[] = [];
      const queryLower = query.toLowerCase().trim();

      // 1. Search in organization_locations table (saved locations) - Enhanced with Arabic and English
      const { data: savedLocations } = await supabase
        .from('organization_locations')
        .select(`
          id,
          location_name,
          address,
          city,
          latitude,
          longitude,
          organization:organizations(name, name_en)
        `)
        .or(`location_name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(15);

      if (savedLocations) {
        savedLocations.forEach((loc: any) => {
          const matchScore = Math.max(
            calculateSimilarity(query, loc.location_name || ''),
            calculateSimilarity(query, loc.address || ''),
            calculateSimilarity(query, loc.organization?.name || ''),
            calculateSimilarity(query, loc.organization?.name_en || '')
          );

          const result: SearchResult = {
            id: `saved-${loc.id}`,
            name: loc.location_name,
            address: loc.city ? `${loc.address}, ${loc.city}` : loc.address,
            type: 'saved',
            latitude: loc.latitude,
            longitude: loc.longitude,
            organizationName: loc.organization?.name,
            matchScore,
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

      // 2. Search in organizations table - Enhanced with English names
      if (options.includeAllOrganizations) {
        const { data: organizations } = await supabase
          .from('organizations')
          .select('id, name, name_en, address, city')
          .or(`name.ilike.%${query}%,address.ilike.%${query}%,name_en.ilike.%${query}%,city.ilike.%${query}%`)
          .eq('is_verified', true)
          .eq('is_active', true)
          .limit(20);

        if (organizations) {
          organizations.forEach((org) => {
            const matchScore = Math.max(
              calculateSimilarity(query, org.name || ''),
              calculateSimilarity(query, org.name_en || ''),
              calculateSimilarity(query, org.address || ''),
              calculateSimilarity(query, org.city || '')
            );

            // Skip if score is too low
            if (matchScore < 0.3) return;

            allResults.push({
              id: `org-${org.id}`,
              name: org.name_en ? `${org.name} (${org.name_en})` : org.name,
              address: org.city ? `${org.address}, ${org.city}` : org.address,
              type: 'organization',
              organizationName: org.name,
              matchScore,
            });
          });
        }
      }

      // 3. Search in Egyptian industrial zones
      EGYPTIAN_INDUSTRIAL_ZONES.forEach((zone) => {
        const matchScore = Math.max(
          calculateSimilarity(query, zone.name),
          calculateSimilarity(query, zone.nameEn),
          calculateSimilarity(query, zone.city)
        );

        if (matchScore >= 0.4) {
          const result: SearchResult = {
            id: `zone-${zone.nameEn.replace(/\s+/g, '-').toLowerCase()}`,
            name: zone.name,
            address: `${zone.nameEn}, ${zone.city}`,
            type: 'saved',
            latitude: zone.lat,
            longitude: zone.lng,
            matchScore,
          };

          if (options.referencePoint) {
            result.distance = calculateDistance(
              options.referencePoint.lat,
              options.referencePoint.lng,
              zone.lat,
              zone.lng
            );
          }

          allResults.push(result);
        }
      });

      // 4. Search using Nominatim API with enhanced queries (Arabic + English)
      const enhancedQueries = [
        `${query} industrial Egypt`,
        `${query} factory Egypt`,
        `مصنع ${query} مصر`,
        `${query}, Egypt`,
        `${query}, مصر`,
        query,
      ];

      for (const searchQuery of enhancedQueries.slice(0, 3)) { // Limit API calls
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=eg&limit=5&accept-language=ar,en&addressdetails=1`
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
                const matchScore = calculateSimilarity(query, item.display_name);

                const result: SearchResult = {
                  id: `nominatim-${item.place_id}`,
                  name: item.name || item.display_name.split(',')[0],
                  address: item.display_name,
                  type: 'nominatim',
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                  matchScore,
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

      // Sort by match score first, then by distance, then by type priority
      allResults.sort((a, b) => {
        // First, sort by match score (higher is better)
        const scoreA = a.matchScore || 0;
        const scoreB = b.matchScore || 0;
        
        if (Math.abs(scoreA - scoreB) > 0.1) {
          return scoreB - scoreA;
        }

        // Then by distance if available
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        
        // Finally by type priority
        const typePriority = { saved: 0, organization: 1, nominatim: 2 };
        return typePriority[a.type] - typePriority[b.type];
      });

      // Remove duplicates and limit results
      const uniqueResults = allResults.filter((result, index, self) =>
        index === self.findIndex(r => 
          r.name.toLowerCase() === result.name.toLowerCase() ||
          (r.latitude && result.latitude && 
           Math.abs(r.latitude - result.latitude) < 0.001 && 
           Math.abs((r.longitude || 0) - (result.longitude || 0)) < 0.001)
        )
      );

      setResults(uniqueResults.slice(0, 20)); // Limit total results
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
