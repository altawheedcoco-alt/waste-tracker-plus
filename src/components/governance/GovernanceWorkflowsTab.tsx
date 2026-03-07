import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApprovalWorkflows, useGovernanceRoles, useApprovalInstances } from '@/hooks/useGovernance';
import { Plus, GitBranch, Loader2, CheckCircle2, XCircle, Clock, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const RESOURCE_TYPES = [
  { value: 'shipment', label: 'الشحنات' },
  { value: 'invoice', label: 'الفواتير' },
  { value: 'contract', label: 'العقود' },
  { value: 'payment', label: 'المدفوعات' },
  { value: 'employee_action', label: 'إجراءات الموظفين' },
];

const CONDITION_TYPES = [
  { value: 'always', label: 'دائماً' },
  { value: 'amount_above', label: 'عند تجاوز مبلغ معين' },
];

const statusIcon: Record<string, any> = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function GovernanceWorkflowsTab() {
  const { workflows, isLoading, createWorkflow, toggleWorkflow } = useApprovalWorkflows();
  const { roles } = useGovernanceRoles();
  const { instances } = useApprovalInstances();
  const [showCreate, setShowCreate] = useState(false);
  const [wf, setWf] = useState({ workflow_name: '', resource_type: 'shipment', condition_type: 'always', condition_value: 0, enforce_segregation: true });
  const [steps, setSteps] = useState<{ step_name: string; approver_role_id: string }[]>([{ step_name: 'المراجعة الأولية', approver_role_id: '' }]);

  const addStep = () => setSteps(p => [...p, { step_name: '', approver_role_id: '' }]);
  const updateStep = (i: number, field: string, value: string) => {
    const copy = [...steps];
    (copy[i] as any)[field] = value;
    setSteps(copy);
  };
  const removeStep = (i: number) => setSteps(p => p.filter((_, idx) => idx !== i));

  const handleCreate = () => {
    createWorkflow.mutate({ ...wf, steps: steps.filter(s => s.step_name) } as any, {
      onSuccess: () => {
        setShowCreate(false);
        setWf({ workflow_name: '', resource_type: 'shipment', condition_type: 'always', condition_value: 0, enforce_segregation: true });
        setSteps([{ step_name: 'المراجعة الأولية', approver_role_id: '' }]);
      },
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">سلاسل الموافقات</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" /> إنشاء سلسلة جديدة</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء سلسلة موافقات</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>اسم السلسلة*</Label>
                <Input value={wf.workflow_name} onChange={e => setWf(p => ({ ...p, workflow_name: e.target.value }))} placeholder="مثال: اعتماد الشحنات الكبيرة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع العملية</Label>
                  <Select value={wf.resource_type} onValueChange={v => setWf(p => ({ ...p, resource_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>شرط التفعيل</Label>
                  <Select value={wf.condition_type} onValueChange={v => setWf(p => ({ ...p, condition_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONDITION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {wf.condition_type === 'amount_above' && (
                <div>
                  <Label>المبلغ (ج.م)</Label>
                  <Input type="number" value={wf.condition_value} onChange={e => setWf(p => ({ ...p, condition_value: +e.target.value }))} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>فصل المهام (Segregation of Duties)</Label>
                <Switch checked={wf.enforce_segregation} onCheckedChange={v => setWf(p => ({ ...p, enforce_segregation: v }))} />
              </div>
              <p className="text-xs text-muted-foreground">منع نفس الشخص من إنشاء واعتماد نفس العملية</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">خطوات الموافقة</h4>
                  <Button variant="outline" size="sm" onClick={addStep}>+ خطوة</Button>
                </div>
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded-lg">
                    <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}</span>
                    <Input className="flex-1" value={step.step_name} onChange={e => updateStep(i, 'step_name', e.target.value)} placeholder="اسم الخطوة" />
                    <Select value={step.approver_role_id} onValueChange={v => updateStep(i, 'approver_role_id', v)}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="الدور المعتمد" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.role_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {steps.length > 1 && (
                      <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => removeStep(i)}>×</Button>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleCreate} disabled={!wf.workflow_name || createWorkflow.isPending} className="w-full">
                {createWorkflow.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء السلسلة'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {workflows.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">لم يتم إنشاء سلاسل موافقات بعد</CardContent></Card>
      )}

      {/* Workflows list */}
      <div className="space-y-3">
        {workflows.map(w => (
          <Card key={w.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{w.workflow_name}</span>
                  <Badge variant="outline">{RESOURCE_TYPES.find(r => r.value === w.resource_type)?.label}</Badge>
                  {w.enforce_segregation && <Badge className="bg-amber-100 text-amber-800">فصل مهام</Badge>}
                </div>
                <Switch checked={w.is_active} onCheckedChange={v => toggleWorkflow.mutate({ id: w.id, is_active: v })} />
              </div>
              {w.condition_type === 'amount_above' && (
                <p className="text-xs text-muted-foreground mb-2">يُطبق عند تجاوز {w.condition_value.toLocaleString()} ج.م</p>
              )}
              {/* Steps visualization */}
              {w.steps && w.steps.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {w.steps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step, i) => (
                      <div key={step.id} className="flex items-center gap-1">
                        <div className="px-2 py-1 rounded bg-muted text-xs font-medium">{step.step_name}</div>
                        {i < w.steps!.length - 1 && <ChevronLeft className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Instances */}
      {instances.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">طلبات الموافقة الأخيرة</h3>
          <div className="space-y-2">
            {instances.slice(0, 10).map(inst => (
              <Card key={inst.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon[inst.status] || statusIcon.pending}
                    <div>
                      <p className="text-sm font-medium">{inst.resource_title || inst.resource_type}</p>
                      <p className="text-xs text-muted-foreground">
                        بواسطة {(inst.requester as any)?.full_name || 'مستخدم'} — الخطوة {inst.current_step}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inst.amount && <span className="text-xs font-mono">{inst.amount.toLocaleString()} ج.م</span>}
                    <Badge variant={inst.status === 'approved' ? 'default' : inst.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {inst.status === 'pending' ? 'معلق' : inst.status === 'approved' ? 'معتمد' : 'مرفوض'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(inst.created_at), 'dd/MM', { locale: ar })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
