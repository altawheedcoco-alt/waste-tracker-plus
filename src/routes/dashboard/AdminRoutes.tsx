import { Route, Navigate } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const AdminSystemOverview = lazyRetry(() => import('@/pages/dashboard/AdminSystemOverview'));
const AdminRevenueManagement = lazyRetry(() => import('@/pages/dashboard/AdminRevenueManagement'));
const NewsManager = lazyRetry(() => import('@/pages/dashboard/NewsManager'));
const PlatformPostsManager = lazyRetry(() => import('@/pages/dashboard/PlatformPostsManager'));
const BlogManager = lazyRetry(() => import('@/pages/dashboard/BlogManager'));
const TestimonialsManagement = lazyRetry(() => import('@/pages/dashboard/TestimonialsManagement'));
const CompanyApprovals = lazyRetry(() => import('@/pages/dashboard/CompanyApprovals'));
const CompanyManagement = lazyRetry(() => import('@/pages/dashboard/CompanyManagement'));
const DriverApprovals = lazyRetry(() => import('@/pages/dashboard/DriverApprovals'));
const AddOrganization = lazyRetry(() => import('@/pages/dashboard/AddOrganization'));
const AdminDriversMap = lazyRetry(() => import('@/pages/dashboard/AdminDriversMap'));
const PushNotificationStats = lazyRetry(() => import('@/pages/dashboard/PushNotificationStats'));
const C2BManagement = lazyRetry(() => import('@/pages/dashboard/C2BManagement'));
const OnboardingReview = lazyRetry(() => import('@/pages/dashboard/OnboardingReview'));
const AdminHomepageManager = lazyRetry(() => import('@/pages/dashboard/AdminHomepageManager'));
const WaPilotManagement = lazyRetry(() => import('@/pages/dashboard/WaPilotManagement'));
const SystemScreenshots = lazyRetry(() => import('@/pages/dashboard/SystemScreenshots'));
const ApiManagement = lazyRetry(() => import('@/pages/dashboard/ApiManagement'));
const SecurityPenetrationTesting = lazyRetry(() => import('@/pages/dashboard/SecurityPenetrationTesting'));
const DatabaseQueryOptimization = lazyRetry(() => import('@/pages/dashboard/DatabaseQueryOptimization'));
const AdvancedAnalytics = lazyRetry(() => import('@/pages/dashboard/AdvancedAnalytics'));
const GDPRCompliance = lazyRetry(() => import('@/pages/dashboard/GDPRCompliance'));
const AdminDocumentStamping = lazyRetry(() => import('@/pages/dashboard/AdminDocumentStamping'));
const AdminBrandingSettings = lazyRetry(() => import('@/pages/dashboard/AdminBrandingSettings'));
const AdminEntityCensus = lazyRetry(() => import('@/pages/dashboard/AdminEntityCensus'));
const SystemCommands = lazyRetry(() => import('@/pages/dashboard/SystemCommands'));
const CrossImpactDashboard = lazyRetry(() => import('@/pages/dashboard/CrossImpactDashboard'));
const CyberSecurityCenter = lazyRetry(() => import('@/pages/dashboard/CyberSecurityCenter'));
const VisitorAnalytics = lazyRetry(() => import('@/pages/dashboard/VisitorAnalytics'));
const DigitalMaturityDashboard = lazyRetry(() => import('@/pages/dashboard/DigitalMaturityDashboard'));
const SystemArchitectureGuide = lazyRetry(() => import('@/pages/dashboard/SystemArchitectureGuide'));
const ActionChainsPage = lazyRetry(() => import('@/pages/dashboard/ActionChainsPage'));
const GovernanceDashboard = lazyRetry(() => import('@/pages/dashboard/GovernanceDashboard'));
const LeadGeneration = lazyRetry(() => import('@/pages/dashboard/LeadGeneration'));
const CompanyDirectory = lazyRetry(() => import('@/pages/dashboard/CompanyDirectory'));
const OrganizationView = lazyRetry(() => import('@/pages/dashboard/OrganizationView'));
const OrganizationAttestation = lazyRetry(() => import('@/pages/dashboard/OrganizationAttestation'));
const AdminAttestations = lazyRetry(() => import('@/pages/dashboard/AdminAttestations'));
const ScopedAccessLinks = lazyRetry(() => import('@/pages/dashboard/ScopedAccessLinks'));
const RestrictionsMonitor = lazyRetry(() => import('@/pages/dashboard/RestrictionsMonitor'));
const AIForecasting = lazyRetry(() => import('@/pages/dashboard/AIForecasting'));
const Drivers = lazyRetry(() => import('@/pages/Drivers'));
const DriverDetails = lazyRetry(() => import('@/pages/DriverDetails'));
const ShipmentManagement = lazyRetry(() => import('@/pages/dashboard/ShipmentManagement'));
const ShipmentDetails = lazyRetry(() => import('@/pages/dashboard/ShipmentDetails'));

