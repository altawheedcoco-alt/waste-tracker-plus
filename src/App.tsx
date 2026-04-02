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

// Common dashboard routes (lightweight — shared across all roles)
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
 * Resolves the import promise for role-specific routes
 * based on user roles and organization type.
 * Returns null if no role match (common routes still work).
 */
function getRoleRoutesImport(
  roles: string[],
  orgType?: string
): Promise<{ routes: React.ReactNode }> | null {
  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');

  if (isAdmin) return import('@/routes/dashboard/AdminRoutes').then(m => ({ routes: m.adminRoutes }));
  if (isDriver) return import('@/routes/dashboard/DriverRoutes').then(m => ({ routes: m.driverRoutes }));
  switch (orgType) {
    case 'transporter': return import('@/routes/dashboard/TransporterRoutes').then(m => ({ routes: m.transporterRoutes }));
    case 'generator': return import('@/routes/dashboard/GeneratorRoutes').then(m => ({ routes: m.generatorRoutes }));
    case 'recycler': return import('@/routes/dashboard/RecyclerRoutes').then(m => ({ routes: m.recyclerRoutes }));
    case 'disposal': return import('@/routes/dashboard/SpecializedRoutes').then(m => ({ routes: m.disposalRoutes }));
    case 'regulator': return import('@/routes/dashboard/SpecializedRoutes').then(m => ({ routes: m.regulatorRoutes }));
    case 'consultant':
    case 'consulting_office': return import('@/routes/dashboard/SpecializedRoutes').then(m => ({ routes: m.consultantRoutes }));
    default: return null;
  }
}

const AppRoutes = memo(() => {
  const location = useLocation();
  const { roles, organization } = useAuth();
  const orgType = organization?.organization_type;
  const isDashboard = location.pathname.startsWith('/dashboard');

  const [roleRoutes, setRoleRoutes] = useState<React.ReactNode>(null);
  const [roleKey, setRoleKey] = useState<string>('');

  // Compute a stable key for the current role
  const currentRoleKey = useMemo(() => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('driver')) return 'driver';
    return orgType || 'none';
  }, [roles, orgType]);

  // Load role-specific routes when entering dashboard and role is resolved
  useEffect(() => {
    if (!isDashboard || currentRoleKey === 'none' || currentRoleKey === roleKey) return;

    let cancelled = false;
    const importPromise = getRoleRoutesImport(roles, orgType);
    if (!importPromise) {
      setRoleKey(currentRoleKey);
      return;
    }

    importPromise
      .then(({ routes }) => {
        if (!cancelled) {
          setRoleRoutes(routes);
          setRoleKey(currentRoleKey);
        }
      })
      .catch(err => console.error('Failed to load role routes:', err));

    return () => { cancelled = true; };
  }, [isDashboard, currentRoleKey, roleKey, roles, orgType]);

  // Show loader while dashboard role routes are loading
  if (isDashboard && currentRoleKey !== 'none' && roleKey !== currentRoleKey) {
    return <PageLoader />;
  }

  return (
    <AccountActivationGuard>
      <Routes>
        {publicRoutes}
        <Route element={<DashboardRouteGuard />}>
          {commonRoutes}
          {roleRoutes}
        </Route>
      </Routes>
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
