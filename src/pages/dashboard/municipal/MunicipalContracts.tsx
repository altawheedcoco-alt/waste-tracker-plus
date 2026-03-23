import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, FileText, Calendar, TrendingUp, AlertTriangle, Building } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';

const statusMap: Record<string, { label: string; level: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  active: { label: 'نشط', level: 'success' },
  expired: { label: 'منتهي', level: 'danger' },
  suspended: { label: 'موقوف', level: 'warning' },
  draft: { label: 'مسودة', level: 'neutral' },
};

const MunicipalContracts = () => {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    contract_number: '', contract_title: '', contracting_authority: '',
    authority_type: 'governorate', area_description: '',
    start_date: '', end_date: '', monthly_value: '',
    kpi_coverage_target: '95', kpi_max_complaints: '10',
    kpi_min_tonnage: '', kpi_response_time_hours: '24', notes: '',
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['municipal-contracts', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('municipal_contracts')
        .select('*').eq('organization_id', organization!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('municipal_contracts').insert({
        organization_id: organization!.id,
        contract_number: form.contract_number,
        contract_title: form.contract_title,
        contracting_authority: form.contracting_authority,
        authority_type: form.authority_type,
        area_description: form.area_description,
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_value: Number(form.monthly_value) || 0,
        annual_value: (Number(form.monthly_value) || 0) * 12,
        kpi_coverage_target: Number(form.kpi_coverage_target) || 95,
        kpi_max_complaints: Number(form.kpi_max_complaints) || 10,
        kpi_min_tonnage: Number(form.kpi_min_tonnage) || 0,
        kpi_response_time_hours: Number(form.kpi_response_time_hours) || 24,
        notes: form.notes,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipal-contracts'] });
      toast.success('تم إضافة العقد بنجاح');
      setOpen(false);
      setForm({ contract_number: '', contract_title: '', contracting_authority: '', authority_type: 'governorate', area_description: '', start_date: '', end_date: '', monthly_value: '', kpi_coverage_target: '95', kpi_max_complaints: '10', kpi_min_tonnage: '', kpi_response_time_hours: '24', notes: '' });
    },
    onError: () => toast.error('فشل في إضافة العقد'),
  });

  const activeContracts = contracts.filter((c: any) => c.status === 'active');
  const avgSLA = activeContracts.length > 0
    ? Math.round(activeContracts.reduce((s: number, c: any) => s + (c.sla_compliance_percent || 0), 0) / activeContracts.length)
    : 0;
  const totalPenalties = contracts.reduce((s: number, c: any) => s + (c.penalties_total || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">العقود الحكومية</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 ml-1" />عقد جديد</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>إضافة عقد حكومي</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>رقم العقد</Label><Input value={form.contract_number} onChange={e => setForm(p => ({ ...p, contract_number: e.target.value }))} /></div>
                  <div><Label>نوع الجهة</Label>
                    <Select value={form.authority_type} onValueChange={v => setForm(p => ({ ...p, authority_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="governorate">محافظة</SelectItem>
                        <SelectItem value="district">حي</SelectItem>
                        <SelectItem value="cleaning_authority">هيئة نظافة</SelectItem>
                        <SelectItem value="city">مدينة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>عنوان العقد</Label><Input value={form.contract_title} onChange={e => setForm(p => ({ ...p, contract_title: e.target.value }))} /></div>
                <div><Label>الجهة المتعاقدة</Label><Input value={form.contracting_authority} onChange={e => setForm(p => ({ ...p, contracting_authority: e.target.value }))} placeholder="مثال: محافظة القاهرة - حي مدينة نصر" /></div>
                <div><Label>وصف المنطقة</Label><Textarea value={form.area_description} onChange={e => setForm(p => ({ ...p, area_description: e.target.value }))} placeholder="الشوارع والمناطق المشمولة..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>تاريخ البدء</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                </div>
                <div><Label>القيمة الشهرية (ج.م)</Label><Input type="number" value={form.monthly_value} onChange={e => setForm(p => ({ ...p, monthly_value: e.target.value }))} /></div>
                <h4 className="font-semibold text-sm pt-2 border-t">مؤشرات الأداء (KPIs)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>نسبة التغطية المستهدفة %</Label><Input type="number" value={form.kpi_coverage_target} onChange={e => setForm(p => ({ ...p, kpi_coverage_target: e.target.value }))} /></div>
                  <div><Label>حد الشكاوى الأقصى</Label><Input type="number" value={form.kpi_max_complaints} onChange={e => setForm(p => ({ ...p, kpi_max_complaints: e.target.value }))} /></div>
                  <div><Label>حد أدنى أطنان/شهر</Label><Input type="number" value={form.kpi_min_tonnage} onChange={e => setForm(p => ({ ...p, kpi_min_tonnage: e.target.value }))} /></div>
                  <div><Label>وقت الاستجابة (ساعات)</Label><Input type="number" value={form.kpi_response_time_hours} onChange={e => setForm(p => ({ ...p, kpi_response_time_hours: e.target.value }))} /></div>
                </div>
                <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !form.contract_number || !form.contract_title}>
                  {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ العقد'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center">
            <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{contracts.length}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي العقود</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <Building className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-lg font-bold">{activeContracts.length}</p>
            <p className="text-[10px] text-muted-foreground">عقود نشطة</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{avgSLA}%</p>
            <p className="text-[10px] text-muted-foreground">متوسط الالتزام SLA</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-lg font-bold">{totalPenalties.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي الغرامات</p>
          </CardContent></Card>
        </div>

        {/* Contracts List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : contracts.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد عقود مسجلة</p>
            <p className="text-sm">اضغط "عقد جديد" لإضافة أول عقد حكومي</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {contracts.map((c: any) => {
              const daysLeft = differenceInDays(new Date(c.end_date), new Date());
              const st = statusMap[c.status] || statusMap.draft;
              return (
                <Card key={c.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{c.contract_title}</h3>
                        <p className="text-sm text-muted-foreground">{c.contracting_authority} — عقد #{c.contract_number}</p>
                      </div>
                      <StatusBadge level={st.level}>{st.label}</StatusBadge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground text-[10px]">المدة</p>
                        <p className="font-medium">{format(new Date(c.start_date), 'yyyy/MM/dd')} → {format(new Date(c.end_date), 'yyyy/MM/dd')}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground text-[10px]">القيمة الشهرية</p>
                        <p className="font-medium">{Number(c.monthly_value).toLocaleString()} ج.م</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground text-[10px]">متبقي</p>
                        <p className={`font-medium ${daysLeft < 30 ? 'text-destructive' : ''}`}>{daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-muted-foreground text-[10px]">الغرامات</p>
                        <p className="font-medium text-destructive">{Number(c.penalties_total).toLocaleString()} ج.م</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>التزام SLA</span>
                        <span className="font-bold">{c.sla_compliance_percent}%</span>
                      </div>
                      <Progress value={c.sla_compliance_percent} className="h-2" />
                    </div>
                    {daysLeft > 0 && daysLeft < 30 && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 p-2 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        <span>تنبيه: العقد سينتهي خلال {daysLeft} يوم</span>
                      </div>
                    )}
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

export default MunicipalContracts;
