import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

/**
 * Secondary common routes — loaded only for non-driver org users.
 * These are features drivers typically don't use.
 */
const PrintCenter = lazyRetry(() => import('@/pages/dashboard/PrintCenter'));
const SigningStatus = lazyRetry(() => import('@/pages/dashboard/SigningStatus'));
const OrganizationDocuments = lazyRetry(() => import('@/pages/dashboard/OrganizationDocuments'));
const PlatformFeaturesDoc = lazyRetry(() => import('@/pages/dashboard/PlatformFeaturesDoc'));
const BroadcastChannels = lazyRetry(() => import('@/pages/dashboard/BroadcastChannels'));
const AllNotes = lazyRetry(() => import('@/pages/dashboard/AllNotes'));
const SocialFeedPage = lazyRetry(() => import('@/pages/dashboard/SocialFeedPage'));
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
const LearningCenter = lazyRetry(() => import('@/pages/dashboard/LearningCenter'));
const UserGuidePage = lazyRetry(() => import('@/pages/dashboard/UserGuidePage'));
const ActivityLogPage = lazyRetry(() => import('@/pages/dashboard/ActivityLogPage'));
const SavedLocationsPage = lazyRetry(() => import('@/pages/SavedLocationsPage'));
const MapExplorer = lazyRetry(() => import('@/pages/dashboard/MapExplorer'));
const DataExport = lazyRetry(() => import('@/pages/dashboard/DataExport'));
const MyDataCenter = lazyRetry(() => import('@/pages/dashboard/MyDataCenter'));
const EmployeeTaskBoard = lazyRetry(() => import('@/pages/dashboard/EmployeeTaskBoard'));
const DocumentArchive = lazyRetry(() => import('@/pages/dashboard/DocumentArchive'));
const PartnerReviews = lazyRetry(() => import('@/pages/dashboard/PartnerReviews'));
const SharedLinksPage = lazyRetry(() => import('@/pages/dashboard/SharedLinksPage'));
const AdvancedAnalyticsPage = lazyRetry(() => import('@/pages/dashboard/AdvancedAnalyticsPage'));
const ExecutiveSummaryPage = lazyRetry(() => import('@/pages/dashboard/ExecutiveSummaryPage'));

export const deferredCommonRoutes = (
  <>
    <Route path="/dashboard/print-center" element={<PrintCenter />} />
    <Route path="/dashboard/signing-status" element={<SigningStatus />} />
    <Route path="/dashboard/organization-documents" element={<OrganizationDocuments />} />
    <Route path="/dashboard/platform-features" element={<PlatformFeaturesDoc />} />
    <Route path="/dashboard/broadcast-channels" element={<BroadcastChannels />} />
    <Route path="/dashboard/notes" element={<AllNotes />} />
    <Route path="/dashboard/feed" element={<SocialFeedPage />} />
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
    <Route path="/dashboard/auto-actions" element={<AutoActions />} />
    <Route path="/dashboard/stationery" element={<StationeryTemplates />} />
    <Route path="/dashboard/stationery-plans" element={<StationeryPlans />} />
    <Route path="/dashboard/ai-tools" element={<AITools />} />
    <Route path="/dashboard/ai-document-studio" element={<AIDocumentStudioPage />} />
    <Route path="/dashboard/ai-extracted-data" element={<AIExtractedDataPage />} />
    <Route path="/dashboard/learning-center" element={<LearningCenter />} />
    <Route path="/dashboard/user-guide" element={<UserGuidePage />} />
    <Route path="/dashboard/activity-log" element={<ActivityLogPage />} />
    <Route path="/dashboard/saved-locations" element={<SavedLocationsPage />} />
    <Route path="/dashboard/map-explorer" element={<MapExplorer />} />
    <Route path="/dashboard/data-export" element={<DataExport />} />
    <Route path="/dashboard/my-data" element={<MyDataCenter />} />
    <Route path="/dashboard/task-board" element={<EmployeeTaskBoard />} />
    <Route path="/dashboard/document-archive" element={<DocumentArchive />} />
    <Route path="/dashboard/partner-reviews" element={<PartnerReviews />} />
    <Route path="/dashboard/shared-links" element={<SharedLinksPage />} />
    <Route path="/dashboard/advanced-analytics" element={<AdvancedAnalyticsPage />} />
  </>
);
