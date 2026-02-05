/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    icon?: string;
    color?: 'blue' | 'green' | 'red' | 'orange';
  }>;
  selectedPosition?: { lat: number; lng: number } | null;
  onPositionSelect?: (position: { lat: number; lng: number }, address?: string) => void;
  onMapLoad?: (map: google.maps.Map) => void;
  showTraffic?: boolean;
  clickable?: boolean;
  className?: string;
  height?: string;
  mapTypeControl?: boolean;
  fullscreenControl?: boolean;
  streetViewControl?: boolean;
  zoomControl?: boolean;
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';
}

const colorMap: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
};

const GoogleMapComponent = memo(({
  center = { lat: 30.0444, lng: 31.2357 }, // Cairo default
  zoom = 12,
  markers = [],
  selectedPosition,
  onPositionSelect,
  onMapLoad,
  showTraffic = false,
  clickable = true,
  className = '',
  height = '400px',
  mapTypeControl = false,
  fullscreenControl = true,
  streetViewControl = false,
  zoomControl = true,
  gestureHandling = 'greedy',
}: GoogleMapComponentProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeControl,
      fullscreenControl,
      streetViewControl,
      zoomControl,
      gestureHandling,
      styles: [
        // Cleaner, modern style
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    mapInstanceRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();

    // Handle map clicks
    if (clickable && onPositionSelect) {
      map.addListener('click', async (e: google.maps.MapMouseEvent) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat && lng) {
          const position = { lat, lng };
          
          // Reverse geocode
          let address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          if (geocoderRef.current) {
            try {
              const result = await geocoderRef.current.geocode({ location: position });
              if (result.results[0]) {
                address = result.results[0].formatted_address;
              }
            } catch (error) {
              console.error('Geocoding error:', error);
            }
          }

          onPositionSelect(position, address);
        }
      });
    }

    if (onMapLoad) {
      onMapLoad(map);
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [isLoaded]);

  // Update center
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.panTo(center);
    }
  }, [center.lat, center.lng]);

  // Update zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [zoom]);

  // Handle traffic layer
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new window.google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(mapInstanceRef.current);
    } else if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(null);
    }
  }, [showTraffic, isLoaded]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const marker = new window.google.maps.Marker({
        position: markerData.position,
        map: mapInstanceRef.current!,
        title: markerData.title,
        icon: markerData.icon || {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: colorMap[markerData.color || 'blue'],
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      markersRef.current.push(marker);
    });
  }, [markers, isLoaded]);

  // Handle selected position marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Remove previous selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }

    // Add new selected marker
    if (selectedPosition) {
      selectedMarkerRef.current = new window.google.maps.Marker({
        position: selectedPosition,
        map: mapInstanceRef.current,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 2,
          anchor: new window.google.maps.Point(12, 24),
        },
      });

      mapInstanceRef.current.panTo(selectedPosition);
      mapInstanceRef.current.setZoom(15);
    }
  }, [selectedPosition, isLoaded]);

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
    <div 
      ref={mapRef} 
      className={cn('rounded-lg overflow-hidden', className)} 
      style={{ height, width: '100%' }} 
    />
  );
});

GoogleMapComponent.displayName = 'GoogleMapComponent';

export default GoogleMapComponent;
