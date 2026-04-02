import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const RecyclerAITools = lazyRetry(() => import('@/pages/dashboard/RecyclerAITools'));
const RecyclingCertificates = lazyRetry(() => import('@/pages/dashboard/RecyclingCertificates'));
const IssueRecyclingCertificates = lazyRetry(() => import('@/pages/dashboard/IssueRecyclingCertificates'));
const PrideCertificates = lazyRetry(() => import('@/pages/dashboard/PrideCertificates'));
const WoodMarketIntelligence = lazyRetry(() => import('@/pages/dashboard/WoodMarketIntelligence'));
const GlobalCommodityExchange = lazyRetry(() => import('@/pages/dashboard/GlobalCommodityExchange'));
const WasteExchange = lazyRetry(() => import('@/pages/dashboard/WasteExchange'));
const WasteFlowHeatmap = lazyRetry(() => import('@/pages/dashboard/WasteFlowHeatmap'));
const ESGReports = lazyRetry(() => import('@/pages/dashboard/ESGReports'));
const DetailedWasteAnalysis = lazyRetry(() => import('@/pages/dashboard/DetailedWasteAnalysis'));
const CircularEconomy = lazyRetry(() => import('@/pages/dashboard/CircularEconomy'));
const WasteAuctions = lazyRetry(() => import('@/pages/dashboard/WasteAuctions'));
const B2BMarketplace = lazyRetry(() => import('@/pages/dashboard/B2BMarketplace'));
const ProductionDashboard = lazyRetry(() => import('@/pages/dashboard/ProductionDashboard'));
const CapacityManagement = lazyRetry(() => import('@/pages/dashboard/CapacityManagement'));
const EquipmentMarketplace = lazyRetry(() => import('@/pages/dashboard/EquipmentMarketplace'));
const NonHazardousWasteRegister = lazyRetry(() => import('@/pages/dashboard/NonHazardousWasteRegister'));
const HazardousWasteRegister = lazyRetry(() => import('@/pages/dashboard/HazardousWasteRegister'));
const WasteTypesClassification = lazyRetry(() => import('@/pages/dashboard/WasteTypesClassification'));
const ShipmentManagement = lazyRetry(() => import('@/pages/dashboard/ShipmentManagement'));
const ShipmentDetails = lazyRetry(() => import('@/pages/dashboard/ShipmentDetails'));
const CarbonFootprintAnalysis = lazyRetry(() => import('@/pages/dashboard/CarbonFootprintAnalysis'));
const EnvironmentalSustainability = lazyRetry(() => import('@/pages/dashboard/EnvironmentalSustainability'));
const ExternalRecords = lazyRetry(() => import('@/pages/dashboard/ExternalRecords'));
const Quotations = lazyRetry(() => import('@/pages/dashboard/Quotations'));
const EInvoice = lazyRetry(() => import('@/pages/dashboard/EInvoice'));
const CustomerPortal = lazyRetry(() => import('@/pages/dashboard/CustomerPortal'));
const ExecutiveDashboard = lazyRetry(() => import('@/pages/dashboard/ExecutiveDashboard'));
const SmartAgentDashboard = lazyRetry(() => import('@/pages/dashboard/SmartAgentDashboard'));
const GuillochePatterns = lazyRetry(() => import('@/pages/dashboard/GuillochePatterns'));
const FuturesMarket = lazyRetry(() => import('@/pages/dashboard/FuturesMarket'));
const AuthorizedSignatories = lazyRetry(() => import('@/pages/dashboard/AuthorizedSignatories'));
const WhiteLabelPortal = lazyRetry(() => import('@/pages/dashboard/WhiteLabelPortal'));
const ManualOperations = lazyRetry(() => import('@/pages/dashboard/ManualOperations'));
const QuickWeightEntry = lazyRetry(() => import('@/pages/dashboard/QuickWeightEntry'));
const BulkWeightEntries = lazyRetry(() => import('@/pages/dashboard/BulkWeightEntries'));
const SmartInsights = lazyRetry(() => import('@/pages/dashboard/SmartInsights'));
const ScopedAccessLinks = lazyRetry(() => import('@/pages/dashboard/ScopedAccessLinks'));
const AggregateShipmentReport = lazyRetry(() => import('@/pages/dashboard/AggregateShipmentReport'));
const ShipmentReports = lazyRetry(() => import('@/pages/dashboard/ShipmentReports'));
const VehicleMarketplace = lazyRetry(() => import('@/pages/dashboard/VehicleMarketplace'));

