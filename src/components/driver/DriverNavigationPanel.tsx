import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, 
  Volume2, 
  VolumeX,
  Gauge,
  MapPin,
  Flag,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  RotateCcw,
  AlertTriangle,
  Clock,
  Route,
  ChevronUp,
  ChevronDown,
  Compass,
  Radio,
  Locate
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  RouteStep, 
  formatDistanceArabic, 
  formatDurationArabic,
  calculateETA 
} from '@/lib/routingUtils';

interface DriverNavigationPanelProps {
  steps: RouteStep[];
  currentStepIndex: number;
  distanceToNextStep: number; // meters
  totalDistance: number;
  totalDuration: number;
  remainingDistance: number;
  remainingDuration: number;
  currentSpeed: number; // km/h
  isNavigating: boolean;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  className?: string;
}

// Get icon for maneuver
const getManeuverIcon = (type: string, modifier?: string, size: number = 24) => {
  const iconClass = `w-${size/4} h-${size/4}`;
  
  if (type === 'depart') return <Navigation className={iconClass} />;
  if (type === 'arrive') return <Flag className={iconClass} />;
  if (type === 'roundabout' || type === 'rotary') return <RotateCcw className={iconClass} />;
  if (type === 'continue' || type === 'new name') return <ArrowUp className={iconClass} />;
  
  if (modifier?.includes('left')) return <CornerUpLeft className={iconClass} />;
  if (modifier?.includes('right')) return <CornerUpRight className={iconClass} />;
  
  return <ArrowUp className={iconClass} />;
};

// Speed color based on value
const getSpeedColor = (speed: number): string => {
  if (speed > 120) return 'text-red-500';
  if (speed > 80) return 'text-amber-500';
  return 'text-green-500';
};

