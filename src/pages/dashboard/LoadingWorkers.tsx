import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Users, Phone, CreditCard, Edit2, Trash2, UserCheck, UserX, Clock } from 'lucide-react';

interface LoadingWorker {
  id: string;
  full_name: string;
  phone: string | null;
  national_id: string | null;
  status: string;
  daily_rate: number;
  notes: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; labelEn: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', labelEn: 'Active', variant: 'default' },
  inactive: { label: 'غير نشط', labelEn: 'Inactive', variant: 'destructive' },
  on_leave: { label: 'في إجازة', labelEn: 'On Leave', variant: 'secondary' },
};

const LoadingWorkers = () => {
  const { isRTL } = useLanguage();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LoadingWorker | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '', national_id: '', status: 'active', daily_rate: '', notes: '' });

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['loading-workers', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loading_workers')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoadingWorker[];
    },
    enabled: !!organization?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (workerData: any) => {
      if (editingWorker) {
        const { error } = await supabase.from('loading_workers').update(workerData).eq('id', editingWorker.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('loading_workers').insert({ ...workerData, organization_id: organization!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-workers'] });
      toast.success(editingWorker ? (isRTL ? 'تم التحديث' : 'Updated') : (isRTL ? 'تمت الإضافة' : 'Added'));
      resetForm();
    },
    onError: () => toast.error(isRTL ? 'حدث خطأ' : 'Error occurred'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loading_workers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loading-workers'] });
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
    },
  });

  const resetForm = () => {
    setForm({ full_name: '', phone: '', national_id: '', status: 'active', daily_rate: '', notes: '' });
    setEditingWorker(null);
    setDialogOpen(false);
  };

  const openEdit = (w: LoadingWorker) => {
    setEditingWorker(w);
    setForm({ full_name: w.full_name, phone: w.phone || '', national_id: w.national_id || '', status: w.status, daily_rate: String(w.daily_rate || ''), notes: w.notes || '' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.full_name.trim()) return toast.error(isRTL ? 'الاسم مطلوب' : 'Name required');
    saveMutation.mutate({
      full_name: form.full_name,
      phone: form.phone || null,
      national_id: form.national_id || null,
      status: form.status,
      daily_rate: parseFloat(form.daily_rate) || 0,
      notes: form.notes || null,
    });
  };

  const activeCount = workers.filter(w => w.status === 'active').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{isRTL ? 'عمال التحميل والعتالة' : 'Loading Workers'}</h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? `${activeCount} نشط من ${workers.length}` : `${activeCount} active of ${workers.length}`}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 me-1" />{isRTL ? 'إضافة عامل' : 'Add Worker'}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingWorker ? (isRTL ? 'تعديل عامل' : 'Edit Worker') : (isRTL ? 'إضافة عامل جديد' : 'Add New Worker')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div><Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} /></div>
                <div><Label>{isRTL ? 'الهاتف' : 'Phone'}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><Label>{isRTL ? 'الرقم القومي' : 'National ID'}</Label><Input value={form.national_id} onChange={e => setForm(f => ({ ...f, national_id: e.target.value }))} /></div>
                <div><Label>{isRTL ? 'الأجر اليومي (ج.م)' : 'Daily Rate (EGP)'}</Label><Input type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} /></div>
                <div>
                  <Label>{isRTL ? 'الحالة' : 'Status'}</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{isRTL ? v.label : v.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleSubmit} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? '...' : editingWorker ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'إضافة' : 'Add')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : workers.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" />{isRTL ? 'لا يوجد عمال مسجلون' : 'No workers registered'}</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {workers.map(w => (
              <Card key={w.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {w.status === 'active' ? <UserCheck className="w-5 h-5 text-primary" /> : w.status === 'on_leave' ? <Clock className="w-5 h-5 text-yellow-600" /> : <UserX className="w-5 h-5 text-destructive" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{w.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {w.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{w.phone}</span>}
                        {w.daily_rate > 0 && <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{w.daily_rate} {isRTL ? 'ج.م' : 'EGP'}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_MAP[w.status]?.variant || 'outline'}>{isRTL ? STATUS_MAP[w.status]?.label : STATUS_MAP[w.status]?.labelEn}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(w)}><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(w.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoadingWorkers;
