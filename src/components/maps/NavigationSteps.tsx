import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  ChevronUp, 
  Navigation, 
  MapPin,
  ArrowRight,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  RotateCcw,
  Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteStep, formatDistanceArabic, formatDurationArabic } from '@/lib/routingUtils';

interface NavigationStepsProps {
  steps: RouteStep[];
  totalDistance: number;
  totalDuration: number;
  eta: string;
  className?: string;
}

// Get icon component based on maneuver
const getManeuverIconComponent = (type: string, modifier?: string) => {
  if (type === 'depart') return <Navigation className="w-4 h-4" />;
  if (type === 'arrive') return <Flag className="w-4 h-4" />;
  if (type === 'roundabout' || type === 'rotary') return <RotateCcw className="w-4 h-4" />;
  if (type === 'continue' || type === 'new name') return <ArrowUp className="w-4 h-4" />;
  
  if (modifier?.includes('left')) return <CornerUpLeft className="w-4 h-4" />;
  if (modifier?.includes('right')) return <CornerUpRight className="w-4 h-4" />;
  
  return <ArrowRight className="w-4 h-4" />;
};

const NavigationSteps = ({ 
  steps, 
  totalDistance, 
  totalDuration, 
  eta,
  className 
}: NavigationStepsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Filter out empty/notification steps
  const filteredSteps = steps.filter(step => 
    step.maneuver.type !== 'notification' && 
    step.instruction && 
    step.distance > 0
  );

  if (filteredSteps.length === 0) return null;

  return (
    <Card className={cn("overflow-hidden", className)} dir="rtl">
      {/* Header - Always visible */}
      <div 
        className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 cursor-pointer hover:bg-primary/15 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/20">
              <Navigation className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">تعليمات الملاحة</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceArabic(totalDistance)} • {formatDurationArabic(totalDuration)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              الوصول: {eta}
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Next step preview when collapsed */}
        {!isExpanded && filteredSteps[0] && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-background/60">
            <div className="p-1.5 rounded-full bg-primary text-white">
              {getManeuverIconComponent(filteredSteps[0].maneuver.type, filteredSteps[0].maneuver.modifier)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{filteredSteps[0].instruction}</p>
              <p className="text-xs text-muted-foreground">
                بعد {formatDistanceArabic(filteredSteps[0].distance)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded steps list */}
      {isExpanded && (
        <ScrollArea className="h-[300px]">
          <div className="p-3 space-y-1">
            {filteredSteps.map((step, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                  index === activeStep 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => setActiveStep(index)}
              >
                {/* Step number and icon */}
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    index === activeStep 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {index === filteredSteps.length - 1 ? (
                      <Flag className="w-4 h-4" />
                    ) : (
                      getManeuverIconComponent(step.maneuver.type, step.maneuver.modifier)
                    )}
                  </div>
                  {index < filteredSteps.length - 1 && (
                    <div className="w-0.5 h-8 bg-border" />
                  )}
                </div>

                {/* Step details */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className={cn(
                    "font-medium text-sm",
                    index === activeStep && "text-primary"
                  )}>
                    {step.instruction}
                  </p>
                  {step.name && step.maneuver.type !== 'arrive' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {formatDistanceArabic(step.distance)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {formatDurationArabic(step.duration)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};

export default NavigationSteps;
