import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const DriverRouteVisualization = memo((_props: any) => (
  <MapDisabledPlaceholder height="400px" />
));
DriverRouteVisualization.displayName = 'DriverRouteVisualization';
export default DriverRouteVisualization;
