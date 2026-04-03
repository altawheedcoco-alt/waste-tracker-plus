import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wrench, Calendar, AlertTriangle, CheckCircle2, Clock, Truck,
  Package, Settings, TrendingUp, BarChart3
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  asset_type: 'vehicle' | 'container' | 'equipment';
  asset_name: string;
  task_type: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'overdue' | 'due_soon' | 'scheduled' | 'completed';
  due_date: string;
  last_done?: string;
  hours_remaining?: number;
  cost_estimate?: number;
}

const DEMO_TASKS: MaintenanceTask[] = [
  { id: '1', asset_type: 'vehicle', asset_name: 'شاحنة ن-١٢٣٤', task_type: 'تغيير زيت محرك', priority: 'urgent', status: 'overdue', due_date: '2026-04-01', last_done: '2026-01-01', cost_estimate: 450 },
  { id: '2', asset_type: 'vehicle', asset_name: 'شاحنة ن-٥٦٧٨', task_type: 'فحص فرامل', priority: 'high', status: 'due_soon', due_date: '2026-04-05', last_done: '2026-02-15', cost_estimate: 800 },
  { id: '3', asset_type: 'container', asset_name: 'حاوية C-042', task_type: 'تنظيف وتعقيم', priority: 'medium', status: 'scheduled', due_date: '2026-04-10', last_done: '2026-03-10', cost_estimate: 150 },
  { id: '4', asset_type: 'equipment', asset_name: 'كسارة بلاستيك #3', task_type: 'استبدال شفرات', priority: 'high', status: 'due_soon', due_date: '2026-04-06', hours_remaining: 120, cost_estimate: 2500 },
  { id: '5', asset_type: 'vehicle', asset_name: 'شاحنة ن-٩٠١٢', task_type: 'فحص إطارات', priority: 'low', status: 'scheduled', due_date: '2026-04-15', cost_estimate: 600 },
  { id: '6', asset_type: 'container', asset_name: 'حاوية C-018', task_type: 'إصلاح باب', priority: 'medium', status: 'completed', due_date: '2026-03-28', cost_estimate: 300 },
];

const STATUS_CONFIG = {
  overdue: { label: 'متأخر', class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
  due_soon: { label: 'قريب', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  scheduled: { label: 'مجدول', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Calendar },
  completed: { label: 'مكتمل', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
};

const ASSET_ICONS = { vehicle: Truck, container: Package, equipment: Settings };

const PreventiveMaintenanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');

  const overdue = DEMO_TASKS.filter(t => t.status === 'overdue').length;
  const dueSoon = DEMO_TASKS.filter(t => t.status === 'due_soon').length;
  const totalCost = DEMO_TASKS.filter(t => t.status !== 'completed').reduce((s, t) => s + (t.cost_estimate || 0), 0);
  const completionRate = Math.round((DEMO_TASKS.filter(t => t.status === 'completed').length / DEMO_TASKS.length) * 100);

  const filtered = activeTab === 'all' ? DEMO_TASKS : DEMO_TASKS.filter(t => t.asset_type === activeTab);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-red-500" />} value={overdue} label="متأخر" alert />
        <StatCard icon={<Clock className="h-4 w-4 text-amber-500" />} value={dueSoon} label="قريب الاستحقاق" />
        <StatCard icon={<TrendingUp className="h-4 w-4 text-primary" />} value={`${completionRate}%`} label="معدل الإنجاز" />
        <StatCard icon={<BarChart3 className="h-4 w-4 text-primary" />} value={`${(totalCost/1000).toFixed(1)}K`} label="تكلفة متوقعة (ج.م)" />
      </div>

      {/* Overdue Alert */}
      {overdue > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {overdue} مهمة صيانة متأخرة تحتاج تنفيذ فوري!
            </span>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 h-8">
          <TabsTrigger value="all" className="text-xs">الكل</TabsTrigger>
          <TabsTrigger value="vehicle" className="text-xs">مركبات</TabsTrigger>
          <TabsTrigger value="container" className="text-xs">حاويات</TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs">معدات</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tasks List */}
      <div className="space-y-3">
        {filtered.map(task => {
          const statusConfig = STATUS_CONFIG[task.status];
          const AssetIcon = ASSET_ICONS[task.asset_type];
          return (
            <Card key={task.id} className={task.status === 'overdue' ? 'border-red-200 dark:border-red-800' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AssetIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{task.asset_name}</span>
                  </div>
                  <Badge className={statusConfig.class + ' text-[9px] h-5'}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  <Wrench className="h-3 w-3 inline ml-1" />
                  {task.task_type}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>الاستحقاق: {new Date(task.due_date).toLocaleDateString('ar-EG')}</span>
                  {task.cost_estimate && <span>{task.cost_estimate} ج.م</span>}
                </div>
                {task.hours_remaining !== undefined && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>ساعات متبقية</span>
                      <span>{task.hours_remaining} ساعة</span>
                    </div>
                    <Progress value={Math.max(0, 100 - (task.hours_remaining / 500) * 100)} className="h-1.5" />
                  </div>
                )}
                {task.status !== 'completed' && (
                  <Button size="sm" className="w-full mt-3 h-7 text-xs">
                    <CheckCircle2 className="h-3 w-3 ml-1" />
                    تسجيل إتمام الصيانة
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const StatCard = ({ icon, value, label, alert }: { icon: React.ReactNode; value: string | number; label: string; alert?: boolean }) => (
  <Card className={alert ? 'border-red-200 dark:border-red-800' : ''}>
    <CardContent className="p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

export default PreventiveMaintenanceDashboard;
