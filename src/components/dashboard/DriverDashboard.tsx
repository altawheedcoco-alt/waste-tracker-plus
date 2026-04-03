import { useState, useMemo, lazy, Suspense } from 'react';
import { useDriverOffers } from '@/hooks/useDriverOffers';
import { useAuth } from '@/contexts/AuthContext';
import { useDriverSmartLocation } from '@/hooks/useDriverSmartLocation';
import DriverLocationToggle from '@/components/driver/DriverLocationToggle';
import { useDriverDashboardData, type DriverShipment } from '@/hooks/useDriverDashboardData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Truck, Mail, Phone, Settings, CheckCircle2,
  Clock, Map, Navigation, ListTodo,
  Wallet, Camera, ClipboardCheck, PenTool,
  Radiation, QrCode, GraduationCap, Route, Wrench, User,
  Briefcase, Zap, Star, BarChart3, ShoppingCart, CreditCard,
  Power, Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateShipmentButton from './CreateShipmentButton';
import DriverSettingsDialog from './DriverSettingsDialog';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import QuickLocationButton from '@/components/tracking/QuickLocationButton';
import LiveLocationIndicator from '@/components/tracking/LiveLocationIndicator';
import TrackingWatcherIndicator from '@/components/tracking/TrackingWatcherIndicator';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import DriverOwnLinkingCode from '@/components/drivers/DriverOwnLinkingCode';
import DriverLinkedOrganizations from '@/components/driver/DriverLinkedOrganizations';
import DriverCredentialsEditor from '@/components/driver/DriverCredentialsEditor';
import DriverTypeBadge from '@/components/drivers/DriverTypeBadge';
import type { DriverType } from '@/types/driver-types';
import DriverAssignmentAlert from '@/components/driver/DriverAssignmentAlert';
import DriverDailyTasks from '@/components/driver/DriverDailyTasks';
import ConnectedSmartBrief from './shared/ConnectedSmartBrief';
import DriverDailySummary from '@/components/driver/DriverDailySummary';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// Lazy load heavy components
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const FullNavigationView = lazy(() => import('@/components/driver/FullNavigationView'));
const DriverRewardsPanel = lazy(() => import('@/components/driver/DriverRewardsPanel'));
const DriverWalletPanel = lazy(() => import('@/components/driver/DriverWalletPanel'));
const DriverSmartCamera = lazy(() => import('@/components/driver/DriverSmartCamera'));
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
const EnhancedDestinationPicker = lazy(() => import('@/components/driver/DestinationPicker'));
const IndependentOffersPanel = lazy(() => import('@/components/driver/IndependentOffersPanel'));
const HiredContractsPanel = lazy(() => import('@/components/driver/HiredContractsPanel'));
const DriverPublicProfile = lazy(() => import('@/components/driver/DriverPublicProfile'));
const DriverAnalyticsPanel = lazy(() => import('@/components/driver/DriverAnalyticsPanel'));
const ShipmentMarketplace = lazy(() => import('@/components/driver/ShipmentMarketplace'));
const DriverFinancialWallet = lazy(() => import('@/components/driver/DriverFinancialWallet'));
const GoOnlineButton = lazy(() => import('@/components/driver/GoOnlineButton'));
const EarningsMiniCard = lazy(() => import('@/components/driver/EarningsMiniCard'));
const CompanyDriverStats = lazy(() => import('@/components/driver/CompanyDriverStats'));
const DemandHeatmapDriver = lazy(() => import('@/components/maps/DemandHeatmapDriver'));
const TripLifecyclePanel = lazy(() => import('@/components/driver/TripLifecyclePanel'));
const DriverQuickFAB = lazy(() => import('@/components/driver/DriverQuickFAB'));

import DriverPerformanceStrip from '@/components/driver/DriverPerformanceStrip';
import DriverTodayProgress from '@/components/driver/DriverTodayProgress';

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

// Skeleton loading for the entire dashboard
const DriverDashboardSkeleton = () => (
  <div className="space-y-3 pb-20">
    {/* Header skeleton */}
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
    {/* Summary skeleton */}
    <Skeleton className="h-20 w-full rounded-xl" />
    {/* Tabs skeleton */}
    <Skeleton className="h-10 w-full rounded-xl" />
    {/* Content skeleton */}
    <div className="space-y-3">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  </div>
);

