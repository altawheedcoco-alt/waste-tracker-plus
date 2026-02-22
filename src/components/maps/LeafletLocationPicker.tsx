import { useState, useRef, useEffect, useCallback } from 'react';
import LeafletMapComponent from './LeafletMapComponent';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, MapPin, X, Navigation, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface LeafletLocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }, address?: string) => void;
  height?: string;
  showSearch?: boolean;
  showCurrentLocation?: boolean;
  label?: string;
  className?: string;
  placeholder?: string;
}

interface SearchResult {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

const LeafletLocationPicker = ({
  value,
  onChange,
  height = '400px',
  showSearch = true,
  showCurrentLocation = true,
  label,
  className = '',
  placeholder = 'ابحث عن موقع في مصر...',
}: LeafletLocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=eg&limit=6&language=ar&types=address,place,locality,neighborhood,poi`
      );
      const data = await res.json();
      if (data.features) {
        setResults(data.features);
        setShowResults(true);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(q), 300);
  };

  const selectResult = (result: SearchResult) => {
    const position = { lat: result.center[1], lng: result.center[0] };
    setSearchQuery(result.text);
    setSelectedAddress(result.place_name);
    setShowResults(false);
    onChange(position, result.place_name);
    toast.success('تم تحديد الموقع');
  };

  const handlePositionSelect = (position: { lat: number; lng: number }, address?: string) => {
    setSelectedAddress(address || '');
    onChange(position, address);
    toast.success('تم تحديد الموقع');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error('متصفحك لا يدعم تحديد الموقع'); return; }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${MAPBOX_TOKEN}&language=ar`
          );
          const data = await res.json();
          const address = data.features?.[0]?.place_name || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
          setSelectedAddress(address);
          onChange(coords, address);
          toast.success('تم تحديد موقعك الحالي');
        } catch {
          onChange(coords, `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
        }
        setIsGettingLocation(false);
      },
      () => { toast.error('فشل تحديد الموقع'); setIsGettingLocation(false); },
      { enableHighAccuracy: true }
    );
  };

  const copyCoordinates = () => {
    if (value) {
      navigator.clipboard.writeText(`${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`);
      toast.success('تم نسخ الإحداثيات');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />{label}</label>}
      <div className="relative rounded-lg overflow-hidden border" style={{ height }}>
        {showSearch && (
          <div ref={searchRef} className="absolute top-3 left-3 right-3 z-[1000]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={searchQuery} onChange={handleSearchChange} onFocus={() => results.length > 0 && setShowResults(true)} placeholder={placeholder} className="pr-10 pl-10 bg-background/95 backdrop-blur-sm shadow-lg" dir="rtl" />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
                {searchQuery && !isSearching && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSearchQuery(''); setResults([]); }}><X className="h-3 w-3" /></Button>
                )}
              </div>
            </div>
            {showResults && results.length > 0 && (
              <div className="mt-1 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden">
                <ScrollArea className="max-h-[200px]">
                  {results.map((r) => (
                    <button key={r.id} type="button" className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2" onClick={() => selectResult(r)}>
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.text}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.place_name}</p>
                      </div>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        )}
        {showCurrentLocation && (
          <Button type="button" variant="secondary" size="icon" className="absolute bottom-16 right-3 z-[1000] h-10 w-10 rounded-full shadow-lg bg-background" onClick={getCurrentLocation} disabled={isGettingLocation}>
            {isGettingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
          </Button>
        )}
        <LeafletMapComponent center={value || { lat: 30.0444, lng: 31.2357 }} zoom={value ? 15 : 12} selectedPosition={value} onPositionSelect={handlePositionSelect} height={height} clickable={true} />
      </div>
      {selectedAddress && (
        <div className="p-3 bg-muted/50 rounded-lg border text-sm">
          <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" /><p className="leading-relaxed flex-1">{selectedAddress}</p></div>
        </div>
      )}
      {value && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span dir="ltr">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={copyCoordinates} title="نسخ الإحداثيات"><Copy className="h-3 w-3" /></Button>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(`https://www.google.com/maps?q=${value.lat},${value.lng}`, '_blank')} title="فتح في خرائط جوجل"><ExternalLink className="h-3 w-3" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeafletLocationPicker;