const DriverNavigationPanel = ({
  steps,
  currentStepIndex,
  distanceToNextStep,
  totalDistance,
  totalDuration,
  remainingDistance,
  remainingDuration,
  currentSpeed,
  isNavigating,
  onStartNavigation,
  onStopNavigation,
  className,
}: DriverNavigationPanelProps) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [alertShown, setAlertShown] = useState<Set<number>>(new Set());
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStep = steps[currentStepIndex];
  const nextStep = steps[currentStepIndex + 1];
  const progress = totalDistance > 0 ? ((totalDistance - remainingDistance) / totalDistance) * 100 : 0;

  // Speak navigation instruction
  const speakInstruction = useCallback((text: string) => {
    if (!isSoundEnabled || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSoundEnabled]);

  // Alert for upcoming turn
  useEffect(() => {
    if (!isNavigating || !currentStep) return;

    // Alert at 200m, 100m, 50m
    const alertDistances = [200, 100, 50];
    
    alertDistances.forEach(distance => {
      const alertKey = currentStepIndex * 1000 + distance;
      
      if (distanceToNextStep <= distance && distanceToNextStep > distance - 20 && !alertShown.has(alertKey)) {
        setAlertShown(prev => new Set(prev).add(alertKey));
        
        let instruction = '';
        if (distance === 200) {
          instruction = `بعد ${formatDistanceArabic(distance)}، ${currentStep.instruction}`;
        } else if (distance === 100) {
          instruction = `استعد، ${currentStep.instruction}`;
        } else {
          instruction = `الآن، ${currentStep.instruction}`;
        }
        
        speakInstruction(instruction);
      }
    });
  }, [distanceToNextStep, currentStepIndex, currentStep, isNavigating, alertShown, speakInstruction]);

  // Reset alerts when step changes
  useEffect(() => {
    setAlertShown(new Set());
  }, [currentStepIndex]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  if (!isNavigating) {
    return (
      <Card className={cn("overflow-hidden", className)} dir="rtl">
        <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Navigation className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg">وضع الملاحة</h3>
            <p className="text-sm text-muted-foreground mt-1">
              ابدأ الملاحة للحصول على تعليمات القيادة
            </p>
          </div>
          <Button onClick={onStartNavigation} size="lg" className="gap-2 w-full max-w-xs">
            <Navigation className="w-5 h-5" />
            بدء الملاحة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)} dir="rtl">
      {/* Current instruction - Large display */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            <Radio className="w-3 h-3 mr-1 animate-pulse" />
            ملاحة نشطة
          </Badge>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-white hover:bg-white/20"
              onClick={onStopNavigation}
            >
              إنهاء
            </Button>
          </div>
        </div>

        {currentStep && (
          <div className="flex items-center gap-4">
            {/* Maneuver icon */}
            <motion.div 
              className="p-4 rounded-2xl bg-white/20 backdrop-blur"
              animate={{ scale: distanceToNextStep < 100 ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: distanceToNextStep < 100 ? Infinity : 0, duration: 0.5 }}
            >
              {getManeuverIcon(currentStep.maneuver.type, currentStep.maneuver.modifier, 40)}
            </motion.div>

            {/* Instruction */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold truncate">{currentStep.instruction}</p>
              {currentStep.name && (
                <p className="text-sm text-white/80 mt-1 truncate">{currentStep.name}</p>
              )}
            </div>
          </div>
        )}

        {/* Distance to next step */}
        <motion.div 
          className="mt-4 text-center"
          animate={{ 
            scale: distanceToNextStep < 50 ? [1, 1.05, 1] : 1,
            color: distanceToNextStep < 50 ? ['#ffffff', '#fef08a', '#ffffff'] : '#ffffff'
          }}
          transition={{ repeat: distanceToNextStep < 50 ? Infinity : 0, duration: 0.8 }}
        >
          <p className="text-5xl font-bold">{formatDistanceArabic(distanceToNextStep)}</p>
        </motion.div>

        {/* Next step preview */}
        {nextStep && (
          <div className="mt-4 p-3 rounded-lg bg-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/20">
              {getManeuverIcon(nextStep.maneuver.type, nextStep.maneuver.modifier, 16)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70">ثم</p>
              <p className="text-sm font-medium truncate">{nextStep.instruction}</p>
            </div>
          </div>
        )}
      </div>

      {/* Speed and stats */}
      <CardContent className="p-4 space-y-4">
        {/* Speed display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-muted">
              <Gauge className={cn("w-6 h-6", getSpeedColor(currentSpeed))} />
            </div>
            <div>
              <p className="text-3xl font-bold">{Math.round(currentSpeed)}</p>
              <p className="text-xs text-muted-foreground">كم/س</p>
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>الوصول: {calculateETA(remainingDuration)}</span>
            </div>
            <p className="text-lg font-bold mt-1">{formatDistanceArabic(remainingDistance)}</p>
            <p className="text-xs text-muted-foreground">متبقي</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>التقدم</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <Route className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs font-medium">{formatDistanceArabic(totalDistance)}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs font-medium">{formatDurationArabic(remainingDuration)}</p>
            <p className="text-[10px] text-muted-foreground">متبقي</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50 text-center">
            <Navigation className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xs font-medium">{steps.length - currentStepIndex}</p>
            <p className="text-[10px] text-muted-foreground">خطوات</p>
          </div>
        </div>

        {/* Speed warning */}
        <AnimatePresence>
          {currentSpeed > 120 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 dark:text-red-400"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">تحذير: السرعة عالية جداً!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All steps toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAllSteps(!showAllSteps)}
        >
          {showAllSteps ? (
            <>
              <ChevronUp className="w-4 h-4 ml-2" />
              إخفاء الخطوات
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 ml-2" />
              عرض كل الخطوات ({steps.length})
            </>
          )}
        </Button>

        {/* All steps list */}
        <AnimatePresence>
          {showAllSteps && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg text-sm",
                    index === currentStepIndex
                      ? "bg-primary/10 border border-primary/20"
                      : index < currentStepIndex
                      ? "opacity-50"
                      : "bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    index === currentStepIndex
                      ? "bg-primary text-white"
                      : "bg-muted"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{step.instruction}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceArabic(step.distance)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default DriverNavigationPanel;
