import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Loader2, X, Sparkles, Building2, Factory, 
  MapPinned, MapPin, Lightbulb, Car, Database, Globe
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

export interface SearchResultItem {
  id: string;
  name: string;
  address: string;
  type: 'factory' | 'vehicle' | 'mapbox' | 'local' | 'ai';
  source: string;
  lat: number;
  lng: number;
  relevanceScore?: number;
  distance?: number;
  metadata?: Record<string, any>;
}

interface MapboxSearchBoxProps {
  onResultSelect: (result: SearchResultItem) => void;
  placeholder?: string;
  className?: string;
  includeFactories?: boolean;
  includeVehicles?: boolean;
  includeMapbox?: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export const MapboxSearchBox = ({
  onResultSelect,
  placeholder = 'ابحث عن موقع، مصنع، سيارة...',
  className,
  includeFactories = true,
  includeVehicles = true,
  includeMapbox = true,
  userLocation,
}: MapboxSearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    correctedQuery?: string;
    alternativeQueries: string[];
  } | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search factories from database - بحث عام يشمل جميع النتائج المتشابهة
  const searchFactories = useCallback(async (searchQuery: string): Promise<SearchResultItem[]> => {
    if (!includeFactories) return [];
    
    try {
      // تقسيم الاستعلام إلى كلمات للبحث الموسع
      const words = searchQuery.trim().split(/\s+/).filter(w => w.length >= 2);
      
      // بناء شروط البحث لكل كلمة
      let orConditions: string[] = [];
      
      // البحث بالنص الكامل
      orConditions.push(`name.ilike.%${searchQuery}%`);
      orConditions.push(`name_ar.ilike.%${searchQuery}%`);
      orConditions.push(`city.ilike.%${searchQuery}%`);
      orConditions.push(`governorate.ilike.%${searchQuery}%`);
      orConditions.push(`address.ilike.%${searchQuery}%`);
      
      // البحث بكل كلمة على حدة
      words.forEach(word => {
        orConditions.push(`name.ilike.%${word}%`);
        orConditions.push(`name_ar.ilike.%${word}%`);
        orConditions.push(`city.ilike.%${word}%`);
        orConditions.push(`governorate.ilike.%${word}%`);
      });

      const { data, error } = await supabase
        .from('industrial_facilities')
        .select('id, name, name_ar, facility_type, address, city, governorate, latitude, longitude, is_verified')
        .or(orConditions.join(','))
        .order('is_verified', { ascending: false })
        .limit(50); // زيادة عدد النتائج

      if (error) throw error;

      // حساب درجة التطابق لكل نتيجة
      return (data || []).map((facility) => {
        const displayName = facility.name_ar || facility.name;
        const searchLower = searchQuery.toLowerCase();
        const nameLower = displayName.toLowerCase();
        
        // حساب درجة الصلة
        let score = 50; // درجة أساسية
        if (nameLower === searchLower) score = 100;
        else if (nameLower.startsWith(searchLower)) score = 95;
        else if (nameLower.includes(searchLower)) score = 90;
        else {
          // مطابقة الكلمات الفردية
          words.forEach(word => {
            if (nameLower.includes(word.toLowerCase())) score += 10;
          });
        }
        if (facility.is_verified) score += 5;
        
        return {
          id: `factory-${facility.id}`,
          name: displayName,
          address: [facility.address, facility.city, facility.governorate].filter(Boolean).join('، '),
          type: 'factory' as const,
          source: facility.facility_type === 'factory' ? 'مصنع' : 
                  facility.facility_type === 'zone' ? 'منطقة صناعية' : 
                  facility.facility_type === 'recycling' ? 'منشأة تدوير' :
                  facility.facility_type === 'workshop' ? 'ورشة' :
                  facility.facility_type === 'plant' ? 'مصنع كبير' : 'منشأة',
          lat: facility.latitude,
          lng: facility.longitude,
          relevanceScore: score,
          metadata: { isVerified: facility.is_verified, facilityType: facility.facility_type },
        };
      }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } catch (error) {
      console.error('Factory search error:', error);
      return [];
    }
  }, [includeFactories]);

  // Search vehicles/drivers from database
  const searchVehicles = useCallback(async (searchQuery: string): Promise<SearchResultItem[]> => {
    if (!includeVehicles) return [];
    
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          vehicle_plate,
          vehicle_type,
          is_available,
          profile:profiles!drivers_profile_id_fkey(full_name, phone)
        `)
        .or(`vehicle_plate.ilike.%${searchQuery}%,vehicle_type.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Get latest location for each driver
      const driverIds = (data || []).map(d => d.id);
      
      if (driverIds.length === 0) return [];

      const { data: locations } = await supabase
        .from('driver_location_logs')
        .select('driver_id, latitude, longitude, recorded_at')
        .in('driver_id', driverIds)
        .order('recorded_at', { ascending: false });

      // Get latest location per driver
      const latestLocations = new Map<string, { lat: number; lng: number }>();
      (locations || []).forEach((loc) => {
        if (!latestLocations.has(loc.driver_id)) {
          latestLocations.set(loc.driver_id, { lat: loc.latitude, lng: loc.longitude });
        }
      });

      return (data || [])
        .filter(driver => latestLocations.has(driver.id))
        .map((driver) => {
          const location = latestLocations.get(driver.id)!;
          const profile = driver.profile as { full_name: string; phone: string } | null;
          return {
            id: `vehicle-${driver.id}`,
            name: `${driver.vehicle_plate || 'سيارة'} - ${profile?.full_name || 'سائق'}`,
            address: driver.vehicle_type || 'مركبة',
            type: 'vehicle' as const,
            source: driver.is_available ? 'متاح' : 'غير متاح',
            lat: location.lat,
            lng: location.lng,
            relevanceScore: driver.is_available ? 90 : 70,
            metadata: { 
              driverId: driver.id, 
              isAvailable: driver.is_available,
              vehiclePlate: driver.vehicle_plate,
              driverName: profile?.full_name,
            },
          };
        });
    } catch (error) {
      console.error('Vehicle search error:', error);
      return [];
    }
  }, [includeVehicles]);

