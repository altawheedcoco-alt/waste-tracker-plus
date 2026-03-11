import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timer, AlertTriangle, CheckCircle2, Plus, Target, TrendingDown, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const SLAMonitoringPanel = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', name_ar: '', metric_type: 'response_time', target_value: '', unit: 'hours' });

  const { data: slas } = useQuery({
    queryKey: ['sla-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sla_definitions').select('*').eq('is_active', true).order('created_at');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: violations } = useQuery({
    queryKey: ['sla-violations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sla_violations').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });

  const createSLA = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('sla_definitions').insert({
        name: formData.name, name_ar: formData.name_ar,
        metric_type: formData.metric_type,
        target_value: parseFloat(formData.target_value),
        unit: formData.unit,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sla-definitions'] });
      toast.success('تم إنشاء معيار الخدمة');
      setOpen(false);
      setFormData({ name: '', name_ar: '', metric_type: 'response_time', target_value: '', unit: 'hours' });
    },
  });

  const totalViolations = violations?.length || 0;
  const recentViolations = violations?.filter(v => {
    const d = new Date(v.created_at);
    return d >= new Date(Date.now() - 7 * 86400000);
  }).length || 0;
  const penaltyTotal = violations?.reduce((sum, v: any) => sum + (v.penalty_amount || 0), 0) || 0;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">لوحة مستوى الخدمة (SLA)</h3>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />معيار جديد</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إضافة معيار خدمة</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="الاسم (EN)" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="الاسم (AR)" value={formData.name_ar} onChange={e => setFormData(p => ({ ...p, name_ar: e.target.value }))} />
              <Select value={formData.metric_type} onValueChange={v => setFormData(p => ({ ...p, metric_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="response_time">وقت الاستجابة</SelectItem>
                  <SelectItem value="completion_rate">معدل الإتمام</SelectItem>
                  <SelectItem value="processing_time">وقت المعالجة</SelectItem>
                  <SelectItem value="submission_time">وقت التقديم</SelectItem>
                  <SelectItem value="assignment_time">وقت التعيين</SelectItem>
                  <SelectItem value="collection_time">وقت الجمع</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="number" placeholder="القيمة المستهدفة" value={formData.target_value} onChange={e => setFormData(p => ({ ...p, target_value: e.target.value }))} />
                <Select value={formData.unit} onValueChange={v => setFormData(p => ({ ...p, unit: v }))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">ساعات</SelectItem>
                    <SelectItem value="percent">نسبة %</SelectItem>
                    <SelectItem value="minutes">دقائق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createSLA.mutate()} disabled={!formData.name_ar || !formData.target_value} className="w-full">
                حفظ المعيار
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SLA KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{slas?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground">معايير محددة</p>
          </CardContent>
        </Card>
        <Card className={`${totalViolations > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
          <CardContent className="p-3 text-center">
            {totalViolations > 0 ? <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-500" /> : <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />}
            <div className="text-xl font-bold">{recentViolations}</div>
            <p className="text-[10px] text-muted-foreground">مخالفات هذا الأسبوع</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <TrendingDown className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <div className="text-xl font-bold">{penaltyTotal.toLocaleString('ar-EG')}</div>
            <p className="text-[10px] text-muted-foreground">إجمالي الغرامات</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Definitions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">معايير الخدمة المعتمدة</CardTitle>
        </CardHeader>
        <CardContent>
          {(!slas || slas.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد معايير محددة</p>
          ) : (
            <div className="space-y-2">
              {slas.map((sla: any) => {
                const slaViolations = violations?.filter((v: any) => v.sla_id === sla.id).length || 0;
                return (
                  <div key={sla.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-3">
                      <Timer className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{sla.name_ar}</p>
                        <p className="text-[10px] text-muted-foreground">
                          الهدف: {sla.target_value} {sla.unit === 'hours' ? 'ساعة' : sla.unit === 'percent' ? '%' : 'دقيقة'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slaViolations > 0 ? (
                        <Badge variant="destructive" className="text-[10px]">{slaViolations} مخالفة</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-emerald-500">ملتزم ✓</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Violations */}
      {violations && violations.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-500">آخر المخالفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {violations.slice(0, 8).map((v: any) => {
                const sla = slas?.find((s: any) => s.id === v.sla_id);
                return (
                  <div key={v.id} className="flex items-center justify-between p-2 rounded bg-red-500/5 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span>{sla?.name_ar || 'معيار'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-medium">{v.actual_value} / {v.target_value}</span>
                      <span className="text-muted-foreground">{format(new Date(v.created_at), 'dd/MM', { locale: ar })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SLAMonitoringPanel;
