import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Satellite, 
  Brain, 
  Hand, 
  CheckCircle2, 
  Settings2,
  Zap,
  Eye,
  Clock,
  Navigation,
  Gauge,
  TrendingUp,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackingMode, TRACKING_MODES } from '@/types/tracking';
import { useTrackingSystem } from '@/hooks/useTrackingSystem';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TrackingModeControllerProps {
  shipmentId: string;
  driverId: string;
  pickupCoords: { lat: number; lng: number } | null;
  deliveryCoords: { lat: number; lng: number } | null;
  currentStatus: string;
  onModeChange?: (mode: TrackingMode) => void;
  compact?: boolean;
}

const modeIcons: Record<TrackingMode, React.ElementType> = {
  realtime: Satellite,
  ai: Brain,
  manual: Hand,
};

const modeColors: Record<TrackingMode, string> = {
  realtime: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  ai: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
  manual: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
};

const TrackingModeController = ({
  shipmentId,
  driverId,
  pickupCoords,
  deliveryCoords,
  currentStatus,
  onModeChange,
  compact = false,
}: TrackingModeControllerProps) => {
  const [showDetails, setShowDetails] = useState(!compact);
  
  const {
    activeMode,
    switchMode,
    getModeConfig,
    getAvailableModes,
    getCurrentState,
    realtimeTracking,
    aiTracking,
  } = useTrackingSystem({
    shipmentId,
    driverId,
    pickupCoords,
    deliveryCoords,
    currentStatus,
    initialMode: 'manual',
  });

  const handleModeChange = (mode: TrackingMode) => {
    switchMode(mode);
    onModeChange?.(mode);
  };

  const currentState = getCurrentState();
  const currentConfig = getModeConfig(activeMode);
  const ModeIcon = modeIcons[activeMode];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            نظام التتبع
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("gap-1", modeColors[activeMode])}>
              <ModeIcon className="h-3.5 w-3.5" />
              {currentConfig.label}
            </Badge>
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>{currentConfig.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2">
          {getAvailableModes().map((mode) => {
            const Icon = modeIcons[mode.mode];
            const isActive = activeMode === mode.mode;
            
            return (
              <motion.button
                key={mode.mode}
                onClick={() => handleModeChange(mode.mode)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all text-right",
                  isActive 
                    ? "border-primary bg-primary/5 shadow-lg" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
                  </motion.div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto",
                  modeColors[mode.mode]
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-medium text-sm text-center">{mode.label}</p>
              </motion.button>
            );
          })}
        </div>

        <Separator />

        {/* Mode Features */}
        <AnimatePresence mode="wait">
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h4 className="text-sm font-medium text-right">مميزات هذا النمط:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentConfig.features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50"
                  >
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-right flex-1">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-time Mode Stats */}
        {activeMode === 'realtime' && currentState && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="gap-1">
                {realtimeTracking.state.autoStatusChanges ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    تغيير تلقائي مفعل
                  </>
                ) : (
                  'تغيير تلقائي معطل'
                )}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">تفعيل التغيير التلقائي</span>
                <Switch
                  checked={realtimeTracking.state.autoStatusChanges}
                  onCheckedChange={realtimeTracking.toggleAutoStatus}
                />
              </div>
            </div>

            {realtimeTracking.zones.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">مناطق الجيوفنس:</p>
                <div className="flex flex-wrap gap-2">
                  {realtimeTracking.zones.map(zone => (
                    <Badge key={zone.id} variant="secondary" className="text-xs">
                      <Navigation className="h-3 w-3 ml-1" />
                      {zone.name} ({zone.radius}م)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Mode Stats */}
        {activeMode === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 space-y-3"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Clock className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">وقت الوصول المتوقع</p>
                <p className="font-bold text-sm">
                  {aiTracking.analysis.estimatedArrival 
                    ? format(aiTracking.analysis.estimatedArrival, 'HH:mm', { locale: ar })
                    : '--'}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Gauge className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">السرعة المتوسطة</p>
                <p className="font-bold text-sm">{aiTracking.analysis.avgSpeed} كم/س</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <TrendingUp className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">كفاءة المسار</p>
                <p className="font-bold text-sm">{aiTracking.analysis.routeEfficiency}%</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Brain className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                <p className="text-xs text-muted-foreground">مستوى الثقة</p>
                <p className="font-bold text-sm">{aiTracking.analysis.confidence}%</p>
              </div>
            </div>

            {aiTracking.analysis.recommendations.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  توصيات الذكاء الاصطناعي:
                </p>
                {aiTracking.analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-background/50">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    {rec}
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={aiTracking.logAIPrediction}
              className="w-full"
            >
              <Brain className="h-4 w-4 ml-2" />
              تسجيل التوقع الحالي
            </Button>
          </motion.div>
        )}

        {/* Manual Mode Info */}
        {activeMode === 'manual' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-right">
                <p className="font-medium">النمط اليدوي مفعل</p>
                <p className="text-muted-foreground mt-1">
                  يمكنك تغيير حالة الشحنة يدوياً من أزرار الحالة. لن يتم إجراء أي تغييرات تلقائية.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingModeController;
