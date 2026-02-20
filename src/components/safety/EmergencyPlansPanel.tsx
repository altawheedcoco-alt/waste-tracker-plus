import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmergencyPlans } from '@/hooks/useSafetyManager';
import { Plus, Siren, CheckCircle2, Clock, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const planTypes: Record<string, string> = {
  general: 'خطة عامة',
  fire: 'حريق',
  chemical_spill: 'انسكاب كيميائي',
  evacuation: 'إخلاء',
  earthquake: 'زلزال',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  active: { label: 'نشطة', variant: 'default' },
  under_review: { label: 'قيد المراجعة', variant: 'outline' },
  archived: { label: 'مؤرشفة', variant: 'destructive' },
};

const EmergencyPlansPanel = () => {
  const { plans, isLoading, addPlan, updatePlan } = useEmergencyPlans();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', plan_type: 'general', description: '', assembly_points: '' });

  const handleSubmit = () => {
    if (!form.title) return;
    addPlan.mutate({
      title: form.title,
      plan_type: form.plan_type,
      description: form.description,
      assembly_points: form.assembly_points ? form.assembly_points.split('\n').filter(Boolean) : [],
    }, { onSuccess: () => { setOpen(false); setForm({ title: '', plan_type: 'general', description: '', assembly_points: '' }); } });
  };

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />إضافة خطة طوارئ</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader><DialogTitle>خطة طوارئ جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>عنوان الخطة *</Label><Input fieldContext="emergency_plan_title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="خطة الإخلاء الرئيسية" /></div>
              <div><Label>نوع الخطة</Label>
                <Select value={form.plan_type} onValueChange={v => setForm(f => ({ ...f, plan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(planTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف تفصيلي للخطة..." rows={3} /></div>
              <div><Label>نقاط التجمع (سطر لكل نقطة)</Label><Textarea value={form.assembly_points} onChange={e => setForm(f => ({ ...f, assembly_points: e.target.value }))} placeholder="البوابة الرئيسية&#10;ساحة الموظفين" rows={2} /></div>
              <Button onClick={handleSubmit} disabled={addPlan.isPending} className="w-full">{addPlan.isPending ? 'جاري الحفظ...' : 'حفظ الخطة'}</Button>
            </div>
          </DialogContent>
        </Dialog>
        <h3 className="text-lg font-semibold flex items-center gap-2"><Siren className="w-5 h-5 text-red-500" />خطط الطوارئ</h3>
      </div>

      {plans.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><Siren className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد خطط طوارئ بعد</p><p className="text-sm">أضف أول خطة طوارئ لمنشأتك</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-right">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    <Badge variant={statusConfig[plan.status]?.variant || 'secondary'}>{statusConfig[plan.status]?.label || plan.status}</Badge>
                    {plan.status === 'draft' && <Button size="sm" variant="outline" onClick={() => updatePlan.mutate({ id: plan.id, status: 'active' })}>تفعيل</Button>}
                  </div>
                  <h4 className="font-semibold">{plan.title}</h4>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground justify-end mb-2">
                  <span>{planTypes[plan.plan_type] || plan.plan_type}</span>
                  <span>•</span>
                  <span>{format(new Date(plan.created_at), 'dd MMM yyyy', { locale: ar })}</span>
                </div>
                {plan.description && <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>}
                {plan.assembly_points?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap justify-end">
                    {plan.assembly_points.map((p: string, i: number) => <Badge key={i} variant="outline" className="text-[10px]">{p}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyPlansPanel;
