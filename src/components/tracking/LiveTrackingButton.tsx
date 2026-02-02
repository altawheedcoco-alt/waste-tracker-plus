import { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Radio, Map, Loader2 } from 'lucide-react';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import { useAuth } from '@/contexts/AuthContext';

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

  // Only activate presence when tracking is enabled
  const { isConnected, viewerCount } = useViewerPresence(
    isLiveTracking ? driverId : '',
    profile?.full_name || 'مستخدم',
    organization?.name
  );

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
