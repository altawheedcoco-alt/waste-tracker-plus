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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Shield, Heart, AlertTriangle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import StatusBadge from '@/components/shared/StatusBadge';

const incidentTypes = [
  { value: 'work_injury', label: 'إصابة عمل' },
  { value: 'traffic_accident', label: 'حادث مروري' },
  { value: 'hazardous_exposure', label: 'تعرض لمواد خطرة' },
  { value: 'heat_stroke', label: 'ضربة شمس/إجهاد حراري' },
  { value: 'fall', label: 'سقوط' },
  { value: 'equipment_injury', label: 'إصابة بمعدة' },
  { value: 'other', label: 'أخرى' },
];

const severityMap: Record<string, { label: string; level: 'success' | 'warning' | 'danger' | 'info' }> = {
  minor: { label: 'بسيطة', level: 'success' },
  moderate: { label: 'متوسطة', level: 'warning' },
  severe: { label: 'خطيرة', level: 'danger' },
  fatal: { label: 'مميتة', level: 'danger' },
};

const WorkerSafety = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    incident_type: 'work_injury', severity: 'minor', incident_date: format(new Date(), 'yyyy-MM-dd'),
    worker_name: '', location_description: '', description: '', actions_taken: '', days_lost: '0',
  });

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['worker-incidents', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('worker_incidents')
        .select('*').eq('organization_id', organization!.id).order('incident_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('worker_incidents').insert({
        organization_id: organization!.id,
        incident_type: form.incident_type,
        severity: form.severity,
        incident_date: form.incident_date,
        worker_name: form.worker_name,
        location_description: form.location_description,
        description: form.description,
        actions_taken: form.actions_taken,
        days_lost: Number(form.days_lost) || 0,
        reported_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-incidents'] });
      toast.success('تم تسجيل الحادث');
      setOpen(false);
    },
    onError: () => toast.error('فشل في تسجيل الحادث'),
  });

  const lastIncident = incidents[0];
  const daysSinceLastIncident = lastIncident
    ? differenceInDays(new Date(), new Date(lastIncident.incident_date))
    : null;
  const totalDaysLost = incidents.reduce((s: number, i: any) => s + (i.days_lost || 0), 0);
  const severeCount = incidents.filter((i: any) => ['severe', 'fatal'].includes(i.severity)).length;

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">سلامة العمال</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive"><Plus className="w-4 h-4 ml-1" />تسجيل حادث</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>تسجيل حادث جديد</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>نوع الحادث</Label>
                    <Select value={form.incident_type} onValueChange={v => setForm(p => ({ ...p, incident_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{incidentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>الشدة</Label>
                    <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">بسيطة</SelectItem>
                        <SelectItem value="moderate">متوسطة</SelectItem>
                        <SelectItem value="severe">خطيرة</SelectItem>
                        <SelectItem value="fatal">مميتة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>اسم العامل</Label><Input value={form.worker_name} onChange={e => setForm(p => ({ ...p, worker_name: e.target.value }))} /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.incident_date} onChange={e => setForm(p => ({ ...p, incident_date: e.target.value }))} /></div>
                </div>
                <div><Label>الموقع</Label><Input value={form.location_description} onChange={e => setForm(p => ({ ...p, location_description: e.target.value }))} /></div>
                <div><Label>وصف الحادث</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div><Label>الإجراءات المتخذة</Label><Textarea value={form.actions_taken} onChange={e => setForm(p => ({ ...p, actions_taken: e.target.value }))} /></div>
                <div><Label>أيام العمل المفقودة</Label><Input type="number" value={form.days_lost} onChange={e => setForm(p => ({ ...p, days_lost: e.target.value }))} /></div>
                <Button className="w-full" variant="destructive" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.worker_name}>
                  {addMutation.isPending ? 'جاري الحفظ...' : 'تسجيل الحادث'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className={daysSinceLastIncident !== null && daysSinceLastIncident > 30 ? 'border-emerald-500/50' : ''}>
            <CardContent className="p-3 text-center">
              <Shield className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              <p className="text-lg font-bold">{daysSinceLastIncident ?? '∞'}</p>
              <p className="text-[10px] text-muted-foreground">يوم بدون حوادث</p>
            </CardContent>
          </Card>
          <Card><CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">{incidents.length}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي الحوادث</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold">{severeCount}</p>
            <p className="text-[10px] text-muted-foreground">حوادث خطيرة</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{totalDaysLost}</p>
            <p className="text-[10px] text-muted-foreground">أيام مفقودة</p>
          </CardContent></Card>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : incidents.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد حوادث مسجلة — بيئة عمل آمنة ✅</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc: any) => {
              const it = incidentTypes.find(t => t.value === inc.incident_type);
              const sev = severityMap[inc.severity] || severityMap.minor;
              return (
                <Card key={inc.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="font-medium text-sm">{it?.label || inc.incident_type}</p>
                        <p className="text-xs text-muted-foreground">{inc.worker_name} — {inc.location_description}</p>
                      </div>
                      <StatusBadge level={sev.level}>{sev.label}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground">{inc.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(inc.incident_date), 'yyyy/MM/dd')}</span>
                      {inc.days_lost > 0 && <span className="text-destructive">فقدان {inc.days_lost} يوم</span>}
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

export default WorkerSafety;
