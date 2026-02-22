import { useRef, useEffect } from 'react';
import L from 'leaflet';

interface LeafletMiniMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const LeafletMiniMap = ({ latitude, longitude, accuracy }: LeafletMiniMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);
    }

    mapRef.current.setView([latitude, longitude]);

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.circleMarker([latitude, longitude], {
        radius: 10, fillColor: '#22c55e', fillOpacity: 1, color: 'white', weight: 3,
      }).addTo(mapRef.current);
    }

    if (accuracy) {
      if (circleRef.current) {
        circleRef.current.setLatLng([latitude, longitude]);
        circleRef.current.setRadius(accuracy);
      } else {
        circleRef.current = L.circle([latitude, longitude], {
          radius: accuracy, fillColor: '#22c55e', fillOpacity: 0.15, color: '#22c55e', weight: 1, opacity: 0.5,
        }).addTo(mapRef.current);
      }
    }

    return () => {};
  }, [latitude, longitude, accuracy]);

  useEffect(() => {
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  return <div ref={containerRef} className="h-40 rounded-lg overflow-hidden border" />;
};

export default LeafletMiniMap;
