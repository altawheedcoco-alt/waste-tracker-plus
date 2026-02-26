import { memo } from 'react';
import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

const LeafletDriverHistory = memo((_props: any) => (
  <MapDisabledPlaceholder height="400px" />
));
LeafletDriverHistory.displayName = 'LeafletDriverHistory';
export default LeafletDriverHistory;
