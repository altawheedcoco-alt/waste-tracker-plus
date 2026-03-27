import { lazy } from "react";
import { Route } from "react-router-dom";

// Retry wrapper for lazy imports — handles stale chunk errors after deploys
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await factory();
      } catch (err) {
        if (i < retries) {
          await new Promise(r => setTimeout(r, 500 * (i + 1)));
        } else {
          window.location.reload();
          throw err;
        }
      }
    }
    throw new Error('lazyRetry exhausted');
  });
}

const Index = lazyRetry(() => import("@/pages/Index"));
const Auth = lazyRetry(() => import("@/pages/Auth"));
const GoogleSetup = lazyRetry(() => import("@/pages/GoogleSetup"));
const NotFound = lazyRetry(() => import("@/pages/NotFound"));
const News = lazyRetry(() => import("@/pages/News"));
const PlatformPosts = lazyRetry(() => import("@/pages/PlatformPosts"));
const PostDetail = lazyRetry(() => import("@/pages/PostDetail"));
const FullBrochure = lazyRetry(() => import("@/pages/Brochure"));
const PublicTrackingPage = lazyRetry(() => import("@/pages/PublicTracking"));
const PublicPermitView = lazyRetry(() => import("@/pages/PublicPermitView"));
const PublicOrgProfile = lazyRetry(() => import("@/pages/PublicOrgProfile"));
const PublicClientPortal = lazyRetry(() => import("@/pages/PublicClientPortal"));
const Verify = lazyRetry(() => import("@/pages/Verify"));
const QRVerify = lazyRetry(() => import("@/pages/QRVerify"));
const VerifySignatory = lazyRetry(() => import("@/pages/VerifySignatory"));
const InviteAccept = lazyRetry(() => import("@/pages/InviteAccept"));
const ConsultantPortal = lazyRetry(() => import("@/pages/ConsultantPortal"));
const AuditPortalPage = lazyRetry(() => import("@/pages/AuditPortal"));
const QuickDeposit = lazyRetry(() => import("@/pages/QuickDeposit"));
const QuickShipment = lazyRetry(() => import("@/pages/QuickShipment"));
const QuickDriver = lazyRetry(() => import("@/pages/QuickDriver"));
const MissionLink = lazyRetry(() => import("@/pages/MissionLink"));
const QuickShip = lazyRetry(() => import("@/pages/QuickShip"));
const ScopedAccessPortal = lazyRetry(() => import("@/pages/ScopedAccessPortal"));
const Terms = lazyRetry(() => import("@/pages/Terms"));
const Privacy = lazyRetry(() => import("@/pages/Privacy"));
const Help = lazyRetry(() => import("@/pages/Help"));
const MapPage = lazyRetry(() => import("@/pages/MapPage"));
const Blog = lazyRetry(() => import("@/pages/Blog"));
const BlogPost = lazyRetry(() => import("@/pages/BlogPost"));
const C2BPublicView = lazyRetry(() => import("@/pages/C2BPublicView"));
const Academy = lazyRetry(() => import("@/pages/Academy"));
const Partnerships = lazyRetry(() => import("@/pages/Partnerships"));
const Legislation = lazyRetry(() => import("@/pages/Legislation"));
const About = lazyRetry(() => import("@/pages/About"));
const Journey = lazyRetry(() => import("@/pages/Journey"));
const Laws = lazyRetry(() => import("@/pages/Laws"));
const Policies = lazyRetry(() => import("@/pages/Policies"));
const ResetPassword = lazyRetry(() => import("@/pages/ResetPassword"));
const SharedDocumentView = lazyRetry(() => import("@/pages/SharedDocumentView"));
const RecyclingHistory = lazyRetry(() => import("@/pages/RecyclingHistory"));
const SharedResourcePage = lazyRetry(() => import("@/pages/SharedResourcePage"));
const SharedShipmentEdit = lazyRetry(() => import("@/pages/SharedShipmentEdit"));
const AccountPendingPage = lazyRetry(() => import("@/pages/AccountPendingPage"));
const VerifySeal = lazyRetry(() => import("@/pages/VerifySeal"));
const Digitalization = lazyRetry(() => import("@/pages/Digitalization"));
const VideoSeries = lazyRetry(() => import("@/pages/dashboard/VideoSeries"));

