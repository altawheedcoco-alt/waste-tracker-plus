import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Zap, Plus, Trash2, Play, Settings2, ArrowLeftRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RulesEngineTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
}

const RulesEngineTab = ({ facilityId, organizationId }: RulesEngineTabProps) => {
  const queryClient = useQueryClient();
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    waste_type: '',
    hazard_level: '',
    weight_min: '',
    weight_max: '',
    action_type: 'route_to_method',
    disposal_method: '',
    priority: '10',
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['disposal-rules', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('disposal_automation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  const addRuleMutation = useMutation({
    mutationFn: async () => {
      const conditions: Record<string, any> = {};
      if (newRule.waste_type) conditions.waste_type = newRule.waste_type;
      if (newRule.hazard_level) conditions.hazard_level = newRule.hazard_level;
      if (newRule.weight_min) conditions.weight_min = Number(newRule.weight_min);
      if (newRule.weight_max) conditions.weight_max = Number(newRule.weight_max);

      const action_config: Record<string, any> = {};
      if (newRule.disposal_method) action_config.disposal_method = newRule.disposal_method;

      const { error } = await supabase.from('disposal_automation_rules').insert({
        organization_id: organizationId!,
        rule_name: newRule.rule_name,
        conditions,
        action_type: newRule.action_type,
        action_config,
        priority: Number(newRule.priority) || 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة القاعدة بنجاح');
      setShowAddRule(false);
      setNewRule({ rule_name: '', waste_type: '', hazard_level: '', weight_min: '', weight_max: '', action_type: 'route_to_method', disposal_method: '', priority: '10' });
      queryClient.invalidateQueries({ queryKey: ['disposal-rules'] });
    },
    onError: () => toast.error('فشل إضافة القاعدة'),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('disposal_automation_rules').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['disposal-rules'] }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('disposal_automation_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف القاعدة');
      queryClient.invalidateQueries({ queryKey: ['disposal-rules'] });
    },
  });

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'route_to_method': return 'توجيه لطريقة التخلص';
      case 'auto_invoice': return 'إنشاء فاتورة تلقائية';
      case 'auto_certificate': return 'إصدار شهادة تلقائية';
      case 'notify': return 'إرسال إشعار';
      default: return type;
    }
  };

  const getConditionsLabel = (conditions: any) => {
    const parts: string[] = [];
    if (conditions.waste_type) parts.push(`النوع: ${conditions.waste_type}`);
    if (conditions.hazard_level) parts.push(`الخطورة: ${conditions.hazard_level === 'hazardous' ? '⚠️ خطر' : 'غير خطر'}`);
    if (conditions.weight_min) parts.push(`الوزن ≥ ${conditions.weight_min} طن`);
    if (conditions.weight_max) parts.push(`الوزن ≤ ${conditions.weight_max} طن`);
    return parts.length > 0 ? parts.join(' • ') : 'بدون شروط محددة';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button size="sm" className="gap-2" onClick={() => setShowAddRule(true)}>
              <Plus className="w-4 h-4" /> إضافة قاعدة
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="w-5 h-5 text-blue-600" />
                محرك القواعد الذكي (Rules Engine)
              </CardTitle>
              <CardDescription className="text-right mt-1">
                قواعد If-Then لتوجيه المخلفات تلقائياً بناءً على النوع والوزن والخطورة
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-2">لا توجد قواعد أتمتة حتى الآن</p>
              <p className="text-xs">أضف قاعدة لتفعيل التوجيه التلقائي للمخلفات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule: any) => (
                <div key={rule.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${rule.is_active ? 'bg-card' : 'bg-muted/30 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <Switch checked={rule.is_active} onCheckedChange={(v) => toggleRuleMutation.mutate({ id: rule.id, is_active: v })} />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => deleteRuleMutation.mutate(rule.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {rule.times_triggered > 0 && (
                      <Badge variant="outline" className="text-xs gap-1"><Play className="w-3 h-3" /> {rule.times_triggered}x</Badge>
                    )}
                  </div>
                  <div className="text-right flex-1 mr-4">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <Badge className="text-xs bg-blue-500/10 text-blue-600 gap-1">
                        <Zap className="w-3 h-3" /> {getActionLabel(rule.action_type)}
                      </Badge>
                      <span className="font-medium text-sm">{rule.rule_name}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
                      <span>{getConditionsLabel(rule.conditions)}</span>
                      <ArrowLeftRight className="w-3 h-3" />
                      {rule.action_config?.disposal_method && (
                        <Badge variant="outline" className="text-xs">
                          {rule.action_config.disposal_method === 'incineration' ? '🔥 حرق' : rule.action_config.disposal_method === 'landfill' ? '⛏️ دفن' : '🧪 معالجة'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" /> إضافة قاعدة أتمتة جديدة</DialogTitle>
            <DialogDescription>حدد الشروط والإجراء الذي يُنفذ تلقائياً عند تحققها</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>اسم القاعدة</Label>
              <Input placeholder="مثال: مخلفات كيميائية ثقيلة → المحرقة" value={newRule.rule_name} onChange={(e) => setNewRule(p => ({ ...p, rule_name: e.target.value }))} />
            </div>

            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              <p className="text-sm font-bold text-muted-foreground">الشروط (IF)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">نوع المخلف</Label>
                  <Select value={newRule.waste_type} onValueChange={(v) => setNewRule(p => ({ ...p, waste_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chemical">كيميائي</SelectItem>
                      <SelectItem value="medical">طبي</SelectItem>
                      <SelectItem value="industrial">صناعي</SelectItem>
                      <SelectItem value="organic">عضوي</SelectItem>
                      <SelectItem value="electronic">إلكتروني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">مستوى الخطورة</Label>
                  <Select value={newRule.hazard_level} onValueChange={(v) => setNewRule(p => ({ ...p, hazard_level: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hazardous">⚠️ خطر</SelectItem>
                      <SelectItem value="non_hazardous">غير خطر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الوزن الأدنى (طن)</Label>
                  <Input type="number" step="0.1" placeholder="0" value={newRule.weight_min} onChange={(e) => setNewRule(p => ({ ...p, weight_min: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">الوزن الأقصى (طن)</Label>
                  <Input type="number" step="0.1" placeholder="∞" value={newRule.weight_max} onChange={(e) => setNewRule(p => ({ ...p, weight_max: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/10 space-y-3">
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">الإجراء (THEN)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">نوع الإجراء</Label>
                  <Select value={newRule.action_type} onValueChange={(v) => setNewRule(p => ({ ...p, action_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="route_to_method">توجيه لطريقة التخلص</SelectItem>
                      <SelectItem value="auto_invoice">إنشاء فاتورة تلقائية</SelectItem>
                      <SelectItem value="auto_certificate">إصدار شهادة تلقائية</SelectItem>
                      <SelectItem value="notify">إرسال إشعار</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">طريقة التخلص</Label>
                  <Select value={newRule.disposal_method} onValueChange={(v) => setNewRule(p => ({ ...p, disposal_method: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incineration">🔥 حرق (Incineration)</SelectItem>
                      <SelectItem value="landfill">⛏️ دفن صحي (Landfill)</SelectItem>
                      <SelectItem value="chemical_treatment">🧪 معالجة كيميائية</SelectItem>
                      <SelectItem value="autoclave">♨️ تعقيم حراري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">الأولوية (أقل رقم = أعلى أولوية)</Label>
              <Input type="number" value={newRule.priority} onChange={(e) => setNewRule(p => ({ ...p, priority: e.target.value }))} />
            </div>

            <Button className="w-full gap-2" onClick={() => addRuleMutation.mutate()} disabled={!newRule.rule_name || addRuleMutation.isPending}>
              <Zap className="w-4 h-4" /> {addRuleMutation.isPending ? 'جاري الحفظ...' : 'حفظ القاعدة وتفعيلها'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RulesEngineTab;
