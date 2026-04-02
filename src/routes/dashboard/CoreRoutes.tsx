import { Route, Navigate } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

// Only truly essential routes every user needs on first load
const Dashboard = lazyRetry(() => import('@/pages/Dashboard'));
const Notifications = lazyRetry(() => import('@/pages/dashboard/Notifications'));
const Settings = lazyRetry(() => import('@/pages/dashboard/Settings'));
const Chat = lazyRetry(() => import('@/pages/dashboard/Chat'));
const NotFound = lazyRetry(() => import('@/pages/NotFound'));

export const coreRoutes = (
  <>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/dashboard/notifications" element={<Notifications />} />
    <Route path="/dashboard/settings" element={<Settings />} />
    <Route path="/dashboard/chat" element={<Chat />} />
    <Route path="/dashboard/org-profile/:id" element={<Navigate to="/dashboard/organization-profile" replace />} />
    <Route path="/dashboard/employees" element={<Navigate to="/dashboard/org-structure" replace />} />
    <Route path="/dashboard/team-credentials" element={<Navigate to="/dashboard/org-structure" replace />} />
    <Route path="/dashboard/smart-archive" element={<Navigate to="/dashboard/document-center?tab=smart-archive" replace />} />
    <Route path="/dashboard/central-registry" element={<Navigate to="/dashboard/document-center?tab=registry" replace />} />
    {/* Catch-all */}
    <Route path="/dashboard/*" element={<NotFound />} />
  </>
);
