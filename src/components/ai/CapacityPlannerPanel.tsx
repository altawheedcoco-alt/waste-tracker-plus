import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Layers,
  Truck,
  Users,
  Warehouse,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useCapacityPlanner } from '@/hooks/useCapacityPlanner';

const CapacityPlannerPanel = () => {
  const { isPlanning, result, error, planCapacity, clearResults } = useCapacityPlanner();
  const [planningHorizon, setPlanningHorizon] = useState<'7days' | '30days' | '90days' | '1year'>('30days');

  // بيانات موارد تجريبية
  const mockResourceData = {
    vehicles: {
      total: 25,
      available: 18,
      inMaintenance: 3,
      utilization: 78
    },
    drivers: {
      total: 35,
      available: 28,
      avgWorkload: 82
    },
    storage: {
      totalCapacity: 5000,
      usedCapacity: 3800,
      utilizationRate: 76
    },
    demandForecast: {
      expectedShipments: 450,
      expectedWeight: 12000,
      peakLoad: 95
    }
  };

  const handlePlan = () => {
    planCapacity(mockResourceData, planningHorizon);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_capacity':
        return 'text-red-500 bg-red-500/10';
      case 'near_capacity':
        return 'text-orange-500 bg-orange-500/10';
      case 'optimal':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-blue-500 bg-blue-500/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'over_capacity':
        return 'متجاوز للسعة';
      case 'near_capacity':
        return 'قريب من الحد';
      case 'optimal':
        return 'مثالي';
      default:
        return 'سعة متاحة';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 text-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 text-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
      default:
        return 'border-green-500 text-green-500 bg-green-500/10';
    }
  };

  const getHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case '7days':
        return '7 أيام';
      case '30days':
        return '30 يوم';
      case '90days':
        return '3 أشهر';
      case '1year':
        return 'سنة';
      default:
        return horizon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">تخطيط السعة الذكي</CardTitle>
                <p className="text-sm text-muted-foreground">
                  التنبؤ باحتياجات الموارد والسعة المستقبلية
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={planningHorizon}
                onChange={(e) => setPlanningHorizon(e.target.value as any)}
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="7days">7 أيام</option>
                <option value="30days">30 يوم</option>
                <option value="90days">3 أشهر</option>
                <option value="1year">سنة</option>
              </select>
              <Button onClick={handlePlan} disabled={isPlanning}>
                {isPlanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                    جاري التخطيط...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 ml-2" />
                    تخطيط السعة
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isPlanning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isPlanning && (
        <>
          {/* Current Capacity Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">تحليل السعة الحالية</CardTitle>
                  <Badge className={getStatusColor(result.currentCapacityAnalysis?.status || 'optimal')}>
                    {getStatusLabel(result.currentCapacityAnalysis?.status || 'optimal')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">المركبات</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {result.currentCapacityAnalysis?.vehicleUtilization || 0}%
                    </div>
                    <Progress 
                      value={result.currentCapacityAnalysis?.vehicleUtilization || 0} 
                      className="h-2 mt-2" 
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">السائقين</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {result.currentCapacityAnalysis?.driverWorkload || 0}%
                    </div>
                    <Progress 
                      value={result.currentCapacityAnalysis?.driverWorkload || 0} 
                      className="h-2 mt-2" 
                    />
                  </div>
                  
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Warehouse className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-medium">التخزين</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {result.currentCapacityAnalysis?.storageUtilization || 0}%
                    </div>
                    <Progress 
                      value={result.currentCapacityAnalysis?.storageUtilization || 0} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5">
                  <span className="text-sm">درجة السعة الإجمالية</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      {result.currentCapacityAnalysis?.overallCapacityScore || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                </div>

                {result.currentCapacityAnalysis?.bottlenecks && result.currentCapacityAnalysis.bottlenecks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">الاختناقات الحالية:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.currentCapacityAnalysis.bottlenecks.map((bottleneck, index) => (
                        <Badge key={index} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          <AlertTriangle className="w-3 h-3 ml-1" />
                          {bottleneck}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Future Requirements */}
          {result.futureRequirements && result.futureRequirements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">الاحتياجات المستقبلية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.futureRequirements.map((req, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-lg border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{req.resource}</span>
                          <Badge className={getPriorityColor(req.urgency)}>
                            {req.urgency === 'critical' ? 'حرج' :
                             req.urgency === 'high' ? 'عالي' :
                             req.urgency === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>الحالي:</span>
                            <span className="font-medium text-foreground">{req.currentCount}</span>
                          </div>
                          <ArrowRight className="w-4 h-4" />
                          <div className="flex items-center gap-1">
                            <span>المطلوب:</span>
                            <span className="font-medium text-foreground">{req.requiredCount}</span>
                          </div>
                          {req.gap && req.gap !== 0 && (
                            <Badge variant="outline" className={req.gap > 0 ? 'text-red-500' : 'text-green-500'}>
                              {req.gap > 0 ? '+' : ''}{req.gap} فجوة
                            </Badge>
                          )}
                        </div>
                        {req.timeline && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {req.timeline}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Plan */}
          {result.actionPlan && result.actionPlan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">خطة العمل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.actionPlan.map((action, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                            <span className="font-medium">{action.action}</span>
                          </div>
                          <Badge className={getPriorityColor(action.priority)}>
                            {action.priority === 'critical' ? 'حرج' :
                             action.priority === 'high' ? 'عالي' :
                             action.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                        </div>
                        {action.description && (
                          <p className="text-sm text-muted-foreground mr-7">{action.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3 mr-7 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {action.timeline}
                          </div>
                          {action.estimatedCost && (
                            <div>التكلفة: {action.estimatedCost}</div>
                          )}
                          {action.responsible && (
                            <div>المسؤول: {action.responsible}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Summary */}
          {result.summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-sm">{result.summary}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isPlanning && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">ابدأ التخطيط</h3>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط على "تخطيط السعة" للحصول على تحليل شامل للموارد
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CapacityPlannerPanel;
