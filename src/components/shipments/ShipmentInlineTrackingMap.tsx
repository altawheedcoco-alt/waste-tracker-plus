import { memo } from 'react';
import LeafletShipmentTracking from '@/components/maps/LeafletShipmentTracking';

const ShipmentInlineTrackingMap = memo((props: any) => (
  <LeafletShipmentTracking height="300px" {...props} />
));
ShipmentInlineTrackingMap.displayName = 'ShipmentInlineTrackingMap';
export default ShipmentInlineTrackingMap;