export const recyclerRoutes = (
  <>
    <Route path="/dashboard/recycler-ai-tools" element={<RecyclerAITools />} />
    <Route path="/dashboard/recycling-certificates" element={<RecyclingCertificates />} />
    <Route path="/dashboard/issue-recycling-certificates" element={<IssueRecyclingCertificates />} />
    <Route path="/dashboard/pride-certificates" element={<PrideCertificates />} />
    <Route path="/dashboard/wood-market" element={<WoodMarketIntelligence />} />
    <Route path="/dashboard/commodity-exchange" element={<GlobalCommodityExchange />} />
    <Route path="/dashboard/waste-exchange" element={<WasteExchange />} />
    <Route path="/dashboard/waste-flow-heatmap" element={<WasteFlowHeatmap />} />
    <Route path="/dashboard/esg-reports" element={<ESGReports />} />
    <Route path="/dashboard/detailed-waste-analysis" element={<DetailedWasteAnalysis />} />
    <Route path="/dashboard/circular-economy" element={<CircularEconomy />} />
    <Route path="/dashboard/waste-auctions" element={<WasteAuctions />} />
    <Route path="/dashboard/b2b-marketplace" element={<B2BMarketplace />} />
    <Route path="/dashboard/production" element={<ProductionDashboard />} />
    <Route path="/dashboard/capacity-management" element={<CapacityManagement />} />
    <Route path="/dashboard/equipment-marketplace" element={<EquipmentMarketplace />} />
    <Route path="/dashboard/vehicle-marketplace" element={<VehicleMarketplace />} />
    <Route path="/dashboard/non-hazardous-register" element={<NonHazardousWasteRegister />} />
    <Route path="/dashboard/hazardous-register" element={<HazardousWasteRegister />} />
    <Route path="/dashboard/waste-types" element={<WasteTypesClassification />} />
    <Route path="/dashboard/shipments" element={<ShipmentManagement />} />
    <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/s/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/carbon-footprint" element={<CarbonFootprintAnalysis />} />
    <Route path="/dashboard/environmental-sustainability" element={<EnvironmentalSustainability />} />
    <Route path="/dashboard/external-records" element={<ExternalRecords />} />
    <Route path="/dashboard/quotations" element={<Quotations />} />
    <Route path="/dashboard/e-invoice" element={<EInvoice />} />
    <Route path="/dashboard/customer-portal" element={<CustomerPortal />} />
    <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
    <Route path="/dashboard/smart-agent" element={<SmartAgentDashboard />} />
    <Route path="/dashboard/guilloche-patterns" element={<GuillochePatterns />} />
    <Route path="/dashboard/futures-market" element={<FuturesMarket />} />
    <Route path="/dashboard/authorized-signatories" element={<AuthorizedSignatories />} />
    <Route path="/dashboard/white-label-portal" element={<WhiteLabelPortal />} />
    <Route path="/dashboard/manual-operations" element={<ManualOperations />} />
    <Route path="/dashboard/quick-weight" element={<QuickWeightEntry />} />
    <Route path="/dashboard/bulk-weight-entries" element={<BulkWeightEntries />} />
    <Route path="/dashboard/smart-insights" element={<SmartInsights />} />
    <Route path="/dashboard/scoped-access-links" element={<ScopedAccessLinks />} />
    <Route path="/dashboard/aggregate-report" element={<AggregateShipmentReport />} />
    <Route path="/dashboard/shipment-reports" element={<ShipmentReports />} />
    {erpRoutes}
    {hrRoutes}
  </>
);

import { erpRoutes } from './ERPRoutes';
import { hrRoutes } from './HRRoutes';
