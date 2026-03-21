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
const GoogleSetup = lazy(() => import("@/pages/GoogleSetup"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const News = lazy(() => import("@/pages/News"));
const FullBrochure = lazy(() => import("@/pages/Brochure"));
const PublicTrackingPage = lazy(() => import("@/pages/PublicTracking"));
const PublicPermitView = lazy(() => import("@/pages/PublicPermitView"));
const PublicOrgProfile = lazy(() => import("@/pages/PublicOrgProfile"));
const PublicClientPortal = lazy(() => import("@/pages/PublicClientPortal"));
const Verify = lazy(() => import("@/pages/Verify"));
const QRVerify = lazy(() => import("@/pages/QRVerify"));
const VerifySignatory = lazy(() => import("@/pages/VerifySignatory"));
const InviteAccept = lazy(() => import("@/pages/InviteAccept"));
const ConsultantPortal = lazy(() => import("@/pages/ConsultantPortal"));
const AuditPortalPage = lazy(() => import("@/pages/AuditPortal"));
const QuickDeposit = lazy(() => import("@/pages/QuickDeposit"));
const QuickShipment = lazy(() => import("@/pages/QuickShipment"));
const QuickDriver = lazy(() => import("@/pages/QuickDriver"));
const QuickShip = lazy(() => import("@/pages/QuickShip"));
const ScopedAccessPortal = lazy(() => import("@/pages/ScopedAccessPortal"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Help = lazy(() => import("@/pages/Help"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const C2BPublicView = lazy(() => import("@/pages/C2BPublicView"));
const Academy = lazy(() => import("@/pages/Academy"));
const Partnerships = lazy(() => import("@/pages/Partnerships"));
const Legislation = lazy(() => import("@/pages/Legislation"));
const About = lazy(() => import("@/pages/About"));
const Journey = lazy(() => import("@/pages/Journey"));
const Laws = lazy(() => import("@/pages/Laws"));
const Policies = lazy(() => import("@/pages/Policies"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SharedDocumentView = lazy(() => import("@/pages/SharedDocumentView"));
const RecyclingHistory = lazy(() => import("@/pages/RecyclingHistory"));
const SharedResourcePage = lazy(() => import("@/pages/SharedResourcePage"));
const SharedShipmentEdit = lazy(() => import("@/pages/SharedShipmentEdit"));
const AccountPendingPage = lazy(() => import("@/pages/AccountPendingPage"));
const VerifySeal = lazy(() => import("@/pages/VerifySeal"));

const GeneratorGuide = lazy(() => import("@/pages/guide/GeneratorGuide"));
const TransporterGuide = lazy(() => import("@/pages/guide/TransporterGuide"));
const RecyclerGuide = lazy(() => import("@/pages/guide/RecyclerGuide"));
const DriverGuide = lazy(() => import("@/pages/guide/DriverGuide"));
const AdminGuide = lazy(() => import("@/pages/guide/AdminGuide"));

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/deposit/:token" element={<QuickDeposit />} />
    <Route path="/shipment/:token" element={<QuickShipment />} />
    <Route path="/driver/:token" element={<QuickDriver />} />
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
    <Route path="*" element={<NotFound />} />
  </>
);
