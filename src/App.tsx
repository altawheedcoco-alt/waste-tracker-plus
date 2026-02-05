import { Suspense, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { FocusMusicProvider } from "@/contexts/FocusMusicContext";

// Offline & Performance components
const OfflineIndicator = lazy(() => import("./components/offline/OfflineIndicator"));
const OfflineBanner = lazy(() => import("./components/offline/OfflineBanner"));
const PerformanceOptimizer = lazy(() => import("./components/performance/PerformanceOptimizer"));

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
const MyLocation = lazy(() => import("./pages/dashboard/MyLocation"));
const RecyclingCertificates = lazy(() => import("./pages/dashboard/RecyclingCertificates"));
const IssueRecyclingCertificates = lazy(() => import("./pages/dashboard/IssueRecyclingCertificates"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const ReportsGuide = lazy(() => import("./pages/dashboard/ReportsGuide"));
const AboutPlatform = lazy(() => import("./pages/dashboard/AboutPlatform"));
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
const NavigationDemo = lazy(() => import("./pages/dashboard/NavigationDemo"));
const MapExplorer = lazy(() => import("./pages/dashboard/MapExplorer"));
const SystemStatus = lazy(() => import("./pages/dashboard/SystemStatus"));
const SupportCenter = lazy(() => import("./pages/dashboard/SupportCenter"));
const ApiManagement = lazy(() => import("./pages/dashboard/ApiManagement"));
const AdvancedAnalytics = lazy(() => import("./pages/dashboard/AdvancedAnalytics"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const SavedLocationsPage = lazy(() => import("./pages/SavedLocationsPage"));
const QuickDeposit = lazy(() => import("./pages/QuickDeposit"));
const QuickShipment = lazy(() => import("./pages/QuickShipment"));
const QuickDepositLinks = lazy(() => import("./pages/dashboard/QuickDepositLinks"));
const QuickShipmentLinks = lazy(() => import("./pages/dashboard/QuickShipmentLinks"));

// Guide pages
const GeneratorGuide = lazy(() => import("./pages/guide/GeneratorGuide"));
const TransporterGuide = lazy(() => import("./pages/guide/TransporterGuide"));
const RecyclerGuide = lazy(() => import("./pages/guide/RecyclerGuide"));
const DriverGuide = lazy(() => import("./pages/guide/DriverGuide"));
const AdminGuide = lazy(() => import("./pages/guide/AdminGuide"));

// Lazy loaded heavy components (deferred)
const AIChatbot = lazy(() => import("./components/ai/AIChatbot"));
const ChatWidget = lazy(() => import("./components/chat/ChatWidget"));
const BetaBanner = lazy(() => import("./components/BetaBanner"));
const AccessibilityPanel = lazy(() => import("./components/accessibility/AccessibilityPanel").then(m => ({ default: m.AccessibilityPanel })));

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - longer cache
      gcTime: 1000 * 60 * 60, // 1 hour garbage collection
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Memoized providers wrapper for performance
const Providers = memo(({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeSettingsProvider>
      <FocusMusicProvider>
        <TooltipProvider delayDuration={300}>
          <AuthProvider>
            <Toaster />
            <Sonner />
            {children}
          </AuthProvider>
        </TooltipProvider>
      </FocusMusicProvider>
    </ThemeSettingsProvider>
  </QueryClientProvider>
));
Providers.displayName = 'Providers';

// Route configuration for cleaner code
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/deposit/:token" element={<QuickDeposit />} />
    <Route path="/shipment/:token" element={<QuickShipment />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/auth" element={<Auth />} />
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
    <Route path="/dashboard/about-platform" element={<AboutPlatform />} />
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
        <Route path="/dashboard/map-explorer" element={<MapExplorer />} />
        <Route path="/dashboard/system-status" element={<SystemStatus />} />
        <Route path="/dashboard/support" element={<SupportCenter />} />
        <Route path="/dashboard/api" element={<ApiManagement />} />
        <Route path="/dashboard/advanced-analytics" element={<AdvancedAnalytics />} />
        <Route path="/dashboard/saved-locations" element={<SavedLocationsPage />} />
        <Route path="/dashboard/quick-deposit-links" element={<QuickDepositLinks />} />
        <Route path="/dashboard/quick-shipment-links" element={<QuickShipmentLinks />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
));
AppRoutes.displayName = 'AppRoutes';

// Main App with optimized structure
const App = memo(() => (
  <Providers>
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
      <Suspense fallback={null}>
        <AIChatbot />
        <ChatWidget />
        <BetaBanner />
        <AccessibilityPanel />
        
        <OfflineBanner />
      </Suspense>
      <Suspense fallback={null}>
        <PerformanceOptimizer>{null}</PerformanceOptimizer>
      </Suspense>
    </BrowserRouter>
  </Providers>
));
App.displayName = 'App';

export default App;
