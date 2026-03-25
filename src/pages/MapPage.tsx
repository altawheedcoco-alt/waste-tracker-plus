import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import Header from "@/components/Header";
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Map, Search, Loader2, MapPin, Building2, Recycle, Truck, Factory,
  Sparkles, History, Trash2, MousePointerClick, Save, Navigation,
  Copy, ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM, forwardGeocodeOSM, reverseGeocodeOSM } from '@/lib/leafletConfig';
import { toast } from 'sonner';
import { OpenLocationCode } from 'open-location-code';
import { useAuth } from '@/contexts/AuthContext';
import PageNavBar from '@/components/ui/page-nav-bar';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

/* ─── Organization marker config ─── */
const ORG_ICONS: Record<string, { color: string; icon: string; label: string }> = {
  generator:        { color: '#f59e0b', icon: 'G', label: 'مولد نفايات' },
  transporter:      { color: '#3b82f6', icon: 'T', label: 'ناقل' },
  recycler:         { color: '#22c55e', icon: 'R', label: 'مدوّر' },
  disposal:         { color: '#ef4444', icon: 'D', label: 'تخلص نهائي' },
  transport_office: { color: '#8b5cf6', icon: 'O', label: 'مكتب نقل' },
  consultant:       { color: '#06b6d4', icon: 'C', label: 'استشاري' },
  iso_body:         { color: '#ec4899', icon: 'I', label: 'جهة أيزو' },
};

const createOrgIcon = (type: string) => {
  const c = ORG_ICONS[type] || { color: '#6b7280', icon: '?', label: 'أخرى' };
  return L.divIcon({
    html: `<div style="background:${c.color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">${c.icon}</div>`,
    iconSize: [28, 28], className: '',
  });
};

/* ─── Popup builder helpers ─── */
const buildLocationPopup = (title: string, address: string, lat: number, lng: number, plusCode: string) => `
  <div dir="rtl" style="min-width:260px;font-family:Cairo,sans-serif">
    <h4 style="font-weight:bold;margin-bottom:8px;font-size:14px">${title}</h4>
    <div style="background:#f8fafc;padding:8px;border-radius:8px;margin-bottom:6px">
      <p style="font-size:12px;font-weight:600;margin-bottom:4px">📍 العنوان:</p>
      <p style="font-size:11px;color:#444;line-height:1.5">${address}</p>
    </div>
    <div style="background:#f0fdf4;padding:8px;border-radius:8px;margin-bottom:6px">
      <p style="font-size:12px;font-weight:600;margin-bottom:4px">🔢 الإحداثيات:</p>
      <div style="font-family:monospace;font-size:13px;direction:ltr;text-align:center;user-select:all;cursor:text;background:white;padding:4px 8px;border-radius:4px;border:1px solid #d1fae5">
        ${lat.toFixed(6)}, ${lng.toFixed(6)}
      </div>
    </div>
    <div style="background:#eff6ff;padding:8px;border-radius:8px;margin-bottom:6px">
      <p style="font-size:12px;font-weight:600;margin-bottom:4px">📎 كود بلس:</p>
      <div style="font-family:monospace;font-size:13px;direction:ltr;text-align:center;user-select:all;cursor:text;background:white;padding:4px 8px;border-radius:4px;border:1px solid #bfdbfe">
        ${plusCode}
      </div>
    </div>
    <div style="text-align:center;margin-top:8px">
      <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="color:#3b82f6;font-size:11px;text-decoration:none">🗺️ فتح في خرائط جوجل ↗</a>
    </div>
  </div>`;

const GPS_ICON = L.divIcon({
  html: `<div style="position:relative;width:40px;height:40px">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;background:rgba(59,130,246,0.15);border-radius:50%;animation:pulse-ring 2s ease-out infinite"></div>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:18px;height:18px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.7)"></div>
    <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:16px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">▼</div>
  </div>
  <style>@keyframes pulse-ring{0%{transform:translate(-50%,-50%) scale(0.5);opacity:1}100%{transform:translate(-50%,-50%) scale(2);opacity:0}}</style>`,
  iconSize: [40, 40], iconAnchor: [20, 20], className: '',
});

