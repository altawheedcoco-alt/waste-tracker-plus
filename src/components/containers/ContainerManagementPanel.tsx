/**
 * لوحة إدارة الحاويات — تتبع، صيانة، مستوى امتلاء
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Trash2, Plus, MapPin, AlertTriangle, CheckCircle2,
  Package, Wrench, QrCode, Loader2, Search, Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const containerTypes = [
  { value: 'bin', label: 'حاوية قمامة' },
  { value: 'skip', label: 'سكيب' },
  { value: 'compactor', label: 'كمباكتور' },
  { value: 'roll_off', label: 'حاوية متحركة' },
  { value: 'drum', label: 'برميل' },
  { value: 'ibc', label: 'IBC تانك' },
  { value: 'bag', label: 'أكياس كبيرة' },
];

const conditionConfig: Record<string, { label: string; color: string }> = {
  good: { label: 'جيدة', color: 'text-green-600 bg-green-500/10' },
  fair: { label: 'مقبولة', color: 'text-amber-600 bg-amber-500/10' },
  poor: { label: 'سيئة', color: 'text-red-600 bg-red-500/10' },
  damaged: { label: 'تالفة', color: 'text-destructive bg-destructive/10' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'متاحة', color: 'text-green-600 bg-green-500/10' },
  in_use: { label: 'قيد الاستخدام', color: 'text-blue-600 bg-blue-500/10' },
  maintenance: { label: 'صيانة', color: 'text-amber-600 bg-amber-500/10' },
  retired: { label: 'خارج الخدمة', color: 'text-muted-foreground bg-muted' },
};

const ContainerManagementPanel = () => {
  const { profile, organization } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [form, setForm] = useState({
    container_code: '', container_type: 'bin', capacity_liters: '',
    capacity_kg: '', material: '', waste_type: '', location_name: '',
    notes: '', color: '',
  });

  const { data: containers = [], isLoading } = useQuery({
    queryKey: ['containers', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('containers').insert({
        organization_id: organization!.id,
        container_code: form.container_code,
        container_type: form.container_type,
        capacity_liters: form.capacity_liters ? parseFloat(form.capacity_liters) : null,
        capacity_kg: form.capacity_kg ? parseFloat(form.capacity_kg) : null,
        material: form.material || null,
        waste_type: form.waste_type || null,
        location_name: form.location_name || null,
        notes: form.notes || null,
        color: form.color || null,
        qr_code: `CNT-${Date.now().toString(36).toUpperCase()}`,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة الحاوية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      setShowAdd(false);
      setForm({ container_code: '', container_type: 'bin', capacity_liters: '', capacity_kg: '', material: '', waste_type: '', location_name: '', notes: '', color: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateFillLevel = useMutation({
    mutationFn: async ({ id, level }: { id: string; level: number }) => {
      const { error } = await supabase.from('containers')
        .update({ current_fill_level: level, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['containers'] }),
  });

  const filtered = containers.filter((c: any) => {
    const matchSearch = !search || c.container_code?.toLowerCase().includes(search.toLowerCase()) || c.location_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || c.container_type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total: containers.length,
    needsEmptying: containers.filter((c: any) => (c.current_fill_level || 0) >= 80).length,
    maintenance: containers.filter((c: any) => c.status === 'maintenance').length,
    avgFill: containers.length > 0 ? Math.round(containers.reduce((s: number, c: any) => s + (c.current_fill_level || 0), 0) / containers.length) : 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Package className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">إجمالي الحاويات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <AlertTriangle className="w-5 h-5 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{stats.needsEmptying}</p>
          <p className="text-[10px] text-muted-foreground">تحتاج تفريغ</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Wrench className="w-5 h-5 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{stats.maintenance}</p>
          <p className="text-[10px] text-muted-foreground">قيد الصيانة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-4 text-center">
          <Trash2 className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{stats.avgFill}%</p>
          <p className="text-[10px] text-muted-foreground">متوسط الامتلاء</p>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1">
              <Plus className="w-4 h-4" /> إضافة حاوية
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              إدارة الحاويات
            </CardTitle>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-2.5 top-2.5 text-muted-foreground" />
              <Input placeholder="بحث بالكود أو الموقع..." value={search} onChange={e => setSearch(e.target.value)} className="pr-8 text-right" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><Filter className="w-3 h-3 ml-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {containerTypes.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد حاويات</p>
            </div>
          ) : (
            filtered.map((c: any) => {
              const fill = c.current_fill_level || 0;
              const cond = conditionConfig[c.condition] || conditionConfig.good;
              const st = statusConfig[c.status] || statusConfig.available;
              const fillColor = fill >= 80 ? 'text-red-500' : fill >= 50 ? 'text-amber-500' : 'text-green-500';

              return (
                <div key={c.id} className="p-3 rounded-xl border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={st.color}>{st.label}</Badge>
                      <Badge className={cond.color}>{cond.label}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono">{c.container_code}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {containerTypes.find(ct => ct.value === c.container_type)?.label || c.container_type}
                      </p>
                    </div>
                  </div>

                  {/* Fill level */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-muted-foreground">امتلاء</span>
                    <Progress value={fill} className="flex-1 h-2" />
                    <span className={`text-xs font-bold ${fillColor}`}>{fill}%</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {c.location_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location_name}</span>}
                      {c.waste_type && <span>{c.waste_type}</span>}
                      {c.capacity_kg && <span>{c.capacity_kg} كجم</span>}
                    </div>
                    {c.qr_code && <QrCode className="w-4 h-4" />}
                  </div>

                  {fill >= 80 && (
                    <Badge variant="destructive" className="mt-2 text-[10px] gap-1">
                      <AlertTriangle className="w-3 h-3" /> تحتاج تفريغ عاجل
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة حاوية جديدة</DialogTitle>
            <DialogDescription>أدخل بيانات الحاوية</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">كود الحاوية *</Label>
                <Input value={form.container_code} onChange={e => setForm(p => ({ ...p, container_code: e.target.value }))} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">النوع</Label>
                <Select value={form.container_type} onValueChange={v => setForm(p => ({ ...p, container_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {containerTypes.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">السعة (لتر)</Label>
                <Input type="number" value={form.capacity_liters} onChange={e => setForm(p => ({ ...p, capacity_liters: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">السعة (كجم)</Label>
                <Input type="number" value={form.capacity_kg} onChange={e => setForm(p => ({ ...p, capacity_kg: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">الموقع</Label>
              <Input value={form.location_name} onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))} className="text-right" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">نوع المخلفات</Label>
                <Input value={form.waste_type} onChange={e => setForm(p => ({ ...p, waste_type: e.target.value }))} className="text-right" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المادة</Label>
                <Input value={form.material} onChange={e => setForm(p => ({ ...p, material: e.target.value }))} className="text-right" placeholder="حديد، بلاستيك..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="text-right h-16" />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!form.container_code || addMutation.isPending} className="w-full">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              إضافة الحاوية
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContainerManagementPanel;
