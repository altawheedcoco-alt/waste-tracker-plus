/**
 * تبويبات المسؤول — الامتثال والتحليلات والذكاء الاصطناعي
 */
import { lazy, Suspense } from 'react';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';
import TabFallback from '@/components/dashboard/shared/TabFallback';
import {
  Shield, HardHat, Link2, AlertTriangle, ShieldAlert, Building2,
  Briefcase, Brain, Leaf, Activity, Wifi, ClipboardList,
} from 'lucide-react';

const SovereignGovernanceDashboard = lazy(() => import('@/components/admin/sovereign/SovereignGovernanceDashboard'));
const ComplianceAlertsWidget = lazy(() => import('@/components/compliance/ComplianceAlertsWidget'));
const ConsultantKPIsWidget = lazy(() => import('@/components/compliance/ConsultantKPIsWidget'));
const ComplianceCertificateWidget = lazy(() => import('@/components/compliance/ComplianceCertificateWidget'));
const RiskMatrixWidget = lazy(() => import('@/components/compliance/RiskMatrixWidget'));
const CorrectiveActionsWidget = lazy(() => import('@/components/compliance/CorrectiveActionsWidget'));
const AuditPortalWidget = lazy(() => import('@/components/compliance/AuditPortalWidget'));
const LegalComplianceWidget = lazy(() => import('@/components/dashboard/generator/LegalComplianceWidget'));
const LegalArchiveWidget = lazy(() => import('@/components/dashboard/generator/LegalArchiveWidget'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));
const SafetyManagerDashboard = lazy(() => import('@/components/safety/SafetyManagerDashboard'));
const ChainOfCustodyPanel = lazy(() => import('@/components/dashboard/transporter/ChainOfCustodyPanel'));
const FraudDetectionPanel = lazy(() => import('@/components/dashboard/transporter/FraudDetectionPanel'));
const PartnerRiskPanel = lazy(() => import('@/components/dashboard/transporter/PartnerRiskPanel'));
const GovernmentReportingPanel = lazy(() => import('@/components/dashboard/transporter/GovernmentReportingPanel'));
const ConsultantSmartAlerts = lazy(() => import('@/components/consultant/ConsultantSmartAlerts'));
const OfficeTeamPanel = lazy(() => import('@/components/consulting-office/OfficeTeamPanel'));
const OfficeClientsPanel = lazy(() => import('@/components/consulting-office/OfficeClientsPanel'));
const SigningPoliciesPanel = lazy(() => import('@/components/consulting-office/SigningPoliciesPanel'));
const ApprovalQueuePanel = lazy(() => import('@/components/consulting-office/ApprovalQueuePanel'));
const OfficeDocumentsPanel = lazy(() => import('@/components/consulting-office/OfficeDocumentsPanel'));
const OfficeLicensesPanel = lazy(() => import('@/components/consulting-office/OfficeLicensesPanel'));
const OfficeFinancePanel = lazy(() => import('@/components/consulting-office/OfficeFinancePanel'));
const ConsultantAnalyticsPanel = lazy(() => import('@/components/consultant/ConsultantAnalyticsPanel'));

const TransporterAIInsights = lazy(() => import('@/components/ai/TransporterAIInsights'));
const DisposalRadarWidget = lazy(() => import('@/components/dashboard/generator/DisposalRadarWidget'));
const ESGReportWidget = lazy(() => import('@/components/dashboard/generator/ESGReportWidget'));
const DriverCodeLookup = lazy(() => import('@/components/drivers/DriverCodeLookup'));
const CarbonCreditsPanel = lazy(() => import('@/components/dashboard/transporter/CarbonCreditsPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const ImpactDashboard = lazy(() => import('@/components/impact/ImpactDashboard'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const IoTMonitoringPanel = lazy(() => import('@/components/dashboard/transporter/IoTMonitoringPanel'));
const WorkOrderInbox = lazy(() => import('@/components/work-orders/WorkOrderInbox'));

const AdminComplianceAnalyticsTabs = () => {
  const { isRTL } = useLanguage();

  return (
    <>
      {/* ═══ 0. الحوكمة السيادية ═══ */}
      <TabsContent value="sovereign" className="mt-6">
        <Suspense fallback={<TabFallback />}>
          <SovereignGovernanceDashboard />
        </Suspense>
      </TabsContent>

      {/* ═══ 5. الامتثال والرقابة ═══ */}
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

      {/* ═══ 6. التحليلات والذكاء ═══ */}
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
    </>
  );
};

export default AdminComplianceAnalyticsTabs;
