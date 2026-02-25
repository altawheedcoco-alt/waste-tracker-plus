/// <reference types="google.maps" />
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Search, Loader2, Route, Clock, Truck, ExternalLink, LocateFixed, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { searchEgyptLocations } from '@/data/egyptLocations';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { reverseGeocodeOSM } from '@/lib/leafletConfig';

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
  photon: { label: 'Photon', color: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  herewego: { label: 'HERE Auto', color: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
  tomtom: { label: 'TomTom', color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  local: { label: 'محلي', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  google: { label: 'Google', color: 'bg-sky-500/15 text-sky-700 dark:text-sky-400' },
  osm: { label: 'OSM', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
};

interface Coords { lat: number; lng: number; }

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
  try {
    const geocoder = new (window as any).google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng }, language: 'ar' });
    return res.results?.[0]?.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return reverseGeocodeOSM(lat, lng);
  }
};

const EGYPT_BOUNDS = {
  north: 31.7,
  south: 22.0,
  west: 24.7,
  east: 37.0,
};

const ShipmentLocationMap = ({
  pickupCoords,
  deliveryCoords,
  onPickupChange,
  onDeliveryChange,
  pickupAddress,
  deliveryAddress,
}: ShipmentLocationMapProps) => {
  const { loaded: mapsLoaded, error: mapsError } = useGoogleMaps();
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const pickupMarkerRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const routeRendererRef = useRef<any>(null);
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

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const onPickupChangeRef = useRef(onPickupChange);
  onPickupChangeRef.current = onPickupChange;
  const onDeliveryChangeRef = useRef(onDeliveryChange);
  onDeliveryChangeRef.current = onDeliveryChange;
  const deliveryCoordsRef = useRef(deliveryCoords);
  deliveryCoordsRef.current = deliveryCoords;

  const gmaps = () => (window as any).google?.maps;

  // Initialize Google Map
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapRef.current) return;
    const maps = gmaps();
    if (!maps) return;

    const map = new maps.Map(mapContainerRef.current, {
      center: { lat: 30.0444, lng: 31.2357 },
      zoom: 10,
      maxZoom: 19,
      minZoom: 5,
      restriction: {
        latLngBounds: EGYPT_BOUNDS,
        strictBounds: false,
      },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: maps.ControlPosition.LEFT_BOTTOM,
      },
      gestureHandling: 'greedy',
    });

    map.addListener('click', async (e: any) => {
      if (!modeRef.current || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
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
      mapRef.current = null;
    };
  }, [mapsLoaded]);

  // Update cursor
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({ draggableCursor: mode ? 'crosshair' : undefined });
  }, [mode]);

  // Update pickup marker
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;
    const maps = gmaps();
    if (!maps) return;

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
      pickupMarkerRef.current = null;
    }
    if (!pickupCoords) return;

    const marker = new maps.Marker({
      position: { lat: pickupCoords.lat, lng: pickupCoords.lng },
      map: mapRef.current,
      title: 'نقطة الاستلام',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="#22c55e" stroke="white" stroke-width="2"/><text x="16" y="20" text-anchor="middle" fill="white" font-weight="bold" font-size="14">A</text></svg>`),
        scaledSize: new maps.Size(32, 40),
        anchor: new maps.Point(16, 40),
      },
    });

    const infoWindow = new maps.InfoWindow({
      content: `<div dir="rtl"><b>📍 نقطة الاستلام</b><br/>${pickupAddress || ''}</div>`,
    });
    marker.addListener('click', () => infoWindow.open(mapRef.current, marker));
    pickupMarkerRef.current = marker;
  }, [pickupCoords, pickupAddress, mapsLoaded]);

  // Update delivery marker
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;
    const maps = gmaps();
    if (!maps) return;

    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setMap(null);
      deliveryMarkerRef.current = null;
    }
    if (!deliveryCoords) return;

    const marker = new maps.Marker({
      position: { lat: deliveryCoords.lat, lng: deliveryCoords.lng },
      map: mapRef.current,
      title: 'نقطة التسليم',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="#ef4444" stroke="white" stroke-width="2"/><text x="16" y="20" text-anchor="middle" fill="white" font-weight="bold" font-size="14">B</text></svg>`),
        scaledSize: new maps.Size(32, 40),
        anchor: new maps.Point(16, 40),
      },
    });

    const infoWindow = new maps.InfoWindow({
      content: `<div dir="rtl"><b>🏁 نقطة التسليم</b><br/>${deliveryAddress || ''}</div>`,
    });
    marker.addListener('click', () => infoWindow.open(mapRef.current, marker));
    deliveryMarkerRef.current = marker;
  }, [deliveryCoords, deliveryAddress, mapsLoaded]);

  // Fetch & draw route
  const fetchRoute = useCallback(async () => {
    const map = mapRef.current;
    const maps = gmaps();
    if (!map || !maps || !pickupCoords || !deliveryCoords || !mapsLoaded) {
      if (routeRendererRef.current) {
        routeRendererRef.current.setMap(null);
        routeRendererRef.current = null;
      }
      setRouteInfo(null);
      return;
    }

    setLoadingRoute(true);
    try {
      const directionsService = new maps.DirectionsService();

      if (!routeRendererRef.current) {
        routeRendererRef.current = new maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#6366f1',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });
      }
      routeRendererRef.current.setMap(map);

      const result = await directionsService.route({
        origin: { lat: pickupCoords.lat, lng: pickupCoords.lng },
        destination: { lat: deliveryCoords.lat, lng: deliveryCoords.lng },
        travelMode: maps.TravelMode.DRIVING,
        region: 'eg',
      });

      routeRendererRef.current.setDirections(result);

      const leg = result.routes[0]?.legs[0];
      if (leg) {
        const distKm = ((leg.distance?.value || 0) / 1000).toFixed(1);
        const durMin = Math.round((leg.duration?.value || 0) / 60);
        setRouteInfo({
          distance: `${distKm} كم`,
          duration: durMin >= 60 ? `${Math.floor(durMin / 60)} ساعة ${durMin % 60} دقيقة` : `${durMin} دقيقة`,
        });
      }
    } catch (err) {
      console.error('Google Directions error, falling back to OSRM:', err);
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.lat};${deliveryCoords.lng},${deliveryCoords.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0];
          const distKm = (route.distance / 1000).toFixed(1);
          const durMin = Math.round(route.duration / 60);
          setRouteInfo({
            distance: `${distKm} كم`,
            duration: durMin >= 60 ? `${Math.floor(durMin / 60)} ساعة ${durMin % 60} دقيقة` : `${durMin} دقيقة`,
          });
        }
      } catch { /* ignore */ }
    } finally {
      setLoadingRoute(false);
    }
  }, [pickupCoords, deliveryCoords, mapsLoaded]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  // Fit to single point
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapsLoaded) return;
    if (pickupCoords && !deliveryCoords) {
      map.panTo({ lat: pickupCoords.lat, lng: pickupCoords.lng });
      map.setZoom(14);
    } else if (deliveryCoords && !pickupCoords) {
      map.panTo({ lat: deliveryCoords.lat, lng: deliveryCoords.lng });
      map.setZoom(14);
    }
  }, [pickupCoords, deliveryCoords, mapsLoaded]);

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
      const center = mapRef.current?.getCenter();
      const lat = center?.lat?.() || 30.0444;
      const lng = center?.lng?.() || 31.2357;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-geocode-search?q=${encodeURIComponent(q)}&lat=${lat}&lng=${lng}&lang=ar`;
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

  // Google Places search
  const fetchGooglePlaces = useCallback(async (q: string): Promise<MultiGeoResult[]> => {
    if (!mapsLoaded || !mapRef.current) return [];
    const maps = gmaps();
    if (!maps) return [];
    try {
      const service = new maps.places.PlacesService(mapRef.current);
      return new Promise((resolve) => {
        service.textSearch(
          {
            query: q,
            region: 'eg',
            language: 'ar',
            location: mapRef.current?.getCenter() || undefined,
            radius: 50000,
          },
          (results: any[], status: string) => {
            if (status !== 'OK' || !results) {
              resolve([]);
              return;
            }
            resolve(results.slice(0, 8).map((r: any, i: number) => ({
              id: `google-${r.place_id || i}`,
              name: r.name || '',
              address: r.formatted_address || '',
              lat: r.geometry?.location?.lat() || 0,
              lng: r.geometry?.location?.lng() || 0,
              source: 'google',
            })));
          }
        );
      });
    } catch {
      return [];
    }
  }, [mapsLoaded]);

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

  const performSearch = useCallback((q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setSearching(false);
      setAiExpanded(false);
      return;
    }

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
      const [remoteResults, googleResults] = await Promise.all([
        fetchMultiGeo(q),
        fetchGooglePlaces(q),
      ]);

      const merged = [...localResults, ...remoteResults, ...googleResults];
      const phase1 = deduplicateResults(merged);

      phase1.sort((a, b) => {
        const order: Record<string, number> = { local: 0, ai: 1, google: 2, here: 3, osm: 4, tomtom: 5 };
        return (order[a.source] ?? 6) - (order[b.source] ?? 6);
      });

      setSearchResults(phase1.slice(0, 30));
      setSearching(false);

      if (q.length >= 3) {
        setAiSearching(true);
        const alternativeQueries = await fetchAiExpansion(q);

        if (alternativeQueries.length > 0) {
          const aiQueries = alternativeQueries.slice(0, 2);
          const aiSearchPromises = aiQueries.flatMap(aq => [
            fetchMultiGeo(aq),
            fetchGooglePlaces(aq),
          ]);

          const aiResultArrays = await Promise.all(aiSearchPromises);
          const aiResults = aiResultArrays.flat().map(r => ({ ...r, source: r.source === 'local' ? r.source : 'ai' as string, id: `ai-${r.id}` }));

          const allMerged = deduplicateResults([...phase1, ...aiResults]);

          allMerged.sort((a, b) => {
            const order: Record<string, number> = { local: 0, ai: 1, google: 2, here: 3, osm: 4, tomtom: 5 };
            return (order[a.source] ?? 6) - (order[b.source] ?? 6);
          });

          setSearchResults(allMerged.slice(0, 30));
          setAiExpanded(true);
        }
        setAiSearching(false);
      }
    }, 200);
  }, [fetchMultiGeo, fetchGooglePlaces, fetchAiExpansion, deduplicateResults]);

  const handleInputChange = useCallback((value: string) => {
    setSearchQuery(value);
    performSearch(value);
  }, [performSearch]);

  const handleSelectResult = useCallback((result: MultiGeoResult) => {
    const map = mapRef.current;
    if (!map) return;
    setShowResults(false);
    setSearchQuery(result.name);
    map.panTo({ lat: result.lat, lng: result.lng });
    map.setZoom(15);

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
      (pos) => {
        mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapRef.current?.setZoom(15);
      },
      () => toast.error('تعذر تحديد موقعك'),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="rounded-xl border overflow-hidden bg-card shadow-sm" dir="rtl">
      {/* Toolbar */}
      <div className="p-3 bg-muted/40 border-b space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="button" size="sm" variant={mode === 'pickup' ? 'default' : 'outline'}
            className={cn("h-8 text-xs gap-1.5", mode === 'pickup' && "bg-green-600 hover:bg-green-700 text-white")}
            onClick={() => setMode(mode === 'pickup' ? null : 'pickup')}>
            <MapPin className="w-3.5 h-3.5" />
            {pickupCoords ? 'تغيير الاستلام' : '📍 حدد الاستلام'}
          </Button>
          <Button type="button" size="sm" variant={mode === 'delivery' ? 'default' : 'outline'}
            className={cn("h-8 text-xs gap-1.5", mode === 'delivery' && "bg-red-600 hover:bg-red-700 text-white")}
            onClick={() => setMode(mode === 'delivery' ? null : 'delivery')}>
            <Navigation className="w-3.5 h-3.5" />
            {deliveryCoords ? 'تغيير التسليم' : '🏁 حدد التسليم'}
          </Button>

          <div className="mr-auto flex items-center gap-1">
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1 px-2" onClick={handleMyLocation}>
              <LocateFixed className="w-3 h-3" />
              موقعي
            </Button>
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

      {/* Map + Results overlay */}
      <div className="relative">
        {!mapsLoaded && !mapsError && (
          <div className="h-[420px] w-full flex items-center justify-center bg-muted/30">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">جاري تحميل خريطة Google...</span>
            </div>
          </div>
        )}

        {mapsError && (
          <div className="h-[420px] w-full flex items-center justify-center bg-destructive/10">
            <span className="text-sm text-destructive">{mapsError}</span>
          </div>
        )}

        <div ref={mapContainerRef} className={cn("h-[420px] w-full", (!mapsLoaded || mapsError) && "hidden")} />

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
