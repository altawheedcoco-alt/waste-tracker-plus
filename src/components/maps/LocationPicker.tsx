import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Search, Check, Map, Sparkles, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM, reverseGeocodeOSM, forwardGeocodeOSM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconImg from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIconImg, shadowUrl: markerShadow });

interface LocationPickerProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
  label?: string;
}

interface Coordinates { lat: number; lng: number; }

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  source?: 'ai' | 'database' | 'organization' | 'osm';
  organization_name?: string;
  confidence?: string;
  location_type?: string;
}

const LocationPicker = ({ value, onChange, placeholder = 'أدخل العنوان...', label }: LocationPickerProps) => {
  const [activeTab, setActiveTab] = useState<string>('ai');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<Coordinates | null>(null);
  
  // AI search
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  
  // Regular search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Map refs
  const mapDialogRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // AI-powered location search
  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('ai-location-resolve', {
        body: { query: aiQuery },
      });
      if (error) throw error;
      if (data?.location) {
        const loc = data.location;
        const results = [
          { name: loc.name, address: loc.address, lat: loc.latitude, lng: loc.longitude, confidence: loc.confidence, type: loc.location_type, governorate: loc.governorate },
          ...(loc.suggestions || []).map((s: any) => ({ name: s.name, address: s.address, lat: s.latitude, lng: s.longitude, confidence: 'medium', type: '', governorate: '' })),
        ];
        setAiResults(results);
      }
    } catch (e: any) {
      console.error('AI location error:', e);
      toast.error('فشل في البحث بالذكاء الاصطناعي');
    } finally {
      setAiLoading(false);
    }
  };

  const selectAIResult = (result: any) => {
    onChange(result.address || result.name, result.lat, result.lng);
    setMapCoordinates({ lat: result.lat, lng: result.lng });
    toast.success(`📍 تم تحديد: ${result.name}`);
    setAiResults([]);
    setAiQuery('');
  };

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) { toast.error('المتصفح لا يدعم تحديد الموقع'); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const addr = await reverseGeocodeOSM(latitude, longitude);
          onChange(addr, latitude, longitude);
          setMapCoordinates({ lat: latitude, lng: longitude });
          toast.success('تم تحديد موقعك الحالي');
        } catch {
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude);
        }
        setGettingLocation(false);
      },
      (error) => {
        toast.error(error.code === 1 ? 'يرجى السماح بالوصول للموقع' : 'فشل في تحديد الموقع');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Regular search
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    setSearchLoading(true);
    try {
      const [osmResults, orgLocations] = await Promise.all([
        forwardGeocodeOSM(query),
        supabase
          .from('organization_locations')
          .select('id, location_name, address, city, latitude, longitude')
          .or(`location_name.ilike.%${query}%,address.ilike.%${query}%,city.ilike.%${query}%`)
          .eq('is_active', true).limit(8)
          .then(({ data }) => data || []),
      ]);

      const dbSugs: LocationSuggestion[] = orgLocations.map((loc: any) => ({
        display_name: `${loc.location_name} - ${loc.address || ''}${loc.city ? `, ${loc.city}` : ''}`,
        lat: loc.latitude?.toString() || '30.0444',
        lon: loc.longitude?.toString() || '31.2357',
        source: 'database' as const,
        organization_name: loc.location_name,
      }));

      const osmSugs: LocationSuggestion[] = osmResults.map(r => ({
        display_name: r.address || r.name,
        lat: r.lat.toString(),
        lon: r.lng.toString(),
        source: 'osm' as const,
      }));

      setSuggestions([...dbSugs, ...osmSugs].slice(0, 12));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery) searchLocations(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  const handleSuggestionSelect = (s: LocationSuggestion) => {
    onChange(s.display_name, parseFloat(s.lat), parseFloat(s.lon));
    setMapCoordinates({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success('تم اختيار الموقع');
  };

  // Initialize leaflet map in dialog
  useEffect(() => {
    if (!showMapDialog || !mapDialogRef.current) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapDialogRef.current) return;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

      const center = mapCoordinates ? [mapCoordinates.lat, mapCoordinates.lng] as [number, number] : EGYPT_CENTER;
      const zoom = mapCoordinates ? 15 : DEFAULT_ZOOM;
      const map = L.map(mapDialogRef.current).setView(center, zoom);
      L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;

      if (mapCoordinates) {
        markerRef.current = L.marker([mapCoordinates.lat, mapCoordinates.lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', async () => {
          const pos = markerRef.current!.getLatLng();
          setMapCoordinates({ lat: pos.lat, lng: pos.lng });
        });
      }

      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setMapCoordinates({ lat, lng });
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            setMapCoordinates({ lat: pos.lat, lng: pos.lng });
          });
        }
      });

      // Force resize
      setTimeout(() => map.invalidateSize(), 100);
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      markerRef.current = null;
    };
  }, [showMapDialog]);

  const handleMapConfirm = async () => {
    if (!mapCoordinates) return;
    try {
      const addr = await reverseGeocodeOSM(mapCoordinates.lat, mapCoordinates.lng);
      onChange(addr, mapCoordinates.lat, mapCoordinates.lng);
      toast.success('تم تحديد الموقع على الخريطة');
    } catch {
      onChange(`${mapCoordinates.lat.toFixed(6)}, ${mapCoordinates.lng.toFixed(6)}`, mapCoordinates.lat, mapCoordinates.lng);
    }
    setShowMapDialog(false);
  };

  return (
    <div className="space-y-3">
      {label && (
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {label}
        </Label>
      )}

      {value && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
            <p className="text-sm leading-relaxed">{value}</p>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="ai" className="flex items-center gap-1 text-xs py-2">
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">بحث ذكي AI</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-1 text-xs py-2">
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">بحث بالاسم</span>
            <span className="sm:hidden">بحث</span>
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-1 text-xs py-2">
            <Navigation className="w-3 h-3" />
            <span className="hidden sm:inline">موقعي</span>
            <span className="sm:hidden">GPS</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-1 text-xs py-2">
            <MapPin className="w-3 h-3" />
            <span className="hidden sm:inline">يدوي</span>
            <span className="sm:hidden">يدوي</span>
          </TabsTrigger>
        </TabsList>

        {/* AI Smart Search */}
        <TabsContent value="ai" className="mt-3">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="اكتب اسم المكان مثل: مصنع الحديد والصلب بحلوان، المنطقة الصناعية بالعاشر..."
                onKeyDown={e => e.key === 'Enter' && handleAISearch()}
              />
              <Button type="button" onClick={handleAISearch} disabled={aiLoading || !aiQuery.trim()} size="sm" className="gap-1">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                حدد
              </Button>
            </div>
            
            {aiLoading && (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">جاري البحث بالذكاء الاصطناعي...</p>
              </div>
            )}

            {aiResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {aiResults.map((r, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => selectAIResult(r)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {r.type && <Badge variant="outline" className="text-[9px]">{r.type}</Badge>}
                            {r.governorate && <Badge variant="outline" className="text-[9px]">{r.governorate}</Badge>}
                            {r.confidence && (
                              <Badge variant={r.confidence === 'high' ? 'default' : 'secondary'} className="text-[9px]">
                                {r.confidence === 'high' ? 'دقة عالية' : r.confidence === 'medium' ? 'دقة متوسطة' : 'تقريبي'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              💡 اكتب اسم المصنع، الشركة، المنطقة الصناعية، أو أي وصف للموقع وسيحدده الذكاء الاصطناعي تلقائياً
            </p>
          </div>
        </TabsContent>

        {/* Regular Search */}
        <TabsContent value="search" className="mt-3">
          <div className="space-y-3" ref={searchRef}>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                placeholder="ابحث عن عنوان، مصنع، شركة..."
                className="pr-9"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {searchLoading && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="border rounded-lg max-h-48 overflow-y-auto bg-popover shadow-md">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-right px-3 py-2 hover:bg-muted/50 text-sm border-b last:border-0 flex items-center gap-2"
                    onClick={() => handleSuggestionSelect(s)}
                  >
                    {s.source === 'database' ? <Building2 className="w-3 h-3 text-primary flex-shrink-0" /> : <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                    <span className="truncate">{s.display_name}</span>
                    {s.source === 'database' && <Badge variant="outline" className="text-[8px] flex-shrink-0">محفوظ</Badge>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* GPS */}
        <TabsContent value="current" className="mt-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Navigation className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">اضغط لتحديد موقعك الحالي تلقائياً عبر GPS</p>
              <Button type="button" onClick={getCurrentLocation} disabled={gettingLocation} className="w-full sm:w-auto">
                {gettingLocation ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري تحديد الموقع...</> : <><Navigation className="w-4 h-4 ml-2" />تحديد موقعي الحالي</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual */}
        <TabsContent value="manual" className="mt-3">
          <div className="space-y-3">
            <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
            <p className="text-xs text-muted-foreground">أدخل العنوان الكامل يدوياً</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Map Picker Button */}
      <Button type="button" variant="outline" className="w-full gap-2" onClick={() => setShowMapDialog(true)}>
        <Map className="w-4 h-4" />
        تحديد الموقع على الخريطة التفاعلية
      </Button>

      {/* Interactive Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={(open) => { if (!open) setShowMapDialog(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              تحديد الموقع على الخريطة
              <Badge variant="secondary" className="text-[10px]">اضغط على الخريطة أو اسحب العلامة</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Map Container */}
            <div
              ref={mapDialogRef}
              className="rounded-lg border border-border"
              style={{ height: '400px', width: '100%' }}
            />

            {/* Coordinates display */}
            {mapCoordinates && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-xs">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  {mapCoordinates.lat.toFixed(6)}, {mapCoordinates.lng.toFixed(6)}
                </span>
                <Badge variant="outline" className="text-[9px]">اسحب العلامة لضبط الموقع</Badge>
              </div>
            )}

            {!mapCoordinates && (
              <p className="text-center text-sm text-muted-foreground py-2">
                👆 اضغط على أي نقطة في الخريطة لتحديد الموقع
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setShowMapDialog(false)}>إلغاء</Button>
            <Button type="button" onClick={handleMapConfirm} disabled={!mapCoordinates}>
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
