import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteOptimizer } from '@/hooks/useRouteOptimizer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Route,
  MapPin,
  Navigation,
  Fuel,
  Clock,
  Leaf,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  name: string;
  type: 'pickup' | 'delivery';
  shipmentId?: string;
  priority?: number;
}

interface RouteOptimizerPanelProps {
  driverId: string;
  currentLocation?: { lat: number; lng: number };
  destinations: Location[];
  onRouteOptimized?: (route: any) => void;
}

const RouteOptimizerPanel = ({
  driverId,
  currentLocation = { lat: 30.0444, lng: 31.2357 },
  destinations,
  onRouteOptimized
}: RouteOptimizerPanelProps) => {
  const { isOptimizing, optimizedRoute, optimizeRoute, clearRoute } = useRouteOptimizer();
  const [expanded, setExpanded] = useState(true);

  const handleOptimize = async () => {
    const result = await optimizeRoute(driverId, currentLocation, destinations);
    if (result && onRouteOptimized) {
      onRouteOptimized(result);
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                تحسين المسار الذكي
                <Sparkles className="h-4 w-4 text-amber-500" />
              </CardTitle>
              <CardDescription>
                AI لتقليل المسافة والوقت
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <CardContent className="space-y-4">
              {/* Destinations Summary */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{destinations.length} نقطة توصيل</span>
                </div>
                <Badge variant="outline">
                  {destinations.filter(d => d.type === 'pickup').length} استلام
                  {' / '}
                  {destinations.filter(d => d.type === 'delivery').length} تسليم
                </Badge>
              </div>

              {/* Optimize Button */}
              {!optimizedRoute && (
                <Button
                  className="w-full"
                  onClick={handleOptimize}
                  disabled={isOptimizing || destinations.length === 0}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري التحسين...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4 ml-2" />
                      تحسين المسار بالذكاء الاصطناعي
                    </>
                  )}
                </Button>
              )}

              {/* Optimized Route Results */}
              {optimizedRoute && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Route className="h-4 w-4" />
                        <span className="text-xs">المسافة</span>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {optimizedRoute.totalDistance} كم
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">الوقت</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {optimizedRoute.totalDuration} دقيقة
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Fuel className="h-4 w-4" />
                        <span className="text-xs">توفير الوقود</span>
                      </div>
                      <p className="text-lg font-bold text-amber-700">
                        {optimizedRoute.fuelEstimate}%
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <Leaf className="h-4 w-4" />
                        <span className="text-xs">تقليل CO₂</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-700">
                        {optimizedRoute.co2Savings} كجم
                      </p>
                    </div>
                  </div>

                  {/* Optimized Stops Order */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">ترتيب المحطات المحسّن:</h4>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {optimizedRoute.orderedStops.map((stop, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              stop.type === 'pickup' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{stop.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {stop.type === 'pickup' ? 'استلام' : 'تسليم'}
                              </p>
                            </div>
                            {idx < optimizedRoute.orderedStops.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Recommendations */}
                  {optimizedRoute.recommendations && optimizedRoute.recommendations.length > 0 && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        توصيات AI
                      </h4>
                      <ul className="space-y-1">
                        {optimizedRoute.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearRoute}>
                      إعادة حساب
                    </Button>
                    <Button className="flex-1">
                      <Navigation className="h-4 w-4 ml-2" />
                      بدء التنقل
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default RouteOptimizerPanel;
