/**
 * تبويبات الذكاء والمالية والاستدامة والشركاء (مدمجة)
 * ai | finance | sustainability | partners
 */
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const TransporterAIInsights = lazy(() => import('@/components/ai/TransporterAIInsights'));
const AIDocumentAnalyzer = lazy(() => import('@/components/ai/AIDocumentAnalyzer'));
const DynamicPricingEngine = lazy(() => import('@/components/dashboard/transporter/DynamicPricingEngine'));
const WasteMarketplace = lazy(() => import('@/components/marketplace/WasteMarketplace'));
const FraudDetectionPanel = lazy(() => import('@/components/dashboard/transporter/FraudDetectionPanel'));
const SmartSchedulerPanel = lazy(() => import('@/components/ai/SmartSchedulerPanel'));
const PartnerRatingsWidget = lazy(() => import('@/components/partners/PartnerRatingsWidget'));
const PartnersView = lazy(() => import('@/components/dashboard/PartnersView'));
const TransporterPartnerSummary = lazy(() => import('@/components/dashboard/transporter/TransporterPartnerSummary'));
const SustainabilityReportGenerator = lazy(() => import('@/components/dashboard/transporter/SustainabilityReportGenerator'));
const SLADashboard = lazy(() => import('@/components/transporter/SLADashboard'));
const ProfitabilityReport = lazy(() => import('@/components/transporter/ProfitabilityReport'));
const ShiftScheduler = lazy(() => import('@/components/transporter/ShiftScheduler'));
const DemandForecastDashboard = lazy(() => import('@/components/dashboard/transporter/DemandForecastDashboard'));
const CapacityPlanningDashboard = lazy(() => import('@/components/dashboard/transporter/CapacityPlanningDashboard'));
const TripCostAnalytics = lazy(() => import('@/components/dashboard/transporter/TripCostAnalytics'));
const RevenueSnapshotMini = lazy(() => import('@/components/dashboard/transporter/RevenueSnapshotMini'));
const EnvironmentalKPIWidget = lazy(() => import('@/components/dashboard/shared/EnvironmentalKPIWidget'));
const CarbonCreditsPanel = lazy(() => import('@/components/dashboard/transporter/CarbonCreditsPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));

const TabFallback = () => (
  <div className="space-y-4 mt-6">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

const TransporterIntelligenceTabs = () => (
  <>
    {/* ══════ 6. الذكاء الاصطناعي ══════ */}
    <TabsContent value="ai" className="space-y-4 mt-6">
      {/* ★ توجيه المستخدم الجديد */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-lg">🤖</span>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-foreground">مركز الذكاء الاصطناعي</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">استخدم أدوات الذكاء الاصطناعي لتحليل المستندات، التنبؤ بالطلب، جدولة الشحنات ذكياً، وتخطيط السعة المستقبلية.</p>
        </div>
      </div>
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
        <ErrorBoundary fallbackTitle="خطأ في التنبؤ بالطلب">
          <DemandForecastDashboard />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تخطيط السعة">
          <CapacityPlanningDashboard />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    {/* ══════ 7. المالية والتسعير (+ ملخص مالي + ربحية + نوبات) ══════ */}
    <TabsContent value="finance" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <Suspense fallback={<Skeleton className="h-[180px] rounded-xl" />}>
          <ErrorBoundary fallbackTitle="خطأ في الملخص المالي"><RevenueSnapshotMini /></ErrorBoundary>
        </Suspense>
        <ErrorBoundary fallbackTitle="خطأ في تقرير الربحية">
          <ProfitabilityReport />
        </ErrorBoundary>
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

    {/* ══════ 9. الاستدامة (مؤشرات بيئية + كربون + ESG) ══════ */}
    <TabsContent value="sustainability" className="space-y-4 mt-6">
      <Suspense fallback={<TabFallback />}>
        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <ErrorBoundary fallbackTitle="خطأ في مؤشرات البيئة"><EnvironmentalKPIWidget /></ErrorBoundary>
        </Suspense>
        <ErrorBoundary fallbackTitle="خطأ في أرصدة الكربون">
          <CarbonCreditsPanel />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في تقارير ESG">
          <ESGReportPanel />
        </ErrorBoundary>
      </Suspense>
    </TabsContent>

    {/* ══════ 10. الشركاء والسوق ══════ */}
    <TabsContent value="partners" className="space-y-4 mt-6">
      {/* ★ إجراء سريع */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">شبكة الشركاء والسوق</h3>
        <button
          onClick={() => navigate('/dashboard/partners')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          + دعوة شريك جديد
        </button>
      </div>
      <Suspense fallback={<TabFallback />}>
        <Suspense fallback={<Skeleton className="h-[200px] rounded-xl" />}>
          <ErrorBoundary fallbackTitle="خطأ في ملخص الشركاء"><TransporterPartnerSummary /></ErrorBoundary>
        </Suspense>
        <ErrorBoundary fallbackTitle="خطأ في السوق">
          <WasteMarketplace />
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="خطأ في اتفاقيات مستوى الخدمة">
          <SLADashboard />
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
