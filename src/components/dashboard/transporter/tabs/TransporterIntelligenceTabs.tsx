/**
 * تبويبات الذكاء والمالية والشركاء (مدمجة)
 * ai (+ intelligence) | finance (+ pricing + fraud) | partners (+ marketplace)
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const TransporterAIInsights = lazy(() => import('@/components/ai/TransporterAIInsights'));
const AIDocumentAnalyzer = lazy(() => import('@/components/ai/AIDocumentAnalyzer'));
const DynamicPricingEngine = lazy(() => import('@/components/dashboard/transporter/DynamicPricingEngine'));
const WasteMarketplace = lazy(() => import('@/components/marketplace/WasteMarketplace'));
const FraudDetectionPanel = lazy(() => import('@/components/dashboard/transporter/FraudDetectionPanel'));
const SmartSchedulerPanel = lazy(() => import('@/components/ai/SmartSchedulerPanel'));
const PartnerProfitabilityPanel = lazy(() => import('@/components/dashboard/transporter/PartnerProfitabilityPanel'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const PartnersView = lazy(() => import('@/components/dashboard/PartnersView'));
const SustainabilityReportGenerator = lazy(() => import('@/components/dashboard/transporter/SustainabilityReportGenerator'));
const SLADashboard = lazy(() => import('@/components/transporter/SLADashboard'));
const ProfitabilityReport = lazy(() => import('@/components/transporter/ProfitabilityReport'));
const ShiftScheduler = lazy(() => import('@/components/transporter/ShiftScheduler'));
const DemandForecastDashboard = lazy(() => import('@/components/dashboard/transporter/DemandForecastDashboard'));
const CapacityPlanningDashboard = lazy(() => import('@/components/dashboard/transporter/CapacityPlanningDashboard'));
const PredictiveMaintenanceAI = lazy(() => import('@/components/dashboard/transporter/PredictiveMaintenanceAI'));
const TripCostAnalytics = lazy(() => import('@/components/dashboard/transporter/TripCostAnalytics'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

const TransporterIntelligenceTabs = () => (
  <>
    {/* ══════ 6. الذكاء الاصطناعي (+ intelligence مدمج) ══════ */}
    <TabsContent value="ai" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في تحليل المستندات">
          <AIDocumentAnalyzer />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تحليلات الذكاء الاصطناعي">
          <TransporterAIInsights />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في الجدولة الذكية">
          <ShiftScheduler />
          <SmartSchedulerPanel />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تحليل الربحية">
          <PartnerProfitabilityPanel />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في التنبؤ بالطلب">
          <DemandForecastDashboard />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تخطيط السعة">
          <CapacityPlanningDashboard />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في الصيانة التنبؤية">
          <PredictiveMaintenanceAI />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    {/* ══════ 7. المالية والتسعير (+ fraud مدمج) ══════ */}
    <TabsContent value="finance" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في التسعير الذكي">
          <DynamicPricingEngine />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تحليل تكاليف الرحلات">
          <TripCostAnalytics />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في كشف الاحتيال">
          <FraudDetectionPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    {/* ══════ 10. الشركاء والسوق (+ marketplace مدمج) ══════ */}
    <TabsContent value="partners" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <ErrorBoundary fallbackTitle="خطأ في السوق">
          <WasteMarketplace />
        </ErrorBoundary>
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
