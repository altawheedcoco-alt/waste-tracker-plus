import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { reverseGeocodeOSM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface Coords { lat: number; lng: number; }

interface ShipmentLocationMapProps {
  pickupCoords: Coords | null;
  deliveryCoords: Coords | null;
  onPickupChange: (address: string, coords: Coords) => void;
  onDeliveryChange: (address: string, coords: Coords) => void;
  pickupAddress?: string;
  deliveryAddress?: string;
}

const pickupDivIcon = L.divIcon({
  html: '<div style="background:#22c55e;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">P</div>',
  iconSize: [22, 22], className: '',
});
const deliveryDivIcon = L.divIcon({
  html: '<div style="background:#ef4444;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;">D</div>',
  iconSize: [22, 22], className: '',
});

const ShipmentLocationMap = ({ pickupCoords, deliveryCoords, onPickupChange, onDeliveryChange, pickupAddress, deliveryAddress }: ShipmentLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) mapInstanceRef.current.remove();

    const map = L.map(mapRef.current).setView(EGYPT_CENTER, DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    mapInstanceRef.current = map;
    const bounds = L.latLngBounds([]);

    if (pickupCoords) {
      pickupMarkerRef.current = L.marker([pickupCoords.lat, pickupCoords.lng], { icon: pickupDivIcon, draggable: true })
        .addTo(map).bindPopup(pickupAddress || 'نقطة الاستلام');
      pickupMarkerRef.current.on('dragend', async () => {
        const pos = pickupMarkerRef.current!.getLatLng();
        const addr = await reverseGeocodeOSM(pos.lat, pos.lng);
        onPickupChange(addr, { lat: pos.lat, lng: pos.lng });
      });
      bounds.extend([pickupCoords.lat, pickupCoords.lng]);
    }
    if (deliveryCoords) {
      deliveryMarkerRef.current = L.marker([deliveryCoords.lat, deliveryCoords.lng], { icon: deliveryDivIcon, draggable: true })
        .addTo(map).bindPopup(deliveryAddress || 'نقطة التسليم');
      deliveryMarkerRef.current.on('dragend', async () => {
        const pos = deliveryMarkerRef.current!.getLatLng();
        const addr = await reverseGeocodeOSM(pos.lat, pos.lng);
        onDeliveryChange(addr, { lat: pos.lat, lng: pos.lng });
      });
      bounds.extend([deliveryCoords.lat, deliveryCoords.lng]);
    }

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [pickupCoords, deliveryCoords]);

  return <div ref={mapRef} style={{ height: '400px' }} className="rounded-lg border border-border" />;
};

export default ShipmentLocationMap;
