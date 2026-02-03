import { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Radio, Map, Loader2, Navigation, ExternalLink } from 'lucide-react';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

// Lazy load the map dialog for better performance
const LiveTrackingMapDialog = lazy(() => import('./LiveTrackingMapDialog'));

interface LiveTrackingButtonProps {
  driverId: string;
  shipmentNumber?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  shipmentStatus?: string;
  onTrackingChange?: (isTracking: boolean) => void;
  showMapButton?: boolean;
  className?: string;
}

const LiveTrackingButton = ({
  driverId,
  shipmentNumber = '',
  pickupAddress = '',
  deliveryAddress = '',
  shipmentStatus,
  onTrackingChange,
  showMapButton = true,
  className = '',
}: LiveTrackingButtonProps) => {
  const { profile, organization } = useAuth();
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Only activate presence when tracking is enabled
  const { isConnected, viewerCount } = useViewerPresence(
    isLiveTracking ? driverId : '',
    profile?.full_name || 'مستخدم',
    organization?.name
  );

  // Fetch driver's latest location
  useEffect(() => {
    const fetchDriverLocation = async () => {
      if (!driverId) return;
      
      const { data } = await supabase
        .from('driver_location_logs')
        .select('latitude, longitude')
        .eq('driver_id', driverId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setDriverLocation({ lat: data.latitude, lng: data.longitude });
      }
    };

    fetchDriverLocation();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const newLocation = payload.new as { latitude: number; longitude: number };
          setDriverLocation({ lat: newLocation.latitude, lng: newLocation.longitude });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  const handleToggleTracking = () => {
    const newState = !isLiveTracking;
    setIsLiveTracking(newState);
    onTrackingChange?.(newState);
  };

  const handleOpenMap = () => {
    setShowMapDialog(true);
    setIsLiveTracking(true);
    onTrackingChange?.(true);
  };

  const handleCloseMap = () => {
    setShowMapDialog(false);
  };

  const openInGoogleMaps = () => {
    if (!driverLocation) return;
    const { lat, lng } = driverLocation;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open(`google.navigation:q=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  const viewInGoogleMaps = () => {
    if (!driverLocation) return;
    const { lat, lng } = driverLocation;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      setIsLiveTracking(false);
    };
  }, []);

  if (!driverId) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Main tracking toggle button */}
        <Button
          size="sm"
          variant={isLiveTracking ? 'default' : 'outline'}
          onClick={handleToggleTracking}
          className={`shadow-lg transition-all duration-300 ${
            isLiveTracking 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-background hover:bg-muted'
          }`}
        >
          {isLiveTracking ? (
            <>
              <Radio className="w-4 h-4 mr-1 animate-pulse" />
              تتبع مباشر
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-1" />
              تتبع مباشر
            </>
          )}
        </Button>

        {/* Google Maps Navigation Buttons */}
        {driverLocation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20"
              >
                <Navigation className="w-4 h-4" />
                <span className="hidden sm:inline">خرائط جوجل</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-right">موقع السائق</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={viewInGoogleMaps} className="gap-2 cursor-pointer">
                <img 
                  src="https://www.google.com/images/branding/product/1x/maps_64dp.png" 
                  alt="Google Maps" 
                  className="w-5 h-5"
                />
                <span>عرض الموقع</span>
                <ExternalLink className="w-3 h-3 mr-auto opacity-50" />
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openInGoogleMaps} className="gap-2 cursor-pointer">
                <Navigation className="w-4 h-4 text-green-600" />
                <span>بدء الملاحة</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Map button - opens full tracking dialog */}
        {showMapButton && pickupAddress && deliveryAddress && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenMap}
            className="gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20"
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">عرض الخريطة</span>
          </Button>
        )}

        {isLiveTracking && isConnected && (
          <Badge 
            variant="default" 
            className="bg-green-500 text-white animate-pulse flex items-center gap-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            متصل
          </Badge>
        )}
      </div>

      {/* Live Tracking Map Dialog */}
      {showMapDialog && (
        <Suspense fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <LiveTrackingMapDialog
            isOpen={showMapDialog}
            onClose={handleCloseMap}
            driverId={driverId}
            shipmentNumber={shipmentNumber}
            pickupAddress={pickupAddress}
            deliveryAddress={deliveryAddress}
            shipmentStatus={shipmentStatus}
          />
        </Suspense>
      )}
    </>
  );
};

export default LiveTrackingButton;
