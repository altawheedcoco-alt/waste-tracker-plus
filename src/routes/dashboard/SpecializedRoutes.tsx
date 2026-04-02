import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

// Disposal
const DisposalDashboard = lazyRetry(() => import('@/pages/dashboard/disposal/DisposalDashboard'));
const DisposalOperations = lazyRetry(() => import('@/pages/dashboard/disposal/DisposalOperations'));
const NewDisposalOperation = lazyRetry(() => import('@/pages/dashboard/disposal/NewDisposalOperation'));
const DisposalIncomingRequests = lazyRetry(() => import('@/pages/dashboard/disposal/DisposalIncomingRequests'));
const DisposalCertificates = lazyRetry(() => import('@/pages/dashboard/disposal/DisposalCertificates'));
const DisposalReports = lazyRetry(() => import('@/pages/dashboard/disposal/DisposalReports'));
const DisposalMissionControl = lazyRetry(() => import('@/pages/dashboard/disposal/DisposalMissionControl'));
const DisposalFacilities = lazyRetry(() => import('@/pages/dashboard/DisposalFacilities'));

// Municipal
const MunicipalDashboard = lazyRetry(() => import('@/pages/dashboard/municipal/MunicipalDashboard'));
const ServiceZones = lazyRetry(() => import('@/pages/dashboard/municipal/ServiceZones'));
const StreetBins = lazyRetry(() => import('@/pages/dashboard/municipal/StreetBins'));
const CollectionRoutes = lazyRetry(() => import('@/pages/dashboard/municipal/CollectionRoutes'));
const CollectionTrips = lazyRetry(() => import('@/pages/dashboard/municipal/CollectionTrips'));
const CitizenComplaints = lazyRetry(() => import('@/pages/dashboard/municipal/CitizenComplaints'));
const SweepingCrews = lazyRetry(() => import('@/pages/dashboard/municipal/SweepingCrews'));
const SweepingEquipment = lazyRetry(() => import('@/pages/dashboard/municipal/SweepingEquipment'));
const DailyAttendance = lazyRetry(() => import('@/pages/dashboard/municipal/DailyAttendance'));
const TransferStations = lazyRetry(() => import('@/pages/dashboard/municipal/TransferStations'));
const MunicipalContracts = lazyRetry(() => import('@/pages/dashboard/municipal/MunicipalContracts'));
const PenaltiesManagement = lazyRetry(() => import('@/pages/dashboard/municipal/PenaltiesManagement'));
const WorkerSafety = lazyRetry(() => import('@/pages/dashboard/municipal/WorkerSafety'));
const EquipmentCustody = lazyRetry(() => import('@/pages/dashboard/municipal/EquipmentCustody'));
const MunicipalReports = lazyRetry(() => import('@/pages/dashboard/municipal/MunicipalReports'));

// Regulator
const RegulatorDashboard = lazyRetry(() => import('@/pages/dashboard/RegulatorDashboardNew'));
const RegulatorWMRA = lazyRetry(() => import('@/pages/dashboard/RegulatorWMRA'));
const RegulatorEEAA = lazyRetry(() => import('@/pages/dashboard/RegulatorEEAA'));
const RegulatorLTRA = lazyRetry(() => import('@/pages/dashboard/RegulatorLTRA'));
const RegulatorIDA = lazyRetry(() => import('@/pages/dashboard/RegulatorIDA'));
const RegulatedCompanies = lazyRetry(() => import('@/pages/dashboard/RegulatedCompanies'));
const RegulatoryViolations = lazyRetry(() => import('@/pages/dashboard/RegulatoryViolations'));

// Consultant
const ConsultantPortal = lazyRetry(() => import('@/pages/dashboard/ConsultantPortal'));
const Reports = lazyRetry(() => import('@/pages/dashboard/Reports'));
const RecyclingCertificates = lazyRetry(() => import('@/pages/dashboard/RecyclingCertificates'));
const OrgStructure = lazyRetry(() => import('@/pages/dashboard/OrgStructure'));
const EmployeeTaskBoard = lazyRetry(() => import('@/pages/dashboard/EmployeeTaskBoard'));
const AdvancedAnalytics = lazyRetry(() => import('@/pages/dashboard/AdvancedAnalytics'));

