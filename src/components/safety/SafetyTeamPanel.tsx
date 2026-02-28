import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSafetyTeam } from '@/hooks/useSafetySystem';
import { Plus, Users, Loader2, X, Shield, UserCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ROLES = [
  { id: 'safety_manager', ar: 'مدير السلامة', desc: 'الاستراتيجيات والميزانية والتعامل مع الجهات الحكومية', color: 'bg-red-500' },
  { id: 'safety_engineer', ar: 'مهندس السلامة', desc: 'تصميم الحلول الهندسية لتقليل المخاطر', color: 'bg-blue-500' },
  { id: 'safety_supervisor', ar: 'مشرف السلامة', desc: 'الإشراف المباشر على المفتشين وتنفيذ الخطط', color: 'bg-purple-500' },
  { id: 'safety_officer', ar: 'ضابط/مفتش السلامة', desc: 'التواجد الميداني ورصد المخالفات', color: 'bg-amber-500' },
  { id: 'site_paramedic', ar: 'مسعف الموقع', desc: 'التعامل الفوري مع الإصابات والإسعافات', color: 'bg-emerald-500' },
];

const SPECIALIZATIONS = [
  { id: 'fire', ar: 'حرائق' },
  { id: 'chemical', ar: 'مواد كيميائية' },
  { id: 'construction', ar: 'إنشاءات' },
  { id: 'transport', ar: 'نقل' },
  { id: 'medical', ar: 'طبي' },
  { id: 'industrial', ar: 'صناعي' },
  { id: 'environmental', ar: 'بيئي' },
];

const SafetyTeamPanel = memo(() => {
  const { members, isLoading, add } = useSafetyTeam();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ is_registered: true });
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    const roleInfo = ROLES.find(r => r.id === form.role);
    if (!form.role || (!form.external_name && form.is_registered === false)) return;
    add.mutate({ ...form, role_ar: roleInfo?.ar || form.role }, {
      onSuccess: () => { setShowForm(false); setForm({ is_registered: true }); },
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">فريق السلامة والصحة المهنية</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'إضافة عضو'}
        </Button>
      </div>

      {/* Org Chart */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ROLES.map(role => {
          const count = members.filter((m: any) => m.role === role.id).length;
          return (
            <Card key={role.id} className="text-center p-3">
              <div className={`w-10 h-10 rounded-full ${role.color} mx-auto mb-2 flex items-center justify-center`}>
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-bold">{role.ar}</p>
              <p className="text-lg font-bold text-primary">{count}</p>
              <p className="text-[9px] text-muted-foreground line-clamp-2">{role.desc}</p>
            </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Switch checked={form.is_registered} onCheckedChange={v => u('is_registered', v)} />
                  <Label>{form.is_registered ? 'مسجل في المنصة' : 'غير مسجل (خارجي)'}</Label>
                </div>

                {!form.is_registered && (
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>الاسم *</Label><Input value={form.external_name || ''} onChange={e => u('external_name', e.target.value)} /></div>
                    <div><Label>الهاتف</Label><Input value={form.external_phone || ''} onChange={e => u('external_phone', e.target.value)} /></div>
                    <div><Label>رقم الهوية</Label><Input value={form.external_id_number || ''} onChange={e => u('external_id_number', e.target.value)} /></div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label>الدور الوظيفي *</Label>
                    <Select value={form.role || ''} onValueChange={v => u('role', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                      <SelectContent>{ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>التخصص</Label>
                    <Select value={form.specialization || ''} onValueChange={v => u('specialization', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{SPECIALIZATIONS.map(s => <SelectItem key={s.id} value={s.id}>{s.ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>رقم الشهادة</Label><Input value={form.certification_number || ''} onChange={e => u('certification_number', e.target.value)} /></div>
                </div>

                <div><Label>تاريخ انتهاء الشهادة</Label><Input type="date" value={form.certification_expiry || ''} onChange={e => u('certification_expiry', e.target.value)} className="w-48" /></div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={add.isPending} className="gap-1.5">
                    {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    إضافة العضو
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((m: any) => {
          const roleInfo = ROLES.find(r => r.id === m.role);
          const isExpired = m.certification_expiry && new Date(m.certification_expiry) < new Date();
          return (
            <Card key={m.id} className={`hover:shadow-sm transition-shadow ${isExpired ? 'border-red-200 dark:border-red-800' : ''}`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${roleInfo?.color || 'bg-muted'} flex items-center justify-center shrink-0`}>
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{m.external_name || 'مسجل'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {roleInfo?.ar || m.role} {m.specialization ? `• ${SPECIALIZATIONS.find(s => s.id === m.specialization)?.ar || m.specialization}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!m.is_registered && <Badge variant="outline" className="text-[9px]">خارجي</Badge>}
                  <Badge variant={m.is_active ? 'default' : 'secondary'} className="text-[9px]">
                    {m.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">لم يتم تعيين فريق سلامة بعد — ابدأ ببناء الهيكل الوظيفي</div>
        )}
      </div>
    </div>
  );
});

SafetyTeamPanel.displayName = 'SafetyTeamPanel';
export default SafetyTeamPanel;
