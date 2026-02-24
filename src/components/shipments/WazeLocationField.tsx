import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Loader2, MapPin, Navigation, X, ExternalLink,
  Bookmark, Building2, LocateFixed, Star, Map, Link2,
  Copy, Share2, Hash, Clock, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { supabase } from '@/integrations/supabase/client';
import MapboxMapComponent from '@/components/maps/MapboxMapComponent';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapboxConfig';
import { OpenLocationCode } from 'open-location-code';

// Reverse geocode using Nominatim (OSM) - free, no key needed
const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || null;
  } catch {
    return null;
  }
};

// Parse coordinates from various map links (Google Maps, Waze, OSM, etc.)
const parseMapLink = (link: string): { lat: number; lng: number } | null => {
  try {
    // Google Maps: various formats
    // https://www.google.com/maps?q=30.0444,31.2357
    // https://www.google.com/maps/@30.0444,31.2357,15z
    // https://maps.google.com/maps?ll=30.0444,31.2357
    // https://goo.gl/maps/... (short links won't work without redirect)
    let match = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    match = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    match = link.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // Waze: https://waze.com/ul?ll=30.0444,31.2357
    match = link.match(/waze\.com.*[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // OSM: https://www.openstreetmap.org/#map=16/30.0444/31.2357
    match = link.match(/openstreetmap\.org.*#map=\d+\/(-?\d+\.?\d*)\/(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // Generic: just two decimal numbers separated by comma
    match = link.match(/(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    return null;
  } catch {
    return null;
  }
};

// Interactive Leaflet mini-map with switchable tile providers
// Reverse geocode using Mapbox
const reverseGeocodeMapbox = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar`
    );
    const data = await res.json();
    return data.features?.[0]?.place_name || null;
  } catch {
    return null;
  }
};

interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'waze' | 'saved' | 'org' | 'google' | 'osm' | 'here' | 'herewego' | 'mapbox' | 'photon' | 'locationiq' | 'opencage' | 'mapsme' | 'tomtom' | 'multi';
}

interface OrgLocation {
  id: string;
  location_name: string;
  address: string;
  city: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// ==================== Search History ====================
const SEARCH_HISTORY_KEY = 'location-search-history';
const MAX_HISTORY = 15;

interface SearchHistoryItem {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  timestamp: number;
}

function getSearchHistory(): SearchHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveToSearchHistory(item: Omit<SearchHistoryItem, 'timestamp'>) {
  const history = getSearchHistory().filter(
    h => !(Math.abs(h.lat - item.lat) < 0.0001 && Math.abs(h.lng - item.lng) < 0.0001)
  );
  history.unshift({ ...item, timestamp: Date.now() });
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearSearchHistory() {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

interface WazeLocationFieldProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  mapLink?: string;
  onMapLinkChange?: (link: string) => void;
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
  mapLink = '',
  onMapLinkChange,
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
  const [mapProvider, setMapProvider] = useState<'mapbox' | 'osm' | 'google'>('mapbox');
  const [showAllResults, setShowAllResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(getSearchHistory());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { locations: savedLocations, incrementUsage } = useSavedLocations();

  // Generate Plus Code using official Open Location Code library
  const olc = new OpenLocationCode();
  const plusCode = coordinates ? olc.encode(coordinates.lat, coordinates.lng, 11) : '';
  const shareLink = coordinates ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const shareLocation = () => {
    if (!coordinates) return;
    const text = `📍 ${value || 'موقع'}\n📐 إحداثيات: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}\n📌 Plus Code: ${plusCode}\n🔗 ${shareLink}`;
    if (navigator.share) {
      navigator.share({ title: 'موقع', text, url: shareLink }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('تم نسخ بيانات الموقع');
    }
  };

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
    setShowAllResults(false);
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

      // Search ALL providers simultaneously for best coverage
      const center = coordinates || mapCenter;
      
      const searchPromises = [
        // Google Places search (best for businesses/POIs)
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-places-search`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: q, userLat: center.lat, userLng: center.lng, radius: 50000 }),
        })
          .then(r => r.json())
          .then(data => (data.results || []).map((r: any) => ({
            id: `google-${r.id}`,
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
            type: 'google' as const,
          })))
          .catch(() => [] as SearchResult[]),

        // Mapbox Geocoding (excellent for POIs & businesses)
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar&country=eg&proximity=${center.lng},${center.lat}&types=poi,address,place&limit=10`)
          .then(r => r.json())
          .then(data => (data.features || []).map((f: any, i: number) => ({
            id: `mapbox-${f.id || i}`,
            name: f.text || f.place_name?.split(',')[0],
            address: f.place_name || '',
            lat: f.center?.[1] || 0,
            lng: f.center?.[0] || 0,
            type: 'mapbox' as const,
          })))
          .catch(() => [] as SearchResult[]),

        // Waze search
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waze-search?q=${encodeURIComponent(q)}&lat=${center.lat}&lon=${center.lng}&lang=ar`, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        })
          .then(r => r.json())
          .then(data => (data.results || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
            type: 'waze' as const,
          })))
          .catch(() => [] as SearchResult[]),

        // Multi-geocode: HERE + LocationIQ + OpenCage + Photon
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/multi-geocode-search?q=${encodeURIComponent(q)}&lat=${center.lat}&lng=${center.lng}&lang=ar`, {
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        })
          .then(r => r.json())
          .then(data => (data.results || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
            type: (r.source || 'multi') as any,
          })))
          .catch(() => [] as SearchResult[]),

        // OSM Nominatim (fallback)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=eg&limit=5&accept-language=ar`)
          .then(r => r.json())
          .then(data => (data || []).map((r: any, i: number) => ({
            id: `osm-${r.place_id}-${i}`,
            name: r.display_name.split(',')[0],
            address: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
            type: 'osm' as const,
          })))
          .catch(() => [] as SearchResult[]),
      ];

      const [googleResults, mapboxResults, wazeResults, multiResults, osmResults] = await Promise.all(searchPromises);
      
      // Google first, Mapbox second (best POI data), then Waze, multi-geocode, OSM
      const allMapResults = [...googleResults, ...mapboxResults, ...wazeResults, ...multiResults, ...osmResults];
      const deduped: SearchResult[] = [];
      for (const r of allMapResults) {
        const isDupe = deduped.some(
          d => Math.abs(d.lat - r.lat) < 0.001 && Math.abs(d.lng - r.lng) < 0.001
        );
        if (!isDupe) deduped.push(r);
      }

      const allResults = [...savedResults, ...orgResults, ...deduped];
      setResults(allResults);
      
      // Auto-center map on first result with coordinates
      const firstWithCoords = allResults.find(r => r.lat && r.lng);
      if (firstWithCoords) {
        setMapCenter({ lat: firstWithCoords.lat, lng: firstWithCoords.lng });
        setMapZoom(15);
      }
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
    // Save to search history
    saveToSearchHistory({
      name: result.name,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      type: result.type,
    });
    setSearchHistory(getSearchHistory());
    toast.success('✅ تم تحديد الموقع');
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    
    const applyLocation = async (latitude: number, longitude: number) => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar`
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

  const openInMap = (type: 'waze' | 'google' | 'apple' | 'osm' | 'mapbox') => {
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
      case 'mapbox':
        window.open(lat ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=view&access_token=${MAPBOX_ACCESS_TOKEN}#15/${lat}/${lng}` : `https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=view&access_token=${MAPBOX_ACCESS_TOKEN}#10/30.0444/31.2357`, '_blank');
        break;
    }
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved': return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'org': return <Building2 className="w-3.5 h-3.5 text-primary" />;
      case 'waze': return <Navigation className="w-3.5 h-3.5 text-primary" />;
      case 'google': return <MapPin className="w-3.5 h-3.5 text-destructive" />;
      case 'here': case 'herewego': return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
      case 'mapbox': return <Map className="w-3.5 h-3.5 text-blue-500" />;
      case 'photon': return <Map className="w-3.5 h-3.5 text-violet-500" />;
      case 'locationiq': return <MapPin className="w-3.5 h-3.5 text-orange-500" />;
      case 'opencage': return <MapPin className="w-3.5 h-3.5 text-teal-500" />;
      case 'mapsme': return <Map className="w-3.5 h-3.5 text-green-500" />;
      case 'tomtom': return <Navigation className="w-3.5 h-3.5 text-red-500" />;
      default: return <MapPin className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'saved': return 'محفوظ';
      case 'org': return 'منظمة';
      case 'waze': return 'Waze';
      case 'google': return 'Google';
      case 'here': return 'HERE';
      case 'herewego': return 'HERE WeGo';
      case 'mapbox': return 'Mapbox';
      case 'photon': return 'Photon';
      case 'locationiq': return 'LocationIQ';
      case 'opencage': return 'OpenCage';
      case 'mapsme': return 'Maps.me';
      case 'tomtom': return 'TomTom';
      case 'osm': return 'OSM';
      default: return type;
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
            <div className="flex items-center gap-1 mr-auto">
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-0.5 px-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400" onClick={() => openInMap('mapbox')} title="Mapbox">
                <ExternalLink className="w-2.5 h-2.5" /> Mapbox
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-0.5 px-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400" onClick={() => openInMap('osm')} title="OpenStreetMap">
                <ExternalLink className="w-2.5 h-2.5" /> OSM
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-0.5 px-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400" onClick={() => openInMap('waze')} title="Waze">
                <ExternalLink className="w-2.5 h-2.5" /> Waze
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-0.5 px-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400" onClick={() => openInMap('google')} title="Google Maps">
                <ExternalLink className="w-2.5 h-2.5" /> Google
              </Button>
            </div>
          </div>

          {/* Plus Code + Address + Share Link */}
          {coordinates && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 p-2 bg-muted/30 rounded-lg border text-[11px]">
              {/* Coordinates */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-right"
                onClick={() => copyToClipboard(`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`, 'الإحداثيات')}
                title="نسخ الإحداثيات"
              >
                <Navigation className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                <span className="flex-1 truncate font-mono text-[10px]" dir="ltr">{`${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}</span>
                <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </button>
              {/* Plus Code */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-right"
                onClick={() => copyToClipboard(plusCode, 'Plus Code')}
                title="نسخ Plus Code"
              >
                <Hash className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="flex-1 truncate font-mono text-[10px]" dir="ltr">{plusCode}</span>
                <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </button>
              {/* Address */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-right"
                onClick={() => copyToClipboard(value, 'العنوان')}
                title="نسخ العنوان"
              >
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="flex-1 truncate">{value}</span>
                <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </button>
              {/* Share Link */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-right"
                  onClick={() => copyToClipboard(shareLink, 'الرابط')}
                  title="نسخ الرابط"
                >
                  <Link2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="flex-1 truncate font-mono text-[10px]" dir="ltr">{`${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}`}</span>
                  <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                </button>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={shareLocation} title="مشاركة الموقع">
                  <Share2 className="w-3.5 h-3.5 text-violet-600" />
                </Button>
              </div>
            </div>
          )}
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
        </div>
      )}

      {/* Map Section - PRIORITY: shown first */}
      {showMap && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
              <Button
                type="button"
                variant={mapProvider === 'mapbox' ? 'default' : 'ghost'}
                size="sm"
                className={cn("h-5 text-[9px] gap-0.5 px-1.5", mapProvider === 'mapbox' && 'shadow-sm')}
                onClick={() => setMapProvider('mapbox')}
              >
                <Map className="w-2.5 h-2.5" /> Mapbox
              </Button>
              <Button
                type="button"
                variant={mapProvider === 'osm' ? 'default' : 'ghost'}
                size="sm"
                className={cn("h-5 text-[9px] gap-0.5 px-1.5", mapProvider === 'osm' && 'shadow-sm')}
                onClick={() => setMapProvider('osm')}
              >
                <MapPin className="w-2.5 h-2.5" /> OSM
              </Button>
              <Button
                type="button"
                variant={mapProvider === 'google' ? 'default' : 'ghost'}
                size="sm"
                className={cn("h-5 text-[9px] gap-0.5 px-1.5", mapProvider === 'google' && 'shadow-sm')}
                onClick={() => setMapProvider('google')}
              >
                <ExternalLink className="w-2.5 h-2.5" /> Google
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" className="h-5 px-1 text-[9px] gap-0.5" onClick={() => openInMap('waze')} title="فتح في Waze">
                <Navigation className="w-2.5 h-2.5" /> Waze
              </Button>
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
          </div>

          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground">📍 انقر على الخريطة لتحديد الموقع مباشرة</div>
           <div className={cn(
              "grid gap-2",
              (!value || focused) && showDropdown ? "grid-cols-[1fr_minmax(180px,220px)]" : "grid-cols-1"
            )}>
              {/* Map Display based on provider */}
              {mapProvider === 'mapbox' && (
                <MapboxMapComponent
                  center={mapCenter}
                  zoom={mapZoom}
                  selectedPosition={mapCenter.lat !== 30.0444 ? mapCenter : null}
                  onPositionSelect={async (pos, address) => {
                    if (address) {
                      onChange(address, pos);
                    } else {
                      onChange(`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`, pos);
                    }
                    setMapCenter(pos);
                    setMapZoom(15);
                    toast.success('📍 تم تحديد الموقع من الخريطة');
                  }}
                  clickable={true}
                  height={mapExpanded ? '350px' : '200px'}
                />
              )}
              {mapProvider === 'osm' && (
                <div className="relative rounded-lg overflow-hidden border" style={{ height: mapExpanded ? '350px' : '200px' }}>
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(coordinates?.lng || mapCenter.lng) - 0.01},${(coordinates?.lat || mapCenter.lat) - 0.01},${(coordinates?.lng || mapCenter.lng) + 0.01},${(coordinates?.lat || mapCenter.lat) + 0.01}&layer=mapnik&marker=${coordinates?.lat || mapCenter.lat},${coordinates?.lng || mapCenter.lng}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="OpenStreetMap"
                  />
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${coordinates?.lat || mapCenter.lat}&mlon=${coordinates?.lng || mapCenter.lng}#map=16/${coordinates?.lat || mapCenter.lat}/${coordinates?.lng || mapCenter.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-primary hover:underline"
                  >
                    عرض أكبر على OSM ↗
                  </a>
                </div>
              )}
              {mapProvider === 'google' && (
                <div className="relative rounded-lg overflow-hidden border" style={{ height: mapExpanded ? '350px' : '200px' }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${coordinates?.lat || mapCenter.lat},${coordinates?.lng || mapCenter.lng}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                    title="Google Maps"
                  />
                  <a
                    href={`https://www.google.com/maps?q=${coordinates?.lat || mapCenter.lat},${coordinates?.lng || mapCenter.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-1 left-1 text-[9px] bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-primary hover:underline"
                  >
                    عرض أكبر على Google Maps ↗
                  </a>
                </div>
              )}
              {/* Sidebar for search results */}
              {(!value || focused) && showDropdown && (
                <div className={cn(
                  "border rounded-lg overflow-hidden bg-background flex flex-col",
                  mapExpanded ? "h-[350px]" : "h-[200px]"
                )}>
                  <div className="px-2.5 py-1.5 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
                    <Badge variant="outline" className="text-[9px]">{results.length || '—'}</Badge>
                    <span className="text-[10px] font-medium text-muted-foreground">نتائج البحث</span>
                  </div>
                  <ScrollArea className="flex-1">
                    {quickLocations && (
                      <div className="p-1.5 space-y-0.5">
                        {organizationAddress && (
                          <button
                            type="button"
                            className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors"
                            onClick={useOrgPrimary}
                          >
                            <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium truncate">{organizationName || 'المقر'}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {organizationCity ? `${organizationAddress}, ${organizationCity}` : organizationAddress}
                              </p>
                            </div>
                          </button>
                        )}
                        {orgLocations.slice(0, 3).map(loc => (
                          <button
                            key={loc.id}
                            type="button"
                            className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors"
                            onClick={() => handleSelect({
                              id: `org-${loc.id}`,
                              name: loc.location_name,
                              address: loc.city ? `${loc.address}, ${loc.city}` : loc.address,
                              lat: loc.latitude || 0,
                              lng: loc.longitude || 0,
                              type: 'org',
                            })}
                          >
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium truncate">{loc.location_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{loc.address}</p>
                            </div>
                          </button>
                        ))}
                        {savedLocations.length > 0 && (
                          <>
                            <div className="flex items-center gap-1.5 px-2 pt-1.5 pb-0.5">
                              <Bookmark className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="text-[9px] text-muted-foreground font-medium">آخر المستخدمة</span>
                            </div>
                            {savedLocations.slice(0, 4).map(loc => (
                              <button
                                key={loc.id}
                                type="button"
                                className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors"
                                onClick={() => handleSelect({
                                  id: `saved-${loc.id}`,
                                  name: loc.name,
                                  address: loc.city ? `${loc.address}, ${loc.city}` : loc.address,
                                  lat: loc.latitude,
                                  lng: loc.longitude,
                                  type: 'saved',
                                })}
                              >
                                <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium truncate">{loc.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{loc.address}</p>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                        {/* Search History */}
                        {searchHistory.length > 0 && (
                          <>
                            <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground font-medium">سجل البحث</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSearchHistory();
                                  setSearchHistory([]);
                                }}
                                className="text-[9px] text-muted-foreground hover:text-destructive transition-colors px-1 py-0.5 rounded hover:bg-destructive/10 flex items-center gap-0.5"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                مسح
                              </button>
                            </div>
                            {searchHistory.slice(0, 5).map((item, i) => (
                              <button
                                key={`history-${i}`}
                                type="button"
                                className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors"
                                onClick={() => handleSelect({
                                  id: `history-${i}`,
                                  name: item.name,
                                  address: item.address,
                                  lat: item.lat,
                                  lng: item.lng,
                                  type: item.type as any,
                                })}
                              >
                                <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium truncate">{item.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{item.address}</p>
                                </div>
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
                            className="w-full px-2 py-2 text-right hover:bg-muted/80 rounded-md flex items-start gap-2 transition-colors"
                            onClick={() => handleSelect(result)}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium truncate">{result.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{result.address}</p>
                            </div>
                            <Badge variant="outline" className="text-[8px] flex-shrink-0 mt-0.5 px-1">
                              {getTypeLabel(result.type)}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {!quickLocations && results.length === 0 && (
                      <div className="p-4 text-center text-[11px] text-muted-foreground">
                        لا توجد نتائج
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Link Input */}
      <div className="space-y-1">
        <Label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Link2 className="w-3 h-3" />
          لصق رابط خريطة (Google Maps, Waze, OSM)
        </Label>
        <div className="flex gap-2">
          <Input
            value={mapLink}
            onChange={(e) => onMapLinkChange?.(e.target.value)}
            placeholder="https://www.google.com/maps?q=30.0444,31.2357"
            className="text-xs h-8 flex-1"
            dir="ltr"
            onPaste={(e) => {
              const target = e.currentTarget;
              setTimeout(() => {
                const pastedLink = target?.value;
                if (pastedLink) {
                  const coords = parseMapLink(pastedLink);
                  if (coords) {
                    onMapLinkChange?.(pastedLink);
                    setMapCenter(coords);
                    setMapZoom(16);
                    reverseGeocode(coords.lat, coords.lng).then((address) => {
                      if (address) {
                        onChange(address, coords);
                      } else {
                        onChange(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords);
                      }
                    });
                    toast.success('📍 تم تحديد الموقع من الرابط');
                  } else {
                    toast.error('لم يتم العثور على إحداثيات في الرابط');
                  }
                }
              }, 0);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-[11px] gap-1 px-2.5"
            disabled={!mapLink}
            onClick={() => {
              const coords = parseMapLink(mapLink);
              if (coords) {
                setMapCenter(coords);
                setMapZoom(16);
                reverseGeocode(coords.lat, coords.lng).then((address) => {
                  if (address) {
                    onChange(address, coords);
                  } else {
                    onChange(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords);
                  }
                });
                toast.success('📍 تم تحديد الموقع من الرابط');
              } else {
                toast.error('لم يتم العثور على إحداثيات في الرابط');
              }
            }}
          >
            <MapPin className="w-3 h-3" />
            تحديد
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WazeLocationField;
