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
  Copy, Share2, Hash, Clock, Trash2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { OpenLocationCode } from 'open-location-code';

// Reverse geocode using Google Maps Geocoder
const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const geocoder = new (window as any).google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng }, language: 'ar' });
    return res.results?.[0]?.formatted_address || null;
  } catch {
    // Fallback to Nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
      const data = await res.json();
      return data.display_name || null;
    } catch { return null; }
  }
};

// Parse coordinates from various map links (Google Maps, Waze, OSM, etc.)
const parseMapLink = (link: string): { lat: number; lng: number } | null => {
  try {
    // Google Maps: various formats
    // https://www.google.com/maps/@30.0444,31.2357,15z
    let match = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // https://www.google.com/maps?q=30.0444,31.2357
    match = link.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    match = link.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };

    // Google Maps place with data containing coordinates: !3d30.0444!4d31.2357
    match = link.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
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

// Extract place name from Google Maps /place/ URL
const extractPlaceNameFromLink = (link: string): string | null => {
  try {
    // https://www.google.com/maps/place/PLACE+NAME/...
    const match = link.match(/google\.com\/maps\/place\/([^/@?]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    return null;
  } catch {
    return null;
  }
};

// Reverse geocode using Google
const reverseGeocodeGoogle = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const geocoder = new (window as any).google.maps.Geocoder();
    const res = await geocoder.geocode({ location: { lat, lng }, language: 'ar' });
    return res.results?.[0]?.formatted_address || null;
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
  type: 'ai' | 'waze' | 'saved' | 'org' | 'google' | 'osm' | 'here' | 'herewego' | 'mapbox' | 'photon' | 'locationiq' | 'opencage' | 'mapsme' | 'tomtom' | 'multi';
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
// Google Maps Mini Map Component
const GoogleMiniMapInner = ({
  containerRef,
  mapInstanceRef,
  markerRef,
  center,
  zoom,
  coordinates,
  height,
  onPositionSelect,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  mapInstanceRef: React.MutableRefObject<any>;
  markerRef: React.MutableRefObject<any>;
  center: { lat: number; lng: number };
  zoom: number;
  coordinates?: { lat: number; lng: number } | null;
  height: string;
  onPositionSelect: (pos: { lat: number; lng: number }) => void;
}) => {
  const onPositionSelectRef = useRef(onPositionSelect);
  onPositionSelectRef.current = onPositionSelect;

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;
    const maps = (window as any).google?.maps;
    if (!maps) return;

    const map = new maps.Map(containerRef.current, {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy',
    });

    map.addListener('click', async (e: any) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onPositionSelectRef.current({ lat, lng });
    });

    mapInstanceRef.current = map;
    return () => { mapInstanceRef.current = null; };
  }, []);

  // Update center/zoom
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(center);
    mapInstanceRef.current.setZoom(zoom);
  }, [center.lat, center.lng, zoom]);

  // Update marker
  useEffect(() => {
    const maps = (window as any).google?.maps;
    if (!maps || !mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    const pos = coordinates || (center.lat !== 30.0444 ? center : null);
    if (!pos) return;

    markerRef.current = new maps.Marker({
      position: pos,
      map: mapInstanceRef.current,
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#ef4444" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="white"/></svg>`),
        scaledSize: new maps.Size(28, 36),
        anchor: new maps.Point(14, 36),
      },
    });
  }, [coordinates, center]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden border cursor-crosshair"
      style={{ height }}
    />
  );
};
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
  const [showAllResults, setShowAllResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(getSearchHistory());
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const googleMiniMapRef = useRef<HTMLDivElement>(null);
  const googleMiniMapInstanceRef = useRef<any>(null);
  const googleMiniMapMarkerRef = useRef<any>(null);
  const { loaded: googleMapsLoaded } = useGoogleMaps();

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
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Detect special inputs: Plus Code, coordinates, or map links
  const handleSmartInput = useCallback(async (q: string): Promise<boolean> => {
    const trimmed = q.trim();

    // 1. Detect map link (Google Maps, Waze, OSM, etc.)
    if (trimmed.startsWith('http') || trimmed.includes('google.com/maps') || trimmed.includes('waze.com') || trimmed.includes('openstreetmap.org')) {
      const coords = parseMapLink(trimmed);
      if (coords) {
        setLoading(true);
        const address = await reverseGeocode(coords.lat, coords.lng);
        onChange(address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`, coords);
        setMapCenter(coords);
        setMapZoom(16);
        setQuery('');
        setFocused(false);
        setLoading(false);
        toast.success('📍 تم تحديد الموقع من الرابط');
        return true;
      }
      // If link has no coordinates, extract place name and search for it
      const placeName = extractPlaceNameFromLink(trimmed);
      if (placeName) {
        setQuery(placeName);
        searchPlaces(placeName);
        toast.info(`🔍 جاري البحث عن: ${placeName}`);
        return true;
      }
    }

    // 2. Detect coordinates (e.g. "30.0444, 31.2357" or "30.0444,31.2357")
    const coordMatch = trimmed.match(/^(-?\d{1,3}\.\d{3,})\s*[,،]\s*(-?\d{1,3}\.\d{3,})$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLoading(true);
        const address = await reverseGeocode(lat, lng);
        onChange(address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
        setMapCenter({ lat, lng });
        setMapZoom(16);
        setQuery('');
        setFocused(false);
        setLoading(false);
        toast.success('📍 تم تحديد الموقع من الإحداثيات');
        return true;
      }
    }

    // 3. Detect Plus Code (e.g. "7GXHX4HM+4P" or "X4HM+4P Cairo")
    const plusCodeMatch = trimmed.match(/^([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3})(\s+.*)?$/i);
    if (plusCodeMatch) {
      try {
        const olc = new OpenLocationCode();
        const code = plusCodeMatch[1].toUpperCase();
        if (olc.isValid(code) && olc.isFull(code)) {
          const area = olc.decode(code);
          const lat = area.latitudeCenter;
          const lng = area.longitudeCenter;
          setLoading(true);
          const address = await reverseGeocode(lat, lng);
          onChange(address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
          setMapCenter({ lat, lng });
          setMapZoom(16);
          setQuery('');
          setFocused(false);
          setLoading(false);
          toast.success('📍 تم تحديد الموقع من Plus Code');
          return true;
        }
      } catch {
        // Not a valid plus code, continue with normal search
      }
    }

    return false;
  }, [onChange, setMapCenter, setMapZoom]);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const handled = await handleSmartInput(query);
      if (!handled) {
        searchPlaces(query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, handleSmartInput]);

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

        // Nominatim search (replaces Mapbox geocoding)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=eg&limit=10&accept-language=ar&viewbox=${center.lng-1},${center.lat+1},${center.lng+1},${center.lat-1}&bounded=0`)
          .then(r => r.json())
          .then(data => (data || []).map((f: any, i: number) => ({
            id: `nominatim-${f.place_id || i}`,
            name: f.display_name?.split(',')[0] || '',
            address: f.display_name || '',
            lat: parseFloat(f.lat),
            lng: parseFloat(f.lon),
            type: 'osm' as const,
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

      const [googleResults, nominatimResults, wazeResults, multiResults, osmResults] = await Promise.all(searchPromises);
      
      // Google first, then Nominatim, Waze, multi-geocode, OSM
      const allMapResults = [...googleResults, ...nominatimResults, ...wazeResults, ...multiResults, ...osmResults];
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
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          onChange(address, { lat: latitude, lng: longitude });
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
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-0.5 px-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400" onClick={() => openInMap('google')} title="Google Maps">
                <ExternalLink className="w-2.5 h-2.5" /> Google
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] gap-0.5 px-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400" onClick={() => openInMap('waze')} title="Waze">
                <ExternalLink className="w-2.5 h-2.5" /> Waze
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
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                if (pasted) {
                  e.preventDefault();
                  setQuery(pasted);
                  handleSmartInput(pasted).then(handled => {
                    if (!handled) {}
                  });
                }
              }}
              onFocus={() => setFocused(true)}
              placeholder="اسم، إحداثيات، Plus Code، أو رابط خريطة..."
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

          {/* Dropdown results directly under search input */}
          {focused && showDropdown && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                {quickLocations && (
                  <div className="p-1.5 space-y-0.5">
                    {organizationAddress && (
                      <button type="button" className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors" onClick={useOrgPrimary}>
                        <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{organizationName || 'المقر'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{organizationCity ? `${organizationAddress}, ${organizationCity}` : organizationAddress}</p>
                        </div>
                      </button>
                    )}
                    {orgLocations.slice(0, 3).map(loc => (
                      <button key={loc.id} type="button" className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors" onClick={() => handleSelect({ id: `org-${loc.id}`, name: loc.location_name, address: loc.city ? `${loc.address}, ${loc.city}` : loc.address, lat: loc.latitude || 0, lng: loc.longitude || 0, type: 'org' })}>
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
                          <button key={loc.id} type="button" className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors" onClick={() => handleSelect({ id: `saved-${loc.id}`, name: loc.name, address: loc.city ? `${loc.address}, ${loc.city}` : loc.address, lat: loc.latitude, lng: loc.longitude, type: 'saved' })}>
                            <Star className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-medium truncate">{loc.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{loc.address}</p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                    {searchHistory.length > 0 && (
                      <>
                        <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-medium">سجل البحث</span>
                          </div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); clearSearchHistory(); setSearchHistory([]); }} className="text-[9px] text-muted-foreground hover:text-destructive transition-colors px-1 py-0.5 rounded hover:bg-destructive/10 flex items-center gap-0.5">
                            <Trash2 className="w-2.5 h-2.5" />
                            مسح
                          </button>
                        </div>
                        {searchHistory.slice(0, 5).map((item, i) => (
                          <button key={`history-${i}`} type="button" className="w-full px-2 py-1.5 text-right hover:bg-muted/80 rounded-md flex items-center gap-2 transition-colors" onClick={() => handleSelect({ id: `history-${i}`, name: item.name, address: item.address, lat: item.lat, lng: item.lng, type: item.type as any })}>
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
                    {quickLocations && <div className="border-t my-1" />}
                    <div className="px-2 py-1">
                      <span className="text-[9px] text-muted-foreground font-medium">نتائج البحث ({results.length})</span>
                    </div>
                    {results.map((result) => (
                      <button key={result.id} type="button" className="w-full px-2 py-2 text-right hover:bg-muted/80 rounded-md flex items-start gap-2 transition-colors" onClick={() => handleSelect(result)}>
                        <div className="mt-0.5 flex-shrink-0">{getTypeIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate">{result.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{result.address}</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] flex-shrink-0 mt-0.5 px-1">{getTypeLabel(result.type)}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {!quickLocations && results.length === 0 && query.length >= 2 && !loading && (
                  <div className="p-4 text-center text-[11px] text-muted-foreground">لا توجد نتائج</div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* Google Maps Interactive Section */}
      {showMap && googleMapsLoaded && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              📍 انقر على الخريطة لتحديد الموقع مباشرة
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" className="h-5 px-1 text-[9px] gap-0.5" onClick={() => openInMap('google')} title="فتح في Google Maps">
                <ExternalLink className="w-2.5 h-2.5" /> Google Maps
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

          <GoogleMiniMapInner
            containerRef={googleMiniMapRef}
            mapInstanceRef={googleMiniMapInstanceRef}
            markerRef={googleMiniMapMarkerRef}
            center={mapCenter}
            zoom={mapZoom}
            coordinates={coordinates}
            height={mapExpanded ? '350px' : '200px'}
            onPositionSelect={async (pos) => {
              const address = await reverseGeocode(pos.lat, pos.lng);
              if (address) {
                onChange(address, pos);
              } else {
                onChange(`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`, pos);
              }
              setMapCenter(pos);
              setMapZoom(15);
              toast.success('📍 تم تحديد الموقع من الخريطة');
            }}
          />
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
