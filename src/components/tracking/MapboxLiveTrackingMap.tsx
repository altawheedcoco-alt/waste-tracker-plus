import { useRef, useEffect, memo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_STYLE,
  EGYPT_BOUNDS,
  EGYPT_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface DriverMarker {
  id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  name?: string;
  isOnline: boolean;
  vehiclePlate?: string;
}

interface MapboxLiveTrackingMapProps {
  pickupCoords?: [number, number] | null;
  deliveryCoords?: [number, number] | null;
  drivers: DriverMarker[];
  routeCoords?: [number, number][];
  driverPath?: [number, number][];
  centerOnDriverId?: string | null;
  enableClustering?: boolean;
  onDriverClick?: (driverId: string) => void;
}

const MapboxLiveTrackingMap = memo(({
  pickupCoords,
  deliveryCoords,
  drivers,
  routeCoords = [],
  driverPath = [],
  centerOnDriverId,
  enableClustering = true,
  onDriverClick,
}: MapboxLiveTrackingMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const deliveryMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: EGYPT_CENTER,
      zoom: DEFAULT_ZOOM,
      maxZoom: MAX_ZOOM,
      minZoom: MIN_ZOOM,
      maxBounds: [
        [EGYPT_BOUNDS[0], EGYPT_BOUNDS[1]],
        [EGYPT_BOUNDS[2], EGYPT_BOUNDS[3]],
      ],
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-left');

    map.on('load', () => {
      // Route line source
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.8 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      // Driver path source
      map.addSource('driver-path', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} },
      });
      map.addLayer({
        id: 'driver-path-line',
        type: 'line',
        source: 'driver-path',
        paint: { 'line-color': '#22c55e', 'line-width': 3, 'line-opacity': 0.9 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });

      // Clustering source for drivers
      if (enableClustering) {
        map.addSource('drivers-cluster', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });

        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'drivers-cluster',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': ['step', ['get', 'point_count'], '#22c55e', 10, '#f59e0b', 30, '#ef4444'],
            'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'drivers-cluster',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14,
          },
          paint: { 'text-color': '#ffffff' },
        });

        // Click cluster to zoom
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          const source = map.getSource('drivers-cluster') as mapboxgl.GeoJSONSource;
          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !features[0].geometry || features[0].geometry.type !== 'Point') return;
            map.easeTo({
              center: features[0].geometry.coordinates as [number, number],
              zoom: zoom ?? 14,
            });
          });
        });

        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [enableClustering]);

  // Update pickup marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (pickupCoords) {
      const lngLat: [number, number] = [pickupCoords[1], pickupCoords[0]]; // convert [lat,lng] to [lng,lat]
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.setLngLat(lngLat);
      } else {
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">A</div>`;
        pickupMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(lngLat)
          .setPopup(new mapboxgl.Popup({ offset: 10 }).setText('نقطة الاستلام'))
          .addTo(mapRef.current);
      }
    }
  }, [pickupCoords]);

  // Update delivery marker
  useEffect(() => {
    if (!mapRef.current) return;
    if (deliveryCoords) {
      const lngLat: [number, number] = [deliveryCoords[1], deliveryCoords[0]];
      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.setLngLat(lngLat);
      } else {
        const el = document.createElement('div');
        el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;color:white;font-size:12px;">B</div>`;
        deliveryMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(lngLat)
          .setPopup(new mapboxgl.Popup({ offset: 10 }).setText('نقطة التسليم'))
          .addTo(mapRef.current);
      }
    }
  }, [deliveryCoords]);

  // Update route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || routeCoords.length < 2) return;
    const source = map.getSource('route') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      const coords = routeCoords.map(c => [c[1], c[0]]); // [lat,lng] → [lng,lat]
      source.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      });

      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach(c => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [routeCoords]);

  // Update driver path
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || driverPath.length < 2) return;
    const source = map.getSource('driver-path') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: driverPath.map(c => [c[1], c[0]]) },
        properties: {},
      });
    }
  }, [driverPath]);

  // Update driver markers
  const updateDriverMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (enableClustering && map.isStyleLoaded()) {
      // Use GeoJSON source for clustering
      const source = map.getSource('drivers-cluster') as mapboxgl.GeoJSONSource | undefined;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: drivers.map(d => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [d.longitude, d.latitude] },
            properties: { id: d.id, name: d.name || '', isOnline: d.isOnline, plate: d.vehiclePlate || '' },
          })),
        });
      }
    }

    // Individual markers (for non-clustered or unclustered points)
    const activeIds = new Set(drivers.map(d => d.id));

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Update or create markers
    drivers.forEach(driver => {
      const lngLat: [number, number] = [driver.longitude, driver.latitude];
      const existing = markersRef.current.get(driver.id);

      if (existing) {
        existing.setLngLat(lngLat);
        // Update rotation
        const el = existing.getElement();
        const arrow = el.querySelector('.driver-arrow') as HTMLElement;
        if (arrow) arrow.style.transform = `rotate(${driver.heading || 0}deg)`;
        // Update color
        const circle = el.querySelector('.driver-circle') as HTMLElement;
        if (circle) circle.style.background = driver.isOnline ? '#22c55e' : '#6b7280';
      } else if (!enableClustering) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div class="driver-circle" style="width:24px;height:24px;border-radius:50%;background:${driver.isOnline ? '#22c55e' : '#6b7280'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <div class="driver-arrow" style="transform:rotate(${driver.heading || 0}deg);">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
            </div>
          </div>`;
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => onDriverClick?.(driver.id));

        const popup = new mapboxgl.Popup({ offset: 10 }).setHTML(
          `<div style="direction:rtl;font-family:sans-serif;">
            <strong>${driver.name || 'سائق'}</strong><br/>
            ${driver.vehiclePlate ? `<span>🚛 ${driver.vehiclePlate}</span><br/>` : ''}
            ${driver.speed ? `<span>⚡ ${Math.round(driver.speed)} كم/س</span>` : ''}
          </div>`
        );

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(lngLat)
          .setPopup(popup)
          .addTo(map);

        markersRef.current.set(driver.id, marker);
      }
    });

    // Center on specific driver
    if (centerOnDriverId) {
      const target = drivers.find(d => d.id === centerOnDriverId);
      if (target) {
        map.easeTo({ center: [target.longitude, target.latitude], zoom: 15, duration: 500 });
      }
    }
  }, [drivers, enableClustering, centerOnDriverId, onDriverClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      updateDriverMarkers();
    } else {
      map.once('load', updateDriverMarkers);
    }
  }, [updateDriverMarkers]);

  return <div ref={containerRef} className="w-full h-full" />;
});

MapboxLiveTrackingMap.displayName = 'MapboxLiveTrackingMap';
export default MapboxLiveTrackingMap;
