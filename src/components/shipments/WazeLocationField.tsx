import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Loader2, MapPin, Navigation, X, ExternalLink,
  Bookmark, Building2, LocateFixed, Star, Map,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { supabase } from '@/integrations/supabase/client';
import L from 'leaflet';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

type MapProvider = 'osm' | 'google' | 'waze';

const MAP_TILES: Record<MapProvider, { url: string; label: string }> = {
  waze: {
    url: 'https://worldtiles1.waze.com/tiles/{z}/{x}/{y}.png',
    label: 'Waze',
  },
  google: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    label: 'Google',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'OpenStreetMap',
  },
};

// Reverse geocode using Nominatim (OSM) - free, no key needed
const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&zoom=18`
    );
    const data = await res.json();
    return data.display_name || null;
  } catch {
    return null;
  }
};

// Interactive Leaflet mini-map with switchable tile providers
const LocationMiniMap = ({ 
  lat, lng, zoom, onLocationSelect, provider = 'osm'
}: { 
  lat: number; lng: number; zoom: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  provider?: MapProvider;
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const onSelectRef = useRef(onLocationSelect);
  onSelectRef.current = onLocationSelect;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) return;

    const map = L.map(container, {
      center: [lat, lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    const tile = L.tileLayer(MAP_TILES[provider].url, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tile;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="background:hsl(142,76%,36%);width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3" fill="hsl(142,76%,36%)"/></svg>
      </div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    markerRef.current = marker;
    mapInstanceRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile layer when provider changes
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(MAP_TILES[provider].url);
    }
  }, [provider]);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom, { animate: true });
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng, zoom]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg" style={{ zIndex: 0 }} />;
};

interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'waze' | 'saved' | 'org';
}

interface OrgLocation {
  id: string;
  location_name: string;
  address: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface WazeLocationFieldProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  label: string;
  placeholder?: string;
  organizationId?: string;
  organizationName?: string;
  organizationAddress?: string;
  organizationCity?: string;
  coordinates?: { lat: number; lng: number } | null;
  icon?: 'pickup' | 'delivery';
  showMap?: boolean;
}

const WazeLocationField = ({
  value,
  onChange,
  label,
  placeholder = 'ابحث عن موقع...',
  organizationId,
  organizationName,
  organizationAddress,
  organizationCity,
  coordinates,
  icon = 'pickup',
  showMap = true,
}: WazeLocationFieldProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [orgLocations, setOrgLocations] = useState<OrgLocation[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 30.0444, lng: 31.2357 });
  const [mapZoom, setMapZoom] = useState(12);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapProvider, setMapProvider] = useState<MapProvider>('waze');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { locations: savedLocations, incrementUsage } = useSavedLocations();

  // Sync map center with coordinates
  useEffect(() => {
    if (coordinates) {
      setMapCenter({ lat: coordinates.lat, lng: coordinates.lng });
      setMapZoom(15);
    }
  }, [coordinates]);

  // Fetch org locations
  useEffect(() => {
    if (!organizationId) return;
    supabase
      .from('organization_locations')
      .select('id, location_name, address, city, latitude, longitude')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .then(({ data }) => setOrgLocations(data || []));
  }, [organizationId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => searchPlaces(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchPlaces = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const lq = q.toLowerCase();
      const savedResults: SearchResult[] = savedLocations
        .filter(l => l.name.toLowerCase().includes(lq) || l.address.toLowerCase().includes(lq))
        .slice(0, 3)
        .map(l => ({
          id: `saved-${l.id}`,
          name: l.name,
          address: l.address,
          lat: l.latitude,
          lng: l.longitude,
          type: 'saved' as const,
        }));

      const orgResults: SearchResult[] = orgLocations
        .filter(l => l.location_name.toLowerCase().includes(lq) || l.address.toLowerCase().includes(lq))
        .slice(0, 2)
        .map(l => ({
          id: `org-${l.id}`,
          name: l.location_name,
          address: l.city ? `${l.address}, ${l.city}` : l.address,
          lat: l.latitude || 0,
          lng: l.longitude || 0,
          type: 'org' as const,
        }));

      // Use Waze search via edge function
      const center = coordinates || mapCenter;
      const wazeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waze-search?q=${encodeURIComponent(q)}&lat=${center.lat}&lon=${center.lng}&lang=ar`;
      const response = await fetch(wazeUrl, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const data = await response.json();
      const wazeResults: SearchResult[] = (data.results || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        type: 'waze' as const,
      }));

      setResults([...savedResults, ...orgResults, ...wazeResults]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [savedLocations, orgLocations, coordinates, mapCenter]);

  const handleSelect = (result: SearchResult) => {
    onChange(result.address, { lat: result.lat, lng: result.lng });
    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapZoom(15);
    setQuery('');
    setResults([]);
    setFocused(false);
    if (result.type === 'saved') {
      incrementUsage(result.id.replace('saved-', ''));
    }
    toast.success('✅ تم تحديد الموقع');
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    
    const applyLocation = async (latitude: number, longitude: number) => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&language=ar`
        );
        const data = await res.json();
        if (data.features?.[0]) {
          onChange(data.features[0].place_name, { lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(15);
          toast.success('📍 تم تحديد موقعك');
        } else {
          onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(15);
        }
      } catch {
        onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { lat: latitude, lng: longitude });
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(15);
      }
      setGettingLocation(false);
    };

    // Try browser geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyLocation(pos.coords.latitude, pos.coords.longitude),
        async (err) => {
          console.warn('Geolocation failed, trying IP fallback:', err.message);
          // Fallback: IP-based location
          try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
              await applyLocation(data.latitude, data.longitude);
              toast.info('📍 تم تحديد موقعك التقريبي (عبر الإنترنت)');
              return;
            }
          } catch {
            console.warn('IP fallback also failed');
          }
          toast.error('فشل تحديد الموقع - جرّب البحث بالاسم');
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      // No geolocation API, use IP fallback directly
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          await applyLocation(data.latitude, data.longitude);
          toast.info('📍 تم تحديد موقعك التقريبي (عبر الإنترنت)');
          return;
        }
      } catch {}
      toast.error('المتصفح لا يدعم تحديد الموقع');
      setGettingLocation(false);
    }
  };

  const useOrgPrimary = () => {
    if (organizationAddress) {
      const addr = organizationCity
        ? `${organizationAddress}, ${organizationCity}`
        : organizationAddress;
      onChange(addr);
      toast.success('تم استخدام عنوان المنظمة');
    }
  };

  const openInMap = (type: 'waze' | 'google' | 'apple' | 'osm') => {
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    const q = value || '';
    switch (type) {
      case 'waze':
        window.open(lat ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes`, '_blank');
        break;
      case 'google':
        window.open(lat ? `https://www.google.com/maps?q=${lat},${lng}` : `https://www.google.com/maps/search/${encodeURIComponent(q)}`, '_blank');
        break;
      case 'apple':
        window.open(lat ? `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(q)}` : `https://maps.apple.com/?q=${encodeURIComponent(q)}`, '_blank');
        break;
      case 'osm':
        window.open(lat ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` : `https://www.openstreetmap.org/search?query=${encodeURIComponent(q)}`, '_blank');
        break;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved': return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'org': return <Building2 className="w-3.5 h-3.5 text-primary" />;
      case 'waze': return <Navigation className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved': return 'محفوظ';
      case 'org': return 'منظمة';
      case 'waze': return 'Waze';
    }
  };

  const showDropdown = focused && (results.length > 0 || query.length === 0);
  const quickLocations = query.length === 0 && focused;

  return (
    <div ref={containerRef} className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon === 'pickup' ? (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <MapPin className="w-3 h-3 text-emerald-600" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Navigation className="w-3 h-3 text-blue-600" />
          </div>
        )}
        {label}
      </Label>

      {/* Current value display */}
      {value && !focused && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border text-sm">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="flex-1 truncate">{value}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => { setFocused(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
              <Search className="w-3 h-3" />
              تعديل الموقع
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] gap-1.5" onClick={getCurrentLocation} disabled={gettingLocation}>
              {gettingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
              موقعي الحالي
            </Button>
            <div className="flex items-center gap-0.5 mr-auto">
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openInMap('waze')} title="Waze">
                <Navigation className="w-3.5 h-3.5 text-primary" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openInMap('google')} title="Google Maps">
                <MapPin className="w-3.5 h-3.5 text-destructive" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openInMap('osm')} title="OpenStreetMap">
                <Map className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search input */}
      {(!value || focused) && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={placeholder}
              className="pr-10 pl-20"
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              {query && !loading && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); }}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 gap-1 text-[10px]"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LocateFixed className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <Card className="absolute z-50 top-full mt-1 w-full shadow-lg border rounded-lg overflow-hidden bg-background">
              <ScrollArea className="max-h-[280px]">
                {quickLocations && (
                  <div className="p-2 space-y-1">
                    {organizationAddress && (
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-right hover:bg-muted/80 rounded-md flex items-center gap-2.5 transition-colors"
                        onClick={useOrgPrimary}
                      >
                        <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{organizationName || 'المقر الرئيسي'}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {organizationCity ? `${organizationAddress}, ${organizationCity}` : organizationAddress}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[9px] flex-shrink-0">رئيسي</Badge>
                      </button>
                    )}

                    {orgLocations.slice(0, 3).map(loc => (
                      <button
                        key={loc.id}
                        type="button"
                        className="w-full px-3 py-2 text-right hover:bg-muted/80 rounded-md flex items-center gap-2.5 transition-colors"
                        onClick={() => handleSelect({
                          id: `org-${loc.id}`,
                          name: loc.location_name,
                          address: loc.city ? `${loc.address}, ${loc.city}` : loc.address,
                          lat: loc.latitude || 0,
                          lng: loc.longitude || 0,
                          type: 'org',
                        })}
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{loc.location_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{loc.address}</p>
                        </div>
                      </button>
                    ))}

                    {savedLocations.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                          <Bookmark className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium">آخر المستخدمة</span>
                        </div>
                        {savedLocations.slice(0, 4).map(loc => (
                          <button
                            key={loc.id}
                            type="button"
                            className="w-full px-3 py-2 text-right hover:bg-muted/80 rounded-md flex items-center gap-2.5 transition-colors"
                            onClick={() => handleSelect({
                              id: `saved-${loc.id}`,
                              name: loc.name,
                              address: loc.city ? `${loc.address}, ${loc.city}` : loc.address,
                              lat: loc.latitude,
                              lng: loc.longitude,
                              type: 'saved',
                            })}
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{loc.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{loc.address}</p>
                            </div>
                            {loc.usage_count > 0 && (
                              <span className="text-[9px] text-muted-foreground">{loc.usage_count}×</span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {results.length > 0 && (
                  <div className="p-1">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        className="w-full px-3 py-2.5 text-right hover:bg-muted/80 rounded-md flex items-start gap-2.5 transition-colors"
                        onClick={() => handleSelect(result)}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{result.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{result.address}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] flex-shrink-0 mt-0.5">
                          {getTypeLabel(result.type)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          )}
        </div>
      )}

      {/* Map Section with Provider Switcher */}
      {showMap && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(['waze', 'google', 'osm'] as MapProvider[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-medium rounded-md transition-all",
                    mapProvider === key 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setMapProvider(key)}
                >
                  {MAP_TILES[key].label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] gap-1"
              onClick={() => setMapExpanded(!mapExpanded)}
            >
              <Map className="w-3 h-3" />
              {mapExpanded ? 'تصغير' : 'تكبير'}
            </Button>
          </div>
          <div className={cn(
            "transition-all duration-300 border rounded-lg overflow-hidden",
            mapExpanded ? "h-[350px]" : "h-[200px]"
          )}>
            {mapProvider === 'waze' ? (
              <iframe
                key={`waze-${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
                src={`https://embed.waze.com/iframe?zoom=${mapZoom}&lat=${mapCenter.lat}&lon=${mapCenter.lng}&pin=1&ct=livemap`}
                width="100%"
                height="100%"
                allowFullScreen
                loading="lazy"
                style={{ border: 'none' }}
                title="Waze Map"
              />
            ) : mapProvider === 'google' ? (
              <iframe
                key={`google-${mapCenter.lat}-${mapCenter.lng}-${mapZoom}`}
                src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${mapZoom}&output=embed`}
                width="100%"
                height="100%"
                allowFullScreen
                loading="lazy"
                style={{ border: 'none' }}
                title="Google Maps"
              />
            ) : (
              <LocationMiniMap 
                lat={mapCenter.lat} 
                lng={mapCenter.lng} 
                zoom={mapZoom}
                provider="osm"
                onLocationSelect={async (lat, lng) => {
                  const address = await reverseGeocode(lat, lng);
                  if (address) {
                    onChange(address, { lat, lng });
                  } else {
                    onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`, { lat, lng });
                  }
                  setMapCenter({ lat, lng });
                  setMapZoom(15);
                  toast.success('📍 تم تحديد الموقع من الخريطة');
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WazeLocationField;
