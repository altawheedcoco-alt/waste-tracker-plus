import MapDisabledPlaceholder from './MapDisabledPlaceholder';

interface MapboxLocationPickerProps {
  onLocationSelect?: (coords: { lat: number; lng: number }, address: string) => void;
  initialCoords?: { lat: number; lng: number };
  height?: string;
  className?: string;
  [key: string]: any;
}

const MapboxLocationPicker = ({ height, className }: MapboxLocationPickerProps) => (
  <MapDisabledPlaceholder className={className} height={height || '400px'} />
);

export default MapboxLocationPicker;
