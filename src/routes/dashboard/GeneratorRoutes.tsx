import { Route, Navigate } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const ShipmentManagement = lazyRetry(() => import('@/pages/dashboard/ShipmentManagement'));
const CreateShipment = lazyRetry(() => import('@/pages/dashboard/CreateShipment'));
const ShipmentDetails = lazyRetry(() => import('@/pages/dashboard/ShipmentDetails'));
const MyRequests = lazyRetry(() => import('@/pages/dashboard/MyRequests'));
const CollectionRequests = lazyRetry(() => import('@/pages/dashboard/CollectionRequests'));
const GeneratorReceipts = lazyRetry(() => import('@/pages/dashboard/GeneratorReceipts'));
const CreateReceipt = lazyRetry(() => import('@/pages/dashboard/CreateReceipt'));
const NonHazardousWasteRegister = lazyRetry(() => import('@/pages/dashboard/NonHazardousWasteRegister'));
const HazardousWasteRegister = lazyRetry(() => import('@/pages/dashboard/HazardousWasteRegister'));
const WasteTypesClassification = lazyRetry(() => import('@/pages/dashboard/WasteTypesClassification'));
const AggregateShipmentReport = lazyRetry(() => import('@/pages/dashboard/AggregateShipmentReport'));
const ShipmentReports = lazyRetry(() => import('@/pages/dashboard/ShipmentReports'));
const CarbonFootprintAnalysis = lazyRetry(() => import('@/pages/dashboard/CarbonFootprintAnalysis'));
const EnvironmentalSustainability = lazyRetry(() => import('@/pages/dashboard/EnvironmentalSustainability'));
const ExternalRecords = lazyRetry(() => import('@/pages/dashboard/ExternalRecords'));
const RegulatoryUpdates = lazyRetry(() => import('@/pages/dashboard/RegulatoryUpdates'));
const OperationalPlans = lazyRetry(() => import('@/pages/dashboard/OperationalPlans'));
const RegulatoryDocuments = lazyRetry(() => import('@/pages/dashboard/RegulatoryDocuments'));
const LawsAndRegulations = lazyRetry(() => import('@/pages/dashboard/LawsAndRegulations'));
const Permits = lazyRetry(() => import('@/pages/dashboard/Permits'));
const EnvironmentalConsultants = lazyRetry(() => import('@/pages/dashboard/EnvironmentalConsultants'));
const AuthorizedSignatories = lazyRetry(() => import('@/pages/dashboard/AuthorizedSignatories'));
const QuickDepositLinks = lazyRetry(() => import('@/pages/dashboard/QuickDepositLinks'));
const QuickShipmentLinks = lazyRetry(() => import('@/pages/dashboard/QuickShipmentLinks'));
const ManualShipmentCreate = lazyRetry(() => import('@/pages/dashboard/ManualShipmentCreate'));
const ManualShipmentDrafts = lazyRetry(() => import('@/pages/dashboard/ManualShipmentDrafts'));
const DeliveryDeclarations = lazyRetry(() => import('@/pages/dashboard/DeliveryDeclarations'));
const SmartInsights = lazyRetry(() => import('@/pages/dashboard/SmartInsights'));
const Quotations = lazyRetry(() => import('@/pages/dashboard/Quotations'));
const EInvoice = lazyRetry(() => import('@/pages/dashboard/EInvoice'));
const CustomerPortal = lazyRetry(() => import('@/pages/dashboard/CustomerPortal'));
const ExecutiveDashboard = lazyRetry(() => import('@/pages/dashboard/ExecutiveDashboard'));
const ScopedAccessLinks = lazyRetry(() => import('@/pages/dashboard/ScopedAccessLinks'));
const WhiteLabelPortal = lazyRetry(() => import('@/pages/dashboard/WhiteLabelPortal'));
const ManualOperations = lazyRetry(() => import('@/pages/dashboard/ManualOperations'));
const QuickWeightEntry = lazyRetry(() => import('@/pages/dashboard/QuickWeightEntry'));
const BulkWeightEntries = lazyRetry(() => import('@/pages/dashboard/BulkWeightEntries'));
const SmartAgentDashboard = lazyRetry(() => import('@/pages/dashboard/SmartAgentDashboard'));
const ESGReports = lazyRetry(() => import('@/pages/dashboard/ESGReports'));
const DetailedWasteAnalysis = lazyRetry(() => import('@/pages/dashboard/DetailedWasteAnalysis'));

