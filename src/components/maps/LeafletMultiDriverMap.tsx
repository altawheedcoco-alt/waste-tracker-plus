import { memo } from 'react';
import MapDisabledPlaceholder from './MapDisabledPlaceholder';

const LeafletMultiDriverMap = memo((_props: any) => (
  <MapDisabledPlaceholder height="100%" />
));
LeafletMultiDriverMap.displayName = 'LeafletMultiDriverMap';
export default LeafletMultiDriverMap;
