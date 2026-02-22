import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Crosshair, Loader2, Check, Navigation2 } from 'lucide-react';
import { useSavedLocations, NewLocationData } from '@/hooks/useSavedLocations';
import WazeMapSearch from '@/components/maps/WazeMapSearch';

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

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

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
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [activeTab, setActiveTab] = useState<'search' | 'map' | 'coordinates'>('map');
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

  const markerIcon = L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 28],
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [formData.latitude, formData.longitude],
      zoom: 10, zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([formData.latitude, formData.longitude], {
      icon: markerIcon, draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleCoordinatesChange(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      handleCoordinatesChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, []);

  const handleCoordinatesChange = async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

    // Reverse geocode via Mapbox
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&limit=1`
      );
      const data = await response.json();
      if (data.features?.[0]) {
        const feature = data.features[0];
        const city = feature.context?.find((c: any) => c.id?.startsWith('place'))?.text || '';
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

  const handleWazeSelect = (result: { address: string; position: { lat: number; lng: number } }) => {
    const { lat, lng } = result.position;
    setFormData((prev) => ({
      ...prev, latitude: lat, longitude: lng, address: result.address,
      name: prev.name || result.address.split(',')[0],
    }));

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
    setActiveTab('map');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        handleCoordinatesChange(latitude, longitude);
        setIsLocating(false);
      },
      () => setIsLocating(false)
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.address.trim()) return;
    const result = await saveLocation(formData);
    if (result) onSuccess?.();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map" className="gap-2"><MapPin className="h-4 w-4" />الخريطة</TabsTrigger>
          <TabsTrigger value="search" className="gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/><path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10z" fill="currentColor" opacity="0.3"/></svg>Waze</TabsTrigger>
          <TabsTrigger value="coordinates" className="gap-2"><Crosshair className="h-4 w-4" />الإحداثيات</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <div className="relative">
            <div ref={mapContainerRef} className="h-[300px] rounded-lg border" />
            <Button
              variant="secondary" size="sm"
              className="absolute bottom-3 left-3 gap-2 z-[1000]"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation2 className="h-4 w-4" />}
              موقعي الحالي
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">اضغط على الخريطة أو اسحب العلامة لتحديد الموقع</p>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <WazeMapSearch
            onSelect={handleWazeSelect}
            placeholder="ابحث عن موقع أو عنوان..."
            showWazeEmbed={false}
            defaultCenter={{ lat: formData.latitude, lng: formData.longitude }}
          />
        </TabsContent>

        <TabsContent value="coordinates" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>خط العرض (Latitude)</Label>
              <Input type="number" step="0.000001" value={formData.latitude}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, latitude: lat }));
                  markerRef.current?.setLatLng([lat, formData.longitude]);
                  mapRef.current?.panTo([lat, formData.longitude]);
                }} />
            </div>
            <div className="space-y-2">
              <Label>خط الطول (Longitude)</Label>
              <Input type="number" step="0.000001" value={formData.longitude}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value) || 0;
                  setFormData((prev) => ({ ...prev, longitude: lng }));
                  markerRef.current?.setLatLng([formData.latitude, lng]);
                  mapRef.current?.panTo([formData.latitude, lng]);
                }} />
            </div>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={() => handleCoordinatesChange(formData.latitude, formData.longitude)}>
            <Check className="h-4 w-4" />تأكيد الموقع
          </Button>
        </TabsContent>
      </Tabs>

      {/* Location Details Form */}
      <div className="space-y-4 border-t pt-4">
        <div className="space-y-2">
          <Label>اسم الموقع *</Label>
          <Input placeholder="مثال: مصنع التوحيد للأخشاب" value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>العنوان *</Label>
          <Textarea placeholder="العنوان التفصيلي..." value={formData.address}
            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>المدينة</Label>
            <Input placeholder="القاهرة" value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>نوع الموقع</Label>
            <Select value={formData.location_type} onValueChange={(v) => setFormData((prev) => ({ ...prev, location_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>التصنيف</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>ملاحظات</Label>
          <Textarea placeholder="ملاحظات إضافية..." value={formData.notes || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} rows={2} />
        </div>
      </div>

      <Button className="w-full gap-2" onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.address.trim()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        حفظ الموقع
      </Button>
    </div>
  );
}
