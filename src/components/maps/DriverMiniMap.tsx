import { memo } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYWx0YXdoZWVkZm9yd2FzdGUiLCJhIjoiY21sNnd6Mmp1MGdyMTNncXg0bnd5enRjNyJ9.a1QswQtzCNcEAdZrpTON9g';

interface DriverMiniMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

/**
 * Compact driver location map using Mapbox GL JS
 */
const DriverMiniMap = memo(({ latitude, longitude, accuracy }: DriverMiniMapProps) => {
  return (
    <div className="relative w-full h-40 rounded-lg overflow-hidden border">
      <Map
        initialViewState={{
          longitude,
          latitude,
          zoom: 15,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        interactive={false}
        dragPan={false}
        scrollZoom={false}
        doubleClickZoom={false}
        touchZoomRotate={false}
        keyboard={false}
      >
        {/* Driver marker with pulse animation */}
        <Marker longitude={longitude} latitude={latitude} anchor="center">
          <div className="relative">
            {/* Pulse animation */}
            <div 
              className="absolute rounded-full bg-green-500/30 animate-ping"
              style={{
                width: '40px',
                height: '40px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            {/* Main marker */}
            <div 
              className="relative flex items-center justify-center rounded-full shadow-lg"
              style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                border: '3px solid white',
              }}
            >
              <MapPin className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </Marker>
      </Map>
      
      {/* Accuracy indicator */}
      {accuracy && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-[10px] text-muted-foreground">
          ± {Math.round(accuracy)} م
        </div>
      )}
    </div>
  );
});

DriverMiniMap.displayName = 'DriverMiniMap';

export default DriverMiniMap;
