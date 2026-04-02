import { Suspense, lazy, memo, useEffect, useRef, useState, useMemo } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import AccountActivationGuard from "@/components/guards/AccountActivationGuard";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { shouldEnablePWA } from "@/lib/pwaRuntime";
import InstallPWA from "./components/pwa/InstallPWA";
import PWAUpdatePrompt from "./components/pwa/PWAUpdatePrompt";
import { AutoPushSubscriber } from "./components/pwa/AutoPushSubscriber";
import PushPermissionBanner from "./components/pwa/PushPermissionBanner";
import MobileEnhancements from "./components/mobile/MobileEnhancements";
import DashboardRouteGuard from "@/components/guards/DashboardRouteGuard";

// Retry wrapper for lazy imports (handles stale cache / network glitches)
const lazyRetry = (factory: () => Promise<any>, retries = 2): Promise<any> =>
  factory().catch((err: any) => {
    if (retries > 0) {
      return new Promise(r => setTimeout(r, 500)).then(() => lazyRetry(factory, retries - 1));
    }
    throw err;
  });

// Offline components (lightweight, keep global)
const OfflineBanner = lazy(() => lazyRetry(() => import("./components/offline/OfflineBanner")));
const ScrollToTopButton = lazy(() => lazyRetry(() => import("./components/ui/ScrollToTopButton")));
const CodeProtection = lazy(() => lazyRetry(() => import("./components/security/CodeProtection")));
const ProductionReadiness = lazy(() => lazyRetry(() => import("./components/production/ProductionReadiness")));
const SoundIntegrator = lazy(() => lazyRetry(() => import("./components/SoundIntegrator")));

// Minimal loading component
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
PageLoader.displayName = 'PageLoader';

// Smart QueryClient with adaptive caching per data category
import { createSmartQueryClient } from '@/lib/queryCacheConfig';
const queryClient = createSmartQueryClient();

// Public routes only at startup
import { publicRoutes } from "@/routes/PublicRoutes";

// Common dashboard routes (lightweight — settings, notifications, chat, etc.)
import { commonRoutes } from "@/routes/dashboard/CommonRoutes";

// Smart scroll restoration
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { usePageTracking } from '@/hooks/usePageTracking';
import { initGA4 } from '@/lib/analytics';
const ScrollRestore = () => {
  useScrollRestoration();
  usePageTracking();
  return null;
};

/**
 * Resolves which role-specific route module to lazy-load
 * based on user roles and organization type.
 */
function useRoleRoutes() {
  const { roles, organization } = useAuth();
  const orgType = organization?.organization_type;
  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');

  return useMemo(() => {
    if (isAdmin) return lazy(() => import('@/routes/dashboard/AdminRoutes').then(m => ({ default: () => <>{m.adminRoutes}</> })));
    if (isDriver) return lazy(() => import('@/routes/dashboard/DriverRoutes').then(m => ({ default: () => <>{m.driverRoutes}</> })));
    switch (orgType) {
      case 'transporter': return lazy(() => import('@/routes/dashboard/TransporterRoutes').then(m => ({ default: () => <>{m.transporterRoutes}</> })));
      case 'generator': return lazy(() => import('@/routes/dashboard/GeneratorRoutes').then(m => ({ default: () => <>{m.generatorRoutes}</> })));
      case 'recycler': return lazy(() => import('@/routes/dashboard/RecyclerRoutes').then(m => ({ default: () => <>{m.recyclerRoutes}</> })));
      case 'disposal': return lazy(() => import('@/routes/dashboard/SpecializedRoutes').then(m => ({ default: () => <>{m.disposalRoutes}</> })));
      case 'regulator': return lazy(() => import('@/routes/dashboard/SpecializedRoutes').then(m => ({ default: () => <>{m.regulatorRoutes}</> })));
      case 'consultant':
      case 'consulting_office': return lazy(() => import('@/routes/dashboard/SpecializedRoutes').then(m => ({ default: () => <>{m.consultantRoutes}</> })));
      default: return null;
    }
  }, [isAdmin, isDriver, orgType]);
}

/**
 * RoleRoutesRenderer — injects role-specific <Route> elements
 * as children inside the DashboardRouteGuard layout route.
 * Uses React.lazy to only load the relevant role's route file.
 */
const RoleRoutesRenderer = memo(() => {
  const RoleComponent = useRoleRoutes();
  if (!RoleComponent) return null;
  return (
    <Suspense fallback={null}>
      <RoleComponent />
    </Suspense>
  );
});
RoleRoutesRenderer.displayName = 'RoleRoutesRenderer';

const AppRoutes = memo(() => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (!isDashboard) {
    return (
      <AccountActivationGuard>
        <Routes>
          {publicRoutes}
        </Routes>
      </AccountActivationGuard>
    );
  }

  return (
    <AccountActivationGuard>
      <Routes>
        {publicRoutes}
        <Route element={<DashboardRouteGuard />}>
          {commonRoutes}
          {/* Role-specific routes rendered as fragment */}
        </Route>
      </Routes>
      <RoleRoutesRenderer />
    </AccountActivationGuard>
  );
});
AppRoutes.displayName = 'AppRoutes';

const Providers = memo(() => (
  <ErrorBoundary fallbackTitle="حدث خطأ غير متوقع في التطبيق">
    <QueryClientProvider client={queryClient}>
      <ThemeSettingsProvider>
        <ViewModeProvider>
        <LanguageProvider>
          <TooltipProvider delayDuration={300}>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthProvider>
                <ErrorBoundary fallbackTitle="حدث خطأ في تحميل الصفحة">
                  <ScrollRestore />
                  <Suspense fallback={null}><SoundIntegrator /></Suspense>
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </ErrorBoundary>
                <Suspense fallback={null}>
                  <OfflineBanner />
                  {/* ScrollToTopButton moved to FloatingSidePanel */}
                  <CodeProtection />
                  <ProductionReadiness />
                </Suspense>
                {shouldEnablePWA() ? <InstallPWA /> : null}
                {shouldEnablePWA() ? <PWAUpdatePrompt /> : null}
                <AutoPushSubscriber />
                <PushPermissionBanner />
                <MobileEnhancements />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
        </ViewModeProvider>
      </ThemeSettingsProvider>
    </QueryClientProvider>
  </ErrorBoundary>
));
Providers.displayName = 'Providers';

const App = memo(() => {
  const cacheCleared = useRef(false);
  useEffect(() => {
    if (cacheCleared.current) return;
    cacheCleared.current = true;
    import('@/lib/cacheBuster').then(m => m.bustStaleCaches());
    initGA4();
  }, []);
  return <Providers />;
});
App.displayName = 'App';

export default App;