// Tab configuration per driver type
const companyTabs = [
  { value: 'tasks', label: 'المهام', icon: ListTodo },
  { value: 'shipments', label: 'الشحنات', icon: Package },
  { value: 'field', label: 'الميدان', icon: Wrench },
  { value: 'finance', label: 'المالية', icon: Wallet },
  { value: 'analytics', label: 'أدائي', icon: BarChart3 },
  { value: 'account', label: 'حسابي', icon: User },
];

const hiredTabs = [
  { value: 'tasks', label: 'المهام', icon: ListTodo },
  { value: 'shipments', label: 'الشحنات', icon: Package },
  { value: 'marketplace', label: 'السوق', icon: ShoppingCart },
  { value: 'offers', label: 'العروض', icon: Zap },
  { value: 'contracts', label: 'العقود', icon: Briefcase },
  { value: 'field', label: 'أدوات الميدان', icon: Wrench },
  { value: 'wallet', label: 'المحفظة', icon: CreditCard },
  { value: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { value: 'profile', label: 'ملفي المهني', icon: Star },
  { value: 'account', label: 'حسابي', icon: User },
];

const independentTabs = [
  { value: 'home', label: 'الرئيسية', icon: Power },
  { value: 'offers', label: 'العروض', icon: Zap },
  { value: 'marketplace', label: 'السوق', icon: ShoppingCart },
  { value: 'tasks', label: 'المهام', icon: ListTodo },
  { value: 'shipments', label: 'الشحنات', icon: Package },
  { value: 'field', label: 'الميدان', icon: Wrench },
  { value: 'wallet', label: 'المحفظة', icon: CreditCard },
  { value: 'analytics', label: 'التحليلات', icon: BarChart3 },
  { value: 'profile', label: 'ملفي', icon: Star },
  { value: 'account', label: 'حسابي', icon: User },
];

function getTabsForType(type: DriverType | undefined): typeof companyTabs {
  switch (type) {
    case 'hired': return hiredTabs;
    case 'independent': return independentTabs;
    default: return companyTabs;
  }
}

const DriverDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const {
    driverInfo,
    shipments,
    activeShipments,
    completedShipments,
    loading,
    refreshData,
    updateDriverAvailability,
  } = useDriverDashboardData();

  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [showLiveMapDialog, setShowLiveMapDialog] = useState(false);
  const [selectedShipmentForMap, setSelectedShipmentForMap] = useState<DriverShipment | null>(null);
  const [showNavigationView, setShowNavigationView] = useState(false);
  const [selectedShipmentForNav, setSelectedShipmentForNav] = useState<DriverShipment | null>(null);
  const [activeFieldTool, setActiveFieldTool] = useState<string>('checklist');

  const hasActiveShipment = activeShipments.length > 0;
  const smartLocation = useDriverSmartLocation(driverInfo?.id, hasActiveShipment);

  const { pendingOffer, acceptOffer, rejectOffer, counterOffer } = useDriverOffers();

  const quickActions = useQuickActions({
    type: 'driver',
    handlers: {
      openLiveMap: () => handleOpenLiveMap(),
      openSettings: () => setShowSettingsDialog(true),
    },
  });

  const handleLocationSuccess = () => {
    setLastLocationUpdate(new Date());
  };

  const handleOpenLiveMap = (shipment?: DriverShipment) => {
    setSelectedShipmentForMap(shipment || null);
    setShowLiveMapDialog(true);
  };

  const handleNavigateToShipment = (shipment: DriverShipment) => {
    const address = shipment.status === 'approved' ? shipment.pickup_address : shipment.delivery_address;
    if (address) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
    } else {
      setSelectedShipmentForNav(shipment);
      setShowNavigationView(true);
    }
  };

  if (loading) {
    return <DriverDashboardSkeleton />;
  }

  const fieldTools = [
    { id: 'checklist', label: 'فحص ما قبل الرحلة', icon: ClipboardCheck },
    { id: 'camera', label: 'توثيق بالكاميرا', icon: Camera },
    { id: 'signature', label: 'التوقيع الإلكتروني', icon: PenTool },
    { id: 'manifest', label: 'المانيفست الرقمي', icon: QrCode },
    { id: 'classify', label: 'تصنيف المخلفات', icon: Radiation },
    { id: 'routes', label: 'تحسين المسارات', icon: Route },
  ];

  const currentTabs = getTabsForType(driverInfo?.driver_type);
  const defaultTab = currentTabs[0]?.value || 'tasks';

  return (
    <div className="space-y-3 pb-20">
      <ConnectedSmartBrief role="driver" />

      {/* Compact Header */}
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
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">
                {driverInfo?.is_available ? '🟢 متاح للمهام' : '⚫ غير متاح'}
              </span>
              {driverInfo && <DriverTypeBadge type={driverInfo.driver_type || 'company'} size="sm" />}
            </div>
            <div className="flex items-center gap-1.5">
              {driverInfo?.organization?.name && (
                <p className="text-[10px] text-muted-foreground">{driverInfo.organization.name}</p>
              )}
              {driverInfo?.vehicle_plate && (
                <p className="text-[10px] text-muted-foreground">• {driverInfo.vehicle_plate}</p>
              )}
            </div>
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
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleOpenLiveMap()}>
                <Map className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Location Toggle — All Driver Types */}
      {driverInfo && (
        <DriverLocationToggle
          status={smartLocation}
          shouldShare={smartLocation.shouldShare}
          manualOn={smartLocation.manualOn}
          onToggle={smartLocation.toggleSharing}
        />
      )}

      {/* Performance Strip */}
      {driverInfo && (
        <DriverPerformanceStrip
          rating={driverInfo.rating}
          totalTrips={driverInfo.total_trips}
          acceptanceRate={driverInfo.acceptance_rate}
          isVerified={driverInfo.is_verified}
        />
      )}

      {/* Today Progress */}
      <DriverTodayProgress shipments={shipments} />

      <DriverAssignmentAlert />

      <DriverDailySummary
        shipments={shipments as any}
        driverName={profile?.full_name || 'السائق'}
      />

      {/* Dynamic Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue={defaultTab} className="w-full" dir="rtl">
          <div className="relative overflow-x-auto rounded-xl border border-border/50 bg-card p-1 scrollbar-hide">
            <TabsList className="w-full justify-center bg-transparent gap-0.5 sm:gap-1 h-auto p-0">
              {currentTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 whitespace-nowrap text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:shadow-sm hover:text-foreground transition-all"
                >
                  <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* TAB: الرئيسية — Go Online (مستقل فقط) */}
          <TabsContent value="home" className="mt-4 space-y-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && (
                <>
                  <GoOnlineButton
                    driverId={driverInfo.id}
                    isAvailable={driverInfo.is_available}
                    onToggle={(newState) => updateDriverAvailability(newState)}
                    rating={driverInfo.rating}
                    totalTrips={driverInfo.total_trips}
                    acceptanceRate={driverInfo.acceptance_rate}
                  />
                  <EarningsMiniCard driverId={driverInfo.id} />
                  <DemandHeatmapDriver serviceAreaKm={30} />
                </>
              )}
            </Suspense>
          </TabsContent>

          {/* TAB: المهام */}
          <TabsContent value="tasks" className="mt-4 space-y-3">
            {driverInfo?.driver_type === 'company' && (
              <Suspense fallback={<Skeleton className="h-20 w-full rounded-xl" />}>
                <CompanyDriverStats
                  rating={driverInfo.rating}
                  totalTrips={driverInfo.total_trips}
                  acceptanceRate={driverInfo.acceptance_rate}
                  isAvailable={driverInfo.is_available}
                  organizationName={driverInfo.organization?.name}
                />
                <EarningsMiniCard driverId={driverInfo.id} />
              </Suspense>
            )}
            <DriverDailyTasks
              shipments={shipments}
              onNavigate={handleNavigateToShipment}
              onViewDetails={(s) => navigate(`/dashboard/shipment/${s.id}`)}
            />
          </TabsContent>

          {/* TAB: الشحنات */}
          <TabsContent value="shipments" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <CreateShipmentButton variant="eco" onSuccess={refreshData} />
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
                        {(driverInfo?.driver_type === 'independent' || driverInfo?.driver_type === 'hired') ? (
                          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                            <TripLifecyclePanel shipment={shipment as any} onStatusChange={refreshData} />
                          </Suspense>
                        ) : (
                          <>
                            <ShipmentCard shipment={shipment} onStatusChange={refreshData} variant="full" />
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs" onClick={() => handleNavigateToShipment(shipment)}>
                              <Navigation className="w-3.5 h-3.5 text-primary" />
                              ابدأ التنقل
                            </Button>
                          </>
                        )}
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
                      <ShipmentCard key={shipment.id} shipment={shipment} onStatusChange={refreshData} variant="full" />
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB: أدوات الميدان */}
          <TabsContent value="field" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {fieldTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveFieldTool(tool.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                    activeFieldTool === tool.id
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border/50 bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tool.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-tight">{tool.label}</span>
                </button>
              ))}
            </div>
            <Suspense fallback={<TabFallback />}>
              {activeFieldTool === 'checklist' && driverInfo && <DriverPreTripChecklist driverId={driverInfo.id} />}
              {activeFieldTool === 'camera' && driverInfo && (
                <div className="space-y-4">
                  <DriverSmartCamera driverId={driverInfo.id} type="load" />
                  <DriverSmartCamera driverId={driverInfo.id} type="scale" />
                  <DriverSmartCamera driverId={driverInfo.id} type="delivery" />
                </div>
              )}
              {activeFieldTool === 'signature' && driverInfo && <DriverDeliverySignature driverId={driverInfo.id} />}
              {activeFieldTool === 'manifest' && driverInfo && <DigitalManifest driverId={driverInfo.id} shipment={activeShipments[0] as any} />}
              {activeFieldTool === 'classify' && driverInfo && <WasteClassifierCamera driverId={driverInfo.id} />}
              {activeFieldTool === 'routes' && <SmartRouteOptimizer shipments={shipments as any} />}
            </Suspense>
          </TabsContent>

          {/* TAB: المالية */}
          <TabsContent value="finance" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <div className="space-y-4">
                <DriverEarningsDashboard />
                <DriverWalletPanel />
                <DriverRewardsPanel />
              </div>
            </Suspense>
          </TabsContent>

          {/* TAB: حسابي */}
          <TabsContent value="account" className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
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
            <DriverCredentialsEditor />
            <DriverLinkedOrganizations />
            {driverInfo && (
              <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
                <EnhancedDestinationPicker driverId={driverInfo.id} onDestinationAdded={refreshData} />
              </Suspense>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    أكاديمية السائق
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
                    {driverInfo && <DriverAcademy driverId={driverInfo.id} />}
                  </Suspense>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-amber-500" />
                    مراقبة الإرهاق والسلامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
                    {driverInfo && <DriverFatigueMonitor driverId={driverInfo.id} />}
                  </Suspense>
                </CardContent>
              </Card>
            </div>
            <QuickActionsGrid actions={quickActions} title="الإجراءات السريعة" subtitle="الوظائف المستخدمة بكثرة" />
          </TabsContent>

          {/* TAB: التحليلات */}
          <TabsContent value="analytics" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DriverAnalyticsPanel driverId={driverInfo.id} driverType={driverInfo.driver_type} />}
            </Suspense>
          </TabsContent>

          {/* TAB: العروض */}
          <TabsContent value="offers" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <IndependentOffersPanel driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* TAB: العقود */}
          <TabsContent value="contracts" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <HiredContractsPanel driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* TAB: سوق الشحنات */}
          <TabsContent value="marketplace" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              <ShipmentMarketplace />
            </Suspense>
          </TabsContent>

          {/* TAB: المحفظة المالية */}
          <TabsContent value="wallet" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && <DriverFinancialWallet driverId={driverInfo.id} />}
            </Suspense>
          </TabsContent>

          {/* TAB: الملف المهني */}
          <TabsContent value="profile" className="mt-4">
            <Suspense fallback={<TabFallback />}>
              {driverInfo && (
                <DriverPublicProfile
                  driverType={driverInfo.driver_type || 'company'}
                  rating={driverInfo.rating || 0}
                  totalTrips={driverInfo.total_trips || 0}
                  acceptanceRate={driverInfo.acceptance_rate ?? 0}
                  isVerified={driverInfo.is_verified ?? false}
                  driverId={driverInfo.id}
                />
              )}
            </Suspense>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Dialogs */}
      <DriverSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        driverId={driverInfo?.id || ''}
        onUpdate={refreshData}
      />

      {showLiveMapDialog && driverInfo && (
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
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
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
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
          <QuickLocationButton driverId={driverInfo.id} variant="fab" onSuccess={handleLocationSuccess} />
          <Suspense fallback={null}>
            <DriverSOSButton driverId={driverInfo.id} organizationId={driverInfo.organization_id} />
          </Suspense>
        </>
      )}

      {/* Floating Quick Actions FAB */}
      {driverInfo && (
        <Suspense fallback={null}>
          <DriverQuickFAB driverId={driverInfo.id} />
        </Suspense>
      )}

      {/* DiDi-style popup for incoming offers */}
      {pendingOffer && (
        <Suspense fallback={null}>
          <DriverOfferPopup offer={pendingOffer} onAccept={acceptOffer} onReject={rejectOffer} onCounter={counterOffer} />
        </Suspense>
      )}
    </div>
  );
};

export default DriverDashboard;
