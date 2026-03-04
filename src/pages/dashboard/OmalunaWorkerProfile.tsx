import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, X, Save, FileText, Upload, Star, Briefcase, Award } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const OmalunaWorkerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['worker-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', national_id: '',
    date_of_birth: '', gender: '', city: '', governorate: '',
    address: '', bio: '', job_title: '', years_of_experience: 0,
    education_level: '', skills: [] as string[], certifications: [] as string[],
    languages: [] as string[], preferred_work_type: 'any',
    preferred_salary_min: '', preferred_salary_max: '',
    willing_to_relocate: false, available_immediately: true,
    is_available: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        national_id: profile.national_id || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        city: profile.city || '',
        governorate: profile.governorate || '',
        address: profile.address || '',
        bio: profile.bio || '',
        job_title: profile.job_title || '',
        years_of_experience: profile.years_of_experience || 0,
        education_level: profile.education_level || '',
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        preferred_work_type: profile.preferred_work_type || 'any',
        preferred_salary_min: profile.preferred_salary_min?.toString() || '',
        preferred_salary_max: profile.preferred_salary_max?.toString() || '',
        willing_to_relocate: profile.willing_to_relocate || false,
        available_immediately: profile.available_immediately ?? true,
        is_available: profile.is_available ?? true,
      });
    }
  }, [profile]);

  // Calculate completion
  const calcCompletion = () => {
    const fields = [form.full_name, form.email, form.phone, form.job_title, form.bio, form.city, form.education_level, form.gender];
    const filled = fields.filter(Boolean).length;
    const hasSkills = form.skills.length > 0 ? 1 : 0;
    return Math.round(((filled + hasSkills) / (fields.length + 1)) * 100);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const completion = calcCompletion();
      const payload = {
        user_id: user?.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        national_id: form.national_id || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        city: form.city || null,
        governorate: form.governorate || null,
        address: form.address || null,
        bio: form.bio || null,
        job_title: form.job_title || null,
        years_of_experience: form.years_of_experience,
        education_level: form.education_level || null,
        skills: form.skills,
        certifications: form.certifications,
        languages: form.languages,
        preferred_work_type: form.preferred_work_type,
        preferred_salary_min: form.preferred_salary_min ? Number(form.preferred_salary_min) : null,
        preferred_salary_max: form.preferred_salary_max ? Number(form.preferred_salary_max) : null,
        willing_to_relocate: form.willing_to_relocate,
        available_immediately: form.available_immediately,
        is_available: form.is_available,
        profile_completion: completion,
      };

      if (profile) {
        const { error } = await supabase.from('worker_profiles').update(payload).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('worker_profiles').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('تم حفظ الملف الشخصي');
      queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
    },
    onError: (err: any) => toast.error(err.message || 'حدث خطأ'),
  });

  const addToList = (field: 'skills' | 'certifications' | 'languages', value: string, setter: (v: string) => void) => {
    if (value.trim() && !form[field].includes(value.trim())) {
      setForm(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
      setter('');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <BackButton fallbackPath="/dashboard/omaluna" />
          <h1 className="text-xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            ملفي الشخصي - عُمالنا
          </h1>
        </div>

        {/* Completion Progress */}
        <Card className="rounded-2xl bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">اكتمال الملف</span>
              <span className="text-sm font-bold text-primary">{calcCompletion()}%</span>
            </div>
            <Progress value={calcCompletion()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              كلما زادت اكتمال بياناتك، زادت فرصتك في الحصول على وظائف مناسبة
            </p>
          </CardContent>
        </Card>

        {/* Stats if existing profile */}
        {profile && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-xl">
              <CardContent className="p-3 text-center">
                <Star className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <div className="text-lg font-bold">{Number(profile.avg_rating || 0).toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">التقييم</div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-3 text-center">
                <Briefcase className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">{profile.total_jobs_completed || 0}</div>
                <div className="text-xs text-muted-foreground">مهمة مكتملة</div>
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-3 text-center">
                <Award className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">{profile.total_ratings || 0}</div>
                <div className="text-xs text-muted-foreground">تقييم</div>
              </CardContent>
            </Card>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Personal Info */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">البيانات الشخصية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الاسم الكامل *</Label><Input fieldContext="full_name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                <div><Label>البريد الإلكتروني *</Label><Input fieldContext="email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الهاتف</Label><Input fieldContext="phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>الرقم القومي</Label><Input fieldContext="national_id" value={form.national_id} onChange={e => setForm(p => ({ ...p, national_id: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>تاريخ الميلاد</Label><Input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
                <div>
                  <Label>النوع</Label>
                  <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المحافظة</Label><Input fieldContext="governorate" value={form.governorate} onChange={e => setForm(p => ({ ...p, governorate: e.target.value }))} /></div>
                <div><Label>المدينة</Label><Input fieldContext="city" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} /></div>
              </div>
              <div><Label>العنوان</Label><Input fieldContext="address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
              <div><Label>نبذة عنك</Label><Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="اكتب نبذة مختصرة عنك..." /></div>
            </CardContent>
          </Card>

          {/* Professional Info */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">المعلومات المهنية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المسمى الوظيفي</Label><Input fieldContext="job_title" value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))} placeholder="مثال: فني فرز" /></div>
                <div><Label>سنوات الخبرة</Label><Input type="number" min={0} value={form.years_of_experience} onChange={e => setForm(p => ({ ...p, years_of_experience: Number(e.target.value) }))} /></div>
              </div>
              <div>
                <Label>المؤهل التعليمي</Label>
                <Select value={form.education_level} onValueChange={v => setForm(p => ({ ...p, education_level: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون</SelectItem>
                    <SelectItem value="primary">ابتدائي</SelectItem>
                    <SelectItem value="preparatory">إعدادي</SelectItem>
                    <SelectItem value="secondary">ثانوي / دبلوم</SelectItem>
                    <SelectItem value="bachelor">بكالوريوس</SelectItem>
                    <SelectItem value="master">ماجستير</SelectItem>
                    <SelectItem value="doctorate">دكتوراه</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div>
                <Label>المهارات</Label>
                <div className="flex gap-2">
                  <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="أضف مهارة" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList('skills', skillInput, setSkillInput))} />
                  <Button type="button" variant="outline" onClick={() => addToList('skills', skillInput, setSkillInput)}>إضافة</Button>
                </div>
                {form.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.skills.map(s => (
                      <Badge key={s} variant="secondary" className="gap-1">{s}<X className="h-3 w-3 cursor-pointer" onClick={() => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))} /></Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div>
                <Label>الشهادات والرخص</Label>
                <div className="flex gap-2">
                  <Input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder="أضف شهادة" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList('certifications', certInput, setCertInput))} />
                  <Button type="button" variant="outline" onClick={() => addToList('certifications', certInput, setCertInput)}>إضافة</Button>
                </div>
                {form.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.certifications.map(c => (
                      <Badge key={c} variant="secondary" className="gap-1">{c}<X className="h-3 w-3 cursor-pointer" onClick={() => setForm(p => ({ ...p, certifications: p.certifications.filter(x => x !== c) }))} /></Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">تفضيلات العمل</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>نوع العمل المفضل</Label>
                <Select value={form.preferred_work_type} onValueChange={v => setForm(p => ({ ...p, preferred_work_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">أي نوع</SelectItem>
                    <SelectItem value="full_time">دوام كامل</SelectItem>
                    <SelectItem value="part_time">دوام جزئي</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="daily">يومي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الحد الأدنى للراتب</Label><Input type="number" value={form.preferred_salary_min} onChange={e => setForm(p => ({ ...p, preferred_salary_min: e.target.value }))} placeholder="ج.م" /></div>
                <div><Label>الحد الأقصى للراتب</Label><Input type="number" value={form.preferred_salary_max} onChange={e => setForm(p => ({ ...p, preferred_salary_max: e.target.value }))} placeholder="ج.م" /></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>مستعد للانتقال</Label>
                  <Switch checked={form.willing_to_relocate} onCheckedChange={v => setForm(p => ({ ...p, willing_to_relocate: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>متاح فوراً</Label>
                  <Switch checked={form.available_immediately} onCheckedChange={v => setForm(p => ({ ...p, available_immediately: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>متاح للتوظيف</Label>
                  <Switch checked={form.is_available} onCheckedChange={v => setForm(p => ({ ...p, is_available: v }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.full_name} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ الملف الشخصي'}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OmalunaWorkerProfile;
