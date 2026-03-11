import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  UserPlus, Recycle, Plus, Bot, LayoutDashboard, Leaf,
  ClipboardList, Shield, Navigation, Brain, BarChart3,
  CalendarDays, Handshake, DollarSign, Store, Wrench, AlertTriangle,
  ShieldAlert, Link2, Wifi, HardHat, Wallet, Scale, Settings,
  Briefcase, Zap, CreditCard, Database, Globe,
} from 'lucide-react';

// ═══ Lazy load widgets ═══

// Sovereign Governance
const SovereignGovernanceDashboard = lazy(() => import('@/components/admin/sovereign/SovereignGovernanceDashboard'));

// Command Center widgets
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

// Compliance & Safety
const ComplianceCertificateWidget = lazy(() => import('@/components/compliance/ComplianceCertificateWidget'));
const ConsultantKPIsWidget = lazy(() => import('@/components/compliance/ConsultantKPIsWidget'));
const ComplianceAlertsWidget = lazy(() => import('@/components/compliance/ComplianceAlertsWidget'));
const RiskMatrixWidget = lazy(() => import('@/components/compliance/RiskMatrixWidget'));
const CorrectiveActionsWidget = lazy(() => import('@/components/compliance/CorrectiveActionsWidget'));
const AuditPortalWidget = lazy(() => import('@/components/compliance/AuditPortalWidget'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));

// Operations & Fleet
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

// Disposal
const DisposalIncomingPanel = lazy(() => import('./disposal/DisposalIncomingPanel'));
const DisposalDailyOperations = lazy(() => import('./disposal/DisposalDailyOperations'));
const DisposalRecentOperations = lazy(() => import('./disposal/DisposalRecentOperations'));

