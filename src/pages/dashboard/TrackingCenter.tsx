import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MapPin, Truck, Package, Search, Loader2, RefreshCw,
  Navigation, Eye, Radio, Clock, Activity, Filter,
  ChevronLeft, Satellite, AlertTriangle, CheckCircle2,
  ArrowUpDown, Building2, Route, Gauge, Shield,
  Zap, TrendingUp, Timer, Compass, Wifi, WifiOff,
  Brain, TriangleAlert, CircleCheck, Crosshair,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getStatusConfig, mapLegacyStatus } from '@/lib/shipmentStatusConfig';
import LeafletMultiDriverMap from '@/components/maps/LeafletMultiDriverMap';
import LeafletShipmentTracking from '@/components/maps/LeafletShipmentTracking';

interface TrackedShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  pickup_address: string;
  delivery_address: string;
  driver_id: string | null;
  created_at: string;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  generator: { name: string } | null;
  transporter: { name: string } | null;
  recycler: { name: string } | null;
}

interface DriverLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isOnline: boolean;
  vehiclePlate?: string;
  phone?: string;
  currentShipment?: string | null;
  speed?: number | null;
}

interface ShipmentIntelligence {
  shipment_id: string;
  shipment_number: string;
  status: string;
  driver_id: string | null;
  driver_location: { lat: number; lng: number } | null;
  speed_kmh: number | null;
  gps_age_seconds: number;
  gps_fresh: boolean;
  distance_km: number | null;
  distance_meters: number | null;
  target_type: string;
  eta: { etaMinutes: number; etaFormatted: string; arrivalTime: string } | null;
  deviation: { isDeviating: boolean; deviationDegrees: number; deviationScore: number } | null;
  route_health: { score: number; grade: string; issues: string[] } | null;
}

const activeStatuses = ['approved', 'collecting', 'in_transit', 'delivered'] as const;

// ━━━ Health Badge Component ━━━
const HealthBadge = ({ grade, score }: { grade: string; score: number }) => {
  const config: Record<string, { label: string; color: string; icon: typeof CircleCheck }> = {
    excellent: { label: 'ممتاز', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CircleCheck },
    good: { label: 'جيد', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Shield },
    warning: { label: 'تحذير', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: TriangleAlert },
    critical: { label: 'حرج', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  };
  const c = config[grade] || config.warning;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1 font-bold', c.color)}>
      <Icon className="w-3 h-3" /> {c.label} {score}%
    </Badge>
  );
};

