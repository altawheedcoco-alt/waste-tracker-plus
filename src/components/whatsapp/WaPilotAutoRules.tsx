import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings2, Plus, Trash2, Zap, ArrowRight, Package, CreditCard, UserPlus, AlertTriangle, Bell, FileCheck, Clock } from 'lucide-react';

interface AutoRule {
  id: string;
  name: string;
  trigger_event: string;
  conditions: any;
  message_template: string;
  target_roles: string[];
  is_active: boolean;
  created_at: string;
  executions_count: number;
}

const TRIGGER_EVENTS = [
  { value: 'shipment_created', label: 'إنشاء شحنة جديدة', icon: Package, color: 'text-blue-600' },
  { value: 'shipment_approved', label: 'الموافقة على شحنة', icon: Package, color: 'text-green-600' },
  { value: 'shipment_in_transit', label: 'شحنة في الطريق', icon: Package, color: 'text-amber-600' },
  { value: 'shipment_delivered', label: 'تسليم شحنة', icon: Package, color: 'text-green-700' },
  { value: 'invoice_created', label: 'إصدار فاتورة', icon: CreditCard, color: 'text-purple-600' },
  { value: 'payment_received', label: 'استلام دفعة', icon: CreditCard, color: 'text-green-600' },
  { value: 'user_registered', label: 'تسجيل مستخدم جديد', icon: UserPlus, color: 'text-blue-600' },
  { value: 'org_registered', label: 'تسجيل جهة جديدة', icon: UserPlus, color: 'text-indigo-600' },
  { value: 'license_expiring', label: 'اقتراب انتهاء ترخيص', icon: AlertTriangle, color: 'text-amber-600' },
  { value: 'subscription_expiring', label: 'اقتراب انتهاء اشتراك', icon: Clock, color: 'text-amber-600' },
  { value: 'deposit_created', label: 'إنشاء إيداع جديد', icon: FileCheck, color: 'text-blue-600' },
  { value: 'partner_linked', label: 'ربط شريك جديد', icon: Bell, color: 'text-indigo-600' },
];

const TARGET_ROLES = [
  { value: 'generator', label: 'المولّد' },
  { value: 'transporter', label: 'الناقل' },
  { value: 'recycler', label: 'المدوّر' },
  { value: 'all_parties', label: 'جميع الأطراف' },
  { value: 'admin', label: 'مدير النظام' },
  { value: 'creator', label: 'مُنشئ العملية' },
];

