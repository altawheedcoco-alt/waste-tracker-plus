import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION, EGYPT_CENTER, DEFAULT_ZOOM } from '@/lib/leafletConfig';
import { reverseGeocodeOSM } from '@/lib/leafletConfig';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

interface MapboxLocationPickerProps {
  onLocationSelect?: (coords: { lat: number; lng: number }, address: string) => void;
  initialCoords?: { lat: number; lng: number };
  height?: string;
  className?: string;
  [key: string]: any;
}

const MapboxLocationPicker = ({ onLocationSelect, initialCoords, height = '400px', className }: MapboxLocationPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const center = initialCoords ? [initialCoords.lat, initialCoords.lng] as [number, number] : EGYPT_CENTER;
    const map = L.map(mapRef.current).setView(center, initialCoords ? 14 : DEFAULT_ZOOM);
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);

    if (initialCoords) {
      markerRef.current = L.marker([initialCoords.lat, initialCoords.lng], { draggable: true }).addTo(map);
    }

    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      }
      const address = await reverseGeocodeOSM(lat, lng);
      onLocationSelect?.({ lat, lng }, address);
    });

    return () => { map.remove(); };
  }, [initialCoords]);

  return <div ref={mapRef} className={className} style={{ height }} />;
};

export default MapboxLocationPicker;
