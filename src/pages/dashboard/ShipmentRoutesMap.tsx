import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin, Truck, Package, ArrowRight, Weight, Calendar,
  RefreshCw, Eye, EyeOff, Maximize2, Minimize2, Navigation,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface RouteShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  total_value: number;
  pickup_address: string;
  pickup_city: string;
  pickup_latitude: number;
  pickup_longitude: number;
  delivery_address: string;
  delivery_city: string;
  delivery_latitude: number;
  delivery_longitude: number;
  driver_id: string;
  notes: string;
  expected_delivery_date: string;
  driver_name?: string;
}

const ROUTE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'جديدة', color: 'bg-muted text-muted-foreground' },
  approved: { label: 'معتمدة', color: 'bg-blue-100 text-blue-700' },
  collecting: { label: 'جاري الجمع', color: 'bg-amber-100 text-amber-700' },
  in_transit: { label: 'في الطريق', color: 'bg-emerald-100 text-emerald-700' },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-700' },
};

const WASTE_MAP: Record<string, string> = {
  plastic: '♻️ بلاستيك',
  metal: '🔩 معادن',
  paper: '📄 ورق',
  electronic: '💻 إلكترونيات',
  construction: '🏗️ مخلفات بناء',
  organic: '🌿 عضوي',
  glass: '🪟 زجاج',
  chemical: '⚗️ كيميائي',
  medical: '🏥 طبي',
  other: '📦 أخرى',
};

