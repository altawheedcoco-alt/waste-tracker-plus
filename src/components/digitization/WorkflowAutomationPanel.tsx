/**
 * لوحة أتمتة سير العمل — Workflow Automation Panel
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Workflow, Plus, Zap, Clock, CheckCircle2, AlertTriangle,
  Play, Pause, Trash2, Settings2, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface WorkflowRule {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  trigger_type: string;
  trigger_config: any;
  conditions: any[];
  actions: any[];
  is_enabled: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

const triggerTypes = [
  { value: 'shipment_created', label: 'إنشاء شحنة جديدة', labelEn: 'Shipment Created' },
  { value: 'shipment_status_changed', label: 'تغيير حالة الشحنة', labelEn: 'Shipment Status Changed' },
  { value: 'invoice_created', label: 'إصدار فاتورة', labelEn: 'Invoice Created' },
  { value: 'document_uploaded', label: 'رفع مستند', labelEn: 'Document Uploaded' },
  { value: 'signature_completed', label: 'اكتمال التوقيع', labelEn: 'Signature Completed' },
  { value: 'approval_requested', label: 'طلب موافقة', labelEn: 'Approval Requested' },
  { value: 'schedule_daily', label: 'جدولة يومية', labelEn: 'Daily Schedule' },
  { value: 'schedule_weekly', label: 'جدولة أسبوعية', labelEn: 'Weekly Schedule' },
];

const actionTypes = [
  { value: 'send_notification', label: 'إرسال إشعار', labelEn: 'Send Notification' },
  { value: 'send_whatsapp', label: 'إرسال واتساب', labelEn: 'Send WhatsApp' },
  { value: 'auto_approve', label: 'موافقة تلقائية', labelEn: 'Auto Approve' },
  { value: 'auto_sign', label: 'توقيع تلقائي', labelEn: 'Auto Sign' },
  { value: 'create_task', label: 'إنشاء مهمة', labelEn: 'Create Task' },
  { value: 'update_status', label: 'تحديث الحالة', labelEn: 'Update Status' },
  { value: 'generate_document', label: 'توليد مستند', labelEn: 'Generate Document' },
  { value: 'assign_driver', label: 'تعيين سائق', labelEn: 'Assign Driver' },
];

const WorkflowAutomationPanel = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name_ar: '', name: '', description: '',
    trigger_type: '', actions: [{ type: '', config: {} }],
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('organization_id').eq('id', data.user.id).single()
          .then(({ data: p }) => {
            if (p?.organization_id) {
              setOrgId(p.organization_id);
              fetchRules(p.organization_id);
            }
          });
      }
    });
  }, []);

  const fetchRules = async (oid: string) => {
    setLoading(true);
    const { data } = await (supabase.from('workflow_rules') as any)
      .select('*').eq('organization_id', oid).order('created_at', { ascending: false });
    setRules((data || []) as WorkflowRule[]);
    setLoading(false);
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    await (supabase.from('workflow_rules') as any)
      .update({ is_enabled: enabled }).eq('id', ruleId);
    setRules(r => r.map(rule => rule.id === ruleId ? { ...rule, is_enabled: enabled } : rule));
    toast.success(enabled ? 'تم تفعيل القاعدة' : 'تم إيقاف القاعدة');
  };

  const deleteRule = async (ruleId: string) => {
    await (supabase.from('workflow_rules') as any).delete().eq('id', ruleId);
    setRules(r => r.filter(rule => rule.id !== ruleId));
    toast.success('تم حذف القاعدة');
  };

  const createRule = async () => {
    if (!orgId || !newRule.name_ar || !newRule.trigger_type) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    const { error } = await (supabase.from('workflow_rules') as any).insert({
      organization_id: orgId,
      name: newRule.name || newRule.name_ar,
      name_ar: newRule.name_ar,
      description: newRule.description,
      trigger_type: newRule.trigger_type,
      trigger_config: {},
      conditions: [],
      actions: newRule.actions.filter(a => a.type),
      is_enabled: true,
      created_by: user.user?.id,
    });
    if (error) { toast.error('فشل في إنشاء القاعدة'); return; }
    setShowCreate(false);
    setNewRule({ name_ar: '', name: '', description: '', trigger_type: '', actions: [{ type: '', config: {} }] });
    if (orgId) fetchRules(orgId);
    toast.success('تم إنشاء قاعدة الأتمتة بنجاح');
  };

  const getTriggerLabel = (type: string) => {
    const t = triggerTypes.find(tt => tt.value === type);
    return isAr ? t?.label || type : t?.labelEn || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            {isAr ? 'قواعد أتمتة سير العمل' : 'Workflow Automation Rules'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'أنشئ قواعد لأتمتة العمليات المتكررة' : 'Create rules to automate repetitive processes'}
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 ml-1" />{isAr ? 'قاعدة جديدة' : 'New Rule'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle>{isAr ? 'إنشاء قاعدة أتمتة' : 'Create Automation Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isAr ? 'اسم القاعدة (عربي)' : 'Rule Name (Arabic)'}</Label>
                <Input value={newRule.name_ar} onChange={e => setNewRule(r => ({ ...r, name_ar: e.target.value }))} placeholder="مثال: إشعار تلقائي عند إنشاء شحنة" />
              </div>
              <div>
                <Label>{isAr ? 'الوصف' : 'Description'}</Label>
                <Textarea value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} placeholder="وصف مختصر للقاعدة..." />
              </div>
              <div>
                <Label>{isAr ? 'المحفز (Trigger)' : 'Trigger'}</Label>
                <Select value={newRule.trigger_type} onValueChange={v => setNewRule(r => ({ ...r, trigger_type: v }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر المحفز...' : 'Select trigger...'} /></SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.label : t.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? 'الإجراء (Action)' : 'Action'}</Label>
                <Select value={newRule.actions[0]?.type || ''} onValueChange={v => setNewRule(r => ({ ...r, actions: [{ type: v, config: {} }] }))}>
                  <SelectTrigger><SelectValue placeholder={isAr ? 'اختر الإجراء...' : 'Select action...'} /></SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(a => (
                      <SelectItem key={a.value} value={a.value}>{isAr ? a.label : a.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createRule} className="w-full">
                <Zap className="w-4 h-4 ml-1" />{isAr ? 'إنشاء القاعدة' : 'Create Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{rules.length}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي القواعد' : 'Total Rules'}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.is_enabled).length}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'قواعد نشطة' : 'Active'}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{rules.reduce((s, r) => s + r.execution_count, 0)}</p>
          <p className="text-xs text-muted-foreground">{isAr ? 'عمليات منفذة' : 'Executions'}</p>
        </Card>
      </div>

      {/* Rules List */}
      <ScrollArea className="max-h-[500px]">
        <div className="space-y-3">
          {rules.map(rule => (
            <Card key={rule.id} className={`p-4 ${!rule.is_enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${rule.is_enabled ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                    <h3 className="font-medium text-sm">{rule.name_ar || rule.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{getTriggerLabel(rule.trigger_type)}</Badge>
                  </div>
                  {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" /> {rule.execution_count} {isAr ? 'تنفيذ' : 'runs'}
                    </span>
                    {rule.last_executed_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(rule.last_executed_at).toLocaleDateString('ar-EG')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_enabled} onCheckedChange={(v) => toggleRule(rule.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {rules.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <Workflow className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد قواعد أتمتة بعد. أنشئ قاعدتك الأولى!' : 'No rules yet. Create your first one!'}</p>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default WorkflowAutomationPanel;
