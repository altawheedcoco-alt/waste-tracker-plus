import { memo } from 'react';
import LeafletShipmentTracking from './LeafletShipmentTracking';

const MapboxDriverTracking = memo((props: any) => (
  <LeafletShipmentTracking {...props} />
));
MapboxDriverTracking.displayName = 'MapboxDriverTracking';
export default MapboxDriverTracking;