const ShipmentRoutesMap = () => {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<RouteShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleRoutes, setVisibleRoutes] = useState<Set<string>>(new Set());
  const [mapExpanded, setMapExpanded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);

  // Fetch shipments with coordinates
  const fetchShipments = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, total_value, pickup_address, pickup_city, pickup_latitude, pickup_longitude, delivery_address, delivery_city, delivery_latitude, delivery_longitude, driver_id, notes, expected_delivery_date')
        .eq('transporter_id', organization.id)
        .not('pickup_latitude', 'is', null)
        .not('delivery_latitude', 'is', null)
        .in('status', ['new', 'approved', 'collecting', 'in_transit', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch driver names
      const driverIds = [...new Set((data || []).map(s => s.driver_id).filter(Boolean))];
      let driverMap: Record<string, string> = {};
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, profile_id')
          .in('id', driverIds);
        
        if (drivers?.length) {
          const profileIds = drivers.map(d => d.profile_id).filter(Boolean);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', profileIds);
          
          const profileMap: Record<string, string> = {};
          profiles?.forEach(p => { profileMap[p.id] = p.full_name || ''; });
          drivers.forEach(d => {
            if (d.profile_id) driverMap[d.id] = profileMap[d.profile_id] || 'سائق';
          });
        }
      }

      const enriched = (data || []).map(s => ({
        ...s,
        driver_name: s.driver_id ? driverMap[s.driver_id] || 'سائق' : 'غير معين',
      })) as RouteShipment[];

      setShipments(enriched);
      setVisibleRoutes(new Set(enriched.map(s => s.id)));
    } catch (err) {
      console.error('Error fetching shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  const [mapReady, setMapReady] = useState(false);

  // Initialize map - depends on loading because container isn't mounted during skeleton
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: [31.2, 30.0],
      zoom: DEFAULT_ZOOM,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: [
        [EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]],
        [EGYPT_BOUNDS[2], EGYPT_BOUNDS[3]],
      ],
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    mapRef.current = map;
    
    map.on('load', () => setMapReady(true));

    return () => { map.remove(); mapRef.current = null; };
  }, [loading]);

  // Draw routes on map
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    drawRoutes();
  }, [shipments, visibleRoutes, selectedId, mapReady]);

  const drawRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    popupsRef.current.forEach(p => p.remove());
    popupsRef.current = [];

    // Remove old route layers/sources
    shipments.forEach((_, i) => {
      const lid = `route-${i}`;
      if (map.getLayer(lid)) map.removeLayer(lid);
      if (map.getSource(lid)) map.removeSource(lid);
    });

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    shipments.forEach((s, i) => {
      if (!visibleRoutes.has(s.id)) return;
      if (!s.pickup_latitude || !s.delivery_latitude) return;

      const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
      const isSelected = selectedId === s.id;
      const routeId = `route-${i}`;

      // Draw route line
      try {
        map.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [s.pickup_longitude, s.pickup_latitude],
                [s.delivery_longitude, s.delivery_latitude],
              ],
            },
          },
        });

        map.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': color,
            'line-width': isSelected ? 5 : 3,
            'line-opacity': isSelected ? 1 : 0.7,
            'line-dasharray': s.status === 'approved' ? [2, 2] : [1, 0],
          },
        });
      } catch (e) {
        // Source/layer might already exist
      }

      // Pickup marker
      const pickupEl = createMarkerEl(color, '📦', isSelected);
      const pickupMarker = new mapboxgl.Marker({ element: pickupEl })
        .setLngLat([s.pickup_longitude, s.pickup_latitude])
        .setPopup(new mapboxgl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(
          `<div style="direction:rtl;text-align:right;font-family:sans-serif;padding:4px;">
            <strong style="color:${color};">📦 ${s.shipment_number}</strong><br/>
            <span style="font-size:12px;color:#666;">🚀 نقطة الاستلام</span><br/>
            <span style="font-size:11px;">${s.pickup_address}</span><br/>
            <span style="font-size:11px;color:#888;">${WASTE_MAP[s.waste_type] || s.waste_type} • ${s.quantity} ${s.unit}</span>
          </div>`
        ))
        .addTo(map);

      // Delivery marker
      const deliveryEl = createMarkerEl(color, '🏭', isSelected);
      const deliveryMarker = new mapboxgl.Marker({ element: deliveryEl })
        .setLngLat([s.delivery_longitude, s.delivery_latitude])
        .setPopup(new mapboxgl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(
          `<div style="direction:rtl;text-align:right;font-family:sans-serif;padding:4px;">
            <strong style="color:${color};">🏭 ${s.shipment_number}</strong><br/>
            <span style="font-size:12px;color:#666;">📍 نقطة التسليم</span><br/>
            <span style="font-size:11px;">${s.delivery_address}</span><br/>
            <span style="font-size:11px;color:#888;">السائق: ${s.driver_name}</span>
          </div>`
        ))
        .addTo(map);

      markersRef.current.push(pickupMarker, deliveryMarker);

      bounds.extend([s.pickup_longitude, s.pickup_latitude]);
      bounds.extend([s.delivery_longitude, s.delivery_latitude]);
      hasPoints = true;
    });

    if (hasPoints) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 500 });
    }
  }, [shipments, visibleRoutes, selectedId]);

  const createMarkerEl = (color: string, emoji: string, isSelected: boolean) => {
    const el = document.createElement('div');
    el.innerHTML = `<div style="
      width:${isSelected ? '36px' : '28px'};height:${isSelected ? '36px' : '28px'};
      border-radius:50%;background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,${isSelected ? '0.4' : '0.25'});
      display:flex;align-items:center;justify-content:center;
      font-size:${isSelected ? '16px' : '12px'};cursor:pointer;
      transition:all 0.2s;
    ">${emoji}</div>`;
    return el;
  };

  const toggleRoute = (id: string) => {
    setVisibleRoutes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const focusShipment = (s: RouteShipment) => {
    setSelectedId(s.id);
    if (mapRef.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([s.pickup_longitude, s.pickup_latitude]);
      bounds.extend([s.delivery_longitude, s.delivery_latitude]);
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 600 });
    }
  };

  const calcDistance = (s: RouteShipment) => {
    const R = 6371;
    const dLat = ((s.delivery_latitude - s.pickup_latitude) * Math.PI) / 180;
    const dLng = ((s.delivery_longitude - s.pickup_longitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos((s.pickup_latitude * Math.PI) / 180) * Math.cos((s.delivery_latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2 md:p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Navigation className="w-6 h-6 text-primary" />
            خريطة المسارات النشطة
          </h1>
          <p className="text-sm text-muted-foreground">
            {shipments.length} شحنة بمسارات محددة على الخريطة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchShipments} className="gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> تحديث
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMapExpanded(!mapExpanded)}
            className="gap-1"
          >
            {mapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {mapExpanded ? 'تصغير' : 'تكبير'}
          </Button>
        </div>
      </div>

      {/* Map + Cards Grid */}
      <div className={`grid gap-4 ${mapExpanded ? 'grid-cols-1' : 'lg:grid-cols-[1fr_340px]'}`}>
        {/* Map */}
        <Card className="overflow-hidden">
          <div
            ref={mapContainerRef}
            style={{ height: mapExpanded ? '600px' : '500px', width: '100%' }}
            className="rounded-lg"
          />
        </Card>

        {/* Shipment Cards */}
        {!mapExpanded && (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-1">
              {shipments.map((s, i) => {
                const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
                const statusInfo = STATUS_MAP[s.status] || STATUS_MAP.new;
                const distance = calcDistance(s);
                const isVisible = visibleRoutes.has(s.id);
                const isActive = selectedId === s.id;

                return (
                  <Card
                    key={s.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}`}
                    style={{ borderRight: `4px solid ${color}` }}
                    onClick={() => focusShipment(s)}
                  >
                    <CardContent className="p-3 space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); toggleRoute(s.id); }}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Badge>
                          <span className="font-bold text-sm" style={{ color }}>
                            {s.shipment_number}
                          </span>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-start gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.pickup_city}</p>
                            <p className="text-muted-foreground truncate">{s.pickup_address}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mr-1.5">
                          <ArrowRight className="w-3 h-3 text-muted-foreground rotate-180" />
                          <span className="text-muted-foreground">{distance} كم</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-red-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.delivery_city}</p>
                            <p className="text-muted-foreground truncate">{s.delivery_address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between flex-wrap gap-1 pt-1 border-t text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Package className="w-3 h-3" />
                          {WASTE_MAP[s.waste_type] || s.waste_type}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Weight className="w-3 h-3" />
                          {s.quantity?.toLocaleString()} {s.unit}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Truck className="w-3 h-3" />
                          {s.driver_name}
                        </span>
                      </div>
                      {s.total_value > 0 && (
                        <div className="text-[10px] font-medium text-primary">
                          💰 {s.total_value?.toLocaleString()} ج.م
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {shipments.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد شحنات بمسارات محددة</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {shipments.slice(0, 5).map((s, i) => (
          <Card key={s.id} className="cursor-pointer hover:shadow-sm" onClick={() => focusShipment(s)} style={{ borderTop: `3px solid ${ROUTE_COLORS[i % ROUTE_COLORS.length]}` }}>
            <CardContent className="p-3 text-center">
              <p className="text-xs font-bold" style={{ color: ROUTE_COLORS[i % ROUTE_COLORS.length] }}>{s.shipment_number}</p>
              <p className="text-lg font-bold">{calcDistance(s)} كم</p>
              <p className="text-[10px] text-muted-foreground">{s.pickup_city} → {s.delivery_city}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShipmentRoutesMap;