// Safety & Environment
const SafetyManagerDashboard = lazy(() => import('@/components/safety/SafetyManagerDashboard'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const ImpactDashboard = lazy(() => import('@/components/impact/ImpactDashboard'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));

// Driver widgets
const DriverEarningsDashboard = lazy(() => import('@/components/driver/DriverEarningsDashboard'));
const DriverWalletPanel = lazy(() => import('@/components/driver/DriverWalletPanel'));
const DriverRewardsPanel = lazy(() => import('@/components/driver/DriverRewardsPanel'));
const DriverLeaderboard = lazy(() => import('@/components/driver/DriverLeaderboard'));
const DriverAutoReport = lazy(() => import('@/components/driver/DriverAutoReport'));

// Consulting Office
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

// ═══════════════════════════════════════════════════════════════
// 6 Strategic Pillars — matching sidebar groups
// ═══════════════════════════════════════════════════════════════
const pillarTabs = [
  { value: 'command-center', labelAr: 'مركز القيادة', labelEn: 'Command Center', icon: Zap },
  { value: 'sovereign', labelAr: 'الحوكمة السيادية', labelEn: 'Sovereign', icon: ShieldAlert },
  { value: 'entities', labelAr: 'إدارة الكيانات', labelEn: 'Entities', icon: Building2 },
  { value: 'users-fleet', labelAr: 'المستخدمون والأسطول', labelEn: 'Users & Fleet', icon: Truck },
  { value: 'finance', labelAr: 'المالية والإيرادات', labelEn: 'Finance', icon: CreditCard },
  { value: 'compliance', labelAr: 'الامتثال والرقابة', labelEn: 'Compliance', icon: Shield },
  { value: 'analytics-ai', labelAr: 'التحليلات والذكاء', labelEn: 'Analytics & AI', icon: Brain },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { enabled: aiEnabled, toggle: toggleAI } = usePlatformSetting('ai_assistant_enabled');
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
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

      return {
        stats: {
          totalShipments: totalShipments || 0, activeShipments,
          registeredCompanies: organizations?.length || 0, activeDrivers,
          totalDrivers: drivers?.length || 0, pendingUsers: pendingProfiles?.length || 0,
          generatorCount, transporterCount, recyclerCount,
        },
        recentShipments: shipments as unknown as RecentShipment[],
      };
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const stats = dashboardData?.stats || {
    totalShipments: 0, activeShipments: 0, registeredCompanies: 0,
    activeDrivers: 0, totalDrivers: 0, pendingUsers: 0,
    generatorCount: 0, transporterCount: 0, recyclerCount: 0,
  };
  const recentShipments = dashboardData?.recentShipments || [];
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedShipmentForPrint, setSelectedShipmentForPrint] = useState<any>(null);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);

  const statCards: StatCard[] = [
    { title: t('dashboard.totalShipments'), value: stats.totalShipments, subtitle: t('dashboard.allShipments'), icon: FileText },
    { title: t('dashboard.activeShipments'), value: stats.activeShipments, subtitle: t('dashboard.currentlyActive'), icon: Truck },
    { title: t('dashboard.registeredEntities'), value: stats.registeredCompanies, subtitle: t('dashboard.allCategories'), icon: Building2 },
    { title: t('dashboard.activeDrivers'), value: stats.activeDrivers, subtitle: `${t('dashboard.outOf')} ${stats.totalDrivers}`, icon: Users },
  ];

  const quickActions = useQuickActions({ type: 'admin' });
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* ═══ Smart Brief ═══ */}
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

      <motion.div variants={itemVariants}>
        <StoryCircles />
      </motion.div>

      {/* ═══ Header ═══ */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            {isRTL ? 'مركز القيادة والسيطرة' : 'Command & Control Center'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t('dashboard.welcomeAdmin')}</p>
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
          <Button variant="outline" size="sm" onClick={() => setShowDepositDialog(true)} className="gap-1.5">
            <Wallet className="h-4 w-4" />{t('dashboard.deposit')}
          </Button>
          <Button variant="eco" onClick={() => navigate('/dashboard/shipments/new')}>
            <Plus className="ml-2 h-4 w-4" />{t('dashboard.createShipment')}
          </Button>
        </div>
      </motion.div>

      {/* ═══ KPIs Grid ═══ */}
      <motion.div variants={itemVariants}>
        <AdminStatsGrid stats={statCards} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <OrganizationBreakdown generatorCount={stats.generatorCount} transporterCount={stats.transporterCount} recyclerCount={stats.recyclerCount} />
      </motion.div>

      {/* ═══ Real-time Alerts ═══ */}
      <motion.div variants={itemVariants}>
        <AdminOperationalAlerts />
      </motion.div>
      <motion.div variants={itemVariants}>
        <DashboardAlertsHub orgType="admin" />
      </motion.div>

      <AutomationSettingsDialog organizationType="generator" />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 6 STRATEGIC PILLARS — Unified Command Tabs                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="command-center" className="w-full" dir="rtl">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-r from-card via-card to-muted/10 p-1.5 shadow-sm">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-1 h-auto p-0 scrollbar-hide">
            {pillarTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm whitespace-nowrap gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl text-muted-foreground font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 hover:text-foreground hover:bg-muted/50 transition-all duration-300"
              >
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold">{isRTL ? tab.labelAr : tab.labelEn}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ═══ 0. الحوكمة السيادية — Sovereign Governance ═══ */}
        <TabsContent value="sovereign" className="mt-6">
          <Suspense fallback={<TabFallback />}>
            <SovereignGovernanceDashboard />
          </Suspense>
        </TabsContent>

        {/* ═══ 1. مركز القيادة — Command Center ═══ */}
        <TabsContent value="command-center" className="space-y-6 mt-6">
          <Suspense fallback={<TabFallback />}>
            <DashboardBrief />
          </Suspense>

          {/* Daily Operations */}
          <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
            <AdminDailyOperationsSummary />
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
            <DailyOperationsSummary />
          </ErrorBoundary>

          {/* Charts */}
          <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
            <Suspense fallback={<TabFallback />}>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <WeeklyShipmentChart />
                <ComplianceGauge />
              </div>
            </Suspense>
          </ErrorBoundary>

          {/* Active Tracking & Approvals */}
          <AdminActiveTracking />
          <AdminPendingApprovals />
          <PendingApprovalsWidget />

          {/* Search */}
          <UnifiedDocumentSearch />
          <AdminShipmentSearch />

          {/* Quick Actions */}
          <QuickActionsGrid actions={quickActions} title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsAdmin')} />

          {/* Recent */}
          <AdminRecentShipments shipments={recentShipments} onRefresh={() => {}} />

          {/* Operations widgets */}
          <ErrorBoundary fallbackTitle="خطأ في مركز القيادة">
            <Suspense fallback={<TabFallback />}>
              <GeneratorCommandCenter />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في التتبع">
            <Suspense fallback={<TabFallback />}>
              <GeneratorTrackingWidget />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
            <Suspense fallback={<TabFallback />}>
              <OrgPerformanceRadar />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        {/* ═══ 2. إدارة الكيانات — Entity Management ═══ */}
        <TabsContent value="entities" className="space-y-6 mt-6">
          {/* Sub-tabs for entity types */}
          <Tabs defaultValue="all-entities" className="w-full" dir="rtl">
            <TabsList className="w-full justify-start bg-muted/30 rounded-xl p-1 gap-1">
              {[
                { value: 'all-entities', label: 'جميع الكيانات', labelEn: 'All Entities', icon: Building2 },
                { value: 'generators-list', label: 'المولّدين', labelEn: 'Generators', icon: Factory },
                { value: 'transporters-list', label: 'الناقلين', labelEn: 'Transporters', icon: Truck },
                { value: 'recyclers-list', label: 'المدورين', labelEn: 'Recyclers', icon: Recycle },
                { value: 'partners-list', label: 'الشركاء', labelEn: 'Partners', icon: Handshake },
                { value: 'disposal-list', label: 'التخلص', labelEn: 'Disposal', icon: Factory },
              ].map(sub => (
                <TabsTrigger key={sub.value} value={sub.value} className="text-xs gap-1 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <sub.icon className="w-3.5 h-3.5" />
                  {isRTL ? sub.label : sub.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all-entities" className="mt-4 space-y-4">
              <OrganizationBreakdown generatorCount={stats.generatorCount} transporterCount={stats.transporterCount} recyclerCount={stats.recyclerCount} />
            </TabsContent>
            <TabsContent value="generators-list" className="mt-4">
              <AdminEntityList orgType="generator" />
            </TabsContent>
            <TabsContent value="transporters-list" className="mt-4">
              <AdminEntityList orgType="transporter" />
            </TabsContent>
            <TabsContent value="recyclers-list" className="mt-4">
              <AdminEntityList orgType="recycler" />
            </TabsContent>
            <TabsContent value="partners-list" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <SustainabilityReportGenerator />
                <PartnerRatingsWidget />
                <PartnerProfitabilityPanel />
                <PartnersView />
              </Suspense>
              <AdminPartnersTab generatorCount={stats.generatorCount} transporterCount={stats.transporterCount} recyclerCount={stats.recyclerCount} />
            </TabsContent>
            <TabsContent value="disposal-list" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في التخلص">
                  <DisposalDailyOperations />
                  <DisposalIncomingPanel />
                  <DisposalRecentOperations />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ 3. المستخدمون والأسطول — Users & Fleet ═══ */}
        <TabsContent value="users-fleet" className="space-y-6 mt-6">
          <Tabs defaultValue="fleet-overview" className="w-full" dir="rtl">
            <TabsList className="w-full justify-start bg-muted/30 rounded-xl p-1 gap-1">
              {[
                { value: 'fleet-overview', label: 'نظرة عامة', labelEn: 'Overview', icon: LayoutDashboard },
                { value: 'drivers-tab', label: 'السائقون', labelEn: 'Drivers', icon: Users },
                { value: 'tracking-tab', label: 'التتبع', labelEn: 'Tracking', icon: MapPin },
                { value: 'fleet-maintenance', label: 'الأسطول والصيانة', labelEn: 'Fleet & Maintenance', icon: Wrench },
                { value: 'geofence-tab', label: 'الجيوفنس', labelEn: 'Geofence', icon: Navigation },
                { value: 'performance-tab', label: 'الأداء', labelEn: 'Performance', icon: BarChart3 },
              ].map(sub => (
                <TabsTrigger key={sub.value} value={sub.value} className="text-xs gap-1 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <sub.icon className="w-3.5 h-3.5" />
                  {isRTL ? sub.label : sub.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="fleet-overview" className="mt-4 space-y-4">
              <ErrorBoundary fallbackTitle="خطأ في استخدام الأسطول">
                <Suspense fallback={<TabFallback />}><FleetUtilizationWidget /></Suspense>
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="خطأ في الرسوم">
                <Suspense fallback={<TabFallback />}><TransporterPerformanceCharts /></Suspense>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="drivers-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في بيانات السائقين">
                  <DriverEarningsDashboard />
                  <DriverWalletPanel />
                  <DriverRewardsPanel />
                  <DriverLeaderboard />
                  <DriverAutoReport />
                  <DriverCopilot />
                  <SmartDriverNotifications />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>

            <TabsContent value="tracking-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <SignalMonitorWidget />
              </Suspense>
              <DriverLinkingCode />
              <AdminTrackingTab activeDrivers={stats.activeDrivers} totalDrivers={stats.totalDrivers} />
            </TabsContent>

            <TabsContent value="fleet-maintenance" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في صيانة الأسطول">
                  <PredictiveFleetMaintenance />
                  <MaintenanceScheduler />
                  <VehicleComplianceManager />
                  <DriverComplianceManager />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>

            <TabsContent value="geofence-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <GeofenceAlertsPanel />
              </Suspense>
            </TabsContent>

            <TabsContent value="performance-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في لوحة الأداء">
                  <EnhancedDriverPerformance />
                  <DriverPerformancePanel />
                  <TripCostManagement />
                </ErrorBoundary>
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ 4. المالية والإيرادات — Finance & Revenue ═══ */}
        <TabsContent value="finance" className="space-y-6 mt-6">
          <Tabs defaultValue="financial-overview" className="w-full" dir="rtl">
            <TabsList className="w-full justify-start bg-muted/30 rounded-xl p-1 gap-1">
              {[
                { value: 'financial-overview', label: 'الملخص المالي', labelEn: 'Financial Summary', icon: DollarSign },
                { value: 'pricing-tab', label: 'التسعير الذكي', labelEn: 'Smart Pricing', icon: BarChart3 },
                { value: 'marketplace-tab', label: 'السوق', labelEn: 'Marketplace', icon: Store },
                { value: 'calendar-tab', label: 'التقويم', labelEn: 'Calendar', icon: CalendarDays },
              ].map(sub => (
                <TabsTrigger key={sub.value} value={sub.value} className="text-xs gap-1 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <sub.icon className="w-3.5 h-3.5" />
                  {isRTL ? sub.label : sub.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="financial-overview" className="mt-4 space-y-4">
              <ErrorBoundary fallbackTitle="خطأ في الملخص المالي">
                <Suspense fallback={<TabFallback />}><FinancialSummaryWidget /></Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="pricing-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في التسعير"><DynamicPricingEngine /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="marketplace-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في السوق"><WasteMarketplace /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="calendar-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ShipmentCalendarWidget />
                <SmartSchedulerPanel />
                <RouteOptimizerPanel driverId="" destinations={[]} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ═══ 5. الامتثال والرقابة — Compliance & Oversight ═══ */}
        <TabsContent value="compliance" className="space-y-6 mt-6">
          <Tabs defaultValue="compliance-overview" className="w-full" dir="rtl">
            <TabsList className="w-full justify-start bg-muted/30 rounded-xl p-1 gap-1">
              {[
                { value: 'compliance-overview', label: 'الامتثال', labelEn: 'Compliance', icon: Shield },
                { value: 'safety-tab', label: 'السلامة', labelEn: 'Safety', icon: HardHat },
                { value: 'custody-tab', label: 'سلسلة الحيازة', labelEn: 'Chain of Custody', icon: Link2 },
                { value: 'fraud-tab', label: 'كشف الاحتيال', labelEn: 'Fraud Detection', icon: AlertTriangle },
                { value: 'risk-tab', label: 'المخاطر', labelEn: 'Risk', icon: ShieldAlert },
                { value: 'government-tab', label: 'البوابة الحكومية', labelEn: 'Government', icon: Building2 },
                { value: 'consulting-tab', label: 'الاستشارات', labelEn: 'Consulting', icon: Briefcase },
              ].map(sub => (
                <TabsTrigger key={sub.value} value={sub.value} className="text-xs gap-1 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <sub.icon className="w-3.5 h-3.5" />
                  {isRTL ? sub.label : sub.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="compliance-overview" className="mt-4 space-y-4">
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
            <TabsContent value="safety-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في السلامة"><SafetyManagerDashboard /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="custody-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في سلسلة الحيازة"><ChainOfCustodyPanel /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="fraud-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في كشف الاحتيال"><FraudDetectionPanel /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="risk-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في المخاطر"><PartnerRiskPanel /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="government-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في البوابة الحكومية"><GovernmentReportingPanel /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="consulting-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في الاستشارات">
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
          </Tabs>
        </TabsContent>

        {/* ═══ 6. التحليلات والذكاء — Analytics & AI ═══ */}
        <TabsContent value="analytics-ai" className="space-y-6 mt-6">
          <Tabs defaultValue="ai-insights" className="w-full" dir="rtl">
            <TabsList className="w-full justify-start bg-muted/30 rounded-xl p-1 gap-1">
              {[
                { value: 'ai-insights', label: 'الذكاء الاصطناعي', labelEn: 'AI Insights', icon: Brain },
                { value: 'carbon-tab', label: 'الكربون', labelEn: 'Carbon', icon: Leaf },
                { value: 'esg-tab', label: 'ESG', labelEn: 'ESG', icon: Leaf },
                { value: 'impact-tab', label: 'الأثر', labelEn: 'Impact', icon: Activity },
                { value: 'wmis-tab', label: 'WMIS', labelEn: 'WMIS', icon: ShieldAlert },
                { value: 'iot-tab', label: 'IoT', labelEn: 'IoT', icon: Wifi },
                { value: 'work-orders-tab', label: 'أوامر الشغل', labelEn: 'Work Orders', icon: ClipboardList },
              ].map(sub => (
                <TabsTrigger key={sub.value} value={sub.value} className="text-xs gap-1 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <sub.icon className="w-3.5 h-3.5" />
                  {isRTL ? sub.label : sub.labelEn}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="ai-insights" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في الذكاء الاصطناعي">
                  <TransporterAIInsights />
                </ErrorBoundary>
              </Suspense>
              <ErrorBoundary fallbackTitle="خطأ في رادار التخلص">
                <Suspense fallback={<TabFallback />}><DisposalRadarWidget /></Suspense>
              </ErrorBoundary>
              <Suspense fallback={<TabFallback />}>
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                  <ErrorBoundary fallbackTitle="خطأ في ESG"><ESGReportWidget /></ErrorBoundary>
                  <DriverCodeLookup />
                </div>
              </Suspense>
            </TabsContent>
            <TabsContent value="carbon-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في أرصدة الكربون"><CarbonCreditsPanel /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="esg-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}><ESGReportPanel /></Suspense>
            </TabsContent>
            <TabsContent value="impact-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}><ImpactDashboard /></Suspense>
            </TabsContent>
            <TabsContent value="wmis-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في WMIS"><WMISEventsFeed /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="iot-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}>
                <ErrorBoundary fallbackTitle="خطأ في IoT"><IoTMonitoringPanel /></ErrorBoundary>
              </Suspense>
            </TabsContent>
            <TabsContent value="work-orders-tab" className="mt-4 space-y-4">
              <Suspense fallback={<TabFallback />}><WorkOrderInbox /></Suspense>
            </TabsContent>
          </Tabs>
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
