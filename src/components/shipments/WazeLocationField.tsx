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

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

// Waze iframe using pure React - no direct DOM manipulation
const WazeEmbed = ({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) => {
  const src = `https://embed.waze.com/iframe?zoom=${zoom}&lat=${lat}&lon=${lng}&pin=1`;
  return (
    <iframe
      key={`${lat}-${lng}-${zoom}`}
      src={src}
      width="100%"
      height="100%"
      allowFullScreen
      loading="lazy"
      style={{ border: 'none' }}
      title="Waze Map"
      className="rounded-lg"
    />
  );
};

interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'mapbox' | 'saved' | 'org';
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
  showMap = false,
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

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=eg&limit=5&language=ar&types=address,place,locality,neighborhood,poi`;
      const response = await fetch(url);
      const data = await response.json();
      const mapboxResults: SearchResult[] = (data.features || []).map((f: any, i: number) => ({
        id: `mb-${f.id}-${i}`,
        name: f.text || f.place_name.split(',')[0],
        address: f.place_name,
        lat: f.center[1],
        lng: f.center[0],
        type: 'mapbox' as const,
      }));

      setResults([...savedResults, ...orgResults, ...mapboxResults]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [savedLocations, orgLocations]);

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
    if (!navigator.geolocation) {
      toast.error('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
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
          }
        } catch {
          onChange(`${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
        }
        setGettingLocation(false);
      },
      () => {
        toast.error('فشل تحديد الموقع');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

  const openInWaze = () => {
    if (coordinates) {
      window.open(`https://waze.com/ul?ll=${coordinates.lat},${coordinates.lng}&navigate=yes`, '_blank');
    } else if (value) {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(value)}&navigate=yes`, '_blank');
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved': return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'org': return <Building2 className="w-3.5 h-3.5 text-primary" />;
      case 'mapbox': return <MapPin className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved': return 'محفوظ';
      case 'org': return 'منظمة';
      case 'mapbox': return 'Waze';
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
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border text-sm group">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="flex-1 truncate">{value}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={openInWaze}
              title="فتح في Waze"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setFocused(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              title="تغيير"
            >
              <Search className="w-3 h-3" />
            </Button>
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

      {/* Waze Embedded Map */}
      {showMap && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="hsl(var(--primary))" opacity="0.15"/>
                <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3.5-5c-.3 0-.5-.2-.5-.5v-1c0-2.8-2.2-5-5-5s-5 2.2-5 5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1c0-3.3 2.7-6 6-6s6 2.7 6 6v1c0 .3-.2.5-.5.5z" fill="hsl(var(--primary))"/>
              </svg>
              <span>Waze خريطة</span>
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
            "transition-all duration-300",
            mapExpanded ? "h-[300px]" : "h-[160px]"
          )}>
            <WazeEmbed lat={mapCenter.lat} lng={mapCenter.lng} zoom={mapZoom} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WazeLocationField;
