import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Search, Loader2, Route, Clock, Truck, ExternalLink, LocateFixed, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { searchEgyptLocations } from '@/data/egyptLocations';
import {
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
  EGYPT_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  reverseGeocodeOSM,
} from '@/lib/leafletConfig';

interface MultiGeoResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: string;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  ai: { label: '✨ ذكاء اصطناعي', color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400' },
  here: { label: 'HERE', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  locationiq: { label: 'LocationIQ', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
  opencage: { label: 'OpenCage', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  mapbox: { label: 'Mapbox', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' },
  photon: { label: 'Photon', color: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  herewego: { label: 'HERE Auto', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
  mapsme: { label: 'OSM', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  tomtom: { label: 'TomTom', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  local: { label: 'محلي', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  google: { label: 'Google', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-400' },
  osm: { label: 'OSM', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
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

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  return reverseGeocodeOSM(lat, lng);
};

const createMarkerEl = (color: string, label: string) => {
  return L.divIcon({
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);color:white;font-weight:bold;font-size:12px;">${label}</span></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
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
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [mode, setMode] = useState<SelectionMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MultiGeoResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for callbacks used in map click handler
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onPickupChangeRef = useRef(onPickupChange);
  onPickupChangeRef.current = onPickupChange;
  const onDeliveryChangeRef = useRef(onDeliveryChange);
  onDeliveryChangeRef.current = onDeliveryChange;
  const deliveryCoordsRef = useRef(deliveryCoords);
  deliveryCoordsRef.current = deliveryCoords;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: [31.2357, 30.0444],
      zoom: 10,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: [
        [EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]],
        [EGYPT_BOUNDS[2], EGYPT_BOUNDS[3]],
      ],
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');

    map.on('click', async (e) => {
      if (!modeRef.current) return;
      const { lat, lng } = e.lngLat;
      const address = await reverseGeocode(lat, lng);

      if (modeRef.current === 'pickup') {
        onPickupChangeRef.current(address, { lat, lng });
        if (!deliveryCoordsRef.current) setMode('delivery');
        else setMode(null);
      } else {
        onDeliveryChangeRef.current(address, { lat, lng });
        setMode(null);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update cursor
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = mode ? 'crosshair' : '';
  }, [mode]);

  // Update pickup marker
  useEffect(() => {
    if (pickupMarkerRef.current) { pickupMarkerRef.current.remove(); pickupMarkerRef.current = null; }
    if (!mapRef.current || !pickupCoords) return;

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>📍 نقطة الاستلام</b><br/>${pickupAddress || ''}`);
    pickupMarkerRef.current = new mapboxgl.Marker({ element: createMarkerEl('#22c55e', 'A'), anchor: 'bottom' })
      .setLngLat([pickupCoords.lng, pickupCoords.lat])
      .setPopup(popup)
      .addTo(mapRef.current);
  }, [pickupCoords, pickupAddress]);

  // Update delivery marker
  useEffect(() => {
    if (deliveryMarkerRef.current) { deliveryMarkerRef.current.remove(); deliveryMarkerRef.current = null; }
    if (!mapRef.current || !deliveryCoords) return;

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<b>🏁 نقطة التسليم</b><br/>${deliveryAddress || ''}`);
    deliveryMarkerRef.current = new mapboxgl.Marker({ element: createMarkerEl('#ef4444', 'B'), anchor: 'bottom' })
      .setLngLat([deliveryCoords.lng, deliveryCoords.lat])
      .setPopup(popup)
      .addTo(mapRef.current);
  }, [deliveryCoords, deliveryAddress]);

  // Fetch & draw route
  const fetchRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !pickupCoords || !deliveryCoords) {
      // Remove route layer if exists
      if (map?.getSource('route')) {
        map.removeLayer('route-line');
        map.removeSource('route');
      }
      setRouteInfo(null);
      return;
    }

    setLoadingRoute(true);
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();

      // Remove old route
      if (map.getSource('route')) {
        map.removeLayer('route-line');
        map.removeSource('route');
      }

      if (data.code === 'Ok' && data.routes?.[0]) {
        const route = data.routes[0];

        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#6366f1', 'line-width': 5, 'line-opacity': 0.8 },
        });

        // Fit bounds to route
        const coords = route.geometry.coordinates as [number, number][];
        const bounds = coords.reduce(
          (b, c) => b.extend(c as mapboxgl.LngLatLike),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.fitBounds(bounds, { padding: 50 });

        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);
        setRouteInfo({
          distance: `${distKm} كم`,
          duration: durMin >= 60 ? `${Math.floor(durMin / 60)} ساعة ${durMin % 60} دقيقة` : `${durMin} دقيقة`,
        });
      }
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setLoadingRoute(false);
    }
  }, [pickupCoords, deliveryCoords]);

  useEffect(() => {
    // Wait for map style to load before adding route
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) {
      fetchRoute();
    } else {
      map.once('load', fetchRoute);
    }
  }, [fetchRoute]);

  // Fit to single point
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pickupCoords && !deliveryCoords) map.easeTo({ center: [pickupCoords.lng, pickupCoords.lat], zoom: 14 });
    else if (deliveryCoords && !pickupCoords) map.easeTo({ center: [deliveryCoords.lng, deliveryCoords.lat], zoom: 14 });
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

  // Also fetch from Mapbox Geocoding API directly for better coverage
  const fetchMapboxGeo = useCallback(async (q: string): Promise<MultiGeoResult[]> => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=eg&limit=8&language=ar&types=address,place,locality,neighborhood,poi`
      );
      const data = await res.json();
      return (data.features || []).map((f: any, i: number) => ({
        id: `mapbox-${i}`,
        name: f.text || f.place_name,
        address: f.place_name,
        lat: f.center[1],
        lng: f.center[0],
        source: 'mapbox',
      }));
    } catch {
      return [];
    }
  }, []);

  // AI-powered query expansion
  const fetchAiExpansion = useCallback(async (q: string): Promise<string[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return [];

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-location-search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.alternativeQueries || [];
    } catch {
      return [];
    }
  }, []);

  // Deduplicate helper
  const deduplicateResults = useCallback((results: MultiGeoResult[]): MultiGeoResult[] => {
    const deduped: MultiGeoResult[] = [];
    for (const r of results) {
      const isDupe = deduped.some(m =>
        (Math.abs(m.lat - r.lat) < 0.002 && Math.abs(m.lng - r.lng) < 0.002) ||
        (m.name.toLowerCase() === r.name.toLowerCase() && Math.abs(m.lat - r.lat) < 0.01)
      );
      if (!isDupe && r.name) deduped.push(r);
    }
    return deduped;
  }, []);

  // Auto-search with AI expansion + parallel multi-source fetching
  const performSearch = useCallback((q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setSearching(false);
      setAiExpanded(false);
      return;
    }

    // Instant local results
    const localResults: MultiGeoResult[] = searchEgyptLocations(q).slice(0, 8).map((loc, i) => ({
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
    setAiExpanded(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Phase 1: Fetch from multiple sources in parallel with original query
      const [remoteResults, mapboxResults] = await Promise.all([
        fetchMultiGeo(q),
        fetchMapboxGeo(q),
      ]);

      const merged = [...localResults, ...remoteResults, ...mapboxResults];
      const phase1 = deduplicateResults(merged);

      // Sort: local first, then by source priority
      phase1.sort((a, b) => {
        const order: Record<string, number> = { local: 0, ai: 1, mapbox: 2, here: 3, google: 4, tomtom: 5 };
        return (order[a.source] ?? 6) - (order[b.source] ?? 6);
      });

      setSearchResults(phase1.slice(0, 30));
      setSearching(false);

      // Phase 2: AI-powered expansion (runs in background, enriches results)
      if (q.length >= 3) {
        setAiSearching(true);
        const alternativeQueries = await fetchAiExpansion(q);

        if (alternativeQueries.length > 0) {
          // Search top 2 AI-suggested alternative queries in parallel
          const aiQueries = alternativeQueries.slice(0, 2);
          const aiSearchPromises = aiQueries.flatMap(aq => [
            fetchMultiGeo(aq),
            fetchMapboxGeo(aq),
          ]);

          const aiResultArrays = await Promise.all(aiSearchPromises);
          const aiResults = aiResultArrays.flat().map(r => ({ ...r, source: r.source === 'local' ? r.source : 'ai' as string, id: `ai-${r.id}` }));

          // Merge AI results with existing results
          const allMerged = deduplicateResults([...phase1, ...aiResults]);

          allMerged.sort((a, b) => {
            const order: Record<string, number> = { local: 0, ai: 1, mapbox: 2, here: 3, google: 4, tomtom: 5 };
            return (order[a.source] ?? 6) - (order[b.source] ?? 6);
          });

          setSearchResults(allMerged.slice(0, 30));
          setAiExpanded(true);
        }
        setAiSearching(false);
      }
    }, 200);
  }, [fetchMultiGeo, fetchMapboxGeo, fetchAiExpansion, deduplicateResults]);

  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    performSearch(value);
  }, [performSearch]);

  const handleSelectResult = useCallback((result: MultiGeoResult) => {
    const map = mapRef.current;
    if (!map) return;
    setShowResults(false);
    setSearchQuery(result.name);
    map.easeTo({ center: [result.lng, result.lat], zoom: 15 });

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
      (pos) => mapRef.current?.easeTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 }),
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

          <div className="mr-auto flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2" onClick={handleMyLocation}>
              <LocateFixed className="w-3 h-3" />
              موقعي
            </Button>
            {/* Map provider links - always visible */}
            {(() => {
              const point = pickupCoords || deliveryCoords;
              const hasRoute = pickupCoords && deliveryCoords;
              return (
                <>
                  <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] gap-0.5 px-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400"
                    onClick={() => window.open(hasRoute
                      ? `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lng}&destination=${deliveryCoords.lat},${deliveryCoords.lng}&travelmode=driving`
                      : point ? `https://www.google.com/maps/@${point.lat},${point.lng},15z` : 'https://www.google.com/maps/@30.0444,31.2357,10z', '_blank')}>
                    <ExternalLink className="w-2.5 h-2.5" /> Google
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] gap-0.5 px-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                    onClick={() => window.open(hasRoute
                      ? `https://www.waze.com/ar/live-map/directions?from=ll.${pickupCoords.lat},${pickupCoords.lng}&to=ll.${deliveryCoords.lat},${deliveryCoords.lng}`
                      : point ? `https://www.waze.com/ar/live-map?ll=${point.lat},${point.lng}&zoom=15` : 'https://www.waze.com/ar/live-map', '_blank')}>
                    <ExternalLink className="w-2.5 h-2.5" /> Waze
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] gap-0.5 px-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400"
                    onClick={() => window.open(hasRoute
                      ? `https://www.openstreetmap.org/directions?engine=osrm_car&route=${pickupCoords.lat},${pickupCoords.lng};${deliveryCoords.lat},${deliveryCoords.lng}`
                      : point ? `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=15/${point.lat}/${point.lng}` : 'https://www.openstreetmap.org/#map=10/30.0444/31.2357', '_blank')}>
                    <ExternalLink className="w-2.5 h-2.5" /> OSM
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-6 text-[10px] gap-0.5 px-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
                    onClick={() => window.open(hasRoute
                      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=view&access_token=${MAPBOX_ACCESS_TOKEN}#15/${pickupCoords.lat}/${pickupCoords.lng}`
                      : point ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=view&access_token=${MAPBOX_ACCESS_TOKEN}#15/${point.lat}/${point.lng}` : `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=view&access_token=${MAPBOX_ACCESS_TOKEN}#10/30.0444/31.2357`, '_blank')}>
                    <ExternalLink className="w-2.5 h-2.5" /> Mapbox
                  </Button>
                </>
              );
            })()}
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
                {aiSearching && <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-500" />}
                {searching && !aiSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                {searchQuery && !searching && !aiSearching && (
                  <button type="button" className="hover:text-foreground text-muted-foreground" onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); setAiExpanded(false); }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

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

      {/* Map + Results overlay layout */}
      <div className="relative">
        {/* Map container */}
        <div ref={mapContainerRef} className="h-[420px] w-full" />

        {/* Results overlay panel - slides in from the right */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-0 right-0 w-[280px] h-full bg-background/98 backdrop-blur-md border-l shadow-2xl z-10 flex flex-col">
            <div className="px-3 py-2.5 border-b bg-muted/60 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold">{searchResults.length} نتيجة</span>
                {aiExpanded && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 bg-violet-500/10 text-violet-600 border-violet-200">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />AI
                  </Badge>
                )}
              </div>
              <button type="button" onClick={() => setShowResults(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {(searching || aiSearching) && (
              <div className="px-3 py-1.5 border-b bg-primary/5 flex items-center gap-2">
                {aiSearching ? (
                  <>
                    <Sparkles className="w-3 h-3 animate-pulse text-violet-500" />
                    <span className="text-[10px] text-violet-600">الذكاء الاصطناعي يبحث عن نتائج أدق...</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span className="text-[10px] text-primary">جاري البحث في مصادر متعددة...</span>
                  </>
                )}
              </div>
            )}
            <ScrollArea className="flex-1">
              <div className="py-1">
                {searchResults.map((r, idx) => {
                  const src = SOURCE_LABELS[r.source] || { label: r.source, color: 'bg-muted text-muted-foreground' };
                  // Show source group header
                  const prevSource = idx > 0 ? searchResults[idx - 1].source : null;
                  const showHeader = r.source !== prevSource;

                  return (
                    <div key={r.id}>
                      {showHeader && (
                        <div className="px-3 py-1 mt-1 first:mt-0">
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0.5 h-4", src.color)}>
                            {src.label}
                          </Badge>
                        </div>
                      )}
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-right hover:bg-accent/80 active:bg-accent transition-colors flex items-start gap-2"
                        onClick={() => handleSelectResult(r)}
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium leading-tight">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{r.address}</p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

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
