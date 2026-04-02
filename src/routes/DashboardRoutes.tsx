import { Route } from 'react-router-dom';
import DashboardRouteGuard from '@/components/guards/DashboardRouteGuard';
import { essentialCommonRoutes } from './dashboard/EssentialCommonRoutes';

// Re-export for backward compat — this is the "base" set.
// Role-specific routes are added dynamically in App.tsx via lazy loading.
export const dashboardRoutes = (
  <Route element={<DashboardRouteGuard />}>
    {essentialCommonRoutes}
  </Route>
);
