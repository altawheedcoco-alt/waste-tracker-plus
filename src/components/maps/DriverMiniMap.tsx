import { useRef, useEffect } from 'react';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { Loader2 } from 'lucide-react';

interface DriverMiniMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const DriverMiniMap = ({ latitude, longitude, accuracy }: DriverMiniMapProps) => {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
    }

    // Update center
    mapRef.current.setCenter({ lat: latitude, lng: longitude });

    // Update marker
    if (markerRef.current) {
      markerRef.current.setPosition({ lat: latitude, lng: longitude });
    } else {
      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
      });
    }

    // Update accuracy circle
    if (accuracy) {
      if (circleRef.current) {
        circleRef.current.setCenter({ lat: latitude, lng: longitude });
        circleRef.current.setRadius(accuracy);
      } else {
        circleRef.current = new google.maps.Circle({
          map: mapRef.current,
          center: { lat: latitude, lng: longitude },
          radius: accuracy,
          fillColor: '#22c55e',
          fillOpacity: 0.15,
          strokeColor: '#22c55e',
          strokeOpacity: 0.5,
          strokeWeight: 1,
        });
      }
    }
  }, [isLoaded, latitude, longitude, accuracy]);

  if (!isLoaded) {
    return (
      <div className="h-40 rounded-lg bg-muted flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-40 rounded-lg overflow-hidden border" />
  );
};

export default DriverMiniMap;
