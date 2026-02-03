import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';
import type { SymbolLayout, SymbolPaint, CircleLayout, CirclePaint } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, Search, Crosshair, Info, Loader2, X, Sparkles, 
  Building2, Factory, MapPinned, Globe, Lightbulb, Navigation,
  Layers, Map as MapIcon, Satellite
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import BackButton from '@/components/ui/back-button';
import { toast } from 'sonner';
import { useMultiSourceSearch, SearchResult, EGYPTIAN_INDUSTRIAL_DATA } from '@/hooks/useMultiSourceSearch';
import { cn } from '@/lib/utils';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

// أنماط الخريطة المتاحة
const MAP_STYLES = {
  streets: {
    url: 'mapbox://styles/mapbox/streets-v12',
    label: 'شوارع',
    icon: MapIcon,
  },
  satellite: {
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    label: 'قمر صناعي',
    icon: Satellite,
  },
  outdoors: {
    url: 'mapbox://styles/mapbox/outdoors-v12',
    label: 'طبوغرافي',
    icon: Layers,
  },
} as const;

type MapStyleKey = keyof typeof MAP_STYLES;


// تحويل بيانات المصانع إلى GeoJSON
const industrialGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: EGYPTIAN_INDUSTRIAL_DATA.map((location, index) => ({
    type: 'Feature' as const,
    id: index,
    properties: {
      name: location.name,
      city: location.city,
      type: location.type,
      typeLabel: location.type === 'factory' ? 'مصنع' : location.type === 'zone' ? 'منطقة صناعية' : 'منشأة',
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [location.lng, location.lat],
    },
  })),
};

