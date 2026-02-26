import { memo } from 'react';
import LeafletMiniMap from './LeafletMiniMap';

const MapboxMapComponent = memo(({ latitude, longitude, zoom, className, height, label, ...rest }: any) => (
  <LeafletMiniMap
    latitude={latitude || 26.8}
    longitude={longitude || 30.8}
    zoom={zoom}
    className={className}
    height={height || '400px'}
    label={label}
    {...rest}
  />
));
MapboxMapComponent.displayName = 'MapboxMapComponent';
export default MapboxMapComponent;
