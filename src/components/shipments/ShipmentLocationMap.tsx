import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Search, Loader2, Route, Clock, Truck, ExternalLink, LocateFixed, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { searchEgyptLocations } from '@/data/egyptLocations';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface MultiGeoResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  here: { label: 'HERE', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  locationiq: { label: 'LocationIQ', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  opencage: { label: 'OpenCage', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  mapbox: { label: 'Mapbox', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' },
  photon: { label: 'Photon', color: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  herewego: { label: 'HERE Auto', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
  mapsme: { label: 'OSM', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  tomtom: { label: 'TomTom', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  local: { label: 'محلي', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
};

interface Coords {
  lat: number;
  lng: number;
}

interface ShipmentLocationMapProps {
  pickupCoords: Coords | null;
  deliveryCoords: Coords | null;
  onPickupChange: (address: string, coords: Coords) => void;
  onDeliveryChange: (address: string, coords: Coords) => void;
  pickupAddress?: string;
  deliveryAddress?: string;
}

type SelectionMode = 'pickup' | 'delivery' | null;

const createIcon = (color: string, label: string) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: ${color};
    width: 32px; height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
  "><span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 12px;">${label}</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const pickupIcon = createIcon('#22c55e', 'A');
const deliveryIcon = createIcon('#ef4444', 'B');

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

const ShipmentLocationMap = ({
  pickupCoords,
  deliveryCoords,
  onPickupChange,
  onDeliveryChange,
  pickupAddress,
  deliveryAddress,
}: ShipmentLocationMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const [mode, setMode] = useState<SelectionMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MultiGeoResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Egypt bounds for restricting map view
  const egyptBounds: L.LatLngBoundsExpression = [
    [22.0, 24.7],  // SW corner
    [31.7, 37.0],  // NE corner
  ];

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.0444, 31.2357],
      zoom: 7,
      zoomControl: false,
      maxBounds: egyptBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 6,
    });

    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      bounds: egyptBounds,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map clicks
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      if (!mode) return;
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);

      if (mode === 'pickup') {
        onPickupChange(address, { lat, lng });
        if (!deliveryCoords) setMode('delivery');
        else setMode(null);
      } else {
        onDeliveryChange(address, { lat, lng });
        setMode(null);
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [mode, deliveryCoords, onPickupChange, onDeliveryChange]);

  // Update cursor
  useEffect(() => {
    const container = mapContainerRef.current;
    if (container) container.style.cursor = mode ? 'crosshair' : '';
  }, [mode]);

  // Update pickup marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
    if (pickupCoords) {
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<b>📍 نقطة الاستلام</b><br/>${pickupAddress || ''}`);
    }
  }, [pickupCoords, pickupAddress]);

  // Update delivery marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (deliveryMarkerRef.current) deliveryMarkerRef.current.remove();
    if (deliveryCoords) {
      deliveryMarkerRef.current = L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`<b>🏁 نقطة التسليم</b><br/>${deliveryAddress || ''}`);
    }
  }, [deliveryCoords, deliveryAddress]);

  // Fetch & draw route
  const fetchRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !pickupCoords || !deliveryCoords) {
      if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }
      setRouteInfo(null);
      return;
    }

    setLoadingRoute(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }

      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];
        const coords: L.LatLngExpression[] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as L.LatLngExpression
        );

        routeLineRef.current = L.polyline(coords, {
          color: '#6366f1',
          weight: 5,
          opacity: 0.8,
        }).addTo(map);

        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        setRouteInfo({
          distance: `${distKm} كم`,
          duration: durMin >= 60 ? `${Math.floor(durMin / 60)} ساعة ${durMin % 60} دقيقة` : `${durMin} دقيقة`,
        });

        map.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
      }
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setLoadingRoute(false);
    }
  }, [pickupCoords, deliveryCoords]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  // Fit to single point
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pickupCoords && !deliveryCoords) map.setView([pickupCoords.lat, pickupCoords.lng], 14);
    else if (deliveryCoords && !pickupCoords) map.setView([deliveryCoords.lat, deliveryCoords.lng], 14);
  }, [pickupCoords, deliveryCoords]);

  // Close results on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch from multi-geocode edge function
  const fetchMultiGeo = useCallback(async (q: string): Promise<MultiGeoResult[]> => {
    try {
      const center = mapRef.current?.getCenter() || { lat: 30.0444, lng: 31.2357 };
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-geocode-search?q=${encodeURIComponent(q)}&lat=${center.lat}&lng=${center.lng}&lang=ar`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const result = await res.json();
      return result.results || [];
    } catch {
      return [];
    }
  }, []);

  // Auto-search: local results instantly, multi-source with debounce
  const performSearch = useCallback((q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setSearching(false);
      return;
    }

    // Instant local results
    const localResults: MultiGeoResult[] = searchEgyptLocations(q).slice(0, 5).map((loc, i) => ({
      id: `local-${loc.id || i}`,
      name: loc.name,
      address: `${loc.name}، ${loc.governorate}`,
      lat: loc.lat,
      lng: loc.lng,
      source: 'local',
    }));

    setSearchResults(localResults);
    setShowResults(true);
    setSearching(true);

    // Debounced multi-source search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const remoteResults = await fetchMultiGeo(q);
      // Merge: local first, then remote (deduplicate by proximity)
      const merged = [...localResults];
      for (const r of remoteResults) {
        const isDupe = merged.some(m => Math.abs(m.lat - r.lat) < 0.002 && Math.abs(m.lng - r.lng) < 0.002);
        if (!isDupe && r.name) merged.push(r);
      }
      setSearchResults(merged);
      setSearching(false);
    }, 250);
  }, [fetchMultiGeo]);

  // Handle input change with auto-search
  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    performSearch(value);
  }, [performSearch]);

  // Select a result — auto-set mode if not selected
  const handleSelectResult = useCallback((result: MultiGeoResult) => {
    const map = mapRef.current;
    if (!map) return;
    setShowResults(false);
    setSearchQuery(result.name);
    map.setView([result.lat, result.lng], 15);

    // Smart auto-mode: if no mode selected, pick the first empty slot
    const activeMode = mode || (!pickupCoords ? 'pickup' : !deliveryCoords ? 'delivery' : 'pickup');

    if (activeMode === 'pickup') {
      onPickupChange(result.address || result.name, { lat: result.lat, lng: result.lng });
      if (!deliveryCoords) setMode('delivery');
      else setMode(null);
      toast.success('✅ تم تحديد نقطة الاستلام');
    } else {
      onDeliveryChange(result.address || result.name, { lat: result.lat, lng: result.lng });
      setMode(null);
      toast.success('✅ تم تحديد نقطة التسليم');
    }
  }, [mode, pickupCoords, deliveryCoords, onPickupChange, onDeliveryChange]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15),
      () => toast.error('تعذر تحديد موقعك'),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm" dir="rtl">
      {/* Toolbar */}
      <div className="p-3 bg-muted/40 border-b space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={mode === 'pickup' ? 'default' : 'outline'}
            className={cn("h-8 text-xs gap-1.5", mode === 'pickup' && "bg-green-600 hover:bg-green-700 text-white")}
            onClick={() => setMode(mode === 'pickup' ? null : 'pickup')}
          >
            <MapPin className="w-3.5 h-3.5" />
            {pickupCoords ? 'تغيير الاستلام' : '📍 حدد الاستلام'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'delivery' ? 'default' : 'outline'}
            className={cn("h-8 text-xs gap-1.5", mode === 'delivery' && "bg-red-600 hover:bg-red-700 text-white")}
            onClick={() => setMode(mode === 'delivery' ? null : 'delivery')}
          >
            <Navigation className="w-3.5 h-3.5" />
            {deliveryCoords ? 'تغيير التسليم' : '🏁 حدد التسليم'}
          </Button>

          <div className="mr-auto flex items-center gap-1.5">
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={handleMyLocation}>
              <LocateFixed className="w-3 h-3" />
              موقعي
            </Button>
            {pickupCoords && deliveryCoords && (
              <>
                <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                  onClick={() => window.open(`https://www.waze.com/ar/live-map/directions?from=ll.${pickupCoords.lat},${pickupCoords.lng}&to=ll.${deliveryCoords.lat},${deliveryCoords.lng}`, '_blank')}>
                  <ExternalLink className="w-3 h-3" /> Waze
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${deliveryCoords.lat},${deliveryCoords.lng}&travelmode=driving`, '_blank')}>
                  <ExternalLink className="w-3 h-3" /> Google
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative" ref={searchBoxRef}>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="⚡ ابحث بسرعة... اكتب اسم المكان أو المصنع"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="h-9 text-xs pr-8 pl-8"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                {searchQuery && !searching && (
                  <button type="button" className="hover:text-foreground text-muted-foreground" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Multi-source results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-xl z-[1000] overflow-hidden">
              <div className="px-3 py-1.5 border-b bg-muted/50">
                <span className="text-[10px] text-muted-foreground font-medium">{searchResults.length} نتيجة من مصادر متعددة</span>
              </div>
              <ScrollArea className="max-h-[250px]">
                {searchResults.map((r) => {
                  const src = SOURCE_LABELS[r.source] || { label: r.source, color: 'bg-muted text-muted-foreground' };
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2 border-b border-border/30 last:border-0"
                      onClick={() => handleSelectResult(r)}
                    >
                      <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.address}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 flex-shrink-0", src.color)}>
                        {src.label}
                      </Badge>
                    </button>
                  );
                })}
              </ScrollArea>
            </div>
          )}
        </div>

        {mode && (
          <div className={cn(
            "text-xs text-center py-1.5 rounded-md font-medium animate-pulse",
            mode === 'pickup' ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'
          )}>
            {mode === 'pickup' ? '👆 اضغط على الخريطة أو ابحث لتحديد نقطة الاستلام' : '👆 اضغط على الخريطة أو ابحث لتحديد نقطة التسليم'}
          </div>
        )}
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="h-[550px] w-full" />

      {/* Route info footer */}
      {(routeInfo || loadingRoute) && (
        <div className="p-3 bg-muted/30 border-t flex items-center gap-3 flex-wrap">
          {loadingRoute ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري حساب المسار...
            </div>
          ) : routeInfo && (
            <>
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Truck className="w-3 h-3" />
                {routeInfo.distance}
              </Badge>
              <Badge variant="secondary" className="gap-1.5 text-xs">
                <Clock className="w-3 h-3" />
                {routeInfo.duration}
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-[10px] text-primary border-primary/20">
                <Route className="w-3 h-3" />
                مسار القيادة
              </Badge>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentLocationMap;