const MapExplorer = () => {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets');
  const [showFactoryMarkers, setShowFactoryMarkers] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  
  const { search, results, aiSuggestions, isSearching, clearResults } = useMultiSourceSearch();

  const [viewState, setViewState] = useState({
    longitude: 31.2357,
    latitude: 30.0444,
    zoom: 10,
  });

  // معالجة النقر على علامات المصانع
  const handleFactoryClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      const props = feature.properties;
      
      setSelectedPosition({ lat: coords[1], lng: coords[0] });
      setSelectedAddress(`${props?.name} - ${props?.city}`);
      setViewState(prev => ({
        ...prev,
        longitude: coords[0],
        latitude: coords[1],
        zoom: 14,
      }));
      toast.success('تم تحديد الموقع');
    }
  }, []);

  // إعداد تفاعلية الخريطة
  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // تغيير المؤشر عند المرور فوق المصانع
    map.on('mouseenter', 'industrial-circles', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'industrial-circles', () => {
      map.getCanvas().style.cursor = '';
    });
    
    // تعريب جميع التسميات على الخريطة
    const arabicLayers = [
      'country-label',
      'state-label', 
      'settlement-label',
      'settlement-subdivision-label',
      'settlement-minor-label',
      'airport-label',
      'poi-label',
      'transit-label',
      'road-label',
      'road-number-shield',
      'natural-point-label',
      'natural-line-label',
      'waterway-label',
      'water-point-label',
      'water-line-label',
      'place-city-label',
      'place-town-label',
      'place-village-label',
      'place-neighborhood-label'
    ];
    
    arabicLayers.forEach(layerId => {
      try {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'text-field', ['coalesce', ['get', 'name_ar'], ['get', 'name']]);
        }
      } catch {}
    });
  }, []);

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
            {/* Map Style Switcher */}
            <div className="absolute top-3 right-3 z-10 flex flex-col sm:flex-row gap-2">
              <ToggleGroup 
                type="single" 
                value={mapStyle} 
                onValueChange={(value) => value && setMapStyle(value as MapStyleKey)}
                className="bg-background/95 backdrop-blur-sm shadow-lg rounded-lg border p-1"
              >
                {Object.entries(MAP_STYLES).map(([key, style]) => {
                  const IconComponent = style.icon;
                  return (
                    <ToggleGroupItem
                      key={key}
                      value={key}
                      aria-label={style.label}
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-3 py-2 gap-1.5"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-xs hidden sm:inline">{style.label}</span>
                    </ToggleGroupItem>
                  );
                })}
              </ToggleGroup>
              
              {/* Toggle Factory Markers */}
              <Button
                variant={showFactoryMarkers ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFactoryMarkers(!showFactoryMarkers)}
                className="gap-1.5 shadow-lg bg-background/95 backdrop-blur-sm"
              >
                <Factory className="w-4 h-4" />
                <span className="hidden sm:inline">المصانع</span>
              </Button>
            </div>
            
            <Map
              ref={mapRef}
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              onClick={(e) => {
                // التحقق من النقر على المصانع
                const features = e.features;
                if (features && features.length > 0 && features[0].layer?.id === 'industrial-circles') {
                  handleFactoryClick(e);
                } else {
                  handleMapClick(e);
                }
              }}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle={MAP_STYLES[mapStyle].url}
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
              interactiveLayerIds={showFactoryMarkers ? ['industrial-circles'] : []}
              locale={{ 
                'NavigationControl.ZoomIn': 'تكبير', 
                'NavigationControl.ZoomOut': 'تصغير', 
                'NavigationControl.ResetBearing': 'إعادة الاتجاه', 
                'GeolocateControl.FindMyLocation': 'موقعي', 
                'GeolocateControl.LocationNotAvailable': 'الموقع غير متاح' 
              }}
              onLoad={onMapLoad}
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
              
              {/* GeoJSON Source للمصانع والمناطق الصناعية */}
              {showFactoryMarkers && (
                <Source id="industrial-data" type="geojson" data={industrialGeoJSON}>
                  {/* طبقة الدوائر (الأيقونات) */}
                  <Layer
                    id="industrial-circles"
                    type="circle"
                    paint={{
                      'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 6,
                        12, 10,
                        16, 14
                      ],
                      'circle-color': [
                        'match', ['get', 'type'],
                        'factory', '#ef4444',
                        'zone', '#3b82f6',
                        'facility', '#22c55e',
                        '#6b7280'
                      ],
                      'circle-stroke-width': 2,
                      'circle-stroke-color': '#ffffff',
                      'circle-opacity': 0.9,
                    }}
                  />
                  
                  {/* طبقة النصوص (أسماء المصانع) */}
                  <Layer
                    id="industrial-labels"
                    type="symbol"
                    layout={{
                      'text-field': ['get', 'name'],
                      'text-font': ['Noto Sans Arabic Regular', 'Arial Unicode MS Regular'],
                      'text-size': [
                        'interpolate', ['linear'], ['zoom'],
                        8, 10,
                        12, 12,
                        16, 14
                      ],
                      'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
                      'text-radial-offset': 0.5,
                      'text-justify': 'auto',
                      'text-allow-overlap': true,
                      'text-ignore-placement': false,
                      'text-max-width': 12,
                      'icon-allow-overlap': true,
                    } as SymbolLayout}
                    paint={{
                      'text-color': [
                        'match', ['get', 'type'],
                        'factory', '#b91c1c',
                        'zone', '#1d4ed8',
                        'facility', '#15803d',
                        '#374151'
                      ],
                      'text-halo-color': 'rgba(255, 255, 255, 0.95)',
                      'text-halo-width': 2,
                      'text-halo-blur': 0.5,
                    } as SymbolPaint}
                  />
                </Source>
              )}
              
              {/* Selected Position Marker */}
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
            <Card className="bg-gradient-to-l from-primary/10 to-primary/5 border-primary/30 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2.5 bg-primary rounded-xl shadow-md">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <span>الموقع المحدد</span>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">
                      تم تحديد الموقع بنجاح - يمكنك نسخ البيانات أو فتحه في خرائط جوجل
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                {selectedAddress && (
                  <div className="p-4 bg-background rounded-xl border shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <MapPinned className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">العنوان</p>
                          <p className="text-sm leading-relaxed">{selectedAddress}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyAddress}
                        className="shrink-0"
                      >
                        نسخ العنوان
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Coordinates */}
                <div className="p-4 bg-background rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Crosshair className="w-5 h-5 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">الإحداثيات</p>
                        <p className="text-sm font-mono" dir="ltr">
                          {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyCoordinates}
                      className="shrink-0"
                    >
                      نسخ الإحداثيات
                    </Button>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button 
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPosition.lat},${selectedPosition.lng}&travelmode=driving`;
                      window.open(url, '_blank');
                      toast.success('جاري فتح الملاحة...');
                    }}
                    className="flex-1 min-w-[160px] gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Navigation className="w-4 h-4" />
                    الذهاب إليه (ملاحة)
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${selectedPosition.lat},${selectedPosition.lng}`;
                      window.open(url, '_blank');
                    }}
                    className="flex-1 min-w-[140px] gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    عرض على الخريطة
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      const data = {
                        lat: selectedPosition.lat,
                        lng: selectedPosition.lng,
                        address: selectedAddress
                      };
                      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                      toast.success('تم نسخ بيانات الموقع الكاملة');
                    }}
                    className="flex-1 min-w-[140px] gap-2"
                  >
                    <Crosshair className="w-4 h-4" />
                    نسخ البيانات الكاملة
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedPosition(null);
                      setSelectedAddress('');
                      toast.info('تم إلغاء تحديد الموقع');
                    }}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    إلغاء التحديد
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            نصائح الاستخدام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              ابحث عن أي موقع باللغة العربية أو الإنجليزية
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              اضغط على الخريطة مباشرة لتحديد موقع
            </li>
            <li className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-primary" />
              نتائج البحث تشمل المصانع والمناطق الصناعية في مصر
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              الذكاء الاصطناعي يساعدك في تصحيح الأخطاء الإملائية
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapExplorer;
