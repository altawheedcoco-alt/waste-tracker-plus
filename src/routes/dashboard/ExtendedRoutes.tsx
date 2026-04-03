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
  </>
);
