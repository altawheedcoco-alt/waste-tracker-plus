import { Suspense, lazy, memo } from "react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Offline components (lightweight, keep global)
const OfflineBanner = lazy(() => import("./components/offline/OfflineBanner"));
const ScrollToTopButton = lazy(() => import("./components/ui/ScrollToTopButton"));

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

// Public routes loaded statically (lightweight)
import { publicRoutes } from "@/routes/PublicRoutes";

// Dashboard routes loaded lazily - only when user navigates to /dashboard/*
const LazyDashboardRoutes = lazy(() => 
  import("@/routes/DashboardRoutes").then(m => ({
    default: memo(() => <>{m.dashboardRoutes}</>)
  }))
);

const AppRoutes = memo(() => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');
  
  return (
    <Routes>
      {publicRoutes}
      {isDashboard && (
        <Suspense fallback={<PageLoader />}>
          <LazyDashboardRoutes />
        </Suspense>
      )}
    </Routes>
  );
});
AppRoutes.displayName = 'AppRoutes';

const Providers = memo(() => (
  <ErrorBoundary fallbackTitle="حدث خطأ غير متوقع في التطبيق">
    <QueryClientProvider client={queryClient}>
      <ThemeSettingsProvider>
        <LanguageProvider>
          <TooltipProvider delayDuration={300}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <ErrorBoundary fallbackTitle="حدث خطأ في تحميل الصفحة">
                  <Suspense fallback={<PageLoader />}>
                    <AppRoutes />
                  </Suspense>
                </ErrorBoundary>
                <Suspense fallback={null}>
                  <OfflineBanner />
                  <ScrollToTopButton />
                </Suspense>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
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
