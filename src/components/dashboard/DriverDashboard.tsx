import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Truck,
  Mail,
  Phone,
  Settings,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  Map,
  Navigation,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import CreateShipmentButton from './CreateShipmentButton';
import DriverSettingsDialog from './DriverSettingsDialog';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import QuickLocationButton from '@/components/tracking/QuickLocationButton';
import LiveLocationIndicator from '@/components/tracking/LiveLocationIndicator';
import TrackingWatcherIndicator from '@/components/tracking/TrackingWatcherIndicator';
import EnhancedDestinationPicker from '@/components/driver/EnhancedDestinationPicker';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';

// Lazy load components for better performance
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const FullNavigationView = lazy(() => import('@/components/driver/FullNavigationView'));

interface DriverInfo {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  organization: {
    name: string;
    phone: string;
  } | null;
}

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  driver_id: string | null;
  expected_delivery_date: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  recycler_notes: string | null;
  generator: { name: string } | null;
  recycler: { name: string } | null;
  transporter: { name: string } | null;
}

const DriverDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [showLiveMapDialog, setShowLiveMapDialog] = useState(false);
  const [selectedShipmentForMap, setSelectedShipmentForMap] = useState<Shipment | null>(null);
  const [showNavigationView, setShowNavigationView] = useState(false);
  const [selectedShipmentForNav, setSelectedShipmentForNav] = useState<Shipment | null>(null);

  const handleLocationSuccess = (location: { lat: number; lng: number }) => {
    setLastLocationUpdate(new Date());
  };

  const handleOpenLiveMap = (shipment?: Shipment) => {
    if (shipment) {
      setSelectedShipmentForMap(shipment);
    } else {
      setSelectedShipmentForMap(null);
    }
    setShowLiveMapDialog(true);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchDriverData();
    }
  }, [profile?.id]);

  const fetchDriverData = async () => {
    try {
      // Fetch driver info
      const { data: driver } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          is_available,
          organization:organizations(name, phone)
        `)
        .eq('profile_id', profile?.id)
        .single();

      if (driver) {
        setDriverInfo(driver as unknown as DriverInfo);

        // Fetch shipments with simplified query
        const { data: shipmentsData } = await supabase
          .from('shipments')
          .select(`
            id,
            shipment_number,
            waste_type,
            quantity,
            unit,
            status,
            created_at,
            pickup_address,
            delivery_address,
            driver_id,
            expected_delivery_date,
            approved_at,
            collection_started_at,
            in_transit_at,
            delivered_at,
            confirmed_at,
            recycler_notes,
            generator_id,
            recycler_id,
            transporter_id
          `)
          .eq('driver_id', driver.id)
          .order('created_at', { ascending: false });

        if (shipmentsData) {
          // Fetch organizations for enrichment
          const orgIds: string[] = [];
          shipmentsData.forEach(s => {
            if (s.generator_id) orgIds.push(s.generator_id);
            if (s.recycler_id) orgIds.push(s.recycler_id);
            if (s.transporter_id) orgIds.push(s.transporter_id);
          });
          const uniqueOrgIds = [...new Set(orgIds)];

          const orgsMap: Record<string, { name: string }> = {};
          if (uniqueOrgIds.length > 0) {
            const { data: orgsData } = await supabase
              .from('organizations')
              .select('id, name')
              .in('id', uniqueOrgIds);
            orgsData?.forEach(o => { orgsMap[o.id] = { name: o.name }; });
          }

          const enriched = shipmentsData.map(s => ({
            ...s,
            generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
            recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
            transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
          }));

          setShipments(enriched as unknown as Shipment[]);
        }
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status));
  const completedShipments = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold">لوحة تحكم السائق</h1>
          <p className="text-primary">
            مرحباً، {profile?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Driver Status Indicators */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border">
            {/* Tracking Status */}
            <LiveLocationIndicator
              isTracking={!!lastLocationUpdate}
              lastUpdate={lastLocationUpdate}
              signalStrength={lastLocationUpdate ? 'good' : 'offline'}
            />
            
            {/* Availability Status */}
            <div className="flex items-center gap-1.5 border-r pr-2 mr-1">
              <div className={`w-2.5 h-2.5 rounded-full ${driverInfo?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
              <span className="text-xs font-medium">
                {driverInfo?.is_available ? 'نشط' : 'غير نشط'}
              </span>
            </div>
          </div>

          {/* Watcher Indicator - Shows if someone is tracking this driver */}
          {driverInfo && (
            <TrackingWatcherIndicator driverId={driverInfo.id} />
          )}

          {driverInfo && (
            <>
              <QuickLocationButton 
                driverId={driverInfo.id} 
                variant="icon"
                onSuccess={handleLocationSuccess}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenLiveMap()}
                className="gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20"
              >
                <Map className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">عرض موقعي</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/navigation-demo')}
                className="gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
              >
                <Navigation className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">عرض توضيحي</span>
              </Button>
            </>
          )}
          <CreateShipmentButton 
            variant="eco" 
            onSuccess={fetchDriverData}
          />
          <Button 
            variant="outline" 
            onClick={() => setShowSettingsDialog(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            إعدادات الحساب
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                  {driverInfo?.organization && (
                    <p className="text-muted-foreground">{driverInfo.organization.name}</p>
                  )}
                </div>
                <Badge variant={driverInfo?.is_available ? 'default' : 'secondary'} className="w-fit">
                  {driverInfo?.is_available ? 'متاح' : 'غير متاح'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{profile?.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>رخصة: {driverInfo?.license_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>{driverInfo?.vehicle_plate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Shipments Quick Access Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">شحناتي</h3>
                <p className="text-sm text-muted-foreground">إدارة ومتابعة الشحنات المسندة إليك</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard/transporter-shipments')}
              className="flex items-center gap-2"
            >
              عرض الكل
              <Truck className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <div className="text-2xl font-bold text-primary">{shipments.length}</div>
              <p className="text-xs text-muted-foreground">إجمالي الشحنات</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <div className="text-2xl font-bold text-blue-500">{activeShipments.length}</div>
              <p className="text-xs text-muted-foreground">شحنات نشطة</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <div className="text-2xl font-bold text-green-500">{completedShipments.length}</div>
              <p className="text-xs text-muted-foreground">شحنات مكتملة</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <div className="text-2xl font-bold text-amber-500">{driverInfo?.vehicle_type || '-'}</div>
              <p className="text-xs text-muted-foreground">نوع المركبة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <QuickActionsGrid
        actions={useQuickActions({
          type: 'driver',
          handlers: {
            openLiveMap: () => handleOpenLiveMap(),
            openSettings: () => setShowSettingsDialog(true),
          },
        })}
        title="الإجراءات السريعة"
        subtitle="الوظائف المستخدمة بكثرة"
      />

      {/* Destination Picker Card */}
      {driverInfo && (
        <EnhancedDestinationPicker 
          driverId={driverInfo.id} 
          onDestinationAdded={fetchDriverData}
        />
      )}

      {/* Shipments Tabs - Using ShipmentCard like Transporter Dashboard */}
      <Tabs defaultValue="active" className="w-full" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            نشطة ({activeShipments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            مكتملة ({completedShipments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="space-y-3">
            {activeShipments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد شحنات نشطة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              activeShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onStatusChange={fetchDriverData}
                  variant="full"
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="space-y-3">
            {completedShipments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد شحنات مكتملة</p>
                </CardContent>
              </Card>
            ) : (
              completedShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onStatusChange={fetchDriverData}
                  variant="full"
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <DriverSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        driverId={driverInfo?.id || ''}
        onUpdate={fetchDriverData}
      />

      {/* Live Tracking Map Dialog */}
      {showLiveMapDialog && driverInfo && (
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <LiveTrackingMapDialog
            isOpen={showLiveMapDialog}
            onClose={() => setShowLiveMapDialog(false)}
            driverId={driverInfo.id}
            shipmentNumber={selectedShipmentForMap?.shipment_number || ''}
            pickupAddress={selectedShipmentForMap?.pickup_address || ''}
            deliveryAddress={selectedShipmentForMap?.delivery_address || ''}
            shipmentStatus={selectedShipmentForMap?.status}
          />
        </Suspense>
      )}

      {/* Full Navigation View */}
      {showNavigationView && driverInfo && selectedShipmentForNav && (
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <FullNavigationView
            isOpen={showNavigationView}
            onClose={() => setShowNavigationView(false)}
            pickupAddress={selectedShipmentForNav.pickup_address}
            deliveryAddress={selectedShipmentForNav.delivery_address}
            shipmentId={selectedShipmentForNav.id}
            driverId={driverInfo.id}
          />
        </Suspense>
      )}

      {/* Floating Action Button for Quick Location */}
      {driverInfo && (
        <QuickLocationButton 
          driverId={driverInfo.id} 
          variant="fab"
          onSuccess={handleLocationSuccess}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
