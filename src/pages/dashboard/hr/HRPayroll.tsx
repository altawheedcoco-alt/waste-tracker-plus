import { useState } from "react";
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
import { toast } from "sonner";
import { Plus, DollarSign, Users, Calculator, CheckCircle, Clock, FileText, Download, Printer, TrendingUp, AlertTriangle } from "lucide-react";
import BackButton from '@/components/ui/back-button';

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'secondary' },
  processing: { label: 'قيد المعالجة', variant: 'outline' },
  approved: { label: 'معتمد', variant: 'default' },
  paid: { label: 'مدفوع', variant: 'default' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

export default function HRPayroll() {
  const { profile, organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showNewRun, setShowNewRun] = useState(false);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  const { data: payrollRuns = [], isLoading } = useQuery({
    queryKey: ['hr-payroll-runs', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_payroll_runs')
        .select('*')
        .eq('organization_id', orgId!)
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: payrollItems = [] } = useQuery({
    queryKey: ['hr-payroll-items', selectedRun],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hr_payroll_items')
        .select('*')
        .eq('payroll_run_id', selectedRun!);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRun,
  });

  const createRunMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_payroll_runs').insert({
        organization_id: orgId!,
        period_month: newMonth,
        period_year: newYear,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-payroll-runs'] });
      setShowNewRun(false);
      toast.success('تم إنشاء دورة الرواتب بنجاح');
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const totalGross = payrollRuns.reduce((s, r) => s + Number(r.total_gross || 0), 0);
  const totalNet = payrollRuns.reduce((s, r) => s + Number(r.total_net || 0), 0);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مسيّر الرواتب</h1>
          <p className="text-muted-foreground">إدارة الرواتب والاستقطاعات والتأمينات</p>
        </div>
        <Dialog open={showNewRun} onOpenChange={setShowNewRun}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />دورة رواتب جديدة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء دورة رواتب جديدة</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>الشهر</Label>
                <Select value={String(newMonth)} onValueChange={v => setNewMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>السنة</Label>
                <Input type="number" value={newYear} onChange={e => setNewYear(Number(e.target.value))} />
              </div>
              <Button className="w-full" onClick={() => createRunMutation.mutate()}>إنشاء</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">إجمالي الرواتب</p><p className="text-xl font-bold">{totalGross.toLocaleString()} ج.م</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Calculator className="w-8 h-8 text-destructive" /><div><p className="text-sm text-muted-foreground">صافي الرواتب</p><p className="text-xl font-bold">{totalNet.toLocaleString()} ج.م</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">عدد الدورات</p><p className="text-xl font-bold">{payrollRuns.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-green-500" /><div><p className="text-sm text-muted-foreground">دورات معتمدة</p><p className="text-xl font-bold">{payrollRuns.filter(r => r.status === 'approved' || r.status === 'paid').length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">دورات الرواتب</TabsTrigger>
          <TabsTrigger value="details">تفاصيل الدورة</TabsTrigger>
          <TabsTrigger value="deductions">الاستقطاعات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="runs">
          <Card>
            <CardHeader><CardTitle>دورات الرواتب</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <p>جاري التحميل...</p> : payrollRuns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد دورات رواتب بعد</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفترة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>عدد الموظفين</TableHead>
                      <TableHead>إجمالي</TableHead>
                      <TableHead>استقطاعات</TableHead>
                      <TableHead>صافي</TableHead>
                      <TableHead>إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map(run => (
                      <TableRow key={run.id} className="cursor-pointer" onClick={() => setSelectedRun(run.id)}>
                        <TableCell className="font-medium">{MONTHS[(run.period_month || 1) - 1]} {run.period_year}</TableCell>
                        <TableCell><Badge variant={STATUS_MAP[run.status]?.variant || 'secondary'}>{STATUS_MAP[run.status]?.label || run.status}</Badge></TableCell>
                        <TableCell>{run.total_employees}</TableCell>
                        <TableCell>{Number(run.total_gross || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell className="text-destructive">{Number(run.total_deductions || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell className="font-bold">{Number(run.total_net || 0).toLocaleString()} ج.م</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost"><FileText className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost"><Printer className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle>تفاصيل دورة الرواتب</CardTitle></CardHeader>
            <CardContent>
              {!selectedRun ? (
                <p className="text-center py-8 text-muted-foreground">اختر دورة رواتب لعرض التفاصيل</p>
              ) : payrollItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>لا توجد بنود في هذه الدورة</p>
                  <Button className="mt-4" variant="outline"><Plus className="w-4 h-4 ml-2" />إضافة موظفين</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>البدلات</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>التأمينات</TableHead>
                      <TableHead>الضرائب</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>حالة الدفع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.employee_name}</TableCell>
                        <TableCell>{Number(item.basic_salary).toLocaleString()}</TableCell>
                        <TableCell>{(Number(item.housing_allowance) + Number(item.transport_allowance) + Number(item.other_allowances)).toLocaleString()}</TableCell>
                        <TableCell>{Number(item.gross_salary).toLocaleString()}</TableCell>
                        <TableCell className="text-destructive">{Number(item.social_insurance).toLocaleString()}</TableCell>
                        <TableCell className="text-destructive">{Number(item.tax_deduction).toLocaleString()}</TableCell>
                        <TableCell className="font-bold text-green-600">{Number(item.net_salary).toLocaleString()}</TableCell>
                        <TableCell><Badge variant={item.payment_status === 'paid' ? 'default' : 'secondary'}>{item.payment_status === 'paid' ? 'مدفوع' : 'معلق'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <Card>
            <CardHeader><CardTitle>إدارة الاستقطاعات</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'التأمينات الاجتماعية', desc: 'نسبة 11% من الراتب الأساسي (حصة الموظف)', icon: '🏛️', rate: '11%' },
                  { title: 'ضريبة الدخل', desc: 'حسب شرائح قانون الضرائب المصري', icon: '📊', rate: 'متغير' },
                  { title: 'سلف وقروض', desc: 'أقساط شهرية من القروض والسلف', icon: '💳', rate: 'حسب القسط' },
                  { title: 'غياب بدون إذن', desc: 'خصم أيام الغياب بدون إذن مسبق', icon: '⏰', rate: 'يومي' },
                  { title: 'جزاءات إدارية', desc: 'خصومات تأديبية حسب لائحة الجزاءات', icon: '⚠️', rate: 'متغير' },
                  { title: 'تأمين صحي خاص', desc: 'اشتراك التأمين الصحي الإضافي', icon: '🏥', rate: 'ثابت' },
                ].map((item, i) => (
                  <Card key={i} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                          <Badge variant="outline" className="mt-2">{item.rate}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader><CardTitle>التقارير المالية</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'كشف الرواتب الشهري', icon: FileText, desc: 'تقرير تفصيلي بجميع بنود الرواتب' },
                  { title: 'تقرير التأمينات', icon: TrendingUp, desc: 'حصص التأمينات الاجتماعية (موظف + شركة)' },
                  { title: 'تقرير الضرائب', icon: Calculator, desc: 'ضريبة كسب العمل الشهرية والتراكمية' },
                  { title: 'تقرير تكلفة العمالة', icon: DollarSign, desc: 'التكلفة الإجمالية للعمالة حسب القسم' },
                ].map((item, i) => (
                  <Card key={i} className="border cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="pt-4 flex items-center gap-4">
                      <item.icon className="w-8 h-8 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Button size="sm" variant="outline"><Download className="w-4 h-4" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>إعدادات الرواتب</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>نسبة التأمينات الاجتماعية (حصة الموظف %)</Label>
                  <Input type="number" defaultValue="11" />
                </div>
                <div className="space-y-2">
                  <Label>نسبة التأمينات الاجتماعية (حصة الشركة %)</Label>
                  <Input type="number" defaultValue="18.75" />
                </div>
                <div className="space-y-2">
                  <Label>يوم صرف الرواتب</Label>
                  <Input type="number" defaultValue="25" min={1} max={28} />
                </div>
                <div className="space-y-2">
                  <Label>عملة الرواتب</Label>
                  <Select defaultValue="EGP">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button>حفظ الإعدادات</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
