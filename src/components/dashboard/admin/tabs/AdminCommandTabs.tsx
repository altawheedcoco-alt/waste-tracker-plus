/**
 * تبويبات المسؤول — مركز القيادة والكيانات
 */
import { lazy, Suspense } from 'react';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';
import TabFallback from '@/components/dashboard/shared/TabFallback';
import {
  AdminStatsGrid,
  OrganizationBreakdown,
  AdminRecentShipments,
  AdminDailyOperationsSummary,
  AdminActiveTracking,
  AdminPendingApprovals,
  AdminShipmentSearch,
  AdminPartnersTab,
  StatCard,
} from '@/components/dashboard/admin';
import AdminEntityList from '@/components/dashboard/admin/AdminEntityList';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import DailyOperationsSummary from '@/components/dashboard/operations/DailyOperationsSummary';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import {
  Building2, Factory, Truck, Recycle, Handshake, LayoutDashboard,
} from 'lucide-react';

const DashboardBrief = lazy(() => import('@/components/dashboard/generator/DashboardBrief'));
const WeeklyShipmentChart = lazy(() => import('@/components/dashboard/generator/WeeklyShipmentChart'));
const ComplianceGauge = lazy(() => import('@/components/dashboard/generator/ComplianceGauge'));
const GeneratorCommandCenter = lazy(() => import('@/components/dashboard/generator/GeneratorCommandCenter'));
const GeneratorTrackingWidget = lazy(() => import('@/components/dashboard/generator/GeneratorTrackingWidget'));
const OrgPerformanceRadar = lazy(() => import('@/components/dashboard/shared/OrgPerformanceRadar'));
const SustainabilityReportGenerator = lazy(() => import('@/components/dashboard/transporter/SustainabilityReportGenerator'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const PartnerProfitabilityPanel = lazy(() => import('@/components/dashboard/transporter/PartnerProfitabilityPanel'));
const PartnersView = lazy(() => import('@/components/dashboard/PartnersView'));
const DisposalIncomingPanel = lazy(() => import('@/components/dashboard/disposal/DisposalIncomingPanel'));
const DisposalDailyOperations = lazy(() => import('@/components/dashboard/disposal/DisposalDailyOperations'));
const DisposalRecentOperations = lazy(() => import('@/components/dashboard/disposal/DisposalRecentOperations'));
const NearbyDriversRadar = lazy(() => import('@/components/maps/NearbyDriversRadar'));
const DemandHeatmapDriver = lazy(() => import('@/components/maps/DemandHeatmapDriver'));

interface AdminCommandTabsProps {
  statCards: StatCard[];
  stats: {
    generatorCount: number;
    transporterCount: number;
    recyclerCount: number;
    activeDrivers: number;
    totalDrivers: number;
  };
  recentShipments: any[];
  quickActions: any[];
  onRefresh?: () => void;
}

const AdminCommandTabs = ({ statCards, stats, recentShipments, quickActions, onRefresh }: AdminCommandTabsProps) => {
  const { t, isRTL } = useLanguage();

  return (
    <>
      {/* ═══ 1. مركز القيادة ═══ */}
      <TabsContent value="command-center" className="space-y-6 mt-6">
        <Suspense fallback={<TabFallback />}>
          <DashboardBrief />
        </Suspense>
        <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
          <AdminDailyOperationsSummary />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في ملخص العمليات">
          <DailyOperationsSummary />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في الرسوم البيانية">
          <Suspense fallback={<TabFallback />}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <WeeklyShipmentChart />
              <ComplianceGauge />
            </div>
          </Suspense>
        </ErrorBoundary>
        <AdminActiveTracking />
        <AdminPendingApprovals />
        <PendingApprovalsWidget />
        <UnifiedDocumentSearch />
        <AdminShipmentSearch />
        <QuickActionsGrid actions={quickActions} title={t('dashboard.quickActions')} subtitle={t('dashboard.quickActionsAdmin')} />
        <AdminRecentShipments shipments={recentShipments} onRefresh={onRefresh || (() => {})} />
        <ErrorBoundary fallbackTitle="خطأ في مركز القيادة">
          <Suspense fallback={<TabFallback />}><GeneratorCommandCenter /></Suspense>
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في التتبع">
          <Suspense fallback={<TabFallback />}><GeneratorTrackingWidget /></Suspense>
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
          <Suspense fallback={<TabFallback />}><OrgPerformanceRadar /></Suspense>
        </ErrorBoundary>
      </TabsContent>

      {/* ═══ 2. إدارة الكيانات ═══ */}
      <TabsContent value="entities" className="space-y-6 mt-6">
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
    </>
  );
};

export default AdminCommandTabs;
