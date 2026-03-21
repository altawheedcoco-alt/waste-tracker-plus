/**
 * المركز التنظيمي الموحد - يدمج الامتثال والتراخيص والإقرارات وWMIS
 */
import { lazy, Suspense, useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Shield, FileCheck, FileText, Globe, ClipboardList, ShieldAlert, Building2, HardHat } from 'lucide-react';

const LegalComplianceWidget = lazy(() => import('@/components/dashboard/generator/LegalComplianceWidget'));
const LegalArchiveWidget = lazy(() => import('@/components/dashboard/generator/LegalArchiveWidget'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));
const GovernmentReportingPanel = lazy(() => import('@/components/dashboard/transporter/GovernmentReportingPanel'));
const CarbonCreditsPanel = lazy(() => import('@/components/dashboard/transporter/CarbonCreditsPanel'));
const IoTMonitoringPanel = lazy(() => import('@/components/dashboard/transporter/IoTMonitoringPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));
const TransporterLicenseRenewal = lazy(() => import('@/components/transporter/TransporterLicenseRenewal'));
const TransporterDeclarations = lazy(() => import('@/components/transporter/TransporterDeclarations'));
const TransporterAnnualPlan = lazy(() => import('@/components/transporter/TransporterAnnualPlan'));
const SafetyManagerDashboard = lazy(() => import('@/components/safety/SafetyManagerDashboard'));

const TabFallback = () => (
  <div className="space-y-4 mt-4">
    <Skeleton className="h-32 w-full rounded-xl" />
    <Skeleton className="h-48 w-full rounded-xl" />
  </div>
);

interface ComplianceTabsProps {
  organizationId?: string;
}

type RegulatorySection = 'compliance' | 'licenses' | 'declarations' | 'wmis' | 'annual_plan' | 'government';

const REGULATORY_SECTIONS: { id: RegulatorySection; labelAr: string; icon: React.ElementType }[] = [
  { id: 'compliance', labelAr: 'الامتثال', icon: Shield },
  { id: 'licenses', labelAr: 'التراخيص', icon: FileCheck },
  { id: 'declarations', labelAr: 'الإقرارات', icon: FileText },
  { id: 'wmis', labelAr: 'WMIS', icon: ShieldAlert },
  { id: 'annual_plan', labelAr: 'الخطة السنوية', icon: ClipboardList },
  { id: 'government', labelAr: 'البوابة الحكومية', icon: Building2 },
];

const TransporterComplianceTabs = ({ organizationId }: ComplianceTabsProps) => {
  const [activeSection, setActiveSection] = useState<RegulatorySection>('compliance');

  return (
    <>
      {/* المركز التنظيمي الموحد */}
      <TabsContent value="regulatory_hub" className="space-y-4 mt-6">
        {/* أقسام فرعية */}
        <div className="flex gap-2 flex-wrap">
          {REGULATORY_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {section.labelAr}
              </button>
            );
          })}
        </div>

        <Suspense fallback={<TabFallback />}>
          {activeSection === 'compliance' && (
            <ErrorBoundary fallbackTitle="خطأ في الامتثال">
              <LegalComplianceWidget />
              <LegalArchiveWidget />
              <VehicleComplianceManager />
              <DriverComplianceManager />
              <IncidentReportManager />
            </ErrorBoundary>
          )}

          {activeSection === 'licenses' && (
            <ErrorBoundary fallbackTitle="خطأ في التراخيص">
              <TransporterLicenseRenewal />
            </ErrorBoundary>
          )}

          {activeSection === 'declarations' && (
            <ErrorBoundary fallbackTitle="خطأ في الإقرارات">
              <TransporterDeclarations />
            </ErrorBoundary>
          )}

          {activeSection === 'wmis' && (
            <ErrorBoundary fallbackTitle="خطأ في نظام WMIS">
              {organizationId && <LicensedWasteTypesEditor organizationId={organizationId} />}
              <WMISEventsFeed />
            </ErrorBoundary>
          )}

          {activeSection === 'annual_plan' && (
            <ErrorBoundary fallbackTitle="خطأ في الخطة السنوية">
              <TransporterAnnualPlan />
            </ErrorBoundary>
          )}

          {activeSection === 'government' && (
            <ErrorBoundary fallbackTitle="خطأ في البوابة الحكومية">
              <GovernmentReportingPanel />
            </ErrorBoundary>
          )}
        </Suspense>
      </TabsContent>

      {/* التبويبات المستقلة */}
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

      <TabsContent value="ohs" className="space-y-4 mt-6">
        <Suspense fallback={<TabFallback />}>
          <ErrorBoundary fallbackTitle="خطأ في تقارير السلامة المهنية">
            <SafetyManagerDashboard />
          </ErrorBoundary>
        </Suspense>
      </TabsContent>
    </>
  );
};

export default TransporterComplianceTabs;
