import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin, Truck, Package, ArrowRight, Weight,
  RefreshCw, Eye, EyeOff, Maximize2, Minimize2, Navigation,
  AlertTriangle, Bell, Users, Activity, Radio, X, ChevronLeft,
  ChevronRight, Phone, MessageSquare, Clock, Zap,
  Calendar, DollarSign, FileText, Route, Hash,
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
import { toast } from 'sonner';
import { formatDistanceArabic } from '@/lib/routingUtils';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

// --- Types ---
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
  created_at?: string;
  driver_name?: string;
  driver_plate?: string;
}

interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number;
  recorded_at: string;
  driver_name?: string;
  vehicle_plate?: string;
  is_available?: boolean;
}

interface OperationEvent {
  id: string;
  type: 'status_change' | 'delay' | 'sos' | 'arrival' | 'departure' | 'speed' | 'offline';
  message: string;
  timestamp: Date;
  shipmentId?: string;
  driverId?: string;
  location?: [number, number]; // [lng, lat]
  severity: 'info' | 'warning' | 'critical';
}

// --- Constants ---
const ROUTE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'جديدة', color: 'bg-muted text-muted-foreground' },
  approved: { label: 'معتمدة', color: 'bg-blue-100 text-blue-700' },
  collecting: { label: 'جاري الجمع', color: 'bg-amber-100 text-amber-700' },
  in_transit: { label: 'في الطريق', color: 'bg-emerald-100 text-emerald-700' },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-700' },
  registered: { label: 'مسجلة', color: 'bg-purple-100 text-purple-700' },
};

const WASTE_MAP: Record<string, string> = {
  plastic: '♻️ بلاستيك', metal: '🔩 معادن', paper: '📄 ورق',
  electronic: '💻 إلكترونيات', construction: '🏗️ مخلفات بناء',
  organic: '🌿 عضوي', glass: '🪟 زجاج', chemical: '⚗️ كيميائي',
  medical: '🏥 طبي', other: '📦 أخرى',
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
};

