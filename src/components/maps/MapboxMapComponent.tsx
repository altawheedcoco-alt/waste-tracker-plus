import { memo } from 'react';
import MapDisabledPlaceholder from './MapDisabledPlaceholder';

const MapboxMapComponent = memo(({ className, height }: any) => (
  <MapDisabledPlaceholder className={className} height={height || '400px'} />
));
MapboxMapComponent.displayName = 'MapboxMapComponent';
export default MapboxMapComponent;
