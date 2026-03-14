import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { DashboardErrorBoundary } from '@/components/shared/DashboardErrorBoundary';
import RoutePermissionGuard from '@/components/common/RoutePermissionGuard';

/**
 * Layout route guard that wraps ALL dashboard sub-routes with:
 * 1. ProtectedRoute — redirects unauthenticated users to /auth
 * 2. DashboardErrorBoundary — catches render errors per-page
 * 3. RoutePermissionGuard — blocks employees from unauthorized pages
 * 4. Suspense — shows loader while lazy chunks load
 */
const DashboardRouteGuard = () => (
  <ProtectedRoute>
    <DashboardErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <RoutePermissionGuard>
          <Outlet />
        </RoutePermissionGuard>
      </Suspense>
    </DashboardErrorBoundary>
  </ProtectedRoute>
);

export default DashboardRouteGuard;
