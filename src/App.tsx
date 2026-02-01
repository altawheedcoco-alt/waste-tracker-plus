import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { FocusMusicProvider } from "@/contexts/FocusMusicContext";

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">جاري التحميل...</p>
    </div>
  </div>
);

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - Dashboard
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
const Verify = lazy(() => import("./pages/Verify"));

// Lazy loaded components
const AIChatbot = lazy(() => import("./components/ai/AIChatbot"));
const ChatWidget = lazy(() => import("./components/chat/ChatWidget"));
const BetaBanner = lazy(() => import("./components/BetaBanner"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (garbage collection time)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeSettingsProvider>
      <FocusMusicProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/drivers" element={<Drivers />} />
                  <Route path="/dashboard/drivers/:driverId" element={<DriverDetails />} />
                  <Route path="/dashboard/company-approvals" element={<CompanyApprovals />} />
                  <Route path="/dashboard/company-management" element={<CompanyManagement />} />
                  <Route path="/dashboard/driver-approvals" element={<DriverApprovals />} />
                  <Route path="/dashboard/shipments" element={<ShipmentManagement />} />
                  <Route path="/dashboard/shipments/new" element={<CreateShipment />} />
                  <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
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
                  <Route path="/dashboard/*" element={<Dashboard />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Suspense fallback={null}>
                <AIChatbot />
                <ChatWidget />
                <BetaBanner />
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </FocusMusicProvider>
    </ThemeSettingsProvider>
  </QueryClientProvider>
);

export default App;
