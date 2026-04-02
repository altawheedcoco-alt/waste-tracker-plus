import { Route, Navigate } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const Dashboard = lazyRetry(() => import('@/pages/Dashboard'));
const MyWorkspace = lazyRetry(() => import('@/pages/dashboard/MyWorkspace'));
const DigitalIdentityCardPage = lazyRetry(() => import('@/pages/dashboard/DigitalIdentityCardPage'));
const PrintCenter = lazyRetry(() => import('@/pages/dashboard/PrintCenter'));
const SigningStatus = lazyRetry(() => import('@/pages/dashboard/SigningStatus'));
const Notifications = lazyRetry(() => import('@/pages/dashboard/Notifications'));
const OrganizationProfile = lazyRetry(() => import('@/pages/dashboard/OrganizationProfile'));
const OrganizationDocuments = lazyRetry(() => import('@/pages/dashboard/OrganizationDocuments'));
const Settings = lazyRetry(() => import('@/pages/dashboard/Settings'));
const AboutPlatform = lazyRetry(() => import('@/pages/dashboard/AboutPlatform'));
const PlatformFeaturesDoc = lazyRetry(() => import('@/pages/dashboard/PlatformFeaturesDoc'));
const OfflineMode = lazyRetry(() => import('@/pages/dashboard/OfflineMode'));
const Chat = lazyRetry(() => import('@/pages/dashboard/Chat'));
const BroadcastChannels = lazyRetry(() => import('@/pages/dashboard/BroadcastChannels'));
const AllNotes = lazyRetry(() => import('@/pages/dashboard/AllNotes'));
const MemberSocialProfile = lazyRetry(() => import('@/pages/dashboard/MemberSocialProfile'));
const SocialFeedPage = lazyRetry(() => import('@/pages/dashboard/SocialFeedPage'));
const SupportCenter = lazyRetry(() => import('@/pages/dashboard/SupportCenter'));
const Reports = lazyRetry(() => import('@/pages/dashboard/Reports'));
const ReportsGuide = lazyRetry(() => import('@/pages/dashboard/ReportsGuide'));
const DocumentCenter = lazyRetry(() => import('@/pages/dashboard/DocumentCenter'));
const SigningInbox = lazyRetry(() => import('@/pages/dashboard/SigningInbox'));
const BulkSigning = lazyRetry(() => import('@/pages/dashboard/BulkSigning'));
const Contracts = lazyRetry(() => import('@/pages/dashboard/Contracts'));
const ContractTemplates = lazyRetry(() => import('@/pages/dashboard/ContractTemplates'));
const ContractVerificationPage = lazyRetry(() => import('@/components/contracts/ContractVerificationPage'));
const TermsAcceptances = lazyRetry(() => import('@/pages/dashboard/TermsAcceptances'));
const Partners = lazyRetry(() => import('@/pages/dashboard/Partners'));
const PartnersTimeline = lazyRetry(() => import('@/pages/dashboard/PartnersTimeline'));
const PartnerAccounts = lazyRetry(() => import('@/pages/dashboard/PartnerAccounts'));
const PartnerAccountDetails = lazyRetry(() => import('@/pages/dashboard/PartnerAccountDetails'));
const ExternalPartnerDetails = lazyRetry(() => import('@/pages/dashboard/ExternalPartnerDetails'));
const OrgStructure = lazyRetry(() => import('@/pages/dashboard/OrgStructure'));
const AutoActions = lazyRetry(() => import('@/pages/dashboard/AutoActions'));
const StationeryTemplates = lazyRetry(() => import('@/pages/dashboard/StationeryTemplates'));
const StationeryPlans = lazyRetry(() => import('@/pages/dashboard/StationeryPlans'));
const AITools = lazyRetry(() => import('@/pages/dashboard/AITools'));
const AIDocumentStudioPage = lazyRetry(() => import('@/pages/dashboard/AIDocumentStudioPage'));
const AIExtractedDataPage = lazyRetry(() => import('@/pages/dashboard/AIExtractedDataPage'));
const CVBuilder = lazyRetry(() => import('@/pages/dashboard/CVBuilder'));
const SmartJobRecommendations = lazyRetry(() => import('@/pages/dashboard/SmartJobRecommendations'));
const LearningCenter = lazyRetry(() => import('@/pages/dashboard/LearningCenter'));
const UserGuidePage = lazyRetry(() => import('@/pages/dashboard/UserGuidePage'));
const MedicalProgram = lazyRetry(() => import('@/pages/dashboard/MedicalProgram'));
const IRecycleHealth = lazyRetry(() => import('@/pages/dashboard/IRecycleHealth'));
const OHSReports = lazyRetry(() => import('@/pages/dashboard/OHSReports'));
const Gamification = lazyRetry(() => import('@/pages/dashboard/Gamification'));
const Stories = lazyRetry(() => import('@/pages/dashboard/Stories'));
const Reels = lazyRetry(() => import('@/pages/dashboard/Reels'));
const Meetings = lazyRetry(() => import('@/pages/dashboard/Meetings'));
const ActivityLogPage = lazyRetry(() => import('@/pages/dashboard/ActivityLogPage'));
const SubscriptionManagement = lazyRetry(() => import('@/pages/dashboard/SubscriptionManagement'));
const AdvertiserDashboard = lazyRetry(() => import('@/pages/dashboard/AdvertiserDashboard'));
const AdPlans = lazyRetry(() => import('@/pages/dashboard/AdPlans'));
const DocumentVerification = lazyRetry(() => import('@/pages/dashboard/DocumentVerification'));
const NavigationDemo = lazyRetry(() => import('@/pages/dashboard/NavigationDemo'));
const DemoScenario = lazyRetry(() => import('@/pages/dashboard/DemoScenario'));
const SystemStatus = lazyRetry(() => import('@/pages/dashboard/SystemStatus'));
const SavedLocationsPage = lazyRetry(() => import('@/pages/SavedLocationsPage'));
const MapExplorer = lazyRetry(() => import('@/pages/dashboard/MapExplorer'));
const DataExport = lazyRetry(() => import('@/pages/dashboard/DataExport'));
const MyDataCenter = lazyRetry(() => import('@/pages/dashboard/MyDataCenter'));
const EmployeeTaskBoard = lazyRetry(() => import('@/pages/dashboard/EmployeeTaskBoard'));
const VideoGenerator = lazyRetry(() => import('@/pages/dashboard/VideoGenerator'));
const VideoSeries = lazyRetry(() => import('@/pages/dashboard/VideoSeries'));
const PlatformBrochure = lazyRetry(() => import('@/pages/dashboard/PlatformBrochure'));
const PlatformTermsAndPolicies = lazyRetry(() => import('@/pages/dashboard/PlatformTermsAndPolicies'));
const MultiSignTemplates = lazyRetry(() => import('@/pages/dashboard/MultiSignTemplates'));
const DocumentArchive = lazyRetry(() => import('@/pages/dashboard/DocumentArchive'));
const AwardLetters = lazyRetry(() => import('@/pages/dashboard/AwardLetters'));
const SmartInsurance = lazyRetry(() => import('@/pages/dashboard/SmartInsurance'));
const DigitalWallet = lazyRetry(() => import('@/pages/dashboard/DigitalWallet'));
const PartnerReviews = lazyRetry(() => import('@/pages/dashboard/PartnerReviews'));
const Omaluna = lazyRetry(() => import('@/pages/dashboard/Omaluna'));
const OmalunaPostJob = lazyRetry(() => import('@/pages/dashboard/OmalunaPostJob'));
const OmalunaWorkerProfile = lazyRetry(() => import('@/pages/dashboard/OmalunaWorkerProfile'));
const OmalunaJobDetails = lazyRetry(() => import('@/pages/dashboard/OmalunaJobDetails'));
const OmalunaMyJobs = lazyRetry(() => import('@/pages/dashboard/OmalunaMyJobs'));
const OmalunaMyApplications = lazyRetry(() => import('@/pages/dashboard/OmalunaMyApplications'));
const OmalunaJobApplications = lazyRetry(() => import('@/pages/dashboard/OmalunaJobApplications'));
const NotFound = lazyRetry(() => import('@/pages/NotFound'));

