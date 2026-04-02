import { Route, Navigate } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const Drivers = lazyRetry(() => import('@/pages/Drivers'));
const DriverDetails = lazyRetry(() => import('@/pages/DriverDetails'));
const TransporterShipments = lazyRetry(() => import('@/pages/dashboard/TransporterShipments'));
const TransporterDrivers = lazyRetry(() => import('@/pages/dashboard/TransporterDrivers'));
const TransporterAITools = lazyRetry(() => import('@/pages/dashboard/TransporterAITools'));
const TransporterReceipts = lazyRetry(() => import('@/pages/dashboard/TransporterReceipts'));
const ShipmentManagement = lazyRetry(() => import('@/pages/dashboard/ShipmentManagement'));
const CreateShipment = lazyRetry(() => import('@/pages/dashboard/CreateShipment'));
const ShipmentDetails = lazyRetry(() => import('@/pages/dashboard/ShipmentDetails'));
const ManualShipmentCreate = lazyRetry(() => import('@/pages/dashboard/ManualShipmentCreate'));
const ManualShipmentDrafts = lazyRetry(() => import('@/pages/dashboard/ManualShipmentDrafts'));
const DriverTracking = lazyRetry(() => import('@/pages/dashboard/DriverTracking'));
const ShipmentRoutesMap = lazyRetry(() => import('@/pages/dashboard/ShipmentRoutesMap'));
const TrackingCenter = lazyRetry(() => import('@/pages/dashboard/TrackingCenter'));
const LoadingWorkers = lazyRetry(() => import('@/pages/dashboard/LoadingWorkers'));
const FuelManagement = lazyRetry(() => import('@/pages/dashboard/FuelManagement'));
const QuickDriverLinks = lazyRetry(() => import('@/pages/dashboard/QuickDriverLinks'));
const QuickShipmentLinks = lazyRetry(() => import('@/pages/dashboard/QuickShipmentLinks'));
const QuickDepositLinks = lazyRetry(() => import('@/pages/dashboard/QuickDepositLinks'));
const DeliveryDeclarations = lazyRetry(() => import('@/pages/dashboard/DeliveryDeclarations'));
const RejectedShipments = lazyRetry(() => import('@/pages/dashboard/RejectedShipments'));
const RecurringShipments = lazyRetry(() => import('@/pages/dashboard/RecurringShipments'));
const WazeLiveMap = lazyRetry(() => import('@/pages/dashboard/WazeLiveMap'));
const GPSSettings = lazyRetry(() => import('@/pages/dashboard/GPSSettings'));
const CamerasPage = lazyRetry(() => import('@/pages/dashboard/CamerasPage'));
const IoTSettings = lazyRetry(() => import('@/pages/dashboard/IoTSettings'));
const PreventiveMaintenance = lazyRetry(() => import('@/pages/dashboard/PreventiveMaintenance'));
const OperationsDashboard = lazyRetry(() => import('@/pages/dashboard/OperationsDashboard'));
const SmartInsights = lazyRetry(() => import('@/pages/dashboard/SmartInsights'));
const DriverMyRoute = lazyRetry(() => import('@/pages/dashboard/DriverMyRoute'));
const MyLocation = lazyRetry(() => import('@/pages/dashboard/MyLocation'));
const ShipmentReports = lazyRetry(() => import('@/pages/dashboard/ShipmentReports'));
const AggregateShipmentReport = lazyRetry(() => import('@/pages/dashboard/AggregateShipmentReport'));
const ManualOperations = lazyRetry(() => import('@/pages/dashboard/ManualOperations'));
const QuickWeightEntry = lazyRetry(() => import('@/pages/dashboard/QuickWeightEntry'));
const BulkWeightEntries = lazyRetry(() => import('@/pages/dashboard/BulkWeightEntries'));
const EmployeeManagement = lazyRetry(() => import('@/pages/dashboard/EmployeeManagement'));
const ExternalRecords = lazyRetry(() => import('@/pages/dashboard/ExternalRecords'));
const Quotations = lazyRetry(() => import('@/pages/dashboard/Quotations'));
const EInvoice = lazyRetry(() => import('@/pages/dashboard/EInvoice'));
const CustomerPortal = lazyRetry(() => import('@/pages/dashboard/CustomerPortal'));
const ExecutiveDashboard = lazyRetry(() => import('@/pages/dashboard/ExecutiveDashboard'));
const SmartAgentDashboard = lazyRetry(() => import('@/pages/dashboard/SmartAgentDashboard'));
const CarbonFootprintAnalysis = lazyRetry(() => import('@/pages/dashboard/CarbonFootprintAnalysis'));
const EnvironmentalSustainability = lazyRetry(() => import('@/pages/dashboard/EnvironmentalSustainability'));
const ScopedAccessLinks = lazyRetry(() => import('@/pages/dashboard/ScopedAccessLinks'));
const AuthorizedSignatories = lazyRetry(() => import('@/pages/dashboard/AuthorizedSignatories'));
const WhiteLabelPortal = lazyRetry(() => import('@/pages/dashboard/WhiteLabelPortal'));
const CollectionRequests = lazyRetry(() => import('@/pages/dashboard/CollectionRequests'));
const DriverProfile = lazyRetry(() => import('@/pages/dashboard/DriverProfile'));
const DriverData = lazyRetry(() => import('@/pages/dashboard/DriverData'));

