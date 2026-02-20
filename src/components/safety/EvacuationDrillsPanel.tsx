import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvacuationDrills } from '@/hooks/useSafetyManager';
import { Plus, Flame, CheckCircle2, Clock, Calendar, Users, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const drillTypes: Record<string, string> = {
  evacuation: 'إخلاء',
  fire: 'حريق',
  chemical: 'كيميائي',
  first_aid: 'إسعافات أولية',
};

const EvacuationDrillsPanel = () => {
  const { drills, isLoading, addDrill, updateDrill } = useEvacuationDrills();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    drill_type: 'evacuation', drill_date: '', participants_count: '',
    evacuation_time_seconds: '', target_time_seconds: '', observations: '',
  });

  const handleSubmit = () => {
    if (!form.drill_date) return;
    addDrill.mutate({
      drill_type: form.drill_type,
      drill_date: new Date(form.drill_date).toISOString(),
      participants_count: form.participants_count ? parseInt(form.participants_count) : null,
      evacuation_time_seconds: form.evacuation_time_seconds ? parseInt(form.evacuation_time_seconds) : null,
      target_time_seconds: form.target_time_seconds ? parseInt(form.target_time_seconds) : null,
      observations: form.observations || null,
      status: 'planned',
    }, { onSuccess: () => { setOpen(false); setForm({ drill_type: 'evacuation', drill_date: '', participants_count: '', evacuation_time_seconds: '', target_time_seconds: '', observations: '' }); } });
  };

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-1" />جدولة تدريب</Button></DialogTrigger>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader><DialogTitle>تدريب إخلاء جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>نوع التدريب</Label>
                <Select value={form.drill_type} onValueChange={v => setForm(f => ({ ...f, drill_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(drillTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>تاريخ التدريب *</Label><Input type="datetime-local" value={form.drill_date} onChange={e => setForm(f => ({ ...f, drill_date: e.target.value }))} /></div>
              <div><Label>عدد المشاركين</Label><Input type="number" value={form.participants_count} onChange={e => setForm(f => ({ ...f, participants_count: e.target.value }))} placeholder="25" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الزمن المستهدف (ثانية)</Label><Input type="number" value={form.target_time_seconds} onChange={e => setForm(f => ({ ...f, target_time_seconds: e.target.value }))} placeholder="180" /></div>
                <div><Label>الزمن الفعلي (ثانية)</Label><Input type="number" value={form.evacuation_time_seconds} onChange={e => setForm(f => ({ ...f, evacuation_time_seconds: e.target.value }))} placeholder="200" /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} rows={2} /></div>
              <Button onClick={handleSubmit} disabled={addDrill.isPending} className="w-full">{addDrill.isPending ? 'جاري الحفظ...' : 'حفظ التدريب'}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <h3 className="text-lg font-semibold flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" />تدريبات الإخلاء</h3>
      </div>

      {drills.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Flame className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد تدريبات مسجلة</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {drills.map((drill: any) => {
            const passed = drill.target_time_seconds && drill.evacuation_time_seconds
              ? drill.evacuation_time_seconds <= drill.target_time_seconds
              : null;
            return (
              <Card key={drill.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-right">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge variant={drill.status === 'completed' ? 'default' : drill.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {drill.status === 'completed' ? 'مكتمل' : drill.status === 'cancelled' ? 'ملغي' : 'مجدول'}
                      </Badge>
                      {drill.status === 'planned' && (
                        <Button size="sm" variant="outline" onClick={() => updateDrill.mutate({ id: drill.id, status: 'completed' })}>
                          <CheckCircle2 className="w-3 h-3 ml-1" />إكمال
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{drillTypes[drill.drill_type] || drill.drill_type}</span>
                      <Badge variant="outline" className="text-[10px]">{format(new Date(drill.drill_date), 'dd/MM/yyyy', { locale: ar })}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground justify-end flex-wrap">
                    {drill.participants_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{drill.participants_count} مشارك</span>}
                    {drill.evacuation_time_seconds && (
                      <span className={`flex items-center gap-1 ${passed ? 'text-green-600' : passed === false ? 'text-red-600' : ''}`}>
                        <Clock className="w-3 h-3" />{drill.evacuation_time_seconds} ث
                        {drill.target_time_seconds && ` / ${drill.target_time_seconds} ث`}
                        {passed !== null && (passed ? ' ✓' : ' ✗')}
                      </span>
                    )}
                    {drill.score !== null && <span className="flex items-center gap-1"><Target className="w-3 h-3" />{drill.score}%</span>}
                  </div>
                  {drill.observations && <p className="text-sm text-muted-foreground mt-2">{drill.observations}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvacuationDrillsPanel;
