import { Suspense, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FocusMusicProvider } from "@/contexts/FocusMusicContext";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";

// Offline & Performance components
const OfflineIndicator = lazy(() => import("./components/offline/OfflineIndicator"));
const OfflineBanner = lazy(() => import("./components/offline/OfflineBanner"));
const ScrollToTopButton = lazy(() => import("./components/ui/ScrollToTopButton"));
const MobileOptimizations = lazy(() => import("./components/mobile/MobileOptimizations"));
const PWAShortcuts = lazy(() => import("./components/mobile/PWAShortcuts"));
const TouchOptimizations = lazy(() => import("./components/mobile/TouchOptimizations"));

// Minimal loading component - optimized for speed
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = 'PageLoader';

// Eagerly loaded pages (critical path only)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import GoogleSetup from "./pages/GoogleSetup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - Dashboard (with prefetch hints)
const Drivers = lazy(() => import("./pages/Drivers"));
const DriverDetails = lazy(() => import("./pages/DriverDetails"));
const CompanyApprovals = lazy(() => import("./pages/dashboard/CompanyApprovals"));
const CompanyManagement = lazy(() => import("./pages/dashboard/CompanyManagement"));
const DriverApprovals = lazy(() => import("./pages/dashboard/DriverApprovals"));
const ShipmentManagement = lazy(() => import("./pages/dashboard/ShipmentManagement"));
const DriverTracking = lazy(() => import("./pages/dashboard/DriverTracking"));
const Reports = lazy(() => import("./pages/dashboard/Reports"));
const CarbonFootprintAnalysis = lazy(() => import("./pages/dashboard/CarbonFootprintAnalysis"));
const EnvironmentalSustainability = lazy(() => import("./pages/dashboard/EnvironmentalSustainability"));
const CreateShipment = lazy(() => import("./pages/dashboard/CreateShipment"));
const ShipmentDetails = lazy(() => import("./pages/dashboard/ShipmentDetails"));
const TransporterShipments = lazy(() => import("./pages/dashboard/TransporterShipments"));
const TransporterDrivers = lazy(() => import("./pages/dashboard/TransporterDrivers"));
const AITools = lazy(() => import("./pages/dashboard/AITools"));
const RecyclerAITools = lazy(() => import("./pages/dashboard/RecyclerAITools"));
const TransporterAITools = lazy(() => import("./pages/dashboard/TransporterAITools"));
const Notifications = lazy(() => import("./pages/dashboard/Notifications"));
const OrganizationProfile = lazy(() => import("./pages/dashboard/OrganizationProfile"));
const OrganizationDocuments = lazy(() => import("./pages/dashboard/OrganizationDocuments"));
const AdminSystemOverview = lazy(() => import("./pages/dashboard/AdminSystemOverview"));
const Partners = lazy(() => import("./pages/dashboard/Partners"));
const EmployeeManagement = lazy(() => import("./pages/dashboard/EmployeeManagement"));
const OrganizationView = lazy(() => import("./pages/dashboard/OrganizationView"));
const AggregateShipmentReport = lazy(() => import("./pages/dashboard/AggregateShipmentReport"));
const NonHazardousWasteRegister = lazy(() => import("./pages/dashboard/NonHazardousWasteRegister"));
const HazardousWasteRegister = lazy(() => import("./pages/dashboard/HazardousWasteRegister"));
const WasteTypesClassification = lazy(() => import("./pages/dashboard/WasteTypesClassification"));
const MyRequests = lazy(() => import("./pages/dashboard/MyRequests"));
const RegulatoryUpdates = lazy(() => import("./pages/dashboard/RegulatoryUpdates"));
const OperationalPlans = lazy(() => import("./pages/dashboard/OperationalPlans"));
const Chat = lazy(() => import("./pages/dashboard/Chat"));
const TeamCredentials = lazy(() => import("./pages/dashboard/TeamCredentials"));
const PartnersTimeline = lazy(() => import("./pages/dashboard/PartnersTimeline"));
const AddOrganization = lazy(() => import("./pages/dashboard/AddOrganization"));
const ShipmentReports = lazy(() => import("./pages/dashboard/ShipmentReports"));
const AdminDriversMap = lazy(() => import("./pages/dashboard/AdminDriversMap"));
const VideoGenerator = lazy(() => import("./pages/dashboard/VideoGenerator"));
const WoodMarketIntelligence = lazy(() => import("./pages/dashboard/WoodMarketIntelligence"));
const OrgStructure = lazy(() => import("./pages/dashboard/OrgStructure"));
const MyLocation = lazy(() => import("./pages/dashboard/MyLocation"));
const RecyclingCertificates = lazy(() => import("./pages/dashboard/RecyclingCertificates"));
const IssueRecyclingCertificates = lazy(() => import("./pages/dashboard/IssueRecyclingCertificates"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const PrideCertificates = lazy(() => import("./pages/dashboard/PrideCertificates"));
const ReportsGuide = lazy(() => import("./pages/dashboard/ReportsGuide"));
const AboutPlatform = lazy(() => import("./pages/dashboard/AboutPlatform"));
const OfflineMode = lazy(() => import("./pages/dashboard/OfflineMode"));
const DriverProfile = lazy(() => import("./pages/dashboard/DriverProfile"));
const DriverData = lazy(() => import("./pages/dashboard/DriverData"));
const ExternalRecords = lazy(() => import("./pages/dashboard/ExternalRecords"));
const Contracts = lazy(() => import("./pages/dashboard/Contracts"));
const ContractTemplates = lazy(() => import("./pages/dashboard/ContractTemplates"));
const ContractVerificationPage = lazy(() => import("./components/contracts/ContractVerificationPage"));
const TermsAcceptances = lazy(() => import("./pages/dashboard/TermsAcceptances"));
const PartnerAccounts = lazy(() => import("./pages/dashboard/PartnerAccounts"));
const PartnerAccountDetails = lazy(() => import("./pages/dashboard/PartnerAccountDetails"));
const ExternalPartnerDetails = lazy(() => import("./pages/dashboard/ExternalPartnerDetails"));
const DocumentVerification = lazy(() => import("./pages/dashboard/DocumentVerification"));
const Verify = lazy(() => import("./pages/Verify"));
const QRVerify = lazy(() => import("./pages/QRVerify"));
const NavigationDemo = lazy(() => import("./pages/dashboard/NavigationDemo"));
const DemoScenario = lazy(() => import("./pages/dashboard/DemoScenario"));
const MapExplorer = lazy(() => import("./pages/dashboard/MapExplorer"));
const SystemStatus = lazy(() => import("./pages/dashboard/SystemStatus"));
const SupportCenter = lazy(() => import("./pages/dashboard/SupportCenter"));
const SubscriptionManagement = lazy(() => import("./pages/dashboard/SubscriptionManagement"));
const ApiManagement = lazy(() => import("./pages/dashboard/ApiManagement"));
const SecurityPenetrationTesting = lazy(() => import("./pages/dashboard/SecurityPenetrationTesting"));
const DatabaseQueryOptimization = lazy(() => import("./pages/dashboard/DatabaseQueryOptimization"));
const AdvancedAnalytics = lazy(() => import("./pages/dashboard/AdvancedAnalytics"));
const GDPRCompliance = lazy(() => import("./pages/dashboard/GDPRCompliance"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const SavedLocationsPage = lazy(() => import("./pages/SavedLocationsPage"));
const QuickDeposit = lazy(() => import("./pages/QuickDeposit"));
const QuickShipment = lazy(() => import("./pages/QuickShipment"));
const QuickDriver = lazy(() => import("./pages/QuickDriver"));
const QuickDriverLinks = lazy(() => import("./pages/dashboard/QuickDriverLinks"));
const QuickDepositLinks = lazy(() => import("./pages/dashboard/QuickDepositLinks"));
const QuickShipmentLinks = lazy(() => import("./pages/dashboard/QuickShipmentLinks"));
const TransporterReceipts = lazy(() => import("./pages/dashboard/TransporterReceipts"));
const GeneratorReceipts = lazy(() => import("./pages/dashboard/GeneratorReceipts"));
const CreateReceipt = lazy(() => import("./pages/dashboard/CreateReceipt"));
const GuillochePatterns = lazy(() => import("./pages/dashboard/GuillochePatterns"));
const SmartInsights = lazy(() => import("./pages/dashboard/SmartInsights"));
const AwardLetters = lazy(() => import("./pages/dashboard/AwardLetters"));
const OperationsDashboard = lazy(() => import("./pages/dashboard/OperationsDashboard"));
const ActivityLogPage = lazy(() => import("./pages/dashboard/ActivityLogPage"));
const GPSSettings = lazy(() => import("./pages/dashboard/GPSSettings"));
const DisposalFacilities = lazy(() => import("./pages/dashboard/DisposalFacilities"));
const DisposalDashboard = lazy(() => import("./pages/dashboard/disposal/DisposalDashboard"));
const DisposalOperations = lazy(() => import("./pages/dashboard/disposal/DisposalOperations"));
const NewDisposalOperation = lazy(() => import("./pages/dashboard/disposal/NewDisposalOperation"));
const DisposalIncomingRequests = lazy(() => import("./pages/dashboard/disposal/DisposalIncomingRequests"));
const DisposalCertificates = lazy(() => import("./pages/dashboard/disposal/DisposalCertificates"));
const DisposalReports = lazy(() => import("./pages/dashboard/disposal/DisposalReports"));
const DisposalMissionControl = lazy(() => import("./pages/dashboard/disposal/DisposalMissionControl"));
const Gamification = lazy(() => import("./pages/dashboard/Gamification"));
const IoTSettings = lazy(() => import("./pages/dashboard/IoTSettings"));
const EInvoice = lazy(() => import("./pages/dashboard/EInvoice"));
const CustomerPortal = lazy(() => import("./pages/dashboard/CustomerPortal"));
const OnboardingReview = lazy(() => import("./pages/dashboard/OnboardingReview"));
const Stories = lazy(() => import("./pages/dashboard/Stories"));
const DeliveryDeclarations = lazy(() => import("./pages/dashboard/DeliveryDeclarations"));
const RejectedShipments = lazy(() => import("./pages/dashboard/RejectedShipments"));
const ERPAccounting = lazy(() => import("./pages/dashboard/erp/ERPAccounting"));
const ERPInventory = lazy(() => import("./pages/dashboard/erp/ERPInventory"));
const ERPHR = lazy(() => import("./pages/dashboard/erp/ERPHR"));
const ERPPurchasingAndSales = lazy(() => import("./pages/dashboard/erp/ERPPurchasingAndSales"));
const ERPFinancialDashboard = lazy(() => import("./pages/dashboard/erp/ERPFinancialDashboard"));
const ERPRevenueExpensesAnalysis = lazy(() => import("./pages/dashboard/erp/ERPRevenueExpensesAnalysis"));
const ERPCogs = lazy(() => import("./pages/dashboard/erp/ERPCogs"));
const ERPFinancialComparisons = lazy(() => import("./pages/dashboard/erp/ERPFinancialComparisons"));
const DocumentArchive = lazy(() => import("./pages/dashboard/DocumentArchive"));
const GlobalCommodityExchange = lazy(() => import("./pages/dashboard/GlobalCommodityExchange"));
const WasteExchange = lazy(() => import("./pages/dashboard/WasteExchange"));
const DetailedWasteAnalysis = lazy(() => import("./pages/dashboard/DetailedWasteAnalysis"));
const WasteFlowHeatmap = lazy(() => import("./pages/dashboard/WasteFlowHeatmap"));
const ESGReports = lazy(() => import("./pages/dashboard/ESGReports"));
const DriverPermits = lazy(() => import("./pages/dashboard/DriverPermits"));
const LearningCenter = lazy(() => import("./pages/dashboard/LearningCenter"));
const UserGuidePage = lazy(() => import("./pages/dashboard/UserGuidePage"));
const AuthorizedSignatories = lazy(() => import("./pages/dashboard/AuthorizedSignatories"));
const VerifySignatory = lazy(() => import("./pages/VerifySignatory"));
const Permits = lazy(() => import("./pages/dashboard/Permits"));
const EnvironmentalConsultants = lazy(() => import("./pages/dashboard/EnvironmentalConsultants"));
const SigningInbox = lazy(() => import("./pages/dashboard/SigningInbox"));

const GeneratorGuide = lazy(() => import("./pages/guide/GeneratorGuide"));
const TransporterGuide = lazy(() => import("./pages/guide/TransporterGuide"));
const RecyclerGuide = lazy(() => import("./pages/guide/RecyclerGuide"));
const DriverGuide = lazy(() => import("./pages/guide/DriverGuide"));
const AdminGuide = lazy(() => import("./pages/guide/AdminGuide"));

// Lazy loaded heavy components (deferred) with retry on failure
const lazyRetry = (importFn: () => Promise<any>, retries = 2): Promise<any> =>
  importFn().catch((err: any) => {
    if (retries > 0) {
      return new Promise(resolve => setTimeout(resolve, 1000)).then(() => lazyRetry(importFn, retries - 1));
    }
    console.error('Failed to load module after retries:', err);
    return { default: () => null };
  });

const AIChatbot = lazy(() => lazyRetry(() => import("./components/ai/AIChatbot")));
const EnhancedChatWidget = lazy(() => lazyRetry(() => import("./components/chat/EnhancedChatWidget")));
const UnifiedSupportWidget = lazy(() => lazyRetry(() => import("./components/ai/UnifiedSupportWidget")));
const BetaBanner = lazy(() => lazyRetry(() => import("./components/BetaBanner")));
const AccessibilityPanel = lazy(() => lazyRetry(() => import("./components/accessibility/AccessibilityPanel").then(m => ({ default: m.AccessibilityPanel }))));
const UnifiedFloatingMenu = lazy(() => lazyRetry(() => import("./components/layout/UnifiedFloatingMenu")));
// Smart QueryClient with adaptive caching per data category
import { createSmartQueryClient } from '@/lib/queryCacheConfig';
const queryClient = createSmartQueryClient();

// Memoized providers wrapper for performance
const Providers = memo(() => (
  <QueryClientProvider client={queryClient}>
    <GoogleMapsProvider>
      <ThemeSettingsProvider>
        <LanguageProvider>
          <FocusMusicProvider>
            <TooltipProvider delayDuration={300}>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                  <Suspense fallback={null}>
                    <AIChatbot />
                    <EnhancedChatWidget />
                    <UnifiedSupportWidget />
                    <UnifiedFloatingMenu />
                    <BetaBanner />
                    <AccessibilityPanel />
                    <OfflineBanner />
                    <ScrollToTopButton />
                  </Suspense>
                  <Suspense fallback={null}>
                    <MobileOptimizations>{null}</MobileOptimizations>
                    <PWAShortcuts />
                    <TouchOptimizations />
                  </Suspense>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </FocusMusicProvider>
        </LanguageProvider>
      </ThemeSettingsProvider>
    </GoogleMapsProvider>
  </QueryClientProvider>
));
Providers.displayName = 'Providers';

// Route configuration for cleaner code
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/deposit/:token" element={<QuickDeposit />} />
    <Route path="/shipment/:token" element={<QuickShipment />} />
    <Route path="/driver/:token" element={<QuickDriver />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/qr-verify" element={<QRVerify />} />
    <Route path="/scan" element={<QRVerify />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/google-setup" element={<GoogleSetup />} />
    {/* Guide Routes */}
    <Route path="/guide/generator" element={<GeneratorGuide />} />
    <Route path="/guide/transporter" element={<TransporterGuide />} />
    <Route path="/guide/recycler" element={<RecyclerGuide />} />
    <Route path="/guide/driver" element={<DriverGuide />} />
    <Route path="/guide/admin" element={<AdminGuide />} />
    <Route path="/dashboard" element={<Dashboard />} />
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
    <Route path="/dashboard/transporter-drivers" element={<TransporterDrivers />} />
    <Route path="/dashboard/driver-tracking" element={<DriverTracking />} />
    <Route path="/dashboard/reports" element={<Reports />} />
    <Route path="/dashboard/carbon-footprint" element={<CarbonFootprintAnalysis />} />
    <Route path="/dashboard/environmental-sustainability" element={<EnvironmentalSustainability />} />
    <Route path="/dashboard/ai-tools" element={<AITools />} />
    <Route path="/dashboard/recycler-ai-tools" element={<RecyclerAITools />} />
    <Route path="/dashboard/transporter-ai-tools" element={<TransporterAITools />} />
    <Route path="/dashboard/notifications" element={<Notifications />} />
    <Route path="/dashboard/organization-profile" element={<OrganizationProfile />} />
    <Route path="/dashboard/organization-documents" element={<OrganizationDocuments />} />
    <Route path="/dashboard/system-overview" element={<AdminSystemOverview />} />
    <Route path="/dashboard/partners" element={<Partners />} />
    <Route path="/dashboard/employees" element={<EmployeeManagement />} />
    <Route path="/dashboard/organization/:organizationId" element={<OrganizationView />} />
    <Route path="/dashboard/aggregate-report" element={<AggregateShipmentReport />} />
    <Route path="/dashboard/non-hazardous-register" element={<NonHazardousWasteRegister />} />
    <Route path="/dashboard/hazardous-register" element={<HazardousWasteRegister />} />
    <Route path="/dashboard/waste-types" element={<WasteTypesClassification />} />
    <Route path="/dashboard/my-requests" element={<MyRequests />} />
    <Route path="/dashboard/regulatory-updates" element={<RegulatoryUpdates />} />
    <Route path="/dashboard/operational-plans" element={<OperationalPlans />} />
    <Route path="/dashboard/chat" element={<Chat />} />
    <Route path="/dashboard/team-credentials" element={<TeamCredentials />} />
    <Route path="/dashboard/partners-timeline" element={<PartnersTimeline />} />
    <Route path="/dashboard/add-organization" element={<AddOrganization />} />
    <Route path="/dashboard/shipment-reports" element={<ShipmentReports />} />
    <Route path="/dashboard/admin-drivers-map" element={<AdminDriversMap />} />
    <Route path="/dashboard/video-generator" element={<VideoGenerator />} />
    <Route path="/dashboard/my-location" element={<MyLocation />} />
    <Route path="/dashboard/recycling-certificates" element={<RecyclingCertificates />} />
    <Route path="/dashboard/issue-recycling-certificates" element={<IssueRecyclingCertificates />} />
     <Route path="/dashboard/settings" element={<Settings />} />
     <Route path="/dashboard/pride-certificates" element={<PrideCertificates />} />
    <Route path="/dashboard/about-platform" element={<AboutPlatform />} />
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
        <Route path="/dashboard/support" element={<SupportCenter />} />
        <Route path="/dashboard/api" element={<ApiManagement />} />
        <Route path="/dashboard/security-testing" element={<SecurityPenetrationTesting />} />
        <Route path="/dashboard/db-optimization" element={<DatabaseQueryOptimization />} />
        <Route path="/dashboard/advanced-analytics" element={<AdvancedAnalytics />} />
        <Route path="/dashboard/gdpr-compliance" element={<GDPRCompliance />} />
        <Route path="/dashboard/saved-locations" element={<SavedLocationsPage />} />
        <Route path="/dashboard/quick-deposit-links" element={<QuickDepositLinks />} />
        <Route path="/dashboard/quick-shipment-links" element={<QuickShipmentLinks />} />
        <Route path="/dashboard/quick-driver-links" element={<QuickDriverLinks />} />
        <Route path="/dashboard/transporter-receipts" element={<TransporterReceipts />} />
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
         <Route path="/verify-signatory/:code" element={<VerifySignatory />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
));
AppRoutes.displayName = 'AppRoutes';

const App = memo(() => (
  <Providers />
));
App.displayName = 'App';

export default App;
