/**
 * تبويبات الذكاء الاصطناعي والتحليلات والتسعير
 * (ai, pricing, marketplace, intelligence, fraud, risk, custody, partners)
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const TransporterAIInsights = lazy(() => import('@/components/ai/TransporterAIInsights'));
const DynamicPricingEngine = lazy(() => import('../DynamicPricingEngine'));
const WasteMarketplace = lazy(() => import('@/components/marketplace/WasteMarketplace'));
const FraudDetectionPanel = lazy(() => import('../FraudDetectionPanel'));
const PartnerRiskPanel = lazy(() => import('../PartnerRiskPanel'));
const ChainOfCustodyPanel = lazy(() => import('../ChainOfCustodyPanel'));
const SmartSchedulerPanel = lazy(() => import('@/components/ai/SmartSchedulerPanel'));
const PartnerProfitabilityPanel = lazy(() => import('../PartnerProfitabilityPanel'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const PartnersView = lazy(() => import('../../PartnersView'));
const SustainabilityReportGenerator = lazy(() => import('../SustainabilityReportGenerator'));
const SLADashboard = lazy(() => import('@/components/transporter/SLADashboard'));
const ProfitabilityReport = lazy(() => import('@/components/transporter/ProfitabilityReport'));
const ShiftScheduler = lazy(() => import('@/components/transporter/ShiftScheduler'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

const TransporterIntelligenceTabs = () => (
  <>
    <TabsContent value="ai" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في تحليلات الذكاء الاصطناعي">
          <TransporterAIInsights />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="pricing" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في التسعير الذكي">
          <DynamicPricingEngine />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="marketplace" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في السوق">
          <WasteMarketplace />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="fraud" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في كشف الاحتيال">
          <FraudDetectionPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="risk" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في تحليل المخاطر">
          <PartnerRiskPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="custody" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في سلسلة الحفظ">
          <ChainOfCustodyPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="intelligence" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في الجدولة الذكية">
          <ShiftScheduler />
          <SmartSchedulerPanel />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تحليل الربحية">
          <PartnerProfitabilityPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    <TabsContent value="partners" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في تقارير الاستدامة">
          <SustainabilityReportGenerator />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في اتفاقيات مستوى الخدمة">
          <SLADashboard />
          <ProfitabilityReport />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تقييمات الشركاء">
          <PartnerRatingsWidget />
          <PartnersView />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>
  </>
);

export default TransporterIntelligenceTabs;
