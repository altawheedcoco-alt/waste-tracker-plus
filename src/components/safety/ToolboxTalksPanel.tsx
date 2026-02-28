import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToolboxTalks } from '@/hooks/useSafetySystem';
import { Plus, MessageSquare, Loader2, X, Users, Calendar, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const TOPICS = [
  { id: 'fire_safety', label: 'السلامة من الحريق' },
  { id: 'chemical_handling', label: 'التعامل مع المواد الكيميائية' },
  { id: 'ppe_usage', label: 'استخدام معدات الوقاية' },
  { id: 'lifting', label: 'الرفع الآمن' },
  { id: 'housekeeping', label: 'النظافة والترتيب' },
  { id: 'driving', label: 'القيادة الآمنة' },
  { id: 'emergency', label: 'إجراءات الطوارئ' },
  { id: 'heat_stress', label: 'الإجهاد الحراري' },
  { id: 'confined_space', label: 'الأماكن المحصورة' },
  { id: 'electrical', label: 'السلامة الكهربائية' },
];

const ToolboxTalksPanel = memo(() => {
  const { talks, isLoading, add } = useToolboxTalks();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [attendees, setAttendees] = useState<any[]>([]);
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addAttendee = () => setAttendees(a => [...a, { name: '', phone: '', is_registered: false, role: '', signed: false }]);
  const removeAttendee = (i: number) => setAttendees(a => a.filter((_, idx) => idx !== i));
  const updateAttendee = (i: number, key: string, val: any) => setAttendees(a => a.map((at, idx) => idx === i ? { ...at, [key]: val } : at));

  const handleSubmit = () => {
    if (!form.topic) return;
    add.mutate({
      ...form,
      attendees: JSON.stringify(attendees),
      attendee_count: attendees.length,
      status: 'completed',
    }, {
      onSuccess: () => { setShowForm(false); setForm({}); setAttendees([]); },
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">صندوق أدوات السلامة (Toolbox Talks)</h3>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'إلغاء' : 'اجتماع جديد'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <Card className="border-primary/20">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>الموضوع *</Label>
                    <Input value={form.topic || ''} onChange={e => u('topic', e.target.value)} placeholder="عنوان الاجتماع" />
                  </div>
                  <div>
                    <Label>التصنيف</Label>
                    <Select value={form.topic_category || ''} onValueChange={v => u('topic_category', v)}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{TOPICS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><Label>المدة (دقيقة)</Label><Input type="number" value={form.duration_minutes || '10'} onChange={e => u('duration_minutes', parseInt(e.target.value))} /></div>
                  <div><Label>الموقع</Label><Input value={form.location || ''} onChange={e => u('location', e.target.value)} /></div>
                  <div><Label>التاريخ</Label><Input type="date" value={form.talk_date || new Date().toISOString().slice(0, 10)} onChange={e => u('talk_date', e.target.value)} /></div>
                </div>

                <Textarea placeholder="النقاط الرئيسية للاجتماع..." value={form.description || ''} onChange={e => u('description', e.target.value)} />

                {/* Attendees */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold">الحضور ({attendees.length})</Label>
                    <Button variant="outline" size="sm" onClick={addAttendee} className="gap-1"><Plus className="w-3 h-3" />إضافة</Button>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {attendees.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Input placeholder="الاسم" value={att.name} onChange={e => updateAttendee(i, 'name', e.target.value)} className="flex-1" />
                        <Input placeholder="الهاتف" value={att.phone} onChange={e => updateAttendee(i, 'phone', e.target.value)} className="w-32" />
                        <Input placeholder="الوظيفة" value={att.role} onChange={e => updateAttendee(i, 'role', e.target.value)} className="w-28" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeAttendee(i)}><Trash2 className="w-3 h-3 text-red-500" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button onClick={handleSubmit} disabled={add.isPending} className="gap-1.5">
                    {add.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    حفظ الاجتماع
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Talks List */}
      <div className="space-y-2">
        {talks.map((talk: any) => {
          const att = typeof talk.attendees === 'string' ? JSON.parse(talk.attendees) : (talk.attendees || []);
          return (
            <Card key={talk.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{talk.topic}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{new Date(talk.talk_date || talk.created_at).toLocaleDateString('ar-EG')}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{talk.attendee_count || att.length} حاضر</span>
                    <span>{talk.duration_minutes || 10} دقيقة</span>
                  </div>
                </div>
                <Badge variant={talk.status === 'completed' ? 'default' : 'secondary'} className="text-[9px]">
                  {talk.status === 'completed' ? 'مكتمل' : talk.status === 'scheduled' ? 'مجدول' : talk.status}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
        {!isLoading && talks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">لم يتم تسجيل اجتماعات صندوق الأدوات بعد</div>
        )}
      </div>
    </div>
  );
});

ToolboxTalksPanel.displayName = 'ToolboxTalksPanel';
export default ToolboxTalksPanel;
