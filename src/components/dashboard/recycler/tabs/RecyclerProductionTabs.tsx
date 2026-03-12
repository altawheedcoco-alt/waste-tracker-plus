/**
 * تبويبات المصنع والإنتاج والجودة
 */
import { lazy, Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import TabFallback from '@/components/dashboard/shared/TabFallback';

const QualityInspectorPanel = lazy(() => import('@/components/recycler/QualityInspectorPanel'));
const ProductionDashboardPanel = lazy(() => import('@/components/recycler/ProductionDashboardPanel'));
const RecycledProductCertificate = lazy(() => import('@/components/recycler/RecycledProductCertificate'));
const MaterialMarketPanel = lazy(() => import('@/components/recycler/MaterialMarketPanel'));
const EquipmentManagerPanel = lazy(() => import('@/components/recycler/EquipmentManagerPanel'));
const UtilitiesTrackerPanel = lazy(() => import('@/components/recycler/UtilitiesTrackerPanel'));
const WorkOrdersPanel = lazy(() => import('@/components/recycler/WorkOrdersPanel'));
const ProductionCostPanel = lazy(() => import('@/components/recycler/ProductionCostPanel'));
const FactoryDigitalTwinPanel = lazy(() => import('@/components/recycler/FactoryDigitalTwinPanel'));
const PredictiveMaintenancePanel = lazy(() => import('@/components/recycler/PredictiveMaintenancePanel'));
const SmartProductionOptimizer = lazy(() => import('@/components/recycler/SmartProductionOptimizer'));
const BatchTraceabilityPanel = lazy(() => import('@/components/recycler/BatchTraceabilityPanel'));
const CarbonFootprintDashboard = lazy(() => import('@/components/recycler/CarbonFootprintDashboard'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));
const LicensedWasteTypesEditor = lazy(() => import('@/components/wmis/LicensedWasteTypesEditor'));
const RecyclerDeclarations = lazy(() => import('@/components/recycler/RecyclerDeclarations'));

interface RecyclerProductionTabsProps {
  organizationId?: string;
}

const RecyclerProductionTabs = ({ organizationId }: RecyclerProductionTabsProps) => (
  <>
    <TabsContent value="twin" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <FactoryDigitalTwinPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="production" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <ProductionDashboardPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="quality" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <QualityInspectorPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="equipment" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <EquipmentManagerPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="predictive" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <PredictiveMaintenancePanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="workorders" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <WorkOrdersPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="optimizer" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <SmartProductionOptimizer />
      </Suspense>
    </TabsContent>

    <TabsContent value="traceability" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <BatchTraceabilityPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="utilities" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <UtilitiesTrackerPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="cost" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <ProductionCostPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="certificates" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <RecycledProductCertificate />
      </Suspense>
    </TabsContent>

    <TabsContent value="market" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <MaterialMarketPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="carbon" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <CarbonFootprintDashboard />
      </Suspense>
    </TabsContent>

    <TabsContent value="esg" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <ESGReportPanel />
      </Suspense>
    </TabsContent>

    <TabsContent value="wmis" className="mt-4 space-y-4">
      <Suspense fallback={<TabFallback />}>
        {organizationId && <LicensedWasteTypesEditor organizationId={organizationId} />}
        <WMISEventsFeed />
      </Suspense>
    </TabsContent>

    <TabsContent value="declarations" className="mt-4">
      <Suspense fallback={<TabFallback />}>
        <RecyclerDeclarations />
      </Suspense>
    </TabsContent>
  </>
);

export default RecyclerProductionTabs;
