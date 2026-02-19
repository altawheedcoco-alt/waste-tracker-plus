import { useState } from 'react';
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
import { ArrowRight, Briefcase, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SECTORS = [
  'جمع النفايات', 'فرز المخلفات', 'إعادة التدوير', 'النقل والتوصيل',
  'الصيانة والتشغيل', 'المحاسبة والمالية', 'التسويق والمبيعات', 'تكنولوجيا المعلومات',
  'الموارد البشرية', 'الإدارة والتخطيط', 'البيئة والسلامة', 'خدمة العملاء',
  'الهندسة', 'المستودعات', 'أخرى'
];

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'المنوفية',
  'القليوبية', 'البحيرة', 'الغربية', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'السويس', 'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر',
  'الوادي الجديد', 'مطروح', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط',
  'سوهاج', 'قنا', 'الأقصر', 'أسوان'
];

const OmalunaPostJob = () => {
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    job_type: 'full_time',
    sector: '',
    experience_required: 0,
    education_required: '',
    skills_required: [] as string[],
    city: '',
    governorate: '',
    is_remote: false,
    salary_min: '',
    salary_max: '',
    salary_period: 'monthly',
    benefits: [] as string[],
    vacancies_count: 1,
    is_urgent: false,
    is_featured: false,
  });

  const addSkill = () => {
    if (skillInput.trim() && !form.skills_required.includes(skillInput.trim())) {
      setForm(prev => ({ ...prev, skills_required: [...prev.skills_required, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills_required: prev.skills_required.filter(s => s !== skill) }));
  };

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!form.title || !form.description || !form.sector || !form.job_type) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    if (!organization?.id) {
      toast.error('يجب أن تكون مسجلاً في جهة لنشر وظيفة');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('job_listings').insert({
        organization_id: organization.id,
        posted_by: user?.id,
        title: form.title,
        description: form.description,
        requirements: form.requirements || null,
        responsibilities: form.responsibilities || null,
        job_type: form.job_type,
        sector: form.sector,
        experience_required: form.experience_required,
        education_required: form.education_required || null,
        skills_required: form.skills_required,
        city: form.city || null,
        governorate: form.governorate || null,
        is_remote: form.is_remote,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        salary_period: form.salary_period,
        benefits: form.benefits,
        vacancies_count: form.vacancies_count,
        is_urgent: form.is_urgent,
        is_featured: form.is_featured,
        status,
        published_at: status === 'active' ? new Date().toISOString() : null,
      });

      if (error) throw error;
      toast.success(status === 'active' ? 'تم نشر الوظيفة بنجاح' : 'تم حفظ المسودة');
      navigate('/dashboard/omaluna');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/omaluna')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            نشر وظيفة جديدة
          </h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Basic Info */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>عنوان الوظيفة *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: فني فرز مخلفات" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>نوع الدوام *</Label>
                  <Select value={form.job_type} onValueChange={v => setForm(p => ({ ...p, job_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">دوام كامل</SelectItem>
                      <SelectItem value="part_time">دوام جزئي</SelectItem>
                      <SelectItem value="contract">عقد</SelectItem>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="temporary">مؤقت</SelectItem>
                      <SelectItem value="internship">تدريب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>القطاع *</Label>
                  <Select value={form.sector} onValueChange={v => setForm(p => ({ ...p, sector: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر القطاع" /></SelectTrigger>
                    <SelectContent>
                      {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>الوصف الوظيفي *</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="وصف تفصيلي للوظيفة..." />
              </div>
              <div>
                <Label>المتطلبات</Label>
                <Textarea value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} rows={3} placeholder="المؤهلات والخبرات المطلوبة..." />
              </div>
              <div>
                <Label>المسؤوليات</Label>
                <Textarea value={form.responsibilities} onChange={e => setForm(p => ({ ...p, responsibilities: e.target.value }))} rows={3} placeholder="المهام والمسؤوليات..." />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Experience */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">المهارات والخبرات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>سنوات الخبرة المطلوبة</Label>
                  <Input type="number" min={0} value={form.experience_required} onChange={e => setForm(p => ({ ...p, experience_required: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>المؤهل التعليمي</Label>
                  <Select value={form.education_required} onValueChange={v => setForm(p => ({ ...p, education_required: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">غير مطلوب</SelectItem>
                      <SelectItem value="primary">ابتدائي</SelectItem>
                      <SelectItem value="preparatory">إعدادي</SelectItem>
                      <SelectItem value="secondary">ثانوي / دبلوم</SelectItem>
                      <SelectItem value="bachelor">بكالوريوس</SelectItem>
                      <SelectItem value="master">ماجستير</SelectItem>
                      <SelectItem value="doctorate">دكتوراه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>المهارات المطلوبة</Label>
                <div className="flex gap-2">
                  <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="أضف مهارة" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <Button type="button" variant="outline" onClick={addSkill}>إضافة</Button>
                </div>
                {form.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.skills_required.map(skill => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location & Salary */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">الموقع والراتب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>المحافظة</Label>
                  <Select value={form.governorate} onValueChange={v => setForm(p => ({ ...p, governorate: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                    <SelectContent>
                      {GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المدينة</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="المدينة" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_remote} onCheckedChange={v => setForm(p => ({ ...p, is_remote: v }))} />
                <Label>عمل عن بُعد</Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>الحد الأدنى للراتب</Label>
                  <Input type="number" value={form.salary_min} onChange={e => setForm(p => ({ ...p, salary_min: e.target.value }))} placeholder="ج.م" />
                </div>
                <div>
                  <Label>الحد الأقصى للراتب</Label>
                  <Input type="number" value={form.salary_max} onChange={e => setForm(p => ({ ...p, salary_max: e.target.value }))} placeholder="ج.م" />
                </div>
                <div>
                  <Label>الفترة</Label>
                  <Select value={form.salary_period} onValueChange={v => setForm(p => ({ ...p, salary_period: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">بالساعة</SelectItem>
                      <SelectItem value="daily">يومي</SelectItem>
                      <SelectItem value="weekly">أسبوعي</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="yearly">سنوي</SelectItem>
                      <SelectItem value="negotiable">قابل للتفاوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>عدد الشواغر</Label>
                  <Input type="number" min={1} value={form.vacancies_count} onChange={e => setForm(p => ({ ...p, vacancies_count: Number(e.target.value) }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label>وظيفة عاجلة</Label>
                <Switch checked={form.is_urgent} onCheckedChange={v => setForm(p => ({ ...p, is_urgent: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>وظيفة مميزة (تظهر أولاً)</Label>
                <Switch checked={form.is_featured} onCheckedChange={v => setForm(p => ({ ...p, is_featured: v }))} />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button onClick={() => handleSubmit('active')} disabled={loading} className="flex-1">
              {loading ? 'جاري النشر...' : 'نشر الوظيفة'}
            </Button>
            <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading}>
              حفظ كمسودة
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OmalunaPostJob;
