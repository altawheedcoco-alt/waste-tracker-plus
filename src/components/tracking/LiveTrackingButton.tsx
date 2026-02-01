import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Radio } from 'lucide-react';
import { useViewerPresence } from '@/hooks/useDriverPresence';
import { useAuth } from '@/contexts/AuthContext';

interface LiveTrackingButtonProps {
  driverId: string;
  onTrackingChange?: (isTracking: boolean) => void;
  className?: string;
}

const LiveTrackingButton = ({
  driverId,
  onTrackingChange,
  className = '',
}: LiveTrackingButtonProps) => {
  const { profile, organization } = useAuth();
  const [isLiveTracking, setIsLiveTracking] = useState(false);

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
    <div className={`flex items-center gap-2 ${className}`}>
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
            تتبع مباشر نشط
          </>
        ) : (
          <>
            <Eye className="w-4 h-4 mr-1" />
            تتبع مباشر
          </>
        )}
      </Button>

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
  );
};

export default LiveTrackingButton;
