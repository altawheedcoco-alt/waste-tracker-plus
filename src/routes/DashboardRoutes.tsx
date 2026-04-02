import { Route } from 'react-router-dom';
import DashboardRouteGuard from '@/components/guards/DashboardRouteGuard';
import { commonRoutes } from './dashboard/CommonRoutes';

// Re-export for backward compat — this is the "base" set.
// Role-specific routes are added dynamically in App.tsx via lazy loading.
export const dashboardRoutes = (
  <Route element={<DashboardRouteGuard />}>
    {commonRoutes}
  </Route>
);
