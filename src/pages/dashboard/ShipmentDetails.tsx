import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { fetchShipmentByIdOrNumber, EnrichedShipment } from '@/hooks/useShipmentData';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentStatusTimeline from '@/components/shipments/ShipmentStatusTimeline';
import DocumentChainStrip from '@/components/shipments/DocumentChainStrip';
import { useShipmentVisibility } from '@/hooks/useVisibilityGuard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useDeliveryDeclaration, useShipmentDeclarations } from '@/hooks/useDeliveryDeclaration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import V2TabsNav, { TabItem } from '@/components/dashboard/shared/V2TabsNav';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import NavigationButtonGroup from '@/components/navigation/NavigationButtonGroup';
import {
  Package, Printer, MapPin, Calendar, Truck, Building2, Recycle,
  User, Phone, Mail, FileText, AlertTriangle, Scale, Box, Loader2,
  Edit, Navigation, Lock, Route, Eye, Star, Shield, Users2,
  RefreshCw, ChevronDown, Settings2, Download, FileCheck, CheckCircle2,
  EyeOff, XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { canChangeStatus, getAvailableNextStatuses, mapLegacyStatus, getStatusConfig, mapToDbStatus, type ShipmentStatus } from '@/lib/shipmentStatusConfig';

// Lazy load heavy components
const ShipmentDocumentsTimeline = lazy(() => import('@/components/shipments/ShipmentDocumentsTimeline'));
const ShipmentDocumentsPanel = lazy(() => import('@/components/documents/ShipmentDocumentsPanel'));
const ShipmentProgressLogs = lazy(() => import('@/components/shipments/ShipmentProgressLogs'));
const ShipmentStatusDialog = lazy(() => import('@/components/shipments/StatusChangeDialog'));
const InlineStatusChange = lazy(() => import('@/components/shipments/StatusChangeDialog').then(m => ({ default: m.InlineStatusChange })));
const ShipmentQuickPrint = lazy(() => import('@/components/shipments/unified-print/UnifiedShipmentPrint'));
const ManifestPDFButton = lazy(() => import('@/components/shipments/ManifestPDFButton'));
const SignManifestButton = lazy(() => import('@/components/shipments/SignManifestButton'));
const CancelShipmentDialog = lazy(() => import('@/components/shipments/CancelShipmentDialog'));
const EditShipmentDialog = lazy(() => import('@/components/shipments/EditShipmentDialog'));
const ShipmentSignaturesCard = lazy(() => import('@/components/shipments/ShipmentSignaturesCard'));
const QuickReceiptButton = lazy(() => import('@/components/receipts/QuickReceiptButton'));
const GeneratorCompletionCard = lazy(() => import('@/components/shipments/GeneratorCompletionCard'));
const CompletedRouteMap = lazy(() => import('@/components/shipments/CompletedRouteMap'));
const DriverAssignmentPanel = lazy(() => import('@/components/shipments/DriverAssignmentPanel'));
const ShipmentRatingDialog = lazy(() => import('@/components/shipments/ShipmentRatingDialog'));
const ShipmentDisputePanel = lazy(() => import('@/components/shipments/ShipmentDisputePanel'));
const ChainNotificationsWidget = lazy(() => import('@/components/shipments/ChainNotificationsWidget'));
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const DriverRouteVisualization = lazy(() => import('@/components/tracking/DriverRouteVisualization'));
const TrackingModeController = lazy(() => import('@/components/tracking/TrackingModeController'));
const ShipmentGPSTrackingPanel = lazy(() => import('@/components/tracking/ShipmentGPSTrackingPanel'));
const JobLifecycleOrchestrator = lazy(() => import('@/components/shipments/JobLifecycleOrchestrator'));
const ImpactTrailWidget = lazy(() => import('@/components/impact/ImpactTrailWidget'));
const RouteProgressBar = lazy(() => import('@/components/tracking/RouteProgressBar'));
const UnifiedShipmentTracker = lazy(() => import('@/components/tracking/UnifiedShipmentTracker'));

type ShipmentDetails = EnrichedShipment;

const TabFallback = () => <Skeleton className="h-48 w-full rounded-xl" />;
const PREF_KEY_ACTIVE_TAB = 'shipment_details_active_tab';

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك', paper: 'ورق', metal: 'معادن', glass: 'زجاج',
  electronic: 'إلكترونيات', organic: 'عضوية', chemical: 'كيميائية',
  medical: 'طبية', construction: 'مخلفات بناء', other: 'أخرى',
};
const hazardLevelLabels: Record<string, { label: string; className: string }> = {
  low: { label: 'منخفض', className: 'bg-primary/10 text-primary border border-primary/20' },
  medium: { label: 'متوسط', className: 'bg-accent text-accent-foreground border border-accent/20' },
  high: { label: 'عالي', className: 'bg-destructive/10 text-destructive border border-destructive/20' },
};
const statusLabels: Record<string, { label: string; className: string }> = {
  new: { label: 'جديدة', className: 'bg-primary/10 text-primary border border-primary/20' },
  approved: { label: 'معتمدة', className: 'bg-primary/15 text-primary border border-primary/30' },
  in_transit: { label: 'في الطريق', className: 'bg-accent text-accent-foreground border border-accent/30' },
  delivered: { label: 'تم التسليم', className: 'bg-secondary text-secondary-foreground border border-secondary/30' },
  confirmed: { label: 'مؤكدة', className: 'bg-primary/20 text-primary border border-primary/30' },
};