export const transporterRoutes = (
  <>
    <Route path="/dashboard/drivers" element={<Drivers />} />
    <Route path="/dashboard/drivers/:driverId" element={<DriverDetails />} />
    <Route path="/dashboard/transporter-shipments" element={<TransporterShipments />} />
    <Route path="/dashboard/transporter-drivers" element={<TransporterDrivers />} />
    <Route path="/dashboard/transporter-ai-tools" element={<TransporterAITools />} />
    <Route path="/dashboard/transporter-receipts" element={<TransporterReceipts />} />
    <Route path="/dashboard/shipments" element={<ShipmentManagement />} />
    <Route path="/dashboard/shipments/new" element={<CreateShipment />} />
    <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/s/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/manual-shipment" element={<ManualShipmentCreate />} />
    <Route path="/dashboard/manual-shipment-drafts" element={<ManualShipmentDrafts />} />
    <Route path="/dashboard/driver-tracking" element={<DriverTracking />} />
    <Route path="/dashboard/shipment-routes" element={<ShipmentRoutesMap />} />
    <Route path="/dashboard/tracking-center" element={<TrackingCenter />} />
    <Route path="/dashboard/driver-my-route" element={<DriverMyRoute />} />
    <Route path="/dashboard/my-location" element={<MyLocation />} />
    <Route path="/dashboard/loading-workers" element={<LoadingWorkers />} />
    <Route path="/dashboard/fuel-management" element={<FuelManagement />} />
    <Route path="/dashboard/quick-driver-links" element={<QuickDriverLinks />} />
    <Route path="/dashboard/quick-shipment-links" element={<QuickShipmentLinks />} />
    <Route path="/dashboard/quick-deposit-links" element={<QuickDepositLinks />} />
    <Route path="/dashboard/delivery-declarations" element={<DeliveryDeclarations />} />
    <Route path="/dashboard/rejected-shipments" element={<RejectedShipments />} />
    <Route path="/dashboard/recurring-shipments" element={<RecurringShipments />} />
    <Route path="/dashboard/waze-live-map" element={<WazeLiveMap />} />
    <Route path="/dashboard/gps-settings" element={<GPSSettings />} />
    <Route path="/dashboard/cameras" element={<CamerasPage />} />
    <Route path="/dashboard/iot-settings" element={<IoTSettings />} />
    <Route path="/dashboard/preventive-maintenance" element={<PreventiveMaintenance />} />
    <Route path="/dashboard/operations" element={<OperationsDashboard />} />
    <Route path="/dashboard/smart-insights" element={<SmartInsights />} />
    <Route path="/dashboard/fleet" element={<Navigate to="/dashboard/drivers" replace />} />
    <Route path="/dashboard/shipment-reports" element={<ShipmentReports />} />
    <Route path="/dashboard/aggregate-report" element={<AggregateShipmentReport />} />
    <Route path="/dashboard/manual-operations" element={<ManualOperations />} />
    <Route path="/dashboard/quick-weight" element={<QuickWeightEntry />} />
    <Route path="/dashboard/bulk-weight-entries" element={<BulkWeightEntries />} />
    <Route path="/dashboard/external-records" element={<ExternalRecords />} />
    <Route path="/dashboard/quotations" element={<Quotations />} />
    <Route path="/dashboard/e-invoice" element={<EInvoice />} />
    <Route path="/dashboard/customer-portal" element={<CustomerPortal />} />
    <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
    <Route path="/dashboard/smart-agent" element={<SmartAgentDashboard />} />
    <Route path="/dashboard/carbon-footprint" element={<CarbonFootprintAnalysis />} />
    <Route path="/dashboard/environmental-sustainability" element={<EnvironmentalSustainability />} />
    <Route path="/dashboard/scoped-access-links" element={<ScopedAccessLinks />} />
    <Route path="/dashboard/authorized-signatories" element={<AuthorizedSignatories />} />
    <Route path="/dashboard/white-label-portal" element={<WhiteLabelPortal />} />
    <Route path="/dashboard/collection-requests" element={<CollectionRequests />} />
    <Route path="/dashboard/driver-profile" element={<DriverProfile />} />
    <Route path="/dashboard/driver-data" element={<DriverData />} />
    {/* ERP routes for transporter */}
    {erpRoutes}
    {/* HR routes for transporter */}
    {hrRoutes}
  </>
);

// ERP sub-routes
import { erpRoutes } from './ERPRoutes';
import { hrRoutes } from './HRRoutes';