// Admin gets ALL routes — load everything needed
export const adminRoutes = (
  <>
    <Route path="/dashboard/system-overview" element={<AdminSystemOverview />} />
    <Route path="/dashboard/admin-revenue" element={<AdminRevenueManagement />} />
    <Route path="/dashboard/news-manager" element={<NewsManager />} />
    <Route path="/dashboard/posts-manager" element={<PlatformPostsManager />} />
    <Route path="/dashboard/blog-manager" element={<BlogManager />} />
    <Route path="/dashboard/testimonials-management" element={<TestimonialsManagement />} />
    <Route path="/dashboard/company-approvals" element={<CompanyApprovals />} />
    <Route path="/dashboard/company-management" element={<CompanyManagement />} />
    <Route path="/dashboard/driver-approvals" element={<DriverApprovals />} />
    <Route path="/dashboard/add-organization" element={<AddOrganization />} />
    <Route path="/dashboard/admin-drivers-map" element={<AdminDriversMap />} />
    <Route path="/dashboard/push-notification-stats" element={<PushNotificationStats />} />
    <Route path="/dashboard/c2b-management" element={<C2BManagement />} />
    <Route path="/dashboard/onboarding-review" element={<OnboardingReview />} />
    <Route path="/dashboard/homepage-manager" element={<AdminHomepageManager />} />
    <Route path="/dashboard/wapilot" element={<WaPilotManagement />} />
    <Route path="/dashboard/system-screenshots" element={<SystemScreenshots />} />
    <Route path="/dashboard/api" element={<ApiManagement />} />
    <Route path="/dashboard/security-testing" element={<SecurityPenetrationTesting />} />
    <Route path="/dashboard/db-optimization" element={<DatabaseQueryOptimization />} />
    <Route path="/dashboard/advanced-analytics" element={<AdvancedAnalytics />} />
    <Route path="/dashboard/gdpr-compliance" element={<GDPRCompliance />} />
    <Route path="/dashboard/admin-document-stamping" element={<AdminDocumentStamping />} />
    <Route path="/dashboard/admin-branding" element={<AdminBrandingSettings />} />
    <Route path="/dashboard/entity-census" element={<AdminEntityCensus />} />
    <Route path="/dashboard/system-commands" element={<SystemCommands />} />
    <Route path="/dashboard/cross-impact" element={<CrossImpactDashboard />} />
    <Route path="/dashboard/cyber-security" element={<CyberSecurityCenter />} />
    <Route path="/dashboard/admin-cyber-security" element={<CyberSecurityCenter />} />
    <Route path="/dashboard/visitor-analytics" element={<VisitorAnalytics />} />
    <Route path="/dashboard/digital-maturity" element={<DigitalMaturityDashboard />} />
    <Route path="/dashboard/architecture-guide" element={<SystemArchitectureGuide />} />
    <Route path="/dashboard/action-chains" element={<ActionChainsPage />} />
    <Route path="/dashboard/governance" element={<GovernanceDashboard />} />
    <Route path="/dashboard/lead-generation" element={<LeadGeneration />} />
    <Route path="/dashboard/company-directory" element={<CompanyDirectory />} />
    <Route path="/dashboard/call-center" element={<lazyRetry(() => import('@/pages/dashboard/SupportCenter'))} />}
    <Route path="/dashboard/organization/:organizationId" element={<OrganizationView />} />
    <Route path="/dashboard/organization-attestation" element={<OrganizationAttestation />} />
    <Route path="/dashboard/admin-attestations" element={<AdminAttestations />} />
    <Route path="/dashboard/scoped-access-links" element={<ScopedAccessLinks />} />
    <Route path="/dashboard/restrictions-monitor" element={<RestrictionsMonitor />} />
    <Route path="/dashboard/ai-forecasting" element={<AIForecasting />} />
    <Route path="/dashboard/drivers" element={<Drivers />} />
    <Route path="/dashboard/drivers/:driverId" element={<DriverDetails />} />
    <Route path="/dashboard/shipments" element={<ShipmentManagement />} />
    <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/s/:shipmentId" element={<ShipmentDetails />} />
  </>
);
