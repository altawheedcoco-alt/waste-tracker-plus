// This file is deprecated. Use FreeInteractiveMap instead.
// Keeping for backwards compatibility - redirects to free alternative.

import FreeInteractiveMap from './FreeInteractiveMap';

interface GoogleMapsLocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }, address?: string) => void;
  height?: string;
  showSearch?: boolean;
  label?: string;
}

/**
 * @deprecated Use FreeInteractiveMap directly instead.
 * This component now uses Mapbox GL JS.
 */
const GoogleMapsLocationPicker = ({
  value,
  onChange,
  height = '400px',
  showSearch = true,
}: GoogleMapsLocationPickerProps) => {
  return (
    <FreeInteractiveMap
      center={value || { lat: 30.0444, lng: 31.2357 }}
      selectedPosition={value}
      onPositionSelect={onChange}
      showSearch={showSearch}
      showCurrentLocation={true}
      height={height}
    />
  );
};

export default GoogleMapsLocationPicker;
