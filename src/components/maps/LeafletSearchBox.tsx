import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MapPin, X, Building2, Factory, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchEgyptLocations, EgyptLocation } from '@/data/egyptLocations';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface LeafletSearchBoxProps {
  onSelect: (result: { position: { lat: number; lng: number }; address: string; name: string; type?: string; }) => void;
  placeholder?: string;
  className?: string;
  showLocalResults?: boolean;
}

interface SearchResult {
  id: string; name: string; address: string; position: { lat: number; lng: number }; type: 'local' | 'mapbox'; category?: string;
}

const LeafletSearchBox = ({ onSelect, placeholder = 'ابحث عن موقع أو مصنع...', className = '', showLocalResults = true }: LeafletSearchBoxProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setIsSearching(true);
    const all: SearchResult[] = [];
    if (showLocalResults) {
      searchEgyptLocations(q).slice(0, 5).forEach((loc: EgyptLocation) => {
        all.push({ id: `local-${loc.id}`, name: loc.name, address: `${loc.name}، ${loc.governorate}`, position: { lat: loc.lat, lng: loc.lng }, type: 'local', category: loc.type });
      });
    }
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=eg&limit=5&language=ar&types=address,place,locality,neighborhood,poi`);
      const data = await res.json();
      (data.features || []).forEach((f: any) => {
        all.push({ id: f.id, name: f.text || f.place_name.split(',')[0], address: f.place_name, position: { lat: f.center[1], lng: f.center[0] }, type: 'mapbox' });
      });
    } catch {}
    setResults(all);
    setShowResults(true);
    setIsSearching(false);
  }, [showLocalResults]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(e.target.value), 300);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    setShowResults(false);
    onSelect({ position: result.position, address: result.address, name: result.name, type: result.category });
  };

  const getIcon = (cat?: string) => {
    if (cat === 'industrial') return <Factory className="h-4 w-4" />;
    if (cat === 'landmark') return <Landmark className="h-4 w-4" />;
    if (cat === 'city' || cat === 'district') return <Building2 className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={handleChange} onFocus={() => results.length > 0 && setShowResults(true)} placeholder={placeholder} className="pr-10 pl-10" dir="rtl" />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
          {query && !isSearching && <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setQuery(''); setResults([]); }}><X className="h-3 w-3" /></Button>}
        </div>
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          <ScrollArea className="max-h-[300px]">
            {results.map((r) => (
              <button key={r.id} type="button" className="w-full px-3 py-2 text-right hover:bg-accent transition-colors flex items-center gap-2" onClick={() => handleSelect(r)}>
                <div className="text-primary flex-shrink-0">{r.type === 'local' ? getIcon(r.category) : <MapPin className="h-4 w-4" />}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{r.name}</p>{r.type === 'local' && <Badge variant="secondary" className="text-[10px] px-1">محلي</Badge>}</div>
                  <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                </div>
              </button>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default LeafletSearchBox;
