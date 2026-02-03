import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, Search, Crosshair, Info, Loader2, X, Sparkles, 
  Building2, Factory, MapPinned, Globe, Lightbulb, Navigation 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import BackButton from '@/components/ui/back-button';
import { toast } from 'sonner';
import { useMultiSourceSearch, SearchResult } from '@/hooks/useMultiSourceSearch';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

const MapExplorer = () => {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { search, results, aiSuggestions, isSearching, clearResults } = useMultiSourceSearch();

  const [viewState, setViewState] = useState({
    longitude: 31.2357,
    latitude: 30.0444,
    zoom: 10,
  });

  // Close results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reverse geocode using Mapbox
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=ar&types=address,place,locality,neighborhood`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    search(query);
    setShowResults(true);
  };

  const handleResultSelect = (result: SearchResult) => {
    const position = { lat: result.lat, lng: result.lng };
    setSelectedPosition(position);
    setSelectedAddress(result.address || result.name);
    setViewState({
      longitude: result.lng,
      latitude: result.lat,
      zoom: 15,
    });
    setSearchQuery(result.name);
    setShowResults(false);
    toast.success('تم تحديد الموقع');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    search(suggestion);
    setShowResults(true);
  };

  const handleMapClick = async (event: any) => {
    const { lngLat } = event;
    const position = { lat: lngLat.lat, lng: lngLat.lng };
    setSelectedPosition(position);
    
    const address = await reverseGeocode(position.lat, position.lng);
    setSelectedAddress(address);
    toast.success('تم تحديد الموقع');
  };

  const handleCopyCoordinates = () => {
    if (selectedPosition) {
      const coords = `${selectedPosition.lat}, ${selectedPosition.lng}`;
      navigator.clipboard.writeText(coords);
      toast.success('تم نسخ الإحداثيات');
    }
  };

  const handleCopyAddress = () => {
    if (selectedAddress) {
      navigator.clipboard.writeText(selectedAddress);
      toast.success('تم نسخ العنوان');
    }
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'local':
        return result.source === 'مصنع' ? Factory : Building2;
      case 'mapbox':
        return MapPinned;
      case 'ai':
        return Sparkles;
      default:
        return MapPin;
    }
  };

  const getResultBadgeColor = (result: SearchResult) => {
    switch (result.type) {
      case 'local':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'mapbox':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ai':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              الخريطة التفاعلية
            </h1>
            <p className="text-sm text-muted-foreground">
              ابحث عن أي موقع أو مصنع أو شركة - نتائج من مصادر متعددة
            </p>
          </div>
        </div>
        
        {/* Search Sources Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            ذكاء اصطناعي
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe className="w-3 h-3" />
            خرائط عالمية
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Factory className="w-3 h-3" />
            قاعدة بيانات محلية
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-4">
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="ابحث عن موقع، مصنع، منطقة صناعية، شركة..."
                className="pr-11 pl-11 h-12 text-base"
                dir="rtl"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
                {isSearching && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                {searchQuery && !isSearching && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSearchQuery('');
                      clearResults();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showResults && (results.length > 0 || aiSuggestions) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg overflow-hidden"
                >
                  <ScrollArea className="max-h-[350px]">
                    {/* AI Suggestions */}
                    {aiSuggestions && (
                      <div className="p-3 border-b bg-gradient-to-l from-purple-500/5 to-transparent">
                        <div className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
                          <Sparkles className="w-4 h-4" />
                          اقتراحات الذكاء الاصطناعي
                        </div>
                        
                        {aiSuggestions.correctedQuery && (
                          <button
                            className="w-full text-right p-2 rounded-md bg-purple-500/10 hover:bg-purple-500/20 transition-colors mb-2"
                            onClick={() => handleSuggestionClick(aiSuggestions.correctedQuery!)}
                          >
                            <span className="text-sm">هل تقصد: </span>
                            <span className="font-medium text-purple-600">{aiSuggestions.correctedQuery}</span>
                          </button>
                        )}
                        
                        {aiSuggestions.alternativeQueries.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.alternativeQueries.slice(0, 4).map((query, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleSuggestionClick(query)}
                              >
                                <Lightbulb className="w-3 h-3 ml-1" />
                                {query}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Search Results */}
                    {results.length > 0 && (
                      <div className="p-2">
                        {results.map((result) => {
                          const IconComponent = getResultIcon(result);
                          return (
                            <button
                              key={result.id}
                              type="button"
                              className="w-full px-3 py-2.5 text-right hover:bg-accent rounded-md transition-colors flex items-start gap-3"
                              onClick={() => handleResultSelect(result)}
                            >
                              <div className={cn(
                                'p-2 rounded-lg shrink-0 mt-0.5',
                                getResultBadgeColor(result)
                              )}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{result.name}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {result.address}
                                </p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {result.source}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {results.length === 0 && !aiSuggestions && !isSearching && searchQuery.length >= 2 && (
                      <div className="p-6 text-center text-muted-foreground">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>لم يتم العثور على نتائج</p>
                        <p className="text-sm mt-1">جرب البحث بكلمات مختلفة</p>
                      </div>
                    )}
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative" style={{ height: 'calc(100vh - 400px)', minHeight: '400px' }}>
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              onClick={handleMapClick}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
              locale={{ 
                'NavigationControl.ZoomIn': 'تكبير', 
                'NavigationControl.ZoomOut': 'تصغير', 
                'NavigationControl.ResetBearing': 'إعادة الاتجاه', 
                'GeolocateControl.FindMyLocation': 'موقعي', 
                'GeolocateControl.LocationNotAvailable': 'الموقع غير متاح' 
              }}
              onLoad={(e) => {
                const map = e.target;
                try {
                  map.setLayoutProperty('country-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('state-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('settlement-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('settlement-subdivision-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('airport-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('poi-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('road-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('natural-point-label', 'text-field', ['get', 'name_ar']);
                  map.setLayoutProperty('waterway-label', 'text-field', ['get', 'name_ar']);
                } catch {}
              }}
            >
              <NavigationControl position="bottom-right" />
              <GeolocateControl
                position="bottom-right"
                trackUserLocation
                showUserHeading
                onGeolocate={async (e) => {
                  const position = { lat: e.coords.latitude, lng: e.coords.longitude };
                  setSelectedPosition(position);
                  const address = await reverseGeocode(position.lat, position.lng);
                  setSelectedAddress(address);
                  toast.success('تم تحديد موقعك الحالي');
                }}
              />
              
              {selectedPosition && (
                <Marker
                  longitude={selectedPosition.lng}
                  latitude={selectedPosition.lat}
                  anchor="bottom"
                >
                  <motion.div
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8))',
                        border: '4px solid white',
                        borderRadius: '50% 50% 50% 0',
                        transform: 'rotate(-45deg)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                      }}
                    />
                  </motion.div>
                </Marker>
              )}
            </Map>
            
            {/* Map Attribution */}
            <Badge 
              variant="secondary" 
              className="absolute bottom-3 left-3 z-10 text-[10px] bg-background/80 backdrop-blur-sm"
            >
              © Mapbox
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Selected Location Info */}
      <AnimatePresence>
        {selectedPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Crosshair className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">الموقع المحدد</h3>
                    
                    {selectedAddress && (
                      <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg">
                        <p className="text-sm text-muted-foreground line-clamp-2">{selectedAddress}</p>
                        <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
                          نسخ
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-2 p-2 bg-background rounded-lg">
                      <p className="text-sm font-mono text-muted-foreground">
                        {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleCopyCoordinates}>
                        نسخ
                      </Button>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${selectedPosition.lat},${selectedPosition.lng}`,
                            '_blank'
                          );
                        }}
                      >
                        <Navigation className="w-4 h-4 ml-1" />
                        فتح في خرائط جوجل
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• نتائج البحث مدمجة من الذكاء الاصطناعي، خرائط Mapbox، وقاعدة بيانات محلية</p>
              <p>• قاعدة البيانات تشمل 50+ منطقة صناعية ومصنع في مصر</p>
              <p>• الذكاء الاصطناعي يقترح تصحيحات إملائية ومواقع بديلة</p>
              <p>• اضغط على أي نقطة على الخريطة لتحديد موقع يدوياً</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapExplorer;
