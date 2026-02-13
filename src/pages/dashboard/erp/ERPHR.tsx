import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Users, Calendar, Clock, Wallet, UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const contractLabels: Record<string, string> = {
  full_time: 'دوام كامل', part_time: 'دوام جزئي', contract: 'عقد', temporary: 'مؤقت',
};
const leaveLabels: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', maternity: 'أمومة', other: 'أخرى',
};
const leaveStatusLabels: Record<string, string> = {
  pending: 'معلقة', approved: 'موافق عليها', rejected: 'مرفوضة', cancelled: 'ملغاة',
};

const ERPHR = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [newEmp, setNewEmp] = useState({ full_name: '', employee_number: '', national_id: '', phone: '', email: '', department: '', job_title: '', contract_type: 'full_time', base_salary: 0, housing_allowance: 0, transport_allowance: 0 });
  const [newLeave, setNewLeave] = useState({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['erp-employees', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_employees').select('*').eq('organization_id', orgId).order('full_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: leaves = [] } = useQuery({
    queryKey: ['erp-leaves', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_leave_requests').select('*, employee:erp_employees(full_name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: ['erp-payroll', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from('erp_payroll').select('*').eq('organization_id', orgId).order('period_year', { ascending: false }).order('period_month', { ascending: false }).limit(12);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_employees').insert({ organization_id: orgId, ...newEmp });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-employees'] });
      setShowAddEmployee(false);
      setNewEmp({ full_name: '', employee_number: '', national_id: '', phone: '', email: '', department: '', job_title: '', contract_type: 'full_time', base_salary: 0, housing_allowance: 0, transport_allowance: 0 });
      toast.success('تم إضافة الموظف');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addLeaveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      const { error } = await supabase.from('erp_leave_requests').insert({ organization_id: orgId, ...newLeave });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-leaves'] });
      setShowAddLeave(false);
      setNewLeave({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      toast.success('تم تقديم طلب الإجازة');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const activeEmployees = employees.filter(e => e.is_active);
  const totalSalaries = activeEmployees.reduce((s, e) => s + (e.base_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0), 0);
  const pendingLeaves = leaves.filter((l: any) => l.status === 'pending').length;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-right">
          <h1 className="text-2xl font-bold">الموارد البشرية</h1>
          <p className="text-muted-foreground">إدارة الموظفين والرواتب والحضور والإجازات</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'الموظفين النشطين', value: activeEmployees.length, icon: Users, color: 'text-blue-600' },
            { label: 'إجمالي الرواتب', value: `${totalSalaries.toLocaleString()} ر.س`, icon: Wallet, color: 'text-green-600' },
            { label: 'إجازات معلقة', value: pendingLeaves, icon: Calendar, color: 'text-orange-600' },
            { label: 'مسيرات الرواتب', value: payrolls.length, icon: Clock, color: 'text-primary' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-right">
                <div className="flex items-center justify-between">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="employees" dir="rtl">
          <TabsList>
            <TabsTrigger value="employees">الموظفين</TabsTrigger>
            <TabsTrigger value="leaves">الإجازات</TabsTrigger>
            <TabsTrigger value="payroll">الرواتب</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
              <DialogTrigger asChild><Button><UserPlus className="ml-2 h-4 w-4" />إضافة موظف</Button></DialogTrigger>
              <DialogContent dir="rtl" className="max-w-2xl">
                <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>الاسم الكامل</Label><Input value={newEmp.full_name} onChange={e => setNewEmp(p => ({ ...p, full_name: e.target.value }))} /></div>
                    <div><Label>الرقم الوظيفي</Label><Input value={newEmp.employee_number} onChange={e => setNewEmp(p => ({ ...p, employee_number: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>رقم الهوية</Label><Input value={newEmp.national_id} onChange={e => setNewEmp(p => ({ ...p, national_id: e.target.value }))} /></div>
                    <div><Label>الجوال</Label><Input value={newEmp.phone} onChange={e => setNewEmp(p => ({ ...p, phone: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>القسم</Label><Input value={newEmp.department} onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))} /></div>
                    <div><Label>المسمى الوظيفي</Label><Input value={newEmp.job_title} onChange={e => setNewEmp(p => ({ ...p, job_title: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>البريد الإلكتروني</Label><Input value={newEmp.email} onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))} /></div>
                    <div>
                      <Label>نوع العقد</Label>
                      <Select value={newEmp.contract_type} onValueChange={v => setNewEmp(p => ({ ...p, contract_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(contractLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>الراتب الأساسي</Label><Input type="number" value={newEmp.base_salary || ''} onChange={e => setNewEmp(p => ({ ...p, base_salary: parseFloat(e.target.value) || 0 }))} /></div>
                    <div><Label>بدل سكن</Label><Input type="number" value={newEmp.housing_allowance || ''} onChange={e => setNewEmp(p => ({ ...p, housing_allowance: parseFloat(e.target.value) || 0 }))} /></div>
                    <div><Label>بدل نقل</Label><Input type="number" value={newEmp.transport_allowance || ''} onChange={e => setNewEmp(p => ({ ...p, transport_allowance: parseFloat(e.target.value) || 0 }))} /></div>
                  </div>
                  <Button className="w-full" onClick={() => addEmployeeMutation.mutate()} disabled={addEmployeeMutation.isPending}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الرقم</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">القسم</TableHead>
                      <TableHead className="text-right">المسمى</TableHead>
                      <TableHead className="text-right">نوع العقد</TableHead>
                      <TableHead className="text-right">الراتب الإجمالي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">جاري التحميل...</TableCell></TableRow>
                    ) : employees.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد موظفون</TableCell></TableRow>
                    ) : employees.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono">{emp.employee_number || '-'}</TableCell>
                        <TableCell>{emp.full_name}</TableCell>
                        <TableCell>{emp.department || '-'}</TableCell>
                        <TableCell>{emp.job_title || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{contractLabels[emp.contract_type || ''] || '-'}</Badge></TableCell>
                        <TableCell>{((emp.base_salary || 0) + (emp.housing_allowance || 0) + (emp.transport_allowance || 0)).toLocaleString()} ر.س</TableCell>
                        <TableCell><Badge variant={emp.is_active ? 'default' : 'secondary'}>{emp.is_active ? 'نشط' : 'منتهي'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Dialog open={showAddLeave} onOpenChange={setShowAddLeave}>
              <DialogTrigger asChild><Button><Plus className="ml-2 h-4 w-4" />طلب إجازة</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>طلب إجازة جديد</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>الموظف</Label>
                    <Select value={newLeave.employee_id} onValueChange={v => setNewLeave(p => ({ ...p, employee_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                      <SelectContent>{employees.filter(e => e.is_active).map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>نوع الإجازة</Label>
                    <Select value={newLeave.leave_type} onValueChange={v => setNewLeave(p => ({ ...p, leave_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(leaveLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>من</Label><Input type="date" value={newLeave.start_date} onChange={e => setNewLeave(p => ({ ...p, start_date: e.target.value }))} /></div>
                    <div><Label>إلى</Label><Input type="date" value={newLeave.end_date} onChange={e => setNewLeave(p => ({ ...p, end_date: e.target.value }))} /></div>
                  </div>
                  <div><Label>السبب</Label><Input value={newLeave.reason} onChange={e => setNewLeave(p => ({ ...p, reason: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => addLeaveMutation.mutate()} disabled={addLeaveMutation.isPending}>تقديم الطلب</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الموظف</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">من</TableHead>
                      <TableHead className="text-right">إلى</TableHead>
                      <TableHead className="text-right">السبب</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد طلبات إجازة</TableCell></TableRow>
                    ) : leaves.map((l: any) => (
                      <TableRow key={l.id}>
                        <TableCell>{l.employee?.full_name || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{leaveLabels[l.leave_type] || l.leave_type}</Badge></TableCell>
                        <TableCell>{new Date(l.start_date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{new Date(l.end_date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{l.reason || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={l.status === 'approved' ? 'default' : l.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {leaveStatusLabels[l.status] || l.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">لا توجد مسيرات رواتب</TableCell></TableRow>
                    ) : payrolls.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.period_month}/{p.period_year}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                            {p.status === 'paid' ? 'مدفوع' : p.status === 'approved' ? 'معتمد' : p.status === 'calculated' ? 'محسوب' : 'مسودة'}
                          </Badge>
                        </TableCell>
                        <TableCell>{(p.total_amount || 0).toLocaleString()} ر.س</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default ERPHR;
