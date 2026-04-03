import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

// Extended features — loaded on-demand for users who access them
const CVBuilder = lazyRetry(() => import('@/pages/dashboard/CVBuilder'));
const SmartJobRecommendations = lazyRetry(() => import('@/pages/dashboard/SmartJobRecommendations'));
const MedicalProgram = lazyRetry(() => import('@/pages/dashboard/MedicalProgram'));
const IRecycleHealth = lazyRetry(() => import('@/pages/dashboard/IRecycleHealth'));
const OHSReports = lazyRetry(() => import('@/pages/dashboard/OHSReports'));
const Gamification = lazyRetry(() => import('@/pages/dashboard/Gamification'));
const Stories = lazyRetry(() => import('@/pages/dashboard/Stories'));
const Reels = lazyRetry(() => import('@/pages/dashboard/Reels'));
const Meetings = lazyRetry(() => import('@/pages/dashboard/Meetings'));
const CallHistory = lazyRetry(() => import('@/pages/dashboard/CallHistory'));
const SubscriptionManagement = lazyRetry(() => import('@/pages/dashboard/SubscriptionManagement'));
const AdvertiserDashboard = lazyRetry(() => import('@/pages/dashboard/AdvertiserDashboard'));
const AdPlans = lazyRetry(() => import('@/pages/dashboard/AdPlans'));
const DocumentVerification = lazyRetry(() => import('@/pages/dashboard/DocumentVerification'));
const NavigationDemo = lazyRetry(() => import('@/pages/dashboard/NavigationDemo'));
const DemoScenario = lazyRetry(() => import('@/pages/dashboard/DemoScenario'));
const VideoGenerator = lazyRetry(() => import('@/pages/dashboard/VideoGenerator'));
const VideoSeries = lazyRetry(() => import('@/pages/dashboard/VideoSeries'));
const PlatformBrochure = lazyRetry(() => import('@/pages/dashboard/PlatformBrochure'));
const MultiSignTemplates = lazyRetry(() => import('@/pages/dashboard/MultiSignTemplates'));
const AwardLetters = lazyRetry(() => import('@/pages/dashboard/AwardLetters'));
const SmartInsurance = lazyRetry(() => import('@/pages/dashboard/SmartInsurance'));
const Omaluna = lazyRetry(() => import('@/pages/dashboard/Omaluna'));
const OmalunaPostJob = lazyRetry(() => import('@/pages/dashboard/OmalunaPostJob'));
const OmalunaWorkerProfile = lazyRetry(() => import('@/pages/dashboard/OmalunaWorkerProfile'));
const OmalunaJobDetails = lazyRetry(() => import('@/pages/dashboard/OmalunaJobDetails'));
const OmalunaMyJobs = lazyRetry(() => import('@/pages/dashboard/OmalunaMyJobs'));
const OmalunaMyApplications = lazyRetry(() => import('@/pages/dashboard/OmalunaMyApplications'));
const OmalunaJobApplications = lazyRetry(() => import('@/pages/dashboard/OmalunaJobApplications'));
const SecondaryMaterials = lazyRetry(() => import('@/pages/dashboard/SecondaryMaterials'));
const MarketIntelligence = lazyRetry(() => import('@/pages/dashboard/MarketIntelligence'));
const Webhooks = lazyRetry(() => import('@/pages/dashboard/Webhooks'));
const CommunityRewards = lazyRetry(() => import('@/pages/dashboard/CommunityRewards'));
const PreventiveMaintenance = lazyRetry(() => import('@/pages/dashboard/PreventiveMaintenance'));
const SmartInventory = lazyRetry(() => import('@/pages/dashboard/SmartInventory'));
const QualityControl = lazyRetry(() => import('@/pages/dashboard/QualityControl'));
const EmergencyResponse = lazyRetry(() => import('@/pages/dashboard/EmergencyResponse'));
const DynamicPricing = lazyRetry(() => import('@/pages/dashboard/DynamicPricing'));
const B2BLoyalty = lazyRetry(() => import('@/pages/dashboard/B2BLoyalty'));
const RecurringServices = lazyRetry(() => import('@/pages/dashboard/RecurringServices'));
const Benchmarking = lazyRetry(() => import('@/pages/dashboard/Benchmarking'));
const PredictiveFailure = lazyRetry(() => import('@/pages/dashboard/PredictiveFailure'));
const SmartHelpCenter = lazyRetry(() => import('@/pages/dashboard/SmartHelpCenter'));

