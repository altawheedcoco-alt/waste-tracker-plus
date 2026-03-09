import { useState, useEffect, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast as sonnerToast } from 'sonner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';
import ShipmentPrintView from '@/components/shipments/ShipmentPrintView';
import StoryCircles from '@/components/stories/StoryCircles';
import SmartRequestDialog from './SmartRequestDialog';
import AdminDashboardSwitcher from './admin/AdminDashboardSwitcher';
import {
  AdminStatsGrid,
  OrganizationBreakdown,
  ResetPasswordDialog,
  AdminRecentShipments,
  AdminPartnersTab,
  AdminTrackingTab,
  AdminDailyOperationsSummary,
  AdminOperationalAlerts,
  AdminActiveTracking,
  AdminPendingApprovals,
  AdminShipmentSearch,
  StatCard,
} from './admin';
import AdminEntityList from './admin/AdminEntityList';
import AdminCredentialControl from './admin/AdminCredentialControl';
import DriverLinkingCode from '@/components/drivers/DriverLinkingCode';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import { usePlatformSetting } from '@/hooks/usePlatformSetting';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import DashboardPrintReports from './shared/DashboardPrintReports';
import SmartDailyBrief from './shared/SmartDailyBrief';

import DailyOperationsSummary from './operations/DailyOperationsSummary';
import DashboardAlertsHub from './shared/DashboardAlertsHub';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import DocumentVerificationWidget from './DocumentVerificationWidget';

import {
  Package, Factory, Building2, Truck, Users, FileText, MapPin, Activity,
  ChartBar, UserPlus, Recycle, Plus, Bot, LayoutDashboard, Link, Leaf,
  ClipboardList, Shield, FileCheck, Navigation, Brain, BarChart3,
  CalendarDays, Cpu, Handshake, DollarSign, Store, Wrench, AlertTriangle,
  ShieldAlert, Link2, Wifi, HardHat, Wallet, Camera, GraduationCap,
  Scale, Stamp, Settings, Briefcase,
} from 'lucide-react';

// ═══ Lazy load ALL entity components ═══

// Generator widgets
const GeneratorCommandCenter = lazy(() => import('./generator/GeneratorCommandCenter'));
const DashboardBrief = lazy(() => import('./generator/DashboardBrief'));
const WeeklyShipmentChart = lazy(() => import('./generator/WeeklyShipmentChart'));
const FinancialSummaryWidget = lazy(() => import('./generator/FinancialSummaryWidget'));
const ComplianceGauge = lazy(() => import('./generator/ComplianceGauge'));
const GeneratorTrackingWidget = lazy(() => import('./generator/GeneratorTrackingWidget'));
const DisposalRadarWidget = lazy(() => import('./generator/DisposalRadarWidget'));
const OrgPerformanceRadar = lazy(() => import('./shared/OrgPerformanceRadar'));
const ESGReportWidget = lazy(() => import('./generator/ESGReportWidget'));
const LegalArchiveWidget = lazy(() => import('./generator/LegalArchiveWidget'));
const LegalComplianceWidget = lazy(() => import('./generator/LegalComplianceWidget'));
const WorkOrderInbox = lazy(() => import('@/components/work-orders/WorkOrderInbox'));
const CreateWorkOrderDialog = lazy(() => import('@/components/work-orders/CreateWorkOrderDialog'));
const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const DriverCodeLookup = lazy(() => import('@/components/drivers/DriverCodeLookup'));
const BulkCertificateButton = lazy(() => import('@/components/bulk/BulkCertificateButton'));

// Compliance widgets
const ComplianceCertificateWidget = lazy(() => import('@/components/compliance/ComplianceCertificateWidget'));
const ConsultantKPIsWidget = lazy(() => import('@/components/compliance/ConsultantKPIsWidget'));
const ComplianceAlertsWidget = lazy(() => import('@/components/compliance/ComplianceAlertsWidget'));
const RiskMatrixWidget = lazy(() => import('@/components/compliance/RiskMatrixWidget'));
const CorrectiveActionsWidget = lazy(() => import('@/components/compliance/CorrectiveActionsWidget'));
const AuditPortalWidget = lazy(() => import('@/components/compliance/AuditPortalWidget'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));

