import { useEffect, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox Access Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface MapboxDriverMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const MapboxDriverMap = ({ latitude, longitude, accuracy }: MapboxDriverMapProps) => {
  const [viewState, setViewState] = useState({
    longitude,
    latitude,
    zoom: 15,
  });

  useEffect(() => {
    setViewState({
      longitude,
      latitude,
      zoom: 15,
    });
  }, [latitude, longitude]);

  return (
    <div className="w-full h-40 rounded-lg overflow-hidden border">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        interactive={false}
        attributionControl={false}
        onLoad={(e) => {
          const map = e.target;
          const arabicLayers = ['country-label', 'state-label', 'settlement-label', 'settlement-subdivision-label', 'airport-label', 'poi-label', 'road-label', 'natural-point-label', 'natural-line-label', 'waterway-label', 'water-point-label', 'water-line-label'];
          arabicLayers.forEach(layer => {
            try { map.setLayoutProperty(layer, 'text-field', ['get', 'name_ar']); } catch {}
          });
        }}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="center">
          <div className="relative">
            {/* Pulse animation */}
            <div 
              className="absolute inset-0 bg-green-500/30 rounded-full animate-ping"
              style={{ width: '40px', height: '40px', marginLeft: '-12px', marginTop: '-12px' }}
            />
            {/* Accuracy circle indicator */}
            {accuracy && (
              <div 
                className="absolute rounded-full border border-green-500/50 bg-green-500/10"
                style={{
                  width: `${Math.min(accuracy / 2, 100)}px`,
                  height: `${Math.min(accuracy / 2, 100)}px`,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
            {/* Driver marker */}
            <div 
              className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  );
};

export default MapboxDriverMap;
