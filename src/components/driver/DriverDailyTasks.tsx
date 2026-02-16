import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Navigation, MapPin, Clock, CheckCircle2, Package, 
  Phone, ArrowLeft, Truck, Scale
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  expected_delivery_date: string | null;
  generator?: { name: string } | null;
  recycler?: { name: string } | null;
}

interface DriverDailyTasksProps {
  shipments: Shipment[];
  onNavigate: (shipment: Shipment) => void;
  onViewDetails: (shipment: Shipment) => void;
}

const statusOrder: Record<string, number> = {
  approved: 1,
  in_transit: 2,
  new: 3,
  delivered: 4,
  confirmed: 5,
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'جديدة', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Package },
  approved: { label: 'بانتظار الاستلام', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Clock },
  in_transit: { label: 'في الطريق', color: 'bg-primary/10 text-primary border-primary/30', icon: Truck },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', icon: CheckCircle2 },
};

const DriverDailyTasks = ({ shipments, onNavigate, onViewDetails }: DriverDailyTasksProps) => {
  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return shipments
      .filter(s => ['new', 'approved', 'in_transit'].includes(s.status))
      .sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
  }, [shipments]);

  const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
  const total = shipments.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Daily Progress */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">تقدم اليوم</span>
            <span className="text-sm text-muted-foreground">{completed}/{total} مهمة</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{todayTasks.length} مهمة متبقية</span>
            <span>{Math.round(progress)}% مكتمل</span>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      {todayTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-emerald-500/30" />
            <p className="font-semibold text-lg">أحسنت! 🎉</p>
            <p className="text-sm text-muted-foreground">لا توجد مهام متبقية لليوم</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todayTasks.map((task, idx) => {
            const config = statusConfig[task.status] || statusConfig.new;
            const Icon = config.icon;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border overflow-hidden">
                  <CardContent className="p-0">
                    {/* Status Bar */}
                    <div className={`px-4 py-2 flex items-center justify-between ${config.color} border-b`}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-semibold">{config.label}</span>
                      </div>
                      <span className="text-xs font-mono">{task.shipment_number}</span>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Waste Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{task.waste_type}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">{task.quantity} {task.unit}</Badge>
                      </div>

                      {/* Route */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">من: {task.generator?.name || 'المولد'}</p>
                            <p className="text-sm truncate">{task.pickup_address || 'غير محدد'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">إلى: {task.recycler?.name || 'المستلم'}</p>
                            <p className="text-sm truncate">{task.delivery_address || 'غير محدد'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={() => onNavigate(task)}
                        >
                          <Navigation className="w-4 h-4" />
                          ابدأ التنقل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails(task)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                        {task.generator && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Open phone dialer
                              window.open(`tel:`, '_self');
                            }}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriverDailyTasks;
