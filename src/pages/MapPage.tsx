import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import Header from "@/components/Header";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map, Search, Loader2, MapPin, Building2, Recycle, Truck, Factory, Sparkles, Navigation, Layers, History, Trash2, MousePointerClick, Save, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM, forwardGeocodeOSM, reverseGeocodeOSM } from '@/lib/leafletConfig';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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

interface SearchHistoryItem {
  id: string;
  search_query: string | null;
  result_name: string;
  result_address: string | null;
  latitude: number;
  longitude: number;
  search_type: string;
  confidence: string | null;
  source_model: string | null;
  created_at: string;
}

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, generators: 0, transporters: 0, recyclers: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [manualPickMode, setManualPickMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingManualPick, setPendingManualPick] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [manualPickName, setManualPickName] = useState('');
  const [mapMode, setMapMode] = useState<'leaflet' | 'waze'>('leaflet');
  const [wazeCenter, setWazeCenter] = useState({ lat: EGYPT_CENTER[0], lng: EGYPT_CENTER[1], zoom: DEFAULT_ZOOM });

  // Load search history
  const loadSearchHistory = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('map_search_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setSearchHistory((data as unknown as SearchHistoryItem[]) || []);
    } catch (e) {
      console.error(e);
    }
  }, [profile?.id]);

  useEffect(() => { loadSearchHistory(); }, [loadSearchHistory]);

  // Save to search history
  const saveToHistory = async (entry: {
    search_query?: string;
    result_name: string;
    result_address?: string;
    latitude: number;
    longitude: number;
    search_type: string;
    confidence?: string;
    source_model?: string;
  }) => {
    if (!profile?.id) return;
    try {
      await supabase.from('map_search_history').insert({
        user_id: profile.id,
        organization_id: profile.organization_id || null,
        search_query: entry.search_query || null,
        result_name: entry.result_name,
        result_address: entry.result_address || null,
        latitude: entry.latitude,
        longitude: entry.longitude,
        search_type: entry.search_type,
        confidence: entry.confidence || null,
        source_model: entry.source_model || null,
      });
      loadSearchHistory();
    } catch (e) {
      console.error('Error saving to history:', e);
    }
  };

  // Delete history item
  const deleteHistoryItem = async (id: string) => {
    try {
      await supabase.from('map_search_history').delete().eq('id', id);
      setSearchHistory(prev => prev.filter(h => h.id !== id));
      toast.success('تم حذف العنصر');
    } catch {
      toast.error('فشل في الحذف');
    }
  };

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
    const osmLayer = L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 });
    const osmHot = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { attribution: 'OSM HOT', maxZoom: 19 });
    const osmCycle = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', { attribution: 'CyclOSM', maxZoom: 19 });
    const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: 'CARTO', maxZoom: 20 });
    const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: 'CARTO', maxZoom: 20 });
    const cartoVoyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: 'CARTO', maxZoom: 20 });
    const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
    const esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
    const esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 19 });
    const esriNatGeo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri NatGeo', maxZoom: 16 });
    const esriGray = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri', maxZoom: 16 });
    const stamenTerrain = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png', { attribution: 'Stadia/Stamen', maxZoom: 18 });
    const stamenWatercolor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', { attribution: 'Stadia/Stamen', maxZoom: 16 });
    const stadiaSmooth = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', { attribution: 'Stadia', maxZoom: 20 });
    const stadiaSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', { attribution: 'Stadia', maxZoom: 20 });
    const stadiaSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg', { attribution: 'Stadia', maxZoom: 20 });
    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap', maxZoom: 17 });
    const googleStreets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { attribution: 'Google Maps', maxZoom: 20 });
    const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', { attribution: 'Google Satellite', maxZoom: 20 });
    const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: 'Google Hybrid', maxZoom: 20 });
    const googleTerrain = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', { attribution: 'Google Terrain', maxZoom: 20 });
    const hereNormal = L.tileLayer('https://1.base.maps.ls.hereapi.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?apiKey=demo', { attribution: 'HERE', maxZoom: 20 });
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

  // Manual pick mode - listen to map clicks
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      if (!manualPickMode) return;
      const { lat, lng } = e.latlng;
      
      // Reverse geocode
      const address = await reverseGeocodeOSM(lat, lng);
      
      // Place a marker
      const icon = L.divIcon({
        html: '<div style="background:#6366f1;width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">📌</div>',
        iconSize: [30, 30],
        className: '',
      });
      
      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<div dir="rtl" style="min-width:200px"><h4 style="font-weight:bold">📌 موقع محدد يدوياً</h4><p style="font-size:11px">${address}</p><p style="font-size:10px;color:#888">${lat.toFixed(6)}, ${lng.toFixed(6)}</p></div>`)
        .openPopup();

      setPendingManualPick({ lat, lng, address });
      setManualPickName(address.split(',')[0] || 'موقع محدد يدوياً');
      setManualPickMode(false);
      toast.info('📌 تم تحديد الموقع - أدخل اسمًا واحفظه في السجل');
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [manualPickMode]);

  // Save pending manual pick
  const saveManualPick = async () => {
    if (!pendingManualPick) return;
    await saveToHistory({
      result_name: manualPickName || 'موقع محدد يدوياً',
      result_address: pendingManualPick.address,
      latitude: pendingManualPick.lat,
      longitude: pendingManualPick.lng,
      search_type: 'manual',
    });
    toast.success('✅ تم حفظ الموقع في السجل');
    setPendingManualPick(null);
    setManualPickName('');
  };

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
        setWazeCenter({ lat: results[0].lat, lng: results[0].lng, zoom: 14 });
        L.marker([results[0].lat, results[0].lng]).addTo(mapInstanceRef.current)
          .bindPopup(`<div dir="rtl"><b>${results[0].name}</b><br/>${results[0].address}</div>`).openPopup();
        
        // Save to history
        await saveToHistory({
          search_query: searchQuery,
          result_name: results[0].name,
          result_address: results[0].address,
          latitude: results[0].lat,
          longitude: results[0].lng,
          search_type: 'osm',
        });
      } else {
        toast.error('لم يتم العثور على الموقع');
      }
    } finally {
      setSearching(false);
    }
  };

  const [aiResults, setAiResults] = useState<any[]>([]);
  const aiMarkersRef = useRef<L.LayerGroup | null>(null);

  // AI search
  const handleAISearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setAiSearching(true);
    setAiResults([]);
    
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
          const center = bounds.getCenter();
          setWazeCenter({ lat: center.lat, lng: center.lng, zoom: 14 });
        }
        
        // Save primary result to history
        const primaryLoc = locations.find((l: any) => l.is_primary) || locations[0];
        await saveToHistory({
          search_query: aiSearchQuery,
          result_name: primaryLoc.name,
          result_address: primaryLoc.address,
          latitude: primaryLoc.latitude,
          longitude: primaryLoc.longitude,
          search_type: 'ai',
          confidence: primaryLoc.confidence,
          source_model: primaryLoc.source_model,
        });

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
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.setView([latitude, longitude], 15);
        setWazeCenter({ lat: latitude, lng: longitude, zoom: 15 });
        L.marker([latitude, longitude]).addTo(mapInstanceRef.current!)
          .bindPopup('<div dir="rtl"><b>📍 موقعك الحالي</b></div>').openPopup();
        
        const address = await reverseGeocodeOSM(latitude, longitude);
        await saveToHistory({
          result_name: 'موقعي الحالي',
          result_address: address,
          latitude,
          longitude,
          search_type: 'gps',
        });
      },
      () => toast.error('فشل في تحديد الموقع')
    );
  };

  // Go to history item
  const goToHistoryItem = (item: SearchHistoryItem) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([item.latitude, item.longitude], 15);
    setWazeCenter({ lat: item.latitude, lng: item.longitude, zoom: 15 });
    
    const typeIcon = item.search_type === 'ai' ? '🤖' : item.search_type === 'manual' ? '📌' : item.search_type === 'gps' ? '📍' : '🔍';
    L.marker([item.latitude, item.longitude])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<div dir="rtl"><b>${typeIcon} ${item.result_name}</b><br/><span style="font-size:11px">${item.result_address || ''}</span></div>`)
      .openPopup();
  };

  const searchTypeLabel = (t: string) => {
    switch (t) {
      case 'ai': return '🤖 AI';
      case 'osm': return '🔍 بحث';
      case 'manual': return '📌 يدوي';
      case 'gps': return '📍 GPS';
      default: return t;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-4 pt-24 space-y-4">
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
            {/* Map mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                size="sm"
                variant={mapMode === 'leaflet' ? 'default' : 'ghost'}
                className="rounded-none gap-1"
                onClick={() => setMapMode('leaflet')}
              >
                <Map className="w-3 h-3" />
                خرائط تفاعلية
              </Button>
              <Button
                size="sm"
                variant={mapMode === 'waze' ? 'default' : 'ghost'}
                className="rounded-none gap-1"
                onClick={() => {
                  setMapMode('waze');
                  // Sync Waze center with current Leaflet view
                  if (mapInstanceRef.current) {
                    const c = mapInstanceRef.current.getCenter();
                    setWazeCenter({ lat: c.lat, lng: c.lng, zoom: mapInstanceRef.current.getZoom() });
                  }
                }}
              >
                <Navigation className="w-3 h-3" />
                Waze مباشرة
              </Button>
            </div>
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

        {/* Manual Pick + History Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            variant={manualPickMode ? 'default' : 'outline'}
            className="gap-1"
            onClick={() => {
              setManualPickMode(!manualPickMode);
              setPendingManualPick(null);
              if (!manualPickMode) toast.info('📌 انقر على الخريطة لتحديد الموقع');
            }}
          >
            <MousePointerClick className="w-4 h-4" />
            {manualPickMode ? 'إلغاء التحديد اليدوي' : 'تحديد يدوي على الخريطة'}
          </Button>

          <Button
            size="sm"
            variant={showHistory ? 'default' : 'outline'}
            className="gap-1"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4" />
            سجل البحث ({searchHistory.length})
          </Button>

          {/* Filters */}
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

        {/* Pending manual pick save */}
        {pendingManualPick && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex gap-2 items-center">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <Input
                  value={manualPickName}
                  onChange={e => setManualPickName(e.target.value)}
                  placeholder="اسم الموقع..."
                  className="flex-1"
                />
                <Button size="sm" onClick={saveManualPick} className="gap-1">
                  <Save className="w-4 h-4" />
                  حفظ في السجل
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingManualPick(null)}>
                  إلغاء
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mr-7">{pendingManualPick.address}</p>
            </CardContent>
          </Card>
        )}

        {/* Search History Panel */}
        {showHistory && (
          <Card>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                سجل عمليات البحث
              </h3>
              {searchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات بحث محفوظة بعد</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {searchHistory.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent/30 transition-colors text-xs">
                      <button
                        className="flex-1 text-right min-w-0"
                        onClick={() => goToHistoryItem(item)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] shrink-0">{searchTypeLabel(item.search_type)}</Badge>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.result_name}</p>
                            <p className="text-muted-foreground truncate">{item.result_address}</p>
                          </div>
                        </div>
                        {item.search_query && (
                          <p className="text-muted-foreground mt-0.5 truncate">بحث: "{item.search_query}"</p>
                        )}
                      </button>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(item.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => deleteHistoryItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual pick mode indicator */}
        {manualPickMode && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center text-sm font-medium text-primary animate-pulse">
            📌 وضع التحديد اليدوي مفعّل — انقر على أي مكان في الخريطة لتحديد الموقع
          </div>
        )}

        {/* Map */}
        <div className="relative">
          {loading && mapMode === 'leaflet' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {/* Leaflet Map */}
          <div 
            ref={mapRef} 
            className={`rounded-xl border shadow-sm ${manualPickMode ? 'border-primary cursor-crosshair' : 'border-border'}`} 
            style={{ height: '600px', display: mapMode === 'leaflet' ? 'block' : 'none' }} 
          />

          {/* Waze Live Map */}
          {mapMode === 'waze' && (
            <div className="rounded-xl border border-border shadow-sm overflow-hidden" style={{ height: '600px' }}>
              <div className="bg-muted/50 p-2 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Waze Live Map</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {wazeCenter.lat.toFixed(4)}, {wazeCenter.lng.toFixed(4)}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => window.open(`https://waze.com/ul?ll=${wazeCenter.lat},${wazeCenter.lng}&navigate=yes`, '_blank')}
                >
                  <ExternalLink className="w-3 h-3" />
                  فتح في Waze
                </Button>
              </div>
              <iframe
                src={`https://embed.waze.com/iframe?zoom=${wazeCenter.zoom}&lat=${wazeCenter.lat}&lon=${wazeCenter.lng}&pin=1`}
                width="100%"
                style={{ height: 'calc(100% - 40px)', border: 0 }}
                allowFullScreen
                title="Waze Live Map"
              />
            </div>
          )}
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
