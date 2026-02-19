import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Users, Star, MapPin, Clock, CheckCircle2, XCircle, Eye, MessageSquare, Calendar, BookmarkPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة', reviewed: 'تمت المراجعة', shortlisted: 'القائمة القصيرة',
  interview: 'مقابلة', accepted: 'مقبول', rejected: 'مرفوض',
};

const OmalunaJobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: job } = useQuery({
    queryKey: ['job-for-apps', jobId],
    queryFn: async () => {
      const { data } = await supabase.from('job_listings').select('title, applications_count').eq('id', jobId).single();
      return data;
    },
    enabled: !!jobId,
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['job-applications', jobId, filter],
    queryFn: async () => {
      let query = supabase
        .from('job_applications')
        .select('*, worker_profiles(full_name, job_title, city, avg_rating, years_of_experience, skills, photo_url, is_verified)')
        .eq('job_id', jobId!)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!jobId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('تم تحديث حالة الطلب');
    },
  });

  const saveWorker = useMutation({
    mutationFn: async (workerId: string) => {
      if (!organization?.id) return;
      const { error } = await supabase.from('saved_workers').insert({
        organization_id: organization.id,
        worker_id: workerId,
        saved_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error && error.code !== '23505') throw error; // ignore duplicate
    },
    onSuccess: () => toast.success('تم حفظ العامل في المفضلة'),
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/omaluna/my-jobs')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">الطلبات المقدمة</h1>
            <p className="text-sm text-muted-foreground">{job?.title} - {applications.length} طلب</p>
          </div>
        </div>

        {/* Filter */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="تصفية حسب الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="text-center py-12 text-muted-foreground">
              لا توجد طلبات {filter !== 'all' ? `بحالة "${STATUS_LABELS[filter]}"` : ''}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any, i: number) => {
              const worker = app.worker_profiles;
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {worker?.photo_url ? (
                            <img src={worker.photo_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{worker?.full_name || 'عامل'}</h3>
                            {worker?.is_verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{worker?.job_title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {worker?.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{worker.city}</span>}
                            {worker?.years_of_experience > 0 && <span>{worker.years_of_experience} سنة</span>}
                            {worker?.avg_rating > 0 && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Star className="h-3 w-3 fill-amber-500" />{Number(worker.avg_rating).toFixed(1)}
                              </span>
                            )}
                          </div>
                          {worker?.skills?.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {worker.skills.slice(0, 3).map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                            </div>
                          )}
                          {app.match_score && (
                            <Badge variant="outline" className="text-xs mt-1 gap-1">
                              <Star className="h-3 w-3" />تطابق {Number(app.match_score).toFixed(0)}%
                            </Badge>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Select value={app.status} onValueChange={v => updateStatus.mutate({ appId: app.id, status: v })}>
                            <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => saveWorker.mutate(app.worker_id)}>
                            <BookmarkPlus className="h-3 w-3" />حفظ
                          </Button>
                        </div>
                      </div>
                      {app.cover_letter && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-xl text-xs">
                          <p className="font-medium mb-1">خطاب التقديم:</p>
                          <p className="text-muted-foreground">{app.cover_letter}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OmalunaJobApplications;