  // Search using Mapbox Geocoding API
  const searchMapbox = useCallback(async (searchQuery: string): Promise<SearchResultItem[]> => {
    if (!includeMapbox) return [];
    
    try {
      // Build proximity parameter if user location available
      const proximityParam = userLocation 
        ? `&proximity=${userLocation.lng},${userLocation.lat}` 
        : '';
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&language=ar&country=eg&limit=10&types=address,place,locality,neighborhood,poi${proximityParam}`
      );
      
      if (!response.ok) throw new Error('Mapbox API error');
      
      const data = await response.json();

      return (data.features || []).map((feature: any) => ({
        id: `mapbox-${feature.id}`,
        name: feature.text || feature.place_name,
        address: feature.place_name,
        type: 'mapbox' as const,
        source: 'Mapbox',
        lat: feature.center[1],
        lng: feature.center[0],
        relevanceScore: (feature.relevance || 0.7) * 100,
        metadata: { 
          placeType: feature.place_type?.[0],
          context: feature.context,
        },
      }));
    } catch (error) {
      console.error('Mapbox search error:', error);
      return [];
    }
  }, [includeMapbox, userLocation]);

  // AI suggestions
  const getAISuggestions = useCallback(async (searchQuery: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-location-search', {
        body: { query: searchQuery }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('AI suggestions error:', error);
      return null;
    }
  }, []);

  // Combined search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setAiSuggestions(null);
      return;
    }

    setIsSearching(true);

    try {
      // Run all searches in parallel
      const [factoryResults, vehicleResults, mapboxResults, aiData] = await Promise.all([
        searchFactories(searchQuery),
        searchVehicles(searchQuery),
        searchMapbox(searchQuery),
        getAISuggestions(searchQuery),
      ]);

      // Combine and deduplicate results
      const allResults: SearchResultItem[] = [];
      const seenIds = new Set<string>();

      // Priority order: Factories > Vehicles > Mapbox
      [...factoryResults, ...vehicleResults, ...mapboxResults].forEach(result => {
        if (!seenIds.has(result.id)) {
          seenIds.add(result.id);
          allResults.push(result);
        }
      });

      // Sort by relevance and distance
      allResults.sort((a, b) => {
        // Priority by type
        const typePriority = { factory: 0, vehicle: 1, local: 2, mapbox: 3, ai: 4 };
        const typeDiff = typePriority[a.type] - typePriority[b.type];
        if (typeDiff !== 0) return typeDiff;
        
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      });

      setResults(allResults.slice(0, 30));
      setAiSuggestions(aiData);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchFactories, searchVehicles, searchMapbox, getAISuggestions]);

  // Debounced search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 200);
  }, [performSearch]);

  const handleResultClick = (result: SearchResultItem) => {
    setQuery(result.name);
    setShowResults(false);
    onResultSelect(result);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setAiSuggestions(null);
  };

  const getResultIcon = (result: SearchResultItem) => {
    switch (result.type) {
      case 'factory':
        return result.metadata?.facilityType === 'zone' ? Building2 : Factory;
      case 'vehicle':
        return Car;
      case 'mapbox':
        return MapPinned;
      default:
        return MapPin;
    }
  };

  const getResultBadgeColor = (result: SearchResultItem) => {
    switch (result.type) {
      case 'factory':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'vehicle':
        return result.metadata?.isAvailable 
          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
          : 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'mapbox':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleSearchChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="pr-11 pl-11 h-12 text-base"
          dir="rtl"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
          {isSearching && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {query && !isSearching && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Capabilities Badges */}
      <div className="flex gap-1.5 mt-2 flex-wrap">
        {includeFactories && (
          <Badge variant="outline" className="text-xs gap-1">
            <Factory className="w-3 h-3" />
            مصانع
          </Badge>
        )}
        {includeVehicles && (
          <Badge variant="outline" className="text-xs gap-1">
            <Car className="w-3 h-3" />
            سيارات
          </Badge>
        )}
        {includeMapbox && (
          <Badge variant="outline" className="text-xs gap-1">
            <Globe className="w-3 h-3" />
            خرائط
          </Badge>
        )}
        <Badge variant="outline" className="text-xs gap-1">
          <Sparkles className="w-3 h-3" />
          ذكاء اصطناعي
        </Badge>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (results.length > 0 || aiSuggestions) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg overflow-hidden"
          >
            <ScrollArea className="max-h-[400px]">
              {/* AI Suggestions */}
              {aiSuggestions && (
                <div className="p-3 border-b bg-gradient-to-l from-purple-500/5 to-transparent">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
                    <Sparkles className="w-4 h-4" />
                    اقتراحات الذكاء الاصطناعي
                  </div>
                  
                  {aiSuggestions.correctedQuery && (
                    <button
                      className="w-full text-right p-2 rounded-md bg-purple-500/10 hover:bg-purple-500/20 transition-colors mb-2"
                      onClick={() => handleSuggestionClick(aiSuggestions.correctedQuery!)}
                    >
                      <span className="text-sm">هل تقصد: </span>
                      <span className="font-medium text-purple-600">{aiSuggestions.correctedQuery}</span>
                    </button>
                  )}
                  
                  {aiSuggestions.alternativeQueries?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.alternativeQueries.slice(0, 4).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <Lightbulb className="w-3 h-3 ml-1" />
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Search Results */}
              {results.length > 0 && (
                <div className="p-2">
                  {results.map((result) => {
                    const IconComponent = getResultIcon(result);
                    return (
                      <button
                        key={result.id}
                        type="button"
                        className="w-full px-3 py-2.5 text-right hover:bg-accent rounded-md transition-colors flex items-start gap-3"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className={cn(
                          'p-2 rounded-lg shrink-0 mt-0.5',
                          getResultBadgeColor(result)
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{result.name}</p>
                            {result.metadata?.isVerified && (
                              <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                                موثق
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.address}
                          </p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {result.source}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No Results */}
              {results.length === 0 && !aiSuggestions && !isSearching && query.length >= 2 && (
                <div className="p-6 text-center text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>لم يتم العثور على نتائج</p>
                  <p className="text-sm mt-1">جرب البحث بكلمات مختلفة</p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapboxSearchBox;