const MANUAL_ICON = L.divIcon({
  html: '<div style="background:#6366f1;width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">📌</div>',
  iconSize: [30, 30], className: '',
});

/* ─── Types ─── */
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

/* ─── Tile Layers ─── */
const TILE_LAYERS = {
  '🗺️ خريطة عامة (OSM)':       { url: OSM_TILE_URL, attr: OSM_ATTRIBUTION, zoom: 19 },
  '🧭 خريطة واضحة (Voyager)':   { url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', attr: 'CARTO', zoom: 20 },
  '☀️ خريطة فاتحة':             { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: 'CARTO', zoom: 20 },
  '🌙 خريطة داكنة':             { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attr: 'CARTO', zoom: 20 },
  '🛰️ أقمار صناعية (Esri)':     { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Esri', zoom: 19 },
  '🏙️ شوارع تفصيلية (Esri)':    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', attr: 'Esri', zoom: 19 },
  '🟢 شوارع عربية (Google)':     { url: 'https://mt1.google.com/vt/lyrs=m&hl=ar&x={x}&y={y}&z={z}', attr: 'Google', zoom: 20 },
  '🗺️ هجين (صور + أسماء)':      { url: 'https://mt1.google.com/vt/lyrs=y&hl=ar&x={x}&y={y}&z={z}', attr: 'Google', zoom: 20 },
  '📡 أقمار عالية الدقة':        { url: 'https://mt1.google.com/vt/lyrs=s&hl=ar&x={x}&y={y}&z={z}', attr: 'Google', zoom: 20 },
  '🚦 حركة المرور':              { url: 'https://mt1.google.com/vt/lyrs=m,traffic&hl=ar&x={x}&y={y}&z={z}', attr: 'Google', zoom: 20 },
};

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const aiMarkersRef = useRef<L.LayerGroup | null>(null);
  const manualPickModeRef = useRef(false);
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, generators: 0, transporters: 0, recyclers: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [manualPickMode, setManualPickMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingManualPick, setPendingManualPick] = useState<{ lat: number; lng: number; address: string; plusCode: string } | null>(null);
  const [manualPickName, setManualPickName] = useState('');

  // Keep ref in sync
  useEffect(() => { manualPickModeRef.current = manualPickMode; }, [manualPickMode]);

  /* ─── Search History ─── */
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
    } catch (e) { console.error(e); }
  }, [profile?.id]);

  useEffect(() => { loadSearchHistory(); }, [loadSearchHistory]);

  const saveToHistory = async (entry: {
    search_query?: string; result_name: string; result_address?: string;
    latitude: number; longitude: number; search_type: string;
    confidence?: string; source_model?: string;
  }) => {
    if (!profile?.id) return;
    try {
      await supabase.from('map_search_history').insert({
        user_id: profile.id,
        organization_id: profile.organization_id || null,
        search_query: entry.search_query || null,
        result_name: entry.result_name,
        result_address: entry.result_address || null,
        latitude: entry.latitude, longitude: entry.longitude,
        search_type: entry.search_type,
        confidence: entry.confidence || null,
        source_model: entry.source_model || null,
      });
      loadSearchHistory();
    } catch (e) { console.error('Error saving to history:', e); }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await supabase.from('map_search_history').delete().eq('id', id);
      setSearchHistory(prev => prev.filter(h => h.id !== id));
      toast.success('تم حذف العنصر');
    } catch { toast.error('فشل في الحذف'); }
  };

  /* ─── Load Organizations ─── */
  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type, address, city, region, location_lat, location_lng, is_verified')
        .eq('is_active', true)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null);

      const orgsData = (data || [])
        .filter((o: any) => o.location_lat && o.location_lng)
        .map((o: any) => ({ ...o, latitude: o.location_lat, longitude: o.location_lng }));
      setOrgs(orgsData);
      setStats({
        total: orgsData.length,
        generators: orgsData.filter((o: any) => o.organization_type === 'generator').length,
        transporters: orgsData.filter((o: any) => o.organization_type === 'transporter').length,
        recyclers: orgsData.filter((o: any) => o.organization_type === 'recycler').length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrganizations(); }, [loadOrganizations]);

  /* ─── Initialize Map ─── */
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) mapInstanceRef.current.remove();

    const map = L.map(mapRef.current, { zoomControl: true }).setView(EGYPT_CENTER, DEFAULT_ZOOM);

    // Build tile layers
    const layerEntries = Object.entries(TILE_LAYERS);
    const baseLayers: Record<string, L.TileLayer> = {};
    layerEntries.forEach(([name, cfg]) => {
      baseLayers[name] = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: cfg.zoom });
    });
    baseLayers[layerEntries[0][0]].addTo(map); // Default: OSM
    L.control.layers(baseLayers, {}, { position: 'topright', collapsed: true }).addTo(map);

    // GPS locate control
    const LocateControl = L.Control.extend({
      options: { position: 'topleft' as L.ControlPosition },
      onAdd() {
        const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        btn.innerHTML = '<a href="#" title="موقعي الحالي" style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;background:white;font-size:18px;text-decoration:none;cursor:pointer" role="button">📍</a>';
        btn.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          if (!navigator.geolocation) return false;
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 16);
            const address = await reverseGeocodeOSM(latitude, longitude);
            const plusCode = OpenLocationCode.encode(latitude, longitude, 11);
            L.marker([latitude, longitude], { icon: GPS_ICON }).addTo(map)
              .bindPopup(buildLocationPopup('📍 أنت هنا', address, latitude, longitude, plusCode))
              .openPopup();
          });
          return false;
        };
        L.DomEvent.disableClickPropagation(btn);
        return btn;
      },
    });
    new LocateControl().addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  /* ─── Manual Pick ─── */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      if (!manualPickModeRef.current) return;
      const { lat, lng } = e.latlng;
      toast.info(`📍 جارٍ تحديد العنوان... (${lat.toFixed(5)}, ${lng.toFixed(5)})`);

      const address = await reverseGeocodeOSM(lat, lng);
      const plusCode = OpenLocationCode.encode(lat, lng, 11);

      L.marker([lat, lng], { icon: MANUAL_ICON })
        .addTo(map)
        .bindPopup(buildLocationPopup('📌 موقع محدد يدوياً', address, lat, lng, plusCode))
        .openPopup();

      setPendingManualPick({ lat, lng, address, plusCode });
      setManualPickName(address.split(',')[0] || 'موقع محدد يدوياً');
      setManualPickMode(false);
      manualPickModeRef.current = false;
      toast.success(`📌 تم تحديد الموقع: ${address.split(',')[0]}`);
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, []);

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

  /* ─── Render Org Markers ─── */
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    const filtered = activeFilters.length > 0
      ? orgs.filter(o => activeFilters.includes(o.organization_type))
      : orgs;

    filtered.forEach(org => {
      L.marker([org.latitude, org.longitude], { icon: createOrgIcon(org.organization_type) })
        .bindPopup(`
          <div dir="rtl" style="min-width:180px">
            <h4 style="font-weight:bold;margin-bottom:4px">${org.name}</h4>
            <p style="font-size:11px;color:#666;margin-bottom:4px">${ORG_ICONS[org.organization_type]?.label || org.organization_type}</p>
            ${org.address ? `<p style="font-size:11px">${org.address}</p>` : ''}
            ${org.city ? `<p style="font-size:11px">${org.city}${org.region ? ` - ${org.region}` : ''}</p>` : ''}
            ${org.is_verified ? '<span style="color:#22c55e;font-size:10px">✅ موثق</span>' : ''}
          </div>
        `)
        .addTo(markersLayerRef.current!);
    });
  }, [orgs, activeFilters]);

  /* ─── OSM Search ─── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await forwardGeocodeOSM(searchQuery);
      if (results.length > 0 && mapInstanceRef.current) {
        mapInstanceRef.current.setView([results[0].lat, results[0].lng], 14);
        L.marker([results[0].lat, results[0].lng]).addTo(mapInstanceRef.current)
          .bindPopup(`<div dir="rtl"><b>${results[0].name}</b><br/>${results[0].address}</div>`).openPopup();
        await saveToHistory({
          search_query: searchQuery, result_name: results[0].name,
          result_address: results[0].address, latitude: results[0].lat,
          longitude: results[0].lng, search_type: 'osm',
        });
      } else { toast.error('لم يتم العثور على الموقع'); }
    } finally { setSearching(false); }
  };

  /* ─── AI Search ─── */
  const handleAISearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setAiSearching(true);
    setAiResults([]);
    if (aiMarkersRef.current) aiMarkersRef.current.clearLayers();
    if (!aiMarkersRef.current && mapInstanceRef.current) {
      aiMarkersRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-location-resolve', { body: { query: aiSearchQuery } });
      if (error) throw error;

      const locations = data?.all_locations || [];
      if (locations.length === 0 && data?.location) locations.push({ ...data.location, is_primary: true });

      if (locations.length > 0 && mapInstanceRef.current) {
        setAiResults(locations);
        const bounds = L.latLngBounds([]);

        locations.forEach((loc: any, idx: number) => {
          const isPrimary = loc.is_primary;
          const confColor = loc.confidence === 'high' ? '#22c55e' : loc.confidence === 'medium' ? '#f59e0b' : '#ef4444';
          const icon = L.divIcon({
            html: `<div style="background:${isPrimary ? '#6366f1' : '#8b5cf6'};width:${isPrimary ? 34 : 28}px;height:${isPrimary ? 34 : 28}px;border-radius:50%;border:3px solid ${confColor};box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:${isPrimary ? 14 : 11}px;">${idx + 1}</div>`,
            iconSize: [isPrimary ? 34 : 28, isPrimary ? 34 : 28], className: '',
          });
          L.marker([loc.latitude, loc.longitude], { icon })
            .bindPopup(`
              <div dir="rtl" style="min-width:220px">
                <h4 style="font-weight:bold;margin-bottom:4px">🤖 ${loc.name}</h4>
                <p style="font-size:11px;color:#666;margin-bottom:2px">${loc.address}</p>
                ${loc.governorate ? `<p style="font-size:11px;color:#888">📍 ${loc.governorate}</p>` : ''}
                ${loc.location_type ? `<p style="font-size:10px;color:#888">🏷️ ${loc.location_type}</p>` : ''}
                <p style="font-size:10px;margin-top:4px">
                  <span style="color:${confColor};font-weight:bold">
                    ${loc.confidence === 'high' ? '✅ دقة عالية' : loc.confidence === 'medium' ? '⚠️ دقة متوسطة' : '❓ تقدير تقريبي'}
                  </span>
                  ${isPrimary ? ' — <b>النتيجة الرئيسية</b>' : ''}
                </p>
                ${loc.source_model ? `<p style="font-size:9px;color:#aaa;margin-top:2px">🧠 ${loc.source_model}</p>` : ''}
              </div>
            `)
            .addTo(aiMarkersRef.current!);
          bounds.extend([loc.latitude, loc.longitude]);
        });

        if (bounds.isValid()) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

        const primary = locations.find((l: any) => l.is_primary) || locations[0];
        await saveToHistory({
          search_query: aiSearchQuery, result_name: primary.name,
          result_address: primary.address, latitude: primary.latitude,
          longitude: primary.longitude, search_type: 'ai',
          confidence: primary.confidence, source_model: primary.source_model,
        });
        toast.success(`🤖 ${locations.length} نتيجة فريدة (من ${data?.total_raw_results || locations.length} عبر ${data?.models_used?.length || 1} نماذج AI)`);
      } else { toast.error('لم يتم العثور على نتائج'); }
    } catch { toast.error('فشل في البحث الذكي'); }
    finally { setAiSearching(false); }
  };

  /* ─── Helpers ─── */
  const toggleFilter = (type: string) =>
    setActiveFilters(prev => prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]);

  const goToHistoryItem = (item: SearchHistoryItem) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([item.latitude, item.longitude], 15);
    const icon = item.search_type === 'ai' ? '🤖' : item.search_type === 'manual' ? '📌' : item.search_type === 'gps' ? '📍' : '🔍';
    L.marker([item.latitude, item.longitude])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<div dir="rtl"><b>${icon} ${item.result_name}</b><br/><span style="font-size:11px">${item.result_address || ''}</span></div>`)
      .openPopup();
  };

  const searchTypeLabel = (t: string) =>
    ({ ai: '🤖 AI', osm: '🔍 بحث', manual: '📌 يدوي', gps: '📍 GPS' }[t] || t);

  /* ═══════════════════════════ Render ═══════════════════════════ */
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto p-4 pt-24 space-y-4">
        <PageNavBar />
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Map className="w-7 h-7 text-primary" />
              خريطة المجتمع التفاعلية
            </h1>
            <p className="text-sm text-muted-foreground mt-1">اكتشف المنظمات والجهات المسجلة على المنصة</p>
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
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Input value={aiSearchQuery} onChange={e => setAiSearchQuery(e.target.value)}
                  placeholder="🤖 بحث ذكي: المنطقة الصناعية بالعاشر..."
                  onKeyDown={e => e.key === 'Enter' && handleAISearch()} />
                <Button size="sm" onClick={handleAISearch} disabled={aiSearching} className="gap-1">
                  {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI
                </Button>
              </div>
              {aiResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">🤖 {aiResults.length} نتيجة:</p>
                  {aiResults.map((loc: any, idx: number) => (
                    <button key={idx}
                      className={`w-full text-right p-2 rounded-md text-xs border transition-colors hover:bg-accent/50 ${loc.is_primary ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                      onClick={() => {
                        mapInstanceRef.current?.setView([loc.latitude, loc.longitude], 16);
                        aiMarkersRef.current?.eachLayer((layer: any) => {
                          if (layer.getLatLng && Math.abs(layer.getLatLng().lat - loc.latitude) < 0.0001 && Math.abs(layer.getLatLng().lng - loc.longitude) < 0.0001)
                            layer.openPopup();
                        });
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
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
                  <Button size="sm" variant="ghost" className="w-full text-xs"
                    onClick={() => { setAiResults([]); aiMarkersRef.current?.clearLayers(); }}>مسح النتائج</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex gap-2">
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 بحث عادي: القاهرة، الإسكندرية..."
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching} className="gap-1">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} بحث
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button size="sm" variant={manualPickMode ? 'default' : 'outline'} className="gap-1"
            onClick={() => { setManualPickMode(!manualPickMode); setPendingManualPick(null); if (!manualPickMode) toast.info('📌 انقر على الخريطة لتحديد الموقع'); }}>
            <MousePointerClick className="w-4 h-4" />
            {manualPickMode ? 'إلغاء التحديد اليدوي' : 'تحديد يدوي على الخريطة'}
          </Button>
          <Button size="sm" variant={showHistory ? 'default' : 'outline'} className="gap-1"
            onClick={() => setShowHistory(!showHistory)}>
            <History className="w-4 h-4" /> سجل البحث ({searchHistory.length})
          </Button>
          {Object.entries(ORG_ICONS).map(([type, config]) => (
            <Button key={type} size="sm" variant={activeFilters.includes(type) ? 'default' : 'outline'}
              className="gap-1 text-xs" onClick={() => toggleFilter(type)}>
              <div className="w-3 h-3 rounded-full" style={{ background: config.color }} />
              {config.label}
            </Button>
          ))}
          {activeFilters.length > 0 && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => setActiveFilters([])}>إظهار الكل</Button>
          )}
        </div>

        {/* Manual Pick Details */}
        {pendingManualPick && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <Input value={manualPickName} onChange={e => setManualPickName(e.target.value)}
                  placeholder="اسم الموقع..." className="flex-1" />
                <Button size="sm" onClick={saveManualPick} className="gap-1"><Save className="w-4 h-4" /> حفظ في السجل</Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingManualPick(null)}>إلغاء</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mr-7">
                <div className="bg-background rounded-lg border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">📍 العنوان</p>
                  <p className="text-xs leading-relaxed">{pendingManualPick.address}</p>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] mt-1 gap-1 px-2"
                    onClick={() => { navigator.clipboard.writeText(pendingManualPick.address); toast.success('تم نسخ العنوان'); }}>
                    <Copy className="w-3 h-3" /> نسخ
                  </Button>
                </div>
                <div className="bg-background rounded-lg border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">🔢 الإحداثيات</p>
                  <p className="text-sm font-mono text-center" dir="ltr">{pendingManualPick.lat.toFixed(6)}, {pendingManualPick.lng.toFixed(6)}</p>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px] mt-1 gap-1 px-2"
                    onClick={() => { navigator.clipboard.writeText(`${pendingManualPick.lat.toFixed(6)}, ${pendingManualPick.lng.toFixed(6)}`); toast.success('تم نسخ الإحداثيات'); }}>
                    <Copy className="w-3 h-3" /> نسخ
                  </Button>
                </div>
                <div className="bg-background rounded-lg border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">📎 كود بلس</p>
                  <p className="text-sm font-mono text-center" dir="ltr">{pendingManualPick.plusCode}</p>
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-2"
                      onClick={() => { navigator.clipboard.writeText(pendingManualPick.plusCode); toast.success('تم نسخ كود بلس'); }}>
                      <Copy className="w-3 h-3" /> نسخ
                    </Button>
                    <a href={`https://www.google.com/maps?q=${pendingManualPick.lat},${pendingManualPick.lng}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> خرائط جوجل
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search History */}
        {showHistory && (
          <Card>
            <CardContent className="p-3">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> سجل عمليات البحث
              </h3>
              {searchHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات بحث محفوظة بعد</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {searchHistory.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent/30 transition-colors text-xs">
                      <button className="flex-1 text-right min-w-0" onClick={() => goToHistoryItem(item)}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] shrink-0">{searchTypeLabel(item.search_type)}</Badge>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.result_name}</p>
                            <p className="text-muted-foreground truncate">{item.result_address}</p>
                          </div>
                        </div>
                        {item.search_query && <p className="text-muted-foreground mt-0.5 truncate">بحث: "{item.search_query}"</p>}
                      </button>
                      <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => deleteHistoryItem(item.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual pick indicator */}
        {manualPickMode && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center text-sm font-medium text-primary animate-pulse">
            📌 وضع التحديد اليدوي مفعّل — انقر على أي مكان في الخريطة لتحديد الموقع
          </div>
        )}

        {/* Map */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapRef}
            className={`rounded-xl border shadow-sm ${manualPickMode ? 'border-primary cursor-crosshair' : 'border-border'}`}
            style={{ height: '600px' }} />
        </div>

        {/* Legend */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Map className="w-4 h-4" /> دليل الرموز</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(ORG_ICONS).map(([type, config]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: config.color }}>{config.icon}</div>
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
