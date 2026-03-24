import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useRealWeather } from '@/hooks/useRealWeather';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useOperationalAlerts } from '@/hooks/useOperationalAlerts';
import StoryCircles from '@/components/stories/StoryCircles';
import { Recycle, Package, Truck, Clock, CheckCircle2, Eye, AlertCircle, Sparkles, ListFilter, Beaker, Factory, Award, BarChart3, Cog, Zap, ClipboardList, Calculator, Cpu, Wrench, Lightbulb, Link2, Leaf, FileText, Building2, Route, Scale } from 'lucide-react';
import { RECYCLER_TAB_BINDINGS } from '@/config/recycler/recyclerBindings';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardV2Header from './shared/DashboardV2Header';
import V2TabsNav, { TabItem } from './shared/V2TabsNav';
import { getTabChannelName } from '@/lib/tabSession';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FacilityDashboardHeader from './shared/FacilityDashboardHeader';
import FacilityCapacityCard from './shared/FacilityCapacityCard';
import { StatCardItem } from './shared/StatsCardsGrid';
import { DetailSection } from './shared/InteractiveDetailDrawer';
import DashboardWidgetCustomizer from './DashboardWidgetCustomizer';
import { useQuickActions } from '@/hooks/useQuickActions';
import ConnectedSmartBrief from './shared/ConnectedSmartBrief';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import QuickActionsGrid from './QuickActionsGrid';
import DashboardAlertsHub from './shared/DashboardAlertsHub';
import GlobalCommodityTicker from './shared/GlobalCommodityTicker';

// Modular tab groups
import RecyclerOverviewTab from './recycler/tabs/RecyclerOverviewTab';
import RecyclerProductionTabs from './recycler/tabs/RecyclerProductionTabs';

const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const CommunicationHubWidget = lazy(() => import('./widgets/CommunicationHubWidget'));
const RecyclerCommandCenter = lazy(() => import('./recycler/RecyclerCommandCenter'));

interface RecentShipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  driver_id: string | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
}