export const extendedRoutes = (
  <>
    <Route path="/dashboard/cv-builder" element={<CVBuilder />} />
    <Route path="/dashboard/smart-job-recommendations" element={<SmartJobRecommendations />} />
    <Route path="/dashboard/medical-program" element={<MedicalProgram />} />
    <Route path="/dashboard/health" element={<IRecycleHealth />} />
    <Route path="/dashboard/ohs-reports" element={<OHSReports />} />
    <Route path="/dashboard/safety" element={<OHSReports />} />
    <Route path="/dashboard/gamification" element={<Gamification />} />
    <Route path="/dashboard/stories" element={<Stories />} />
    <Route path="/dashboard/reels" element={<Reels />} />
    <Route path="/dashboard/meetings" element={<Meetings />} />
    <Route path="/dashboard/call-history" element={<CallHistory />} />
    <Route path="/dashboard/subscription" element={<SubscriptionManagement />} />
    <Route path="/dashboard/my-ads" element={<AdvertiserDashboard />} />
    <Route path="/dashboard/ad-plans" element={<AdPlans />} />
    <Route path="/dashboard/document-verification" element={<DocumentVerification />} />
    <Route path="/dashboard/navigation-demo" element={<NavigationDemo />} />
    <Route path="/dashboard/demo-scenario" element={<DemoScenario />} />
    <Route path="/dashboard/video-generator" element={<VideoGenerator />} />
    <Route path="/dashboard/video-series" element={<VideoSeries />} />
    <Route path="/dashboard/platform-brochure" element={<PlatformBrochure />} />
    <Route path="/dashboard/multi-sign-templates" element={<MultiSignTemplates />} />
    <Route path="/dashboard/award-letters" element={<AwardLetters />} />
    <Route path="/dashboard/smart-insurance" element={<SmartInsurance />} />
    <Route path="/dashboard/omaluna" element={<Omaluna />} />
    <Route path="/dashboard/omaluna/post-job" element={<OmalunaPostJob />} />
    <Route path="/dashboard/omaluna/my-profile" element={<OmalunaWorkerProfile />} />
    <Route path="/dashboard/omaluna/job/:jobId" element={<OmalunaJobDetails />} />
    <Route path="/dashboard/omaluna/my-jobs" element={<OmalunaMyJobs />} />
    <Route path="/dashboard/omaluna/my-applications" element={<OmalunaMyApplications />} />
    <Route path="/dashboard/omaluna/job/:jobId/applications" element={<OmalunaJobApplications />} />
    <Route path="/dashboard/secondary-materials" element={<SecondaryMaterials />} />
    <Route path="/dashboard/market-intelligence" element={<MarketIntelligence />} />
    <Route path="/dashboard/webhooks" element={<Webhooks />} />
    <Route path="/dashboard/community-rewards" element={<CommunityRewards />} />
    <Route path="/dashboard/preventive-maintenance" element={<PreventiveMaintenance />} />
    <Route path="/dashboard/smart-inventory" element={<SmartInventory />} />
    <Route path="/dashboard/quality-control" element={<QualityControl />} />
    <Route path="/dashboard/emergency-response" element={<EmergencyResponse />} />
    <Route path="/dashboard/dynamic-pricing" element={<DynamicPricing />} />
    <Route path="/dashboard/b2b-loyalty" element={<B2BLoyalty />} />
    <Route path="/dashboard/recurring-services" element={<RecurringServices />} />
    <Route path="/dashboard/benchmarking" element={<Benchmarking />} />
    <Route path="/dashboard/predictive-failure" element={<PredictiveFailure />} />
    <Route path="/dashboard/help-center" element={<SmartHelpCenter />} />
  </>
);
