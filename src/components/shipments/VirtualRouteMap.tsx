import { memo } from 'react';
import LeafletShipmentTracking from '@/components/maps/LeafletShipmentTracking';

const VirtualRouteMap = memo((props: any) => (
  <LeafletShipmentTracking height="400px" {...props} />
));
VirtualRouteMap.displayName = 'VirtualRouteMap';
export default VirtualRouteMap;
