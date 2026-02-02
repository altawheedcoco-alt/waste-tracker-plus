import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Clock, Navigation, Check, Zap, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteAlternative, formatDistanceArabic, formatDurationArabic, calculateETA } from '@/lib/routingUtils';

interface RouteAlternativesSelectorProps {
  alternatives: RouteAlternative[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
  className?: string;
}

const RouteAlternativesSelector = ({
  alternatives,
  selectedRouteId,
  onSelectRoute,
  className,
}: RouteAlternativesSelectorProps) => {
  if (alternatives.length <= 1) return null;

  return (
    <Card className={cn("p-3", className)} dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Route className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">المسارات المتاحة</span>
        <Badge variant="secondary" className="text-xs">
          {alternatives.length} مسارات
        </Badge>
      </div>

      <div className="space-y-2">
        {alternatives.map((route, index) => {
          const isSelected = route.id === selectedRouteId;
          const timeDiff = index > 0 
            ? Math.round((route.duration - alternatives[0].duration) / 60) 
            : 0;
          
          return (
            <div
              key={route.id}
              className={cn(
                "p-3 rounded-lg border-2 cursor-pointer transition-all",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
              onClick={() => onSelectRoute(route.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Route color indicator */}
                  <div 
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: route.color }}
                  />
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{route.name}</span>
                      {route.isRecommended && (
                        <Badge className="text-[10px] bg-green-500 hover:bg-green-600 gap-1">
                          <Zap className="w-3 h-3" />
                          موصى به
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {formatDistanceArabic(route.distance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDurationArabic(route.duration)}
                      </span>
                    </div>

                    {/* Time difference from fastest */}
                    {timeDiff > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        أبطأ بـ {timeDiff} دقيقة من أسرع مسار
                      </p>
                    )}
                  </div>
                </div>

                {/* Selection indicator and ETA */}
                <div className="flex flex-col items-end gap-1">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <Badge variant="outline" className="text-[10px]">
                    الوصول: {calculateETA(route.duration)}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default RouteAlternativesSelector;