const TABS: TabItem[] = [
  { value: 'overview', label: 'نظرة عامة', icon: Package },
  { value: 'tracking', label: 'التتبع', icon: Navigation },
  { value: 'documents', label: 'المستندات', icon: FileText },
  { value: 'parties', label: 'الأطراف', icon: Users2 },
  { value: 'actions', label: 'الإجراءات', icon: Shield },
];

const ShipmentDetailsPage = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { roles, organization } = useAuth();
  const { t, language } = useLanguage();
  const { getPref, setPref } = useUserPreferences();
  const dateLocale = language === 'ar' ? arLocale : enUS;

  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [generatorLocation, setGeneratorLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recyclerLocation, setRecyclerLocation] = useState<{ lat: number; lng: number } | null>(null);

  const visibility = useShipmentVisibility(shipment?.id);
  const activeTab = getPref(PREF_KEY_ACTIVE_TAB, 'overview');
  const isDriver = roles.includes('driver');

  useEffect(() => {
    if (shipmentId) fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    try {
      if (!shipmentId) { setError(t('shipmentDetails.invalidId')); return; }
      const shipmentData = await fetchShipmentByIdOrNumber(shipmentId);
      if (!shipmentData) { setError(t('shipmentDetails.notFoundDesc')); return; }
      setShipment(shipmentData);

      // Fetch locations in parallel
      const [genLoc, recLoc] = await Promise.all([
        shipmentData.generator_id
          ? supabase.from('organization_locations').select('latitude, longitude').eq('organization_id', shipmentData.generator_id).eq('is_primary', true).maybeSingle()
          : null,
        shipmentData.recycler_id
          ? supabase.from('organization_locations').select('latitude, longitude').eq('organization_id', shipmentData.recycler_id).eq('is_primary', true).maybeSingle()
          : null,
      ]);

      setGeneratorLocation(
        genLoc?.data?.latitude && genLoc?.data?.longitude
          ? { lat: Number(genLoc.data.latitude), lng: Number(genLoc.data.longitude) }
          : { lat: 30.0444, lng: 31.2357 }
      );
      setRecyclerLocation(
        recLoc?.data?.latitude && recLoc?.data?.longitude
          ? { lat: Number(recLoc.data.latitude), lng: Number(recLoc.data.longitude) }
          : { lat: 30.0131, lng: 31.2089 }
      );
    } catch (error: any) {
      console.error('Error fetching shipment details:', error);
      if (error?.code === 'PGRST116') setError(t('shipmentDetails.noPermission'));
      else if (error?.message?.includes('JWT')) setError(t('shipmentDetails.sessionExpired'));
      else setError(t('shipmentDetails.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('shipmentDetails.notFound')}</h2>
          <p className="text-muted-foreground mb-4">{error || t('shipmentDetails.notFoundDesc')}</p>
          <div className="flex gap-2">
            <Button onClick={() => navigate(-1)}>{t('shipmentDetails.goBack')}</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>{t('shipmentDetails.retry')}</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = statusLabels[shipment.status] || { label: shipment.status, className: 'bg-muted' };
  const hazardConfig = hazardLevelLabels[shipment.hazard_level || 'low'];
  const isGenerator = organization?.organization_type === 'generator';
  const isTransporter = organization?.organization_type === 'transporter';
  const isCompleted = ['delivered', 'confirmed'].includes(shipment.status);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-5">
        <BackButton />

        {/* Compact Header */}
        <div className="flex flex-col gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap justify-end">
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              <h1 className="text-lg sm:text-2xl font-bold font-mono">{shipment.shipment_number}</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('shipmentDetails.createdAt')} {format(new Date(shipment.created_at), 'PPP', { locale: dateLocale })}
              {shipment.waste_type && <> • {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</>}
              {shipment.quantity && <> • {shipment.quantity} {shipment.unit || 'كجم'}</>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap overflow-x-auto scrollbar-hide">
            <Suspense fallback={null}>
              <EditShipmentDialog shipment={shipment} onSuccess={fetchShipmentDetails} />
            </Suspense>
            {shipment.driver_id && visibility.canViewTracking && (
              <Button onClick={() => setShowLiveTracking(true)} variant="default" size="sm" className="text-xs">
                <Navigation className="ml-1 h-3.5 w-3.5" />{t('shipmentDetails.liveTracking')}
              </Button>
            )}
            <Suspense fallback={null}>
              {isTransporter && (
                <QuickReceiptButton
                  shipment={{
                    id: shipment.id, shipment_number: shipment.shipment_number,
                    waste_type: shipment.waste_type, quantity: shipment.quantity,
                    unit: shipment.unit || 'كجم', pickup_address: shipment.pickup_address || '',
                    generator_id: shipment.generator_id, generator: shipment.generator,
                    recycler: shipment.recycler, driver_id: shipment.driver_id, created_at: shipment.created_at,
                  }}
                  onSuccess={fetchShipmentDetails} variant="outline" size="sm"
                />
              )}
            </Suspense>
            <Button variant="eco" size="sm" className="text-xs" onClick={() => setShowPrintDialog(true)}>
              <Printer className="ml-1 h-3.5 w-3.5" />{t('shipmentDetails.printPdf')}
            </Button>
            <Suspense fallback={null}>
              <ManifestPDFButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number || ''} variant="outline" size="sm" />
            </Suspense>
            <Suspense fallback={null}>
              <SignManifestButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number || ''} documentType="manifest" label="توقيع المانيفست" variant="outline" size="sm" />
            </Suspense>
            <Suspense fallback={null}>
              <SignManifestButton shipmentId={shipment.id} shipmentNumber={shipment.shipment_number || ''} documentType="shipment_tracking" label="توقيع التتبع" variant="outline" size="sm" />
            </Suspense>
            <Suspense fallback={null}>
              <CancelShipmentDialog shipmentId={shipment.id} shipmentNumber={shipment.shipment_number} currentStatus={shipment.status} onSuccess={fetchShipmentDetails} />
            </Suspense>
          </div>
        </div>

        {/* Status Timeline + Document Chain — always visible */}
        <ShipmentStatusTimeline shipment={shipment} orgType={organization?.organization_type as any} />
        <Card className="p-3">
          <DocumentChainStrip shipmentId={shipment.id} variant="full" orgType={organization?.organization_type as any} />
        </Card>

        {/* Digital Signatures */}
        <Suspense fallback={null}>
          <ShipmentSignaturesCard shipmentId={shipment.id} />
        </Suspense>

        {/* Inline Status Change */}
        <Suspense fallback={null}>
          <InlineStatusChange shipment={shipment} onStatusChanged={fetchShipmentDetails} />
        </Suspense>

        <Tabs value={activeTab} onValueChange={(v) => setPref(PREF_KEY_ACTIVE_TAB, v)} dir="rtl" className="space-y-4">
          <V2TabsNav tabs={TABS} />

          {/* ===== نظرة عامة ===== */}
          <TabsContent value="overview">
            <div className="space-y-5">
              {/* Lifecycle + Impact */}
              {organization?.id && (
                <ErrorBoundary fallbackTitle="خطأ في دورة الحياة">
                  <Suspense fallback={<TabFallback />}>
                    <JobLifecycleOrchestrator shipmentId={shipment.id} organizationId={organization.id} />
                  </Suspense>
                </ErrorBoundary>
              )}
              <ErrorBoundary fallbackTitle="خطأ في سلسلة الأثر">
                <Suspense fallback={null}>
                  <ImpactTrailWidget resourceType="shipment" resourceId={shipment.id} chainKey="shipment_lifecycle" />
                </Suspense>
              </ErrorBoundary>

              {/* Generator Completion */}
              {isGenerator && isCompleted && (
                <Suspense fallback={<TabFallback />}>
                  <GeneratorCompletionCard shipment={shipment} />
                  <CompletedRouteMap
                    pickupCoords={generatorLocation} deliveryCoords={recyclerLocation}
                    pickupLabel={shipment.pickup_address || 'موقع المولّد'}
                    deliveryLabel={shipment.delivery_address || 'موقع المدوّر'}
                    shipmentNumber={shipment.shipment_number}
                  />
                </Suspense>
              )}

              {/* Waste + Location Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card>
                  <CardHeader className="text-right pb-3">
                    <CardTitle className="text-base flex items-center gap-2 justify-end">
                      <Package className="w-4 h-4 text-primary" />{t('shipmentDetails.wasteDetails')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t('shipmentDetails.wasteType')}</p>
                        <p className="font-medium text-sm">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t('shipmentDetails.quantity')}</p>
                        <p className="font-medium text-sm flex items-center gap-1 justify-end">
                          <Scale className="w-3.5 h-3.5 text-muted-foreground" />{shipment.quantity} {shipment.unit || 'كجم'}
                        </p>
                      </div>
                    </div>
                    {shipment.hazard_level && (
                      <div className="text-right">
                        <Badge className={hazardConfig?.className}><AlertTriangle className="w-3 h-3 ml-1" />{hazardConfig?.label}</Badge>
                      </div>
                    )}
                    {shipment.waste_description && <p className="text-sm text-right text-muted-foreground">{shipment.waste_description}</p>}
                    {shipment.packaging_method && (
                      <div className="text-right text-sm"><span className="text-muted-foreground">{t('shipmentDetails.packagingMethod')}: </span><Box className="w-3.5 h-3.5 inline text-muted-foreground" /> {shipment.packaging_method}</div>
                    )}
                    {shipment.disposal_method && (
                      <div className="text-right text-sm"><span className="text-muted-foreground">{t('shipmentDetails.disposalMethod')}: </span>{shipment.disposal_method}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-right pb-3">
                    <CardTitle className="text-base flex items-center gap-2 justify-end">
                      <MapPin className="w-4 h-4 text-primary" />{t('shipmentDetails.locations')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-right p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{t('shipmentDetails.pickupLocation')}</p>
                      <p className="font-medium text-sm">{shipment.pickup_address}</p>
                      {shipment.pickup_date && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />{format(new Date(shipment.pickup_date), 'PPP', { locale: dateLocale })}
                        </p>
                      )}
                    </div>
                    <div className="text-right p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{t('shipmentDetails.deliveryLocation')}</p>
                      <p className="font-medium text-sm">{shipment.delivery_address}</p>
                      {shipment.expected_delivery_date && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />{format(new Date(shipment.expected_delivery_date), 'PPP', { locale: dateLocale })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {shipment.notes && (
                <Card>
                  <CardHeader className="text-right pb-2">
                    <CardTitle className="text-base flex items-center gap-2 justify-end"><FileText className="w-4 h-4 text-primary" />{t('shipmentDetails.generalNotes')}</CardTitle>
                  </CardHeader>
                  <CardContent><p className="text-right text-sm">{shipment.notes}</p></CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ===== التتبع ===== */}
          <TabsContent value="tracking">
            <ErrorBoundary fallbackTitle="خطأ في التتبع">
              <div className="space-y-5">
                {!(isGenerator && isCompleted) && (
                  <>
                    {shipment.driver_id && visibility.canViewTracking && (
                      <Suspense fallback={<TabFallback />}>
                        <TrackingModeController shipmentId={shipment.id} driverId={shipment.driver_id} pickupCoords={generatorLocation} deliveryCoords={recyclerLocation} currentStatus={shipment.status} />
                      </Suspense>
                    )}
                    {shipment.driver_id && !visibility.canViewTracking && !visibility.isOwner && (
                      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                        <Lock className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 dark:text-amber-200">{t('shipmentDetails.trackingUnavailable')}</AlertDescription>
                      </Alert>
                    )}
                    {shipment.driver_id && visibility.canViewTracking && visibility.canViewMaps && (
                      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="p-1.5 rounded-full bg-primary/10"><Navigation className="h-4 w-4 text-primary" /></div>
                              {t('shipmentDetails.liveTrackingTitle')}
                            </CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setShowLiveTracking(true)}>
                              <Eye className="ml-1.5 h-4 w-4" />{t('shipmentDetails.fullTracking')}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Suspense fallback={<TabFallback />}>
                            <RouteProgressBar status={shipment.status} pickupAddress={shipment.pickup_address} deliveryAddress={shipment.delivery_address} pickupDate={shipment.pickup_date} deliveredAt={shipment.delivered_at} compact />
                          </Suspense>
                          {visibility.canViewDriverLocation && (
                            <Suspense fallback={<TabFallback />}>
                              <DriverRouteVisualization shipmentId={shipment.id} driverId={shipment.driver_id!} pickupAddress={shipment.pickup_address} deliveryAddress={shipment.delivery_address} status={shipment.status} showStats={true} height={350} />
                            </Suspense>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    {!shipment.driver_id && (
                      <Suspense fallback={<TabFallback />}>
                        <UnifiedShipmentTracker
                          shipment={{
                            ...shipment, pickup_address: shipment.pickup_address || '', delivery_address: shipment.delivery_address || '',
                            generator: shipment.generator ? { name: shipment.generator.name, city: shipment.generator.city || '' } : null,
                            transporter: shipment.transporter ? { name: shipment.transporter.name, phone: shipment.transporter.phone || '' } : null,
                            recycler: shipment.recycler ? { name: shipment.recycler.name, city: shipment.recycler.city || '' } : null,
                          }}
                          showMap={generatorLocation !== null && recyclerLocation !== null}
                          onStatusUpdate={fetchShipmentDetails}
                        />
                      </Suspense>
                    )}
                    <Suspense fallback={<TabFallback />}>
                      <ShipmentGPSTrackingPanel shipmentId={shipment.id} driverId={shipment.driver_id} transporterId={shipment.transporter_id} generatorId={shipment.generator_id} recyclerId={shipment.recycler_id} shipmentStatus={shipment.status} />
                    </Suspense>
                  </>
                )}
                {isGenerator && isCompleted && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>تم إكمال الشحنة — يمكنك مراجعة المسار في تبويب "نظرة عامة"</p>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </TabsContent>

          {/* ===== المستندات ===== */}
          <TabsContent value="documents">
            <ErrorBoundary fallbackTitle="خطأ في المستندات">
              <div className="space-y-5">
                <Suspense fallback={<TabFallback />}>
                  <ShipmentDocumentsTimeline shipment={shipment} onRefresh={fetchShipmentDetails} />
                </Suspense>
                <Suspense fallback={<TabFallback />}>
                  <ShipmentDocumentsPanel shipmentId={shipment.id} shipmentStatus={shipment.status} />
                </Suspense>
                <Suspense fallback={<TabFallback />}>
                  <ShipmentProgressLogs shipmentId={shipment.id} maxHeight={350} />
                </Suspense>
              </div>
            </ErrorBoundary>
          </TabsContent>

          {/* ===== الأطراف ===== */}
          <TabsContent value="parties">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {shipment.generator && (
                <Card>
                  <CardHeader className="text-right pb-3">
                    <CardTitle className="text-base flex items-center gap-2 justify-end"><Building2 className="w-4 h-4 text-blue-500" />{t('shipmentDetails.generator')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-semibold">{shipment.generator.name}</p>
                    <p className="text-sm text-muted-foreground">{shipment.generator.city}</p>
                    <Separator />
                    <div className="space-y-1.5 text-sm">
                      {shipment.generator.address && <p className="flex items-center gap-2 justify-end"><span>{shipment.generator.address}</span><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.generator.phone && <p className="flex items-center gap-2 justify-end"><span>{shipment.generator.phone}</span><Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.generator.email && <p className="flex items-center gap-2 justify-end"><span>{shipment.generator.email}</span><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.generator.representative_name && <p className="flex items-center gap-2 justify-end"><span>{shipment.generator.representative_name}</span><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                    </div>
                    {shipment.generator_notes && (<><Separator /><p className="text-sm text-right text-muted-foreground">{shipment.generator_notes}</p></>)}
                  </CardContent>
                </Card>
              )}

              {shipment.transporter && (
                <Card>
                  <CardHeader className="text-right pb-3">
                    <CardTitle className="text-base flex items-center gap-2 justify-end"><Truck className="w-4 h-4 text-purple-500" />{t('shipmentDetails.transporter')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-semibold">{shipment.transporter.name}</p>
                    <p className="text-sm text-muted-foreground">{shipment.transporter.city}</p>
                    <Separator />
                    <div className="space-y-1.5 text-sm">
                      {shipment.transporter.address && <p className="flex items-center gap-2 justify-end"><span>{shipment.transporter.address}</span><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.transporter.phone && <p className="flex items-center gap-2 justify-end"><span>{shipment.transporter.phone}</span><Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.transporter.email && <p className="flex items-center gap-2 justify-end"><span>{shipment.transporter.email}</span><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                    </div>
                    {/* Driver Info */}
                    {(shipment.driver || shipment.manual_driver_name) && visibility.canViewDriverInfo && (
                      <><Separator />
                      <div className="text-right p-2.5 rounded-lg bg-muted/50">
                        <p className="text-xs font-medium mb-1.5">{t('shipmentDetails.driverInfo')}</p>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-2 justify-end"><span>{shipment.driver?.profile?.full_name || shipment.manual_driver_name}</span><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>
                          {shipment.driver?.profile?.phone && <p className="flex items-center gap-2 justify-end"><span>{shipment.driver.profile.phone}</span><Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                          {visibility.canViewVehicleInfo && <p className="flex items-center gap-2 justify-end"><span>{shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate || '-'}</span><Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                        </div>
                      </div></>
                    )}
                    {(shipment.driver || shipment.manual_driver_name) && !visibility.canViewDriverInfo && !visibility.isOwner && (
                      <div className="text-right p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200">
                        <div className="flex items-center gap-2 justify-end text-sm text-amber-800 dark:text-amber-200">
                          <span>{t('shipmentDetails.driverInfoHidden')}</span><Lock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {shipment.recycler && visibility.canViewRecyclerInfo && (
                <Card>
                  <CardHeader className="text-right pb-3">
                    <CardTitle className="text-base flex items-center gap-2 justify-end"><Recycle className="w-4 h-4 text-green-500" />{t('shipmentDetails.recycler')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-semibold">{shipment.recycler.name}</p>
                    <p className="text-sm text-muted-foreground">{shipment.recycler.city}</p>
                    <Separator />
                    <div className="space-y-1.5 text-sm">
                      {shipment.recycler.address && <p className="flex items-center gap-2 justify-end"><span>{shipment.recycler.address}</span><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.recycler.phone && <p className="flex items-center gap-2 justify-end"><span>{shipment.recycler.phone}</span><Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.recycler.email && <p className="flex items-center gap-2 justify-end"><span>{shipment.recycler.email}</span><Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                      {shipment.recycler.representative_name && <p className="flex items-center gap-2 justify-end"><span>{shipment.recycler.representative_name}</span><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /></p>}
                    </div>
                    {shipment.recycler_notes && (<><Separator /><p className="text-sm text-right text-muted-foreground">{shipment.recycler_notes}</p></>)}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ===== الإجراءات ===== */}
          <TabsContent value="actions">
            <ErrorBoundary fallbackTitle="خطأ في الإجراءات">
              <div className="space-y-5">
                {/* Driver Assignment */}
                {organization?.id && (
                  <Suspense fallback={<TabFallback />}>
                    <DriverAssignmentPanel
                      shipmentId={shipment.id} shipmentStatus={shipment.status}
                      currentDriverId={shipment.driver_id} organizationId={organization.id}
                      isTransporter={isTransporter} onAssigned={fetchShipmentDetails}
                    />
                  </Suspense>
                )}

                {/* Ratings */}
                {organization?.id && isCompleted && (
                  <Card>
                    <CardHeader className="text-right pb-3">
                      <CardTitle className="text-base flex items-center gap-2 justify-end"><Star className="w-4 h-4 text-amber-500" />تقييم الأطراف</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Suspense fallback={null}>
                          {shipment.generator && shipment.generator_id !== organization.id && (
                            <ShipmentRatingDialog shipmentId={shipment.id} raterOrgId={organization.id} ratedOrgId={shipment.generator_id!} raterType={organization.organization_type as any} ratedType="generator" ratedOrgName={shipment.generator.name} />
                          )}
                          {shipment.transporter && shipment.transporter_id !== organization.id && (
                            <ShipmentRatingDialog shipmentId={shipment.id} raterOrgId={organization.id} ratedOrgId={shipment.transporter_id!} raterType={organization.organization_type as any} ratedType="transporter" ratedOrgName={shipment.transporter.name} />
                          )}
                          {shipment.recycler && shipment.recycler_id !== organization.id && (
                            <ShipmentRatingDialog shipmentId={shipment.id} raterOrgId={organization.id} ratedOrgId={shipment.recycler_id!} raterType={organization.organization_type as any} ratedType="recycler" ratedOrgName={shipment.recycler.name} />
                          )}
                        </Suspense>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dispute */}
                {organization?.id && (
                  <Suspense fallback={<TabFallback />}>
                    <ShipmentDisputePanel
                      shipmentId={shipment.id} organizationId={organization.id}
                      partnerOrgs={[
                        ...(shipment.generator ? [{ id: shipment.generator_id!, name: shipment.generator.name, type: 'generator' }] : []),
                        ...(shipment.transporter && shipment.transporter_id !== organization.id ? [{ id: shipment.transporter_id!, name: shipment.transporter.name, type: 'transporter' }] : []),
                        ...(shipment.recycler ? [{ id: shipment.recycler_id!, name: shipment.recycler.name, type: 'recycler' }] : []),
                      ].filter(o => o.id !== organization.id)}
                    />
                  </Suspense>
                )}

                {/* Notifications */}
                {organization?.id && (
                  <Suspense fallback={<TabFallback />}>
                    <ChainNotificationsWidget organizationId={organization.id} shipmentId={shipment.id} />
                  </Suspense>
                )}
              </div>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Suspense fallback={null}>
        {showPrintDialog && <ShipmentQuickPrint isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipmentId={shipmentId || ''} />}
        
        {showLiveTracking && shipment.driver_id && (
          <LiveTrackingMapDialog isOpen={showLiveTracking} onClose={() => setShowLiveTracking(false)} driverId={shipment.driver_id} shipmentNumber={shipment.shipment_number} pickupAddress={shipment.pickup_address} deliveryAddress={shipment.delivery_address} shipmentStatus={shipment.status} />
        )}
      </Suspense>
    </DashboardLayout>
  );
};

export default ShipmentDetailsPage;
