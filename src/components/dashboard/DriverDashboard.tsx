import { useEffect, useState, lazy, Suspense } from 'react';
import { useDriverOffers } from '@/hooks/useDriverOffers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Truck, Mail, Phone, Settings, CheckCircle2,
  Clock, Loader2, Shield, Map, Navigation, ListTodo,
  Trophy, BarChart3, Wallet, Camera, FileText,
  ClipboardCheck, Activity, PenTool, DollarSign,
  Radiation, QrCode, GraduationCap, Route,
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
import DriverOwnLinkingCode from '@/components/drivers/DriverOwnLinkingCode';
import DriverAssignmentAlert from '@/components/driver/DriverAssignmentAlert';
import DriverDailyTasks from '@/components/driver/DriverDailyTasks';
import SmartDailyBrief from './shared/SmartDailyBrief';
import DriverDailySummary from '@/components/driver/DriverDailySummary';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// Lazy load heavy components
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const FullNavigationView = lazy(() => import('@/components/driver/FullNavigationView'));
const DriverRewardsPanel = lazy(() => import('@/components/driver/DriverRewardsPanel'));
const DriverWalletPanel = lazy(() => import('@/components/driver/DriverWalletPanel'));
const DriverLeaderboard = lazy(() => import('@/components/driver/DriverLeaderboard'));
const DriverSmartCamera = lazy(() => import('@/components/driver/DriverSmartCamera'));
const DriverAutoReport = lazy(() => import('@/components/driver/DriverAutoReport'));
const DriverSOSButton = lazy(() => import('@/components/driver/DriverSOSButton'));
const DriverPreTripChecklist = lazy(() => import('@/components/driver/DriverPreTripChecklist'));
const DriverFatigueMonitor = lazy(() => import('@/components/driver/DriverFatigueMonitor'));
const DriverDeliverySignature = lazy(() => import('@/components/driver/DriverDeliverySignature'));
const DriverEarningsDashboard = lazy(() => import('@/components/driver/DriverEarningsDashboard'));
const WasteClassifierCamera = lazy(() => import('@/components/driver/WasteClassifierCamera'));
const DigitalManifest = lazy(() => import('@/components/driver/DigitalManifest'));
const DriverAcademy = lazy(() => import('@/components/driver/DriverAcademy'));
const SmartRouteOptimizer = lazy(() => import('@/components/driver/SmartRouteOptimizer'));
const DriverOfferPopup = lazy(() => import('@/components/driver/DriverOfferPopup'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

interface DriverInfo {
  id: string;
  organization_id: string;
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

const tabItems = [
  { value: 'tasks', label: 'المهام', icon: ListTodo },
  { value: 'checklist', label: 'الفحص', icon: ClipboardCheck },
  { value: 'shipments', label: 'الشحنات', icon: Package },
  { value: 'classify', label: 'التصنيف', icon: Radiation },
  { value: 'manifest', label: 'المانيفست', icon: QrCode },
  { value: 'academy', label: 'الأكاديمية', icon: GraduationCap },
  { value: 'routes', label: 'المسارات', icon: Route },
  { value: 'wallet', label: 'المحفظة', icon: Wallet },
  { value: 'earnings', label: 'الأرباح', icon: DollarSign },
  { value: 'safety', label: 'السلامة', icon: Shield },
  { value: 'camera', label: 'الكاميرا', icon: Camera },
  { value: 'signature', label: 'التوقيع', icon: PenTool },
  { value: 'report', label: 'التقرير', icon: FileText },
  { value: 'profile', label: 'الملف', icon: BarChart3 },
];

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

  const { pendingOffer, acceptOffer, rejectOffer, counterOffer } = useDriverOffers();

  const quickActions = useQuickActions({
    type: 'driver',
    handlers: {
      openLiveMap: () => handleOpenLiveMap(),
      openSettings: () => setShowSettingsDialog(true),
    },
  });

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

  const handleNavigateToShipment = (shipment: Shipment) => {
    // Open Google Maps with the delivery address
    const address = shipment.status === 'approved' ? shipment.pickup_address : shipment.delivery_address;
    if (address) {
      const encoded = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
    } else {
      setSelectedShipmentForNav(shipment);
      setShowNavigationView(true);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchDriverData();
    }
  }, [profile?.id]);

  const fetchDriverData = async () => {
    try {
      const { data: driver } = await supabase
        .from('drivers')
        .select(`id, organization_id, license_number, vehicle_type, vehicle_plate, is_available, organization:organizations(name, phone)`)
        .eq('profile_id', profile?.id)
        .single();

      if (driver) {
        setDriverInfo(driver as unknown as DriverInfo);

        const { data: shipmentsData } = await supabase
          .from('shipments')
          .select(`id, shipment_number, waste_type, quantity, unit, status, created_at, pickup_address, delivery_address, driver_id, expected_delivery_date, approved_at, collection_started_at, in_transit_at, delivered_at, confirmed_at, recycler_notes, generator_id, recycler_id, transporter_id`)
          .eq('driver_id', driver.id)
          .order('created_at', { ascending: false });

        if (shipmentsData) {
          const orgIds: string[] = [];
          shipmentsData.forEach(s => {
            if (s.generator_id) orgIds.push(s.generator_id);
            if (s.recycler_id) orgIds.push(s.recycler_id);
            if (s.transporter_id) orgIds.push(s.transporter_id);
          });
          const uniqueOrgIds = [...new Set(orgIds)];
          const orgsMap: Record<string, { name: string }> = {};
          if (uniqueOrgIds.length > 0) {
            const { data: orgsData } = await supabase.from('organizations').select('id, name').in('id', uniqueOrgIds);
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
    <div className="space-y-4">
      {/* Smart Daily Brief */}
      <SmartDailyBrief
        role="driver"
        stats={{
          pending: shipments.filter(s => s.status === 'new').length,
          active: activeShipments.length,
          completed: completedShipments.length,
          total: shipments.length,
        }}
      />

      {/* Compact Header with Status */}
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {profile?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${driverInfo?.is_available ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
          </div>
          <div>
            <span className="text-xs font-medium">
              {driverInfo?.is_available ? '🟢 متاح للمهام' : '⚫ غير متاح'}
            </span>
            {driverInfo?.vehicle_plate && (
              <p className="text-[10px] text-muted-foreground">{driverInfo.vehicle_plate}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {driverInfo && (
            <>
              <LiveLocationIndicator
                isTracking={!!lastLocationUpdate}
                lastUpdate={lastLocationUpdate}
                signalStrength={lastLocationUpdate ? 'good' : 'offline'}
              />
              <TrackingWatcherIndicator driverId={driverInfo.id} />
              <QuickLocationButton 
                driverId={driverInfo.id} 
                variant="icon"
                onSuccess={handleLocationSuccess}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpenLiveMap()}
              >
                <Map className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Driver Assignment Alert */}
      <DriverAssignmentAlert />

      {/* Daily Summary */}
      <DriverDailySummary 
        shipments={shipments as any} 
        driverName={profile?.full_name || 'السائق'} 
      />

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="tasks" className="w-full" dir="rtl">
          <div className="relative overflow-x-auto rounded-xl border border-border/50 bg-card p-1 scrollbar-hide">
            <TabsList className="w-max min-w-full justify-start bg-transparent gap-1 h-auto p-0 flex-nowrap">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="whitespace-nowrap text-xs gap-1.5 px-3 py-2.5 rounded-lg text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-sm hover:text-foreground transition-all"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4">
            <DriverDailyTasks
              shipments={shipments}
              onNavigate={handleNavigateToShipment}
              onViewDetails={(s) => navigate(`/dashboard/shipment/${s.id}`)}
            />
          </TabsContent>

          {/* Pre-Trip Checklist Tab */}
          <TabsContent value="checklist" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DriverPreTripChecklist driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <CreateShipmentButton variant="eco" onSuccess={fetchDriverData} />
            </div>

            <Tabs defaultValue="active" className="w-full" dir="rtl">
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="active" className="gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  نشطة ({activeShipments.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  مكتملة ({completedShipments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-3">
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
                      <div key={shipment.id} className="flex flex-col gap-2">
                        <div className="flex gap-3">
                          <div className="flex-1 min-w-0">
                            <ShipmentCard
                              shipment={shipment}
                              onStatusChange={fetchDriverData}
                              variant="full"
                            />
                          </div>
                          <Card className="w-[180px] flex-shrink-0 overflow-hidden">
                            <div className="h-full min-h-[140px] relative">
                              <iframe
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                  shipment.status === 'approved' ? shipment.pickup_address : shipment.delivery_address
                                )}&z=14&output=embed`}
                                width="100%"
                                height="100%"
                                style={{ border: 'none', minHeight: '140px' }}
                                loading="lazy"
                                title={`خريطة ${shipment.shipment_number}`}
                              />
                              <button
                                type="button"
                                className="absolute bottom-1 left-1 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] font-medium flex items-center gap-1 shadow-sm border hover:bg-background transition-colors"
                                onClick={() => handleNavigateToShipment(shipment)}
                              >
                                <Navigation className="w-3 h-3 text-primary" />
                                ابدأ
                              </button>
                            </div>
                          </Card>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-3">
                <div className="space-y-3">
                  {completedShipments.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد شحنات مكتملة</p>
                      </CardContent>
                    </Card>
                  ) : (
                    completedShipments.slice(0, 10).map((shipment) => (
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
          </TabsContent>

          {/* AI Waste Classifier Tab */}
          <TabsContent value="classify" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <WasteClassifierCamera driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* Digital Manifest Tab */}
          <TabsContent value="manifest" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DigitalManifest driverId={driverInfo.id} shipment={activeShipments[0] as any} />}
            </Suspense>
          </TabsContent>

          {/* Driver Academy Tab */}
          <TabsContent value="academy" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DriverAcademy driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* Smart Route Optimizer Tab */}
          <TabsContent value="routes" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <SmartRouteOptimizer shipments={shipments as any} />
            </Suspense>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <DriverWalletPanel />
              <div className="mt-4">
                <DriverRewardsPanel />
              </div>
              <div className="mt-4">
                <DriverLeaderboard />
              </div>
            </Suspense>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <DriverEarningsDashboard />
            </Suspense>
          </TabsContent>

          {/* Safety Tab (Fatigue Monitor) */}
          <TabsContent value="safety" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DriverFatigueMonitor driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* Smart Camera Tab */}
          <TabsContent value="camera" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && (
                <div className="space-y-4">
                  <DriverSmartCamera driverId={driverInfo.id} type="load" />
                  <DriverSmartCamera driverId={driverInfo.id} type="scale" />
                  <DriverSmartCamera driverId={driverInfo.id} type="delivery" />
                </div>
              )}
            </Suspense>
          </TabsContent>

          {/* Signature Tab */}
          <TabsContent value="signature" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DriverDeliverySignature driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* Auto Report Tab */}
          <TabsContent value="report" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <DriverAutoReport />
            </Suspense>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {profile?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h2 className="text-lg font-bold">{profile?.full_name}</h2>
                      {driverInfo?.organization && (
                        <p className="text-sm text-muted-foreground">{driverInfo.organization.name}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate text-xs">{profile?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span dir="ltr" className="text-xs">{profile?.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">رخصة: {driverInfo?.license_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{driverInfo?.vehicle_plate || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DriverOwnLinkingCode />

            {driverInfo && (
              <EnhancedDestinationPicker 
                driverId={driverInfo.id} 
                onDestinationAdded={fetchDriverData}
              />
            )}

            <QuickActionsGrid
              actions={quickActions}
              title="الإجراءات السريعة"
              subtitle="الوظائف المستخدمة بكثرة"
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <DriverSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        driverId={driverInfo?.id || ''}
        onUpdate={fetchDriverData}
      />

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

      {/* Floating Quick Location */}
      {driverInfo && (
        <>
          <QuickLocationButton 
            driverId={driverInfo.id} 
            variant="fab"
            onSuccess={handleLocationSuccess}
          />
          <Suspense fallback={null}>
            <DriverSOSButton 
              driverId={driverInfo.id} 
              organizationId={driverInfo.organization_id}
            />
          </Suspense>
        </>
      )}

      {/* DiDi-style popup for incoming offers */}
      {pendingOffer && (
        <Suspense fallback={null}>
          <DriverOfferPopup
            offer={pendingOffer}
            onAccept={acceptOffer}
            onReject={rejectOffer}
            onCounter={counterOffer}
          />
        </Suspense>
      )}
    </div>
  );
};

export default DriverDashboard;
