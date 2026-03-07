import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CheckSquare, Plus, Clock, CheckCircle2, AlertCircle, 
  ListTodo, Trash2, Calendar, User, Flag, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  category: string;
}

const PRIORITIES = {
  high: { label: 'عاجل', color: 'text-red-500', bg: 'bg-red-500/10', badge: 'destructive' as const },
  medium: { label: 'متوسط', color: 'text-amber-500', bg: 'bg-amber-500/10', badge: 'secondary' as const },
  low: { label: 'منخفض', color: 'text-blue-500', bg: 'bg-blue-500/10', badge: 'outline' as const },
};

const STATUS_COLS = [
  { key: 'todo' as const, label: 'قيد الانتظار', icon: ListTodo, color: 'border-t-amber-500' },
  { key: 'in_progress' as const, label: 'قيد التنفيذ', icon: Clock, color: 'border-t-blue-500' },
  { key: 'done' as const, label: 'مكتملة', icon: CheckCircle2, color: 'border-t-green-500' },
];

const EmployeeTaskBoard = () => {
  const { profile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1', title: 'مراجعة شحنة #SH-2024-0156', description: 'التحقق من أوزان الشحنة ومطابقتها مع المانيفست',
      status: 'todo', priority: 'high', dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(), category: 'شحنات',
    },
    {
      id: '2', title: 'تحديث بيانات السائق أحمد', description: 'تجديد رخصة القيادة وتحديث البيانات في النظام',
      status: 'in_progress', priority: 'medium', dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(), category: 'موارد بشرية',
    },
    {
      id: '3', title: 'إعداد تقرير الأسبوع', description: 'تجميع بيانات الشحنات والإيرادات الأسبوعية',
      status: 'done', priority: 'low', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), category: 'تقارير',
    },
  ]);

  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'عام' });

  const handleCreate = () => {
    if (!form.title) { toast.error('أدخل عنوان المهمة'); return; }
    setTasks(prev => [{
      id: Date.now().toString(), ...form,
      priority: form.priority as any, status: 'todo',
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setShowCreate(false);
    setForm({ title: '', description: '', priority: 'medium', category: 'عام' });
    toast.success('✅ تم إضافة المهمة');
  };

  const moveTask = (id: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success(newStatus === 'done' ? '🎉 أحسنت! تم إنجاز المهمة' : 'تم تحديث الحالة');
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('تم حذف المهمة');
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-primary" />
            لوحة المهام
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            تتبع وإنجاز مهامك اليومية بكفاءة
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> مهمة جديدة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إضافة مهمة جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان المهمة *" />
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف تفصيلي..." rows={3} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue placeholder="الأولوية" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 عاجل</SelectItem>
                    <SelectItem value="medium">🟡 متوسط</SelectItem>
                    <SelectItem value="low">🔵 منخفض</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="التصنيف" />
              </div>
              <Button onClick={handleCreate} className="w-full">إنشاء المهمة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATUS_COLS.map(col => (
          <Card key={col.key}>
            <CardContent className="p-4 text-center">
              <col.icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{tasks.filter(t => t.status === col.key).length}</p>
              <p className="text-xs text-muted-foreground">{col.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-4">
        {STATUS_COLS.map(col => (
          <div key={col.key} className="space-y-3">
            <div className={`border-t-4 ${col.color} rounded-t-lg`}>
              <h3 className="font-semibold text-sm p-3 bg-muted/50 rounded-b-lg flex items-center gap-2">
                <col.icon className="w-4 h-4" />
                {col.label}
                <Badge variant="outline" className="ms-auto">{tasks.filter(t => t.status === col.key).length}</Badge>
              </h3>
            </div>
            <AnimatePresence>
              {tasks.filter(t => t.status === col.key).map(task => {
                const pri = PRIORITIES[task.priority];
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={pri.badge} className="text-[10px]">
                            <Flag className="w-2.5 h-2.5 me-1" />
                            {pri.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{task.category}</Badge>
                        </div>
                        <div className="flex gap-1 mt-2">
                          {col.key !== 'todo' && (
                            <Button size="sm" variant="ghost" className="text-[10px] h-6" onClick={() => moveTask(task.id, col.key === 'done' ? 'in_progress' : 'todo')}>
                              → السابق
                            </Button>
                          )}
                          {col.key !== 'done' && (
                            <Button size="sm" variant="outline" className="text-[10px] h-6 ms-auto" onClick={() => moveTask(task.id, col.key === 'todo' ? 'in_progress' : 'done')}>
                              {col.key === 'in_progress' ? '✓ إنجاز' : 'بدء →'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeTaskBoard;
