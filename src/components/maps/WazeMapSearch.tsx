import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, MapPin, Navigation, X, Globe, Share2, Truck, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Pure React Waze iframe - no direct DOM manipulation
const WazeEmbedMap = ({ url }: { url: string }) => {
  return (
    <iframe
      key={url}
      src={url}
      width="100%"
      height="250"
      allowFullScreen
      loading="lazy"
      style={{ border: 'none' }}
      title="Waze Map"
      className="rounded-lg border border-[#33CCFF]/20"
    />
  );
};
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface WazeSearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: 'mapbox' | 'waze';
}

export interface WazeLocationData {
  name: string;
  address: string;
  position: { lat: number; lng: number };
}

interface WazeMapSearchProps {
  onSelect: (result: WazeLocationData) => void;
  onShareToPickup?: (result: WazeLocationData) => void;
  onShareToDelivery?: (result: WazeLocationData) => void;
  placeholder?: string;
  className?: string;
  showWazeEmbed?: boolean;
  defaultCenter?: { lat: number; lng: number };
}

const WazeMapSearch = ({
  onSelect,
  onShareToPickup,
  onShareToDelivery,
  placeholder = 'ابحث عن عنوان، مصنع، شركة...',
  className,
  showWazeEmbed = true,
  defaultCenter = { lat: 30.0444, lng: 31.2357 },
}: WazeMapSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WazeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&country=eg&limit=8&language=ar&types=address,place,locality,neighborhood,poi`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features) {
        const mapped: WazeSearchResult[] = data.features.map((f: any, i: number) => ({
          id: `${f.id}-${i}`,
          name: f.text || f.place_name.split(',')[0],
          address: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
          source: 'mapbox' as const,
        }));
        setResults(mapped);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchPlaces(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchPlaces]);

  const buildLocationData = (result: WazeSearchResult): WazeLocationData => ({
    name: result.name,
    address: result.address,
    position: { lat: result.lat, lng: result.lng },
  });

  const handleSelect = (result: WazeSearchResult) => {
    onSelect(buildLocationData(result));
    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapZoom(15);
    setQuery('');
    setResults([]);
    setShowResults(false);
    toast.success('تم اختيار الموقع');
  };

  const handleShareToPickup = (result: WazeSearchResult) => {
    onShareToPickup?.(buildLocationData(result));
    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapZoom(15);
    toast.success('تم إرسال الموقع لحقل الاستلام');
  };

  const handleShareToDelivery = (result: WazeSearchResult) => {
    onShareToDelivery?.(buildLocationData(result));
    setMapCenter({ lat: result.lat, lng: result.lng });
    setMapZoom(15);
    toast.success('تم إرسال الموقع لحقل التسليم');
  };

  const openInWaze = () => {
    if (query.trim()) {
      window.open(`https://waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`, '_blank');
    }
  };

  const wazeEmbedUrl = `https://embed.waze.com/iframe?zoom=${mapZoom}&lat=${mapCenter.lat}&lon=${mapCenter.lng}&pin=1`;

  return (
    <div ref={containerRef} className={cn("space-y-3", className)}>
      {/* Search Bar */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#33CCFF" opacity="0.15"/>
          <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm-2 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm3.5-5c-.3 0-.5-.2-.5-.5v-1c0-2.8-2.2-5-5-5s-5 2.2-5 5v1c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-1c0-3.3 2.7-6 6-6s6 2.7 6 6v1c0 .3-.2.5-.5.5z" fill="#33CCFF"/>
        </svg>
        <span>بحث المواقع عبر Waze</span>
        <Badge variant="secondary" className="text-[10px] bg-[#33CCFF]/10 text-[#33CCFF] border-0">Waze</Badge>
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pr-10 pl-10"
              onFocus={() => results.length > 0 && setShowResults(true)}
            />
            {loading ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#33CCFF]" />
            ) : query ? (
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setShowResults(false);
                }}
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            ) : null}
          </div>
          {query.trim() && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={openInWaze}
              title="فتح في Waze"
              className="border-[#33CCFF]/30 hover:bg-[#33CCFF]/10"
            >
              <Navigation className="w-4 h-4 text-[#33CCFF]" />
            </Button>
          )}
        </div>

        {/* Search Results */}
        {showResults && results.length > 0 && (
          <Card className="absolute z-50 top-full mt-2 w-full shadow-xl border-0 rounded-xl overflow-hidden bg-background">
            <ScrollArea className="max-h-[300px]">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="w-full px-4 py-2.5 text-right hover:bg-[#33CCFF]/5 transition-all duration-150 flex items-start gap-3 group border-b border-border/50 last:border-0"
                  onClick={() => handleSelect(result)}
                >
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#33CCFF]/10 text-[#33CCFF]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-foreground group-hover:text-[#33CCFF] transition-colors block truncate">
                      {result.name}
                    </span>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.address}
                    </p>
                    {/* Share to pickup/delivery buttons */}
                    {(onShareToPickup || onShareToDelivery) && (
                      <div className="flex gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                        {onShareToPickup && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                            onClick={() => handleShareToPickup(result)}
                          >
                            <Package className="w-3 h-3" />
                            استلام
                          </button>
                        )}
                        {onShareToDelivery && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            onClick={() => handleShareToDelivery(result)}
                          >
                            <Truck className="w-3 h-3" />
                            تسليم
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* Waze Embedded Map */}
      {showWazeEmbed && (
        <WazeEmbedMap url={wazeEmbedUrl} />
      )}

      <p className="text-xs text-muted-foreground">
        🗺️ ابحث عن المكان وحدده، أو افتحه مباشرة في تطبيق Waze
      </p>
    </div>
  );
};

export default WazeMapSearch;
