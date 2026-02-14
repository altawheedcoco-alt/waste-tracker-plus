import { useRef, useEffect, memo, useState } from 'react';
import { useGoogleMaps } from '@/components/maps/GoogleMapsProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Route, MapPin, Navigation } from 'lucide-react';

interface VirtualRouteMapProps {
  pickupLocation: { lat: number; lng: number } | null;
  deliveryLocation: { lat: number; lng: number } | null;
  pickupLabel?: string;
  deliveryLabel?: string;
  shipmentNumber?: string;
}

const VirtualRouteMap = memo(({
  pickupLocation,
  deliveryLocation,
  pickupLabel = 'نقطة الاستلام',
  deliveryLabel = 'نقطة التسليم',
  shipmentNumber,
}: VirtualRouteMapProps) => {
  const { isLoaded } = useGoogleMaps();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const animationRef = useRef<number | null>(null);
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !pickupLocation || !deliveryLocation) return;

    // Create map
    const center = {
      lat: (pickupLocation.lat + deliveryLocation.lat) / 2,
      lng: (pickupLocation.lng + deliveryLocation.lng) / 2,
    };

    mapRef.current = new google.maps.Map(containerRef.current, {
      center,
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Pickup marker
    const pickupMarker = new google.maps.Marker({
      position: pickupLocation,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#f97316',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      label: { text: 'A', color: 'white', fontWeight: 'bold' },
      title: pickupLabel,
    });

    // Delivery marker
    const deliveryMarker = new google.maps.Marker({
      position: deliveryLocation,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      label: { text: 'B', color: 'white', fontWeight: 'bold' },
      title: deliveryLabel,
    });

    markersRef.current = [pickupMarker, deliveryMarker];

    // Draw curved path between two points
    const path = generateCurvedPath(pickupLocation, deliveryLocation, 50);

    polylineRef.current = new google.maps.Polyline({
      path,
      map: mapRef.current,
      strokeColor: '#6366f1',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      icons: [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            fillColor: '#6366f1',
            fillOpacity: 1,
          },
          offset: '50%',
        },
      ],
    });

    // Animated truck icon along the path
    const truckIcon: google.maps.Symbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 5,
      fillColor: '#3b82f6',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    };

    polylineRef.current.set('icons', [
      ...polylineRef.current.get('icons'),
      { icon: truckIcon, offset: '0%' },
    ]);

    // Animate the truck
    let offset = 0;
    const animate = () => {
      offset = (offset + 0.3) % 100;
      const icons = polylineRef.current?.get('icons');
      if (icons && icons[1]) {
        icons[1].offset = offset + '%';
        polylineRef.current?.set('icons', icons);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickupLocation);
    bounds.extend(deliveryLocation);
    mapRef.current.fitBounds(bounds, 60);

    // Calc distance
    const R = 6371;
    const dLat = ((deliveryLocation.lat - pickupLocation.lat) * Math.PI) / 180;
    const dLng = ((deliveryLocation.lng - pickupLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((pickupLocation.lat * Math.PI) / 180) *
        Math.cos((deliveryLocation.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    setDistance(dist.toFixed(1));

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      markersRef.current.forEach(m => m.setMap(null));
      polylineRef.current?.setMap(null);
      mapRef.current = null;
    };
  }, [isLoaded, pickupLocation, deliveryLocation]);

  if (!pickupLocation || !deliveryLocation) {
    return null;
  }

  return (
    <Card className="border border-indigo-200 dark:border-indigo-800 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2" dir="rtl">
          <CardTitle className="text-base flex items-center gap-2">
            <Route className="w-5 h-5 text-indigo-500" />
            تتبع مسار الشحنة
          </CardTitle>
          <div className="flex items-center gap-2">
            {distance && (
              <Badge variant="outline" className="gap-1 text-xs border-indigo-300 dark:border-indigo-700">
                <Navigation className="w-3 h-3" />
                {distance} كم (تقديري)
              </Badge>
            )}
            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs">
              مسار افتراضي
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-right mt-1">
          عرض تقريبي لمسار الشحنة بين نقطتي الاستلام والتسليم - لا تتوفر بيانات GPS فعلية
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {!isLoaded ? (
            <div className="h-[300px] flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div ref={containerRef} className="w-full h-[300px]" />
          )}
          {/* Legend */}
          <div className="absolute bottom-3 right-3 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-xs" dir="rtl">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span>{pickupLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>{deliveryLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Generate a slight curve between two points for visual appeal
function generateCurvedPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numPoints: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  // Offset the midpoint perpendicular to the line
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = dist * 0.1; // 10% curve
  const perpLat = midLat + (dx / dist) * offset;
  const perpLng = midLng - (dy / dist) * offset;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic bezier
    const lat =
      (1 - t) * (1 - t) * start.lat +
      2 * (1 - t) * t * perpLat +
      t * t * end.lat;
    const lng =
      (1 - t) * (1 - t) * start.lng +
      2 * (1 - t) * t * perpLng +
      t * t * end.lng;
    points.push({ lat, lng });
  }

  return points;
}

VirtualRouteMap.displayName = 'VirtualRouteMap';

export default VirtualRouteMap;