export const generatorRoutes = (
  <>
    <Route path="/dashboard/shipments" element={<ShipmentManagement />} />
    <Route path="/dashboard/shipments/new" element={<CreateShipment />} />
    <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/s/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/my-requests" element={<MyRequests />} />
    <Route path="/dashboard/work-orders" element={<Navigate to="/dashboard/my-requests" replace />} />
    <Route path="/dashboard/collection-requests" element={<CollectionRequests />} />
    <Route path="/dashboard/generator-receipts" element={<GeneratorReceipts />} />
    <Route path="/dashboard/create-receipt" element={<CreateReceipt />} />
    <Route path="/dashboard/non-hazardous-register" element={<NonHazardousWasteRegister />} />
    <Route path="/dashboard/hazardous-register" element={<HazardousWasteRegister />} />
    <Route path="/dashboard/waste-types" element={<WasteTypesClassification />} />
    <Route path="/dashboard/aggregate-report" element={<AggregateShipmentReport />} />
    <Route path="/dashboard/shipment-reports" element={<ShipmentReports />} />
    <Route path="/dashboard/carbon-footprint" element={<CarbonFootprintAnalysis />} />
    <Route path="/dashboard/environmental-sustainability" element={<EnvironmentalSustainability />} />
    <Route path="/dashboard/external-records" element={<ExternalRecords />} />
    <Route path="/dashboard/regulatory-updates" element={<RegulatoryUpdates />} />
    <Route path="/dashboard/operational-plans" element={<OperationalPlans />} />
    <Route path="/dashboard/regulatory-documents" element={<RegulatoryDocuments />} />
    <Route path="/dashboard/laws-regulations" element={<LawsAndRegulations />} />
    <Route path="/dashboard/permits" element={<Permits />} />
    <Route path="/dashboard/environmental-consultants" element={<EnvironmentalConsultants />} />
    <Route path="/dashboard/authorized-signatories" element={<AuthorizedSignatories />} />
    <Route path="/dashboard/quick-deposit-links" element={<QuickDepositLinks />} />
    <Route path="/dashboard/quick-shipment-links" element={<QuickShipmentLinks />} />
    <Route path="/dashboard/manual-shipment" element={<ManualShipmentCreate />} />
    <Route path="/dashboard/manual-shipment-drafts" element={<ManualShipmentDrafts />} />
    <Route path="/dashboard/delivery-declarations" element={<DeliveryDeclarations />} />
    <Route path="/dashboard/smart-insights" element={<SmartInsights />} />
    <Route path="/dashboard/quotations" element={<Quotations />} />
    <Route path="/dashboard/e-invoice" element={<EInvoice />} />
    <Route path="/dashboard/customer-portal" element={<CustomerPortal />} />
    <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
    <Route path="/dashboard/scoped-access-links" element={<ScopedAccessLinks />} />
    <Route path="/dashboard/white-label-portal" element={<WhiteLabelPortal />} />
    <Route path="/dashboard/manual-operations" element={<ManualOperations />} />
    <Route path="/dashboard/quick-weight" element={<QuickWeightEntry />} />
    <Route path="/dashboard/bulk-weight-entries" element={<BulkWeightEntries />} />
    <Route path="/dashboard/smart-agent" element={<SmartAgentDashboard />} />
    <Route path="/dashboard/esg-reports" element={<ESGReports />} />
    <Route path="/dashboard/detailed-waste-analysis" element={<DetailedWasteAnalysis />} />
    {erpRoutes}
    {hrRoutes}
  </>
);

import { erpRoutes } from './ERPRoutes';
import { hrRoutes } from './HRRoutes';
