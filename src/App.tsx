import { Suspense, lazy, memo, useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import AccountActivationGuard from "@/components/guards/AccountActivationGuard";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Offline components (lightweight, keep global)
const OfflineBanner = lazy(() => import("./components/offline/OfflineBanner"));
const ScrollToTopButton = lazy(() => import("./components/ui/ScrollToTopButton"));
const CodeProtection = lazy(() => import("./components/security/CodeProtection"));
const InstallPWA = lazy(() => import("./components/pwa/InstallPWA"));
const PWAUpdatePrompt = lazy(() => import("./components/pwa/PWAUpdatePrompt"));
const ProductionReadiness = lazy(() => import("./components/production/ProductionReadiness"));

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

// Public routes only at startup; dashboard routes loaded on demand
import { publicRoutes } from "@/routes/PublicRoutes";

const AppRoutes = memo(() => {
  const location = useLocation();
  const [dashboardRoutes, setDashboardRoutes] = useState<React.ReactNode>(null);
  const [dashboardRoutesLoaded, setDashboardRoutesLoaded] = useState(false);

  const needsDashboardRoutes = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    let cancelled = false;

    if (!needsDashboardRoutes || dashboardRoutesLoaded) {
      return;
    }

    import('@/routes/DashboardRoutes')
      .then((mod) => {
        if (cancelled) return;
        setDashboardRoutes(mod.dashboardRoutes);
        setDashboardRoutesLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load dashboard routes:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [needsDashboardRoutes, dashboardRoutesLoaded]);

  if (needsDashboardRoutes && !dashboardRoutesLoaded) {
    return <PageLoader />;
  }

  return (
    <AccountActivationGuard>
      <Routes>
        {publicRoutes}
        {dashboardRoutes}
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
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </ErrorBoundary>
                <Suspense fallback={null}>
                  <OfflineBanner />
                  <ScrollToTopButton />
                  <CodeProtection />
                  <InstallPWA />
                  <PWAUpdatePrompt />
                  <ProductionReadiness />
                </Suspense>
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

const App = memo(() => (
  <Providers />
));
App.displayName = 'App';

export default App;

