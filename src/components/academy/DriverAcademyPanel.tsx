import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  GraduationCap, BookOpen, Award, Clock, Shield, Plus,
  AlertTriangle, Flame, Car, Leaf, Scale, Heart, Star,
  CheckCircle2, PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  safety: { label: 'السلامة', icon: Shield, color: 'text-blue-500' },
  hazardous: { label: 'مواد خطرة', icon: AlertTriangle, color: 'text-red-500' },
  driving: { label: 'القيادة', icon: Car, color: 'text-purple-500' },
  environmental: { label: 'البيئة', icon: Leaf, color: 'text-emerald-500' },
  regulations: { label: 'القوانين', icon: Scale, color: 'text-indigo-500' },
  first_aid: { label: 'إسعافات أولية', icon: Heart, color: 'text-red-500' },
  adr: { label: 'ADR', icon: Flame, color: 'text-orange-500' },
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  beginner: { label: 'مبتدئ', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  intermediate: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  advanced: { label: 'متقدم', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  expert: { label: 'خبير', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const CERT_LABELS: Record<string, string> = {
  internal: 'شهادة داخلية',
  ministry_certified: 'معتمدة من الوزارة',
  adr_certified: 'شهادة ADR',
  international: 'شهادة دولية',
};

const DriverAcademyPanel: React.FC = () => {
  const { organization, roles } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = roles.includes('admin');
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '', title_ar: '', description: '', description_ar: '',
    category: 'safety', difficulty_level: 'beginner', duration_minutes: '30',
    total_lessons: '5', passing_score: '70', certificate_type: 'internal',
    is_mandatory: false,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['academy-courses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('academy_courses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['driver-enrollments', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('driver_enrollments')
        .select('*, academy_courses(*)')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization,
  });

  const addCourseMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('academy_courses').insert({
        title: courseForm.title,
        title_ar: courseForm.title_ar,
        description: courseForm.description || null,
        description_ar: courseForm.description_ar || null,
        category: courseForm.category,
        difficulty_level: courseForm.difficulty_level,
        duration_minutes: Number(courseForm.duration_minutes),
        total_lessons: Number(courseForm.total_lessons),
        passing_score: Number(courseForm.passing_score),
        certificate_type: courseForm.certificate_type,
        is_mandatory: courseForm.is_mandatory,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academy-courses'] });
      setShowAddCourse(false);
      toast.success('تم إضافة الدورة');
    },
    onError: () => toast.error('فشل في إضافة الدورة'),
  });

  const completedCount = enrollments.filter((e: any) => e.status === 'completed').length;
  const inProgressCount = enrollments.filter((e: any) => e.status === 'in_progress').length;
  const certificatesCount = enrollments.filter((e: any) => e.certificate_issued).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'دورات متاحة', value: courses.length, icon: BookOpen, color: 'text-blue-500' },
          { label: 'قيد التعلم', value: inProgressCount, icon: PlayCircle, color: 'text-yellow-500' },
          { label: 'مكتملة', value: completedCount, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'شهادات', value: certificatesCount, icon: Award, color: 'text-purple-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-3 text-center">
              <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-1`} />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          أكاديمية السائقين
        </h2>
        {isAdmin && (
          <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />دورة جديدة</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>إضافة دورة تدريبية</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>العنوان (English) *</Label><Input value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} /></div>
                  <div><Label>العنوان (عربي) *</Label><Input value={courseForm.title_ar} onChange={e => setCourseForm(p => ({ ...p, title_ar: e.target.value }))} /></div>
                </div>
                <div><Label>الوصف</Label><Textarea value={courseForm.description_ar} onChange={e => setCourseForm(p => ({ ...p, description_ar: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>التصنيف</Label>
                    <Select value={courseForm.category} onValueChange={v => setCourseForm(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المستوى</Label>
                    <Select value={courseForm.difficulty_level} onValueChange={v => setCourseForm(p => ({ ...p, difficulty_level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>المدة (دقيقة)</Label><Input type="number" value={courseForm.duration_minutes} onChange={e => setCourseForm(p => ({ ...p, duration_minutes: e.target.value }))} /></div>
                  <div><Label>عدد الدروس</Label><Input type="number" value={courseForm.total_lessons} onChange={e => setCourseForm(p => ({ ...p, total_lessons: e.target.value }))} /></div>
                  <div><Label>درجة النجاح</Label><Input type="number" value={courseForm.passing_score} onChange={e => setCourseForm(p => ({ ...p, passing_score: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>نوع الشهادة</Label>
                  <Select value={courseForm.certificate_type} onValueChange={v => setCourseForm(p => ({ ...p, certificate_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CERT_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => addCourseMutation.mutate()} disabled={!courseForm.title || !courseForm.title_ar || addCourseMutation.isPending} className="w-full">
                  {addCourseMutation.isPending ? 'جاري الإضافة...' : 'إضافة الدورة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((course: any) => {
          const cat = CATEGORY_CONFIG[course.category] || CATEGORY_CONFIG.safety;
          const diff = DIFFICULTY_LABELS[course.difficulty_level] || DIFFICULTY_LABELS.beginner;
          const CatIcon = cat.icon;
          const enrollment = enrollments.find((e: any) => e.course_id === course.id);
          return (
            <motion.div key={course.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted`}>
                        <CatIcon className={`w-4 h-4 ${cat.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{course.title_ar}</p>
                        <p className="text-[10px] text-muted-foreground">{course.title}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={diff.color + ' text-[10px]'}>{diff.label}</Badge>
                      {course.is_mandatory && <Badge variant="destructive" className="text-[10px]">إلزامي</Badge>}
                    </div>
                  </div>

                  {course.description_ar && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{course.description_ar}</p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_minutes} دقيقة</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.total_lessons} دروس</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />نجاح: {course.passing_score}%</span>
                  </div>

                  {course.certificate_type && (
                    <Badge variant="outline" className="text-[10px] gap-1 mb-2">
                      <Award className="w-3 h-3" />
                      {CERT_LABELS[course.certificate_type] || course.certificate_type}
                    </Badge>
                  )}

                  {enrollment && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span>التقدم</span>
                        <span>{enrollment.progress_pct}%</span>
                      </div>
                      <Progress value={enrollment.progress_pct} className="h-1.5" />
                      {enrollment.certificate_issued && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] gap-1 mt-1">
                          <Award className="w-3 h-3" />شهادة صادرة: {enrollment.certificate_number}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {courses.length === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد دورات تدريبية</p>
          {isAdmin && <p className="text-xs mt-1">أضف دورة جديدة من الزر أعلاه</p>}
        </CardContent></Card>
      )}
    </div>
  );
};

export default DriverAcademyPanel;
