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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Star, Target, Users, TrendingUp, BarChart3, Award, Clock } from "lucide-react";
import BackButton from '@/components/ui/back-button';
import { useNavigate } from "react-router-dom";

const SCORE_LABELS: Record<string, string> = {
  excellent: 'ممتاز (90-100)',
  very_good: 'جيد جداً (80-89)',
  good: 'جيد (70-79)',
  acceptable: 'مقبول (60-69)',
  poor: 'ضعيف (أقل من 60)',
};

export default function HRPerformance() {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const queryClient = useQueryClient();
  const [showNewCycle, setShowNewCycle] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [newCycle, setNewCycle] = useState({ name: '', type: 'annual', start: '', end: '' });

  const { data: cycles = [] } = useQuery({
    queryKey: ['hr-perf-cycles', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_performance_cycles').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['hr-perf-reviews', selectedCycle],
    queryFn: async () => {
      const { data, error } = await supabase.from('hr_performance_reviews').select('*').eq('cycle_id', selectedCycle!).order('overall_score', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCycle,
  });

  const createCycleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('hr_performance_cycles').insert({
        organization_id: orgId!,
        cycle_name: newCycle.name,
        cycle_type: newCycle.type,
        start_date: newCycle.start,
        end_date: newCycle.end,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-perf-cycles'] });
      setShowNewCycle(false);
      toast.success('تم إنشاء دورة التقييم');
    },
  });

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-destructive';
  };

  const avgScore = reviews.length > 0 ? reviews.reduce((s, r) => s + Number(r.overall_score || 0), 0) / reviews.length : 0;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">تقييم الأداء</h1>
            <p className="text-muted-foreground">تقييم أداء الموظفين بنظام 360°</p>
          </div>
        </div>
        <Dialog open={showNewCycle} onOpenChange={setShowNewCycle}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" />دورة تقييم جديدة</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء دورة تقييم</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم الدورة</Label><Input value={newCycle.name} onChange={e => setNewCycle(p => ({ ...p, name: e.target.value }))} placeholder="تقييم الأداء السنوي 2026" /></div>
              <div><Label>النوع</Label>
                <Select value={newCycle.type} onValueChange={v => setNewCycle(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">سنوي</SelectItem>
                    <SelectItem value="semi_annual">نصف سنوي</SelectItem>
                    <SelectItem value="quarterly">ربع سنوي</SelectItem>
                    <SelectItem value="monthly">شهري</SelectItem>
                    <SelectItem value="probation">فترة التجربة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>من</Label><Input type="date" value={newCycle.start} onChange={e => setNewCycle(p => ({ ...p, start: e.target.value }))} /></div>
                <div><Label>إلى</Label><Input type="date" value={newCycle.end} onChange={e => setNewCycle(p => ({ ...p, end: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={() => createCycleMutation.mutate()} disabled={!newCycle.name || !newCycle.start || !newCycle.end}>إنشاء</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Target className="w-8 h-8 text-primary" /><div><p className="text-sm text-muted-foreground">دورات التقييم</p><p className="text-xl font-bold">{cycles.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">تقييمات مكتملة</p><p className="text-xl font-bold">{reviews.filter(r => r.status === 'completed').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Star className="w-8 h-8 text-yellow-500" /><div><p className="text-sm text-muted-foreground">متوسط التقييم</p><p className="text-xl font-bold">{avgScore.toFixed(1)}%</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Clock className="w-8 h-8 text-orange-500" /><div><p className="text-sm text-muted-foreground">قيد المراجعة</p><p className="text-xl font-bold">{reviews.filter(r => r.status === 'pending').length}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="cycles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cycles">دورات التقييم</TabsTrigger>
          <TabsTrigger value="reviews">التقييمات</TabsTrigger>
          <TabsTrigger value="criteria">معايير التقييم</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles">
          <Card>
            <CardContent className="pt-6">
              {cycles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><Target className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>لا توجد دورات تقييم</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cycles.map(cycle => (
                    <Card key={cycle.id} className={`border cursor-pointer transition-colors ${selectedCycle === cycle.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`} onClick={() => setSelectedCycle(cycle.id)}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{cycle.cycle_name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{cycle.start_date} → {cycle.end_date}</p>
                          </div>
                          <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>{cycle.status === 'active' ? 'نشطة' : 'مغلقة'}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardContent className="pt-6">
              {!selectedCycle ? <p className="text-center py-8 text-muted-foreground">اختر دورة تقييم</p> : reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><p>لا توجد تقييمات</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الأهداف</TableHead>
                      <TableHead>الكفاءات</TableHead>
                      <TableHead>الحضور</TableHead>
                      <TableHead>العمل الجماعي</TableHead>
                      <TableHead>المبادرة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employee_name}</TableCell>
                        <TableCell>{r.goals_score || '-'}</TableCell>
                        <TableCell>{r.competency_score || '-'}</TableCell>
                        <TableCell>{r.attendance_score || '-'}</TableCell>
                        <TableCell>{r.teamwork_score || '-'}</TableCell>
                        <TableCell>{r.initiative_score || '-'}</TableCell>
                        <TableCell className={`font-bold ${getScoreColor(r.overall_score ? Number(r.overall_score) : null)}`}>{r.overall_score ? `${Number(r.overall_score).toFixed(0)}%` : '-'}</TableCell>
                        <TableCell><Badge variant={r.status === 'completed' ? 'default' : 'secondary'}>{r.status === 'completed' ? 'مكتمل' : r.status === 'pending' ? 'معلق' : r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criteria">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'تحقيق الأهداف', weight: 30, desc: 'مدى تحقيق الأهداف المحددة', icon: '🎯' },
                  { title: 'الكفاءات المهنية', weight: 25, desc: 'المهارات الفنية والمعرفية', icon: '💡' },
                  { title: 'الانضباط والحضور', weight: 15, desc: 'الالتزام بمواعيد العمل', icon: '⏰' },
                  { title: 'العمل الجماعي', weight: 15, desc: 'التعاون مع الزملاء والفريق', icon: '🤝' },
                  { title: 'المبادرة والإبداع', weight: 15, desc: 'تقديم أفكار وحلول جديدة', icon: '🚀' },
                ].map((item, i) => (
                  <Card key={i} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge>{item.weight}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                          <Progress value={item.weight} className="mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><BarChart3 className="w-5 h-5" />توزيع التقييمات</h4>
                  {Object.entries(SCORE_LABELS).map(([key, label]) => {
                    const count = reviews.filter(r => {
                      const s = Number(r.overall_score || 0);
                      if (key === 'excellent') return s >= 90;
                      if (key === 'very_good') return s >= 80 && s < 90;
                      if (key === 'good') return s >= 70 && s < 80;
                      if (key === 'acceptable') return s >= 60 && s < 70;
                      return s < 60;
                    }).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm"><span>{label}</span><span>{count} موظف</span></div>
                        <Progress value={pct} />
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2"><Award className="w-5 h-5" />أفضل الموظفين</h4>
                  {reviews.slice(0, 5).map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-lg font-bold text-primary">#{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-medium">{r.employee_name}</p>
                      </div>
                      <span className={`font-bold ${getScoreColor(r.overall_score ? Number(r.overall_score) : null)}`}>{r.overall_score ? `${Number(r.overall_score).toFixed(0)}%` : '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
