import { useState } from "react";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, UserMinus, Calculator, CheckCircle, Clock, DollarSign, FileText, Shield } from "lucide-react";
import BackButton from '@/components/ui/back-button';

const TERMINATION_REASONS = [
  { value: 'resignation', label: 'استقالة' },
  { value: 'contract_end', label: 'انتهاء العقد' },
  { value: 'termination', label: 'إنهاء خدمة' },
  { value: 'retirement', label: 'تقاعد' },
  { value: 'mutual', label: 'اتفاق متبادل' },
  { value: 'probation_fail', label: 'عدم اجتياز التجربة' },
];

export default function HREndOfService() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [calc, setCalc] = useState({ name: '', hire: '', term: '', salary: 0, reason: 'resignation', leaves: 0 });

  const { data: records = [] } = useQuery({
    queryKey: ['hr-eos', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_end_of_service').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Egyptian labor law EOS calculation
  const calculateEOS = () => {
    if (!calc.hire || !calc.term || !calc.salary) return { years: 0, months: 0, eos: 0, leave: 0, total: 0 };
    const hire = new Date(calc.hire);
    const term = new Date(calc.term);
    const diffMs = term.getTime() - hire.getTime();
    const years = diffMs / (365.25 * 24 * 60 * 60 * 1000);
    const fullYears = Math.floor(years);
    const months = Math.round((years - fullYears) * 12);
    // Egyptian law: half month per year for first 5 years, full month per year after
    let eos = 0;
    if (fullYears <= 5) {
      eos = fullYears * (calc.salary / 2);
    } else {
      eos = 5 * (calc.salary / 2) + (fullYears - 5) * calc.salary;
    }
    const leaveComp = calc.leaves * (calc.salary / 30);
    return { years: fullYears, months, eos: Math.round(eos), leave: Math.round(leaveComp), total: Math.round(eos + leaveComp) };
  };

  const eosResult = calculateEOS();

  const createEOSMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_end_of_service').insert({
        organization_id: orgId!,
        employee_id: crypto.randomUUID(),
        employee_name: calc.name,
        hire_date: calc.hire,
        termination_date: calc.term,
        termination_reason: calc.reason,
        last_salary: calc.salary,
        service_years: eosResult.years,
        service_months: eosResult.months,
        eos_amount: eosResult.eos,
        remaining_leave_days: calc.leaves,
        leave_compensation: eosResult.leave,
        net_settlement: eosResult.total,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-eos'] });
      setShowNew(false);
      toast.success('تم إنشاء مخالصة نهاية الخدمة');
    },
  });

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">نهاية الخدمة والمخالصات</h1>
          <p className="text-muted-foreground">حساب مستحقات نهاية الخدمة وفق قانون العمل المصري</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />مخالصة جديدة</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>حساب مخالصة نهاية الخدمة</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>اسم الموظف</Label><Input value={calc.name} onChange={e => setCalc(p => ({ ...p, name: e.target.value }))} /></div>
              <div><Label>تاريخ التعيين</Label><Input type="date" value={calc.hire} onChange={e => setCalc(p => ({ ...p, hire: e.target.value }))} /></div>
              <div><Label>تاريخ انتهاء الخدمة</Label><Input type="date" value={calc.term} onChange={e => setCalc(p => ({ ...p, term: e.target.value }))} /></div>
              <div><Label>آخر راتب</Label><Input type="number" value={calc.salary || ''} onChange={e => setCalc(p => ({ ...p, salary: Number(e.target.value) }))} /></div>
              <div><Label>سبب الإنهاء</Label>
                <Select value={calc.reason} onValueChange={v => setCalc(p => ({ ...p, reason: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TERMINATION_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>رصيد الإجازات المتبقي (أيام)</Label><Input type="number" value={calc.leaves || ''} onChange={e => setCalc(p => ({ ...p, leaves: Number(e.target.value) }))} /></div>
            </div>
            {calc.salary > 0 && calc.hire && calc.term && (
              <Card className="mt-4 bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-3">نتائج الحساب</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span>مدة الخدمة:</span><span className="font-bold">{eosResult.years} سنة و {eosResult.months} شهر</span></div>
                    <div className="flex justify-between"><span>مكافأة نهاية الخدمة:</span><span className="font-bold">{eosResult.eos.toLocaleString()} ج.م</span></div>
                    <div className="flex justify-between"><span>تعويض الإجازات:</span><span className="font-bold">{eosResult.leave.toLocaleString()} ج.م</span></div>
                    <div className="flex justify-between border-t pt-2"><span className="font-semibold">إجمالي المستحقات:</span><span className="font-bold text-primary text-lg">{eosResult.total.toLocaleString()} ج.م</span></div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button className="w-full mt-4" onClick={() => createEOSMutation.mutate()} disabled={!calc.name || !calc.hire || !calc.term || !calc.salary}>حفظ المخالصة</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><UserMinus className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">إجمالي المخالصات</p><p className="text-xl font-bold">{records.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-green-500" /><div><p className="text-sm text-muted-foreground">إجمالي المستحقات</p><p className="text-xl font-bold">{records.reduce((s, r) => s + Number(r.net_settlement || 0), 0).toLocaleString()} ج.م</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-orange-500" /><div><p className="text-sm text-muted-foreground">قيد الإخلاء</p><p className="text-xl font-bold">{records.filter(r => r.clearance_status === 'pending').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-green-500" /><div><p className="text-sm text-muted-foreground">مكتملة</p><p className="text-xl font-bold">{records.filter(r => r.payment_status === 'paid').length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">سجل المخالصات</TabsTrigger>
          <TabsTrigger value="clearance">إخلاء الطرف</TabsTrigger>
          <TabsTrigger value="calculator">حاسبة نهاية الخدمة</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardContent className="pt-6">
              {records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><UserMinus className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>لا توجد مخالصات</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>سبب الإنهاء</TableHead><TableHead>مدة الخدمة</TableHead><TableHead>المستحقات</TableHead><TableHead>الإخلاء</TableHead><TableHead>الدفع</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {records.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employee_name}</TableCell>
                        <TableCell>{TERMINATION_REASONS.find(tr => tr.value === r.termination_reason)?.label || r.termination_reason}</TableCell>
                        <TableCell>{Number(r.service_years)} سنة</TableCell>
                        <TableCell className="font-bold">{Number(r.net_settlement || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell><Badge variant={r.clearance_status === 'completed' ? 'default' : 'secondary'}>{r.clearance_status === 'completed' ? 'مكتمل' : 'قيد الإنتظار'}</Badge></TableCell>
                        <TableCell><Badge variant={r.payment_status === 'paid' ? 'default' : 'destructive'}>{r.payment_status === 'paid' ? 'مدفوع' : 'معلق'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clearance">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h4 className="font-semibold">خطوات إخلاء الطرف</h4>
                {[
                  { title: 'إخلاء تقنية المعلومات', desc: 'تسليم أجهزة اللابتوب والحسابات', icon: '💻', key: 'it_clearance' },
                  { title: 'إخلاء الشؤون المالية', desc: 'تسوية السلف والعهد المالية', icon: '💰', key: 'finance_clearance' },
                  { title: 'إخلاء الموارد البشرية', desc: 'تسليم بطاقة العمل والمستندات', icon: '📋', key: 'hr_clearance' },
                  { title: 'إخلاء الأصول', desc: 'تسليم المعدات والمواد', icon: '📦', key: 'asset_clearance' },
                ].map((step, i) => (
                  <Card key={i} className="border">
                    <CardContent className="py-3 px-4 flex items-center gap-4">
                      <span className="text-2xl">{step.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium">{step.title}</h5>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                      <Checkbox />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator">
          <Card>
            <CardContent className="pt-6">
              <div className="max-w-lg mx-auto space-y-4">
                <h4 className="font-semibold text-center">حاسبة مكافأة نهاية الخدمة (قانون العمل المصري)</h4>
                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <p>📌 <strong>أول 5 سنوات:</strong> نصف شهر عن كل سنة</p>
                  <p>📌 <strong>بعد 5 سنوات:</strong> شهر كامل عن كل سنة إضافية</p>
                  <p>📌 <strong>الاستقالة:</strong> يستحق المكافأة كاملة بعد 5 سنوات</p>
                  <p>📌 <strong>تعويض الإجازات:</strong> يُحتسب على أساس آخر راتب</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}
