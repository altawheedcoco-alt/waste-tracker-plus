/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { Loader2, MapPin, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Driver {
  id: string;
  name?: string;
  full_name?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_available?: boolean;
  current_status?: string;
}

interface GoogleMapsDriverTrackingProps {
  drivers: Driver[];
  selectedDriver?: Driver | null;
  onSelectDriver?: (driver: Driver) => void;
  center?: { lat: number; lng: number };
  className?: string;
  height?: string;
  showHeatmap?: boolean;
}

const GoogleMapsDriverTracking = memo(({
  drivers,
  selectedDriver,
  onSelectDriver,
  center = { lat: 30.0444, lng: 31.2357 },
  className = '',
  height = '500px',
  showHeatmap = false,
}: GoogleMapsDriverTrackingProps) => {
  const { isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [isLoaded, center]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add driver markers
    drivers.forEach(driver => {
      if (!driver.latitude || !driver.longitude) return;

      const isActive = driver.is_available || driver.current_status === 'active';
      const isSelected = selectedDriver?.id === driver.id;

      const marker = new window.google.maps.Marker({
        position: { lat: driver.latitude, lng: driver.longitude },
        map: mapInstanceRef.current!,
        title: driver.name || driver.full_name || 'سائق',
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
          fillColor: isSelected ? '#8b5cf6' : isActive ? '#22c55e' : '#94a3b8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: isSelected ? 2.5 : 2,
          anchor: new window.google.maps.Point(12, 24),
        },
        animation: isSelected ? window.google.maps.Animation.BOUNCE : undefined,
        zIndex: isSelected ? 1000 : 1,
      });

      marker.addListener('click', () => {
        if (onSelectDriver) {
          onSelectDriver(driver);
        }

        const content = `
          <div dir="rtl" style="padding: 8px; min-width: 150px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${driver.name || driver.full_name || 'سائق'}</div>
            <div style="font-size: 12px; color: ${isActive ? '#22c55e' : '#94a3b8'};">
              ${isActive ? '🟢 متاح' : '⚪ غير متاح'}
            </div>
          </div>
        `;

        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    // Pan to selected driver
    if (selectedDriver?.latitude && selectedDriver?.longitude) {
      mapInstanceRef.current.panTo({
        lat: selectedDriver.latitude,
        lng: selectedDriver.longitude,
      });
      mapInstanceRef.current.setZoom(14);
    }
  }, [drivers, selectedDriver, isLoaded, onSelectDriver]);

  // Heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (!showHeatmap) return;

    const heatmapData = drivers
      .filter(d => d.latitude && d.longitude)
      .map(d => new window.google.maps.LatLng(d.latitude!, d.longitude!));

    if (heatmapData.length === 0) return;

    try {
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 40,
        opacity: 0.7,
        gradient: [
          'rgba(0, 255, 0, 0)',
          'rgba(0, 255, 0, 1)',
          'rgba(255, 255, 0, 1)',
          'rgba(255, 165, 0, 1)',
          'rgba(255, 0, 0, 1)',
        ],
      });
    } catch (e) {
      console.warn('Heatmap visualization library not available');
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
    };
  }, [drivers, showHeatmap, isLoaded]);


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
      
      {/* Driver count badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{drivers.filter(d => d.latitude && d.longitude).length} سائق</span>
        </div>
      </div>
    </div>
  );
});

GoogleMapsDriverTracking.displayName = 'GoogleMapsDriverTracking';

export default GoogleMapsDriverTracking;
