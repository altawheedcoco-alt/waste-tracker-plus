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
import mapboxgl from 'mapbox-gl';
import { useSavedLocations, NewLocationData } from '@/hooks/useSavedLocations';

// Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9oYW1lZHNhbGFoMTAyNCIsImEiOiJjbWFqMnM5dGcwMGZpMmxweXpzcDQ4OTk0In0.Or1lNo6Ytxq3HElkPRdeDg';

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
  const { saveLocation, saving } = useSavedLocations();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'coordinates'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [formData.longitude, formData.latitude],
      zoom: 10,
    });

    // Set Arabic labels
    map.on('load', () => {
      map.setLayoutProperty('country-label', 'text-field', ['get', 'name_ar']);
      map.setLayoutProperty('state-label', 'text-field', ['get', 'name_ar']);
      map.setLayoutProperty('settlement-label', 'text-field', ['get', 'name_ar']);
    });

    // Add marker
    const marker = new mapboxgl.Marker({
      draggable: true,
      color: '#10b981',
    })
      .setLngLat([formData.longitude, formData.latitude])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      handleCoordinatesChange(lngLat.lat, lngLat.lng);
    });

    // Click to place marker
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      handleCoordinatesChange(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleCoordinatesChange = async (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar`
      );
      const data = await response.json();

      if (data.features?.[0]) {
        const feature = data.features[0];
        const city = feature.context?.find((c: any) => c.id.startsWith('place'))?.text;
        
        setFormData((prev) => ({
          ...prev,
          address: feature.place_name || prev.address,
          city: city || prev.city,
        }));
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&language=ar&country=eg&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const [lng, lat] = result.center;
    
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
      markerRef.current.setLngLat([lng, lat]);
    }

    const city = result.context?.find((c: any) => c.id.startsWith('place'))?.text;

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: result.place_name,
      city: city || '',
      name: prev.name || result.text,
    }));

    setSearchResults([]);
    setSearchQuery('');
    setActiveTab('map');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
          markerRef.current.setLngLat([longitude, latitude]);
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
            <div
              ref={mapContainerRef}
              className="h-[300px] rounded-lg border"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 left-3 gap-2"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
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

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full p-3 text-right rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">{result.text}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {result.place_name}
                  </div>
                </button>
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
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    setFormData((prev) => ({ ...prev, latitude: lat }));
                    if (mapRef.current && markerRef.current) {
                      markerRef.current.setLngLat([formData.longitude, lat]);
                      mapRef.current.flyTo({ center: [formData.longitude, lat] });
                    }
                  }
                }}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>خط الطول (Longitude)</Label>
              <Input
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!isNaN(lng)) {
                    setFormData((prev) => ({ ...prev, longitude: lng }));
                    if (mapRef.current && markerRef.current) {
                      markerRef.current.setLngLat([lng, formData.latitude]);
                      mapRef.current.flyTo({ center: [lng, formData.latitude] });
                    }
                  }
                }}
                dir="ltr"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Fields */}
      <div className="space-y-4 border-t pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">اسم الموقع *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="مثال: مصنع بيبسي العامرية"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_en">الاسم بالإنجليزية</Label>
          <Input
            id="name_en"
            value={formData.name_en || ''}
            onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            placeholder="e.g., Pepsi Amreya Factory"
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">العنوان *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="العنوان التفصيلي"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">المدينة</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="مثال: العامرية"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="governorate">المحافظة</Label>
            <Input
              id="governorate"
              value={formData.governorate || ''}
              onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              placeholder="مثال: الإسكندرية"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>نوع الموقع</Label>
            <Select
              value={formData.location_type}
              onValueChange={(value) => setFormData({ ...formData, location_type: value })}
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

          <div className="space-y-2">
            <Label>التصنيف</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">رقم الهاتف</Label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="01xxxxxxxxx"
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">ملاحظات</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="ملاحظات إضافية عن الموقع..."
            rows={2}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSave}
        disabled={saving || !formData.name.trim() || !formData.address.trim()}
        className="w-full gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            حفظ الموقع
          </>
        )}
      </Button>
    </div>
  );
}
