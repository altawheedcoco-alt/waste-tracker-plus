import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList, Plus, Play, Pause, CheckCircle2, Clock,
  Package, Users, Cog, Zap, ArrowRight, Calendar
} from 'lucide-react';

interface WorkOrder {
  id: string;
  orderNumber: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  materialType: string;
  inputQuantityKg: number;
  outputQuantityKg: number;
  wasteQuantityKg: number;
  workers: number;
  equipmentUsed: string[];
  startTime: string;
  endTime?: string;
  notes: string;
  batchNumber: string;
  productName: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'مسودة', color: 'text-muted-foreground', bg: 'bg-muted', icon: ClipboardList },
  in_progress: { label: 'جاري التشغيل', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Play },
  completed: { label: 'مكتمل', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'text-destructive', bg: 'bg-destructive/10', icon: Pause },
};

const WorkOrdersPanel = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([
    {
      id: '1', orderNumber: 'WO-2025-001', status: 'completed',
      materialType: 'بلاستيك PET', inputQuantityKg: 5000, outputQuantityKg: 3800,
      wasteQuantityKg: 1200, workers: 8, equipmentUsed: ['ماكينة تقطيع', 'خط غسيل', 'ماكينة صهر'],
      startTime: '2025-02-10T08:00', endTime: '2025-02-10T16:00',
      notes: 'تشغيلة ممتازة - نسبة عائد 76%', batchNumber: 'B-2025-042', productName: 'حبيبات PET'
    },
    {
      id: '2', orderNumber: 'WO-2025-002', status: 'in_progress',
      materialType: 'كرتون مختلط', inputQuantityKg: 3000, outputQuantityKg: 0,
      wasteQuantityKg: 0, workers: 5, equipmentUsed: ['ماكينة كبس', 'خط فرز'],
      startTime: '2025-02-14T07:00',
      notes: '', batchNumber: 'B-2025-043', productName: 'بالات كرتون مضغوط'
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    materialType: '', inputKg: '', workers: '', equipment: '',
    productName: '', notes: '',
  });

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const createOrder = () => {
    if (!form.materialType || !form.inputKg) return;
    const newOrder: WorkOrder = {
      id: Date.now().toString(),
      orderNumber: `WO-2025-${(orders.length + 1).toString().padStart(3, '0')}`,
      status: 'draft',
      materialType: form.materialType,
      inputQuantityKg: parseFloat(form.inputKg),
      outputQuantityKg: 0, wasteQuantityKg: 0,
      workers: parseInt(form.workers) || 0,
      equipmentUsed: form.equipment.split(',').map(e => e.trim()).filter(Boolean),
      startTime: new Date().toISOString(),
      notes: form.notes,
      batchNumber: `B-${Date.now().toString(36).toUpperCase()}`,
      productName: form.productName,
    };
    setOrders(prev => [newOrder, ...prev]);
    setForm({ materialType: '', inputKg: '', workers: '', equipment: '', productName: '', notes: '' });
    setShowAdd(false);
  };

  const updateStatus = (id: string, status: WorkOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status, endTime: status === 'completed' ? new Date().toISOString() : o.endTime } : o));
  };

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalInput = completedOrders.reduce((s, o) => s + o.inputQuantityKg, 0);
  const totalOutput = completedOrders.reduce((s, o) => s + o.outputQuantityKg, 0);
  const avgYield = totalInput > 0 ? Math.round((totalOutput / totalInput) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <ClipboardList className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{orders.length}</p>
          <p className="text-[10px] text-muted-foreground">إجمالي الأوامر</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Play className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{orders.filter(o => o.status === 'in_progress').length}</p>
          <p className="text-[10px] text-muted-foreground">جاري التشغيل</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Package className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{(totalOutput / 1000).toFixed(1)} طن</p>
          <p className="text-[10px] text-muted-foreground">إنتاج مكتمل</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Zap className="w-5 h-5 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{avgYield}%</p>
          <p className="text-[10px] text-muted-foreground">متوسط العائد</p>
        </CardContent></Card>
      </div>

      {/* Add New */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 ml-1" /> أمر تشغيل جديد
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              أوامر التشغيل
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAdd && (
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="نوع المادة الخام *" value={form.materialType} onChange={(e) => update('materialType', e.target.value)} className="text-right" />
                <Input placeholder="الكمية (كجم) *" type="number" value={form.inputKg} onChange={(e) => update('inputKg', e.target.value)} className="text-right" />
              </div>
              <Input placeholder="المنتج النهائي المستهدف" value={form.productName} onChange={(e) => update('productName', e.target.value)} className="text-right" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="عدد العمال" type="number" value={form.workers} onChange={(e) => update('workers', e.target.value)} className="text-right" />
                <Input placeholder="المعدات (مفصولة بفاصلة)" value={form.equipment} onChange={(e) => update('equipment', e.target.value)} className="text-right" />
              </div>
              <Textarea placeholder="ملاحظات" value={form.notes} onChange={(e) => update('notes', e.target.value)} className="text-right h-16" />
              <Button size="sm" onClick={createOrder} className="w-full">إنشاء أمر التشغيل</Button>
            </div>
          )}

          {/* Orders List */}
          {orders.map((order) => {
            const st = statusConfig[order.status];
            const StIcon = st.icon;
            const yieldPct = order.inputQuantityKg > 0 && order.outputQuantityKg > 0
              ? Math.round((order.outputQuantityKg / order.inputQuantityKg) * 100) : 0;

            return (
              <div key={order.id} className="p-3 rounded-xl border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${st.color} ${st.bg} text-[10px] gap-1`}>
                    <StIcon className="w-3 h-3" />{st.label}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-bold">{order.orderNumber}</p>
                    <p className="text-[10px] text-muted-foreground">{order.batchNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs mb-2 justify-end">
                  <span className="font-medium">{order.productName}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span>{order.materialType}</span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center text-[10px] mb-2">
                  <div className="p-1 rounded bg-muted/50">
                    <Package className="w-3 h-3 mx-auto text-blue-500 mb-0.5" />
                    <p className="font-bold">{order.inputQuantityKg} كجم</p>
                    <p className="text-muted-foreground">مدخل</p>
                  </div>
                  <div className="p-1 rounded bg-muted/50">
                    <CheckCircle2 className="w-3 h-3 mx-auto text-emerald-500 mb-0.5" />
                    <p className="font-bold">{order.outputQuantityKg} كجم</p>
                    <p className="text-muted-foreground">مخرج</p>
                  </div>
                  <div className="p-1 rounded bg-muted/50">
                    <Users className="w-3 h-3 mx-auto text-purple-500 mb-0.5" />
                    <p className="font-bold">{order.workers}</p>
                    <p className="text-muted-foreground">عمال</p>
                  </div>
                  <div className="p-1 rounded bg-muted/50">
                    <Cog className="w-3 h-3 mx-auto text-amber-500 mb-0.5" />
                    <p className="font-bold">{order.equipmentUsed.length}</p>
                    <p className="text-muted-foreground">معدات</p>
                  </div>
                </div>

                {yieldPct > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px]">عائد</span>
                    <Progress value={yieldPct} className="flex-1 h-2" />
                    <span className="text-[10px] font-bold">{yieldPct}%</span>
                  </div>
                )}

                {order.status === 'draft' && (
                  <Button size="sm" className="w-full text-[10px] gap-1" onClick={() => updateStatus(order.id, 'in_progress')}>
                    <Play className="w-3 h-3" /> بدء التشغيل
                  </Button>
                )}
                {order.status === 'in_progress' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="text-[10px]" onClick={() => updateStatus(order.id, 'cancelled')}>إلغاء</Button>
                    <Button size="sm" className="text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatus(order.id, 'completed')}>
                      <CheckCircle2 className="w-3 h-3 ml-1" /> إنهاء
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrdersPanel;
