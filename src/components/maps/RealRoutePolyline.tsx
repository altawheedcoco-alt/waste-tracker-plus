import { useEffect, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { fetchRoadRoute, RouteResult } from '@/lib/mapUtils';

interface RealRoutePolylineProps {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
  showProgress?: boolean;
  driverPosition?: { lat: number; lng: number } | null;
  onRouteLoad?: (route: RouteResult) => void;
}

/**
 * Component that renders the actual road route between two points
 * Uses OSRM for real routing data
 */
const RealRoutePolyline = ({
  start,
  end,
  color = '#6366f1',
  weight = 4,
  opacity = 0.8,
  dashArray,
  showProgress = false,
  driverPosition,
  onRouteLoad,
}: RealRoutePolylineProps) => {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [completedCoords, setCompletedCoords] = useState<[number, number][]>([]);
  const [remainingCoords, setRemainingCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const map = useMap();

  // Fetch route on mount and when endpoints change
  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);
      const result = await fetchRoadRoute(start, end);
      setRouteCoords(result.coordinates);
      
      if (onRouteLoad) {
        onRouteLoad(result);
      }
      
      // Fit map to route bounds
      if (result.coordinates.length > 0) {
        const bounds = result.coordinates.reduce(
          (acc, coord) => acc.extend(coord),
          map.getBounds()
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      
      setLoading(false);
    };

    loadRoute();
  }, [start.lat, start.lng, end.lat, end.lng]);

  // Split route into completed/remaining based on driver position
  useEffect(() => {
    if (!showProgress || !driverPosition || routeCoords.length === 0) {
      setCompletedCoords([]);
      setRemainingCoords(routeCoords);
      return;
    }

    // Find the closest point on the route to the driver
    let minDist = Infinity;
    let closestIndex = 0;

    routeCoords.forEach((coord, index) => {
      const dist = Math.sqrt(
        Math.pow(coord[0] - driverPosition.lat, 2) +
        Math.pow(coord[1] - driverPosition.lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closestIndex = index;
      }
    });

    setCompletedCoords(routeCoords.slice(0, closestIndex + 1));
    setRemainingCoords(routeCoords.slice(closestIndex));
  }, [routeCoords, driverPosition, showProgress]);

  if (loading || routeCoords.length === 0) {
    // Show straight line while loading
    return (
      <Polyline
        positions={[[start.lat, start.lng], [end.lat, end.lng]]}
        pathOptions={{
          color: '#9ca3af',
          weight: 2,
          opacity: 0.5,
          dashArray: '10, 10',
        }}
      />
    );
  }

  if (showProgress && driverPosition) {
    return (
      <>
        {/* Completed part - solid green */}
        {completedCoords.length > 1 && (
          <Polyline
            positions={completedCoords}
            pathOptions={{
              color: '#22c55e',
              weight: weight + 1,
              opacity: 1,
            }}
          />
        )}
        {/* Remaining part - dashed */}
        {remainingCoords.length > 1 && (
          <Polyline
            positions={remainingCoords}
            pathOptions={{
              color: color,
              weight: weight,
              opacity: opacity,
              dashArray: dashArray || '12, 8',
            }}
          />
        )}
      </>
    );
  }

  // Standard route display
  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{
        color,
        weight,
        opacity,
        dashArray,
      }}
    />
  );
};

export default RealRoutePolyline;
