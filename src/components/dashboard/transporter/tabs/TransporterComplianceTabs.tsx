/**
 * تبويبات الامتثال والتقارير الحكومية
 * (compliance, government, carbon, iot, esg, wmis, licenses, declarations, annual_plan, ohs)
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const LegalComplianceWidget = lazy(() => import('../../generator/LegalComplianceWidget'));
const LegalArchiveWidget = lazy(() => import('../../generator/LegalArchiveWidget'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));
const GovernmentReportingPanel = lazy(() => import('../GovernmentReportingPanel'));
const CarbonCreditsPanel = lazy(() => import('../CarbonCreditsPanel'));
const IoTMonitoringPanel = lazy(() => import('../IoTMonitoringPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));
const TransporterLicenseRenewal = lazy(() => import('@/components/transporter/TransporterLicenseRenewal'));
const TransporterDeclarations = lazy(() => import('@/components/transporter/TransporterDeclarations'));
const TransporterAnnualPlan = lazy(() => import('@/components/transporter/TransporterAnnualPlan'));
const SafetyManagerDashboard = lazy(() => import('@/components/safety/SafetyManagerDashboard'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

interface ComplianceTabsProps {
  organizationId?: string;
}

const TransporterComplianceTabs = ({ organizationId }: ComplianceTabsProps) => (
  <>
    <TabsContent value="compliance" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <LegalComplianceWidget />
        <LegalArchiveWidget />
        <VehicleComplianceManager />
        <DriverComplianceManager />
        <IncidentReportManager />
      </Suspense>
    </TabsContent>

    <TabsContent value="government" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في البوابة الحكومية">
          <GovernmentReportingPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="carbon" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في أرصدة الكربون">
          <CarbonCreditsPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="iot" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في IoT">
          <IoTMonitoringPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="esg" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ESGReportPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="wmis" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في نظام WMIS">
          {organizationId && <LicensedWasteTypesEditor organizationId={organizationId} />}
          <WMISEventsFeed />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="licenses" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في التراخيص">
          <TransporterLicenseRenewal />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="declarations" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في الإقرارات">
          <TransporterDeclarations />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="annual_plan" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في الخطة السنوية">
          <TransporterAnnualPlan />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="ohs" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في تقارير السلامة المهنية">
          <SafetyManagerDashboard />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>
  </>
);

export default TransporterComplianceTabs;
