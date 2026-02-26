import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const LeafletLiveTrackingMap = memo((_props: any) => (
  <MapDisabledPlaceholder height="100%" />
));
LeafletLiveTrackingMap.displayName = 'LeafletLiveTrackingMap';
export default LeafletLiveTrackingMap;
