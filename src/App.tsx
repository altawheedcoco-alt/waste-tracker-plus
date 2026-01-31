import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { FocusMusicProvider } from "@/contexts/FocusMusicContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import DriverDetails from "./pages/DriverDetails";
import CompanyApprovals from "./pages/dashboard/CompanyApprovals";
import CompanyManagement from "./pages/dashboard/CompanyManagement";
import DriverApprovals from "./pages/dashboard/DriverApprovals";
import ShipmentManagement from "./pages/dashboard/ShipmentManagement";
import DriverTracking from "./pages/dashboard/DriverTracking";
import Reports from "./pages/dashboard/Reports";
import CarbonFootprintAnalysis from "./pages/dashboard/CarbonFootprintAnalysis";
import EnvironmentalSustainability from "./pages/dashboard/EnvironmentalSustainability";
import CreateShipment from "./pages/dashboard/CreateShipment";
import ShipmentDetails from "./pages/dashboard/ShipmentDetails";
import TransporterShipments from "./pages/dashboard/TransporterShipments";
import TransporterDrivers from "./pages/dashboard/TransporterDrivers";
import AITools from "./pages/dashboard/AITools";
import Notifications from "./pages/dashboard/Notifications";
import OrganizationProfile from "./pages/dashboard/OrganizationProfile";
import OrganizationDocuments from "./pages/dashboard/OrganizationDocuments";
import AdminSystemOverview from "./pages/dashboard/AdminSystemOverview";
import Partners from "./pages/dashboard/Partners";
import EmployeeManagement from "./pages/dashboard/EmployeeManagement";
import OrganizationView from "./pages/dashboard/OrganizationView";
import AggregateShipmentReport from "./pages/dashboard/AggregateShipmentReport";
import NonHazardousWasteRegister from "./pages/dashboard/NonHazardousWasteRegister";
import HazardousWasteRegister from "./pages/dashboard/HazardousWasteRegister";
import WasteTypesClassification from "./pages/dashboard/WasteTypesClassification";
import MyRequests from "./pages/dashboard/MyRequests";
import RegulatoryUpdates from "./pages/dashboard/RegulatoryUpdates";
import OperationalPlans from "./pages/dashboard/OperationalPlans";
import Chat from "./pages/dashboard/Chat";
import TeamCredentials from "./pages/dashboard/TeamCredentials";
import PartnersTimeline from "./pages/dashboard/PartnersTimeline";
import AddOrganization from "./pages/dashboard/AddOrganization";
import ShipmentReports from "./pages/dashboard/ShipmentReports";
import AdminDriversMap from "./pages/dashboard/AdminDriversMap";
import VideoGenerator from "./pages/dashboard/VideoGenerator";
import MyLocation from "./pages/dashboard/MyLocation";
import RecyclingCertificates from "./pages/dashboard/RecyclingCertificates";
import IssueRecyclingCertificates from "./pages/dashboard/IssueRecyclingCertificates";
import Settings from "./pages/dashboard/Settings";
import AboutPlatform from "./pages/dashboard/AboutPlatform";
import AIChatbot from "./components/ai/AIChatbot";
import ChatWidget from "./components/chat/ChatWidget";
import NotFound from "./pages/NotFound";
import BetaBanner from "./components/BetaBanner";
import Verify from "./pages/Verify";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeSettingsProvider>
      <FocusMusicProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                <Route path="/dashboard/*" element={<Dashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <AIChatbot />
              <ChatWidget />
              <BetaBanner />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </FocusMusicProvider>
    </ThemeSettingsProvider>
  </QueryClientProvider>
);

export default App;
