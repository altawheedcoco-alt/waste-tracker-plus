import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl';
import type { SymbolLayout, SymbolPaint, CircleLayout, CirclePaint } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  MapPin, Crosshair, Info, Loader2, Sparkles, 
  Building2, Factory, Globe, Navigation, X, Search,
  Layers, Map as MapIcon, Satellite, Download, RefreshCw, Database,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import BackButton from '@/components/ui/back-button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import AILocationChat from '@/components/maps/AILocationChat';
import MapboxSearchBox, { SearchResultItem } from '@/components/maps/MapboxSearchBox';

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

interface IndustrialFacility {
  id: string;
  name: string;
  name_ar: string | null;
  facility_type: string;
  address: string | null;
  city: string | null;
  governorate: string | null;
  latitude: number;
  longitude: number;
  is_verified: boolean;
}

const MapExplorer = () => {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('streets');
  const [showFactoryMarkers, setShowFactoryMarkers] = useState(true);
  const [facilities, setFacilities] = useState<IndustrialFacility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isFetchingFromSource, setIsFetchingFromSource] = useState(false);
  const [fetchingSource, setFetchingSource] = useState<'google' | null>(null);
  const [facilitiesCount, setFacilitiesCount] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<MapRef>(null);

  const [viewState, setViewState] = useState({
    longitude: 31.2357,
    latitude: 30.0444,
    zoom: 10,
  });

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Default to Cairo
          setUserLocation({ lat: 30.0444, lng: 31.2357 });
        }
      );
    }
  }, []);

  // Handle AI location selection
  const handleAILocationSelect = useCallback((location: { name: string; lat: number; lng: number; address?: string }) => {
    setSelectedPosition({ lat: location.lat, lng: location.lng });
    setSelectedAddress(location.address || location.name);
    setViewState(prev => ({
      ...prev,
      longitude: location.lng,
      latitude: location.lat,
      zoom: 15,
    }));
  }, []);

  // جلب المنشآت من قاعدة البيانات
  const loadFacilities = useCallback(async () => {
    setIsLoadingFacilities(true);
    try {
      const { data, error, count } = await supabase
        .from('industrial_facilities')
        .select('*', { count: 'exact' })
        .order('is_verified', { ascending: false });
      
      if (error) throw error;
      setFacilities(data || []);
      setFacilitiesCount(count || 0);
    } catch (error) {
      console.error('Error loading facilities:', error);
      toast.error('فشل في تحميل المنشآت الصناعية');
    } finally {
      setIsLoadingFacilities(false);
    }
  }, []);

  // جلب المنشآت من Google Maps
  const fetchFromExternalSource = async () => {
    setIsFetchingFromSource(true);
    setFetchingSource('google');
    
    const sourceName = 'Google Maps';
    
    try {
      toast.info(`جاري جلب المنشآت الصناعية من ${sourceName}...`, { duration: 10000 });
      
      const { data, error } = await supabase.functions.invoke('fetch-industrial-facilities', {
        body: { source: 'google' }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message);
        // إعادة تحميل البيانات
        await loadFacilities();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(`Error fetching from ${sourceName}:`, error);
      toast.error(`فشل في جلب البيانات من ${sourceName}`);
    } finally {
      setIsFetchingFromSource(false);
      setFetchingSource(null);
    }
  };

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  // تحويل بيانات المنشآت إلى GeoJSON
  const industrialGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: facilities.map((facility) => ({
      type: 'Feature' as const,
      id: facility.id,
      properties: {
        name: facility.name_ar || facility.name,
        city: facility.city || '',
        governorate: facility.governorate || '',
        type: facility.facility_type,
        typeLabel: facility.facility_type === 'factory' ? 'مصنع' : 
                   facility.facility_type === 'zone' ? 'منطقة صناعية' : 
                   facility.facility_type === 'recycling' ? 'منشأة تدوير' :
                   facility.facility_type === 'workshop' ? 'ورشة' :
                   facility.facility_type === 'plant' ? 'مصنع كبير' : 'منشأة',
        isVerified: facility.is_verified,
        address: facility.address,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [facility.longitude, facility.latitude],
      },
    })),
  };

  // معالجة النقر على علامات المصانع
  const handleFactoryClick = useCallback((e: MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const coords = (feature.geometry as GeoJSON.Point).coordinates;
      const props = feature.properties;
      
      setSelectedPosition({ lat: coords[1], lng: coords[0] });
      const addressParts = [props?.name, props?.city, props?.governorate].filter(Boolean);
      setSelectedAddress(addressParts.join(' - '));
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

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: SearchResultItem) => {
    const position = { lat: result.lat, lng: result.lng };
    setSelectedPosition(position);
    setSelectedAddress(result.address || result.name);
    setViewState({
      longitude: result.lng,
      latitude: result.lat,
      zoom: 15,
    });
    toast.success('تم تحديد الموقع');
  }, []);

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
            <Database className="w-3 h-3" />
            {facilitiesCount} منشأة
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            ذكاء اصطناعي
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe className="w-3 h-3" />
            خرائط عالمية
          </Badge>
        </div>
      </div>

      {/* Mapbox Search Box */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <MapboxSearchBox
            onResultSelect={handleSearchResultSelect}
            placeholder="ابحث عن موقع، مصنع، سيارة، منطقة صناعية..."
            includeFactories={true}
            includeVehicles={true}
            includeMapbox={true}
            userLocation={userLocation}
          />

          {/* Actions Row */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="default"
                size="sm"
                onClick={() => fetchFromExternalSource()}
                disabled={isFetchingFromSource}
                className="gap-2"
              >
                {fetchingSource === 'google' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                جلب المنشآت الصناعية
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadFacilities}
                disabled={isLoadingFacilities}
                className="gap-2"
              >
                {isLoadingFacilities ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                تحديث
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {facilitiesCount > 0 ? (
                <>عدد المنشآت المحفوظة: <strong>{facilitiesCount}</strong></>
              ) : (
                'لا توجد منشآت محفوظة - اضغط على "جلب المنشآت الصناعية"'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Map and AI Chat Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <Card className={cn("overflow-hidden", showAIChat ? "lg:col-span-2" : "lg:col-span-3")}>
          <CardContent className="p-0">
            <div className="relative" style={{ height: 'calc(100vh - 450px)', minHeight: '400px' }}>
              {/* AI Chat Toggle Button */}
              <Button
                variant={showAIChat ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAIChat(!showAIChat)}
                className="absolute top-3 left-3 z-10 gap-1.5 shadow-lg bg-background/95 backdrop-blur-sm"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">مساعد الذكاء الاصطناعي</span>
              </Button>
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
                <span className="hidden sm:inline">المصانع ({facilitiesCount})</span>
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
              {showFactoryMarkers && facilities.length > 0 && (
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
                        'recycling', '#22c55e',
                        'workshop', '#f59e0b',
                        'plant', '#8b5cf6',
                        '#6b7280'
                      ],
                      'circle-stroke-width': [
                        'case',
                        ['get', 'isVerified'], 3,
                        2
                      ],
                      'circle-stroke-color': [
                        'case',
                        ['get', 'isVerified'], '#fbbf24',
                        '#ffffff'
                      ],
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
                        'recycling', '#15803d',
                        'workshop', '#b45309',
                        'plant', '#6d28d9',
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
            
            {/* Loading Overlay */}
            {isLoadingFacilities && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">جاري تحميل المنشآت...</p>
                </div>
              </div>
            )}
            
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

        {/* AI Chat Panel */}
        {showAIChat && (
          <div className="lg:col-span-1">
            <AILocationChat 
              onLocationSelect={handleAILocationSelect}
            />
          </div>
        )}
      </div>

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
                        <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
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
                    className="flex-1 min-w-[160px] gap-2 bg-primary hover:bg-primary/90"
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
              <Download className="w-4 h-4 text-primary" />
              اضغط "جلب المنشآت الصناعية" لتحميل كافة المنشآت الصناعية في مصر
            </li>
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
              المنشآت الموثقة تظهر بإطار ذهبي
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
