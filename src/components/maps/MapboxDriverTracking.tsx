import { memo } from 'react';
import MapDisabledPlaceholder from './MapDisabledPlaceholder';

const MapboxDriverTracking = memo((_props: any) => (
  <MapDisabledPlaceholder height="100%" />
));
MapboxDriverTracking.displayName = 'MapboxDriverTracking';
export default MapboxDriverTracking;