// --- Component ---
const ShipmentRoutesMap = () => {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<RouteShipment[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [events, setEvents] = useState<OperationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visibleRoutes, setVisibleRoutes] = useState<Set<string>>(new Set());
  const [mapExpanded, setMapExpanded] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'shipments' | 'alerts'>('shipments');
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const driverMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const eventMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const routeCoordsCache = useRef<Record<string, [number, number][]>>({});

  // --- Live Stats ---
  const stats = useMemo(() => {
    const activeShipments = shipments.filter(s => ['collecting', 'in_transit'].includes(s.status)).length;
    const onlineDrivers = driverLocations.filter(d => {
      const diff = Date.now() - new Date(d.recorded_at).getTime();
      return diff < 10 * 60 * 1000; // 10 min
    }).length;
    const delays = events.filter(e => e.severity === 'warning' || e.severity === 'critical').length;
    const completedToday = shipments.filter(s => s.status === 'delivered').length;
    return { activeShipments, onlineDrivers, delays, completedToday, totalShipments: shipments.length };
  }, [shipments, driverLocations, events]);

  // --- Fetch Data ---
  const fetchShipments = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, total_value, pickup_address, pickup_city, pickup_latitude, pickup_longitude, delivery_address, delivery_city, delivery_latitude, delivery_longitude, driver_id, notes, expected_delivery_date, created_at')
        .eq('transporter_id', organization.id)
        .not('pickup_latitude', 'is', null)
        .not('delivery_latitude', 'is', null)
        .in('status', ['new', 'approved', 'collecting', 'in_transit', 'delivered', 'registered'])
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const driverIds = [...new Set((data || []).map(s => s.driver_id).filter(Boolean))];
      let driverMap: Record<string, { name: string; plate: string }> = {};
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase.from('drivers').select('id, profile_id, vehicle_plate').in('id', driverIds);
        if (drivers?.length) {
          const profileIds = drivers.map(d => d.profile_id).filter(Boolean);
          const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', profileIds);
          const profileMap: Record<string, string> = {};
          profiles?.forEach(p => { profileMap[p.id] = p.full_name || ''; });
          drivers.forEach(d => { 
            if (d.profile_id) driverMap[d.id] = { 
              name: profileMap[d.profile_id] || 'سائق',
              plate: d.vehicle_plate || '' 
            }; 
          });
        }
      }

      const enriched = (data || []).map(s => ({
        ...s,
        driver_name: s.driver_id ? driverMap[s.driver_id]?.name || 'سائق' : 'غير معين',
        driver_plate: s.driver_id ? driverMap[s.driver_id]?.plate || '' : '',
      })) as RouteShipment[];

      setShipments(enriched);
      setVisibleRoutes(new Set(enriched.map(s => s.id)));
    } catch (err) {
      console.error('Error fetching shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const fetchDriverLocations = useCallback(async () => {
    if (!organization?.id) return;
    try {
      // Get drivers for this organization
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id, profile_id, vehicle_plate, is_available')
        .eq('organization_id', organization.id);

      if (!drivers?.length) return;

      const driverIds = drivers.map(d => d.id);
      const profileIds = drivers.map(d => d.profile_id).filter(Boolean);

      // Get latest location for each driver
      const { data: locations } = await supabase
        .from('driver_location_logs')
        .select('driver_id, latitude, longitude, speed, heading, accuracy, recorded_at')
        .in('driver_id', driverIds)
        .order('recorded_at', { ascending: false })
        .limit(100);

      // Get profile names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => { profileMap[p.id] = p.full_name || ''; });
      const driverInfoMap: Record<string, { name: string; plate: string; available: boolean }> = {};
      drivers.forEach(d => {
        driverInfoMap[d.id] = {
          name: d.profile_id ? profileMap[d.profile_id] || 'سائق' : 'سائق',
          plate: d.vehicle_plate || '',
          available: d.is_available ?? true,
        };
      });

      // Get latest per driver
      const latestMap = new Map<string, any>();
      locations?.forEach(loc => {
        if (!latestMap.has(loc.driver_id)) {
          latestMap.set(loc.driver_id, loc);
        }
      });

      const enrichedLocations: DriverLocation[] = [];
      latestMap.forEach((loc, driverId) => {
        const info = driverInfoMap[driverId];
        enrichedLocations.push({
          ...loc,
          driver_name: info?.name || 'سائق',
          vehicle_plate: info?.plate || '',
          is_available: info?.available ?? true,
        });
      });

      setDriverLocations(enrichedLocations);

      // Generate events from driver data
      generateDriverEvents(enrichedLocations);
    } catch (err) {
      console.error('Error fetching driver locations:', err);
    }
  }, [organization?.id]);

  const generateDriverEvents = useCallback((locations: DriverLocation[]) => {
    const newEvents: OperationEvent[] = [];
    const now = Date.now();

    locations.forEach(loc => {
      const age = now - new Date(loc.recorded_at).getTime();
      const minAgo = Math.floor(age / 60000);

      // Offline driver (no update in 15+ min)
      if (age > 15 * 60 * 1000) {
        newEvents.push({
          id: `offline-${loc.driver_id}`,
          type: 'offline',
          message: `${loc.driver_name} غير متصل منذ ${minAgo} دقيقة`,
          timestamp: new Date(loc.recorded_at),
          driverId: loc.driver_id,
          location: [loc.longitude, loc.latitude],
          severity: age > 30 * 60 * 1000 ? 'critical' : 'warning',
        });
      }

      // High speed alert (> 120 km/h)
      if (loc.speed && loc.speed > 120) {
        newEvents.push({
          id: `speed-${loc.driver_id}`,
          type: 'speed',
          message: `⚠️ ${loc.driver_name} يسير بسرعة ${Math.round(loc.speed)} كم/س`,
          timestamp: new Date(loc.recorded_at),
          driverId: loc.driver_id,
          location: [loc.longitude, loc.latitude],
          severity: 'warning',
        });
      }
    });

    setEvents(prev => {
      // Merge: keep shipment events, replace driver events
      const shipmentEvents = prev.filter(e => e.type === 'status_change' || e.type === 'arrival' || e.type === 'departure');
      return [...shipmentEvents, ...newEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });
  }, []);

  // --- Fetch road route ---
  const fetchRoadRoute = useCallback(async (
    pickupLng: number, pickupLat: number,
    deliveryLng: number, deliveryLat: number,
    shipmentId: string
  ): Promise<[number, number][]> => {
    if (routeCoordsCache.current[shipmentId]) return routeCoordsCache.current[shipmentId];
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupLng},${pickupLat};${deliveryLng},${deliveryLat}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]) {
        const coords = data.routes[0].geometry.coordinates as [number, number][];
        routeCoordsCache.current[shipmentId] = coords;
        return coords;
      }
    } catch (e) { console.error('Directions API error:', e); }
    return [[pickupLng, pickupLat], [deliveryLng, deliveryLat]];
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchShipments();
    fetchDriverLocations();
  }, [fetchShipments, fetchDriverLocations]);

  // Refresh driver locations every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchDriverLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchDriverLocations]);

  // Realtime: listen to shipment status changes
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('ops-shipments')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.transporter_id !== organization.id) return;

        // Update shipments list
        setShipments(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));

        // Add event
        const statusLabel = STATUS_MAP[updated.status]?.label || updated.status;
        const newEvent: OperationEvent = {
          id: `status-${updated.id}-${Date.now()}`,
          type: 'status_change',
          message: `شحنة ${updated.shipment_number} → ${statusLabel}`,
          timestamp: new Date(),
          shipmentId: updated.id,
          location: updated.pickup_longitude ? [updated.pickup_longitude, updated.pickup_latitude] : undefined,
          severity: updated.status === 'delivered' ? 'info' : 'warning',
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 50));
        toast.info(`📦 ${newEvent.message}`);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id]);

  // Realtime: listen to driver location updates
  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel('ops-driver-locations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'driver_location_logs',
      }, (payload) => {
        const loc = payload.new as any;
        setDriverLocations(prev => {
          const existing = prev.findIndex(d => d.driver_id === loc.driver_id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updated[existing], ...loc };
            return updated;
          }
          return [...prev, loc];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || loading) return;

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

    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  }, [loading]);

  // Draw routes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    drawRoutes();
  }, [shipments, visibleRoutes, selectedId, mapReady]);

  // Draw driver markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    drawDriverMarkers();
  }, [driverLocations, mapReady]);

  // Draw event bubbles on map
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    drawEventBubbles();
  }, [events, mapReady]);

  const drawRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Remove old route layers/sources
    for (let i = 0; i < 30; i++) {
      const lid = `route-${i}`;
      if (map.getLayer(lid)) map.removeLayer(lid);
      if (map.getSource(lid)) map.removeSource(lid);
    }

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;

    shipments.forEach((s, i) => {
      if (!visibleRoutes.has(s.id)) return;
      if (!s.pickup_latitude || !s.delivery_latitude) return;

      const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
      const isSelected = selectedId === s.id;
      const routeId = `route-${i}`;

      fetchRoadRoute(s.pickup_longitude, s.pickup_latitude, s.delivery_longitude, s.delivery_latitude, s.id)
        .then(coords => {
          if (!map || !map.getCanvas()) return;
          try {
            map.addSource(routeId, {
              type: 'geojson',
              data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
            });
            map.addLayer({
              id: routeId, type: 'line', source: routeId,
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': color,
                'line-width': isSelected ? 5 : 3,
                'line-opacity': isSelected ? 1 : 0.7,
                'line-dasharray': s.status === 'approved' ? [2, 2] : [1, 0],
              },
            });
          } catch (e) { /* exists */ }
        });

      // Pickup marker
      const pickupEl = createMarkerEl(color, '📦', isSelected);
      const statusLabel = STATUS_MAP[s.status]?.label || s.status;
      const wasteLabel = WASTE_MAP[s.waste_type] || s.waste_type;
      const dist = calcDistance(s);
      const pickupMarker = new mapboxgl.Marker({ element: pickupEl })
        .setLngLat([s.pickup_longitude, s.pickup_latitude])
        .setPopup(new mapboxgl.Popup({ offset: 15, maxWidth: '320px' }).setHTML(
          `<div style="direction:rtl;text-align:right;font-family:sans-serif;padding:8px;line-height:1.6;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <strong style="color:${color};font-size:14px;">📦 ${s.shipment_number}</strong>
              <span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:10px;">${statusLabel}</span>
            </div>
            <div style="background:#f5f5f5;border-radius:8px;padding:6px 8px;margin-bottom:6px;">
              <div style="font-size:11px;color:#388e3c;font-weight:600;">🚀 نقطة الاستلام</div>
              <div style="font-size:12px;margin-top:2px;">${s.pickup_address}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;color:#666;">
              <div>📦 ${wasteLabel}</div>
              <div>⚖️ ${s.quantity?.toLocaleString()} ${s.unit}</div>
              <div>🛣️ ${dist} كم</div>
              <div>💰 ${s.total_value?.toLocaleString()} ج.م</div>
              <div>🚛 ${s.driver_name || 'غير معين'}</div>
              <div>📅 ${s.expected_delivery_date ? new Date(s.expected_delivery_date).toLocaleDateString('ar-EG') : '—'}</div>
            </div>
            ${s.notes ? `<div style="margin-top:6px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:4px;">📝 ${s.notes}</div>` : ''}
          </div>`
        ))
        .addTo(map);

      // Delivery marker
      const deliveryEl = createMarkerEl(color, '🏭', isSelected);
      const deliveryMarker = new mapboxgl.Marker({ element: deliveryEl })
        .setLngLat([s.delivery_longitude, s.delivery_latitude])
        .setPopup(new mapboxgl.Popup({ offset: 15, maxWidth: '320px' }).setHTML(
          `<div style="direction:rtl;text-align:right;font-family:sans-serif;padding:8px;line-height:1.6;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <strong style="color:${color};font-size:14px;">🏭 ${s.shipment_number}</strong>
              <span style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:10px;font-size:10px;">${statusLabel}</span>
            </div>
            <div style="background:#f5f5f5;border-radius:8px;padding:6px 8px;margin-bottom:6px;">
              <div style="font-size:11px;color:#c62828;font-weight:600;">📍 نقطة التسليم</div>
              <div style="font-size:12px;margin-top:2px;">${s.delivery_address}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px;color:#666;">
              <div>📦 ${wasteLabel}</div>
              <div>⚖️ ${s.quantity?.toLocaleString()} ${s.unit}</div>
              <div>🛣️ ${dist} كم</div>
              <div>💰 ${s.total_value?.toLocaleString()} ج.م</div>
              <div>🚛 ${s.driver_name || 'غير معين'}</div>
              <div>📅 ${s.expected_delivery_date ? new Date(s.expected_delivery_date).toLocaleDateString('ar-EG') : '—'}</div>
            </div>
            ${s.notes ? `<div style="margin-top:6px;font-size:10px;color:#888;border-top:1px solid #eee;padding-top:4px;">📝 ${s.notes}</div>` : ''}
          </div>`
        ))
        .addTo(map);

      markersRef.current.push(pickupMarker, deliveryMarker);
      bounds.extend([s.pickup_longitude, s.pickup_latitude]);
      bounds.extend([s.delivery_longitude, s.delivery_latitude]);
      hasPoints = true;
    });

    if (hasPoints) map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 500 });
  }, [shipments, visibleRoutes, selectedId, fetchRoadRoute]);

  const drawDriverMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old driver markers not in current data
    const currentDriverIds = new Set(driverLocations.map(d => d.driver_id));
    driverMarkersRef.current.forEach((marker, driverId) => {
      if (!currentDriverIds.has(driverId)) {
        marker.remove();
        driverMarkersRef.current.delete(driverId);
      }
    });

    driverLocations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;
      const lngLat: [number, number] = [loc.longitude, loc.latitude];
      const age = Date.now() - new Date(loc.recorded_at).getTime();
      const isOnline = age < 10 * 60 * 1000;
      const statusColor = isOnline ? '#22c55e' : '#9ca3af';
      const heading = loc.heading || 0;

      const existing = driverMarkersRef.current.get(loc.driver_id);
      if (existing) {
        existing.setLngLat(lngLat);
        const el = existing.getElement();
        el.innerHTML = buildDriverMarkerHTML(statusColor, heading, loc.speed);
      } else {
        const el = document.createElement('div');
        el.innerHTML = buildDriverMarkerHTML(statusColor, heading, loc.speed);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(lngLat)
          .setPopup(new mapboxgl.Popup({ offset: 15, maxWidth: '250px' }).setHTML(
            `<div style="direction:rtl;text-align:right;font-family:sans-serif;padding:6px;">
              <strong>🚛 ${loc.driver_name}</strong><br/>
              <span style="font-size:11px;">🔢 ${loc.vehicle_plate || 'غير محدد'}</span><br/>
              <span style="font-size:11px;">⚡ ${loc.speed ? Math.round(loc.speed) + ' كم/س' : 'متوقف'}</span><br/>
              <span style="font-size:10px;color:${isOnline ? '#22c55e' : '#ef4444'};">${isOnline ? '🟢 متصل' : '🔴 غير متصل'}</span>
            </div>`
          ))
          .addTo(map);
        driverMarkersRef.current.set(loc.driver_id, marker);
      }
    });
  }, [driverLocations]);

  const drawEventBubbles = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old event markers
    eventMarkersRef.current.forEach(m => m.remove());
    eventMarkersRef.current = [];

    // Only show critical/warning events with location (last 5)
    const visibleEvents = events
      .filter(e => e.location && (e.severity === 'critical' || e.severity === 'warning'))
      .slice(0, 5);

    visibleEvents.forEach(evt => {
      if (!evt.location) return;
      const el = document.createElement('div');
      const bgColor = evt.severity === 'critical' ? '#ef4444' : '#f59e0b';
      el.innerHTML = `<div style="
        background:${bgColor};color:white;padding:4px 8px;border-radius:12px;
        font-size:10px;font-family:sans-serif;white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);animation:pulse 2s infinite;
        direction:rtl;max-width:200px;overflow:hidden;text-overflow:ellipsis;
      ">${evt.severity === 'critical' ? '🚨' : '⚠️'} ${evt.message}</div>`;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(evt.location)
        .addTo(map);
      eventMarkersRef.current.push(marker);

      // Auto-remove bubble after 30 seconds
      setTimeout(() => { marker.remove(); }, 30000);
    });
  }, [events]);

  // --- Helpers ---
  const createMarkerEl = (color: string, emoji: string, isSelected: boolean) => {
    const el = document.createElement('div');
    const size = isSelected ? '36px' : '28px';
    el.innerHTML = `<div style="
      width:${size};height:${size};border-radius:50%;background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,${isSelected ? '0.4' : '0.25'});
      display:flex;align-items:center;justify-content:center;
      font-size:${isSelected ? '16px' : '12px'};cursor:pointer;transition:all 0.2s;
    ">${emoji}</div>`;
    return el;
  };

  const buildDriverMarkerHTML = (color: string, heading: number, speed: number) => {
    return `<div style="position:relative;">
      <div style="width:32px;height:32px;border-radius:50%;background:${color};border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;
        transform:rotate(${heading}deg);cursor:pointer;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
      </div>
      ${speed > 0 ? `<div style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);
        background:rgba(0,0,0,0.7);color:white;padding:1px 4px;border-radius:6px;
        font-size:8px;white-space:nowrap;">${Math.round(speed)} كم/س</div>` : ''}
    </div>`;
  };

  const toggleRoute = (id: string) => {
    setVisibleRoutes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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

  const focusEvent = (evt: OperationEvent) => {
    if (evt.location && mapRef.current) {
      mapRef.current.flyTo({ center: evt.location, zoom: 14, duration: 800 });
    }
    if (evt.shipmentId) setSelectedId(evt.shipmentId);
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

  // --- Loading State ---
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const warningCount = events.filter(e => e.severity === 'warning').length;

  return (
    <div className="space-y-0 h-[calc(100vh-4rem)] flex flex-col" dir="rtl">
      {/* Live Stats Bar */}
      <div className="bg-card border-b px-4 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">مسرح العمليات</h1>
        </div>
        <div className="flex items-center gap-3 mr-auto flex-wrap">
          {/* Active shipments */}
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>{stats.activeShipments} نشطة</span>
          </div>
          {/* Online drivers */}
          <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{stats.onlineDrivers} سائق متصل</span>
          </div>
          {/* Alerts */}
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{criticalCount + warningCount} تنبيه</span>
            </div>
          )}
          {/* Completed today */}
          <div className="flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
            <Package className="w-3.5 h-3.5" />
            <span>{stats.completedToday} مكتملة</span>
          </div>
          {/* Total */}
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Radio className="w-3 h-3" />
            <span>{stats.totalShipments} إجمالي</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={() => { fetchShipments(); fetchDriverLocations(); }} className="gap-1 h-7 text-xs">
            <RefreshCw className="w-3 h-3" /> تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMapExpanded(!mapExpanded)} className="gap-1 h-7 text-xs">
            {mapExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-[10px] space-y-1">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> سائق متصل</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-muted-foreground" /> سائق غير متصل</div>
            <div className="flex items-center gap-1.5"><span>📦</span> نقطة استلام</div>
            <div className="flex items-center gap-1.5"><span>🏭</span> نقطة تسليم</div>
          </div>
        </div>

        {/* Sidebar */}
        {!mapExpanded && (
          <div className="w-[340px] border-r bg-card flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b">
              <button
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  sidebarTab === 'shipments' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setSidebarTab('shipments')}
              >
                <Truck className="w-3.5 h-3.5" /> الشحنات ({shipments.length})
              </button>
              <button
                className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  sidebarTab === 'alerts' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setSidebarTab('alerts')}
              >
                <Bell className="w-3.5 h-3.5" />
                التنبيهات
                {events.length > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-[9px] rounded-full px-1.5 min-w-[16px] text-center">
                    {events.length}
                  </span>
                )}
              </button>
            </div>

            <ScrollArea className="flex-1">
              {sidebarTab === 'shipments' ? (
                <div className="space-y-2 p-2">
                  {shipments.map((s, i) => {
                    const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
                    const statusInfo = STATUS_MAP[s.status] || STATUS_MAP.new;
                    const distance = calcDistance(s);
                    const isVisible = visibleRoutes.has(s.id);
                    const isActive = selectedId === s.id;

                    // Find driver location for this shipment
                    const driverLoc = driverLocations.find(d => d.driver_id === s.driver_id);
                    const isDriverOnline = driverLoc ? (Date.now() - new Date(driverLoc.recorded_at).getTime()) < 10 * 60 * 1000 : false;

                    // Calculate estimated arrival
                    const avgSpeedKmh = driverLoc?.speed && driverLoc.speed > 0 ? driverLoc.speed : 60;
                    const estimatedHours = distance / avgSpeedKmh;
                    const estimatedMinutes = Math.round(estimatedHours * 60);

                    return (
                      <Card
                        key={s.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${isActive ? 'ring-2 ring-primary shadow-lg' : ''}`}
                        style={{ borderRight: `4px solid ${color}` }}
                        onClick={() => focusShipment(s)}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Header: Number + Status + Visibility */}
                          <div className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => { e.stopPropagation(); toggleRoute(s.id); }}
                            >
                              {isVisible ? <Eye className="w-3 h-3 text-primary" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                            </Button>
                            <div className="flex items-center gap-1.5">
                              <Badge className={`text-[9px] px-1.5 py-0 ${statusInfo.color}`}>{statusInfo.label}</Badge>
                              <span className="font-bold text-xs" style={{ color }}>{s.shipment_number}</span>
                            </div>
                          </div>

                          {/* Route: Full addresses */}
                          <div className="space-y-1 bg-muted/50 rounded-md p-2">
                            <div className="flex items-start gap-1.5">
                              <div className="flex flex-col items-center mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="w-px h-4 bg-muted-foreground/30" />
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                              </div>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div>
                                  <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">نقطة الاستلام</p>
                                  <p className="text-[10px] truncate">{s.pickup_address || s.pickup_city}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium text-red-700 dark:text-red-400">نقطة التسليم</p>
                                  <p className="text-[10px] truncate">{s.delivery_address || s.delivery_city}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Distance & Time */}
                          <div className="grid grid-cols-3 gap-1 text-center">
                            <div className="bg-muted/40 rounded px-1 py-1">
                              <Route className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                              <p className="text-[10px] font-bold">{distance} كم</p>
                              <p className="text-[8px] text-muted-foreground">المسافة</p>
                            </div>
                            <div className="bg-muted/40 rounded px-1 py-1">
                              <Clock className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                              <p className="text-[10px] font-bold">{estimatedMinutes > 60 ? `${Math.floor(estimatedMinutes/60)}س ${estimatedMinutes%60}د` : `${estimatedMinutes} د`}</p>
                              <p className="text-[8px] text-muted-foreground">الوقت المتوقع</p>
                            </div>
                            <div className="bg-muted/40 rounded px-1 py-1">
                              <DollarSign className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                              <p className="text-[10px] font-bold">{s.total_value?.toLocaleString('ar-EG')}</p>
                              <p className="text-[8px] text-muted-foreground">ج.م</p>
                            </div>
                          </div>

                          {/* Waste & Weight */}
                          <div className="flex items-center justify-between text-[10px] px-1">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3 text-muted-foreground" />
                              {WASTE_MAP[s.waste_type] || s.waste_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Weight className="w-3 h-3 text-muted-foreground" />
                              {s.quantity?.toLocaleString('ar-EG')} {s.unit}
                            </span>
                          </div>

                          {/* Driver Info */}
                          <div className="flex items-center gap-2 bg-muted/30 rounded-md p-1.5 border border-border/50">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDriverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium truncate flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {s.driver_name}
                              </p>
                              {s.driver_plate && (
                                <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                  <Hash className="w-2.5 h-2.5" />
                                  {s.driver_plate}
                                </p>
                              )}
                            </div>
                            {driverLoc && driverLoc.speed > 0 && (
                              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                ⚡ {Math.round(driverLoc.speed)} كم/س
                              </span>
                            )}
                          </div>

                          {/* Dates */}
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t pt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              تسليم: {s.expected_delivery_date ? new Date(s.expected_delivery_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '—'}
                            </span>
                            {s.created_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                إنشاء: {new Date(s.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {s.notes && (
                            <div className="flex items-start gap-1 text-[9px] text-muted-foreground bg-muted/20 rounded p-1.5">
                              <FileText className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{s.notes}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {shipments.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">لا توجد شحنات نشطة</div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {events.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      لا توجد تنبيهات حالياً
                    </div>
                  )}
                  {events.map(evt => {
                    const style = SEVERITY_STYLES[evt.severity];
                    return (
                      <div
                        key={evt.id}
                        className={`${style.bg} ${style.border} border rounded-lg p-2.5 cursor-pointer hover:shadow-sm transition-all`}
                        onClick={() => focusEvent(evt)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${style.icon}`}>
                            {evt.severity === 'critical' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                             evt.severity === 'warning' ? <Zap className="w-3.5 h-3.5" /> :
                             <Activity className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium leading-tight">{evt.message}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {evt.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {evt.location && (
                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentRoutesMap;
