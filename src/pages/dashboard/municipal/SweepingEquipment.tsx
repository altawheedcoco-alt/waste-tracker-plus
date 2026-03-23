import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Wrench, Trash2, Edit2, Fuel, Calendar, AlertTriangle, CheckCircle2, Package } from 'lucide-react';
import { format } from 'date-fns';

const EQUIPMENT_TYPES: Record<string, { label: string; emoji: string }> = {
  broom: { label: 'مقشة يدوية', emoji: '🧹' },
  hand_cart: { label: 'عربة يد (كارو)', emoji: '🛒' },
  wheelbarrow: { label: 'عربة نقل يدوية', emoji: '🚜' },
  shovel: { label: 'جاروف / كوريك', emoji: '⛏️' },
  trash_picker: { label: 'ملقط نفايات', emoji: '🔧' },
  electric_sweeper: { label: 'مكنسة كهربائية', emoji: '⚡' },
  diesel_sweeper: { label: 'مكنسة ديزل', emoji: '🏗️' },
  vacuum_truck: { label: 'شفاطة أتربة', emoji: '🚛' },
  compactor_truck: { label: 'سيارة ضاغطة', emoji: '🚚' },
  tipper_truck: { label: 'سيارة قلاب', emoji: '🚛' },
  water_tanker: { label: 'سيارة رش مياه', emoji: '💧' },
  loader: { label: 'لودر', emoji: '🏗️' },
  tricycle: { label: 'تروسيكل نظافة', emoji: '🛺' },
  uniform_set: { label: 'طقم زي عمال', emoji: '👷' },
  safety_gear: { label: 'معدات سلامة', emoji: '🦺' },
};

const CONDITION_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: 'bg-emerald-100 text-emerald-800' },
  good: { label: 'جيد', color: 'bg-blue-100 text-blue-800' },
  fair: { label: 'متوسط', color: 'bg-amber-100 text-amber-800' },
  poor: { label: 'ضعيف', color: 'bg-orange-100 text-orange-800' },
  broken: { label: 'معطل', color: 'bg-red-100 text-red-800' },
  scrapped: { label: 'مُخردة', color: 'bg-gray-100 text-gray-800' },
};

const FUEL_TYPES: Record<string, string> = {
  none: 'لا يحتاج وقود', diesel: 'ديزل (سولار)', gasoline: 'بنزين', electric: 'كهرباء', lpg: 'غاز طبيعي',
};