// Transporter widgets
const TransporterAIInsights = lazy(() => import('@/components/ai/TransporterAIInsights'));
const SmartSchedulerPanel = lazy(() => import('@/components/ai/SmartSchedulerPanel'));
const RouteOptimizerPanel = lazy(() => import('@/components/ai/RouteOptimizerPanel'));
const DriverPerformancePanel = lazy(() => import('./transporter/DriverPerformancePanel'));
const TripCostManagement = lazy(() => import('./transporter/TripCostManagement'));
const MaintenanceScheduler = lazy(() => import('./transporter/MaintenanceScheduler'));
const ShipmentCalendarWidget = lazy(() => import('./transporter/ShipmentCalendarWidget'));
const PartnerProfitabilityPanel = lazy(() => import('./transporter/PartnerProfitabilityPanel'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const PartnersView = lazy(() => import('./PartnersView'));
const SignalMonitorWidget = lazy(() => import('@/components/tracking/SignalMonitorWidget'));
const TransporterDriverTracking = lazy(() => import('./transporter/TransporterDriverTracking'));
const SmartDriverNotifications = lazy(() => import('./transporter/SmartDriverNotifications'));
const SustainabilityReportGenerator = lazy(() => import('./transporter/SustainabilityReportGenerator'));
const EnhancedDriverPerformance = lazy(() => import('./transporter/EnhancedDriverPerformance'));
const DynamicPricingEngine = lazy(() => import('./transporter/DynamicPricingEngine'));
const DriverCopilot = lazy(() => import('./transporter/DriverCopilot'));
const PredictiveFleetMaintenance = lazy(() => import('./transporter/PredictiveFleetMaintenance'));
const FraudDetectionPanel = lazy(() => import('./transporter/FraudDetectionPanel'));
const WasteMarketplace = lazy(() => import('@/components/marketplace/WasteMarketplace'));
const PartnerRiskPanel = lazy(() => import('./transporter/PartnerRiskPanel'));
const ChainOfCustodyPanel = lazy(() => import('./transporter/ChainOfCustodyPanel'));
const GovernmentReportingPanel = lazy(() => import('./transporter/GovernmentReportingPanel'));
const CarbonCreditsPanel = lazy(() => import('./transporter/CarbonCreditsPanel'));
const IoTMonitoringPanel = lazy(() => import('./transporter/IoTMonitoringPanel'));
const FleetUtilizationWidget = lazy(() => import('./operations/FleetUtilizationWidget'));
const TransporterPerformanceCharts = lazy(() => import('./transporter/TransporterPerformanceCharts'));

// Disposal widgets
const FacilityCapacityCard = lazy(() => import('./shared/FacilityCapacityCard'));
const DisposalIncomingPanel = lazy(() => import('./disposal/DisposalIncomingPanel'));
const DisposalDailyOperations = lazy(() => import('./disposal/DisposalDailyOperations'));
const DisposalRecentOperations = lazy(() => import('./disposal/DisposalRecentOperations'));

// Safety & WMIS
const SafetyManagerDashboard = lazy(() => import('@/components/safety/SafetyManagerDashboard'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const ImpactDashboard = lazy(() => import('@/components/impact/ImpactDashboard'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));

// Driver widgets
const DriverEarningsDashboard = lazy(() => import('@/components/driver/DriverEarningsDashboard'));
const DriverWalletPanel = lazy(() => import('@/components/driver/DriverWalletPanel'));
const DriverRewardsPanel = lazy(() => import('@/components/driver/DriverRewardsPanel'));
const DriverLeaderboard = lazy(() => import('@/components/driver/DriverLeaderboard'));
const DriverAutoReport = lazy(() => import('@/components/driver/DriverAutoReport'));

// Consulting Office widgets
const OfficeTeamPanel = lazy(() => import('@/components/consulting-office/OfficeTeamPanel'));
const OfficeClientsPanel = lazy(() => import('@/components/consulting-office/OfficeClientsPanel'));
const SigningPoliciesPanel = lazy(() => import('@/components/consulting-office/SigningPoliciesPanel'));
const ApprovalQueuePanel = lazy(() => import('@/components/consulting-office/ApprovalQueuePanel'));
const OfficeDocumentsPanel = lazy(() => import('@/components/consulting-office/OfficeDocumentsPanel'));
const OfficeLicensesPanel = lazy(() => import('@/components/consulting-office/OfficeLicensesPanel'));
const OfficeFinancePanel = lazy(() => import('@/components/consulting-office/OfficeFinancePanel'));
const ConsultantAnalyticsPanel = lazy(() => import('@/components/consultant/ConsultantAnalyticsPanel'));
const ConsultantSmartAlerts = lazy(() => import('@/components/consultant/ConsultantSmartAlerts'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  registeredCompanies: number;
  activeDrivers: number;
  totalDrivers: number;
  pendingUsers: number;
  generatorCount: number;
  transporterCount: number;
  recyclerCount: number;
}

interface RecentShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
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
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

// All admin tabs
const adminTabKeys = [
  { value: 'overview', labelKey: 'dashboard.tabs.overview', icon: LayoutDashboard },
  { value: 'generators', labelKey: 'dashboard.tabs.generators', icon: Factory },
  { value: 'transporters', labelKey: 'dashboard.tabs.transporters', icon: Truck },
  { value: 'recyclers', labelKey: 'dashboard.tabs.recyclers', icon: Recycle },
  { value: 'operations', labelKey: 'dashboard.tabs.operations', icon: Activity },
  { value: 'work-orders', labelKey: 'dashboard.tabs.workOrders', icon: ClipboardList },
  { value: 'ai', labelKey: 'dashboard.tabs.ai', icon: Brain },
  { value: 'performance', labelKey: 'dashboard.tabs.performance', icon: BarChart3 },
  { value: 'fleet', labelKey: 'dashboard.tabs.fleet', icon: Wrench },
  { value: 'pricing', labelKey: 'dashboard.tabs.pricing', icon: DollarSign },
  { value: 'marketplace', labelKey: 'dashboard.tabs.marketplace', icon: Store },
  { value: 'fraud', labelKey: 'dashboard.tabs.fraud', icon: AlertTriangle },
  { value: 'risk', labelKey: 'dashboard.tabs.risk', icon: ShieldAlert },
  { value: 'custody', labelKey: 'dashboard.tabs.custody', icon: Link2 },
  { value: 'disposal', labelKey: 'dashboard.tabs.disposal', icon: Factory },
  { value: 'drivers', labelKey: 'dashboard.tabs.drivers', icon: Users },
  { value: 'partners', labelKey: 'dashboard.tabs.partners', icon: Handshake },
  { value: 'tracking', labelKey: 'dashboard.tabs.tracking', icon: MapPin },
  { value: 'geofence', labelKey: 'dashboard.tabs.geofence', icon: Navigation },
  { value: 'compliance', labelKey: 'dashboard.tabs.compliance', icon: Shield },
  { value: 'wmis', labelKey: 'dashboard.tabs.wmis', icon: ShieldAlert },
  { value: 'ohs', labelKey: 'dashboard.tabs.ohs', icon: HardHat },
  { value: 'consulting', labelKey: 'dashboard.tabs.consulting', icon: Briefcase },
  { value: 'calendar', labelKey: 'dashboard.tabs.calendar', icon: CalendarDays },
  { value: 'government', labelKey: 'dashboard.tabs.government', icon: Building2 },
  { value: 'carbon', labelKey: 'dashboard.tabs.carbon', icon: Leaf },
  { value: 'iot', labelKey: 'dashboard.tabs.iot', icon: Wifi },
  { value: 'esg', labelKey: 'dashboard.tabs.esg', icon: Leaf },
  { value: 'impact', labelKey: 'dashboard.tabs.impact', icon: Activity },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { enabled: aiEnabled, toggle: toggleAI } = usePlatformSetting('ai_assistant_enabled');
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0, activeShipments: 0, registeredCompanies: 0,
    activeDrivers: 0, totalDrivers: 0, pendingUsers: 0,
    generatorCount: 0, transporterCount: 0, recyclerCount: 0,
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedShipmentForPrint, setSelectedShipmentForPrint] = useState<any>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: shipmentsRaw, count: totalShipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, quantity, unit, created_at, generator_id, transporter_id, recycler_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: orgsData } = await supabase.from('organizations').select('id, name');
      const orgsMap: Record<string, any> = {};
      orgsData?.forEach(o => { orgsMap[o.id] = { name: o.name }; });

      const shipments = (shipmentsRaw || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: null,
      }));

      const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status || '')).length;

      const { data: organizations } = await supabase.from('organizations').select('organization_type');
      const generatorCount = organizations?.filter(o => o.organization_type === 'generator').length || 0;
      const transporterCount = organizations?.filter(o => o.organization_type === 'transporter').length || 0;
      const recyclerCount = organizations?.filter(o => o.organization_type === 'recycler').length || 0;

      const { data: drivers } = await supabase.from('drivers').select('is_available');
      const activeDrivers = drivers?.filter(d => d.is_available).length || 0;

      const { data: pendingProfiles } = await supabase.from('profiles').select('id').is('organization_id', null);

      setStats({
        totalShipments: totalShipments || 0, activeShipments,
        registeredCompanies: organizations?.length || 0, activeDrivers,
        totalDrivers: drivers?.length || 0, pendingUsers: pendingProfiles?.length || 0,
        generatorCount, transporterCount, recyclerCount,
      });
      setRecentShipments(shipments as unknown as RecentShipment[] || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    { title: t('dashboard.totalShipments'), value: stats.totalShipments, subtitle: t('dashboard.allShipments'), icon: FileText },
    { title: t('dashboard.activeShipments'), value: stats.activeShipments, subtitle: t('dashboard.currentlyActive'), icon: Truck },
    { title: t('dashboard.registeredEntities'), value: stats.registeredCompanies, subtitle: t('dashboard.allCategories'), icon: Building2 },
    { title: t('dashboard.activeDrivers'), value: stats.activeDrivers, subtitle: `${t('dashboard.outOf')} ${stats.totalDrivers}`, icon: Users },
  ];

  const quickActions = useQuickActions({ type: 'admin' });

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Smart Daily Brief */}
      <motion.div variants={itemVariants}>
        <SmartDailyBrief
          role="admin"
          stats={{
            pending: recentShipments.filter(s => s.status === 'new').length,
            active: recentShipments.filter(s => ['approved', 'in_transit'].includes(s.status)).length,
            completed: recentShipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length,
            total: stats.totalShipments,
          }}
        />
      </motion.div>

      {/* Stories */}
      <motion.div variants={itemVariants}>
        <StoryCircles />
      </motion.div>


      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold">{t('dashboard.adminPanel')}</h1>
          <p className="text-primary">{t('dashboard.welcomeAdmin')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-muted/50">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('dashboard.smartAssistant')}</span>
            <Switch checked={aiEnabled} onCheckedChange={(checked) => { toggleAI(checked); sonnerToast(checked ? t('dashboard.smartAssistantEnabled') : t('dashboard.smartAssistantDisabled')); }} />
          </div>
          <DashboardPrintReports />
          <AdminCredentialControl />
          <AdminDashboardSwitcher />
          <SmartRequestDialog buttonText={t('dashboard.requestReports')} buttonVariant="outline" />
          <Button variant="outline" size="sm" onClick={() => setShowWorkOrder(true)} className="gap-1.5">
            <ClipboardList className="h-4 w-4" />{t('dashboard.workOrder')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSmartWeightUpload(true)} className="gap-1.5">
            <Scale className="h-4 w-4" />{t('dashboard.smartWeight')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDepositDialog(true)} className="gap-1.5">
            <Wallet className="h-4 w-4" />{t('dashboard.deposit')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/shipments')}>
            <FileText className="ml-2 h-4 w-4" />{t('dashboard.viewShipments')}
          </Button>
          <Button variant="eco" onClick={() => navigate('/dashboard/shipments/new')}>
            <Plus className="ml-2 h-4 w-4" />{t('dashboard.createShipment')}
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <AdminStatsGrid stats={statCards} />
      </motion.div>

      {/* Organization Breakdown */}
      <motion.div variants={itemVariants}>
        <OrganizationBreakdown generatorCount={stats.generatorCount} transporterCount={stats.transporterCount} recyclerCount={stats.recyclerCount} />
      </motion.div>

      {/* Daily Operations Summary */}
      <motion.div variants={itemVariants}>
        <AdminDailyOperationsSummary />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
          <DailyOperationsSummary />
        </ErrorBoundary>
      </motion.div>

      {/* Operational Alerts */}
      <motion.div variants={itemVariants}>
        <AdminOperationalAlerts />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ErrorBoundary fallbackTitle="خطأ في التنبيهات">
          <OperationalAlertsWidget />
        </ErrorBoundary>
      </motion.div>

      <AutomationSettingsDialog organizationType="generator" />

      {/* Unified Document Search */}
      <motion.div variants={itemVariants}>
        <UnifiedDocumentSearch />
      </motion.div>

      {/* Shipment Search */}
      <motion.div variants={itemVariants}>
        <AdminShipmentSearch />
      </motion.div>

      {/* Active Tracking */}
      <motion.div variants={itemVariants}>
        <AdminActiveTracking />
      </motion.div>

      {/* Pending Approvals */}
      <motion.div variants={itemVariants}>
        <AdminPendingApprovals />
      </motion.div>

      <PendingApprovalsWidget />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* COMPREHENSIVE TABS — All entity features in one place */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="overview" className="w-full" dir="rtl">
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r from-card via-card to-muted/20 p-1.5 shadow-sm">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-0.5 sm:gap-1 h-auto p-0 scrollbar-hide">
            {adminTabKeys.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-[9px] sm:text-xs whitespace-nowrap gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 hover:text-foreground hover:bg-muted/50 transition-all duration-300"
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline font-medium">{t(tab.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── نظرة عامة ── */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <DashboardBrief />
          </Suspense>

          <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
            <Suspense fallback={<TabFallback />}>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                <WeeklyShipmentChart />
                <ComplianceGauge />
              </div>
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="خطأ في استخدام الأسطول">
            <Suspense fallback={<TabFallback />}>
              <FleetUtilizationWidget />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
            <Suspense fallback={<TabFallback />}>
              <TransporterPerformanceCharts />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="خطأ في الملخص المالي">
            <Suspense fallback={<TabFallback />}>
              <FinancialSummaryWidget />
            </Suspense>
          </ErrorBoundary>

          <QuickActionsGrid actions={quickActions} title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsAdmin')} />

          <AdminRecentShipments shipments={recentShipments} onRefresh={fetchDashboardData} />
        </TabsContent>

        {/* ── المولدين ── */}
        <TabsContent value="generators" className="space-y-6 mt-6">
          <AdminEntityList orgType="generator" />
        </TabsContent>

        {/* ── الناقلين ── */}
        <TabsContent value="transporters" className="space-y-6 mt-6">
          <AdminEntityList orgType="transporter" />
        </TabsContent>

        {/* ── المعالجين ── */}
        <TabsContent value="recyclers" className="space-y-6 mt-6">
          <AdminEntityList orgType="recycler" />
        </TabsContent>

        {/* ── العمليات ── */}
        <TabsContent value="operations" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في مركز القيادة">
              <GeneratorCommandCenter />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="خطأ في التتبع">
              <GeneratorTrackingWidget />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="خطأ في رادار التخلص">
              <DisposalRadarWidget />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
              <OrgPerformanceRadar />
            </ErrorBoundary>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              <ErrorBoundary fallbackTitle="خطأ في ESG">
                <ESGReportWidget />
              </ErrorBoundary>
              <DriverCodeLookup />
            </div>
          </Suspense>
        </TabsContent>

        {/* ── أوامر الشغل ── */}
        <TabsContent value="work-orders" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <WorkOrderInbox />
          </Suspense>
        </TabsContent>

        {/* ── الذكاء الاصطناعي ── */}
        <TabsContent value="ai" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في تحليلات الذكاء الاصطناعي">
              <TransporterAIInsights />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── الأداء والتكاليف ── */}
        <TabsContent value="performance" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في لوحة الأداء">
              <EnhancedDriverPerformance />
              <DriverPerformancePanel />
              <TripCostManagement />
              <SmartDriverNotifications />
              <MaintenanceScheduler />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── الأسطول والصيانة ── */}
        <TabsContent value="fleet" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في صيانة الأسطول">
              <PredictiveFleetMaintenance />
              <VehicleComplianceManager />
              <DriverComplianceManager />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── التسعير الذكي ── */}
        <TabsContent value="pricing" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في التسعير الذكي">
              <DynamicPricingEngine />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── السوق ── */}
        <TabsContent value="marketplace" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في السوق">
              <WasteMarketplace />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── كشف الاحتيال ── */}
        <TabsContent value="fraud" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في كشف الاحتيال">
              <FraudDetectionPanel />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── مخاطر الشركاء ── */}
        <TabsContent value="risk" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في تحليل المخاطر">
              <PartnerRiskPanel />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── سلسلة الحفظ ── */}
        <TabsContent value="custody" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في سلسلة الحفظ">
              <ChainOfCustodyPanel />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── التخلص النهائي ── */}
        <TabsContent value="disposal" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في عمليات التخلص">
              <DisposalDailyOperations />
              <DisposalIncomingPanel />
              <DisposalRecentOperations />
              <IncidentReportManager />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── السائقون ── */}
        <TabsContent value="drivers" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في بيانات السائقين">
              <DriverEarningsDashboard />
              <DriverWalletPanel />
              <DriverRewardsPanel />
              <DriverLeaderboard />
              <DriverAutoReport />
              <DriverCopilot />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── الجهات المرتبطة ── */}
        <TabsContent value="partners" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <SustainabilityReportGenerator />
            <PartnerRatingsWidget />
            <PartnerProfitabilityPanel />
            <PartnersView />
          </Suspense>
          <AdminPartnersTab generatorCount={stats.generatorCount} transporterCount={stats.transporterCount} recyclerCount={stats.recyclerCount} />
        </TabsContent>

        {/* ── تتبع السائقين ── */}
        <TabsContent value="tracking" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <SignalMonitorWidget />
          </Suspense>
          <DriverLinkingCode />
          <AdminTrackingTab activeDrivers={stats.activeDrivers} totalDrivers={stats.totalDrivers} />
        </TabsContent>

        {/* ── الجيوفنس ── */}
        <TabsContent value="geofence" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <GeofenceAlertsPanel />
          </Suspense>
        </TabsContent>

        {/* ── الامتثال الشامل ── */}
        <TabsContent value="compliance" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ComplianceAlertsWidget />
            <ConsultantKPIsWidget />
            <ComplianceCertificateWidget />
            <RiskMatrixWidget />
            <CorrectiveActionsWidget />
            <AuditPortalWidget />
            <LegalComplianceWidget />
            <LegalArchiveWidget />
            <IncidentReportManager />
          </Suspense>
        </TabsContent>

        {/* ── WMIS ── */}
        <TabsContent value="wmis" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في نظام WMIS">
              <WMISEventsFeed />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── السلامة المهنية ── */}
        <TabsContent value="ohs" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في تقارير السلامة المهنية">
              <SafetyManagerDashboard />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── المكتب الاستشاري ── */}
        <TabsContent value="consulting" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في أدوات المكتب الاستشاري">
              <ConsultantSmartAlerts mode="office" />
              <OfficeTeamPanel />
              <OfficeClientsPanel />
              <SigningPoliciesPanel />
              <ApprovalQueuePanel />
              <OfficeDocumentsPanel />
              <OfficeLicensesPanel />
              <OfficeFinancePanel />
              <ConsultantAnalyticsPanel mode="office" />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── التقويم ── */}
        <TabsContent value="calendar" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ShipmentCalendarWidget />
            <SmartSchedulerPanel />
            <RouteOptimizerPanel driverId="" destinations={[]} />
          </Suspense>
        </TabsContent>

        {/* ── البوابة الحكومية ── */}
        <TabsContent value="government" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في البوابة الحكومية">
              <GovernmentReportingPanel />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── أرصدة الكربون ── */}
        <TabsContent value="carbon" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في أرصدة الكربون">
              <CarbonCreditsPanel />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── IoT ── */}
        <TabsContent value="iot" className="space-y-4 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ErrorBoundary fallbackTitle="خطأ في IoT">
              <IoTMonitoringPanel />
            </ErrorBoundary>
          </Suspense>
        </TabsContent>

        {/* ── تقارير ESG ── */}
        <TabsContent value="esg" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ESGReportPanel />
          </Suspense>
        </TabsContent>

        {/* ── سلسلة الأثر ── */}
        <TabsContent value="impact" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <ImpactDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* ═══ Dialogs ═══ */}
      <ShipmentPrintView isOpen={printDialogOpen} onClose={() => setPrintDialogOpen(false)} shipment={selectedShipmentForPrint} />
      <ResetPasswordDialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog} user={selectedUser} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <DocumentVerificationWidget open={showDocumentVerification} onOpenChange={setShowDocumentVerification} />
      <Suspense fallback={null}>
        <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
        <CreateWorkOrderDialog open={showWorkOrder} onOpenChange={setShowWorkOrder} />
      </Suspense>
    </motion.div>
  );
};

export default AdminDashboard;
