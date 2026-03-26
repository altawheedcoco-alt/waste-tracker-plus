/**
 * تبويبات عمليات المدوّر
 * (overview tab content — stats, incoming, shipments, compliance)
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

const RecyclerSmartKPIs = lazy(() => import('@/components/dashboard/recycler/RecyclerSmartKPIs'));
const RecyclerFinancialFlow = lazy(() => import('@/components/dashboard/recycler/RecyclerFinancialFlow'));
const RecyclerInputIntelligence = lazy(() => import('@/components/dashboard/recycler/RecyclerInputIntelligence'));
const RecyclerScorecard = lazy(() => import('@/components/dashboard/recycler/RecyclerScorecard'));
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Recycle, AlertCircle, Eye } from 'lucide-react';
import StatsCardsGrid, { StatCardItem } from '@/components/dashboard/shared/StatsCardsGrid';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import RecyclerIncomingPanel from '@/components/dashboard/recycler/RecyclerIncomingPanel';
import RecyclerCommandCenter from '@/components/dashboard/recycler/RecyclerCommandCenter';
import DailyOperationsSummary from '@/components/dashboard/operations/DailyOperationsSummary';
import DashboardAlertsHub from '@/components/dashboard/shared/DashboardAlertsHub';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';
import DocumentVerificationWidget from '@/components/dashboard/DocumentVerificationWidget';
import DriverCodeLookup from '@/components/drivers/DriverCodeLookup';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import CreateShipmentButton from '@/components/dashboard/CreateShipmentButton';
import AutomationSettingsDialog from '@/components/automation/AutomationSettingsDialog';
import TabFallback from '@/components/dashboard/shared/TabFallback';

const BulkCertificateButton = lazy(() => import('@/components/bulk/BulkCertificateButton'));
const RecyclerBulkStatusDropdown = lazy(() => import('@/components/shipments/RecyclerBulkStatusDropdown'));
const OrgPerformanceRadar = lazy(() => import('@/components/dashboard/shared/OrgPerformanceRadar'));
const EnvironmentalKPIWidget = lazy(() => import('@/components/dashboard/shared/EnvironmentalKPIWidget'));
const LicenseExpiryWidget = lazy(() => import('@/components/dashboard/shared/LicenseExpiryWidget'));
const LegalComplianceWidget = lazy(() => import('@/components/dashboard/generator/LegalComplianceWidget'));
const VehicleComplianceManager = lazy(() => import('@/components/compliance/VehicleComplianceManager'));
const DriverComplianceManager = lazy(() => import('@/components/compliance/DriverComplianceManager'));
const IncidentReportManager = lazy(() => import('@/components/compliance/IncidentReportManager'));

interface RecyclerOverviewTabProps {
  statCards: StatCardItem[];
  shipmentsLoading: boolean;
  recentShipments: any[];
  quickActions: any[];
  onRefresh: () => void;
  facility: any;
}

const RecyclerOverviewTab = ({
  statCards, shipmentsLoading, recentShipments,
  quickActions, onRefresh,
}: RecyclerOverviewTabProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <TabsContent value="overview" className="space-y-6 mt-4">
      {/* Environmental KPIs & License Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <ErrorBoundary fallbackTitle="خطأ في مؤشرات البيئة">
            <EnvironmentalKPIWidget />
          </ErrorBoundary>
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[280px]" />}>
          <ErrorBoundary fallbackTitle="خطأ في تنبيهات التراخيص">
            <LicenseExpiryWidget />
          </ErrorBoundary>
        </Suspense>
      </div>

      <RecyclerCommandCenter />
      <StatsCardsGrid stats={statCards} isLoading={shipmentsLoading} />
      <AutomationSettingsDialog organizationType="recycler" />

      <ErrorBoundary fallbackTitle="خطأ في رادار الأداء">
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <OrgPerformanceRadar />
        </Suspense>
      </ErrorBoundary>

      <DailyOperationsSummary />
      <DashboardAlertsHub orgType="recycler" />
      <UnifiedDocumentSearch />
      <DocumentVerificationWidget />
      <DriverCodeLookup />
      <RecyclerIncomingPanel />
      <PendingApprovalsWidget />

      <QuickActionsGrid
        actions={quickActions}
        title={t('dashboard.quickActions')}
        subtitle={t('dashboard.quickActionsRecycler')}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Suspense fallback={null}>
                <BulkCertificateButton
                  shipments={recentShipments.map(s => ({
                    id: s.id, shipment_number: s.shipment_number, status: s.status,
                    created_at: s.created_at, waste_type: s.waste_type, quantity: s.quantity,
                    unit: s.unit, delivered_at: s.delivered_at, confirmed_at: s.confirmed_at,
                    has_report: s.has_report,
                    generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                    transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                    recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
                  }))}
                  type="certificate"
                  onSuccess={onRefresh}
                />
                <RecyclerBulkStatusDropdown
                  shipments={recentShipments.map(s => ({ id: s.id, status: s.status, created_at: s.created_at, waste_type: s.waste_type }))}
                  onStatusChange={onRefresh}
                />
              </Suspense>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                <Eye className="ml-2 h-4 w-4" />
                {t('dashboard.viewAll')}
              </Button>
            </div>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Recycle className="w-5 h-5" />
                الشحنات الواردة للتدوير
              </CardTitle>
              <CardDescription>آخر 10 شحنات واردة إلى منشأة التدوير</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shipmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
              ))}
            </div>
          ) : recentShipments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لا توجد شحنات واردة حتى الآن</p>
              <CreateShipmentButton className="mt-4" onSuccess={onRefresh} />
            </div>
          ) : (
            <div className="space-y-4">
              {recentShipments.map((shipment) => (
                <ShipmentCard key={shipment.id} shipment={shipment} onStatusChange={onRefresh} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <LegalComplianceWidget />
        <VehicleComplianceManager />
        <DriverComplianceManager />
        <IncidentReportManager />
      </Suspense>
    </TabsContent>
  );
};

export default RecyclerOverviewTab;
