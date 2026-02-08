import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Radio, Smartphone, Activity, MapPin, Wifi, WifiOff, 
  AlertTriangle, Eye, Clock
} from 'lucide-react';
import { useHybridTracking } from '@/hooks/useHybridTracking';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface GPSTrackingStatusWidgetProps {
  shipmentId: string;
  driverId: string | null;
  compact?: boolean;
  onClick?: () => void;
}

const GPSTrackingStatusWidget: React.FC<GPSTrackingStatusWidgetProps> = ({
  shipmentId,
  driverId,
  compact = false,
  onClick,
}) => {
  const {
    config,
    hybridData,
    linkedDevice,
    getCurrentLocation,
  } = useHybridTracking({
    shipmentId,
    driverId,
    enabled: true,
  });

  const location = getCurrentLocation();
  const hasActiveTracking = location !== null;

  const getTrackingIcon = () => {
    if (!config) return <WifiOff className="w-4 h-4" />;
    switch (config.tracking_source) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'gps_device':
        return <Radio className="w-4 h-4" />;
      case 'hybrid':
        return <Activity className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTrackingLabel = () => {
    if (!config) return 'غير مُعد';
    switch (config.tracking_source) {
      case 'mobile':
        return 'موبايل';
      case 'gps_device':
        return 'GPS';
      case 'hybrid':
        return 'مدمج';
      default:
        return 'غير معروف';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClick}
              className={cn(
                "gap-1.5 h-8 px-2",
                hasActiveTracking ? "text-primary" : "text-muted-foreground"
              )}
            >
              {getTrackingIcon()}
              {hasActiveTracking ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {hybridData.anomaly_detected && (
                <AlertTriangle className="w-3 h-3 text-destructive" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p className="font-medium">تتبع GPS: {getTrackingLabel()}</p>
              {location && (
                <p className="text-muted-foreground">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
              {hybridData.anomaly_detected && (
                <p className="text-destructive">⚠️ تم اكتشاف انحراف!</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        hasActiveTracking ? "bg-primary/5 border-primary/30" : "bg-muted/50",
        hybridData.anomaly_detected && "border-destructive/50 bg-destructive/5"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        hasActiveTracking ? "bg-primary/10" : "bg-muted"
      )}>
        {getTrackingIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">تتبع GPS</span>
          <Badge variant={hasActiveTracking ? "default" : "secondary"} className="text-xs">
            {getTrackingLabel()}
          </Badge>
        </div>
        
        {location ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا يوجد موقع متاح</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        {hasActiveTracking ? (
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Wifi className="w-3 h-3" />
            نشط
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <WifiOff className="w-3 h-3" />
            غير متصل
          </Badge>
        )}
        
        {hybridData.anomaly_detected && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            انحراف!
          </Badge>
        )}

        {linkedDevice && linkedDevice.last_ping_at && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(linkedDevice.last_ping_at), { addSuffix: true, locale: ar })}
          </span>
        )}
      </div>
    </div>
  );
};

export default GPSTrackingStatusWidget;