const SweepingEquipmentPage = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState({
    equipment_name: '', equipment_code: '', equipment_type: 'broom',
    brand: '', model: '', purchase_date: '', purchase_cost: '',
    condition: 'good', assigned_crew_id: '', fuel_type: 'none',
    plate_number: '', last_maintenance_date: '', next_maintenance_date: '',
    status: 'active', notes: '',
  });

  const { data: crews = [] } = useQuery({
    queryKey: ['crews-equip', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('sweeping_crews').select('id, crew_name').eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['sweeping-equipment', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sweeping_equipment').select('*, sweeping_crews(crew_name)')
        .eq('organization_id', organization!.id).order('equipment_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        equipment_name: form.equipment_name, equipment_code: form.equipment_code || null,
        equipment_type: form.equipment_type, brand: form.brand || null, model: form.model || null,
        purchase_date: form.purchase_date || null,
        purchase_cost: form.purchase_cost ? parseFloat(form.purchase_cost) : null,
        condition: form.condition, assigned_crew_id: form.assigned_crew_id || null,
        fuel_type: form.fuel_type !== 'none' ? form.fuel_type : null,
        plate_number: form.plate_number || null,
        last_maintenance_date: form.last_maintenance_date || null,
        next_maintenance_date: form.next_maintenance_date || null,
        status: form.status, notes: form.notes || null,
      };
      if (editingItem) {
        const { error } = await (supabase as any).from('sweeping_equipment').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('sweeping_equipment').insert({ ...payload, organization_id: organization!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sweeping-equipment'] });
      toast.success(editingItem ? 'تم التحديث' : 'تمت الإضافة');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('sweeping_equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sweeping-equipment'] });
      toast.success('تم الحذف');
    },
  });

  const resetForm = () => {
    setForm({ equipment_name: '', equipment_code: '', equipment_type: 'broom', brand: '', model: '', purchase_date: '', purchase_cost: '', condition: 'good', assigned_crew_id: '', fuel_type: 'none', plate_number: '', last_maintenance_date: '', next_maintenance_date: '', status: 'active', notes: '' });
    setEditingItem(null);
    setDialogOpen(false);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      equipment_name: item.equipment_name, equipment_code: item.equipment_code || '',
      equipment_type: item.equipment_type, brand: item.brand || '', model: item.model || '',
      purchase_date: item.purchase_date || '', purchase_cost: item.purchase_cost?.toString() || '',
      condition: item.condition, assigned_crew_id: item.assigned_crew_id || '',
      fuel_type: item.fuel_type || 'none', plate_number: item.plate_number || '',
      last_maintenance_date: item.last_maintenance_date || '',
      next_maintenance_date: item.next_maintenance_date || '',
      status: item.status, notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  // Manual tools vs mechanical
  const manualTypes = ['broom', 'hand_cart', 'wheelbarrow', 'shovel', 'trash_picker', 'uniform_set', 'safety_gear'];
  const manualCount = equipment.filter((e: any) => manualTypes.includes(e.equipment_type)).length;
  const mechanicalCount = equipment.length - manualCount;
  const needsMaintenance = equipment.filter((e: any) => e.next_maintenance_date && new Date(e.next_maintenance_date) <= new Date()).length;

  const filtered = typeFilter === 'all' ? equipment
    : typeFilter === 'manual' ? equipment.filter((e: any) => manualTypes.includes(e.equipment_type))
    : typeFilter === 'mechanical' ? equipment.filter((e: any) => !manualTypes.includes(e.equipment_type))
    : equipment.filter((e: any) => e.equipment_type === typeFilter);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5 text-primary" />سجل المعدات والأدوات</h1>
            <p className="text-sm text-muted-foreground">{equipment.length} صنف مسجل</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />إضافة معدة</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingItem ? 'تعديل المعدة' : 'إضافة معدة / أداة'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>الاسم</Label><Input value={form.equipment_name} onChange={e => setForm(f => ({ ...f, equipment_name: e.target.value }))} placeholder="مكنسة شارع رئيسي" /></div>
                  <div><Label>الكود</Label><Input value={form.equipment_code} onChange={e => setForm(f => ({ ...f, equipment_code: e.target.value }))} placeholder="EQ-001" /></div>
                </div>
                <div>
                  <Label>النوع</Label>
                  <Select value={form.equipment_type} onValueChange={v => setForm(f => ({ ...f, equipment_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(EQUIPMENT_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>الماركة</Label><Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
                  <div><Label>الموديل</Label><Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>الطاقم المُسند إليه</Label>
                  <Select value={form.assigned_crew_id} onValueChange={v => setForm(f => ({ ...f, assigned_crew_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                    <SelectContent>{crews.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.crew_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>تاريخ الشراء</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
                  <div><Label>تكلفة الشراء (ج.م)</Label><Input type="number" value={form.purchase_cost} onChange={e => setForm(f => ({ ...f, purchase_cost: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>الحالة</Label>
                    <Select value={form.condition} onValueChange={v => setForm(f => ({ ...f, condition: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(CONDITION_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نوع الوقود</Label>
                    <Select value={form.fuel_type} onValueChange={v => setForm(f => ({ ...f, fuel_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(FUEL_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {form.fuel_type !== 'none' && (
                  <div><Label>رقم اللوحة</Label><Input value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} /></div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>آخر صيانة</Label><Input type="date" value={form.last_maintenance_date} onChange={e => setForm(f => ({ ...f, last_maintenance_date: e.target.value }))} /></div>
                  <div><Label>صيانة قادمة</Label><Input type="date" value={form.next_maintenance_date} onChange={e => setForm(f => ({ ...f, next_maintenance_date: e.target.value }))} /></div>
                </div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => { if (!form.equipment_name.trim()) return toast.error('الاسم مطلوب'); saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                  {editingItem ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card><CardContent className="p-3 text-center">
            <span className="text-xl">🧹</span>
            <p className="text-lg font-bold">{manualCount}</p>
            <p className="text-[10px] text-muted-foreground">أدوات يدوية</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <span className="text-xl">🏗️</span>
            <p className="text-lg font-bold">{mechanicalCount}</p>
            <p className="text-[10px] text-muted-foreground">معدات آلية</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Wrench className={`w-5 h-5 mx-auto mb-1 ${needsMaintenance > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
            <p className="text-lg font-bold">{needsMaintenance}</p>
            <p className="text-[10px] text-muted-foreground">تحتاج صيانة</p>
          </CardContent></Card>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { k: 'all', l: 'الكل' }, { k: 'manual', l: '🧹 يدوية' }, { k: 'mechanical', l: '🏗️ آلية' },
          ].map(f => (
            <Button key={f.k} size="sm" variant={typeFilter === f.k ? 'default' : 'outline'} className="text-xs whitespace-nowrap"
              onClick={() => setTypeFilter(f.k)}>{f.l}</Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد معدات مسجلة</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((item: any) => {
              const typeCfg = EQUIPMENT_TYPES[item.equipment_type] || { label: item.equipment_type, emoji: '📦' };
              const condCfg = CONDITION_MAP[item.condition] || CONDITION_MAP.good;
              const overdue = item.next_maintenance_date && new Date(item.next_maintenance_date) <= new Date();
              return (
                <Card key={item.id} className={overdue ? 'border-destructive/30' : ''}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                        {typeCfg.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{item.equipment_name}</span>
                          {item.equipment_code && <span className="text-xs text-muted-foreground">({item.equipment_code})</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{typeCfg.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${condCfg.color}`}>{condCfg.label}</span>
                          {item.plate_number && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">🚗 {item.plate_number}</span>}
                        </div>
                        {item.sweeping_crews && <p className="text-[10px] text-muted-foreground mt-0.5">👷 {item.sweeping_crews.crew_name}</p>}
                        {overdue && <p className="text-[10px] text-destructive mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />صيانة متأخرة!</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SweepingEquipmentPage;
