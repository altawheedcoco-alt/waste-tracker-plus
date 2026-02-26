import { lazy } from "react";
import { Route } from "react-router-dom";

const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
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
const SavedLocationsPage = lazy(() => import("@/pages/SavedLocationsPage"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Help = lazy(() => import("@/pages/Help"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const Blog = lazy(() => import("@/pages/Blog"));
const Academy = lazy(() => import("@/pages/Academy"));
const Partnerships = lazy(() => import("@/pages/Partnerships"));
const Legislation = lazy(() => import("@/pages/Legislation"));
const About = lazy(() => import("@/pages/About"));
const Laws = lazy(() => import("@/pages/Laws"));

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
    <Route path="/academy" element={<Academy />} />
    <Route path="/partnerships" element={<Partnerships />} />
    <Route path="/legislation" element={<Legislation />} />
    <Route path="/laws" element={<Laws />} />
    <Route path="/about" element={<About />} />
    <Route path="*" element={<NotFound />} />
  </>
);
