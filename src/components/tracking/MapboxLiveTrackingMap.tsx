import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const MapboxLiveTrackingMap = memo((_props: any) => (
  <MapDisabledPlaceholder height="100%" />
));
MapboxLiveTrackingMap.displayName = 'MapboxLiveTrackingMap';
export default MapboxLiveTrackingMap;
