import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const DriverNavigationMap = memo((_props: any) => (
  <MapDisabledPlaceholder height="100%" />
));
DriverNavigationMap.displayName = 'DriverNavigationMap';
export default DriverNavigationMap;
