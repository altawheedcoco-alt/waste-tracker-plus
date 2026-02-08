import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMaintenancePredictor } from '@/hooks/useMaintenancePredictor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Truck,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface MaintenancePredictorPanelProps {
  vehicleIds?: string[];
  onPredictionsGenerated?: (predictions: any[]) => void;
}

const riskColors = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const riskLabels = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالي',
  critical: 'حرج'
};

const MaintenancePredictorPanel = ({ vehicleIds, onPredictionsGenerated }: MaintenancePredictorPanelProps) => {
  const { isPredicting, predictions, summary, generatePredictions, clearPredictions } = useMaintenancePredictor();
  const [expanded, setExpanded] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const handleGenerate = async () => {
    const result = await generatePredictions(vehicleIds);
    if (result && onPredictionsGenerated) {
      onPredictionsGenerated(result);
    }
  };

  const selectedPrediction = predictions.find(p => p.vehicleId === selectedVehicle);

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-white dark:from-orange-950/20 dark:to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500 text-white">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                التنبؤ بالصيانة
                <Sparkles className="h-4 w-4 text-amber-500" />
              </CardTitle>
              <CardDescription>
                كشف مبكر عن الأعطال المحتملة
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
              {/* Generate Button */}
              {predictions.length === 0 && (
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleGenerate}
                  disabled={isPredicting}
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Wrench className="h-4 w-4 ml-2" />
                      تحليل المركبات
                    </>
                  )}
                </Button>
              )}

              {/* Summary */}
              {summary && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
                    <p className="text-lg font-bold text-red-700">{summary.criticalRisk}</p>
                    <p className="text-[10px] text-muted-foreground">حرج</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-center">
                    <p className="text-lg font-bold text-orange-700">{summary.highRisk}</p>
                    <p className="text-[10px] text-muted-foreground">عالي</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-center">
                    <p className="text-lg font-bold text-amber-700">{summary.mediumRisk}</p>
                    <p className="text-[10px] text-muted-foreground">متوسط</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                    <p className="text-lg font-bold text-green-700">{summary.lowRisk}</p>
                    <p className="text-[10px] text-muted-foreground">منخفض</p>
                  </div>
                </div>
              )}

              {/* Vehicles List */}
              {predictions.length > 0 && (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {predictions.map((prediction) => (
                      <motion.div
                        key={prediction.vehicleId}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedVehicle === prediction.vehicleId
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedVehicle(
                          selectedVehicle === prediction.vehicleId ? null : prediction.vehicleId
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span className="font-medium">{prediction.vehiclePlate}</span>
                          </div>
                          <Badge className={`${riskColors[prediction.riskLevel]} text-white`}>
                            {riskLabels[prediction.riskLevel]}
                          </Badge>
                        </div>

                        <AnimatePresence>
                          {selectedVehicle === prediction.vehicleId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t space-y-3"
                            >
                              {/* Next Maintenance */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  الصيانة القادمة
                                </span>
                                <span className="font-medium">
                                  {format(new Date(prediction.nextMaintenanceDate), 'dd/MM/yyyy')}
                                </span>
                              </div>

                              {/* Estimated Cost */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <DollarSign className="h-3 w-3" />
                                  التكلفة التقديرية
                                </span>
                                <span className="font-medium">
                                  {prediction.estimatedCost.toLocaleString()} ج.م
                                </span>
                              </div>

                              {/* Predicted Issues */}
                              <div>
                                <h5 className="text-xs font-medium mb-2 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  مشاكل متوقعة
                                </h5>
                                <div className="space-y-2">
                                  {prediction.predictedIssues.map((issue, idx) => (
                                    <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">{issue.component}</span>
                                        <span className="text-muted-foreground">
                                          {issue.estimatedDaysUntilFailure} يوم
                                        </span>
                                      </div>
                                      <Progress value={issue.probability} className="h-1 mb-1" />
                                      <p className="text-muted-foreground">{issue.recommendedAction}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Recommendations */}
                              {prediction.recommendations && prediction.recommendations.length > 0 && (
                                <div className="p-2 bg-primary/5 rounded">
                                  <ul className="space-y-1">
                                    {prediction.recommendations.map((rec, idx) => (
                                      <li key={idx} className="text-xs flex items-start gap-1">
                                        <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Actions */}
              {predictions.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearPredictions}>
                    إعادة التحليل
                  </Button>
                  <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                    جدولة الصيانة
                  </Button>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default MaintenancePredictorPanel;
