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

interface LeafletLiveTrackingMapProps {
  pickupCoords: [number, number] | null;
  deliveryCoords: [number, number] | null;
  driverLocation: { latitude: number; longitude: number; heading: number | null } | null;
  driverPath: [number, number][];
  routeCoords: [number, number][];
  centerOnDriver: boolean;
  isDriverOnline: boolean;
}

const LeafletLiveTrackingMap = memo(({
  pickupCoords, deliveryCoords, driverLocation, driverPath, routeCoords, centerOnDriver, isDriverOnline,
}: LeafletLiveTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: [30.8, 26.8],
      zoom: 6,
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

  // Route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    const addRoute = () => {
      if (routeCoords.length < 2) return;
      const coords = routeCoords.map(c => [c[1], c[0]] as [number, number]);
      
      if (map.getSource('route-line')) {
        (map.getSource('route-line') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        });
      } else {
        map.addSource('route-line', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'route-line', type: 'line', source: 'route-line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.8 },
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, { padding: 50 });
    };

    if (map.isStyleLoaded()) addRoute();
    else map.on('load', addRoute);
  }, [routeCoords]);

  // Driver path (completed)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || driverPath.length < 2) return;
    const coords = driverPath.map(c => [c[1], c[0]] as [number, number]);

    const addPath = () => {
      if (map.getSource('driver-path')) {
        (map.getSource('driver-path') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        });
      } else {
        map.addSource('driver-path', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } },
        });
        map.addLayer({
          id: 'driver-path', type: 'line', source: 'driver-path',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#22c55e', 'line-width': 3, 'line-opacity': 0.9 },
        });
      }
    };

    if (map.isStyleLoaded()) addPath();
    else map.on('load', addPath);
  }, [driverPath]);

  // Driver marker
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;
    const lngLat: [number, number] = [driverLocation.longitude, driverLocation.latitude];
    const color = isDriverOnline ? '#22c55e' : '#6b7280';
    const heading = driverLocation.heading || 0;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat(lngLat);
      const el = driverMarkerRef.current.getElement();
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`;
    } else {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg></div>`;
      driverMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setText('موقع السائق'))
        .addTo(mapRef.current);
    }

    if (centerOnDriver) {
      mapRef.current.panTo(lngLat);
    }
  }, [driverLocation, centerOnDriver, isDriverOnline]);

  return <div ref={containerRef} className="w-full h-full" />;
});

LeafletLiveTrackingMap.displayName = 'LeafletLiveTrackingMap';
export default LeafletLiveTrackingMap;
