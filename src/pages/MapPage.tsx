import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import Header from "@/components/Header";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Search, Loader2, MapPin, Building2, Recycle, Truck, Factory, Sparkles, Navigation, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM, forwardGeocodeOSM } from '@/lib/leafletConfig';
import { toast } from 'sonner';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const ORG_ICONS: Record<string, { color: string; icon: string; label: string }> = {
  generator: { color: '#f59e0b', icon: 'G', label: 'مولد نفايات' },
  transporter: { color: '#3b82f6', icon: 'T', label: 'ناقل' },
  recycler: { color: '#22c55e', icon: 'R', label: 'مدوّر' },
  disposal: { color: '#ef4444', icon: 'D', label: 'تخلص نهائي' },
  transport_office: { color: '#8b5cf6', icon: 'O', label: 'مكتب نقل' },
  consultant: { color: '#06b6d4', icon: 'C', label: 'استشاري' },
  iso_body: { color: '#ec4899', icon: 'I', label: 'جهة أيزو' },
};

const createOrgIcon = (type: string) => {
  const config = ORG_ICONS[type] || { color: '#6b7280', icon: '?', label: 'أخرى' };
  return L.divIcon({
    html: `<div style="background:${config.color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">${config.icon}</div>`,
    iconSize: [28, 28],
    className: '',
  });
};

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, generators: 0, transporters: 0, recyclers: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);

  // Load organizations with locations
  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type, address, city, region, latitude, longitude, is_verified')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      const orgsData = (data || []).filter((o: any) => o.latitude && o.longitude);
      setOrgs(orgsData);
      
      setStats({
        total: orgsData.length,
        generators: orgsData.filter((o: any) => o.organization_type === 'generator').length,
        transporters: orgsData.filter((o: any) => o.organization_type === 'transporter').length,
        recyclers: orgsData.filter((o: any) => o.organization_type === 'recycler').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) mapInstanceRef.current.remove();

    const map = L.map(mapRef.current, { zoomControl: true }).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    
    // === All available tile layers ===
    // OpenStreetMap variants
    const osmLayer = L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 });
    const osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { attribution: 'OSM HOT', maxZoom: 19 });
    const osmCycle = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', { attribution: 'CyclOSM', maxZoom: 19 });
    
    // CARTO
    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: 'CARTO', maxZoom: 20 });
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'CARTO', maxZoom: 20 });
    const cartoVoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: 'CARTO', maxZoom: 20 });
    
    // Esri
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
    const esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
    const esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
    const esriNatGeo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri NatGeo', maxZoom: 16 });
    const esriGray = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 16 });
    
    // Stadia / Stamen
    const stamenTerrain = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', { attribution: 'Stadia/Stamen', maxZoom: 18 });
    const stamenWatercolor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', { attribution: 'Stadia/Stamen', maxZoom: 16 });
    const stadiaSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', { attribution: 'Stadia', maxZoom: 20 });
    const stadiaSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', { attribution: 'Stadia', maxZoom: 20 });
    const stadiaSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg', { attribution: 'Stadia', maxZoom: 20 });
    
    // OpenTopoMap
    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap', maxZoom: 17 });
    
    // Google Maps (raster tiles)
    const googleStreets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { attribution: 'Google Maps', maxZoom: 20 });
    const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { attribution: 'Google Satellite', maxZoom: 20 });
    const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: 'Google Hybrid', maxZoom: 20 });
    const googleTerrain = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', { attribution: 'Google Terrain', maxZoom: 20 });
    
    // HERE Maps
    const hereNormal = L.tileLayer('https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=demo', { attribution: 'HERE', maxZoom: 20 });
    
    // Waze-style (via Google traffic)
    const googleTraffic = L.tileLayer('https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', { attribution: 'Google Traffic', maxZoom: 20 });

    osmLayer.addTo(map);
    L.control.layers({
      '🗺️ OSM عادية': osmLayer,
      '🔥 OSM إنسانية (HOT)': osmHot,
      '🚲 OSM دراجات': osmCycle,
      '☀️ CARTO فاتحة': cartoLight,
      '🌙 CARTO داكنة': cartoDark,
      '🧭 CARTO Voyager': cartoVoyager,
      '🛰️ Esri أقمار صناعية': esriSatellite,
      '🗻 Esri طبوغرافية': esriTopo,
      '🏙️ Esri شوارع': esriStreet,
      '🌍 Esri NatGeo': esriNatGeo,
      '⬜ Esri رمادية': esriGray,
      '🏞️ Stamen تضاريس': stamenTerrain,
      '🎨 Stamen ألوان مائية': stamenWatercolor,
      '✨ Stadia ناعمة': stadiaSmooth,
      '🌑 Stadia ناعمة داكنة': stadiaSmoothDark,
      '📡 Stadia أقمار': stadiaSatellite,
      '🏔️ OpenTopoMap': topoLayer,
      '🟢 Google شوارع': googleStreets,
      '🛰️ Google أقمار صناعية': googleSatellite,
      '🗺️ Google هجين': googleHybrid,
      '⛰️ Google تضاريس': googleTerrain,
      '🚦 Google حركة مرور': googleTraffic,
      '🔵 HERE خرائط': hereNormal,
    }, {}, { position: 'topright', collapsed: true }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Render markers when orgs or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const filtered = activeFilters.length > 0
      ? orgs.filter(o => activeFilters.includes(o.organization_type))
      : orgs;

    filtered.forEach(org => {
      const marker = L.marker([org.latitude, org.longitude], { icon: createOrgIcon(org.organization_type) })
        .bindPopup(`
          <div dir="rtl" style="min-width:180px">
            <h4 style="font-weight:bold;margin-bottom:4px">${org.name}</h4>
            <p style="font-size:11px;color:#666;margin-bottom:4px">${ORG_ICONS[org.organization_type]?.label || org.organization_type}</p>
            ${org.address ? `<p style="font-size:11px">${org.address}</p>` : ''}
            ${org.city ? `<p style="font-size:11px">${org.city}${org.region ? ` - ${org.region}` : ''}</p>` : ''}
            ${org.is_verified ? '<span style="color:#22c55e;font-size:10px">✅ موثق</span>' : ''}
          </div>
        `);
      marker.addTo(markersLayerRef.current!);
    });
  }, [orgs, activeFilters]);

  // Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await forwardGeocodeOSM(searchQuery);
      if (results.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.setView([results[0].lat, results[0].lng], 14);
        L.marker([results[0].lat, results[0].lng]).addTo(mapInstanceRef.current)
          .bindPopup(`<div dir="rtl"><b>${results[0].name}</b><br/>${results[0].address}</div>`).openPopup();
      } else {
        toast.error('لم يتم العثور على الموقع');
      }
    } finally {
      setSearching(false);
    }
  };

  const [aiResults, setAiResults] = useState<any[]>([]);
  const aiMarkersRef = useRef<L.LayerGroup | null>(null);

  // AI search - show ALL results
  const handleAISearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setAiSearching(true);
    setAiResults([]);
    
    // Clear previous AI markers
    if (aiMarkersRef.current) aiMarkersRef.current.clearLayers();
    if (!aiMarkersRef.current && mapInstanceRef.current) {
      aiMarkersRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-location-resolve', {
        body: { query: aiSearchQuery },
      });
      if (error) throw error;
      
      const locations = data?.all_locations || [];
      if (locations.length === 0 && data?.location) {
        locations.push({ ...data.location, is_primary: true });
      }

      if (locations.length > 0 && mapInstanceRef.current) {
        setAiResults(locations);
        const bounds = L.latLngBounds([]);

        locations.forEach((loc: any, idx: number) => {
          const isPrimary = loc.is_primary;
          const confidenceColor = loc.confidence === 'high' ? '#22c55e' : loc.confidence === 'medium' ? '#f59e0b' : '#ef4444';
          
          const icon = L.divIcon({
            html: `<div style="background:${isPrimary ? '#6366f1' : '#8b5cf6'};width:${isPrimary ? 34 : 28}px;height:${isPrimary ? 34 : 28}px;border-radius:50%;border:3px solid ${confidenceColor};box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${isPrimary ? 14 : 11}px;">${idx + 1}</div>`,
            iconSize: [isPrimary ? 34 : 28, isPrimary ? 34 : 28],
            className: '',
          });

          const marker = L.marker([loc.latitude, loc.longitude], { icon })
            .bindPopup(`
              <div dir="rtl" style="min-width:220px">
                <h4 style="font-weight:bold;margin-bottom:4px">🤖 ${loc.name}</h4>
                <p style="font-size:11px;color:#666;margin-bottom:2px">${loc.address}</p>
                ${loc.governorate ? `<p style="font-size:11px;color:#888">📍 ${loc.governorate}</p>` : ''}
                ${loc.location_type ? `<p style="font-size:10px;color:#888">🏷️ ${loc.location_type}</p>` : ''}
                <p style="font-size:10px;margin-top:4px">
                  <span style="color:${confidenceColor};font-weight:bold">
                    ${loc.confidence === 'high' ? '✅ دقة عالية' : loc.confidence === 'medium' ? '⚠️ دقة متوسطة' : '❓ تقدير تقريبي'}
                  </span>
                  ${isPrimary ? ' — <b>النتيجة الرئيسية</b>' : ''}
                </p>
                ${loc.source_model ? `<p style="font-size:9px;color:#aaa;margin-top:2px">🧠 ${loc.source_model}</p>` : ''}
              </div>
            `);
          
          marker.addTo(aiMarkersRef.current!);
          bounds.extend([loc.latitude, loc.longitude]);
        });

        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
        
        // Open primary marker popup
        const primaryLoc = locations.find((l: any) => l.is_primary) || locations[0];
        const modelsCount = data?.models_used?.length || 1;
        const rawCount = data?.total_raw_results || locations.length;
        toast.success(`🤖 ${locations.length} نتيجة فريدة (من ${rawCount} نتيجة عبر ${modelsCount} نماذج AI)`);
      } else {
        toast.error('لم يتم العثور على نتائج');
      }
    } catch {
      toast.error('فشل في البحث الذكي');
    } finally {
      setAiSearching(false);
    }
  };

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]);
  };

  // Locate me
  const locateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 15);
        L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(mapInstanceRef.current!)
          .bindPopup('<div dir="rtl"><b>📍 موقعك الحالي</b></div>').openPopup();
      },
      () => toast.error('فشل في تحديد الموقع')
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Map className="w-7 h-7 text-primary" />
              خريطة المجتمع التفاعلية
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              اكتشف المنظمات والجهات المسجلة على المنصة على الخريطة
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1"><Building2 className="w-3 h-3" />{stats.total} جهة</Badge>
            <Badge className="bg-amber-500/10 text-amber-600 gap-1"><Factory className="w-3 h-3" />{stats.generators} مولد</Badge>
            <Badge className="bg-blue-500/10 text-blue-600 gap-1"><Truck className="w-3 h-3" />{stats.transporters} ناقل</Badge>
            <Badge className="bg-green-500/10 text-green-600 gap-1"><Recycle className="w-3 h-3" />{stats.recyclers} مدوّر</Badge>
          </div>
        </div>

        {/* Search Bars */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* AI Search */}
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Input
                  value={aiSearchQuery}
                  onChange={e => setAiSearchQuery(e.target.value)}
                  placeholder="🤖 بحث ذكي: المنطقة الصناعية بالعاشر، مصنع الحديد..."
                  onKeyDown={e => e.key === 'Enter' && handleAISearch()}
                />
                <Button size="sm" onClick={handleAISearch} disabled={aiSearching} className="gap-1">
                  {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI
                </Button>
              </div>
              {/* AI Results List */}
              {aiResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">🤖 {aiResults.length} نتيجة:</p>
                  {aiResults.map((loc: any, idx: number) => (
                    <button
                      key={idx}
                      className={`w-full text-right p-2 rounded-md text-xs border transition-colors hover:bg-accent/50 ${loc.is_primary ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.setView([loc.latitude, loc.longitude], 16);
                          // Open popup of this marker
                          aiMarkersRef.current?.eachLayer((layer: any) => {
                            if (layer.getLatLng && 
                                Math.abs(layer.getLatLng().lat - loc.latitude) < 0.0001 && 
                                Math.abs(layer.getLatLng().lng - loc.longitude) < 0.0001) {
                              layer.openPopup();
                            }
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{loc.name}</p>
                          <p className="text-muted-foreground truncate">{loc.address}</p>
                        </div>
                        <span className={`text-[10px] shrink-0 ${loc.confidence === 'high' ? 'text-emerald-500' : loc.confidence === 'medium' ? 'text-amber-500' : 'text-destructive'}`}>
                          {loc.confidence === 'high' ? '✅' : loc.confidence === 'medium' ? '⚠️' : '❓'}
                        </span>
                      </div>
                    </button>
                  ))}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full text-xs" 
                    onClick={() => { setAiResults([]); aiMarkersRef.current?.clearLayers(); }}
                  >
                    مسح النتائج
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regular Search */}
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 بحث عادي: القاهرة، الإسكندرية، أسيوط..."
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching} className="gap-1">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  بحث
                </Button>
                <Button size="sm" variant="outline" onClick={locateMe} title="موقعي">
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ORG_ICONS).map(([type, config]) => (
            <Button
              key={type}
              size="sm"
              variant={activeFilters.includes(type) ? 'default' : 'outline'}
              className="gap-1 text-xs"
              onClick={() => toggleFilter(type)}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: config.color }} />
              {config.label}
            </Button>
          ))}
          {activeFilters.length > 0 && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveFilters([])}>
              إظهار الكل
            </Button>
          )}
        </div>

        {/* Map */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapRef} className="rounded-xl border border-border shadow-sm" style={{ height: '600px' }} />
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              دليل الرموز
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(ORG_ICONS).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: config.color }}>
                    {config.icon}
                  </div>
                  <span className="text-xs">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapPage;
