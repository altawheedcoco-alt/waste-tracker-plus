import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Map, Search, Loader2, Building2, Plus, Check, Globe, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnhancedLocationSearch, SearchResult } from '@/hooks/useEnhancedLocationSearch';
import GooglePlacesSearch from '@/components/maps/GooglePlacesSearch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const locationMarkerIcon = new L.DivIcon({
  className: 'location-marker',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: 4px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click handler component
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

// Map center updater component
const MapCenterUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 0.5 });
    }
  }, [center, map]);
  
  return null;
};

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
    // Check if mobile
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
  label = 'الموقع',
  placeholder = 'اختر الموقع',
  coordinates,
}: EnhancedLocationPickerProps) => {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('google');
  
  // Current location state
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Map picker state
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapKey, setMapKey] = useState(0);
  
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
  });
  const [saving, setSaving] = useState(false);

  // Map search state
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchLoading, setMapSearchLoading] = useState(false);

  const primaryAddress = `${organizationAddress}, ${organizationCity}`;

  useEffect(() => {
    if (organizationId) {
      fetchLocations();
    }
  }, [organizationId]);

  // Reset map when dialog opens
  useEffect(() => {
    if (showMapDialog) {
      setMapKey(prev => prev + 1);
    }
  }, [showMapDialog]);

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
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const data = await response.json();
          
          if (data.display_name) {
            onChange(data.display_name, { lat: latitude, lng: longitude });
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
      case 'nominatim':
        return <Globe className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getResultTypeBadge = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved':
        return <Badge variant="default" className="text-[10px] px-1.5 py-0">محفوظ</Badge>;
      case 'organization':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">منظمة</Badge>;
      case 'nominatim':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">عام</Badge>;
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
          created_by: profile?.id,
        });

      if (error) throw error;

      toast.success('تم إضافة الموقع بنجاح');
      
      const fullAddress = newLocation.city 
        ? `${newLocation.address}, ${newLocation.city}` 
        : newLocation.address;
      onChange(fullAddress);
      
      await fetchLocations();
      setNewLocation({ location_name: '', address: '', city: '' });
      setShowAddDialog(false);
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error(error.message || 'فشل في حفظ الموقع');
    } finally {
      setSaving(false);
    }
  };

  // Handle map click
  const handleMapClick = (latlng: L.LatLng) => {
    setMapCoordinates({ lat: latlng.lat, lng: latlng.lng });
  };

  // Search on map
  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;

    setMapSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&countrycodes=eg&limit=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data?.[0]) {
        setMapCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
        toast.success('تم العثور على الموقع');
      } else {
        toast.error('لم يتم العثور على نتائج');
      }
    } catch {
      toast.error('خطأ في البحث');
    } finally {
      setMapSearchLoading(false);
    }
  };

  // Get current location for map
  const getMapCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success('تم تحديد موقعك الحالي');
      },
      () => toast.error('فشل في تحديد الموقع'),
      { enableHighAccuracy: true }
    );
  };

  // Handle map coordinate selection
  const handleMapSelect = () => {
    if (mapCoordinates) {
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapCoordinates.lat}&lon=${mapCoordinates.lng}&accept-language=ar`
      )
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            onChange(data.display_name, mapCoordinates);
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

  // Default center (Egypt)
  const defaultCenter: [number, number] = [26.8206, 30.8025];
  const mapCenter: [number, number] = mapCoordinates 
    ? [mapCoordinates.lat, mapCoordinates.lng] 
    : defaultCenter;

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

      {/* Location Selection Tabs - Google & Waze First */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2 mb-3">
          <TabsList className="grid flex-1 grid-cols-5 h-auto">
            <TabsTrigger value="google" className="flex items-center gap-1 text-xs py-2">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="hidden sm:inline">Google</span>
              <span className="sm:hidden">جوجل</span>
            </TabsTrigger>
            <TabsTrigger value="waze" className="flex items-center gap-1 text-xs py-2">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3.5-5c-.3 0-.5-.2-.5-.5v-1c0-2.8-2.2-5-5-5s-5 2.2-5 5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1c0-3.3 2.7-6 6-6s6 2.7 6 6v1c0 .3-.2.5-.5.5z" fill="#33CCFF"/>
              </svg>
              <span>Waze</span>
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
            <TabsTrigger value="search" className="flex items-center gap-1 text-xs py-2">
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">بحث</span>
              <span className="sm:hidden">بحث</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Google Places Tab */}
        <TabsContent value="google" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>ابحث عن العناوين من Google Maps</span>
              </div>
              <GooglePlacesSearch
                value={value}
                onChange={(address, coords) => {
                  onChange(address, coords);
                  if (address) {
                    toast.success('تم اختيار الموقع من Google Maps');
                  }
                }}
                placeholder="ابحث عن عنوان، مصنع، شركة..."
                showCurrentLocation={true}
              />
              <p className="text-xs text-muted-foreground">
                💡 استخدم Google Maps للحصول على دقة أعلى في تحديد المواقع
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waze Tab - NEW */}
        <TabsContent value="waze" className="mt-3">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3.5-5c-.3 0-.5-.2-.5-.5v-1c0-2.8-2.2-5-5-5s-5 2.2-5 5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1c0-3.3 2.7-6 6-6s6 2.7 6 6v1c0 .3-.2.5-.5.5z" fill="#33CCFF"/>
                </svg>
                <span>ابحث وحدد الموقع من Waze</span>
              </div>
              
              {/* Waze Search Button */}
              <Button 
                variant="outline" 
                className="w-full justify-center gap-2 h-12 text-base"
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
                افتح البحث في Waze
                <ExternalLink className="w-4 h-4" />
              </Button>

              {/* Manual Entry after Waze search */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">بعد تحديد الموقع في Waze، أدخل العنوان هنا:</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="الصق العنوان من Waze..."
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
                🚗 Waze يوفر معلومات المرور الحية وأفضل المسارات
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Locations Tab */}
        <TabsContent value="saved" className="mt-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
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
                    <p className="font-medium text-sm">المقر الرئيسي - {organizationName}</p>
                    <p className="text-xs text-muted-foreground truncate">{primaryAddress}</p>
                  </div>
                  {value === primaryAddress && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </CardContent>
              </Card>

              {/* Additional Locations */}
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

              {/* Add New Location Button */}
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة موقع جديد
              </Button>
            </>
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

        {/* Search Tab - Enhanced with Google-style smart search */}
        <TabsContent value="search" className="mt-3">
          <div className="relative">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن موقع (مثال: نستلة بنها، المنطقة الصناعية...)"
                className="pr-10 pl-10"
                onFocus={() => (enhancedResults.length > 0 || suggestions.length > 0) && setShowSuggestions(true)}
              />
              {(searchLoading || enhancedSearchLoading) ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              ) : searchQuery && (
                <button
                  type="button"
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    setSearchQuery('');
                    clearEnhancedResults();
                    setShowSuggestions(false);
                  }}
                >
                  <svg className="w-4 h-4 text-muted-foreground hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Google-Style Search Results Dropdown */}
            {showSuggestions && (enhancedResults.length > 0 || suggestions.length > 0 || (searchLoading || enhancedSearchLoading)) && (
              <Card className="absolute z-50 top-full mt-2 w-full shadow-xl border-0 rounded-xl overflow-hidden bg-background">
                <ScrollArea className="max-h-[400px]">
                  {(searchLoading || enhancedSearchLoading) && enhancedResults.length === 0 && suggestions.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="mr-3 text-sm text-muted-foreground">جاري البحث...</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {/* Enhanced results (saved locations + organizations) */}
                      {enhancedResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          className="w-full px-4 py-3 text-right hover:bg-muted/30 transition-all duration-150 flex items-start gap-3 group"
                          onClick={() => handleEnhancedResultSelect(result)}
                        >
                          {/* Icon Container - Google Style */}
                          <div className={cn(
                            "mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            result.type === 'saved' && "bg-primary/10 text-primary",
                            result.type === 'organization' && "bg-secondary/50 text-secondary-foreground",
                            result.type === 'nominatim' && "bg-muted text-muted-foreground"
                          )}>
                            {result.type === 'saved' && <MapPin className="w-4 h-4" />}
                            {result.type === 'organization' && <Building2 className="w-4 h-4" />}
                            {result.type === 'nominatim' && <Globe className="w-4 h-4" />}
                          </div>
                          
                          {/* Content - Google Style */}
                          <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {result.name}
                              </span>
                              {result.type === 'saved' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  محفوظ
                                </span>
                              )}
                              {result.type === 'organization' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground font-medium">
                                  منظمة
                                </span>
                              )}
                            </div>
                            
                            {/* URL/Category Line - Like Google */}
                            {result.organizationName && result.type === 'saved' && (
                              <p className="text-xs text-primary/80 mb-0.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {result.organizationName}
                              </p>
                            )}
                            
                            {/* Address - Like Google Description */}
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {result.address}
                            </p>
                            
                            {/* Distance Badge - Bottom Right */}
                            {result.distance !== undefined && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                                  <Navigation className="w-3 h-3" />
                                  <span>
                                    {result.distance < 1 
                                      ? `${Math.round(result.distance * 1000)} متر`
                                      : `${result.distance.toFixed(1)} كم`
                                    }
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Arrow indicator on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                            <svg className="w-4 h-4 text-muted-foreground rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                      
                      {/* Fallback Nominatim suggestions */}
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`nom-${index}`}
                          type="button"
                          className="w-full px-4 py-3 text-right hover:bg-muted/30 transition-all duration-150 flex items-start gap-3 group"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {suggestion.display_name.split(',')[0]}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {suggestion.display_name}
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                            <svg className="w-4 h-4 text-muted-foreground rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                      
                      {/* Footer hint */}
                      {(enhancedResults.length > 0 || suggestions.length > 0) && (
                        <div className="px-4 py-2 bg-muted/20 text-center">
                          <p className="text-[11px] text-muted-foreground">
                            اضغط على نتيجة لاختيار الموقع
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            )}
          </div>

          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-xs text-muted-foreground mt-2">
              اكتب حرفين على الأقل للبحث الشامل
            </p>
          )}
          
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="inline-block w-4 h-4 text-center">💡</span>
            يبحث في المواقع المحفوظة والمنظمات المسجلة أولاً، ثم في الأماكن العامة
          </p>
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

      {/* Interactive Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              تحديد الموقع على الخريطة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="ابحث عن موقع..."
                  className="pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleMapSearch}
                disabled={mapSearchLoading}
              >
                {mapSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'بحث'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={getMapCurrentLocation}
                title="موقعي الحالي"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            </div>

            {/* Interactive Map */}
            <div className="h-[400px] rounded-lg overflow-hidden border relative">
              {showMapDialog && (
                <MapContainer
                  key={mapKey}
                  center={mapCenter}
                  zoom={mapCoordinates ? 15 : 6}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  <MapCenterUpdater center={mapCoordinates ? [mapCoordinates.lat, mapCoordinates.lng] : null} />
                  
                  {mapCoordinates && (
                    <Marker 
                      position={[mapCoordinates.lat, mapCoordinates.lng]} 
                      icon={locationMarkerIcon}
                    />
                  )}
                </MapContainer>
              )}
              
              {/* Instruction overlay */}
              {!mapCoordinates && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-lg">
                  <p className="text-sm text-muted-foreground">اضغط على الخريطة لتحديد الموقع</p>
                </div>
              )}
            </div>

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
