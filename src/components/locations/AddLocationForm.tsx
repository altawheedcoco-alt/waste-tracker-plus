/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Search,
  Crosshair,
  Loader2,
  Check,
  Navigation2,
} from 'lucide-react';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { useSavedLocations, NewLocationData } from '@/hooks/useSavedLocations';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCIisN0sh-m5-pXvpnSELbCBhFabrEcwrE';

const LOCATION_TYPES = [
  { value: 'pickup', label: 'نقطة استلام' },
  { value: 'delivery', label: 'نقطة تسليم' },
  { value: 'factory', label: 'مصنع' },
  { value: 'warehouse', label: 'مستودع' },
  { value: 'office', label: 'مكتب' },
  { value: 'custom', label: 'أخرى' },
];

const CATEGORIES = [
  { value: 'generator', label: 'مولد نفايات' },
  { value: 'recycler', label: 'جهة تدوير' },
  { value: 'transporter', label: 'جهة نقل' },
  { value: 'industrial', label: 'منطقة صناعية' },
  { value: 'other', label: 'أخرى' },
];

interface AddLocationFormProps {
  onSuccess?: () => void;
  initialCoords?: { lat: number; lng: number };
}

export default function AddLocationForm({
  onSuccess,
  initialCoords,
}: AddLocationFormProps) {
  const { isLoaded } = useGoogleMaps();
  const { saveLocation, saving } = useSavedLocations();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'coordinates'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [formData, setFormData] = useState<NewLocationData>({
    name: '',
    address: '',
    city: '',
    latitude: initialCoords?.lat || 30.0444,
    longitude: initialCoords?.lng || 31.2357,
    location_type: 'custom',
    category: 'other',
  });

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: formData.latitude, lng: formData.longitude },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    geocoderRef.current = new window.google.maps.Geocoder();

    // Add draggable marker
    const marker = new window.google.maps.Marker({
      position: { lat: formData.latitude, lng: formData.longitude },
      map,
      draggable: true,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });

    // Handle marker drag
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (position) {
        handleCoordinatesChange(position.lat(), position.lng());
      }
    });

    // Handle map click
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        handleCoordinatesChange(e.latLng.lat(), e.latLng.lng());
      }
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.setMap(null);
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [isLoaded]);

  const handleCoordinatesChange = async (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    // Reverse geocode to get address
    if (geocoderRef.current) {
      try {
        const result = await geocoderRef.current.geocode({ location: { lat, lng } });
        if (result.results?.[0]) {
          const addressComponents = result.results[0].address_components;
          const city = addressComponents?.find(c => 
            c.types.includes('locality') || c.types.includes('administrative_area_level_1')
          )?.long_name;

          setFormData((prev) => ({
            ...prev,
            address: result.results[0].formatted_address || prev.address,
            city: city || prev.city,
          }));
        }
      } catch (error) {
        console.error('Reverse geocode error:', error);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isLoaded) return;

    setIsSearching(true);
    try {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'eg' },
          language: 'ar',
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions);
          } else {
            setSearchResults([]);
          }
          setIsSearching(false);
        }
      );
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (result: google.maps.places.AutocompletePrediction) => {
    if (!isLoaded || !geocoderRef.current) return;

    try {
      const geocodeResult = await geocoderRef.current.geocode({ placeId: result.place_id });
      
      if (geocodeResult.results?.[0]) {
        const location = geocodeResult.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        if (mapRef.current && markerRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
          markerRef.current.setPosition({ lat, lng });
        }

        const addressComponents = geocodeResult.results[0].address_components;
        const city = addressComponents?.find(c => 
          c.types.includes('locality') || c.types.includes('administrative_area_level_1')
        )?.long_name;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: geocodeResult.results[0].formatted_address,
          city: city || '',
          name: prev.name || result.structured_formatting.main_text,
        }));

        setSearchResults([]);
        setSearchQuery('');
        setActiveTab('map');
      }
    } catch (error) {
      console.error('Geocode error:', error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (mapRef.current && markerRef.current) {
          mapRef.current.panTo({ lat: latitude, lng: longitude });
          mapRef.current.setZoom(15);
          markerRef.current.setPosition({ lat: latitude, lng: longitude });
        }

        handleCoordinatesChange(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      }
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.address.trim()) return;

    const result = await saveLocation(formData);
    if (result) {
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Selection Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" className="gap-2">
            <MapPin className="h-4 w-4" />
            الخريطة
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            البحث
          </TabsTrigger>
          <TabsTrigger value="coordinates" className="gap-2">
            <Crosshair className="h-4 w-4" />
            الإحداثيات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          {/* Map */}
          <div className="relative">
            {!isLoaded ? (
              <div className="h-[300px] rounded-lg border flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
                </div>
              </div>
            ) : (
              <div
                ref={mapContainerRef}
                className="h-[300px] rounded-lg border"
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 left-3 gap-2"
              onClick={handleUseCurrentLocation}
              disabled={isLocating || !isLoaded}
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation2 className="h-4 w-4" />
              )}
              موقعي الحالي
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            اضغط على الخريطة أو اسحب العلامة لتحديد الموقع
          </p>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن موقع أو عنوان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pr-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'بحث'
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {searchResults.map((result) => (
                <Button
                  key={result.place_id}
                  variant="outline"
                  className="w-full justify-start text-right h-auto py-3"
                  onClick={() => handleSelectSearchResult(result)}
                >
                  <MapPin className="h-4 w-4 ml-2 shrink-0 text-primary" />
                  <div className="text-right">
                    <div className="font-medium">{result.structured_formatting.main_text}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.structured_formatting.secondary_text}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coordinates" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>خط العرض (Latitude)</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, latitude: lat }));
                  if (markerRef.current) {
                    markerRef.current.setPosition({ lat, lng: formData.longitude });
                  }
                  if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng: formData.longitude });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>خط الطول (Longitude)</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, longitude: lng }));
                  if (markerRef.current) {
                    markerRef.current.setPosition({ lat: formData.latitude, lng });
                  }
                  if (mapRef.current) {
                    mapRef.current.panTo({ lat: formData.latitude, lng });
                  }
                }}
              />
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => handleCoordinatesChange(formData.latitude, formData.longitude)}
          >
            <Check className="h-4 w-4" />
            تأكيد الموقع
          </Button>
        </TabsContent>
      </Tabs>

      {/* Location Details Form */}
      <div className="space-y-4 border-t pt-4">
        <div className="space-y-2">
          <Label>اسم الموقع *</Label>
          <Input
            placeholder="مثال: مصنع التوحيد للأخشاب"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>العنوان *</Label>
          <Textarea
            placeholder="العنوان التفصيلي..."
            value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>المدينة</Label>
            <Input
              placeholder="القاهرة"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>نوع الموقع</Label>
            <Select
              value={formData.location_type}
              onValueChange={(v) => setFormData((prev) => ({ ...prev, location_type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>التصنيف</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ملاحظات</Label>
          <Textarea
            placeholder="ملاحظات إضافية..."
            value={formData.notes || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
        </div>
      </div>

      {/* Save Button */}
      <Button
        className="w-full gap-2"
        onClick={handleSave}
        disabled={saving || !formData.name.trim() || !formData.address.trim()}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        حفظ الموقع
      </Button>
    </div>
  );
}
