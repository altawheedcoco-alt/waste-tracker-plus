/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Navigation, ExternalLink, Route, Clock, Truck } from 'lucide-react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { toast } from 'sonner';

interface GoogleMapsRouteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pickupAddress: string;
  deliveryAddress: string;
  shipmentNumber?: string;
  driverId?: string;
  shipmentStatus?: string;
}

const GoogleMapsRouteDialog = ({
  isOpen,
  onClose,
  pickupAddress,
  deliveryAddress,
  shipmentNumber,
}: GoogleMapsRouteDialogProps) => {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateRoute = useCallback(async () => {
    if (!isLoaded || !mapRef.current || !pickupAddress || !deliveryAddress) return;

    setIsCalculating(true);

    try {
      // Initialize map if not already
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 10,
          center: { lat: 30.0444, lng: 31.2357 },
          mapTypeControl: false,
          streetViewControl: false,
        });
      }

      // Initialize directions renderer
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapInstanceRef.current,
          polylineOptions: {
            strokeColor: '#22c55e',
            strokeWeight: 5,
          },
        });
      }

      const directionsService = new window.google.maps.DirectionsService();

      const result = await directionsService.route({
        origin: pickupAddress,
        destination: deliveryAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        region: 'EG',
      });

      directionsRendererRef.current.setDirections(result);

      if (result.routes[0]?.legs[0]) {
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || '',
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('فشل في حساب المسار');
    } finally {
      setIsCalculating(false);
    }
  }, [isLoaded, pickupAddress, deliveryAddress]);

  useEffect(() => {
    if (isOpen && isLoaded) {
      // Small delay to ensure dialog is rendered
      setTimeout(calculateRoute, 100);
    }
  }, [isOpen, isLoaded, calculateRoute]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      mapInstanceRef.current = null;
      setRouteInfo(null);
    }
  }, [isOpen]);

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(deliveryAddress)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            خريطة المسار
            {shipmentNumber && (
              <Badge variant="outline" className="mr-2">
                {shipmentNumber}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Route Info */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">من:</span>
              <span className="font-medium truncate max-w-[200px]">{pickupAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-red-500" />
              <span className="text-muted-foreground">إلى:</span>
              <span className="font-medium truncate max-w-[200px]">{deliveryAddress}</span>
            </div>
          </div>

          {/* Route Stats */}
          {routeInfo && (
            <div className="flex gap-4">
              <Badge variant="secondary" className="gap-1">
                <Truck className="w-3 h-3" />
                {routeInfo.distance}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                {routeInfo.duration}
              </Badge>
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 relative rounded-lg overflow-hidden border min-h-[400px]">
            {!isLoaded || isCalculating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {!isLoaded ? 'جاري تحميل الخريطة...' : 'جاري حساب المسار...'}
                  </p>
                </div>
              </div>
            ) : null}
            <div ref={mapRef} className="w-full h-full" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            <Button onClick={openInGoogleMaps} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              فتح في خرائط جوجل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleMapsRouteDialog;
