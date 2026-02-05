/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Loader2, MapPin, Truck, Factory, Recycle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  lat: number;
  lng: number;
}

interface GoogleMapsShipmentTrackingProps {
  collectionPoint?: Position;
  recyclingCenter?: Position;
  driverLocation?: Position & { recorded_at?: string };
  driverId?: string;
  showDriverTracking?: boolean;
  className?: string;
  height?: string;
}

const GoogleMapsShipmentTracking = memo(({
  collectionPoint,
  recyclingCenter,
  driverLocation,
  showDriverTracking = true,
  className = '',
  height = '400px',
}: GoogleMapsShipmentTrackingProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const center = driverLocation || collectionPoint || recyclingCenter || { lat: 30.0444, lng: 31.2357 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });
  }, [isLoaded, collectionPoint, recyclingCenter, driverLocation]);

  // Update markers and route
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    polylineRef.current?.setMap(null);

    const bounds = new window.google.maps.LatLngBounds();
    const routePoints: Position[] = [];

    // Collection point marker
    if (collectionPoint) {
      const marker = new window.google.maps.Marker({
        position: collectionPoint,
        map: mapInstanceRef.current,
        title: 'نقطة الاستلام',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: {
          text: '📦',
          fontSize: '16px',
        },
      });
      markersRef.current.push(marker);
      bounds.extend(collectionPoint);
      routePoints.push(collectionPoint);
    }

    // Driver location marker
    if (showDriverTracking && driverLocation) {
      const marker = new window.google.maps.Marker({
        position: driverLocation,
        map: mapInstanceRef.current,
        title: 'موقع السائق',
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 2,
          anchor: new window.google.maps.Point(12, 24),
        },
        zIndex: 1000,
      });
      markersRef.current.push(marker);
      bounds.extend(driverLocation);
      routePoints.push(driverLocation);
    }

    // Recycling center marker
    if (recyclingCenter) {
      const marker = new window.google.maps.Marker({
        position: recyclingCenter,
        map: mapInstanceRef.current,
        title: 'مركز التدوير',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#8b5cf6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        label: {
          text: '♻️',
          fontSize: '16px',
        },
      });
      markersRef.current.push(marker);
      bounds.extend(recyclingCenter);
      routePoints.push(recyclingCenter);
    }

    // Draw route line
    if (routePoints.length >= 2) {
      polylineRef.current = new window.google.maps.Polyline({
        path: routePoints,
        geodesic: true,
        strokeColor: '#22c55e',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
            },
            offset: '50%',
          },
        ],
        map: mapInstanceRef.current,
      });
    }

    // Fit bounds
    if (markersRef.current.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, 50);
      if (markersRef.current.length === 1) {
        mapInstanceRef.current.setZoom(14);
      }
    }
  }, [collectionPoint, recyclingCenter, driverLocation, showDriverTracking, isLoaded]);

  if (loadError) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg', className)} style={{ height }}>
        <div className="text-center text-destructive p-4">
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">فشل تحميل الخريطة</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn('flex items-center justify-center bg-muted rounded-lg', className)} style={{ height }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border text-xs">
        <div className="flex flex-col gap-1">
          {collectionPoint && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>نقطة الاستلام</span>
            </div>
          )}
          {showDriverTracking && driverLocation && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>السائق</span>
            </div>
          )}
          {recyclingCenter && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span>مركز التدوير</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

GoogleMapsShipmentTracking.displayName = 'GoogleMapsShipmentTracking';

export default GoogleMapsShipmentTracking;
