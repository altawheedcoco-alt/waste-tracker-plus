import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const HRPayroll = lazyRetry(() => import('@/pages/dashboard/hr/HRPayroll'));
const HRPerformance = lazyRetry(() => import('@/pages/dashboard/hr/HRPerformance'));
const HRShifts = lazyRetry(() => import('@/pages/dashboard/hr/HRShifts'));
const HROrgChart = lazyRetry(() => import('@/pages/dashboard/hr/HROrgChart'));
const HREndOfService = lazyRetry(() => import('@/pages/dashboard/hr/HREndOfService'));
const HRSelfService = lazyRetry(() => import('@/pages/dashboard/hr/HRSelfService'));

export const hrRoutes = (
  <>
    <Route path="/dashboard/hr/payroll" element={<HRPayroll />} />
    <Route path="/dashboard/hr/performance" element={<HRPerformance />} />
    <Route path="/dashboard/hr/shifts" element={<HRShifts />} />
    <Route path="/dashboard/hr/org-chart" element={<HROrgChart />} />
    <Route path="/dashboard/hr/end-of-service" element={<HREndOfService />} />
    <Route path="/dashboard/hr/self-service" element={<HRSelfService />} />
  </>
);
