import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, MapPin, Clock, Briefcase, Building2, Star, Send, Users, Calendar, Banknote, GraduationCap, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'دوام كامل', part_time: 'دوام جزئي', contract: 'عقد',
  daily: 'يومي', temporary: 'مؤقت', internship: 'تدريب',
};

const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: 'بالساعة', daily: 'يومي', weekly: 'أسبوعي',
  monthly: 'شهري', yearly: 'سنوي', negotiable: 'قابل للتفاوض',
};

const OmalunaJobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-details', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('*, organizations(name, logo_url, organization_type, city)')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  // Check if worker has profile
  const { data: workerProfile } = useQuery({
    queryKey: ['worker-profile-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Check existing application
  const { data: existingApp } = useQuery({
    queryKey: ['job-application-check', jobId, workerProfile?.id],
    queryFn: async () => {
      if (!workerProfile?.id || !jobId) return null;
      const { data } = await supabase
        .from('job_applications')
        .select('id, status')
        .eq('job_id', jobId)
        .eq('worker_id', workerProfile.id)
        .maybeSingle();
      return data;
    },
    enabled: !!workerProfile?.id && !!jobId,
  });

  // Check if saved
  const { data: savedJob } = useQuery({
    queryKey: ['saved-job-check', jobId, workerProfile?.id],
    queryFn: async () => {
      if (!workerProfile?.id || !jobId) return null;
      const { data } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('job_id', jobId)
        .eq('worker_id', workerProfile.id)
        .maybeSingle();
      return data;
    },
    enabled: !!workerProfile?.id && !!jobId,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!workerProfile?.id || !jobId) throw new Error('يجب إنشاء ملف شخصي أولاً');
      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        worker_id: workerProfile.id,
        cover_letter: coverLetter || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم تقديم طلبك بنجاح');
      setApplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['job-application-check'] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!workerProfile?.id || !jobId) return;
      if (savedJob) {
        await supabase.from('saved_jobs').delete().eq('id', savedJob.id);
      } else {
        await supabase.from('saved_jobs').insert({ worker_id: workerProfile.id, job_id: jobId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-job-check'] });
      toast.success(savedJob ? 'تم إلغاء الحفظ' : 'تم حفظ الوظيفة');
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">الوظيفة غير موجودة</div>
      </DashboardLayout>
    );
  }

  const org = job.organizations as any;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4" dir="rtl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/omaluna')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">{job.title}</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header Card */}
          <Card className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">{job.title}</h2>
                  <p className="text-sm text-muted-foreground mb-3">{org?.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {job.is_urgent && <Badge variant="destructive">عاجل</Badge>}
                    {job.is_featured && <Badge className="bg-amber-500">مميز</Badge>}
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.city || job.governorate || 'غير محدد'}
                    </Badge>
                    <Badge variant="secondary">{job.sector}</Badge>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
                <div className="text-center">
                  <Banknote className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-sm font-semibold">
                    {job.salary_min ? `${Number(job.salary_min).toLocaleString()}${job.salary_max ? ` - ${Number(job.salary_max).toLocaleString()}` : '+'}` : 'غير محدد'}
                  </div>
                  <div className="text-xs text-muted-foreground">{SALARY_PERIOD_LABELS[job.salary_period] || ''}</div>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-sm font-semibold">{job.vacancies_count}</div>
                  <div className="text-xs text-muted-foreground">شاغر</div>
                </div>
                <div className="text-center">
                  <GraduationCap className="h-5 w-5 text-primary mx-auto mb-1" />
                  <div className="text-sm font-semibold">{job.experience_required || 0}+</div>
                  <div className="text-xs text-muted-foreground">سنة خبرة</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">الوصف الوظيفي</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </CardContent>
          </Card>

          {job.requirements && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">المتطلبات</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap leading-relaxed">{job.requirements}</p></CardContent>
            </Card>
          )}

          {job.responsibilities && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">المسؤوليات</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap leading-relaxed">{job.responsibilities}</p></CardContent>
            </Card>
          )}

          {job.skills_required?.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader><CardTitle className="text-base">المهارات المطلوبة</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill: string) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 sticky bottom-4">
            {existingApp ? (
              <Button disabled className="flex-1 gap-2">
                <Send className="h-4 w-4" />
                تم التقديم ({existingApp.status === 'pending' ? 'قيد المراجعة' : existingApp.status})
              </Button>
            ) : (
              <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1 gap-2" onClick={() => {
                    if (!workerProfile) {
                      toast.error('يجب إنشاء ملف شخصي أولاً');
                      navigate('/dashboard/omaluna/my-profile');
                      return;
                    }
                    setApplyOpen(true);
                  }}>
                    <Send className="h-4 w-4" />
                    تقدم الآن
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>التقديم على: {job.title}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">خطاب التقديم (اختياري)</label>
                      <Textarea
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        rows={5}
                        placeholder="اكتب لماذا أنت مناسب لهذه الوظيفة..."
                      />
                    </div>
                    <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending} className="w-full gap-2">
                      <Send className="h-4 w-4" />
                      {applyMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => toggleSave.mutate()}
              className={savedJob ? 'text-primary' : ''}
            >
              {savedJob ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OmalunaJobDetails;
