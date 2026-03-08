import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MapPin, Truck, Package, Search, Loader2, RefreshCw,
  Navigation, Eye, Radio, Clock, Activity, Filter,
  ChevronLeft, Satellite, AlertTriangle, CheckCircle2,
  ArrowUpDown, Maximize2, Building2, Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getStatusConfig, mapLegacyStatus } from '@/lib/shipmentStatusConfig';
import { geocodeAddress, calculateHaversineDistance, formatDistance } from '@/lib/mapUtils';
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

const activeStatuses = ['approved', 'collection_started', 'in_transit', 'at_destination'];

const TrackingCenter = () => {
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<TrackedShipment[]>([]);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<TrackedShipment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('map');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const isAdmin = roles.includes('admin');
  const orgType = organization?.organization_type;
  const orgId = organization?.id;

  // Fetch active shipments based on org type
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
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(100);

    // Filter by org role
    if (!isAdmin && orgId) {
      if (orgType === 'generator') {
        query = query.eq('generator_id', orgId);
      } else if (orgType === 'transporter' || orgType === 'transport_office') {
        query = query.eq('transporter_id', orgId);
      } else if (orgType === 'recycler') {
        query = query.eq('recycler_id', orgId);
      } else if (orgType === 'disposal') {
        query = query.eq('recycler_id', orgId);
      }
    }

    const { data, error } = await query;
    if (!error && data) {
      setShipments(data as unknown as TrackedShipment[]);
    }
    setLoading(false);
    setLastRefresh(new Date());
  }, [orgId, orgType, isAdmin]);

  // Fetch driver locations (for transporters and admin)
  const fetchDrivers = useCallback(async () => {
    if (!orgId && !isAdmin) return;
    if (orgType !== 'transporter' && orgType !== 'transport_office' && !isAdmin) return;

    let query = supabase
      .from('drivers')
      .select(`
        id, license_number, vehicle_type, vehicle_plate, is_available,
        profile:user_id(full_name, phone)
      `);

    if (!isAdmin && orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data } = await query.limit(50);
    if (data) {
      // Fetch latest locations
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
      const locationMap = Object.fromEntries(
        locations.filter(l => l.location).map(l => [l.driverId, l.location])
      );

      setDrivers(data.map(d => {
        const loc = locationMap[d.id];
        const profile = d.profile as any;
        return {
          id: d.id,
          name: profile?.full_name || 'سائق',
          lat: loc?.latitude || 30.0,
          lng: loc?.longitude || 31.2,
          isOnline: d.is_available,
          vehiclePlate: d.vehicle_plate || undefined,
          phone: profile?.phone || undefined,
          currentShipment: null,
          speed: loc?.speed || null,
        };
      }).filter(d => d.lat !== 30.0 || d.lng !== 31.2)); // Only with real locations
    }
  }, [orgId, orgType, isAdmin]);

  useEffect(() => {
    fetchShipments();
    fetchDrivers();
  }, [fetchShipments, fetchDrivers]);

  // Realtime subscription for shipment updates
  useEffect(() => {
    if (!orgId && !isAdmin) return;

    const channel = supabase
      .channel(getTabChannelName('tracking-center-shipments'))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'shipments',
      }, () => {
        fetchShipments();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orgId, isAdmin, fetchShipments]);

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchShipments();
      fetchDrivers();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchShipments, fetchDrivers]);

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    let result = shipments;
    if (statusFilter !== 'all') {
      result = result.filter(s => mapLegacyStatus(s.status) === statusFilter);
    }
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

  // Map markers from shipments
  const shipmentMarkers = useMemo(() => {
    const markers: any[] = [];
    filteredShipments.forEach(s => {
      if (s.pickup_latitude && s.pickup_longitude) {
        markers.push({
          position: { lat: s.pickup_latitude, lng: s.pickup_longitude },
          title: `📦 ${s.shipment_number}`,
          label: s.pickup_address,
          type: 'pickup' as const,
        });
      }
      if (s.delivery_latitude && s.delivery_longitude) {
        markers.push({
          position: { lat: s.delivery_latitude, lng: s.delivery_longitude },
          title: `📍 ${s.shipment_number}`,
          label: s.delivery_address,
          type: 'delivery' as const,
        });
      }
    });
    return markers;
  }, [filteredShipments]);

  // Stats
  const stats = useMemo(() => ({
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    collecting: shipments.filter(s => s.status === 'collection_started').length,
    approved: shipments.filter(s => s.status === 'approved').length,
    atDest: shipments.filter(s => s.status === 'at_destination').length,
    driversOnline: drivers.filter(d => d.isOnline).length,
    totalDrivers: drivers.length,
  }), [shipments, drivers]);

  const showDrivers = orgType === 'transporter' || orgType === 'transport_office' || isAdmin;

  const orgLabel = useMemo(() => {
    const labels: Record<string, string> = {
      generator: 'المُولّد',
      transporter: 'الناقل',
      transport_office: 'مكتب النقل',
      recycler: 'المُدوّر',
      disposal: 'جهة التخلص',
    };
    return labels[orgType || ''] || 'المنظمة';
  }, [orgType]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Satellite className="w-6 h-6 text-primary" />
              </div>
              مركز التتبع المباشر
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              تتبع كل شحناتك {showDrivers ? 'وسائقيك ' : ''}في الوقت الفعلي — {orgLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Radio className="w-3 h-3 text-primary animate-pulse" />
              آخر تحديث: {formatDistanceToNow(lastRefresh, { locale: ar, addSuffix: true })}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => { fetchShipments(); fetchDrivers(); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">شحنات نشطة</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
              <p className="text-[10px] text-muted-foreground">في الطريق</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.collecting}</p>
              <p className="text-[10px] text-muted-foreground">جاري الجمع</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-[10px] text-muted-foreground">معتمدة</p>
            </CardContent>
          </Card>
          <Card className="border-purple-500/20">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.atDest}</p>
              <p className="text-[10px] text-muted-foreground">في الوجهة</p>
            </CardContent>
          </Card>
          {showDrivers && (
            <Card className="border-emerald-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.driversOnline}/{stats.totalDrivers}</p>
                <p className="text-[10px] text-muted-foreground">سائقين متصلين</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="map" className="gap-1">
              <MapPin className="w-4 h-4" /> الخريطة الموحدة
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-1">
              <Package className="w-4 h-4" /> الشحنات ({filteredShipments.length})
            </TabsTrigger>
            {showDrivers && (
              <TabsTrigger value="drivers" className="gap-1">
                <Truck className="w-4 h-4" /> السائقين ({drivers.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Unified Map Tab */}
          <TabsContent value="map" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Satellite className="w-5 h-5 text-primary" />
                    الخريطة الموحدة — كل الشحنات {showDrivers ? '+ السائقين' : ''}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Package className="w-3 h-3" /> {filteredShipments.length} شحنة
                    </Badge>
                    {showDrivers && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Truck className="w-3 h-3" /> {drivers.length} سائق
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LeafletMultiDriverMap
                  drivers={showDrivers ? drivers : []}
                  markers={shipmentMarkers}
                  height="600px"
                  autoRefresh
                  refreshInterval={30000}
                  showControls={showDrivers}
                  onDriverClick={(dId) => {
                    const shipment = shipments.find(s => s.driver_id === dId);
                    if (shipment) setSelectedShipment(shipment);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipments List Tab */}
          <TabsContent value="shipments" className="mt-4 space-y-4">
            {/* Filters */}
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
                  const label: Record<string, string> = {
                    all: 'الكل',
                    approved: 'معتمدة',
                    collection_started: 'جمع',
                    in_transit: 'نقل',
                    at_destination: 'وصلت',
                  };
                  return (
                    <Button
                      key={s}
                      variant={statusFilter === s ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setStatusFilter(s)}
                    >
                      {label[s] || s}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Shipment Cards */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="w-12 h-12 mb-3 opacity-30" />
                  <p>لا توجد شحنات نشطة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredShipments.map(shipment => {
                  const statusCfg = getStatusConfig(mapLegacyStatus(shipment.status));
                  const StatusIcon = statusCfg.icon;
                  return (
                    <Card
                      key={shipment.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
                        selectedShipment?.id === shipment.id && 'ring-2 ring-primary border-primary'
                      )}
                      onClick={() => setSelectedShipment(shipment)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/dashboard/shipments/${shipment.id}`);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Badge
                              variant="outline"
                              className="text-[10px] gap-1"
                              style={{ color: statusCfg.color, borderColor: statusCfg.color }}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <div className="text-right flex-1">
                            <p className="font-semibold text-sm">{shipment.shipment_number}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {shipment.waste_type} • {shipment.quantity} طن
                            </p>
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-muted-foreground truncate">{shipment.pickup_address || '—'}</span>
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-muted-foreground truncate">{shipment.delivery_address || '—'}</span>
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          </div>
                        </div>

                        {/* Parties */}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground justify-end flex-wrap">
                          {shipment.generator && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {(shipment.generator as any).name}
                            </span>
                          )}
                          {shipment.transporter && (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" /> {(shipment.transporter as any).name}
                            </span>
                          )}
                          {shipment.recycler && (
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {(shipment.recycler as any).name}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Drivers Tab */}
          {showDrivers && (
            <TabsContent value="drivers" className="mt-4">
              <LeafletMultiDriverMap
                drivers={drivers}
                height="600px"
                autoRefresh
                refreshInterval={15000}
                onDriverClick={(dId) => {
                  const shipment = shipments.find(s => s.driver_id === dId);
                  if (shipment) {
                    setSelectedShipment(shipment);
                    setActiveTab('shipments');
                  }
                }}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Selected Shipment Detail Map */}
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
                pickupCoords={
                  selectedShipment.pickup_latitude && selectedShipment.pickup_longitude
                    ? { lat: selectedShipment.pickup_latitude, lng: selectedShipment.pickup_longitude }
                    : null
                }
                deliveryCoords={
                  selectedShipment.delivery_latitude && selectedShipment.delivery_longitude
                    ? { lat: selectedShipment.delivery_latitude, lng: selectedShipment.delivery_longitude }
                    : null
                }
                driverCoords={
                  selectedShipment.driver_id
                    ? drivers.find(d => d.id === selectedShipment.driver_id)
                      ? { lat: drivers.find(d => d.id === selectedShipment.driver_id)!.lat, lng: drivers.find(d => d.id === selectedShipment.driver_id)!.lng }
                      : null
                    : null
                }
                height="400px"
                showNavButtons
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => navigate(`/dashboard/shipments/${selectedShipment.id}`)}
                >
                  <Eye className="w-4 h-4 ml-1" /> عرض تفاصيل الشحنة
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
