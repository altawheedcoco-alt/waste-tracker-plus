import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DriverMiniMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const DriverMiniMap = ({ latitude, longitude, accuracy }: DriverMiniMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map only once
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      }).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
    }

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      const driverIcon = L.divIcon({
        className: 'driver-location-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <div style="
              position: absolute;
              width: 40px;
              height: 40px;
              background: radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%);
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
            <div style="
              width: 24px;
              height: 24px;
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      markerRef.current = L.marker([latitude, longitude], { icon: driverIcon }).addTo(mapInstance.current);
    }

    // Update or create accuracy circle
    if (accuracy) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng([latitude, longitude]);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy,
          color: '#22c55e',
          fillColor: '#22c55e',
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(mapInstance.current);
      }
    }

    // Pan to new location
    mapInstance.current.setView([latitude, longitude], 15);

    return () => {
      // Cleanup on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
        accuracyCircleRef.current = null;
      }
    };
  }, [latitude, longitude, accuracy]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-40 rounded-lg overflow-hidden border"
        style={{ zIndex: 0 }}
      />
    </>
  );
};

export default DriverMiniMap;
