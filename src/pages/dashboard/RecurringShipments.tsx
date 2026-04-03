import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CalendarClock, Plus, Repeat, Trash2, Edit, Play, Pause, 
  Package, Clock, CheckCircle2, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecurringSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  wasteType: string;
  estimatedWeight: number;
  pickupAddress: string;
  destinationAddress: string;
  isActive: boolean;
  nextRun: string;
  lastRun?: string;
  totalExecuted: number;
}

const FREQUENCIES = [
  { value: 'daily', label: 'يومياً', icon: '📅' },
  { value: 'weekly', label: 'أسبوعياً', icon: '📆' },
  { value: 'biweekly', label: 'كل أسبوعين', icon: '🗓️' },
  { value: 'monthly', label: 'شهرياً', icon: '📊' },
];

const RecurringShipments = () => {
  const { profile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([
    // Demo data
    {
      id: '1',
      name: 'جمع نفايات المصنع الرئيسي',
      frequency: 'weekly',
      wasteType: 'نفايات صناعية غير خطرة',
      estimatedWeight: 5000,
      pickupAddress: 'المنطقة الصناعية - العاشر من رمضان',
      destinationAddress: 'مصنع إعادة التدوير - السادات',
      isActive: true,
      nextRun: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      lastRun: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      totalExecuted: 12,
    },
    {
      id: '2',
      name: 'مخلفات الفرع الثاني',
      frequency: 'biweekly',
      wasteType: 'نفايات عضوية',
      estimatedWeight: 2000,
      pickupAddress: 'المعادي - القاهرة',
      destinationAddress: 'محطة سماد عضوي',
      isActive: false,
      nextRun: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      totalExecuted: 6,
    },
  ]);

  const [form, setForm] = useState({
    name: '', frequency: 'weekly' as string, wasteType: '',
    estimatedWeight: '', pickupAddress: '', destinationAddress: '',
  });

  const handleCreate = () => {
    if (!form.name || !form.wasteType) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const newSchedule: RecurringSchedule = {
      id: Date.now().toString(),
      ...form,
      frequency: form.frequency as any,
      estimatedWeight: Number(form.estimatedWeight) || 0,
      isActive: true,
      nextRun: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      totalExecuted: 0,
    };
    setSchedules(prev => [newSchedule, ...prev]);
    setShowCreate(false);
    setForm({ name: '', frequency: 'weekly', wasteType: '', estimatedWeight: '', pickupAddress: '', destinationAddress: '' });
    toast.success('✅ تم إنشاء الجدولة بنجاح');
  };

  const toggleActive = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    toast.success('تم تحديث الحالة');
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.success('تم حذف الجدولة');
  };

  const getFreqLabel = (f: string) => FREQUENCIES.find(fr => fr.value === f)?.label || f;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" />
            الشحنات المتكررة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            جدولة شحنات تلقائية دورية لتوفير الوقت والجهد
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              جدولة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء جدولة شحن متكررة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>اسم الجدولة *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: جمع نفايات المصنع" />
              </div>
              <div>
                <Label>التكرار *</Label>
                <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(fr => (
                      <SelectItem key={fr.value} value={fr.value}>{fr.icon} {fr.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع المخلفات *</Label>
                <Input value={form.wasteType} onChange={e => setForm(f => ({ ...f, wasteType: e.target.value }))} placeholder="نفايات صناعية / عضوية / خطرة" />
              </div>
              <div>
                <Label>الوزن التقديري (كجم)</Label>
                <Input type="number" value={form.estimatedWeight} onChange={e => setForm(f => ({ ...f, estimatedWeight: e.target.value }))} placeholder="5000" />
              </div>
              <div>
                <Label>عنوان الاستلام</Label>
                <Input value={form.pickupAddress} onChange={e => setForm(f => ({ ...f, pickupAddress: e.target.value }))} placeholder="المنطقة الصناعية..." />
              </div>
              <div>
                <Label>عنوان التسليم</Label>
                <Input value={form.destinationAddress} onChange={e => setForm(f => ({ ...f, destinationAddress: e.target.value }))} placeholder="مصنع التدوير..." />
              </div>
              <Button onClick={handleCreate} className="w-full gap-2">
                <CheckCircle2 className="w-4 h-4" />
                إنشاء الجدولة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{schedules.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي الجدولات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{schedules.filter(s => s.isActive).length}</p>
            <p className="text-xs text-muted-foreground">نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{schedules.reduce((s, sc) => s + sc.totalExecuted, 0)}</p>
            <p className="text-xs text-muted-foreground">شحنات مُنفذة</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        <AnimatePresence>
          {schedules.map((schedule, i) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`transition-all ${!schedule.isActive ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Repeat className={`w-4 h-4 ${schedule.isActive ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <h3 className="font-semibold">{schedule.name}</h3>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'نشطة' : 'متوقفة'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getFreqLabel(schedule.frequency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {schedule.wasteType}
                        </span>
                        {schedule.estimatedWeight > 0 && (
                          <span>{schedule.estimatedWeight.toLocaleString()} كجم</span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {schedule.pickupAddress || 'غير محدد'}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span>التالي: {new Date(schedule.nextRun).toLocaleDateString('ar-EG')}</span>
                        <span>مُنفذة: {schedule.totalExecuted} شحنة</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={schedule.isActive} onCheckedChange={() => toggleActive(schedule.id)} />
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteSchedule(schedule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {schedules.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <CalendarClock className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>لا توجد جدولات بعد. أنشئ أول جدولة شحن متكررة.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
      </DashboardLayout>
  );
};

export default RecurringShipments;
