import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const ShipmentInlineTrackingMap = memo((_props: any) => (
  <MapDisabledPlaceholder height="300px" />
));
ShipmentInlineTrackingMap.displayName = 'ShipmentInlineTrackingMap';
export default ShipmentInlineTrackingMap;
