import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Plus, Shield, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const levelConfig: Record<string, { label: string; color: string }> = {
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  high: { label: 'عالي', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  medium: { label: 'متوسط', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  low: { label: 'منخفض', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

const categories = [
  { value: 'environmental', label: 'بيئي' },
  { value: 'occupational_safety', label: 'سلامة مهنية' },
  { value: 'operational', label: 'تشغيلي' },
  { value: 'legal', label: 'قانوني' },
  { value: 'financial', label: 'مالي' },
];

const RiskMatrixWidget = () => {
  const { organization, user } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<any>(null);
  const [form, setForm] = useState({ risk_title: '', risk_description: '', risk_category: 'environmental', likelihood: '3', impact: '3', preventive_actions: '', iso_clause: '', status: 'open' });

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risk-register', orgId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('risk_register') as any)
        .select('*').eq('organization_id', orgId).order('risk_score', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: any) => {
      if (editingRisk) {
        const { error } = await (supabase.from('risk_register') as any)
          .update({ ...values, likelihood: parseInt(values.likelihood), impact: parseInt(values.impact) })
          .eq('id', editingRisk.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('risk_register') as any)
          .insert({ ...values, likelihood: parseInt(values.likelihood), impact: parseInt(values.impact), organization_id: orgId, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-register'] });
      toast.success(editingRisk ? 'تم تحديث الخطر' : 'تم إضافة الخطر');
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('risk_register') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-register'] });
      toast.success('تم حذف الخطر');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingRisk(null);
    setForm({ risk_title: '', risk_description: '', risk_category: 'environmental', likelihood: '3', impact: '3', preventive_actions: '', iso_clause: '', status: 'open' });
  };

  const openEdit = (risk: any) => {
    setEditingRisk(risk);
    setForm({
      risk_title: risk.risk_title, risk_description: risk.risk_description || '', risk_category: risk.risk_category,
      likelihood: String(risk.likelihood), impact: String(risk.impact),
      preventive_actions: risk.preventive_actions || '', iso_clause: risk.iso_clause || '', status: risk.status,
    });
    setShowForm(true);
  };

  // Matrix visualization
  const matrixCells: Record<string, any[]> = {};
  risks.forEach((r: any) => {
    const key = `${r.likelihood}-${r.impact}`;
    if (!matrixCells[key]) matrixCells[key] = [];
    matrixCells[key].push(r);
  });

  if (isLoading) return <Card><CardHeader><CardTitle>مصفوفة المخاطر</CardTitle></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-3.5 h-3.5" /> إضافة خطر
            </Button>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> مصفوفة المخاطر والفرص
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visual Matrix 5x5 */}
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <div className="text-center text-[10px] text-muted-foreground mb-1">التأثير →</div>
              <div className="grid grid-cols-6 gap-0.5 text-[9px]" dir="ltr">
                <div className="text-center text-[10px] text-muted-foreground" style={{ writingMode: 'vertical-lr' }}>← الاحتمالية</div>
                {[1, 2, 3, 4, 5].map(impact => (
                  <div key={`h-${impact}`} className="text-center font-bold p-1 bg-muted rounded-t">{impact}</div>
                ))}
                {[5, 4, 3, 2, 1].map(likelihood => (
                  <>
                    <div key={`l-${likelihood}`} className="flex items-center justify-center font-bold bg-muted rounded-r p-1">{likelihood}</div>
                    {[1, 2, 3, 4, 5].map(impact => {
                      const score = likelihood * impact;
                      const level = score >= 20 ? 'critical' : score >= 12 ? 'high' : score >= 6 ? 'medium' : 'low';
                      const cellRisks = matrixCells[`${likelihood}-${impact}`] || [];
                      return (
                        <div key={`${likelihood}-${impact}`}
                          className={`p-1 rounded text-center min-h-[28px] flex items-center justify-center ${
                            level === 'critical' ? 'bg-red-200 dark:bg-red-900/40' :
                            level === 'high' ? 'bg-orange-200 dark:bg-orange-900/40' :
                            level === 'medium' ? 'bg-amber-200 dark:bg-amber-900/40' :
                            'bg-emerald-200 dark:bg-emerald-900/40'
                          }`}
                        >
                          {cellRisks.length > 0 && (
                            <span className="font-bold text-[10px]">{cellRisks.length}</span>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex gap-2 flex-wrap justify-end">
            {Object.entries(levelConfig).map(([key, cfg]) => {
              const count = risks.filter((r: any) => r.risk_level === key).length;
              return count > 0 ? (
                <Badge key={key} className={`${cfg.color} text-[10px]`}>{cfg.label}: {count}</Badge>
              ) : null;
            })}
          </div>

          {/* Risk List */}
          <div className="space-y-2">
            {risks.map((risk: any) => (
              <div key={risk.id} className="p-3 rounded-lg border bg-card flex items-start justify-between gap-2">
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(risk)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteMutation.mutate(risk.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <Badge className={`${levelConfig[risk.risk_level]?.color} text-[10px]`}>
                      {levelConfig[risk.risk_level]?.label} ({risk.risk_score})
                    </Badge>
                    <h4 className="text-sm font-semibold">{risk.risk_title}</h4>
                  </div>
                  {risk.risk_description && <p className="text-xs text-muted-foreground mt-0.5">{risk.risk_description}</p>}
                  {risk.preventive_actions && (
                    <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 justify-end">
                      <Shield className="w-3 h-3" /> {risk.preventive_actions}
                    </p>
                  )}
                  <div className="flex gap-2 text-[10px] text-muted-foreground mt-1 justify-end">
                    <span>احتمالية: {risk.likelihood}</span>
                    <span>تأثير: {risk.impact}</span>
                    {risk.iso_clause && <span>بند: {risk.iso_clause}</span>}
                  </div>
                </div>
              </div>
            ))}
            {risks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">لا توجد مخاطر مسجلة بعد</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) resetForm(); }}>
        <DialogContent dir="rtl" className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRisk ? 'تعديل خطر' : 'إضافة خطر جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>عنوان الخطر *</Label>
              <Input value={form.risk_title} onChange={e => setForm({ ...form, risk_title: e.target.value })} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={form.risk_description} onChange={e => setForm({ ...form, risk_description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التصنيف</Label>
                <Select value={form.risk_category} onValueChange={v => setForm({ ...form, risk_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {editingRisk && (
                <div>
                  <Label>الحالة</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">مفتوح</SelectItem>
                      <SelectItem value="mitigated">مُعالج</SelectItem>
                      <SelectItem value="accepted">مقبول</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاحتمالية (1-5)</Label>
                <Select value={form.likelihood} onValueChange={v => setForm({ ...form, likelihood: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} - {['نادر', 'غير محتمل', 'ممكن', 'محتمل', 'مؤكد تقريباً'][n - 1]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>التأثير (1-5)</Label>
                <Select value={form.impact} onValueChange={v => setForm({ ...form, impact: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} - {['لا يذكر', 'طفيف', 'متوسط', 'كبير', 'كارثي'][n - 1]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-2 rounded bg-muted text-center text-sm font-bold">
              درجة الخطر: {parseInt(form.likelihood) * parseInt(form.impact)}
              <span className="mr-2">
                ({parseInt(form.likelihood) * parseInt(form.impact) >= 20 ? 'حرج 🔴' :
                  parseInt(form.likelihood) * parseInt(form.impact) >= 12 ? 'عالي 🟠' :
                  parseInt(form.likelihood) * parseInt(form.impact) >= 6 ? 'متوسط 🟡' : 'منخفض 🟢'})
              </span>
            </div>
            <div>
              <Label>الإجراءات الوقائية</Label>
              <Textarea value={form.preventive_actions} onChange={e => setForm({ ...form, preventive_actions: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>بند ISO المرتبط</Label>
              <Input value={form.iso_clause} onChange={e => setForm({ ...form, iso_clause: e.target.value })} placeholder="مثال: 6.1.1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>إلغاء</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.risk_title || saveMutation.isPending}>
              {editingRisk ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RiskMatrixWidget;
