import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const VirtualRouteMap = memo((_props: any) => (
  <MapDisabledPlaceholder height="400px" />
));
VirtualRouteMap.displayName = 'VirtualRouteMap';
export default VirtualRouteMap;
