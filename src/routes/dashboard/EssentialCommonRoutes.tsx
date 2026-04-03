import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

/**
 * Essential routes every dashboard user needs — kept minimal.
 * ~10 routes that are universally accessed regardless of role.
 */
const MyWorkspace = lazyRetry(() => import('@/pages/dashboard/MyWorkspace'));
const OrganizationProfile = lazyRetry(() => import('@/pages/dashboard/OrganizationProfile'));
const DigitalIdentityCardPage = lazyRetry(() => import('@/pages/dashboard/DigitalIdentityCardPage'));
const MemberSocialProfile = lazyRetry(() => import('@/pages/dashboard/MemberSocialProfile'));
const SupportCenter = lazyRetry(() => import('@/pages/dashboard/SupportCenter'));
const AboutPlatform = lazyRetry(() => import('@/pages/dashboard/AboutPlatform'));
const OfflineMode = lazyRetry(() => import('@/pages/dashboard/OfflineMode'));
const SystemStatus = lazyRetry(() => import('@/pages/dashboard/SystemStatus'));
const PlatformTermsAndPolicies = lazyRetry(() => import('@/pages/dashboard/PlatformTermsAndPolicies'));
const DigitalWallet = lazyRetry(() => import('@/pages/dashboard/DigitalWallet'));
const GamificationPage = lazyRetry(() => import('@/pages/GamificationPage'));

export const essentialCommonRoutes = (
  <>
    <Route path="/dashboard/my-workspace" element={<MyWorkspace />} />
    <Route path="/dashboard/organization-profile" element={<OrganizationProfile />} />
    <Route path="/dashboard/digital-identity-card" element={<DigitalIdentityCardPage />} />
    <Route path="/dashboard/profile/:profileId" element={<MemberSocialProfile />} />
    <Route path="/dashboard/my-profile" element={<MemberSocialProfile />} />
    <Route path="/dashboard/support" element={<SupportCenter />} />
    <Route path="/dashboard/about-platform" element={<AboutPlatform />} />
    <Route path="/dashboard/offline-mode" element={<OfflineMode />} />
    <Route path="/dashboard/system-status" element={<SystemStatus />} />
    <Route path="/dashboard/platform-terms" element={<PlatformTermsAndPolicies />} />
    <Route path="/dashboard/digital-wallet" element={<DigitalWallet />} />
    <Route path="/dashboard/gamification" element={<GamificationPage />} />
  </>
);
