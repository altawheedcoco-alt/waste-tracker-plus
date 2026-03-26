import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast as sonnerToast } from 'sonner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import QuickActionsGrid from './QuickActionsGrid';
import { useQuickActions } from '@/hooks/useQuickActions';

import StoryCircles from '@/components/stories/StoryCircles';
import SmartRequestDialog from './SmartRequestDialog';
import AdminDashboardSwitcher from './admin/AdminDashboardSwitcher';
import {
  AdminStatsGrid,
  OrganizationBreakdown,
  ResetPasswordDialog,
  AdminRecentShipments,
  AdminOperationalAlerts,
  StatCard,
} from './admin';
import AdminCredentialControl from './admin/AdminCredentialControl';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import { usePlatformSetting } from '@/hooks/usePlatformSetting';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';
import DashboardPrintReports from './shared/DashboardPrintReports';
import ConnectedSmartBrief from './shared/ConnectedSmartBrief';
import AICapabilitiesInfoDialog from '@/components/admin/AICapabilitiesInfoDialog';
import DashboardAlertsHub from './shared/DashboardAlertsHub';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';


import {
  FileText, Truck, Building2, Users, Plus, Bot, Zap,
  ClipboardList, Shield, Brain, CreditCard, Wallet, ShieldAlert,
} from 'lucide-react';

// Modular tab groups
import AdminCommandTabs from './admin/tabs/AdminCommandTabs';
import AdminOperationsTabs from './admin/tabs/AdminOperationsTabs';
import AdminComplianceAnalyticsTabs from './admin/tabs/AdminComplianceAnalyticsTabs';

const SmartWeightUpload = lazy(() => import('@/components/ai/SmartWeightUpload'));
const CreateWorkOrderDialog = lazy(() => import('@/components/work-orders/CreateWorkOrderDialog'));
const CommunicationHubWidget = lazy(() => import('./widgets/CommunicationHubWidget'));

const pillarTabs = [
  { value: 'command-center', labelAr: 'مركز القيادة', labelEn: 'Command Center', icon: Zap },
  { value: 'sovereign', labelAr: 'الحوكمة السيادية', labelEn: 'Sovereign', icon: ShieldAlert },
  { value: 'entities', labelAr: 'إدارة الكيانات', labelEn: 'Entities', icon: Building2 },
  { value: 'users-fleet', labelAr: 'المستخدمون والأسطول', labelEn: 'Users & Fleet', icon: Truck },
  { value: 'finance', labelAr: 'المالية والإيرادات', labelEn: 'Finance', icon: CreditCard },
  { value: 'compliance', labelAr: 'الامتثال والرقابة', labelEn: 'Compliance', icon: Shield },
  { value: 'analytics-ai', labelAr: 'التحليلات والذكاء', labelEn: 'Analytics & AI', icon: Brain },
];

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { enabled: aiEnabled, toggle: toggleAI } = usePlatformSetting('ai_assistant_enabled');
  const { data: dashboardData, isLoading: loading, refetch: refetchDashboard } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      // Parallel queries instead of sequential (4 queries instead of 6)
      const [shipmentsResult, orgsResult, driversResult, pendingResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('id, shipment_number, status, waste_type, quantity, unit, created_at, generator_id, transporter_id, recycler_id', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('organizations').select('id, name, organization_type'),
        supabase.from('drivers').select('is_available'),
        supabase.from('profiles').select('id').is('organization_id', null),
      ]);

      const orgsData = orgsResult.data || [];
      const orgsMap: Record<string, any> = {};
      orgsData.forEach(o => { orgsMap[o.id] = { name: o.name }; });

      const shipments = (shipmentsResult.data || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: null,
      }));

      const activeShipments = shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status || '')).length;
      const generatorCount = orgsData.filter(o => o.organization_type === 'generator').length;
      const transporterCount = orgsData.filter(o => o.organization_type === 'transporter').length;
      const recyclerCount = orgsData.filter(o => o.organization_type === 'recycler').length;
      const activeDrivers = (driversResult.data || []).filter(d => d.is_available).length;

      return {
        stats: {
          totalShipments: shipmentsResult.count || 0, activeShipments,
          registeredCompanies: orgsData.length, activeDrivers,
          totalDrivers: driversResult.data?.length || 0, pendingUsers: pendingResult.data?.length || 0,
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
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showSmartWeightUpload, setShowSmartWeightUpload] = useState(false);
  const [showWorkOrder, setShowWorkOrder] = useState(false);

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
      <motion.div variants={itemVariants}>
        <ConnectedSmartBrief role="admin" />
      </motion.div>

      <motion.div variants={itemVariants}>
        <StoryCircles />
      </motion.div>

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
          <AICapabilitiesInfoDialog />
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

      <motion.div variants={itemVariants}>
        <AdminStatsGrid stats={statCards} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <OrganizationBreakdown generatorCount={stats.generatorCount} transporterCount={stats.transporterCount} recyclerCount={stats.recyclerCount} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Suspense fallback={null}><CommunicationHubWidget /></Suspense>
      </motion.div>
      <motion.div variants={itemVariants}>
        <AdminOperationalAlerts />
      </motion.div>
      <motion.div variants={itemVariants}>
        <DashboardAlertsHub orgType="admin" />
      </motion.div>

      <AutomationSettingsDialog organizationType="admin" />

      {/* ═══ Strategic Pillars — Modular Tabs ═══ */}
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

        <AdminCommandTabs
          statCards={statCards}
          stats={stats}
          recentShipments={recentShipments}
          quickActions={quickActions}
          onRefresh={() => refetchDashboard()}
        />

        <AdminOperationsTabs
          activeDrivers={stats.activeDrivers}
          totalDrivers={stats.totalDrivers}
        />

        <AdminComplianceAnalyticsTabs />
      </Tabs>

      {/* ═══ Dialogs ═══ */}
      <ResetPasswordDialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog} user={selectedUser} />
      <AddDepositDialog open={showDepositDialog} onOpenChange={setShowDepositDialog} />
      <Suspense fallback={null}>
        <SmartWeightUpload open={showSmartWeightUpload} onOpenChange={setShowSmartWeightUpload} />
        <CreateWorkOrderDialog open={showWorkOrder} onOpenChange={setShowWorkOrder} />
      </Suspense>
    </motion.div>
  );
};

export default AdminDashboard;
