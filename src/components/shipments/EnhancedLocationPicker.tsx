import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmartInput } from '@/components/ui/smart-input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Map, Search, Loader2, Building2, Plus, Check, Globe, ExternalLink, Star, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedLocationSearch, SearchResult } from '@/hooks/useEnhancedLocationSearch';
import { useSavedLocations, SavedLocation } from '@/hooks/useSavedLocations';
import WazeMapSearch from '@/components/maps/WazeMapSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Egypt center (Cairo)
const defaultMapCenter = { lat: 30.0444, lng: 31.2357 };

interface OrganizationLocation {
  id: string;
  location_name: string;
  address: string;
  city: string | null;
  is_primary: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface EnhancedLocationPickerProps {
  organizationId: string;
  organizationName: string;
  organizationAddress: string;
  organizationCity: string;
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onShareToPickup?: (data: { name: string; address: string; position: { lat: number; lng: number } }) => void;
  onShareToDelivery?: (data: { name: string; address: string; position: { lat: number; lng: number } }) => void;
  label?: string;
  placeholder?: string;
  coordinates?: { lat: number; lng: number } | null;
}

// Helper function to open location in external navigation apps
const openInWaze = (address: string, coords?: { lat: number; lng: number } | null) => {
  let url: string;
  if (coords) {
    url = `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
  } else {
    url = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  }
  window.open(url, '_blank');
};

const openInGoogleMaps = (address: string, coords?: { lat: number; lng: number } | null) => {
  let url: string;
  if (coords) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      url = `google.navigation:q=${coords.lat},${coords.lng}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    }
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  window.open(url, '_blank');
};

// Search functions for external apps
const searchInGoogleMaps = (query: string) => {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  window.open(url, '_blank');
};

const searchInWaze = (query: string) => {
  const url = `https://waze.com/ul?q=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
};

const EnhancedLocationPicker = ({
  organizationId,
  organizationName,
  organizationAddress,
  organizationCity,
  value,
  onChange,
  onShareToPickup,
  onShareToDelivery,
  label = 'الموقع',
  placeholder = 'اختر الموقع',
  coordinates,
}: EnhancedLocationPickerProps) => {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Saved locations hook for general saved locations
  const { 
    locations: savedLocations, 
    loading: savedLocationsLoading, 
    saveLocation,
    incrementUsage,
    searchLocations: searchSavedLocations 
  } = useSavedLocations();
  const [activeTab, setActiveTab] = useState<string>('manual');
  
  // Current location state
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Map picker state
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Add location dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLocation, setNewLocation] = useState({
    location_name: '',
    address: '',
    city: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  
  // State to track last selected location for save prompt
  const [lastSelectedLocation, setLastSelectedLocation] = useState<{
    address: string;
    coords?: { lat: number; lng: number };
  } | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saving, setSaving] = useState(false);

  const primaryAddress = `${organizationAddress}, ${organizationCity}`;

  useEffect(() => {
    if (organizationId) {
      fetchLocations();
    }
  }, [organizationId]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_locations')
        .select('id, location_name, address, city, is_primary, latitude, longitude')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

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
          const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            onChange(data.features[0].place_name, { lat: latitude, lng: longitude });
            toast.success('تم تحديد موقعك الحالي');
          }
        } catch (error) {
          console.error('Error getting address:', error);
          onChange(`${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('فشل في تحديد الموقع. تأكد من تفعيل خدمات الموقع.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Enhanced location search hook
  const { 
    results: enhancedResults, 
    loading: enhancedSearchLoading, 
    search: performEnhancedSearch,
    clearResults: clearEnhancedResults
  } = useEnhancedLocationSearch({
    includeAllOrganizations: true,
  });

  // Search for locations using enhanced search
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      clearEnhancedResults();
      return;
    }

    setSearchLoading(true);
    performEnhancedSearch(query);
    setShowSuggestions(true);
    setSearchLoading(false);
  }, [performEnhancedSearch, clearEnhancedResults]);

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
    onChange(suggestion.display_name, { 
      lat: parseFloat(suggestion.lat), 
      lng: parseFloat(suggestion.lon) 
    });
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    clearEnhancedResults();
    toast.success('تم اختيار الموقع');
  };

  // Handle enhanced search result selection
  const handleEnhancedResultSelect = (result: SearchResult) => {
    onChange(result.address, result.latitude && result.longitude 
      ? { lat: result.latitude, lng: result.longitude }
      : undefined
    );
    setSearchQuery('');
    clearEnhancedResults();
    setShowSuggestions(false);
    toast.success('تم اختيار الموقع');
  };

  const getResultTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved':
        return <MapPin className="w-4 h-4 text-primary" />;
      case 'organization':
        return <Building2 className="w-4 h-4 text-secondary-foreground" />;
      case 'mapbox':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'ai':
        return <Globe className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleSavedLocationSelect = (location: OrganizationLocation | 'primary') => {
    if (location === 'primary') {
      onChange(primaryAddress);
    } else {
      const fullAddress = location.city 
        ? `${location.address}, ${location.city}` 
        : location.address;
      onChange(fullAddress, location.latitude && location.longitude 
        ? { lat: location.latitude, lng: location.longitude }
        : undefined
      );
    }
    toast.success('تم اختيار الموقع');
  };

  // Handle general saved location selection
  const handleGeneralSavedLocationSelect = async (location: SavedLocation) => {
    const fullAddress = location.city 
      ? `${location.address}, ${location.city}` 
      : location.address;
    onChange(fullAddress, { lat: location.latitude, lng: location.longitude });
    
    // Increment usage count
    await incrementUsage(location.id);
    toast.success('تم اختيار الموقع');
  };

  const handleSaveNewLocation = async () => {
    if (!newLocation.location_name || !newLocation.address) {
      toast.error('يرجى ملء اسم الموقع والعنوان');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_locations')
        .insert({
          organization_id: organizationId,
          location_name: newLocation.location_name,
          address: newLocation.address,
          city: newLocation.city || null,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          created_by: profile?.id,
        });

      if (error) throw error;

      toast.success('تم إضافة الموقع بنجاح');
      
      const fullAddress = newLocation.city 
        ? `${newLocation.address}, ${newLocation.city}` 
        : newLocation.address;
      onChange(fullAddress, newLocation.latitude && newLocation.longitude 
        ? { lat: newLocation.latitude, lng: newLocation.longitude }
        : undefined
      );
      
      await fetchLocations();
      setNewLocation({ location_name: '', address: '', city: '', latitude: null, longitude: null });
      setShowAddDialog(false);
      setShowSavePrompt(false);
      setLastSelectedLocation(null);
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error(error.message || 'فشل في حفظ الموقع');
    } finally {
      setSaving(false);
    }
  };
  
  // Function to prepare save dialog with selected location
  const prepareToSaveLocation = (address: string, coords?: { lat: number; lng: number }) => {
    const addressParts = address.split(',').map(s => s.trim());
    const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] || '' : '';
    
    setNewLocation({
      location_name: '',
      address: address,
      city: city,
      latitude: coords?.lat || null,
      longitude: coords?.lng || null,
    });
    setShowAddDialog(true);
    setShowSavePrompt(false);
  };

  // Handle map position select from Mapbox
  const handleMapPositionSelect = (position: { lat: number; lng: number }, address?: string) => {
    setMapCoordinates(position);
    if (address) {
      setSearchQuery(address);
    }
  };

  // Handle map coordinate selection
  const handleMapSelect = () => {
    if (mapCoordinates) {
      const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${mapCoordinates.lng},${mapCoordinates.lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
      )
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            onChange(data.features[0].place_name, mapCoordinates);
          } else {
            onChange(`${mapCoordinates.lat}, ${mapCoordinates.lng}`, mapCoordinates);
          }
          toast.success('تم تحديد الموقع على الخريطة');
          setShowMapDialog(false);
        })
        .catch(() => {
          onChange(`${mapCoordinates.lat}, ${mapCoordinates.lng}`, mapCoordinates);
          setShowMapDialog(false);
        });
    }
  };


  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label}
      </Label>

      {/* Current Value Display with Navigation Options */}
      {value && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
            <p className="text-sm leading-relaxed flex-1">{value}</p>
            
            {/* Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 gap-1 flex-shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-xs">عرض</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={() => openInGoogleMaps(value, coordinates || mapCoordinates)}>
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Maps
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openInWaze(value, coordinates || mapCoordinates)}>
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3.5-5c-.3 0-.5-.2-.5-.5v-1c0-2.8-2.2-5-5-5s-5 2.2-5 5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1c0-3.3 2.7-6 6-6s6 2.7 6 6v1c0 .3-.2.5-.5.5z" fill="#33CCFF"/>
                  </svg>
                  Waze
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Location Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <TabsList className="grid flex-1 grid-cols-5 h-auto">
            <TabsTrigger value="manual" className="flex items-center gap-1 text-xs py-2">
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline">كتابة</span>
              <span className="sm:hidden">كتابة</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-1 text-xs py-2">
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">بحث</span>
              <span className="sm:hidden">بحث</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1 text-xs py-2">
              <Building2 className="w-3 h-3" />
              <span className="hidden sm:inline">المحفوظة</span>
              <span className="sm:hidden">محفوظ</span>
            </TabsTrigger>
            <TabsTrigger value="current" className="flex items-center gap-1 text-xs py-2">
              <Navigation className="w-3 h-3" />
              <span className="hidden sm:inline">موقعي</span>
              <span className="sm:hidden">موقعي</span>
            </TabsTrigger>
            <TabsTrigger value="external" className="flex items-center gap-1 text-xs py-2">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">خارجي</span>
              <span className="sm:hidden">خارجي</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Manual Text Input Tab - Quick Entry with Autocomplete */}
        <TabsContent value="manual" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>إدخال العنوان يدوياً بسرعة</span>
              </div>
              <SmartInput
                fieldContext={label.includes('استلام') ? 'pickup_address' : 'delivery_address'}
                value={value}
                onChange={(v) => onChange(v)}
                placeholder="اكتب العنوان... ستظهر اقتراحات محفوظة"
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground">
                ✏️ اكتب العنوان — يُحفظ تلقائياً ويُقترح لاحقاً
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waze Search Tab - Primary */}
        <TabsContent value="search" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <WazeMapSearch
                onSelect={(result) => {
                  onChange(result.address, result.position);
                  setLastSelectedLocation({ 
                    address: result.address, 
                    coords: result.position 
                  });
                  setShowSavePrompt(true);
                }}
                onShareToPickup={onShareToPickup}
                onShareToDelivery={onShareToDelivery}
                placeholder="ابحث عن عنوان، مصنع، شركة..."
                showWazeEmbed={false}
              />
              
              {/* Save Location Prompt */}
              {showSavePrompt && lastSelectedLocation && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm flex-1">هل تريد حفظ هذا الموقع لاستخدامه لاحقاً؟</span>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1"
                    onClick={() => prepareToSaveLocation(lastSelectedLocation.address, lastSelectedLocation.coords)}
                  >
                    <Plus className="w-3 h-3" />
                    حفظ
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSavePrompt(false);
                      setLastSelectedLocation(null);
                    }}
                  >
                    لا
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Locations Tab */}
        <TabsContent value="saved" className="mt-3 space-y-3">
          {(loading || savedLocationsLoading) ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-4 pr-4">
                {/* Organization Locations Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>مواقع {organizationName}</span>
                  </div>
                  
                  {/* Primary Location */}
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary",
                      value === primaryAddress && "border-primary bg-primary/5"
                    )}
                    onClick={() => handleSavedLocationSelect('primary')}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">المقر الرئيسي</p>
                        <p className="text-xs text-muted-foreground truncate">{primaryAddress}</p>
                      </div>
                      {value === primaryAddress && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Organization Locations */}
                  {locations.map(location => {
                    const fullAddress = location.city 
                      ? `${location.address}, ${location.city}` 
                      : location.address;
                    const isSelected = value === fullAddress;
                    
                    return (
                      <Card 
                        key={location.id}
                        className={cn(
                          "cursor-pointer transition-all hover:border-primary",
                          isSelected && "border-primary bg-primary/5"
                        )}
                        onClick={() => handleSavedLocationSelect(location)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{location.location_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{fullAddress}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* General Saved Locations Section */}
                {savedLocations.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Bookmark className="w-4 h-4" />
                      <span>المواقع المحفوظة العامة</span>
                      <Badge variant="secondary" className="text-[10px]">{savedLocations.length}</Badge>
                    </div>
                    
                    {savedLocations.slice(0, 10).map(location => {
                      const fullAddress = location.city 
                        ? `${location.address}, ${location.city}` 
                        : location.address;
                      const isSelected = value === fullAddress;
                      
                      return (
                        <Card 
                          key={location.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary",
                            isSelected && "border-primary bg-primary/5"
                          )}
                          onClick={() => handleGeneralSavedLocationSelect(location)}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                              <Star className="w-5 h-5 text-accent-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{location.name}</p>
                                {location.usage_count > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {location.usage_count} استخدام
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{fullAddress}</p>
                              {location.category && location.category !== 'other' && (
                                <Badge variant="secondary" className="text-[9px] mt-1">
                                  {location.category === 'generator' ? 'مولد' : 
                                   location.category === 'recycler' ? 'مُعيد تدوير' : 
                                   location.category === 'transporter' ? 'ناقل' : location.category}
                                </Badge>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-primary flex-shrink-0" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {savedLocations.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground">
                        عرض أول 10 مواقع من {savedLocations.length} موقع محفوظ
                      </p>
                    )}
                  </div>
                )}

                {/* Add New Location Button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة موقع جديد
                </Button>
              </div>
            </ScrollArea>
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

        {/* External Apps Tab */}
        <TabsContent value="external" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ExternalLink className="w-4 h-4" />
                <span>ابحث في التطبيقات الخارجية</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Google Maps Search */}
                <Button 
                  variant="outline" 
                  className="justify-center gap-2 h-12"
                  onClick={() => {
                    const query = prompt('أدخل اسم المكان أو العنوان للبحث في Google Maps:');
                    if (query) {
                      searchInGoogleMaps(query);
                      toast.info('سيتم فتح Google Maps للبحث عن الموقع');
                    }
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                
                {/* Waze Search */}
                <Button 
                  variant="outline" 
                  className="justify-center gap-2 h-12"
                  onClick={() => {
                    const query = prompt('أدخل اسم المكان أو العنوان للبحث في Waze:');
                    if (query) {
                      searchInWaze(query);
                      toast.info('سيتم فتح Waze للبحث عن الموقع');
                    }
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3.5-5c-.3 0-.5-.2-.5-.5v-1c0-2.8-2.2-5-5-5s-5 2.2-5 5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1c0-3.3 2.7-6 6-6s6 2.7 6 6v1c0 .3-.2.5-.5.5z" fill="#33CCFF"/>
                  </svg>
                  Waze
                </Button>
              </div>

              {/* Manual Entry after external search */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">بعد تحديد الموقع، أدخل العنوان هنا:</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="الصق العنوان من التطبيق الخارجي..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                    dir="rtl"
                  />
                  <Button 
                    variant="default"
                    disabled={!searchQuery.trim()}
                    onClick={() => {
                      if (searchQuery.trim()) {
                        onChange(searchQuery.trim());
                        setLastSelectedLocation({ address: searchQuery.trim() });
                        setShowSavePrompt(true);
                        toast.success('تم تحديد العنوان');
                        setSearchQuery('');
                      }
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                🔗 يمكنك استخدام Google Maps أو Waze للبحث الدقيق ثم إدخال العنوان
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Map Picker Button */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setShowMapDialog(true)}
      >
        <Map className="w-4 h-4 ml-2" />
        تحديد الموقع على الخريطة
      </Button>

      {/* Interactive Map Dialog - Free Leaflet Map */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              تحديد الموقع على الخريطة
              <Badge variant="secondary" className="text-[10px]">Mapbox</Badge>
            </DialogTitle>
            <DialogDescription>
              ابحث عن موقع أو اضغط على الخريطة لتحديد الإحداثيات
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Waze Embedded Map for location picking */}
            <WazeMapSearch
              onSelect={(result) => {
                setMapCoordinates(result.position);
              }}
              placeholder="ابحث عن موقع..."
              showWazeEmbed={true}
              defaultCenter={mapCoordinates || { lat: 30.0444, lng: 31.2357 }}
            />

            {/* Coordinates Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">خط العرض (Latitude)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="30.0444"
                  value={mapCoordinates?.lat || ''}
                  onChange={(e) => setMapCoordinates(prev => ({
                    lat: parseFloat(e.target.value) || 0,
                    lng: prev?.lng || 0
                  }))}
                />
              </div>
              <div>
                <Label className="text-xs">خط الطول (Longitude)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="31.2357"
                  value={mapCoordinates?.lng || ''}
                  onChange={(e) => setMapCoordinates(prev => ({
                    lat: prev?.lat || 0,
                    lng: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
            </div>

            {/* Selected coordinates display */}
            {mapCoordinates && (
              <p className="text-xs text-center text-muted-foreground" dir="ltr">
                {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMapDialog(false)}>
              إلغاء
            </Button>
            <Button variant="eco" onClick={handleMapSelect} disabled={!mapCoordinates}>
              <Check className="w-4 h-4 ml-2" />
              تأكيد الموقع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Location Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة موقع جديد لـ {organizationName}</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل الموقع الجديد لحفظه في المواقع المحفوظة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>اسم الموقع *</Label>
              <Input
                value={newLocation.location_name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, location_name: e.target.value }))}
                placeholder="مثال: فرع الرياض، مستودع جدة"
              />
            </div>
            <div>
              <Label>العنوان *</Label>
              <Input
                value={newLocation.address}
                onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                placeholder="العنوان التفصيلي"
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Input
                value={newLocation.city}
                onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                placeholder="المدينة"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button variant="eco" onClick={handleSaveNewLocation} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ الموقع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedLocationPicker;
