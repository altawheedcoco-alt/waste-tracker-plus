import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Map, Search, Loader2, Building2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

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
}

const EnhancedLocationPicker = ({
  organizationId,
  organizationName,
  organizationAddress,
  organizationCity,
  value,
  onChange,
  label = 'الموقع',
  placeholder = 'اختر الموقع',
}: EnhancedLocationPickerProps) => {
  const { profile } = useAuth();
  const [locations, setLocations] = useState<OrganizationLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('saved');
  
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
  });
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
          // Reverse geocoding to get address
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

  // Search for locations using Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=eg&limit=5&accept-language=ar`
      );
      const data = await response.json();
      setSuggestions(data || []);
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
    onChange(suggestion.display_name, { 
      lat: parseFloat(suggestion.lat), 
      lng: parseFloat(suggestion.lon) 
    });
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success('تم اختيار الموقع');
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

  // Handle map coordinate selection
  const handleMapSelect = () => {
    if (mapCoordinates) {
      // Get address from coordinates
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

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label}
      </Label>

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
          <TabsTrigger value="saved" className="flex items-center gap-1 text-xs py-2">
            <Building2 className="w-3 h-3" />
            <span className="hidden sm:inline">المواقع المحفوظة</span>
            <span className="sm:hidden">المحفوظة</span>
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-1 text-xs py-2">
            <Navigation className="w-3 h-3" />
            <span className="hidden sm:inline">موقعي الحالي</span>
            <span className="sm:hidden">موقعي</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1 text-xs py-2">
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">بحث بالاسم</span>
            <span className="sm:hidden">بحث</span>
          </TabsTrigger>
        </TabsList>

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

        {/* Search Tab */}
        <TabsContent value="search" className="mt-3">
          <div className="relative">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان أو مكان..."
                className="pr-10"
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {searchLoading && (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full p-3 text-right hover:bg-muted transition-colors flex items-start gap-2 border-b last:border-b-0"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{suggestion.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchQuery.length > 0 && searchQuery.length < 3 && (
            <p className="text-xs text-muted-foreground mt-2">
              اكتب 3 حروف على الأقل للبحث
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Map Picker Button - Optional */}
      <Button 
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
              src={`https://www.openstreetmap.org/export/embed.html?bbox=25.0,22.0,35.0,32.0&layer=mapnik&marker=${mapCoordinates?.lat || 26.8206},${mapCoordinates?.lng || 30.8025}`}
              allowFullScreen
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  للتحديد الدقيق على الخريطة، استخدم البحث بالاسم
                </p>
                <p className="text-xs text-muted-foreground">
                  أو أدخل الإحداثيات يدوياً
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
            <Button variant="outline" onClick={() => setShowMapDialog(false)}>
              إلغاء
            </Button>
            <Button variant="eco" onClick={handleMapSelect} disabled={!mapCoordinates}>
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
