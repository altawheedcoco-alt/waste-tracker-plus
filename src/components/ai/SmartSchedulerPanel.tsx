import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSmartScheduler } from '@/hooks/useSmartScheduler';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Truck,
  Package,
  Users,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SmartSchedulerPanelProps {
  onScheduleGenerated?: (result: any) => void;
}

const SmartSchedulerPanel = ({ onScheduleGenerated }: SmartSchedulerPanelProps) => {
  const { isScheduling, scheduleResult, generateSchedule, clearSchedule } = useSmartScheduler();
  const [expanded, setExpanded] = useState(true);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [maxPerDriver, setMaxPerDriver] = useState(8);
  const [prioritizeUrgent, setPrioritizeUrgent] = useState(true);

  const handleGenerate = async () => {
    const result = await generateSchedule(date, maxPerDriver, prioritizeUrgent);
    if (result && onScheduleGenerated) {
      onScheduleGenerated(result);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/20 dark:to-background">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500 text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                الجدولة الذكية
                <Sparkles className="h-4 w-4 text-amber-500" />
              </CardTitle>
              <CardDescription>
                توزيع تلقائي للشحنات على السائقين
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
              {/* Settings */}
              {!scheduleResult && (
                <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>تاريخ الجدولة</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>أقصى شحنات لكل سائق</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={maxPerDriver}
                      onChange={(e) => setMaxPerDriver(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>أولوية للشحنات العاجلة</Label>
                    <Switch
                      checked={prioritizeUrgent}
                      onCheckedChange={setPrioritizeUrgent}
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {!scheduleResult && (
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerate}
                  disabled={isScheduling}
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري إنشاء الجدول...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 ml-2" />
                      إنشاء جدول ذكي
                    </>
                  )}
                </Button>
              )}

              {/* Results */}
              {scheduleResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                      <Package className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                      <p className="text-xl font-bold text-blue-700">{scheduleResult.totalShipments}</p>
                      <p className="text-xs text-muted-foreground">شحنة</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                      <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-1" />
                      <p className="text-xl font-bold text-green-700">{scheduleResult.assignedCount}</p>
                      <p className="text-xs text-muted-foreground">تم تعيينها</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto text-purple-600 mb-1" />
                      <p className="text-xl font-bold text-purple-700">{scheduleResult.efficiency}%</p>
                      <p className="text-xs text-muted-foreground">كفاءة</p>
                    </div>
                  </div>

                  {/* Efficiency Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>كفاءة التوزيع</span>
                      <span className="font-bold">{scheduleResult.efficiency}%</span>
                    </div>
                    <Progress value={scheduleResult.efficiency} className="h-2" />
                  </div>

                  {/* Assignments */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      توزيع السائقين ({scheduleResult.assignments.length})
                    </h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {scheduleResult.assignments.map((assignment, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">{assignment.driverName}</span>
                              </div>
                              <Badge variant="secondary">
                                {assignment.shipments.length} شحنة
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {assignment.estimatedDuration} دقيقة
                              </span>
                              <span>{assignment.estimatedDistance} كم</span>
                              <span>حمولة: {Math.round(assignment.loadUtilization)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Unassigned Warning */}
                  {scheduleResult.unassignedShipments.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">شحنات غير معيّنة</span>
                      </div>
                      <p className="text-sm text-amber-600">
                        {scheduleResult.unassignedShipments.length} شحنة تحتاج سائقين إضافيين
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {scheduleResult.recommendations && scheduleResult.recommendations.length > 0 && (
                    <div className="p-3 bg-primary/5 rounded-lg">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        توصيات AI
                      </h4>
                      <ul className="space-y-1">
                        {scheduleResult.recommendations.map((rec, idx) => (
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
                    <Button variant="outline" className="flex-1" onClick={clearSchedule}>
                      إعادة الجدولة
                    </Button>
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
                      تطبيق الجدول
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

export default SmartSchedulerPanel;