export const disposalRoutes = (
  <>
    <Route path="/dashboard/disposal" element={<DisposalDashboard />} />
    <Route path="/dashboard/disposal/operations" element={<DisposalOperations />} />
    <Route path="/dashboard/disposal/operations/new" element={<NewDisposalOperation />} />
    <Route path="/dashboard/disposal/incoming-requests" element={<DisposalIncomingRequests />} />
    <Route path="/dashboard/disposal/certificates" element={<DisposalCertificates />} />
    <Route path="/dashboard/disposal/certificates/new" element={<DisposalCertificates />} />
    <Route path="/dashboard/disposal/reports" element={<DisposalReports />} />
    <Route path="/dashboard/disposal/mission-control" element={<DisposalMissionControl />} />
    <Route path="/dashboard/disposal-facilities" element={<DisposalFacilities />} />
  </>
);

export const municipalRoutes = (
  <>
    <Route path="/dashboard/municipal-dashboard" element={<MunicipalDashboard />} />
    <Route path="/dashboard/service-zones" element={<ServiceZones />} />
    <Route path="/dashboard/street-bins" element={<StreetBins />} />
    <Route path="/dashboard/collection-routes" element={<CollectionRoutes />} />
    <Route path="/dashboard/collection-trips" element={<CollectionTrips />} />
    <Route path="/dashboard/citizen-complaints" element={<CitizenComplaints />} />
    <Route path="/dashboard/sweeping-crews" element={<SweepingCrews />} />
    <Route path="/dashboard/sweeping-equipment" element={<SweepingEquipment />} />
    <Route path="/dashboard/daily-attendance" element={<DailyAttendance />} />
    <Route path="/dashboard/transfer-stations" element={<TransferStations />} />
    <Route path="/dashboard/municipal-contracts" element={<MunicipalContracts />} />
    <Route path="/dashboard/penalties-management" element={<PenaltiesManagement />} />
    <Route path="/dashboard/worker-safety" element={<WorkerSafety />} />
    <Route path="/dashboard/equipment-custody" element={<EquipmentCustody />} />
    <Route path="/dashboard/municipal-reports" element={<MunicipalReports />} />
  </>
);

export const regulatorRoutes = (
  <>
    <Route path="/dashboard/regulator" element={<RegulatorDashboard />} />
    <Route path="/dashboard/regulator-wmra" element={<RegulatorWMRA />} />
    <Route path="/dashboard/regulator-eeaa" element={<RegulatorEEAA />} />
    <Route path="/dashboard/regulator-ltra" element={<RegulatorLTRA />} />
    <Route path="/dashboard/regulator-ida" element={<RegulatorIDA />} />
    <Route path="/dashboard/regulated-companies" element={<RegulatedCompanies />} />
    <Route path="/dashboard/regulatory-violations" element={<RegulatoryViolations />} />
  </>
);

export const consultantRoutes = (
  <>
    <Route path="/dashboard/consultant-portal" element={<ConsultantPortal />} />
    <Route path="/dashboard/audit-sessions" element={<ConsultantPortal />} />
    <Route path="/dashboard/consultant-reports" element={<Reports />} />
    <Route path="/dashboard/compliance-assessment" element={<ConsultantPortal />} />
    <Route path="/dashboard/consultant-clients" element={<lazyRetry(() => import('@/pages/dashboard/Partners'))} />}
    <Route path="/dashboard/consultant-certifications" element={<RecyclingCertificates />} />
    <Route path="/dashboard/office-consultants" element={<OrgStructure />} />
    <Route path="/dashboard/office-tasks" element={<EmployeeTaskBoard />} />
    <Route path="/dashboard/office-performance" element={<AdvancedAnalytics />} />
  </>
);
