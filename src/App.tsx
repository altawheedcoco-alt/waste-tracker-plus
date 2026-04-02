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

// Retry wrapper for lazy imports
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

// Smart QueryClient
import { createSmartQueryClient } from '@/lib/queryCacheConfig';
const queryClient = createSmartQueryClient();

// Public routes only at startup — NO dashboard routes loaded here
import { publicRoutes } from "@/routes/PublicRoutes";

// Core routes are ultra-light (Dashboard, Settings, Notifications, Chat + catch-all)
import { coreRoutes } from "@/routes/dashboard/CoreRoutes";

// Essential common routes — tiny set every user needs (workspace, profile, support)
import { essentialCommonRoutes } from "@/routes/dashboard/EssentialCommonRoutes";

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
 * Resolves role-specific + common + extended route imports.
 * Returns a combined set of routes for the user's role.
 */
function getDashboardRouteImports(
  roles: string[],
  orgType?: string
): Promise<React.ReactNode>[] {
  const imports: Promise<React.ReactNode>[] = [];

  const isAdmin = roles.includes('admin');
  const isDriver = roles.includes('driver');

  // Drivers get ONLY their specific routes — no common/extended bloat
  if (isDriver) {
    imports.push(import('@/routes/dashboard/DriverRoutes').then(m => m.driverRoutes));
    return imports;
  }

  // Non-driver users get deferred common routes + extended routes
  imports.push(
    import('@/routes/dashboard/DeferredCommonRoutes').then(m => m.deferredCommonRoutes)
  );
  imports.push(
    import('@/routes/dashboard/ExtendedRoutes').then(m => m.extendedRoutes)
  );

  // Role-specific routes
  if (isAdmin) {
    imports.push(import('@/routes/dashboard/AdminRoutes').then(m => m.adminRoutes));
  } else {
    switch (orgType) {
      case 'transporter':
        imports.push(import('@/routes/dashboard/TransporterRoutes').then(m => m.transporterRoutes));
        break;
      case 'generator':
        imports.push(import('@/routes/dashboard/GeneratorRoutes').then(m => m.generatorRoutes));
        break;
      case 'recycler':
        imports.push(import('@/routes/dashboard/RecyclerRoutes').then(m => m.recyclerRoutes));
        break;
      case 'disposal':
        imports.push(import('@/routes/dashboard/SpecializedRoutes').then(m => m.disposalRoutes));
        break;
      case 'regulator':
        imports.push(import('@/routes/dashboard/SpecializedRoutes').then(m => m.regulatorRoutes));
        break;
      case 'consultant':
      case 'consulting_office':
        imports.push(import('@/routes/dashboard/SpecializedRoutes').then(m => m.consultantRoutes));
        break;
    }
  }

  return imports;
}

const AppRoutes = memo(() => {
  const location = useLocation();
  const { roles, organization } = useAuth();
  const orgType = organization?.organization_type;
  const isDashboard = location.pathname.startsWith('/dashboard');

  const [roleRoutes, setRoleRoutes] = useState<React.ReactNode[]>([]);
  const [roleKey, setRoleKey] = useState<string>('');

  // Compute stable key for current role
  const currentRoleKey = useMemo(() => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('driver')) return 'driver';
    return orgType || 'none';
  }, [roles, orgType]);

  // Load role-specific routes only when entering dashboard
  useEffect(() => {
    if (!isDashboard || currentRoleKey === 'none' || currentRoleKey === roleKey) return;

    let cancelled = false;
    const imports = getDashboardRouteImports(roles, orgType);

    Promise.all(imports)
      .then((routeNodes) => {
        if (!cancelled) {
          setRoleRoutes(routeNodes);
          setRoleKey(currentRoleKey);
        }
      })
      .catch(err => console.error('Failed to load dashboard routes:', err));

    return () => { cancelled = true; };
  }, [isDashboard, currentRoleKey, roleKey, roles, orgType]);

  // Show loader while dashboard routes are loading
  if (isDashboard && currentRoleKey !== 'none' && roleKey !== currentRoleKey) {
    return <PageLoader />;
  }

  return (
    <AccountActivationGuard>
      <Routes>
        {publicRoutes}
        <Route element={<DashboardRouteGuard />}>
          {coreRoutes}
          {roleRoutes.map((routes, i) => (
            <>{routes}</>
          ))}
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
