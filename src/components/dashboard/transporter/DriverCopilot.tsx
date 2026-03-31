import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, MapPin, CheckCircle2, Clock, AlertTriangle,
  Phone, Camera, Mic, ChevronLeft, ChevronRight, Package,
  Truck, Flag, RotateCcw, Sparkles, User, ArrowDown
} from 'lucide-react';

interface CopilotTask {
  id: string;
  driver_id: string;
  shipment_id: string | null;
  task_type: string;
  task_order: number;
  status: string;
  title: string;
  description: string | null;
  location_name: string | null;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  completed_at: string | null;
  notes: string | null;
}

const taskTypeIcons: Record<string, any> = {
  pickup: Package,
  delivery: Truck,
  checkpoint: Flag,
  inspection: AlertTriangle,
};

const taskTypeColors: Record<string, string> = {
  pickup: 'from-blue-500 to-cyan-500',
  delivery: 'from-green-500 to-emerald-500',
  checkpoint: 'from-purple-500 to-violet-500',
  inspection: 'from-amber-500 to-orange-500',
};

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  in_progress: 'جارٍ التنفيذ',
  completed: 'مكتمل',
  skipped: 'تم التخطي',
};

const DriverCopilot = () => {
  const { organization } = useAuth();
  const [tasks, setTasks] = useState<CopilotTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (organization?.id) fetchDrivers();
  }, [organization?.id]);

  useEffect(() => {
    if (selectedDriver) fetchTasks();
  }, [selectedDriver]);

  const fetchDrivers = async () => {
    const { data } = await supabase
      .from('drivers')
      .select('id, profile_id, profiles:profile_id(full_name)')
      .eq('organization_id', organization!.id)
      .limit(50);
    if (data) {
      const mapped = data.map((d: any) => ({ id: d.id, name: d.profiles?.full_name || d.id.slice(0, 8) }));
      setDrivers(mapped);
      if (mapped.length > 0) setSelectedDriver(mapped[0].id);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('driver_copilot_tasks')
      .select('*')
      .eq('driver_id', selectedDriver!)
      .order('task_order');
    if (data) {
      setTasks(data as CopilotTask[]);
      const firstPending = data.findIndex(t => t.status === 'pending' || t.status === 'in_progress');
      setActiveTaskIndex(firstPending >= 0 ? firstPending : 0);
    }
    setLoading(false);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    const updates: any = { status };
    if (status === 'in_progress') updates.actual_arrival = new Date().toISOString();
    if (status === 'completed') updates.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('driver_copilot_tasks')
      .update(updates)
      .eq('id', taskId);

    if (!error) {
      toast.success(status === 'completed' ? 'تم إكمال المهمة ✓' : 'تم بدء المهمة');
      fetchTasks();
      if (status === 'completed' && activeTaskIndex < tasks.length - 1) {
        setActiveTaskIndex(activeTaskIndex + 1);
      }
    }
  };

  const generateDemoTasks = async () => {
    if (!selectedDriver || !organization?.id) return;
    const demoTasks = [
      { task_type: 'pickup', title: 'استلام شحنة - مصنع الرياض', description: 'استلام 5 طن نفايات صناعية', location_name: 'مصنع الرياض الصناعي', task_order: 1 },
      { task_type: 'checkpoint', title: 'نقطة تفتيش - الميزان', description: 'وزن الشحنة والتحقق من الأوراق', location_name: 'محطة الميزان الرئيسية', task_order: 2 },
      { task_type: 'delivery', title: 'تسليم - مركز إعادة التدوير', description: 'تسليم الشحنة والحصول على إيصال', location_name: 'مركز إعادة التدوير', task_order: 3 },
      { task_type: 'inspection', title: 'فحص المركبة', description: 'فحص سلامة المركبة بعد الرحلة', location_name: 'مقر الشركة', task_order: 4 },
    ];

    for (const task of demoTasks) {
      await supabase.from('driver_copilot_tasks').insert({
        ...task,
        driver_id: selectedDriver,
        organization_id: organization.id,
        status: 'pending',
      });
    }
    toast.success('تم إنشاء مهام تجريبية');
    fetchTasks();
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const activeTask = tasks[activeTaskIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-none bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-cyan-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Navigation className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold">مساعد السائق الذكي</h2>
                  <p className="text-sm text-muted-foreground">
                    إدارة المهام خطوة بخطوة مع توجيه ذكي
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Driver selector */}
                <select
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  value={selectedDriver || ''}
                  onChange={e => setSelectedDriver(e.target.value)}
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={generateDemoTasks} className="gap-1">
                  <Sparkles className="w-3 h-3" /> إنشاء مهام نموذجية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress */}
      {tasks.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">تقدم الرحلة</span>
              <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length} مهام</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Active Task Card */}
      {activeTask && (
        <motion.div
          key={activeTask.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${taskTypeColors[activeTask.task_type] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-xl`}>
                  {(() => {
                    const Icon = taskTypeIcons[activeTask.task_type] || Package;
                    return <Icon className="w-10 h-10 text-white" />;
                  })()}
                </div>
                <div>
                  <Badge className="mb-2">{statusLabels[activeTask.status]}</Badge>
                  <h3 className="text-lg font-bold">{activeTask.title}</h3>
                  {activeTask.description && (
                    <p className="text-sm text-muted-foreground mt-1">{activeTask.description}</p>
                  )}
                </div>
                {activeTask.location_name && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {activeTask.location_name}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                    <Phone className="w-5 h-5" />
                    <span className="text-[10px]">اتصال</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px]">صورة</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-16 gap-1">
                    <Mic className="w-5 h-5" />
                    <span className="text-[10px]">ملاحظة صوتية</span>
                  </Button>
                </div>

                {/* Status Actions */}
                <div className="flex gap-2 pt-2">
                  {activeTask.status === 'pending' && (
                    <Button
                      className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-cyan-600"
                      onClick={() => updateTaskStatus(activeTask.id, 'in_progress')}
                    >
                      <Navigation className="w-4 h-4" /> بدء المهمة
                    </Button>
                  )}
                  {activeTask.status === 'in_progress' && (
                    <Button
                      className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-600"
                      onClick={() => updateTaskStatus(activeTask.id, 'completed')}
                    >
                      <CheckCircle2 className="w-4 h-4" /> إكمال المهمة
                    </Button>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={activeTaskIndex === 0}
                    onClick={() => setActiveTaskIndex(Math.max(0, activeTaskIndex - 1))}
                  >
                    <ChevronRight className="w-4 h-4" /> السابقة
                  </Button>
                  <span className="text-xs text-muted-foreground">{activeTaskIndex + 1} / {tasks.length}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={activeTaskIndex >= tasks.length - 1}
                    onClick={() => setActiveTaskIndex(Math.min(tasks.length - 1, activeTaskIndex + 1))}
                  >
                    التالية <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Task Timeline */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" /> خط سير المهام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {tasks.map((task, idx) => {
                const Icon = taskTypeIcons[task.task_type] || Package;
                const isActive = idx === activeTaskIndex;
                const isCompleted = task.status === 'completed';
                return (
                  <div key={task.id}>
                    <motion.div
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveTaskIndex(idx)}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500/20 text-green-600'
                          : isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 text-right">
                        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.location_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {task.location_name}
                          </p>
                        )}
                      </div>
                      <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-[10px]">
                        {statusLabels[task.status]}
                      </Badge>
                    </motion.div>
                    {idx < tasks.length - 1 && (
                      <div className="flex justify-start mr-8">
                        <ArrowDown className={`w-4 h-4 ${isCompleted ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Navigation className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-bold mb-1">لا توجد مهام حالية</h3>
            <p className="text-sm text-muted-foreground mb-4">
              قم بإنشاء مهام تجريبية أو أسند شحنات للسائق
            </p>
            <Button onClick={generateDemoTasks} className="gap-2">
              <Sparkles className="w-4 h-4" /> إنشاء مهام تجريبية
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverCopilot;
