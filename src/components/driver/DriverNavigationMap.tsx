import { memo } from 'react';
import LeafletShipmentTracking from '@/components/maps/LeafletShipmentTracking';

const DriverNavigationMap = memo((props: any) => (
  <LeafletShipmentTracking height="100%" {...props} />
));
DriverNavigationMap.displayName = 'DriverNavigationMap';
export default DriverNavigationMap;