export const commonRoutes = (
  <>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/dashboard/my-workspace" element={<MyWorkspace />} />
    <Route path="/dashboard/digital-identity-card" element={<DigitalIdentityCardPage />} />
    <Route path="/dashboard/print-center" element={<PrintCenter />} />
    <Route path="/dashboard/signing-status" element={<SigningStatus />} />
    <Route path="/dashboard/notifications" element={<Notifications />} />
    <Route path="/dashboard/org-profile/:id" element={<Navigate to="/dashboard/organization-profile" replace />} />
    <Route path="/dashboard/organization-profile" element={<OrganizationProfile />} />
    <Route path="/dashboard/organization-documents" element={<OrganizationDocuments />} />
    <Route path="/dashboard/settings" element={<Settings />} />
    <Route path="/dashboard/about-platform" element={<AboutPlatform />} />
    <Route path="/dashboard/platform-features" element={<PlatformFeaturesDoc />} />
    <Route path="/dashboard/offline-mode" element={<OfflineMode />} />
    <Route path="/dashboard/chat" element={<Chat />} />
    <Route path="/dashboard/broadcast-channels" element={<BroadcastChannels />} />
    <Route path="/dashboard/notes" element={<AllNotes />} />
    <Route path="/dashboard/profile/:profileId" element={<MemberSocialProfile />} />
    <Route path="/dashboard/my-profile" element={<MemberSocialProfile />} />
    <Route path="/dashboard/feed" element={<SocialFeedPage />} />
    <Route path="/dashboard/support" element={<SupportCenter />} />
    <Route path="/dashboard/reports" element={<Reports />} />
    <Route path="/dashboard/reports-guide" element={<ReportsGuide />} />
    <Route path="/dashboard/document-center" element={<DocumentCenter />} />
    <Route path="/dashboard/signing-inbox" element={<SigningInbox />} />
    <Route path="/dashboard/bulk-signing" element={<BulkSigning />} />
    <Route path="/dashboard/contracts" element={<Contracts />} />
    <Route path="/dashboard/contract-templates" element={<ContractTemplates />} />
    <Route path="/dashboard/verify-contract" element={<ContractVerificationPage />} />
    <Route path="/dashboard/terms-acceptances" element={<TermsAcceptances />} />
    <Route path="/dashboard/partners" element={<Partners />} />
    <Route path="/dashboard/partners-timeline" element={<PartnersTimeline />} />
    <Route path="/dashboard/partner-accounts" element={<PartnerAccounts />} />
    <Route path="/dashboard/partner-account/:partnerId" element={<PartnerAccountDetails />} />
    <Route path="/dashboard/external-partner/:partnerId" element={<ExternalPartnerDetails />} />
    <Route path="/dashboard/org-structure" element={<OrgStructure />} />
    <Route path="/dashboard/employees" element={<Navigate to="/dashboard/org-structure" replace />} />
    <Route path="/dashboard/team-credentials" element={<Navigate to="/dashboard/org-structure" replace />} />
    <Route path="/dashboard/auto-actions" element={<AutoActions />} />
    <Route path="/dashboard/stationery" element={<StationeryTemplates />} />
    <Route path="/dashboard/stationery-plans" element={<StationeryPlans />} />
    <Route path="/dashboard/ai-tools" element={<AITools />} />
    <Route path="/dashboard/ai-document-studio" element={<AIDocumentStudioPage />} />
    <Route path="/dashboard/ai-extracted-data" element={<AIExtractedDataPage />} />
    <Route path="/dashboard/cv-builder" element={<CVBuilder />} />
    <Route path="/dashboard/smart-job-recommendations" element={<SmartJobRecommendations />} />
    <Route path="/dashboard/learning-center" element={<LearningCenter />} />
    <Route path="/dashboard/user-guide" element={<UserGuidePage />} />
    <Route path="/dashboard/medical-program" element={<MedicalProgram />} />
    <Route path="/dashboard/health" element={<IRecycleHealth />} />
    <Route path="/dashboard/ohs-reports" element={<OHSReports />} />
    <Route path="/dashboard/safety" element={<OHSReports />} />
    <Route path="/dashboard/gamification" element={<Gamification />} />
    <Route path="/dashboard/stories" element={<Stories />} />
    <Route path="/dashboard/reels" element={<Reels />} />
    <Route path="/dashboard/meetings" element={<Meetings />} />
    <Route path="/dashboard/activity-log" element={<ActivityLogPage />} />
    <Route path="/dashboard/subscription" element={<SubscriptionManagement />} />
    <Route path="/dashboard/my-ads" element={<AdvertiserDashboard />} />
    <Route path="/dashboard/ad-plans" element={<AdPlans />} />
    <Route path="/dashboard/document-verification" element={<DocumentVerification />} />
    <Route path="/dashboard/navigation-demo" element={<NavigationDemo />} />
    <Route path="/dashboard/demo-scenario" element={<DemoScenario />} />
    <Route path="/dashboard/system-status" element={<SystemStatus />} />
    <Route path="/dashboard/saved-locations" element={<SavedLocationsPage />} />
    <Route path="/dashboard/map-explorer" element={<MapExplorer />} />
    <Route path="/dashboard/data-export" element={<DataExport />} />
    <Route path="/dashboard/my-data" element={<MyDataCenter />} />
    <Route path="/dashboard/task-board" element={<EmployeeTaskBoard />} />
    <Route path="/dashboard/video-generator" element={<VideoGenerator />} />
    <Route path="/dashboard/video-series" element={<VideoSeries />} />
    <Route path="/dashboard/platform-brochure" element={<PlatformBrochure />} />
    <Route path="/dashboard/platform-terms" element={<PlatformTermsAndPolicies />} />
    <Route path="/dashboard/multi-sign-templates" element={<MultiSignTemplates />} />
    <Route path="/dashboard/document-archive" element={<DocumentArchive />} />
    <Route path="/dashboard/award-letters" element={<AwardLetters />} />
    <Route path="/dashboard/smart-insurance" element={<SmartInsurance />} />
    <Route path="/dashboard/digital-wallet" element={<DigitalWallet />} />
    <Route path="/dashboard/partner-reviews" element={<PartnerReviews />} />
    <Route path="/dashboard/omaluna" element={<Omaluna />} />
    <Route path="/dashboard/omaluna/post-job" element={<OmalunaPostJob />} />
    <Route path="/dashboard/omaluna/my-profile" element={<OmalunaWorkerProfile />} />
    <Route path="/dashboard/omaluna/job/:jobId" element={<OmalunaJobDetails />} />
    <Route path="/dashboard/omaluna/my-jobs" element={<OmalunaMyJobs />} />
    <Route path="/dashboard/omaluna/my-applications" element={<OmalunaMyApplications />} />
    <Route path="/dashboard/omaluna/job/:jobId/applications" element={<OmalunaJobApplications />} />
    <Route path="/dashboard/smart-archive" element={<Navigate to="/dashboard/document-center?tab=smart-archive" replace />} />
    <Route path="/dashboard/central-registry" element={<Navigate to="/dashboard/document-center?tab=registry" replace />} />
    {/* Catch-all */}
    <Route path="/dashboard/*" element={<NotFound />} />
  </>
);
