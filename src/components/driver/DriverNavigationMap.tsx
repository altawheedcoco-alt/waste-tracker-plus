import { useRef, useEffect, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number;
  heading: number;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    bearing_before?: number;
    bearing_after?: number;
    location: [number, number];
  };
}

interface DriverNavigationMapProps {
  driverPosition: LocationState | null;
  driverHeading: number | null;
  routeCoordinates: [number, number][];
  completedCoordinates: [number, number][];
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  currentStep: RouteStep | null;
  isNavigating: boolean;
  accuracy: number | null;
}

const DriverNavigationMap = memo(({
  driverPosition,
  driverHeading,
  routeCoordinates,
  completedCoordinates,
  pickupCoords,
  deliveryCoords,
  currentStep,
  isNavigating,
  accuracy,
}: DriverNavigationMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = driverPosition
      ? [driverPosition.lng, driverPosition.lat]
      : [31.2357, 30.0444];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: defaultCenter,
      zoom: 15,
      maxBounds: [
        [EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]],
        [EGYPT_BOUNDS[2], EGYPT_BOUNDS[3]],
      ],
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Pickup marker
  useEffect(() => {
    if (!mapRef.current || !pickupCoords) return;
    const lngLat: [number, number] = [pickupCoords[1], pickupCoords[0]];
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">A</div>`;
      pickupMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setText('نقطة الاستلام'))
        .addTo(mapRef.current);
    }
  }, [pickupCoords]);

  // Delivery marker
  useEffect(() => {
    if (!mapRef.current || !deliveryCoords) return;
    const lngLat: [number, number] = [deliveryCoords[1], deliveryCoords[0]];
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">B</div>`;
      deliveryMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setText('نقطة التسليم'))
        .addTo(mapRef.current);
    }
  }, [deliveryCoords]);

  // Route polyline (remaining - gray)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      if (routeCoordinates.length < 2) return;
      const coords = routeCoordinates.map(c => [c[1], c[0]] as [number, number]);
      if (map.getSource('route-remaining')) {
        (map.getSource('route-remaining') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        });
      } else {
        map.addSource('route-remaining', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-remaining', type: 'line', source: 'route-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#9ca3af', 'line-width': 5, 'line-opacity': 0.6 },
        });
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.on('load', draw);
  }, [routeCoordinates]);

  // Completed path (green)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      if (completedCoordinates.length < 2) return;
      const coords = completedCoordinates.map(c => [c[1], c[0]] as [number, number]);
      if (map.getSource('route-completed')) {
        (map.getSource('route-completed') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        });
      } else {
        map.addSource('route-completed', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-completed', type: 'line', source: 'route-completed',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#22c55e', 'line-width': 5, 'line-opacity': 1 },
        });
      }
    };

    if (map.isStyleLoaded()) draw();
    else map.on('load', draw);
  }, [completedCoordinates]);

  // Driver marker
  useEffect(() => {
    if (!mapRef.current || !driverPosition) return;
    const lngLat: [number, number] = [driverPosition.lng, driverPosition.lat];
    const heading = driverHeading || 0;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(lngLat);
      const el = driverMarkerRef.current.getElement();
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`;
    } else {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`;
      driverMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setText('موقعك الحالي'))
        .addTo(mapRef.current);
    }

    if (isNavigating) {
      mapRef.current.panTo(lngLat);
    }
  }, [driverPosition, driverHeading, accuracy, isNavigating]);

  // Fit bounds when not navigating
  useEffect(() => {
    if (!mapRef.current || isNavigating) return;
    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = false;
    if (pickupCoords) { bounds.extend([pickupCoords[1], pickupCoords[0]]); hasPoints = true; }
    if (deliveryCoords) { bounds.extend([deliveryCoords[1], deliveryCoords[0]]); hasPoints = true; }
    if (driverPosition) { bounds.extend([driverPosition.lng, driverPosition.lat]); hasPoints = true; }
    if (hasPoints) {
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [pickupCoords, deliveryCoords, driverPosition, isNavigating]);

  return <div ref={containerRef} className="w-full h-full" />;
});

DriverNavigationMap.displayName = 'DriverNavigationMap';

export default DriverNavigationMap;