const GeneratorGuide = lazyRetry(() => import("@/pages/guide/GeneratorGuide"));
const TransporterGuide = lazyRetry(() => import("@/pages/guide/TransporterGuide"));
const RecyclerGuide = lazyRetry(() => import("@/pages/guide/RecyclerGuide"));
const DriverGuide = lazyRetry(() => import("@/pages/guide/DriverGuide"));
const AdminGuide = lazyRetry(() => import("@/pages/guide/AdminGuide"));

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/deposit/:token" element={<QuickDeposit />} />
    <Route path="/shipment/:token" element={<QuickShipment />} />
    <Route path="/driver/:token" element={<QuickDriver />} />
    <Route path="/mission/:token" element={<MissionLink />} />
    <Route path="/quick-ship/:code" element={<QuickShip />} />
    <Route path="/shared-shipment/:code" element={<SharedShipmentEdit />} />
    <Route path="/verify" element={<Verify />} />
    <Route path="/qr-verify" element={<QRVerify />} />
    <Route path="/scan" element={<QRVerify />} />
    <Route path="/track" element={<PublicTrackingPage />} />
    <Route path="/audit-portal" element={<AuditPortalPage />} />
    <Route path="/org-profile/:code" element={<PublicOrgProfile />} />
    <Route path="/portal/:slug" element={<PublicClientPortal />} />
    <Route path="/news" element={<News />} />
    <Route path="/posts" element={<PlatformPosts />} />
    <Route path="/posts/:id" element={<PostDetail />} />
    <Route path="/brochure" element={<FullBrochure />} />
    <Route path="/permit-view/:token" element={<PublicPermitView />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/google-setup" element={<GoogleSetup />} />
    <Route path="/guide/generator" element={<GeneratorGuide />} />
    <Route path="/guide/transporter" element={<TransporterGuide />} />
    <Route path="/guide/recycler" element={<RecyclerGuide />} />
    <Route path="/guide/driver" element={<DriverGuide />} />
    <Route path="/guide/admin" element={<AdminGuide />} />
    <Route path="/verify-signatory/:code" element={<VerifySignatory />} />
    <Route path="/consultant-portal" element={<ConsultantPortal />} />
    <Route path="/invite/:token" element={<InviteAccept />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/privacy" element={<Privacy />} />
    <Route path="/help" element={<Help />} />
    <Route path="/map" element={<MapPage />} />
    <Route path="/blog" element={<Blog />} />
    <Route path="/blog/:slug" element={<BlogPost />} />
    <Route path="/academy" element={<Academy />} />
    <Route path="/partnerships" element={<Partnerships />} />
    <Route path="/legislation" element={<Legislation />} />
    <Route path="/laws" element={<Laws />} />
    <Route path="/about" element={<About />} />
    <Route path="/journey" element={<Journey />} />
    <Route path="/policies" element={<Policies />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/account-pending" element={<AccountPendingPage />} />
    <Route path="/shared/:token" element={<SharedDocumentView />} />
    <Route path="/scoped/:code" element={<ScopedAccessPortal />} />
    <Route path="/recycling-history" element={<RecyclingHistory />} />
    <Route path="/s/:type/:code" element={<SharedResourcePage />} />
    <Route path="/c2b/:code" element={<C2BPublicView />} />
    <Route path="/verify-seal" element={<VerifySeal />} />
    <Route path="/digitalization" element={<Digitalization />} />
    <Route path="/video-series" element={<VideoSeries />} />
    <Route path="*" element={<NotFound />} />
  </>
);
