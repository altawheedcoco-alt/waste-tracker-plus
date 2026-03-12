/**
 * تبويبات المسؤول — المستخدمون والأسطول + المالية
 */
import { lazy, Suspense } from 'react';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';
import TabFallback from '@/components/dashboard/shared/TabFallback';
import { AdminTrackingTab } from '@/components/dashboard/admin';
import DriverLinkingCode from '@/components/drivers/DriverLinkingCode';
import {
  LayoutDashboard, Users, MapPin, Wrench, Navigation, BarChart3,
  DollarSign, Store, CalendarDays,
} from 'lucide-react';

const FleetUtilizationWidget = lazy(() => import('@/components/dashboard/operations/FleetUtilizationWidget'));
const TransporterPerformanceCharts = lazy(() => import('@/components/dashboard/transporter/TransporterPerformanceCharts'));
const DriverEarningsDashboard = lazy(() => import('@/components/driver/DriverEarningsDashboard'));
const DriverWalletPanel = lazy(() => import('@/components/driver/DriverWalletPanel'));
const DriverRewardsPanel = lazy(() => import('@/components/driver/DriverRewardsPanel'));
const DriverLeaderboard = lazy(() => import('@/components/driver/DriverLeaderboard'));
const DriverAutoReport = lazy(() => import('@/components/driver/DriverAutoReport'));
const DriverCopilot = lazy(() => import('@/components/dashboard/transporter/DriverCopilot'));
const SmartDriverNotifications = lazy(() => import('@/components/dashboard/transporter/SmartDriverNotifications'));
const SignalMonitorWidget = lazy(() => import('@/components/tracking/SignalMonitorWidget'));
const PredictiveFleetMaintenance = lazy(() => import('@/components/dashboard/transporter/PredictiveFleetMaintenance'));
const MaintenanceScheduler = lazy(() => import('@/components/dashboard/transporter/MaintenanceScheduler'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const EnhancedDriverPerformance = lazy(() => import('@/components/dashboard/transporter/EnhancedDriverPerformance'));
const DriverPerformancePanel = lazy(() => import('@/components/dashboard/transporter/DriverPerformancePanel'));
const TripCostManagement = lazy(() => import('@/components/dashboard/transporter/TripCostManagement'));
const FinancialSummaryWidget = lazy(() => import('@/components/dashboard/generator/FinancialSummaryWidget'));
const DynamicPricingEngine = lazy(() => import('@/components/dashboard/transporter/DynamicPricingEngine'));
const WasteMarketplace = lazy(() => import('@/components/marketplace/WasteMarketplace'));
const ShipmentCalendarWidget = lazy(() => import('@/components/dashboard/transporter/ShipmentCalendarWidget'));
const SmartSchedulerPanel = lazy(() => import('@/components/ai/SmartSchedulerPanel'));
const RouteOptimizerPanel = lazy(() => import('@/components/ai/RouteOptimizerPanel'));

interface AdminOperationsTabsProps {
  activeDrivers: number;
  totalDrivers: number;
}

const AdminOperationsTabs = ({ activeDrivers, totalDrivers }: AdminOperationsTabsProps) => {
  const { isRTL } = useLanguage();

  return (
    <>
      {/* ═══ 3. المستخدمون والأسطول ═══ */}
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
            <AdminTrackingTab activeDrivers={activeDrivers} totalDrivers={totalDrivers} />
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

      {/* ═══ 4. المالية والإيرادات ═══ */}
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
    </>
  );
};

export default AdminOperationsTabs;
