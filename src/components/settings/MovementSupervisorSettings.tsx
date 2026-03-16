import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Bot, User, Eye, Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SupervisorRow {
  id?: string;
  supervisor_type: 'human' | 'ai';
  user_id?: string | null;
  supervisor_name: string;
  supervisor_phone: string;
  supervisor_email: string;
  supervisor_position: string;
  is_active: boolean;
}

interface OrgMember {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
}

const MovementSupervisorSettings = () => {
  const { organization } = useAuth();
  const [rows, setRows] = useState<SupervisorRow[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    Promise.all([
      supabase
        .from('organization_movement_supervisors')
        .select('*')
        .eq('organization_id', organization.id),
      supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .eq('organization_id', organization.id),
    ]).then(([supRes, memRes]) => {
      if (supRes.data?.length) {
        setRows(supRes.data.map(d => ({
          id: d.id,
          supervisor_type: d.supervisor_type as 'human' | 'ai',
          user_id: d.user_id,
          supervisor_name: d.supervisor_name || '',
          supervisor_phone: d.supervisor_phone || '',
          supervisor_email: d.supervisor_email || '',
          supervisor_position: d.supervisor_position || '',
          is_active: d.is_active ?? true,
        })));
      }
      if (memRes.data) setMembers(memRes.data as OrgMember[]);
      setLoading(false);
    });
  }, [organization?.id]);

  const addRow = () => {
    setRows(prev => [...prev, {
      supervisor_type: 'human',
      supervisor_name: '',
      supervisor_phone: '',
      supervisor_email: '',
      supervisor_position: '',
      is_active: true,
    }]);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, patch: Partial<SupervisorRow>) => {
    setRows(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...patch };
      if (patch.user_id) {
        const m = members.find(m => m.id === patch.user_id);
        if (m) {
          updated[idx].supervisor_name = m.full_name;
          updated[idx].supervisor_phone = m.phone || '';
          updated[idx].supervisor_email = m.email || '';
        }
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!organization?.id) return;
    setSaving(true);
    try {
      // Delete existing
      await supabase
        .from('organization_movement_supervisors')
        .delete()
        .eq('organization_id', organization.id);

      // Insert all
      if (rows.length > 0) {
        const inserts = rows.map(r => ({
          organization_id: organization.id,
          supervisor_type: r.supervisor_type,
          user_id: r.user_id || null,
          supervisor_name: r.supervisor_name || null,
          supervisor_phone: r.supervisor_phone || null,
          supervisor_email: r.supervisor_email || null,
          supervisor_position: r.supervisor_position || null,
          is_active: r.is_active,
        }));
        const { error } = await supabase
          .from('organization_movement_supervisors')
          .insert(inserts);
        if (error) throw error;
      }
      toast.success('تم حفظ إعدادات مسئولي الحركة');
    } catch (e: any) {
      toast.error('فشل الحفظ: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">مسئولو الحركة الافتراضيون</CardTitle>
            <CardDescription>
              يتم تعيينهم تلقائياً على كل شحنة جديدة تتعلق بجهتكم
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeRow(idx)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Select value={row.supervisor_type} onValueChange={(v) => updateRow(idx, { supervisor_type: v as 'human' | 'ai', user_id: null })}>
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human"><span className="flex items-center gap-1"><User className="h-3 w-3" /> بشري</span></SelectItem>
                    <SelectItem value="ai"><span className="flex items-center gap-1"><Bot className="h-3 w-3" /> ذكاء اصطناعي</span></SelectItem>
                  </SelectContent>
                </Select>

                {row.supervisor_type === 'human' && members.length > 0 && (
                  <Select value={row.user_id || '__manual__'} onValueChange={(v) => updateRow(idx, { user_id: v === '__manual__' ? null : v })}>
                    <SelectTrigger className="h-8 flex-1 text-xs">
                      <SelectValue placeholder="اختر عضواً" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__manual__">إدخال يدوي</SelectItem>
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center gap-2">
                  <Switch checked={row.is_active} onCheckedChange={(v) => updateRow(idx, { is_active: v })} />
                  <Badge variant={row.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {row.is_active ? 'نشط' : 'معطل'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">الاسم</Label>
                  <Input value={row.supervisor_name} onChange={(e) => updateRow(idx, { supervisor_name: e.target.value })} className="h-7 text-xs" placeholder={row.supervisor_type === 'ai' ? 'وكيل AI' : 'الاسم'} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">الهاتف</Label>
                  <Input value={row.supervisor_phone} onChange={(e) => updateRow(idx, { supervisor_phone: e.target.value })} className="h-7 text-xs" placeholder="الهاتف" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">البريد</Label>
                  <Input value={row.supervisor_email} onChange={(e) => updateRow(idx, { supervisor_email: e.target.value })} className="h-7 text-xs" placeholder="البريد" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">المنصب</Label>
                  <Input value={row.supervisor_position} onChange={(e) => updateRow(idx, { supervisor_position: e.target.value })} className="h-7 text-xs" placeholder="المنصب" />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <Button variant="eco" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ الإعدادات
          </Button>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 ml-2" /> إضافة مسئول
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MovementSupervisorSettings;