// ━━━ ETA Badge ━━━
const ETABadge = ({ eta }: { eta: ShipmentIntelligence['eta'] }) => {
  if (!eta) return null;
  const urgent = eta.etaMinutes <= 10;
  return (
    <Badge variant="outline" className={cn('text-[10px] gap-1', urgent ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50')}>
      <Timer className="w-3 h-3" /> {eta.etaFormatted}
    </Badge>
  );
};

const TrackingCenter = () => {
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<TrackedShipment[]>([]);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [intelligence, setIntelligence] = useState<ShipmentIntelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<TrackedShipment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('intelligence');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const isAdmin = roles.includes('admin');
  const orgType = organization?.organization_type;
  const orgId = organization?.id;

  // ━━━ Fetch shipments ━━━
  const fetchShipments = useCallback(async () => {
    if (!orgId && !isAdmin) return;
    setLoading(true);

    let query = supabase
      .from('shipments')
      .select(`
        id, shipment_number, status, waste_type, quantity,
        pickup_address, delivery_address, driver_id, created_at,
        pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude,
        generator:generator_id(name),
        transporter:transporter_id(name),
        recycler:recycler_id(name)
      `)
      .in('status', [...activeStatuses])
      .order('created_at', { ascending: false })
      .limit(100);

    if (!isAdmin && orgId) {
      const ot = orgType as string;
      if (ot === 'generator') query = query.eq('generator_id', orgId);
      else if (ot === 'transporter' || ot === 'transport_office') query = query.eq('transporter_id', orgId);
      else if (ot === 'recycler' || ot === 'disposal') query = query.eq('recycler_id', orgId);
    }

    const { data, error } = await query;
    if (!error && data) setShipments(data as unknown as TrackedShipment[]);
    setLoading(false);
    setLastRefresh(new Date());
  }, [orgId, orgType, isAdmin]);

  // ━━━ Fetch driver locations ━━━
  const fetchDrivers = useCallback(async () => {
    if (!orgId && !isAdmin) return;
    const ot = orgType as string;
    if (ot !== 'transporter' && ot !== 'transport_office' && !isAdmin) return;

    let query = supabase.from('drivers').select(`
      id, license_number, vehicle_type, vehicle_plate, is_available,
      profile:user_id(full_name, phone)
    `);
    if (!isAdmin && orgId) query = query.eq('organization_id', orgId);

    const { data } = await query.limit(50);
    if (data) {
      const driverIds = data.map(d => d.id);
      const locationPromises = driverIds.map(async (dId) => {
        const { data: locData } = await supabase
          .from('driver_location_logs')
          .select('latitude, longitude, speed, recorded_at')
          .eq('driver_id', dId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return { driverId: dId, location: locData };
      });

      const locations = await Promise.all(locationPromises);
      const locationMap = Object.fromEntries(locations.filter(l => l.location).map(l => [l.driverId, l.location]));

      setDrivers(data.map(d => {
        const loc = locationMap[d.id];
        const profile = d.profile as any;
        return {
          id: d.id, name: profile?.full_name || 'سائق',
          lat: loc?.latitude || 30.0, lng: loc?.longitude || 31.2,
          isOnline: d.is_available, vehiclePlate: d.vehicle_plate || undefined,
          phone: profile?.phone || undefined, currentShipment: null,
          speed: loc?.speed || null,
        };
      }).filter(d => d.lat !== 30.0 || d.lng !== 31.2));
    }
  }, [orgId, orgType, isAdmin]);

  // ━━━ Fetch intelligence from edge function ━━━
  const fetchIntelligence = useCallback(async () => {
    if (!orgId && !isAdmin) return;
    setIntelLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shipment-intelligence`, {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'batch-intelligence',
          organization_id: isAdmin ? undefined : orgId,
          org_type: isAdmin ? 'admin' : orgType,
        }),
      });
      const data = await res.json();
      if (data.shipments) setIntelligence(data.shipments);
    } catch (e) {
      console.error('Intelligence fetch failed:', e);
    }
    setIntelLoading(false);
  }, [orgId, orgType, isAdmin]);

  useEffect(() => {
    fetchShipments();
    fetchDrivers();
    fetchIntelligence();
  }, [fetchShipments, fetchDrivers, fetchIntelligence]);

  // Realtime subscription
  useEffect(() => {
    if (!orgId && !isAdmin) return;
    const channel = supabase
      .channel(getTabChannelName('tracking-center-shipments'))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'shipments' }, () => {
        fetchShipments();
        fetchIntelligence();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, isAdmin, fetchShipments, fetchIntelligence]);

  // Auto-refresh every 20s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchShipments();
      fetchDrivers();
      fetchIntelligence();
    }, 20000);
    return () => clearInterval(timer);
  }, [fetchShipments, fetchDrivers, fetchIntelligence]);

  // ━━━ Filtered shipments ━━━
  const filteredShipments = useMemo(() => {
    let result = shipments;
    if (statusFilter !== 'all') result = result.filter(s => mapLegacyStatus(s.status) === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.shipment_number.toLowerCase().includes(q) ||
        s.waste_type?.toLowerCase().includes(q) ||
        s.pickup_address?.toLowerCase().includes(q) ||
        s.delivery_address?.toLowerCase().includes(q) ||
        (s.generator as any)?.name?.toLowerCase().includes(q) ||
        (s.transporter as any)?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shipments, statusFilter, searchQuery]);

  // Map markers
  const shipmentMarkers = useMemo(() => {
    const markers: any[] = [];
    filteredShipments.forEach(s => {
      if (s.pickup_latitude && s.pickup_longitude) {
        markers.push({ position: { lat: s.pickup_latitude, lng: s.pickup_longitude }, title: `📦 ${s.shipment_number}`, label: s.pickup_address, type: 'pickup' as const });
      }
      if (s.delivery_latitude && s.delivery_longitude) {
        markers.push({ position: { lat: s.delivery_latitude, lng: s.delivery_longitude }, title: `📍 ${s.shipment_number}`, label: s.delivery_address, type: 'delivery' as const });
      }
    });
    return markers;
  }, [filteredShipments]);

  // Stats
  const stats = useMemo(() => ({
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    collecting: shipments.filter(s => s.status === 'collection_started' || s.status === 'collecting').length,
    approved: shipments.filter(s => s.status === 'approved').length,
    atDest: shipments.filter(s => s.status === 'at_destination' || s.status === 'delivered').length,
    driversOnline: drivers.filter(d => d.isOnline).length,
    totalDrivers: drivers.length,
    critical: intelligence.filter(i => i.route_health?.grade === 'critical').length,
    deviating: intelligence.filter(i => i.deviation?.isDeviating).length,
    avgHealth: intelligence.length > 0 ? Math.round(intelligence.reduce((sum, i) => sum + (i.route_health?.score ?? 100), 0) / intelligence.length) : 100,
  }), [shipments, drivers, intelligence]);

  const showDrivers = (orgType as string) === 'transporter' || (orgType as string) === 'transport_office' || isAdmin;

  const getIntel = (shipmentId: string) => intelligence.find(i => i.shipment_id === shipmentId);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              مركز الذكاء والتتبع الحي
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تتبع ذكي • ETA تلقائي • كشف انحراف المسار • تحديث حالة تلقائي
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('gap-1 text-xs', stats.avgHealth >= 80 ? 'text-emerald-600' : stats.avgHealth >= 50 ? 'text-amber-600' : 'text-red-600')}>
              <Shield className="w-3 h-3" /> صحة المسارات: {stats.avgHealth}%
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Radio className="w-3 h-3 text-primary animate-pulse" />
              {formatDistanceToNow(lastRefresh, { locale: ar, addSuffix: true })}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => { fetchShipments(); fetchDrivers(); fetchIntelligence(); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards - 8 metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {[
            { value: stats.total, label: 'شحنات نشطة', color: 'text-primary border-primary/20', icon: Package },
            { value: stats.inTransit, label: 'في الطريق', color: 'text-blue-600 border-blue-200', icon: Truck },
            { value: stats.collecting, label: 'جاري الجمع', color: 'text-amber-600 border-amber-200', icon: Crosshair },
            { value: stats.approved, label: 'معتمدة', color: 'text-green-600 border-green-200', icon: CheckCircle2 },
            { value: stats.atDest, label: 'وصلت', color: 'text-purple-600 border-purple-200', icon: MapPin },
            { value: `${stats.driversOnline}/${stats.totalDrivers}`, label: 'سائقين متصلين', color: 'text-emerald-600 border-emerald-200', icon: Wifi },
            { value: stats.deviating, label: 'انحراف مسار', color: stats.deviating > 0 ? 'text-red-600 border-red-200' : 'text-muted-foreground border-muted', icon: Compass },
            { value: stats.critical, label: 'حالات حرجة', color: stats.critical > 0 ? 'text-red-600 border-red-200 animate-pulse' : 'text-muted-foreground border-muted', icon: AlertTriangle },
          ].map((kpi, idx) => (
            <Card key={idx} className={cn('border', kpi.color.split(' ').slice(1).join(' '))}>
              <CardContent className="p-2.5 text-center">
                <kpi.icon className={cn('w-4 h-4 mx-auto mb-1', kpi.color.split(' ')[0])} />
                <p className={cn('text-xl font-bold', kpi.color.split(' ')[0])}>{kpi.value}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="intelligence" className="gap-1">
              <Brain className="w-4 h-4" /> الذكاء الحي
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1">
              <MapPin className="w-4 h-4" /> الخريطة
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-1">
              <Package className="w-4 h-4" /> الشحنات ({filteredShipments.length})
            </TabsTrigger>
            {showDrivers && (
              <TabsTrigger value="drivers" className="gap-1">
                <Truck className="w-4 h-4" /> السائقين
              </TabsTrigger>
            )}
          </TabsList>

          {/* ━━━ Intelligence Tab ━━━ */}
          <TabsContent value="intelligence" className="mt-4 space-y-3">
            {intelLoading && intelligence.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="mr-2 text-muted-foreground">تحليل الشحنات النشطة...</span>
              </div>
            ) : intelligence.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Brain className="w-12 h-12 mb-3 opacity-30" />
                  <p>لا توجد شحنات نشطة لتحليلها</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {intelligence.map(intel => {
                  const statusCfg = getStatusConfig(mapLegacyStatus(intel.status));
                  const shipment = shipments.find(s => s.id === intel.shipment_id);
                  return (
                    <Card
                      key={intel.shipment_id}
                      className={cn(
                        'transition-all hover:shadow-md cursor-pointer',
                        intel.route_health?.grade === 'critical' && 'border-red-300 bg-red-50/30',
                        intel.route_health?.grade === 'warning' && 'border-amber-300 bg-amber-50/20',
                        intel.deviation?.isDeviating && 'ring-1 ring-amber-400',
                        selectedShipment?.id === intel.shipment_id && 'ring-2 ring-primary'
                      )}
                      onClick={() => {
                        const s = shipments.find(sh => sh.id === intel.shipment_id);
                        if (s) setSelectedShipment(s);
                      }}
                    >
                      <CardContent className="p-4">
                        {/* Row 1: Header */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{intel.shipment_number}</p>
                            {statusCfg && (
                              <Badge variant="outline" className={cn("text-[10px] gap-1", statusCfg.textClass)}>
                                <statusCfg.icon className="w-3 h-3" />
                                {statusCfg.labelAr}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {intel.route_health && <HealthBadge grade={intel.route_health.grade} score={intel.route_health.score} />}
                            <ETABadge eta={intel.eta} />
                          </div>
                        </div>

                        <Separator className="my-2" />

                        {/* Row 2: Intelligence Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                          {/* Distance */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                              <Route className="w-3 h-3" /> المسافة
                            </div>
                            <p className="font-bold text-sm">
                              {intel.distance_km != null ? `${intel.distance_km} كم` : '—'}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {intel.target_type === 'pickup' ? 'للاستلام' : 'للتسليم'}
                            </p>
                          </div>

                          {/* Speed */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                              <Gauge className="w-3 h-3" /> السرعة
                            </div>
                            <p className={cn('font-bold text-sm', intel.speed_kmh && intel.speed_kmh > 120 ? 'text-red-600' : '')}>
                              {intel.speed_kmh != null ? `${intel.speed_kmh} كم/س` : '—'}
                            </p>
                            {intel.speed_kmh && intel.speed_kmh > 120 && (
                              <p className="text-[9px] text-red-500 font-bold">⚠️ مفرطة</p>
                            )}
                          </div>

                          {/* ETA */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                              <Timer className="w-3 h-3" /> الوصول المتوقع
                            </div>
                            <p className="font-bold text-sm">
                              {intel.eta ? intel.eta.etaFormatted : '—'}
                            </p>
                            {intel.eta && (
                              <p className="text-[9px] text-muted-foreground">
                                {new Date(intel.eta.arrivalTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>

                          {/* Deviation */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                              <Compass className="w-3 h-3" /> الانحراف
                            </div>
                            <p className={cn('font-bold text-sm', intel.deviation?.isDeviating ? 'text-red-600' : 'text-emerald-600')}>
                              {intel.deviation ? `${intel.deviation.deviationDegrees}°` : '—'}
                            </p>
                            <p className={cn('text-[9px]', intel.deviation?.isDeviating ? 'text-red-500' : 'text-emerald-500')}>
                              {intel.deviation?.isDeviating ? '↗ خارج المسار' : '✓ في المسار'}
                            </p>
                          </div>

                          {/* GPS Status */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                              {intel.gps_fresh ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                              GPS
                            </div>
                            <p className={cn('font-bold text-sm', intel.gps_fresh ? 'text-emerald-600' : 'text-red-600')}>
                              {intel.gps_fresh ? 'نشط' : 'ضعيف'}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {intel.gps_age_seconds < 60 ? `${intel.gps_age_seconds} ث` :
                               intel.gps_age_seconds < 3600 ? `${Math.round(intel.gps_age_seconds / 60)} د` :
                               `${Math.round(intel.gps_age_seconds / 3600)} س`}
                            </p>
                          </div>

                          {/* Route Health */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                              <Shield className="w-3 h-3" /> صحة المسار
                            </div>
                            <div className="flex items-center justify-center gap-1">
                              <Progress
                                value={intel.route_health?.score ?? 0}
                                className={cn('h-2 w-16', 
                                  (intel.route_health?.score ?? 0) >= 80 ? '[&>div]:bg-emerald-500' :
                                  (intel.route_health?.score ?? 0) >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                                )}
                              />
                              <span className="font-bold text-sm">{intel.route_health?.score ?? 0}%</span>
                            </div>
                            {intel.route_health?.issues?.length ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <p className="text-[9px] text-amber-600 cursor-help">
                                      {intel.route_health.issues.length} مشكلة
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="text-right">
                                    {intel.route_health.issues.map((issue, i) => (
                                      <p key={i} className="text-xs">• {issue}</p>
                                    ))}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}
                          </div>
                        </div>

                        {/* Row 3: Parties */}
                        {shipment && (
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground justify-end flex-wrap">
                            {shipment.generator && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {(shipment.generator as any).name}</span>}
                            {shipment.transporter && <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {(shipment.transporter as any).name}</span>}
                            {shipment.recycler && <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {(shipment.recycler as any).name}</span>}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ━━━ Map Tab ━━━ */}
          <TabsContent value="map" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-primary" />
                  الخريطة الموحدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeafletMultiDriverMap
                  drivers={showDrivers ? drivers : []}
                  markers={shipmentMarkers}
                  height="600px"
                  autoRefresh
                  refreshInterval={20000}
                  showControls={showDrivers}
                  onDriverClick={(dId) => {
                    const s = shipments.find(sh => sh.driver_id === dId);
                    if (s) setSelectedShipment(s);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ━━━ Shipments List Tab ━━━ */}
          <TabsContent value="shipments" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالرقم أو النوع أو العنوان..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {['all', ...activeStatuses].map(s => {
                  const label: Record<string, string> = { all: 'الكل', approved: 'معتمدة', collecting: 'جمع', in_transit: 'نقل', delivered: 'وصلت' };
                  return (
                    <Button key={s} variant={statusFilter === s ? 'default' : 'ghost'} size="sm" className="h-7 text-xs"
                      onClick={() => setStatusFilter(s)}>
                      {label[s] || s}
                    </Button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredShipments.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Package className="w-12 h-12 mb-3 opacity-30" /><p>لا توجد شحنات نشطة</p></CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {filteredShipments.map(shipment => {
                  const statusCfg = getStatusConfig(mapLegacyStatus(shipment.status));
                  const intel = getIntel(shipment.id);
                  return (
                    <Card key={shipment.id} className={cn('cursor-pointer transition-all hover:shadow-md hover:border-primary/30', selectedShipment?.id === shipment.id && 'ring-2 ring-primary border-primary')} onClick={() => setSelectedShipment(shipment)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/shipments/${shipment.id}`); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {statusCfg && <Badge variant="outline" className={cn("text-[10px] gap-1", statusCfg.textClass)}><statusCfg.icon className="w-3 h-3" />{statusCfg.labelAr}</Badge>}
                          </div>
                          <div className="text-right flex-1">
                            <p className="font-semibold text-sm">{shipment.shipment_number}</p>
                            <p className="text-xs text-muted-foreground mt-1">{shipment.waste_type} • {shipment.quantity} طن</p>
                          </div>
                        </div>
                        {/* Inline intelligence */}
                        {intel && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {intel.route_health && <HealthBadge grade={intel.route_health.grade} score={intel.route_health.score} />}
                            <ETABadge eta={intel.eta} />
                            {intel.distance_km != null && (
                              <Badge variant="outline" className="text-[10px] gap-1"><Route className="w-3 h-3" /> {intel.distance_km} كم</Badge>
                            )}
                            {intel.speed_kmh != null && (
                              <Badge variant="outline" className={cn("text-[10px] gap-1", intel.speed_kmh > 120 ? 'text-red-600' : '')}><Gauge className="w-3 h-3" /> {intel.speed_kmh} كم/س</Badge>
                            )}
                            {intel.deviation?.isDeviating && (
                              <Badge variant="outline" className="text-[10px] gap-1 text-red-600 bg-red-50"><Compass className="w-3 h-3" /> انحراف {intel.deviation.deviationDegrees}°</Badge>
                            )}
                          </div>
                        )}
                        <Separator className="my-2" />
                        <div className="grid grid-cols-2 gap-2 text-xs text-right">
                          <div className="flex items-center gap-1.5 justify-end"><span className="text-muted-foreground truncate">{shipment.pickup_address || '—'}</span><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /></div>
                          <div className="flex items-center gap-1.5 justify-end"><span className="text-muted-foreground truncate">{shipment.delivery_address || '—'}</span><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ━━━ Drivers Tab ━━━ */}
          {showDrivers && (
            <TabsContent value="drivers" className="mt-4">
              <LeafletMultiDriverMap
                drivers={drivers}
                height="600px"
                autoRefresh
                refreshInterval={15000}
                onDriverClick={(dId) => {
                  const s = shipments.find(sh => sh.driver_id === dId);
                  if (s) { setSelectedShipment(s); setActiveTab('shipments'); }
                }}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Selected Shipment Detail */}
        {selectedShipment && (
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setSelectedShipment(null)}>
                  <ChevronLeft className="w-4 h-4 ml-1" /> إغلاق
                </Button>
                <CardTitle className="text-base flex items-center gap-2">
                  <Route className="w-4 h-4 text-primary" />
                  مسار الشحنة {selectedShipment.shipment_number}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <LeafletShipmentTracking
                pickupCoords={selectedShipment.pickup_latitude && selectedShipment.pickup_longitude ? { lat: selectedShipment.pickup_latitude, lng: selectedShipment.pickup_longitude } : null}
                deliveryCoords={selectedShipment.delivery_latitude && selectedShipment.delivery_longitude ? { lat: selectedShipment.delivery_latitude, lng: selectedShipment.delivery_longitude } : null}
                driverCoords={selectedShipment.driver_id ? drivers.find(d => d.id === selectedShipment.driver_id) ? { lat: drivers.find(d => d.id === selectedShipment.driver_id)!.lat, lng: drivers.find(d => d.id === selectedShipment.driver_id)!.lng } : null : null}
                height="400px"
                showNavButtons
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button size="sm" onClick={() => navigate(`/dashboard/shipments/${selectedShipment.id}`)}>
                  <Eye className="w-4 h-4 ml-1" /> تفاصيل الشحنة
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrackingCenter;
