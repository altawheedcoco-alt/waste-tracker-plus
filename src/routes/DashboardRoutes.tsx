import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import DashboardRouteGuard from "@/components/guards/DashboardRouteGuard";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MyWorkspace = lazy(() => import("@/pages/dashboard/MyWorkspace"));
const Drivers = lazy(() => import("@/pages/Drivers"));
const DriverDetails = lazy(() => import("@/pages/DriverDetails"));
const CompanyApprovals = lazy(() => import("@/pages/dashboard/CompanyApprovals"));
const CompanyManagement = lazy(() => import("@/pages/dashboard/CompanyManagement"));
const DriverApprovals = lazy(() => import("@/pages/dashboard/DriverApprovals"));
const ShipmentManagement = lazy(() => import("@/pages/dashboard/ShipmentManagement"));
const DriverTracking = lazy(() => import("@/pages/dashboard/DriverTracking"));
const ShipmentRoutesMap = lazy(() => import("@/pages/dashboard/ShipmentRoutesMap"));
const TrackingCenter = lazy(() => import("@/pages/dashboard/TrackingCenter"));
const Reports = lazy(() => import("@/pages/dashboard/Reports"));
const CarbonFootprintAnalysis = lazy(() => import("@/pages/dashboard/CarbonFootprintAnalysis"));
const EnvironmentalSustainability = lazy(() => import("@/pages/dashboard/EnvironmentalSustainability"));
const CreateShipment = lazy(() => import("@/pages/dashboard/CreateShipment"));
const ManualShipmentCreate = lazy(() => import("@/pages/dashboard/ManualShipmentCreate"));
const ManualShipmentDrafts = lazy(() => import("@/pages/dashboard/ManualShipmentDrafts"));
const ShipmentDetails = lazy(() => import("@/pages/dashboard/ShipmentDetails"));
const TransporterShipments = lazy(() => import("@/pages/dashboard/TransporterShipments"));
const TransporterDrivers = lazy(() => import("@/pages/dashboard/TransporterDrivers"));
const AITools = lazy(() => import("@/pages/dashboard/AITools"));
const AIDocumentStudioPage = lazy(() => import("@/pages/dashboard/AIDocumentStudioPage"));
const RecyclerAITools = lazy(() => import("@/pages/dashboard/RecyclerAITools"));
const TransporterAITools = lazy(() => import("@/pages/dashboard/TransporterAITools"));
const Notifications = lazy(() => import("@/pages/dashboard/Notifications"));
const OrganizationProfile = lazy(() => import("@/pages/dashboard/OrganizationProfile"));
const OrganizationDocuments = lazy(() => import("@/pages/dashboard/OrganizationDocuments"));
const AdminSystemOverview = lazy(() => import("@/pages/dashboard/AdminSystemOverview"));
const AdminRevenueManagement = lazy(() => import("@/pages/dashboard/AdminRevenueManagement"));
const NewsManager = lazy(() => import("@/pages/dashboard/NewsManager"));
const BlogManager = lazy(() => import("@/pages/dashboard/BlogManager"));
const TestimonialsManagement = lazy(() => import("@/pages/dashboard/TestimonialsManagement"));
const Partners = lazy(() => import("@/pages/dashboard/Partners"));
const EmployeeManagement = lazy(() => import("@/pages/dashboard/EmployeeManagement"));
const OrganizationView = lazy(() => import("@/pages/dashboard/OrganizationView"));
const AggregateShipmentReport = lazy(() => import("@/pages/dashboard/AggregateShipmentReport"));
const NonHazardousWasteRegister = lazy(() => import("@/pages/dashboard/NonHazardousWasteRegister"));
const HazardousWasteRegister = lazy(() => import("@/pages/dashboard/HazardousWasteRegister"));
const WasteTypesClassification = lazy(() => import("@/pages/dashboard/WasteTypesClassification"));
const MyRequests = lazy(() => import("@/pages/dashboard/MyRequests"));
const DriverOffers = lazy(() => import("@/pages/dashboard/DriverOffers"));
const RegulatoryUpdates = lazy(() => import("@/pages/dashboard/RegulatoryUpdates"));
const OperationalPlans = lazy(() => import("@/pages/dashboard/OperationalPlans"));
const Chat = lazy(() => import("@/pages/dashboard/Chat"));
const TeamCredentials = lazy(() => import("@/pages/dashboard/TeamCredentials"));
const PartnersTimeline = lazy(() => import("@/pages/dashboard/PartnersTimeline"));
const AddOrganization = lazy(() => import("@/pages/dashboard/AddOrganization"));
const ShipmentReports = lazy(() => import("@/pages/dashboard/ShipmentReports"));
const AdminDriversMap = lazy(() => import("@/pages/dashboard/AdminDriversMap"));
const VideoGenerator = lazy(() => import("@/pages/dashboard/VideoGenerator"));
const WoodMarketIntelligence = lazy(() => import("@/pages/dashboard/WoodMarketIntelligence"));
const OrgStructure = lazy(() => import("@/pages/dashboard/OrgStructure"));
const MyLocation = lazy(() => import("@/pages/dashboard/MyLocation"));
const RecyclingCertificates = lazy(() => import("@/pages/dashboard/RecyclingCertificates"));
const IssueRecyclingCertificates = lazy(() => import("@/pages/dashboard/IssueRecyclingCertificates"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const AutoActions = lazy(() => import("@/pages/dashboard/AutoActions"));
const PrideCertificates = lazy(() => import("@/pages/dashboard/PrideCertificates"));
const ReportsGuide = lazy(() => import("@/pages/dashboard/ReportsGuide"));
const AboutPlatform = lazy(() => import("@/pages/dashboard/AboutPlatform"));
const OfflineMode = lazy(() => import("@/pages/dashboard/OfflineMode"));
const DriverProfile = lazy(() => import("@/pages/dashboard/DriverProfile"));
const DriverData = lazy(() => import("@/pages/dashboard/DriverData"));
const ExternalRecords = lazy(() => import("@/pages/dashboard/ExternalRecords"));
const Contracts = lazy(() => import("@/pages/dashboard/Contracts"));
const ContractTemplates = lazy(() => import("@/pages/dashboard/ContractTemplates"));
const ContractVerificationPage = lazy(() => import("@/components/contracts/ContractVerificationPage"));
const TermsAcceptances = lazy(() => import("@/pages/dashboard/TermsAcceptances"));
const PartnerAccounts = lazy(() => import("@/pages/dashboard/PartnerAccounts"));
const PartnerAccountDetails = lazy(() => import("@/pages/dashboard/PartnerAccountDetails"));
const ExternalPartnerDetails = lazy(() => import("@/pages/dashboard/ExternalPartnerDetails"));
const DocumentVerification = lazy(() => import("@/pages/dashboard/DocumentVerification"));
const NavigationDemo = lazy(() => import("@/pages/dashboard/NavigationDemo"));
const DemoScenario = lazy(() => import("@/pages/dashboard/DemoScenario"));
const MapExplorer = lazy(() => import("@/pages/dashboard/MapExplorer"));
const SystemStatus = lazy(() => import("@/pages/dashboard/SystemStatus"));
const SupportCenter = lazy(() => import("@/pages/dashboard/SupportCenter"));
const SubscriptionManagement = lazy(() => import("@/pages/dashboard/SubscriptionManagement"));
const ApiManagement = lazy(() => import("@/pages/dashboard/ApiManagement"));
const SecurityPenetrationTesting = lazy(() => import("@/pages/dashboard/SecurityPenetrationTesting"));
const DatabaseQueryOptimization = lazy(() => import("@/pages/dashboard/DatabaseQueryOptimization"));
const AdvancedAnalytics = lazy(() => import("@/pages/dashboard/AdvancedAnalytics"));
const GDPRCompliance = lazy(() => import("@/pages/dashboard/GDPRCompliance"));
const QuickDriverLinks = lazy(() => import("@/pages/dashboard/QuickDriverLinks"));
const QuickDepositLinks = lazy(() => import("@/pages/dashboard/QuickDepositLinks"));
const QuickShipmentLinks = lazy(() => import("@/pages/dashboard/QuickShipmentLinks"));
const TransporterReceipts = lazy(() => import("@/pages/dashboard/TransporterReceipts"));
const WazeLiveMap = lazy(() => import("@/pages/dashboard/WazeLiveMap"));
const GeneratorReceipts = lazy(() => import("@/pages/dashboard/GeneratorReceipts"));
const CreateReceipt = lazy(() => import("@/pages/dashboard/CreateReceipt"));
const GuillochePatterns = lazy(() => import("@/pages/dashboard/GuillochePatterns"));
const SmartInsights = lazy(() => import("@/pages/dashboard/SmartInsights"));
const AwardLetters = lazy(() => import("@/pages/dashboard/AwardLetters"));
const OperationsDashboard = lazy(() => import("@/pages/dashboard/OperationsDashboard"));
const ActivityLogPage = lazy(() => import("@/pages/dashboard/ActivityLogPage"));
const GPSSettings = lazy(() => import("@/pages/dashboard/GPSSettings"));
const Meetings = lazy(() => import("@/pages/dashboard/Meetings"));
const DisposalFacilities = lazy(() => import("@/pages/dashboard/DisposalFacilities"));
const DisposalDashboard = lazy(() => import("@/pages/dashboard/disposal/DisposalDashboard"));
const DisposalOperations = lazy(() => import("@/pages/dashboard/disposal/DisposalOperations"));
const NewDisposalOperation = lazy(() => import("@/pages/dashboard/disposal/NewDisposalOperation"));
const DisposalIncomingRequests = lazy(() => import("@/pages/dashboard/disposal/DisposalIncomingRequests"));
const DisposalCertificates = lazy(() => import("@/pages/dashboard/disposal/DisposalCertificates"));
const DisposalReports = lazy(() => import("@/pages/dashboard/disposal/DisposalReports"));
const DisposalMissionControl = lazy(() => import("@/pages/dashboard/disposal/DisposalMissionControl"));
const Gamification = lazy(() => import("@/pages/dashboard/Gamification"));
const IoTSettings = lazy(() => import("@/pages/dashboard/IoTSettings"));
const EInvoice = lazy(() => import("@/pages/dashboard/EInvoice"));
const CustomerPortal = lazy(() => import("@/pages/dashboard/CustomerPortal"));
const OnboardingReview = lazy(() => import("@/pages/dashboard/OnboardingReview"));
const C2BManagement = lazy(() => import("@/pages/dashboard/C2BManagement"));
const Stories = lazy(() => import("@/pages/dashboard/Stories"));
const DeliveryDeclarations = lazy(() => import("@/pages/dashboard/DeliveryDeclarations"));
const RejectedShipments = lazy(() => import("@/pages/dashboard/RejectedShipments"));
const ERPAccounting = lazy(() => import("@/pages/dashboard/erp/ERPAccounting"));
const ERPInventory = lazy(() => import("@/pages/dashboard/erp/ERPInventory"));
const ERPHR = lazy(() => import("@/pages/dashboard/erp/ERPHR"));
const ERPPurchasingAndSales = lazy(() => import("@/pages/dashboard/erp/ERPPurchasingAndSales"));
const ERPFinancialDashboard = lazy(() => import("@/pages/dashboard/erp/ERPFinancialDashboard"));
const ERPRevenueExpensesAnalysis = lazy(() => import("@/pages/dashboard/erp/ERPRevenueExpensesAnalysis"));
const ERPCogs = lazy(() => import("@/pages/dashboard/erp/ERPCogs"));
const ERPFinancialComparisons = lazy(() => import("@/pages/dashboard/erp/ERPFinancialComparisons"));
const DocumentArchive = lazy(() => import("@/pages/dashboard/DocumentArchive"));
const GlobalCommodityExchange = lazy(() => import("@/pages/dashboard/GlobalCommodityExchange"));
const WasteExchange = lazy(() => import("@/pages/dashboard/WasteExchange"));
const DetailedWasteAnalysis = lazy(() => import("@/pages/dashboard/DetailedWasteAnalysis"));
const WasteFlowHeatmap = lazy(() => import("@/pages/dashboard/WasteFlowHeatmap"));
const ESGReports = lazy(() => import("@/pages/dashboard/ESGReports"));
const DriverPermits = lazy(() => import("@/pages/dashboard/DriverPermits"));
const LearningCenter = lazy(() => import("@/pages/dashboard/LearningCenter"));
const UserGuidePage = lazy(() => import("@/pages/dashboard/UserGuidePage"));
const AuthorizedSignatories = lazy(() => import("@/pages/dashboard/AuthorizedSignatories"));
const Permits = lazy(() => import("@/pages/dashboard/Permits"));
const EnvironmentalConsultants = lazy(() => import("@/pages/dashboard/EnvironmentalConsultants"));
const SigningInbox = lazy(() => import("@/pages/dashboard/SigningInbox"));
const BulkSigning = lazy(() => import("@/pages/dashboard/BulkSigning"));
const AllNotes = lazy(() => import("@/pages/dashboard/AllNotes"));
const SystemCommands = lazy(() => import("@/pages/dashboard/SystemCommands"));
const CrossImpactDashboard = lazy(() => import("@/pages/dashboard/CrossImpactDashboard"));
const RegulatorDashboard = lazy(() => import("@/pages/dashboard/RegulatorDashboardNew"));
const RegulatorWMRA = lazy(() => import("@/pages/dashboard/RegulatorWMRA"));
const RegulatorEEAA = lazy(() => import("@/pages/dashboard/RegulatorEEAA"));
const RegulatorLTRA = lazy(() => import("@/pages/dashboard/RegulatorLTRA"));
const RegulatorIDA = lazy(() => import("@/pages/dashboard/RegulatorIDA"));
const RegulatedCompanies = lazy(() => import("@/pages/dashboard/RegulatedCompanies"));
const CollectionRequests = lazy(() => import("@/pages/dashboard/CollectionRequests"));
const SmartInsurance = lazy(() => import("@/pages/dashboard/SmartInsurance"));
const FuturesMarket = lazy(() => import("@/pages/dashboard/FuturesMarket"));
const DigitalWallet = lazy(() => import("@/pages/dashboard/DigitalWallet"));
const DriverAcademy = lazy(() => import("@/pages/dashboard/DriverAcademy"));
const OHSReports = lazy(() => import("@/pages/dashboard/OHSReports"));
const ManualOperations = lazy(() => import("@/pages/dashboard/ManualOperations"));
const QuickWeightEntry = lazy(() => import("@/pages/dashboard/QuickWeightEntry"));
const BulkWeightEntries = lazy(() => import("@/pages/dashboard/BulkWeightEntries"));
const SystemScreenshots = lazy(() => import("@/pages/dashboard/SystemScreenshots"));
const AdminHomepageManager = lazy(() => import("@/pages/dashboard/AdminHomepageManager"));
const CircularEconomy = lazy(() => import("@/pages/dashboard/CircularEconomy"));
const AdvertiserDashboard = lazy(() => import("@/pages/dashboard/AdvertiserDashboard"));
const AdPlans = lazy(() => import("@/pages/dashboard/AdPlans"));
const StationeryTemplates = lazy(() => import("@/pages/dashboard/StationeryTemplates"));
const StationeryPlans = lazy(() => import("@/pages/dashboard/StationeryPlans"));
const WasteAuctions = lazy(() => import("@/pages/dashboard/WasteAuctions"));
const PartnerReviews = lazy(() => import("@/pages/dashboard/PartnerReviews"));
const EquipmentMarketplace = lazy(() => import("@/pages/dashboard/EquipmentMarketplace"));
const WhiteLabelPortal = lazy(() => import("@/pages/dashboard/WhiteLabelPortal"));
const Omaluna = lazy(() => import("@/pages/dashboard/Omaluna"));
const OmalunaPostJob = lazy(() => import("@/pages/dashboard/OmalunaPostJob"));
const OmalunaWorkerProfile = lazy(() => import("@/pages/dashboard/OmalunaWorkerProfile"));
const OmalunaJobDetails = lazy(() => import("@/pages/dashboard/OmalunaJobDetails"));
const OmalunaMyJobs = lazy(() => import("@/pages/dashboard/OmalunaMyJobs"));
const OmalunaMyApplications = lazy(() => import("@/pages/dashboard/OmalunaMyApplications"));
const OmalunaJobApplications = lazy(() => import("@/pages/dashboard/OmalunaJobApplications"));
const PlatformBrochure = lazy(() => import("@/pages/dashboard/PlatformBrochure"));
const PlatformTermsAndPolicies = lazy(() => import("@/pages/dashboard/PlatformTermsAndPolicies"));
const AdminDocumentStamping = lazy(() => import("@/pages/dashboard/AdminDocumentStamping"));
const VehicleMarketplace = lazy(() => import("@/pages/dashboard/VehicleMarketplace"));
const SmartAgentDashboard = lazy(() => import("@/pages/dashboard/SmartAgentDashboard"));
const PrintCenter = lazy(() => import("@/pages/dashboard/PrintCenter"));
const SigningStatus = lazy(() => import("@/pages/dashboard/SigningStatus"));
const SavedLocationsPage = lazy(() => import("@/pages/SavedLocationsPage"));
const OrganizationAttestation = lazy(() => import("@/pages/dashboard/OrganizationAttestation"));
const AdminAttestations = lazy(() => import("@/pages/dashboard/AdminAttestations"));
const ScopedAccessLinks = lazy(() => import("@/pages/dashboard/ScopedAccessLinks"));
const AdminEntityCensus = lazy(() => import("@/pages/dashboard/AdminEntityCensus"));
const DigitalIdentityCardPage = lazy(() => import("@/pages/dashboard/DigitalIdentityCardPage"));
const MultiSignTemplates = lazy(() => import("@/pages/dashboard/MultiSignTemplates"));
const HRPayroll = lazy(() => import("@/pages/dashboard/hr/HRPayroll"));
const HRPerformance = lazy(() => import("@/pages/dashboard/hr/HRPerformance"));
const HRShifts = lazy(() => import("@/pages/dashboard/hr/HRShifts"));
const HROrgChart = lazy(() => import("@/pages/dashboard/hr/HROrgChart"));
const HREndOfService = lazy(() => import("@/pages/dashboard/hr/HREndOfService"));
const HRSelfService = lazy(() => import("@/pages/dashboard/hr/HRSelfService"));
const CamerasPage = lazy(() => import("@/pages/dashboard/CamerasPage"));
const WaPilotManagement = lazy(() => import("@/pages/dashboard/WaPilotManagement"));
const DocumentCenter = lazy(() => import("@/pages/dashboard/DocumentCenter"));
const DataExport = lazy(() => import("@/pages/dashboard/DataExport"));
const RegulatoryDocuments = lazy(() => import("@/pages/dashboard/RegulatoryDocuments"));
const LawsAndRegulations = lazy(() => import("@/pages/dashboard/LawsAndRegulations"));
const MyDataCenter = lazy(() => import("@/pages/dashboard/MyDataCenter"));
const ExecutiveDashboard = lazy(() => import("@/pages/dashboard/ExecutiveDashboard"));
const RecurringShipments = lazy(() => import("@/pages/dashboard/RecurringShipments"));
const EmployeeTaskBoard = lazy(() => import("@/pages/dashboard/EmployeeTaskBoard"));
const CVBuilder = lazy(() => import("@/pages/dashboard/CVBuilder"));
const AIForecasting = lazy(() => import("@/pages/dashboard/AIForecasting"));
const PreventiveMaintenance = lazy(() => import("@/pages/dashboard/PreventiveMaintenance"));
const SmartJobRecommendations = lazy(() => import("@/pages/dashboard/SmartJobRecommendations"));
const DriverRewards = lazy(() => import("@/pages/dashboard/DriverRewards"));
const ProductionDashboard = lazy(() => import("@/pages/dashboard/ProductionDashboard"));
const B2BMarketplace = lazy(() => import("@/pages/dashboard/B2BMarketplace"));
const RegulatoryViolations = lazy(() => import("@/pages/dashboard/RegulatoryViolations"));
const ConsultantPortal = lazy(() => import("@/pages/dashboard/ConsultantPortal"));
const CapacityManagement = lazy(() => import("@/pages/dashboard/CapacityManagement"));
const GovernanceDashboard = lazy(() => import("@/pages/dashboard/GovernanceDashboard"));
// SmartDocumentArchive and CentralDocumentRegistry now redirect to DocumentCenter
const CyberSecurityCenter = lazy(() => import("@/pages/dashboard/CyberSecurityCenter"));
const VisitorAnalytics = lazy(() => import("@/pages/dashboard/VisitorAnalytics"));
const DigitalMaturityDashboard = lazy(() => import("@/pages/dashboard/DigitalMaturityDashboard"));
const SystemArchitectureGuide = lazy(() => import("@/pages/dashboard/SystemArchitectureGuide"));
const ActionChainsPage = lazy(() => import("@/pages/dashboard/ActionChainsPage"));
const AdminBrandingSettings = lazy(() => import("@/pages/dashboard/AdminBrandingSettings"));
const Quotations = lazy(() => import("@/pages/dashboard/Quotations"));
const PlatformFeaturesDoc = lazy(() => import("@/pages/dashboard/PlatformFeaturesDoc"));
const RestrictionsMonitor = lazy(() => import("@/pages/dashboard/RestrictionsMonitor"));
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * All dashboard routes wrapped inside a single DashboardRouteGuard layout route.
 * This ensures every sub-route is protected (auth + error boundary + suspense)
 * without needing to wrap each one individually.
 */
export const dashboardRoutes = (
  <Route element={<DashboardRouteGuard />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/dashboard/my-workspace" element={<MyWorkspace />} />
    <Route path="/dashboard/digital-identity-card" element={<DigitalIdentityCardPage />} />
    <Route path="/dashboard/print-center" element={<PrintCenter />} />
    <Route path="/dashboard/signing-status" element={<SigningStatus />} />
    <Route path="/dashboard/drivers" element={<Drivers />} />
    <Route path="/dashboard/drivers/:driverId" element={<DriverDetails />} />
    <Route path="/dashboard/company-approvals" element={<CompanyApprovals />} />
    <Route path="/dashboard/company-management" element={<CompanyManagement />} />
    <Route path="/dashboard/driver-approvals" element={<DriverApprovals />} />
    <Route path="/dashboard/shipments" element={<ShipmentManagement />} />
    <Route path="/dashboard/shipments/new" element={<CreateShipment />} />
    <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/s/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/transporter-shipments" element={<TransporterShipments />} />
    <Route path="/dashboard/manual-shipment" element={<ManualShipmentCreate />} />
    <Route path="/dashboard/manual-shipment-drafts" element={<ManualShipmentDrafts />} />
    <Route path="/dashboard/transporter-drivers" element={<TransporterDrivers />} />
    <Route path="/dashboard/driver-tracking" element={<DriverTracking />} />
    <Route path="/dashboard/shipment-routes" element={<ShipmentRoutesMap />} />
    <Route path="/dashboard/tracking-center" element={<TrackingCenter />} />
    <Route path="/dashboard/reports" element={<Reports />} />
    <Route path="/dashboard/carbon-footprint" element={<CarbonFootprintAnalysis />} />
    <Route path="/dashboard/environmental-sustainability" element={<EnvironmentalSustainability />} />
    <Route path="/dashboard/ai-tools" element={<AITools />} />
    <Route path="/dashboard/recycler-ai-tools" element={<RecyclerAITools />} />
    <Route path="/dashboard/transporter-ai-tools" element={<TransporterAITools />} />
    <Route path="/dashboard/notifications" element={<Notifications />} />
    <Route path="/dashboard/organization-profile" element={<OrganizationProfile />} />
    <Route path="/dashboard/organization-attestation" element={<OrganizationAttestation />} />
    <Route path="/dashboard/admin-attestations" element={<AdminAttestations />} />
    <Route path="/dashboard/organization-documents" element={<OrganizationDocuments />} />
    <Route path="/dashboard/system-overview" element={<AdminSystemOverview />} />
    <Route path="/dashboard/admin-revenue" element={<AdminRevenueManagement />} />
    <Route path="/dashboard/c2b-management" element={<C2BManagement />} />
    <Route path="/dashboard/news-manager" element={<NewsManager />} />
    <Route path="/dashboard/blog-manager" element={<BlogManager />} />
    <Route path="/dashboard/testimonials-management" element={<TestimonialsManagement />} />
    <Route path="/dashboard/partners" element={<Partners />} />
    <Route path="/dashboard/employees" element={<Navigate to="/dashboard/org-structure" replace />} />
    <Route path="/dashboard/organization/:organizationId" element={<OrganizationView />} />
    <Route path="/dashboard/aggregate-report" element={<AggregateShipmentReport />} />
    <Route path="/dashboard/non-hazardous-register" element={<NonHazardousWasteRegister />} />
    <Route path="/dashboard/hazardous-register" element={<HazardousWasteRegister />} />
    <Route path="/dashboard/waste-types" element={<WasteTypesClassification />} />
    <Route path="/dashboard/my-requests" element={<MyRequests />} />
    <Route path="/dashboard/driver-offers" element={<DriverOffers />} />
    <Route path="/dashboard/regulatory-updates" element={<RegulatoryUpdates />} />
    <Route path="/dashboard/operational-plans" element={<OperationalPlans />} />
    <Route path="/dashboard/chat" element={<Chat />} />
    <Route path="/dashboard/team-credentials" element={<Navigate to="/dashboard/org-structure" replace />} />
    <Route path="/dashboard/partners-timeline" element={<PartnersTimeline />} />
    <Route path="/dashboard/restrictions-monitor" element={<RestrictionsMonitor />} />
    <Route path="/dashboard/add-organization" element={<AddOrganization />} />
    <Route path="/dashboard/shipment-reports" element={<ShipmentReports />} />
    <Route path="/dashboard/admin-drivers-map" element={<AdminDriversMap />} />
    <Route path="/dashboard/video-generator" element={<VideoGenerator />} />
    <Route path="/dashboard/my-location" element={<MyLocation />} />
    <Route path="/dashboard/recycling-certificates" element={<RecyclingCertificates />} />
    <Route path="/dashboard/issue-recycling-certificates" element={<IssueRecyclingCertificates />} />
    <Route path="/dashboard/settings" element={<Settings />} />
    <Route path="/dashboard/auto-actions" element={<AutoActions />} />
    <Route path="/dashboard/pride-certificates" element={<PrideCertificates />} />
    <Route path="/dashboard/about-platform" element={<AboutPlatform />} />
    <Route path="/dashboard/platform-features" element={<PlatformFeaturesDoc />} />
    <Route path="/dashboard/offline-mode" element={<OfflineMode />} />
    <Route path="/dashboard/reports-guide" element={<ReportsGuide />} />
    <Route path="/dashboard/driver-profile" element={<DriverProfile />} />
    <Route path="/dashboard/driver-data" element={<DriverData />} />
    <Route path="/dashboard/external-records" element={<ExternalRecords />} />
    <Route path="/dashboard/contracts" element={<Contracts />} />
    <Route path="/dashboard/contract-templates" element={<ContractTemplates />} />
    <Route path="/dashboard/verify-contract" element={<ContractVerificationPage />} />
    <Route path="/dashboard/terms-acceptances" element={<TermsAcceptances />} />
    <Route path="/dashboard/partner-accounts" element={<PartnerAccounts />} />
    <Route path="/dashboard/partner-account/:partnerId" element={<PartnerAccountDetails />} />
    <Route path="/dashboard/external-partner/:partnerId" element={<ExternalPartnerDetails />} />
    <Route path="/dashboard/document-verification" element={<DocumentVerification />} />
    <Route path="/dashboard/navigation-demo" element={<NavigationDemo />} />
    <Route path="/dashboard/demo-scenario" element={<DemoScenario />} />
    <Route path="/dashboard/map-explorer" element={<MapExplorer />} />
    <Route path="/dashboard/system-status" element={<SystemStatus />} />
    <Route path="/dashboard/system-commands" element={<SystemCommands />} />
    <Route path="/dashboard/cross-impact" element={<CrossImpactDashboard />} />
    <Route path="/dashboard/support" element={<SupportCenter />} />
    <Route path="/dashboard/api" element={<ApiManagement />} />
    <Route path="/dashboard/security-testing" element={<SecurityPenetrationTesting />} />
    <Route path="/dashboard/db-optimization" element={<DatabaseQueryOptimization />} />
    <Route path="/dashboard/advanced-analytics" element={<AdvancedAnalytics />} />
    <Route path="/dashboard/gdpr-compliance" element={<GDPRCompliance />} />
    <Route path="/dashboard/platform-brochure" element={<PlatformBrochure />} />
    <Route path="/dashboard/platform-terms" element={<PlatformTermsAndPolicies />} />
    <Route path="/dashboard/admin-document-stamping" element={<AdminDocumentStamping />} />
    <Route path="/dashboard/admin-branding" element={<AdminBrandingSettings />} />
    <Route path="/dashboard/saved-locations" element={<SavedLocationsPage />} />
    <Route path="/dashboard/quick-deposit-links" element={<QuickDepositLinks />} />
    <Route path="/dashboard/quick-shipment-links" element={<QuickShipmentLinks />} />
    <Route path="/dashboard/quick-driver-links" element={<QuickDriverLinks />} />
    <Route path="/dashboard/scoped-access-links" element={<ScopedAccessLinks />} />
    <Route path="/dashboard/transporter-receipts" element={<TransporterReceipts />} />
    <Route path="/dashboard/waze-live-map" element={<WazeLiveMap />} />
    <Route path="/dashboard/create-receipt" element={<CreateReceipt />} />
    <Route path="/dashboard/generator-receipts" element={<GeneratorReceipts />} />
    <Route path="/dashboard/guilloche-patterns" element={<GuillochePatterns />} />
    <Route path="/dashboard/delivery-declarations" element={<DeliveryDeclarations />} />
    <Route path="/dashboard/rejected-shipments" element={<RejectedShipments />} />
    <Route path="/dashboard/smart-insights" element={<SmartInsights />} />
    <Route path="/dashboard/wood-market" element={<WoodMarketIntelligence />} />
    <Route path="/dashboard/award-letters" element={<AwardLetters />} />
    <Route path="/dashboard/operations" element={<OperationsDashboard />} />
    <Route path="/dashboard/activity-log" element={<ActivityLogPage />} />
    <Route path="/dashboard/gps-settings" element={<GPSSettings />} />
    <Route path="/dashboard/meetings" element={<Meetings />} />
    <Route path="/dashboard/disposal-facilities" element={<DisposalFacilities />} />
    <Route path="/dashboard/disposal" element={<DisposalDashboard />} />
    <Route path="/dashboard/disposal/operations" element={<DisposalOperations />} />
    <Route path="/dashboard/disposal/operations/new" element={<NewDisposalOperation />} />
    <Route path="/dashboard/disposal/incoming-requests" element={<DisposalIncomingRequests />} />
    <Route path="/dashboard/disposal/certificates" element={<DisposalCertificates />} />
    <Route path="/dashboard/disposal/certificates/new" element={<DisposalCertificates />} />
    <Route path="/dashboard/disposal/reports" element={<DisposalReports />} />
    <Route path="/dashboard/disposal/mission-control" element={<DisposalMissionControl />} />
    <Route path="/dashboard/gamification" element={<Gamification />} />
    <Route path="/dashboard/stories" element={<Stories />} />
    <Route path="/dashboard/org-structure" element={<OrgStructure />} />
    <Route path="/dashboard/iot-settings" element={<IoTSettings />} />
    <Route path="/dashboard/e-invoice" element={<EInvoice />} />
    <Route path="/dashboard/customer-portal" element={<CustomerPortal />} />
    <Route path="/dashboard/onboarding-review" element={<OnboardingReview />} />
    <Route path="/dashboard/erp/accounting" element={<ERPAccounting />} />
    <Route path="/dashboard/erp/inventory" element={<ERPInventory />} />
    <Route path="/dashboard/erp/hr" element={<ERPHR />} />
    <Route path="/dashboard/erp/purchasing-sales" element={<ERPPurchasingAndSales />} />
    <Route path="/dashboard/erp/financial-dashboard" element={<ERPFinancialDashboard />} />
    <Route path="/dashboard/erp/revenue-expenses" element={<ERPRevenueExpensesAnalysis />} />
    <Route path="/dashboard/erp/cogs" element={<ERPCogs />} />
    <Route path="/dashboard/erp/financial-comparisons" element={<ERPFinancialComparisons />} />
    <Route path="/dashboard/subscription" element={<SubscriptionManagement />} />
    <Route path="/dashboard/document-archive" element={<DocumentArchive />} />
    <Route path="/dashboard/manual-operations" element={<ManualOperations />} />
    <Route path="/dashboard/quick-weight" element={<QuickWeightEntry />} />
    <Route path="/dashboard/bulk-weight-entries" element={<BulkWeightEntries />} />
    <Route path="/dashboard/system-screenshots" element={<SystemScreenshots />} />
    <Route path="/dashboard/homepage-manager" element={<AdminHomepageManager />} />
    <Route path="/dashboard/wapilot" element={<WaPilotManagement />} />
    <Route path="/dashboard/commodity-exchange" element={<GlobalCommodityExchange />} />
    <Route path="/dashboard/waste-exchange" element={<WasteExchange />} />
    <Route path="/dashboard/waste-flow-heatmap" element={<WasteFlowHeatmap />} />
    <Route path="/dashboard/esg-reports" element={<ESGReports />} />
    <Route path="/dashboard/driver-permits" element={<DriverPermits />} />
    <Route path="/dashboard/learning-center" element={<LearningCenter />} />
    <Route path="/dashboard/user-guide" element={<UserGuidePage />} />
    <Route path="/dashboard/detailed-waste-analysis" element={<DetailedWasteAnalysis />} />
    <Route path="/dashboard/authorized-signatories" element={<AuthorizedSignatories />} />
    <Route path="/dashboard/permits" element={<Permits />} />
    <Route path="/dashboard/environmental-consultants" element={<EnvironmentalConsultants />} />
    <Route path="/dashboard/signing-inbox" element={<SigningInbox />} />
    <Route path="/dashboard/notes" element={<AllNotes />} />
    <Route path="/dashboard/regulator" element={<RegulatorDashboard />} />
    <Route path="/dashboard/regulator-wmra" element={<RegulatorWMRA />} />
    <Route path="/dashboard/regulator-eeaa" element={<RegulatorEEAA />} />
    <Route path="/dashboard/regulator-ltra" element={<RegulatorLTRA />} />
    <Route path="/dashboard/regulator-ida" element={<RegulatorIDA />} />
    <Route path="/dashboard/regulated-companies" element={<RegulatedCompanies />} />
    <Route path="/dashboard/collection-requests" element={<CollectionRequests />} />
    <Route path="/dashboard/smart-insurance" element={<SmartInsurance />} />
    <Route path="/dashboard/futures-market" element={<FuturesMarket />} />
    <Route path="/dashboard/digital-wallet" element={<DigitalWallet />} />
    <Route path="/dashboard/driver-academy" element={<DriverAcademy />} />
    <Route path="/dashboard/ohs-reports" element={<OHSReports />} />
    {/* Alias: sidebar links to /dashboard/safety → reuse OHSReports */}
    <Route path="/dashboard/safety" element={<OHSReports />} />
    <Route path="/dashboard/circular-economy" element={<CircularEconomy />} />
    <Route path="/dashboard/my-ads" element={<AdvertiserDashboard />} />
    <Route path="/dashboard/ad-plans" element={<AdPlans />} />
    <Route path="/dashboard/stationery" element={<StationeryTemplates />} />
    <Route path="/dashboard/stationery-plans" element={<StationeryPlans />} />
    <Route path="/dashboard/waste-auctions" element={<WasteAuctions />} />
    <Route path="/dashboard/partner-reviews" element={<PartnerReviews />} />
    <Route path="/dashboard/equipment-marketplace" element={<EquipmentMarketplace />} />
    <Route path="/dashboard/white-label-portal" element={<WhiteLabelPortal />} />
    <Route path="/dashboard/omaluna" element={<Omaluna />} />
    <Route path="/dashboard/omaluna/post-job" element={<OmalunaPostJob />} />
    <Route path="/dashboard/omaluna/my-profile" element={<OmalunaWorkerProfile />} />
    <Route path="/dashboard/omaluna/job/:jobId" element={<OmalunaJobDetails />} />
    <Route path="/dashboard/omaluna/my-jobs" element={<OmalunaMyJobs />} />
    <Route path="/dashboard/omaluna/my-applications" element={<OmalunaMyApplications />} />
    <Route path="/dashboard/omaluna/job/:jobId/applications" element={<OmalunaJobApplications />} />
    <Route path="/dashboard/vehicle-marketplace" element={<VehicleMarketplace />} />
    <Route path="/dashboard/smart-agent" element={<SmartAgentDashboard />} />
    <Route path="/dashboard/entity-census" element={<AdminEntityCensus />} />
    <Route path="/dashboard/multi-sign-templates" element={<MultiSignTemplates />} />
    <Route path="/dashboard/hr/payroll" element={<HRPayroll />} />
    <Route path="/dashboard/hr/performance" element={<HRPerformance />} />
    <Route path="/dashboard/hr/shifts" element={<HRShifts />} />
    <Route path="/dashboard/hr/org-chart" element={<HROrgChart />} />
    <Route path="/dashboard/hr/end-of-service" element={<HREndOfService />} />
    <Route path="/dashboard/hr/self-service" element={<HRSelfService />} />
    <Route path="/dashboard/cameras" element={<CamerasPage />} />
    <Route path="/dashboard/document-center" element={<DocumentCenter />} />
    <Route path="/dashboard/data-export" element={<DataExport />} />
    <Route path="/dashboard/regulatory-documents" element={<RegulatoryDocuments />} />
    <Route path="/dashboard/laws-regulations" element={<LawsAndRegulations />} />
    <Route path="/dashboard/my-data" element={<MyDataCenter />} />
    <Route path="/dashboard/executive" element={<ExecutiveDashboard />} />
    <Route path="/dashboard/recurring-shipments" element={<RecurringShipments />} />
    <Route path="/dashboard/task-board" element={<EmployeeTaskBoard />} />
    <Route path="/dashboard/cv-builder" element={<CVBuilder />} />
    <Route path="/dashboard/ai-forecasting" element={<AIForecasting />} />
    <Route path="/dashboard/preventive-maintenance" element={<PreventiveMaintenance />} />
    <Route path="/dashboard/smart-job-recommendations" element={<SmartJobRecommendations />} />
    <Route path="/dashboard/driver-rewards" element={<DriverRewards />} />
    <Route path="/dashboard/production" element={<ProductionDashboard />} />
    <Route path="/dashboard/quotations" element={<Quotations />} />
    <Route path="/dashboard/b2b-marketplace" element={<B2BMarketplace />} />
    <Route path="/dashboard/regulatory-violations" element={<RegulatoryViolations />} />
    <Route path="/dashboard/consultant-portal" element={<ConsultantPortal />} />
    <Route path="/dashboard/capacity-management" element={<CapacityManagement />} />
    <Route path="/dashboard/governance" element={<GovernanceDashboard />} />
    <Route path="/dashboard/smart-archive" element={<Navigate to="/dashboard/document-center?tab=smart-archive" replace />} />
    <Route path="/dashboard/cyber-security" element={<CyberSecurityCenter />} />
    <Route path="/dashboard/visitor-analytics" element={<VisitorAnalytics />} />
    <Route path="/dashboard/central-registry" element={<Navigate to="/dashboard/document-center?tab=registry" replace />} />
    <Route path="/dashboard/digital-maturity" element={<DigitalMaturityDashboard />} />
    <Route path="/dashboard/architecture-guide" element={<SystemArchitectureGuide />} />
    <Route path="/dashboard/action-chains" element={<ActionChainsPage />} />
    {/* Ghost sidebar aliases — consultant/office paths that reuse existing pages */}
    <Route path="/dashboard/audit-sessions" element={<ConsultantPortal />} />
    <Route path="/dashboard/consultant-reports" element={<Reports />} />
    <Route path="/dashboard/compliance-assessment" element={<ConsultantPortal />} />
    <Route path="/dashboard/consultant-clients" element={<Partners />} />
    <Route path="/dashboard/consultant-certifications" element={<RecyclingCertificates />} />
    <Route path="/dashboard/office-consultants" element={<OrgStructure />} />
    <Route path="/dashboard/office-tasks" element={<EmployeeTaskBoard />} />
    <Route path="/dashboard/office-performance" element={<AdvancedAnalytics />} />
    {/* Admin alias routes */}
    <Route path="/dashboard/admin-cyber-security" element={<CyberSecurityCenter />} />
    <Route path="/dashboard/call-center" element={<SupportCenter />} />
    <Route path="/dashboard/ai-document-studio" element={<AIDocumentStudioPage />} />
    {/* Catch-all: show 404 instead of silently falling back to Dashboard */}
    <Route path="/dashboard/*" element={<NotFound />} />
  </Route>
);
