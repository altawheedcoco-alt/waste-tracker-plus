import { memo } from 'react';
import LeafletDriverHistory from '@/components/maps/LeafletDriverHistory';

const DriverRouteVisualization = memo((props: any) => (
  <LeafletDriverHistory height="400px" {...props} />
));
DriverRouteVisualization.displayName = 'DriverRouteVisualization';
export default DriverRouteVisualization;
