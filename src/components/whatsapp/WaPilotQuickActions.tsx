import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Plus, Play, Loader2, Package, Bell, UserPlus, FileCheck, Megaphone, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuickAction {
  id: string;
  name: string;
  description: string | null;
  action_type: string;
  target_filter: any;
  message_text: string | null;
  is_active: boolean;
  usage_count: number;
  last_used_at: string | null;
}

const PRESET_ACTIONS = [
  { icon: UserPlus, name: 'ترحيب بجهة جديدة', desc: 'إرسال رسالة ترحيبية لأحدث جهة مسجلة', type: 'welcome', color: 'text-blue-600' },
  { icon: Package, name: 'تحديث الشحنات اليومي', desc: 'إرسال ملخص الشحنات لجميع الناقلين', type: 'daily_shipments', color: 'text-green-600' },
  { icon: Bell, name: 'تذكير الاشتراكات', desc: 'تنبيه الجهات بقرب انتهاء اشتراكاتها', type: 'subscription_reminder', color: 'text-amber-600' },
  { icon: FileCheck, name: 'طلب تجديد الترخيص', desc: 'إشعار الجهات بانتهاء التراخيص البيئية', type: 'license_renewal', color: 'text-purple-600' },
  { icon: Megaphone, name: 'إعلان عام للمنصة', desc: 'إرسال إعلان لجميع المستخدمين', type: 'broadcast_all', color: 'text-primary' },
  { icon: AlertTriangle, name: 'تنبيه طوارئ', desc: 'إرسال تنبيه عاجل لجميع الجهات والمستخدمين', type: 'emergency', color: 'text-destructive' },
];

const WaPilotQuickActions = () => {
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [executing, setExecuting] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const [newAction, setNewAction] = useState({
    name: '', description: '', action_type: 'broadcast', message_text: '',
    target_filter: { org_type: 'all' },
  });

  useEffect(() => { fetchActions(); }, []);

  const fetchActions = async () => {
    const { data } = await supabase
      .from('whatsapp_quick_actions' as any)
      .select('*')
      .order('usage_count', { ascending: false });
    if (data) setActions(data as any);
  };

  const executePreset = async (type: string) => {
    if (!customMessage && type !== 'broadcast_all') {
      setActivePreset(type);
      return;
    }

    setExecuting(type);
    try {
      // Determine recipients based on preset type
      let targetOrgType: string = '';
      switch (type) {
        case 'daily_shipments': targetOrgType = 'transporter'; break;
        case 'subscription_reminder': targetOrgType = ''; break;
        case 'license_renewal': targetOrgType = ''; break;
        default: targetOrgType = ''; break;
      }

      // Fetch recipients
      let query = supabase.from('profiles').select('id, full_name, phone').not('phone', 'is', null);
      if (targetOrgType) {
        const { data: orgIds } = await supabase
          .from('organizations')
          .select('id')
          .eq('organization_type', targetOrgType as any);
        if (orgIds) {
          query = query.in('organization_id', orgIds.map(o => o.id));
        }
      }

      const { data: recipients } = await query.limit(200);
      if (!recipients || recipients.length === 0) {
        toast.error('لا يوجد مستلمون متاحون');
        setExecuting(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          action: 'bulk',
          message_text: customMessage || `إشعار من منصة iRecycle - ${PRESET_ACTIONS.find(p => p.type === type)?.name}`,
          recipients: recipients.map(r => ({ phone: r.phone, user_id: r.id })),
        },
      });

      if (error) throw error;
      const successCount = data?.results?.filter((r: any) => r.success).length || 0;
      toast.success(`تم إرسال ${successCount} من ${recipients.length} رسالة`);
      setCustomMessage('');
      setActivePreset(null);
    } catch (e: any) {
      toast.error(e.message || 'خطأ في التنفيذ');
    }
    setExecuting(null);
  };

  const handleCreateAction = async () => {
    if (!newAction.name || !newAction.message_text) {
      toast.error('يرجى إدخال الاسم ونص الرسالة');
      return;
    }
    const { error } = await supabase.from('whatsapp_quick_actions' as any).insert({
      name: newAction.name,
      description: newAction.description || null,
      action_type: newAction.action_type,
      message_text: newAction.message_text,
      target_filter: newAction.target_filter,
      is_active: true,
    } as any);
    if (error) toast.error('فشل في إنشاء الإجراء');
    else {
      toast.success('تم إنشاء الإجراء السريع');
      setShowCreateDialog(false);
      setNewAction({ name: '', description: '', action_type: 'broadcast', message_text: '', target_filter: { org_type: 'all' } });
      fetchActions();
    }
  };

  return (
    <div className="space-y-4">
      {/* Preset Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />الإجراءات السريعة</CardTitle>
          <CardDescription>سيناريوهات إرسال مُعدة مسبقاً لتسريع العمليات الروتينية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_ACTIONS.map(preset => (
              <div key={preset.type} className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <preset.icon className={`h-8 w-8 ${preset.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.desc}</p>
                  </div>
                </div>

                {activePreset === preset.type && (
                  <div className="space-y-2">
                    <Textarea
                      value={customMessage}
                      onChange={e => setCustomMessage(e.target.value)}
                      placeholder="أدخل نص الرسالة..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                )}

                <Button
                  variant={activePreset === preset.type ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                  disabled={executing === preset.type}
                  onClick={() => executePreset(preset.type)}
                >
                  {executing === preset.type ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
                  ) : (
                    <Play className="h-3.5 w-3.5 ml-1" />
                  )}
                  {activePreset === preset.type ? 'إرسال الآن' : 'تنفيذ'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Quick Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">إجراءات مخصصة</CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 ml-1" />إجراء جديد</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إنشاء إجراء سريع مخصص</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>اسم الإجراء</Label>
                  <Input value={newAction.name} onChange={e => setNewAction(p => ({ ...p, name: e.target.value }))} placeholder="تذكير الدفع الشهري" />
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Input value={newAction.description} onChange={e => setNewAction(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر" />
                </div>
                <div>
                  <Label>الجمهور المستهدف</Label>
                  <Select value={newAction.target_filter.org_type} onValueChange={v => setNewAction(p => ({ ...p, target_filter: { org_type: v } }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الجميع</SelectItem>
                      <SelectItem value="generator">المولّدين</SelectItem>
                      <SelectItem value="transporter">الناقلين</SelectItem>
                      <SelectItem value="recycler">المدوّرين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نص الرسالة</Label>
                  <Textarea value={newAction.message_text} onChange={e => setNewAction(p => ({ ...p, message_text: e.target.value }))} rows={3} />
                </div>
                <Button onClick={handleCreateAction} className="w-full">إنشاء</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {actions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لم يتم إنشاء إجراءات مخصصة بعد</p>
            ) : (
              <div className="space-y-2">
                {actions.map(action => (
                  <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{action.name}</p>
                      {action.description && <p className="text-xs text-muted-foreground">{action.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">استخدم {action.usage_count} مرة</Badge>
                      <Button variant="outline" size="sm"><Play className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaPilotQuickActions;
