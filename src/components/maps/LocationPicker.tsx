import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Search, Check, Map, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  label?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  source?: 'mapbox' | 'database' | 'organization';
  organization_name?: string;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

const LocationPicker = ({ value, onChange, placeholder = 'أدخل العنوان...', label }: LocationPickerProps) => {
  const [activeTab, setActiveTab] = useState<string>('search');
  
  // Current location state
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Map picker state
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<Coordinates | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current location using browser geolocation
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address using Mapbox
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            onChange(data.features[0].place_name, latitude, longitude);
            toast.success('تم تحديد موقعك الحالي');
          } else {
            onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude);
          }
        } catch (error) {
          console.error('Error getting address:', error);
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude);
          toast.success('تم تحديد الإحداثيات');
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'فشل في تحديد الموقع';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض إذن الوصول للموقع. يرجى السماح بالوصول من إعدادات المتصفح';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متاحة';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة طلب الموقع';
            break;
        }
        toast.error(errorMessage);
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Search for locations from multiple sources (Database + Mapbox)
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Search from multiple sources in parallel
      const [mapboxResults, orgLocations, organizations] = await Promise.all([
        // Mapbox search
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=eg&limit=10&language=ar&types=address,place,locality,neighborhood,poi`
        ).then(res => res.json()).catch(() => ({ features: [] })),
        
        // Search saved organization locations from database
        supabase
          .from('organization_locations')
          .select('id, location_name, address, city, region, latitude, longitude, organization_id')
          .or(`location_name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
          .eq('is_active', true)
          .limit(10)
          .then(({ data }) => data || []),
        
        // Search organizations directly by name or address
        supabase
          .from('organizations')
          .select('id, name, address, city')
          .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
          .eq('is_verified', true)
          .eq('is_active', true)
          .limit(10)
          .then(({ data }) => data || [])
      ]);

      // Convert database location results to LocationSuggestion format
      const dbLocationSuggestions: LocationSuggestion[] = (orgLocations || []).map((loc: any) => ({
        display_name: `${loc.location_name} - ${loc.address}${loc.city ? `, ${loc.city}` : ''}`,
        lat: loc.latitude?.toString() || '30.0444',
        lon: loc.longitude?.toString() || '31.2357',
        source: 'database' as const,
        organization_name: loc.location_name
      }));

      // Convert organization results to LocationSuggestion format
      const orgSuggestions: LocationSuggestion[] = (organizations || []).map((org: any) => ({
        display_name: `${org.name} - ${org.address}${org.city ? `, ${org.city}` : ''}`,
        lat: '30.0444',
        lon: '31.2357',
        source: 'organization' as const,
        organization_name: org.name
      }));

      // Convert Mapbox results
      const mapboxSuggestions: LocationSuggestion[] = (mapboxResults.features || []).map((item: any) => ({
        display_name: item.place_name,
        lat: item.center[1].toString(),
        lon: item.center[0].toString(),
        source: 'mapbox' as const
      }));

      // Merge all results - prioritize database/organization results
      const allResults = [...dbLocationSuggestions, ...orgSuggestions, ...mapboxSuggestions];
      
      // Deduplicate by display_name similarity
      const uniqueResults = allResults.reduce((acc: LocationSuggestion[], curr) => {
        const exists = acc.some(item => {
          // Check for coordinate proximity
          const coordMatch = item.lat && curr.lat && 
            Math.abs(parseFloat(item.lat) - parseFloat(curr.lat)) < 0.0001 && 
            Math.abs(parseFloat(item.lon) - parseFloat(curr.lon)) < 0.0001;
          return coordMatch;
        });
        if (!exists) acc.push(curr);
        return acc;
      }, []);

      // Sort: database first, then organizations, then mapbox
      const sortedResults = uniqueResults.sort((a, b) => {
        const sourceOrder: Record<string, number> = { database: 0, organization: 1, mapbox: 2 };
        return (sourceOrder[a.source || 'mapbox'] || 2) - (sourceOrder[b.source || 'mapbox'] || 2);
      }).slice(0, 15);

      setSuggestions(sortedResults);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocations(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.display_name, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success('تم اختيار الموقع');
  };

  // Handle map coordinate selection
  const handleMapSelect = () => {
    if (mapCoordinates) {
      // Get address from coordinates using Mapbox
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${mapCoordinates.lng},${mapCoordinates.lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
      )
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            onChange(data.features[0].place_name, mapCoordinates.lat, mapCoordinates.lng);
          } else {
            onChange(`${mapCoordinates.lat.toFixed(6)}, ${mapCoordinates.lng.toFixed(6)}`, mapCoordinates.lat, mapCoordinates.lng);
          }
          toast.success('تم تحديد الموقع على الخريطة');
          setShowMapDialog(false);
        })
        .catch(() => {
          onChange(`${mapCoordinates.lat.toFixed(6)}, ${mapCoordinates.lng.toFixed(6)}`, mapCoordinates.lat, mapCoordinates.lng);
          setShowMapDialog(false);
        });
    }
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {label}
        </Label>
      )}

      {/* Current Value Display */}
      {value && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
            <p className="text-sm leading-relaxed">{value}</p>
          </div>
        </div>
      )}

      {/* Location Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="search" className="flex items-center gap-1 text-xs py-2">
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">بحث بالاسم</span>
            <span className="sm:hidden">بحث</span>
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-1 text-xs py-2">
            <Navigation className="w-3 h-3" />
            <span className="hidden sm:inline">موقعي الحالي</span>
            <span className="sm:hidden">موقعي</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1 text-xs py-2">
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">إدخال يدوي</span>
            <span className="sm:hidden">يدوي</span>
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="mt-3">
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان أو مكان في مصر..."
                className="pr-10"
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {searchLoading && (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Suggestions Dropdown with ScrollArea for many results */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                <ScrollArea className="max-h-[350px]">
                  {suggestions.map((suggestion, index) => {
                    // Extract address parts for better display
                    const parts = suggestion.display_name.split(/[-,]/);
                    const mainName = parts[0]?.trim();
                    const subLocation = parts.slice(1, 3).join('، ').trim();
                    const isFromDatabase = suggestion.source === 'database' || suggestion.source === 'organization';
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        className={cn(
                          "w-full p-3 text-right hover:bg-muted transition-colors flex items-start gap-2 border-b last:border-b-0",
                          isFromDatabase && "bg-primary/5"
                        )}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        {isFromDatabase ? (
                          <Building2 className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                        ) : (
                          <Globe className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{mainName}</span>
                            {isFromDatabase && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                شركة مسجلة
                              </Badge>
                            )}
                          </div>
                          {subLocation && (
                            <span className="text-xs text-muted-foreground">{subLocation}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </ScrollArea>
                <div className="px-3 py-2 bg-muted/50 border-t text-xs text-muted-foreground flex items-center justify-between">
                  <span>{suggestions.length} نتيجة</span>
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      شركات
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      خرائط
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-xs text-muted-foreground mt-2">
              اكتب حرفين على الأقل للبحث
            </p>
          )}
        </TabsContent>

        {/* Current Location Tab */}
        <TabsContent value="current" className="mt-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                اضغط على الزر أدناه لتحديد موقعك الحالي تلقائياً
              </p>
              <Button 
                type="button"
                variant="eco" 
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="w-full sm:w-auto"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري تحديد الموقع...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 ml-2" />
                    تحديد موقعي الحالي
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Input Tab */}
        <TabsContent value="manual" className="mt-3">
          <div className="space-y-3">
            <Input
              value={value}
              onChange={handleDirectInput}
              placeholder={placeholder}
            />
            <p className="text-xs text-muted-foreground">
              أدخل العنوان الكامل يدوياً
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Map Picker Button */}
      <Button 
        type="button"
        variant="outline" 
        className="w-full"
        onClick={() => setShowMapDialog(true)}
      >
        <Map className="w-4 h-4 ml-2" />
        تحديد الموقع على الخريطة
      </Button>

      {/* Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تحديد الموقع على الخريطة</DialogTitle>
          </DialogHeader>
          <div className="h-[400px] bg-muted rounded-lg overflow-hidden relative">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=24.7,22.0,37.0,32.0&layer=mapnik&marker=${mapCoordinates?.lat || 30.0444},${mapCoordinates?.lng || 31.2357}`}
              allowFullScreen
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  للتحديد الدقيق، استخدم البحث بالاسم أو أدخل الإحداثيات
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>خط العرض (Latitude)</Label>
              <Input
                type="number"
                step="any"
                placeholder="مثال: 30.0444"
                value={mapCoordinates?.lat || ''}
                onChange={(e) => setMapCoordinates(prev => ({
                  lat: parseFloat(e.target.value) || 0,
                  lng: prev?.lng || 0
                }))}
              />
            </div>
            <div>
              <Label>خط الطول (Longitude)</Label>
              <Input
                type="number"
                step="any"
                placeholder="مثال: 31.2357"
                value={mapCoordinates?.lng || ''}
                onChange={(e) => setMapCoordinates(prev => ({
                  lat: prev?.lat || 0,
                  lng: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowMapDialog(false)}>
              إلغاء
            </Button>
            <Button type="button" variant="eco" onClick={handleMapSelect} disabled={!mapCoordinates}>
              <Check className="w-4 h-4 ml-2" />
              تأكيد الموقع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationPicker;