const WaPilotAutoRules = () => {
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger_event: 'shipment_created',
    message_template: '',
    target_roles: ['all_parties'],
    conditions: {} as any,
  });

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    const { data } = await supabase
      .from('whatsapp_quick_actions' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRules(data.map((d: any) => ({
      id: d.id,
      name: d.name,
      trigger_event: d.action_type,
      conditions: d.target_filter || {},
      message_template: d.message_text || '',
      target_roles: d.target_filter?.roles || ['all_parties'],
      is_active: d.is_active,
      created_at: d.created_at,
      executions_count: d.usage_count || 0,
    })));
  };

  const handleCreate = async () => {
    if (!newRule.name || !newRule.message_template) {
      toast.error('يرجى إدخال الاسم ونص الرسالة');
      return;
    }
    const { error } = await supabase.from('whatsapp_quick_actions' as any).insert({
      name: newRule.name,
      action_type: newRule.trigger_event,
      message_text: newRule.message_template,
      target_filter: { ...newRule.conditions, roles: newRule.target_roles },
      is_active: true,
      description: `قاعدة تلقائية: ${TRIGGER_EVENTS.find(t => t.value === newRule.trigger_event)?.label}`,
    } as any);
    if (error) toast.error('فشل في إنشاء القاعدة');
    else {
      toast.success('تم إنشاء قاعدة الأتمتة');
      setShowCreate(false);
      setNewRule({ name: '', trigger_event: 'shipment_created', message_template: '', target_roles: ['all_parties'], conditions: {} });
      fetchRules();
    }
  };

  const toggleRule = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('whatsapp_quick_actions' as any)
      .update({ is_active: active } as any)
      .eq('id', id);
    if (error) toast.error('فشل في تحديث القاعدة');
    else { toast.success(active ? 'تم تفعيل القاعدة' : 'تم تعطيل القاعدة'); fetchRules(); }
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('whatsapp_quick_actions' as any)
      .delete()
      .eq('id', id);
    if (error) toast.error('فشل في حذف القاعدة');
    else { toast.success('تم حذف القاعدة'); fetchRules(); }
  };

  return (
    <div className="space-y-4">
      {/* Automation Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <Settings2 className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{rules.length}</div>
          <p className="text-xs text-muted-foreground">إجمالي القواعد</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Zap className="h-5 w-5 mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{rules.filter(r => r.is_active).length}</div>
          <p className="text-xs text-muted-foreground">قواعد نشطة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ArrowRight className="h-5 w-5 mx-auto mb-1 text-amber-600" />
          <div className="text-2xl font-bold">{rules.reduce((sum, r) => sum + r.executions_count, 0)}</div>
          <p className="text-xs text-muted-foreground">إجمالي التنفيذات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Bell className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{TRIGGER_EVENTS.length}</div>
          <p className="text-xs text-muted-foreground">أحداث متاحة</p>
        </CardContent></Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              قواعد الأتمتة
            </CardTitle>
            <CardDescription>إعداد إرسال تلقائي للرسائل عند حدوث أحداث معينة في النظام</CardDescription>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 ml-1" />قاعدة جديدة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>إنشاء قاعدة أتمتة</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>اسم القاعدة</Label>
                  <Input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="إشعار إنشاء شحنة" />
                </div>
                <div>
                  <Label>الحدث المُشغّل</Label>
                  <Select value={newRule.trigger_event} onValueChange={v => setNewRule(p => ({ ...p, trigger_event: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_EVENTS.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الجمهور المستهدف</Label>
                  <Select value={newRule.target_roles[0]} onValueChange={v => setNewRule(p => ({ ...p, target_roles: [v] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TARGET_ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نص الرسالة</Label>
                  <Textarea
                    value={newRule.message_template}
                    onChange={e => setNewRule(p => ({ ...p, message_template: e.target.value }))}
                    placeholder="مرحباً {{name}}، تم إنشاء شحنة جديدة برقم {{shipment_id}}..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">المتغيرات: {'{{name}}, {{org_name}}, {{shipment_id}}, {{amount}}'}</p>
                </div>
                <Button onClick={handleCreate} className="w-full">إنشاء القاعدة</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {rules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد قواعد أتمتة</p>
                <p className="text-xs mt-1">أنشئ قاعدة لإرسال رسائل تلقائية عند حدوث أحداث معينة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => {
                  const triggerInfo = TRIGGER_EVENTS.find(t => t.value === rule.trigger_event);
                  const TriggerIcon = triggerInfo?.icon || Bell;
                  return (
                    <div key={rule.id} className={`border rounded-lg p-4 space-y-2 transition-colors ${rule.is_active ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TriggerIcon className={`h-5 w-5 ${triggerInfo?.color || 'text-primary'}`} />
                          <div>
                            <p className="font-medium text-sm">{rule.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">{triggerInfo?.label || rule.trigger_event}</Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="secondary" className="text-xs">
                                {TARGET_ROLES.find(r => r.value === rule.target_roles?.[0])?.label || 'الجميع'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{rule.executions_count} تنفيذ</Badge>
                          <Switch checked={rule.is_active} onCheckedChange={v => toggleRule(rule.id, v)} />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRule(rule.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted/50 rounded p-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {rule.message_template?.slice(0, 120)}{rule.message_template?.length > 120 ? '...' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Available Triggers Reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">الأحداث المتاحة للأتمتة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {TRIGGER_EVENTS.map(t => (
              <div key={t.value} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs">
                <t.icon className={`h-3.5 w-3.5 ${t.color} shrink-0`} />
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaPilotAutoRules;