const RecyclerDashboard = () => {
  const { t } = useLanguage();
  const { profile, organization } = useAuth();
  const queryClient = useQueryClient();
  const realWeather = useRealWeather();
  const navigate = useNavigate();
  const { data: operationalAlerts = [] } = useOperationalAlerts();
  const handleAlertClick = useCallback((alert: any) => { if (alert.route) navigate(alert.route); }, [navigate]);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportShipment, setReportShipment] = useState<RecentShipment | null>(null);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);

  const { data: facility } = useQuery({
    queryKey: ['recycler-facility', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase.from('disposal_facilities').select('*').eq('organization_id', organization.id).maybeSingle();
      return data;
    },
    enabled: !!organization?.id,
  });

  useEffect(() => {
    if (!organization?.id) return;
    const channel = supabase
      .channel(getTabChannelName('recycler-shipments-realtime'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments', filter: `recycler_id=eq.${organization.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recycler-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['recycler-incoming'] });
          queryClient.invalidateQueries({ queryKey: ['recycler-awaiting-confirm'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, queryClient]);

  const { data: shipmentData, refetch: fetchDashboardData, isLoading: shipmentsLoading } = useQuery({
    queryKey: ['recycler-dashboard', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { shipments: [], stats: { total: 0, incoming: 0, processing: 0, completed: 0 } };
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, waste_type, quantity, unit, status, created_at,
          pickup_address, delivery_address, pickup_date, expected_delivery_date,
          notes, generator_notes, recycler_notes, waste_description, hazard_level,
          packaging_method, disposal_method, approved_at, collection_started_at,
          in_transit_at, delivered_at, confirmed_at, manual_driver_name, manual_vehicle_plate, driver_id,
          generator:organizations!shipments_generator_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          transporter:organizations!shipments_transporter_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          recycler:organizations!shipments_recycler_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .eq('recycler_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      const shipmentIds = shipments?.map(s => s.id) || [];
      const { data: reportsData } = await supabase.from('recycling_reports').select('shipment_id').in('shipment_id', shipmentIds);
      const reportedIds = new Set(reportsData?.map(r => r.shipment_id) || []);
      const enriched = (shipments || []).map(s => ({ ...s, has_report: reportedIds.has(s.id) }));
      return {
        shipments: enriched as unknown as RecentShipment[],
        stats: {
          total: enriched.length,
          incoming: enriched.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length,
          processing: enriched.filter(s => s.status === 'delivered').length,
          completed: enriched.filter(s => s.status === 'confirmed').length,
        },
      };
    },
    enabled: !!organization?.id,
  });

  const recentShipments = shipmentData?.shipments || [];
  const stats = shipmentData?.stats || { total: 0, incoming: 0, processing: 0, completed: 0 };

  const buildRecyclerDetails = (): DetailSection[] => [
    {
      id: 'status-breakdown', title: 'توزيع الشحنات حسب الحالة', icon: ListFilter, defaultOpen: true,
      content: (
        <div className="space-y-2 text-right">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><span className="font-bold">{stats.incoming}</span><span className="text-sm">واردة</span></div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><span className="font-bold">{stats.processing}</span><span className="text-sm">قيد المعالجة</span></div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50"><span className="font-bold">{stats.completed}</span><span className="text-sm">مؤكدة</span></div>
        </div>
      ),
      link: '/dashboard/shipments',
    },
  ];

  const statCards: StatCardItem[] = [
    { title: t('dashboard.totalShipments'), value: stats.total, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10', detailSections: buildRecyclerDetails(), detailTitle: t('dashboard.shipmentDetails') },
    { title: t('dashboard.incomingShipments'), value: stats.incoming, icon: Truck, color: 'text-amber-500', bgColor: 'bg-amber-500/10', detailSections: buildRecyclerDetails() },
    { title: t('dashboard.inProcessing'), value: stats.processing, icon: Clock, color: 'text-purple-500', bgColor: 'bg-purple-500/10', detailSections: buildRecyclerDetails() },
    { title: t('dashboard.confirmed'), value: stats.completed, icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10', detailSections: buildRecyclerDetails() },
  ];

  const handleRefresh = () => {
    fetchDashboardData();
    queryClient.invalidateQueries({ queryKey: ['recycler-incoming'] });
    queryClient.invalidateQueries({ queryKey: ['recycler-awaiting-confirm'] });
    queryClient.invalidateQueries({ queryKey: ['recycler-facility'] });
  };

  const [activeTab, setActiveTab] = useState('overview');

  const quickActions = useQuickActions({ type: 'recycler', handlers: {
    openDepositDialog: () => setShowDepositDialog(true),
    openSmartWeightUpload: () => setShowSmartWeightUpload(true),
  }});

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* 1. الهيدر والهوية */}
      <ConnectedSmartBrief role="recycler" />
      <StoryCircles />

      <DashboardV2Header
        userName={profile?.full_name || ''}
        orgName={organization?.name || ''}
        orgLabel={t('dashboard.orgTypes.recycler')}
        icon={Recycle}
        gradient="from-emerald-500 to-teal-600"
        onRefresh={handleRefresh}
        radarStats={(() => {
          const generators = new Set(recentShipments.map(s => s.generator?.name).filter(Boolean)).size;
          return [
            { label: 'إجمالي الشحنات', value: stats.total, icon: Package, color: 'text-primary', max: stats.total || 1, trend: 'up' as const },
            { label: 'واردة', value: stats.incoming, icon: Truck, color: 'text-amber-500', max: Math.max(stats.total, 1), trend: 'up' as const },
            { label: 'قيد المعالجة', value: stats.processing, icon: Clock, color: 'text-violet-500', max: Math.max(stats.total, 1), trend: 'stable' as const },
            { label: 'مؤكدة', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', max: Math.max(stats.total, 1), trend: 'up' as const },
            { label: 'المولّدون', value: generators, icon: Building2, color: 'text-primary', max: generators || 1, trend: 'stable' as const },
            { label: 'المنشأة', value: facility ? 1 : 0, icon: Factory, color: 'text-emerald-500', max: 1, trend: 'stable' as const },
          ];
        })()}
        alerts={operationalAlerts}
        onAlertClick={handleAlertClick}
        weather={{
          temp: realWeather.temp,
          condition: realWeather.condition,
          conditionLabel: realWeather.conditionLabel,
          humidity: realWeather.humidity,
          windSpeed: realWeather.windSpeed,
          roadWarning: realWeather.roadWarning,
          feelsLike: realWeather.feelsLike,
          uvIndex: realWeather.uvIndex,
          precipProb: realWeather.precipProb,
          pressure: realWeather.pressure,
          locationName: realWeather.locationName,
          hourlyForecast: realWeather.hourlyForecast,
          isLoading: realWeather.isLoading,
          refreshFromGPS: realWeather.refreshFromGPS,
          isLocating: realWeather.isLocating,
        }}
        heatmapData={[
          { region: 'القاهرة', value: stats.incoming, max: 10 },
          { region: 'الجيزة', value: Math.round(stats.total * 0.25), max: 8 },
          { region: 'الإسكندرية', value: Math.round(stats.total * 0.2), max: 8 },
          { region: 'الدلتا', value: Math.round(stats.total * 0.15), max: 6 },
          { region: 'الصعيد', value: Math.round(stats.total * 0.1), max: 5 },
        ]}
      >
        <DashboardWidgetCustomizer orgType="recycler" />
        <Button onClick={() => setShowSmartWeightUpload(true)} variant="outline" size="sm" className="gap-2 rounded-xl">
          <Sparkles className="w-4 h-4" />
        </Button>
      </DashboardV2Header>

      {/* ★ بورصة السلع العالمية — أعلى لوحة التحكم */}
      <GlobalCommodityTicker />

      {/* 2. مركز القيادة */}
      <Suspense fallback={null}><RecyclerCommandCenter /></Suspense>

      {/* 3. الإجراءات السريعة */}
      <QuickActionsGrid
        actions={quickActions}
        title={t('dashboard.quickActions')}
        subtitle="وظائف التدوير والإنتاج"
      />

      {/* 4. التنبيهات */}
      <DashboardAlertsHub orgType="recycler" />

      {/* 5. التواصل */}
      <Suspense fallback={null}><CommunicationHubWidget /></Suspense>

      {/* 6. المنشأة */}
      {facility && <FacilityCapacityCard facility={facility} />}

      {/* 7. التبويبات */}

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <V2TabsNav tabs={[
          { value: 'overview', label: 'نظرة عامة', icon: Recycle, bindingType: RECYCLER_TAB_BINDINGS['overview']?.type },
          { value: 'twin', label: 'التوأم الرقمي', icon: Cpu, bindingType: RECYCLER_TAB_BINDINGS['twin']?.type },
          { value: 'production', label: 'الإنتاج', icon: Factory, bindingType: RECYCLER_TAB_BINDINGS['production']?.type },
          { value: 'quality', label: 'فحص الجودة', icon: Beaker, bindingType: RECYCLER_TAB_BINDINGS['quality']?.type },
          { value: 'equipment', label: 'المعدات', icon: Cog, bindingType: RECYCLER_TAB_BINDINGS['equipment']?.type },
          { value: 'predictive', label: 'صيانة تنبؤية', icon: Wrench, bindingType: RECYCLER_TAB_BINDINGS['predictive']?.type },
          { value: 'workorders', label: 'أوامر التشغيل', icon: ClipboardList, bindingType: RECYCLER_TAB_BINDINGS['workorders']?.type },
          { value: 'optimizer', label: 'مُحسّن ذكي', icon: Lightbulb, bindingType: RECYCLER_TAB_BINDINGS['optimizer']?.type },
          { value: 'traceability', label: 'تتبع الدُفعات', icon: Link2, bindingType: RECYCLER_TAB_BINDINGS['traceability']?.type },
          { value: 'utilities', label: 'المرافق', icon: Zap, bindingType: RECYCLER_TAB_BINDINGS['utilities']?.type },
          { value: 'cost', label: 'التكلفة', icon: Calculator, bindingType: RECYCLER_TAB_BINDINGS['cost']?.type },
          { value: 'certificates', label: 'الشهادات', icon: Award, bindingType: RECYCLER_TAB_BINDINGS['certificates']?.type },
          { value: 'market', label: 'البورصة', icon: BarChart3, bindingType: RECYCLER_TAB_BINDINGS['market']?.type },
          { value: 'carbon', label: 'البصمة الكربونية', icon: Leaf, bindingType: RECYCLER_TAB_BINDINGS['carbon']?.type },
          { value: 'esg', label: 'تقارير ESG', icon: Leaf, bindingType: RECYCLER_TAB_BINDINGS['esg']?.type },
          { value: 'wmis', label: 'WMIS', icon: AlertCircle, bindingType: RECYCLER_TAB_BINDINGS['wmis']?.type },
          { value: 'declarations', label: 'الإقرارات', icon: FileText, bindingType: RECYCLER_TAB_BINDINGS['declarations']?.type },
        ] as TabItem[]} />

        <RecyclerOverviewTab
          statCards={statCards}
          shipmentsLoading={shipmentsLoading}
          recentShipments={recentShipments}
          quickActions={quickActions}
          onRefresh={handleRefresh}
          facility={facility}
        />

        <RecyclerProductionTabs organizationId={organization?.id} />
      </Tabs>

      {/* Dialogs */}
      <EnhancedShipmentPrintView isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} shipment={selectedShipment as any} />
      <Suspense fallback={null}>
        <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
      </Suspense>
      {reportShipment && (
        <RecyclingCertificateDialog
          isOpen={showReportDialog}
          onClose={() => { setShowReportDialog(false); setReportShipment(null); }}
          shipment={reportShipment as any}
        />
      )}
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
    </div>
  );
};

export default RecyclerDashboard;
