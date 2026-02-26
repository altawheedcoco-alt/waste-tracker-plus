import { memo } from 'react';
import MapDisabledPlaceholder from './MapDisabledPlaceholder';

const LeafletShipmentTracking = memo(({ className, height }: { className?: string; height?: string; [key: string]: any }) => (
  <MapDisabledPlaceholder className={className} height={height} />
));
LeafletShipmentTracking.displayName = 'LeafletShipmentTracking';
export default LeafletShipmentTracking;
