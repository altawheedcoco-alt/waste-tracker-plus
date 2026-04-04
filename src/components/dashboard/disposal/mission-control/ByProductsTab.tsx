import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Recycle, Plus, Trash2, Package, AlertTriangle, CheckCircle, Flame, Droplets } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ByProductsTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
}

const ByProductsTab = ({ facilityId, organizationId }: ByProductsTabProps) => {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ byproduct_type: 'ash', quantity: '', unit: 'ton', hazard_level: 'low', storage_location: '', notes: '' });

  const { data: byproducts = [] } = useQuery({
    queryKey: ['disposal-byproducts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase.from('disposal_byproducts').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!organizationId,
  });

  const addMutation = useMutation({
    mutationFn: async (f: typeof form) => {
      const { error } = await supabase.from('disposal_byproducts').insert({
        organization_id: organizationId!, disposal_facility_id: facilityId,
        byproduct_type: f.byproduct_type, quantity: Number(f.quantity) || 0, unit: f.unit,
        hazard_level: f.hazard_level, storage_location: f.storage_location, notes: f.notes, status: 'stored',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تسجيل المخلف الثانوي');
      setShowAdd(false);
      setForm({ byproduct_type: 'ash', quantity: '', unit: 'ton', hazard_level: 'low', storage_location: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['disposal-byproducts'] });
    },
  });

  const disposeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('disposal_byproducts').update({
        status: 'disposed', disposed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم التخلص من المخلف الثانوي');
      queryClient.invalidateQueries({ queryKey: ['disposal-byproducts'] });
    },
  });

  const stored = byproducts.filter((b: any) => b.status === 'stored');
  const disposed = byproducts.filter((b: any) => b.status === 'disposed');
  const totalStoredTons = stored.reduce((s: number, b: any) => s + (b.quantity || 0), 0);

  const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
    ash: { label: 'رماد', icon: Flame, color: 'text-muted-foreground bg-muted' },
    leachate: { label: 'سائل رشح', icon: Droplets, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    slag: { label: 'خبث', icon: Package, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    sludge: { label: 'حمأة', icon: Trash2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    other: { label: 'أخرى', icon: Recycle, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  };

  const hazardColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30',
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-amber-600 bg-amber-100 dark:bg-amber-900/30"><Package className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{stored.length}</p>
              <p className="text-xs text-muted-foreground">مخلفات مخزنة</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"><CheckCircle className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{disposed.length}</p>
              <p className="text-xs text-muted-foreground">تم التخلص منها</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-red-600 bg-red-100 dark:bg-red-900/30"><AlertTriangle className="w-5 h-5" /></div>
            <div className="text-right flex-1">
              <p className="text-2xl font-bold">{totalStoredTons.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">طن مخزن حالياً</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stored By-products */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAdd(true)}>
              <Plus className="w-3 h-3" /> تسجيل مخلف ثانوي
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              <Recycle className="w-5 h-5 text-amber-600" /> المخلفات الثانوية المخزنة
            </CardTitle>
          </div>
          <CardDescription className="text-right">رماد الحرق، سوائل الرشح، الخبث — يجب التخلص منها لتحقيق "صفر نفايات"</CardDescription>
        </CardHeader>
        <CardContent>
          {stored.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Recycle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لا توجد مخلفات ثانوية مخزنة — منشأة "صفر نفايات" ✨</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stored.map((bp: any) => {
                const type = typeLabels[bp.byproduct_type] || typeLabels.other;
                return (
                  <div key={bp.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <Button size="sm" variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300" onClick={() => disposeMutation.mutate(bp.id)}>
                      <CheckCircle className="w-3 h-3" /> تخلص
                    </Button>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${hazardColors[bp.hazard_level] || ''}`}>
                        {bp.hazard_level === 'high' ? '🔴 عالية' : bp.hazard_level === 'medium' ? '🟡 متوسطة' : '🟢 منخفضة'}
                      </Badge>
                    </div>
                    <div className="text-right flex-1 mx-3">
                      <p className="font-medium text-sm flex items-center gap-2 justify-end">
                        <span>{type.label}</span>
                        <type.icon className="w-4 h-4" />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bp.quantity} {bp.unit} • {bp.storage_location || 'موقع غير محدد'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Recycle className="w-5 h-5" /> تسجيل مخلف ثانوي</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نوع المخلف *</Label>
                <Select value={form.byproduct_type} onValueChange={(v) => setForm(p => ({ ...p, byproduct_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ash">رماد</SelectItem>
                    <SelectItem value="leachate">سائل رشح</SelectItem>
                    <SelectItem value="slag">خبث</SelectItem>
                    <SelectItem value="sludge">حمأة</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>درجة الخطورة</Label>
                <Select value={form.hazard_level} onValueChange={(v) => setForm(p => ({ ...p, hazard_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 منخفضة</SelectItem>
                    <SelectItem value="medium">🟡 متوسطة</SelectItem>
                    <SelectItem value="high">🔴 عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الكمية *</Label>
                <Input type="number" placeholder="0" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Select value={form.unit} onValueChange={(v) => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ton">طن</SelectItem>
                    <SelectItem value="kg">كجم</SelectItem>
                    <SelectItem value="liter">لتر</SelectItem>
                    <SelectItem value="m3">م³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>موقع التخزين</Label>
              <Input placeholder="مثال: حوض الرشح رقم 2" value={form.storage_location} onChange={(e) => setForm(p => ({ ...p, storage_location: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea placeholder="ملاحظات إضافية..." value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <Button className="w-full gap-2" onClick={() => addMutation.mutate(form)} disabled={!form.quantity || addMutation.isPending}>
              <Plus className="w-4 h-4" /> {addMutation.isPending ? 'جاري التسجيل...' : 'تسجيل المخلف'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ByProductsTab;
