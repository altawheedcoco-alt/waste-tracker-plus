import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import type { MapRef, CircleLayer, LineLayer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

const arabicLocale = {
  'NavigationControl.ZoomIn': 'تكبير',
  'NavigationControl.ZoomOut': 'تصغير',
  'NavigationControl.ResetBearing': 'إعادة تعيين الاتجاه',
  'GeolocateControl.FindMyLocation': 'موقعي',
  'GeolocateControl.LocationNotAvailable': 'الموقع غير متاح',
};

interface MapboxNavigationDemoProps {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  currentPosition: [number, number];
  heading: number;
  completedRoute: [number, number][];
  remainingRoute: [number, number][];
  steps: Array<{
    maneuver?: { location: [number, number] };
    instruction: string;
    distance: number;
  }>;
  currentStep: number;
  isPlaying: boolean;
  showWaypoints: boolean;
  selectedWaypoint: number | null;
  onWaypointSelect: (index: number | null) => void;
  showFullscreen?: boolean;
}

const MapboxNavigationDemo = ({
  origin,
  destination,
  currentPosition,
  heading,
  completedRoute,
  remainingRoute,
  steps,
  currentStep,
  isPlaying,
  showWaypoints,
  selectedWaypoint,
  onWaypointSelect,
  showFullscreen = false,
}: MapboxNavigationDemoProps) => {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 31.0,
    latitude: 30.2,
    zoom: 9,
  });

  // Center map on truck when playing
  useEffect(() => {
    if (isPlaying && mapRef.current && currentPosition) {
      mapRef.current.flyTo({
        center: [currentPosition[1], currentPosition[0]],
        zoom: 14,
        duration: 500,
      });
    }
  }, [currentPosition, isPlaying]);

  // Setup Arabic labels
  const handleMapLoad = useCallback((e: any) => {
    const map = e.target;
    const arabicLayers = [
      'country-label', 'state-label', 'settlement-label', 
      'settlement-subdivision-label', 'airport-label', 'poi-label', 
      'road-label', 'natural-point-label', 'natural-line-label',
      'waterway-label', 'water-point-label', 'water-line-label'
    ];
    arabicLayers.forEach(layer => {
      try { 
        map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); 
      } catch {}
    });

    // Fit bounds to show origin and destination
    const bounds: [[number, number], [number, number]] = [
      [Math.min(origin.lng, destination.lng) - 0.1, Math.min(origin.lat, destination.lat) - 0.1],
      [Math.max(origin.lng, destination.lng) + 0.1, Math.max(origin.lat, destination.lat) + 0.1]
    ];
    map.fitBounds(bounds, { padding: 60 });
  }, [origin, destination]);

  // GeoJSON for completed route
  const completedRouteGeoJSON: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: completedRoute.map(coord => [coord[1], coord[0]]),
    },
  };

  // GeoJSON for remaining route
  const remainingRouteGeoJSON: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: remainingRoute.map(coord => [coord[1], coord[0]]),
    },
  };

  // Layer styles
  const completedRouteLayer: LineLayer = {
    id: 'completed-route',
    type: 'line',
    paint: {
      'line-color': '#22c55e',
      'line-width': 6,
      'line-opacity': 1,
    },
  };

  const remainingRouteLayer: LineLayer = {
    id: 'remaining-route',
    type: 'line',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 5,
      'line-opacity': 0.8,
      'line-dasharray': [2, 2],
    },
  };

  // Waypoints GeoJSON
  const waypointsGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: showWaypoints ? steps.map((step, index) => ({
      type: 'Feature' as const,
      properties: {
        index,
        instruction: step.instruction,
        distance: step.distance,
        isCompleted: index < currentStep,
        isCurrent: index === currentStep,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: step.maneuver?.location || [0, 0],
      },
    })).filter(f => f.geometry.coordinates[0] !== 0) : [],
  };

  const waypointsLayer: CircleLayer = {
    id: 'waypoints',
    type: 'circle',
    paint: {
      'circle-radius': 10,
      'circle-color': [
        'case',
        ['==', ['get', 'isCurrent'], true], '#f59e0b',
        ['==', ['get', 'isCompleted'], true], '#22c55e',
        '#6b7280'
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  };

  return (
    <div className={`w-full ${showFullscreen ? 'h-screen' : 'h-full'} relative`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        locale={arabicLocale}
        attributionControl={false}
        onLoad={handleMapLoad}
      >
        <NavigationControl position="top-left" showCompass showZoom />

        {/* Completed route */}
        {completedRoute.length > 1 && (
          <Source id="completed-route" type="geojson" data={completedRouteGeoJSON}>
            <Layer {...completedRouteLayer} />
          </Source>
        )}

        {/* Remaining route */}
        {remainingRoute.length > 1 && (
          <Source id="remaining-route" type="geojson" data={remainingRouteGeoJSON}>
            <Layer {...remainingRouteLayer} />
          </Source>
        )}

        {/* Waypoints */}
        {showWaypoints && (
          <Source id="waypoints" type="geojson" data={waypointsGeoJSON}>
            <Layer {...waypointsLayer} />
          </Source>
        )}

        {/* Origin marker */}
        <Marker longitude={origin.lng} latitude={origin.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg mb-1 whitespace-nowrap">
              نقطة الانطلاق
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500 border-4 border-white shadow-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
              </svg>
            </div>
          </div>
        </Marker>

        {/* Destination marker */}
        <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg mb-1 whitespace-nowrap">
              نقطة الوصول
            </div>
            <div className="w-10 h-10 rounded-full bg-red-500 border-4 border-white shadow-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        </Marker>

        {/* Truck marker */}
        <Marker 
          longitude={currentPosition[1]} 
          latitude={currentPosition[0]} 
          anchor="center"
        >
          <div 
            className="relative"
            style={{ transform: `rotate(${heading}deg)` }}
          >
            {/* Pulse effect when playing */}
            {isPlaying && (
              <div 
                className="absolute inset-0 bg-green-500/30 rounded-full animate-ping"
                style={{ width: '60px', height: '60px', marginLeft: '-15px', marginTop: '-15px' }}
              />
            )}
            
            {/* Accuracy circle */}
            <div 
              className="absolute rounded-full border-2 border-green-500/50 bg-green-500/10"
              style={{
                width: '80px',
                height: '80px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            
            {/* Truck icon */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-4 border-white shadow-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
          </div>
        </Marker>

        {/* Waypoint labels on hover */}
        {showWaypoints && steps.map((step, index) => {
          if (!step.maneuver?.location || selectedWaypoint !== index) return null;
          return (
            <Marker
              key={`label-${index}`}
              longitude={step.maneuver.location[0]}
              latitude={step.maneuver.location[1]}
              anchor="bottom"
              offset={[0, -15]}
            >
              <div 
                className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-xl border text-center max-w-xs"
                dir="rtl"
              >
                <p className="font-bold text-sm text-gray-900 dark:text-white">{step.instruction}</p>
                <p className="text-xs text-muted-foreground mt-1">{step.distance.toFixed(1)} كم</p>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
};

export default MapboxNavigationDemo;
