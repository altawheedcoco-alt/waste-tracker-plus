import L from 'leaflet';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Loader2, 
  Building2, Factory, Globe, X,
  Layers, Map as MapIcon, Satellite, Download, RefreshCw, Database,
  Copy, ExternalLink, ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import BackButton from '@/components/ui/back-button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import GoogleMapComponent from '@/components/maps/LeafletMapComponent';
import GoogleMapsSearchBox, { type LeafletSearchResult } from '@/components/maps/LeafletSearchBox';

// أنماط الخريطة المتاحة (Google Maps)
const MAP_STYLES = {
  roadmap: { label: 'شوارع', icon: MapIcon },
  satellite: { label: 'قمر صناعي', icon: Satellite },
  hybrid: { label: 'هجين', icon: Layers },
  terrain: { label: 'طبوغرافي', icon: Globe },
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
  const isLoaded = true; // Leaflet is always loaded
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('roadmap');
  const [showFactoryMarkers, setShowFactoryMarkers] = useState(true);
  const [facilities, setFacilities] = useState<IndustrialFacility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isFetchingFromSource, setIsFetchingFromSource] = useState(false);
  const [facilitiesCount, setFacilitiesCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 30.0444, lng: 31.2357 });
  const [mapZoom, setMapZoom] = useState(10);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<LeafletSearchResult[]>([]);

  const handleSearchResults = useCallback((results: LeafletSearchResult[]) => {
    setSearchResults(results);
    if (results.length > 0) setSidebarOpen(true);
  }, []);

  const getResultIcon = (result: LeafletSearchResult) => {
    if (result.type === 'local') {
      if (result.category === 'industrial') return <Factory className="h-4 w-4" />;
      return <Building2 className="h-4 w-4" />;
    }
    if (result.type === 'multi') return <Globe className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const getSourceLabel = (result: LeafletSearchResult) => {
    if (result.type === 'local') return 'محلي';
    if (result.source === 'here' || result.source === 'herewego') return 'HERE';
    if (result.source === 'mapbox') return 'Mapbox';
    if (result.source === 'tomtom') return 'TomTom';
    if (result.source === 'photon' || result.source === 'mapsme') return 'OSM';
    return result.source || null;
  };

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => {
          setUserLocation({ lat: 30.0444, lng: 31.2357 });
        }
      );
    }
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
    
    try {
      toast.info('جاري جلب المنشآت الصناعية من Google Maps...', { duration: 10000 });
      
      const { data, error } = await supabase.functions.invoke('fetch-industrial-facilities', {
        body: { source: 'google' }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(data.message);
        await loadFacilities();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching from Google:', error);
      toast.error('فشل في جلب البيانات من Google Maps');
    } finally {
      setIsFetchingFromSource(false);
    }
  };

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  // Update markers when facilities change
  useEffect(() => {
    if (!mapInstanceRef.current || !showFactoryMarkers) {
      markersLayerRef.current?.clearLayers();
      return;
    }

    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
    markersLayerRef.current.clearLayers();

    facilities.forEach(facility => {
      const color = facility.is_verified ? '#22c55e' : '#3b82f6';
      const icon = L.divIcon({
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        className: '', iconSize: [16, 16], iconAnchor: [8, 8],
      });
      const marker = L.marker([facility.latitude, facility.longitude], { icon })
        .bindPopup(`<div dir="rtl"><b>${facility.name_ar || facility.name}</b><br/>${facility.city || ''}</div>`);
      marker.on('click', () => {
        setSelectedPosition({ lat: facility.latitude, lng: facility.longitude });
        setSelectedAddress(`${facility.name_ar || facility.name} - ${facility.city || ''} - ${facility.governorate || ''}`);
      });
      markersLayerRef.current!.addLayer(marker);
    });
  }, [facilities, showFactoryMarkers]);

  // Handle map load
  const handleMapLoad = (map: L.Map) => {
    mapInstanceRef.current = map;
  };

  // Map style not applicable for OSM tiles
  useEffect(() => {}, [mapStyle]);

  // Handle position select from map
  const handlePositionSelect = async (position: { lat: number; lng: number }, address?: string) => {
    setSelectedPosition(position);
    setSelectedAddress(address || `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
    toast.success('تم تحديد الموقع');
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: {
    position: { lat: number; lng: number };
    address: string;
    name: string;
  }) => {
    setSelectedPosition(result.position);
    setSelectedAddress(result.address);
    setMapCenter(result.position);
    setMapZoom(15);
    toast.success('تم تحديد الموقع');
  };

  const handleCopyCoordinates = () => {
    if (selectedPosition) {
      const coords = `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}`;
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

  const openInGoogleMaps = () => {
    if (selectedPosition) {
      const url = `https://www.google.com/maps?q=${selectedPosition.lat},${selectedPosition.lng}`;
      window.open(url, '_blank');
    }
  };

  if (false) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>فشل تحميل الخريطة</p>
        </div>
      </div>
    );
  }

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
              ابحث عن أي موقع أو مصنع أو شركة في مصر
            </p>
          </div>
        </div>
        
        {/* Search Sources Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Database className="w-3 h-3" />
            {facilitiesCount} منشأة
          </Badge>
          <Badge variant="default" className="gap-1 bg-destructive">
            <Globe className="w-3 h-3" />
            Google Maps
          </Badge>
        </div>
      </div>

      {/* Search Box */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <GoogleMapsSearchBox
            onSelect={handleSearchResultSelect}
            onResultsChange={handleSearchResults}
            placeholder="ابحث عن موقع، مصنع، منطقة صناعية..."
            showLocalResults={true}
          />

          {/* Actions Row */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="default"
                size="sm"
                onClick={fetchFromExternalSource}
                disabled={isFetchingFromSource}
                className="gap-2"
              >
                {isFetchingFromSource ? (
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
                'لا توجد منشآت محفوظة'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Map + Sidebar */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex relative" style={{ height: 'calc(100vh - 450px)', minHeight: '400px' }} dir="rtl">
            
            {/* Results Sidebar */}
            <AnimatePresence>
              {sidebarOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="h-full border-l bg-background flex-shrink-0 overflow-hidden relative z-20"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">نتائج البحث</span>
                      <Badge variant="secondary" className="text-xs">{searchResults.length}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[calc(100%-41px)]">
                    {searchResults.map((r) => {
                      const sourceLabel = getSourceLabel(r);
                      const isSelected = selectedPosition?.lat === r.position.lat && selectedPosition?.lng === r.position.lng;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`w-full px-3 py-3 text-right border-b border-border/50 hover:bg-accent/60 transition-colors flex items-start gap-3 ${isSelected ? 'bg-primary/10 border-r-2 border-r-primary' : ''}`}
                          onClick={() => {
                            handleSearchResultSelect({ position: r.position, address: r.address, name: r.name });
                          }}
                        >
                          <div className="text-primary flex-shrink-0 mt-0.5">{getResultIcon(r)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium truncate">{r.name}</p>
                              {sourceLabel && <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">{sourceLabel}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.address}</p>
                            <p className="text-[10px] text-muted-foreground/60 font-mono mt-1" dir="ltr">
                              {r.position.lat.toFixed(4)}, {r.position.lng.toFixed(4)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar Toggle (when closed) */}
            {!sidebarOpen && searchResults.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="absolute top-3 right-3 z-20 gap-1.5 shadow-lg"
              >
                <Search className="w-4 h-4" />
                النتائج ({searchResults.length})
                <ChevronLeft className="w-3 h-3" />
              </Button>
            )}

            {/* Map Area */}
            <div className="flex-1 relative h-full" dir="ltr">
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

              {/* Map Component */}
              <GoogleMapComponent
                center={mapCenter}
                zoom={mapZoom}
                selectedPosition={selectedPosition}
                onPositionSelect={handlePositionSelect}
                onMapLoad={handleMapLoad}
                height="100%"
                clickable={true}
              />

              {/* Selected Location Info */}
              <AnimatePresence>
                {selectedPosition && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-10"
                  >
                    <Card className="shadow-xl border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            الموقع المحدد
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setSelectedPosition(null);
                              setSelectedAddress('');
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedAddress && (
                          <div className="text-sm">
                            <p className="text-muted-foreground mb-1">العنوان:</p>
                            <p className="font-medium leading-relaxed">{selectedAddress}</p>
                          </div>
                        )}
                        
                        <div className="text-sm">
                          <p className="text-muted-foreground mb-1">الإحداثيات:</p>
                          <p className="font-mono text-xs" dir="ltr">
                            {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={handleCopyCoordinates} className="gap-1.5 flex-1">
                            <Copy className="w-3 h-3" />
                            نسخ الإحداثيات
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCopyAddress} className="gap-1.5 flex-1">
                            <Copy className="w-3 h-3" />
                            نسخ العنوان
                          </Button>
                        </div>

                        <Button size="sm" variant="default" onClick={openInGoogleMaps} className="w-full gap-2">
                          <ExternalLink className="w-4 h-4" />
                          فتح في خرائط جوجل
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapExplorer;
