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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Clock, Calendar, Users, Sun, Moon, Repeat, ArrowLeftRight } from "lucide-react";

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function HRShifts() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showNewPattern, setShowNewPattern] = useState(false);
  const [newPattern, setNewPattern] = useState({
    name: '', name_ar: '', start: '08:00', end: '16:00', break: 60, type: 'fixed', overnight: false, color: '#3B82F6', days: [0,1,2,3,4]
  });

  const { data: patterns = [] } = useQuery({
    queryKey: ['hr-shift-patterns', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_shift_patterns').select('*').eq('organization_id', orgId!).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['hr-shift-assignments', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_shift_assignments').select('*').eq('organization_id', orgId!).order('assignment_date', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createPatternMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_shift_patterns').insert({
        organization_id: orgId!,
        pattern_name: newPattern.name,
        pattern_name_ar: newPattern.name_ar,
        start_time: newPattern.start,
        end_time: newPattern.end,
        break_duration_minutes: newPattern.break,
        shift_type: newPattern.type,
        is_overnight: newPattern.overnight,
        color: newPattern.color,
        working_days: newPattern.days,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-shift-patterns'] });
      setShowNewPattern(false);
      toast.success('تم إنشاء نمط الوردية');
    },
  });

  const toggleDay = (day: number) => {
    setNewPattern(p => ({
      ...p,
      days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day].sort()
    }));
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الورديات</h1>
          <p className="text-muted-foreground">جدولة ورديات العمل وتوزيع الموظفين</p>
        </div>
        <Dialog open={showNewPattern} onOpenChange={setShowNewPattern}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />نمط وردية جديد</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>إنشاء نمط وردية</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الاسم (عربي)</Label><Input value={newPattern.name_ar} onChange={e => setNewPattern(p => ({ ...p, name_ar: e.target.value }))} placeholder="الوردية الصباحية" /></div>
                <div><Label>الاسم (إنجليزي)</Label><Input value={newPattern.name} onChange={e => setNewPattern(p => ({ ...p, name: e.target.value }))} placeholder="Morning Shift" /></div>
              </div>
              <div><Label>النوع</Label>
                <Select value={newPattern.type} onValueChange={v => setNewPattern(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">ثابت</SelectItem>
                    <SelectItem value="rotating">دوري (متناوب)</SelectItem>
                    <SelectItem value="flexible">مرن</SelectItem>
                    <SelectItem value="split">مقسم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>وقت البداية</Label><Input type="time" value={newPattern.start} onChange={e => setNewPattern(p => ({ ...p, start: e.target.value }))} /></div>
                <div><Label>وقت النهاية</Label><Input type="time" value={newPattern.end} onChange={e => setNewPattern(p => ({ ...p, end: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>مدة الاستراحة (دقيقة)</Label><Input type="number" value={newPattern.break} onChange={e => setNewPattern(p => ({ ...p, break: Number(e.target.value) }))} /></div>
                <div><Label>اللون</Label><Input type="color" value={newPattern.color} onChange={e => setNewPattern(p => ({ ...p, color: e.target.value }))} className="h-10" /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={newPattern.overnight} onCheckedChange={v => setNewPattern(p => ({ ...p, overnight: v }))} /><Label>وردية ليلية (تتخطى منتصف الليل)</Label></div>
              <div>
                <Label>أيام العمل</Label>
                <div className="flex gap-2 mt-2">
                  {DAYS_AR.map((day, i) => (
                    <Button key={i} size="sm" variant={newPattern.days.includes(i) ? 'default' : 'outline'} onClick={() => toggleDay(i)} className="text-xs px-2">{day}</Button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => createPatternMutation.mutate()} disabled={!newPattern.name_ar}>إنشاء</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">أنماط الورديات</p><p className="text-xl font-bold">{patterns.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Calendar className="w-8 h-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">التعيينات النشطة</p><p className="text-xl font-bold">{assignments.filter(a => a.status === 'scheduled').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ArrowLeftRight className="w-8 h-8 text-orange-500" /><div><p className="text-sm text-muted-foreground">طلبات التبديل</p><p className="text-xl font-bold">{assignments.filter(a => a.swap_status === 'pending').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Moon className="w-8 h-8 text-indigo-500" /><div><p className="text-sm text-muted-foreground">ورديات ليلية</p><p className="text-xl font-bold">{patterns.filter(p => p.is_overnight).length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">أنماط الورديات</TabsTrigger>
          <TabsTrigger value="schedule">الجدول الزمني</TabsTrigger>
          <TabsTrigger value="swaps">طلبات التبديل</TabsTrigger>
          <TabsTrigger value="overtime">الأوفرتايم</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patterns.length === 0 ? (
              <Card className="col-span-3"><CardContent className="pt-6 text-center py-12 text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>لا توجد أنماط ورديات</p></CardContent></Card>
            ) : patterns.map(p => (
              <Card key={p.id} className="border-r-4" style={{ borderRightColor: p.color || '#3B82F6' }}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{p.pattern_name_ar}</h4>
                      <p className="text-sm text-muted-foreground">{p.pattern_name}</p>
                    </div>
                    <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'نشط' : 'معطل'}</Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">{p.is_overnight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}<span>{p.start_time} - {p.end_time}</span></div>
                    <div className="flex items-center gap-2"><Repeat className="w-4 h-4" /><span>{p.shift_type === 'fixed' ? 'ثابت' : p.shift_type === 'rotating' ? 'دوري' : p.shift_type === 'flexible' ? 'مرن' : 'مقسم'}</span></div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {(p.working_days as number[] || []).map(d => <Badge key={d} variant="outline" className="text-xs">{DAYS_AR[d]}</Badge>)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <Card><CardContent className="pt-6">
            {assignments.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد تعيينات</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead><TableHead>الحضور الفعلي</TableHead><TableHead>الانصراف الفعلي</TableHead></TableRow></TableHeader>
                <TableBody>
                  {assignments.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.employee_name}</TableCell>
                      <TableCell>{a.assignment_date}</TableCell>
                      <TableCell><Badge variant={a.status === 'completed' ? 'default' : a.status === 'absent' ? 'destructive' : 'secondary'}>{a.status === 'completed' ? 'حضر' : a.status === 'absent' ? 'غائب' : a.status === 'scheduled' ? 'مجدول' : a.status}</Badge></TableCell>
                      <TableCell>{a.actual_start ? new Date(a.actual_start).toLocaleTimeString('ar-EG') : '-'}</TableCell>
                      <TableCell>{a.actual_end ? new Date(a.actual_end).toLocaleTimeString('ar-EG') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="swaps">
          <Card><CardContent className="pt-6 text-center py-12 text-muted-foreground">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد طلبات تبديل حالياً</p>
            <p className="text-sm mt-2">يمكن للموظفين طلب تبديل ورديتهم مع زملائهم</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="overtime">
          <Card><CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'ساعات إضافية عادية', rate: '1.35x', desc: 'أيام العمل العادية', icon: '⏱️' },
                { title: 'ساعات إضافية ليلية', rate: '1.70x', desc: 'بعد الساعة 7 مساءً', icon: '🌙' },
                { title: 'أيام الراحة والعطلات', rate: '2.00x', desc: 'الجمعة والأعياد الرسمية', icon: '📅' },
              ].map((item, i) => (
                <Card key={i} className="border">
                  <CardContent className="pt-4">
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className="font-semibold mt-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <Badge className="mt-2" variant="outline">{item.rate}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
