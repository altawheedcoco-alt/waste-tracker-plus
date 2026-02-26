import MapDisabledPlaceholder from '@/components/maps/MapDisabledPlaceholder';

interface Coords { lat: number; lng: number; }

interface ShipmentLocationMapProps {
  pickupCoords: Coords | null;
  deliveryCoords: Coords | null;
  onPickupChange: (address: string, coords: Coords) => void;
  onDeliveryChange: (address: string, coords: Coords) => void;
  pickupAddress?: string;
  deliveryAddress?: string;
}

const ShipmentLocationMap = (_props: ShipmentLocationMapProps) => (
  <MapDisabledPlaceholder height="400px" />
);

export default ShipmentLocationMap;
