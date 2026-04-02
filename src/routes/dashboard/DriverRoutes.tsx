import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const DriverProfile = lazyRetry(() => import('@/pages/dashboard/DriverProfile'));
const DriverData = lazyRetry(() => import('@/pages/dashboard/DriverData'));
const DriverOffers = lazyRetry(() => import('@/pages/dashboard/DriverOffers'));
const ShipmentMarket = lazyRetry(() => import('@/pages/dashboard/ShipmentMarket'));
const DriverWallet = lazyRetry(() => import('@/pages/dashboard/DriverWallet'));
const DriverAnalytics = lazyRetry(() => import('@/pages/dashboard/DriverAnalytics'));
const DriverMyRoute = lazyRetry(() => import('@/pages/dashboard/DriverMyRoute'));
const MyLocation = lazyRetry(() => import('@/pages/dashboard/MyLocation'));
const DriverAcademy = lazyRetry(() => import('@/pages/dashboard/DriverAcademy'));
const DriverRewards = lazyRetry(() => import('@/pages/dashboard/DriverRewards'));
const DriverPermits = lazyRetry(() => import('@/pages/dashboard/DriverPermits'));
const IndependentDriverOnboarding = lazyRetry(() => import('@/pages/driver/IndependentDriverOnboarding'));
const DriverTripSchedule = lazyRetry(() => import('@/pages/dashboard/DriverTripSchedule'));
const TransporterShipments = lazyRetry(() => import('@/pages/dashboard/TransporterShipments'));
const ShipmentDetails = lazyRetry(() => import('@/pages/dashboard/ShipmentDetails'));

export const driverRoutes = (
  <>
    <Route path="/dashboard/driver-profile" element={<DriverProfile />} />
    <Route path="/dashboard/driver-data" element={<DriverData />} />
    <Route path="/dashboard/driver-offers" element={<DriverOffers />} />
    <Route path="/dashboard/driver-contracts" element={<DriverOffers />} />
    <Route path="/dashboard/shipment-market" element={<ShipmentMarket />} />
    <Route path="/dashboard/driver-wallet" element={<DriverWallet />} />
    <Route path="/dashboard/driver-analytics" element={<DriverAnalytics />} />
    <Route path="/dashboard/driver-my-route" element={<DriverMyRoute />} />
    <Route path="/dashboard/my-location" element={<MyLocation />} />
    <Route path="/dashboard/driver-academy" element={<DriverAcademy />} />
    <Route path="/dashboard/driver-rewards" element={<DriverRewards />} />
    <Route path="/dashboard/driver-permits" element={<DriverPermits />} />
    <Route path="/dashboard/driver-onboarding" element={<IndependentDriverOnboarding />} />
    <Route path="/dashboard/driver-trip-schedule" element={<DriverTripSchedule />} />
    <Route path="/dashboard/transporter-shipments" element={<TransporterShipments />} />
    <Route path="/dashboard/shipments/:shipmentId" element={<ShipmentDetails />} />
    <Route path="/dashboard/s/:shipmentId" element={<ShipmentDetails />} />
  </>
);
