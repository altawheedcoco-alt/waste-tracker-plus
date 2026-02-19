import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, Briefcase, Plus, Users, Eye, Clock, Pause, Play, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة', active: 'نشط', paused: 'متوقف', closed: 'مغلق', expired: 'منتهي', filled: 'مكتمل',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground', active: 'bg-primary/10 text-primary',
  paused: 'bg-amber-100 text-amber-700', closed: 'bg-red-100 text-red-700',
};

const OmalunaMyJobs = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['my-job-listings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('job_listings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-job-listings'] });
      toast.success('تم تحديث حالة الوظيفة');
    },
  });

  const activeJobs = jobs.filter((j: any) => j.status === 'active');
  const draftJobs = jobs.filter((j: any) => j.status === 'draft');
  const closedJobs = jobs.filter((j: any) => ['closed', 'paused', 'filled', 'expired'].includes(j.status));

  const renderJob = (job: any) => (
    <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="rounded-2xl hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`text-xs ${STATUS_COLORS[job.status] || ''}`}>
                  {STATUS_LABELS[job.status] || job.status}
                </Badge>
                <h3 className="font-semibold text-sm truncate">{job.title}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.applications_count || 0} طلب</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{job.views_count || 0} مشاهدة</span>
                <span>{job.sector}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/omaluna/job/${job.id}/applications`)}>
                <Users className="h-4 w-4" />
              </Button>
              {job.status === 'active' && (
                <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate({ id: job.id, status: 'paused' })}>
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {job.status === 'paused' && (
                <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate({ id: job.id, status: 'active' })}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {job.status === 'draft' && (
                <Button variant="ghost" size="sm" onClick={() => toggleStatus.mutate({ id: job.id, status: 'active' })}>
                  <Play className="h-4 w-4 text-primary" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/omaluna')}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">وظائفي المنشورة</h1>
          </div>
          <Button onClick={() => navigate('/dashboard/omaluna/post-job')} className="gap-2">
            <Plus className="h-4 w-4" />
            نشر وظيفة
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="active">نشطة ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="drafts">مسودات ({draftJobs.length})</TabsTrigger>
            <TabsTrigger value="closed">مغلقة ({closedJobs.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3 mt-4">
            {activeJobs.length === 0 ? <p className="text-center text-muted-foreground py-8">لا توجد وظائف نشطة</p> : activeJobs.map(renderJob)}
          </TabsContent>
          <TabsContent value="drafts" className="space-y-3 mt-4">
            {draftJobs.length === 0 ? <p className="text-center text-muted-foreground py-8">لا توجد مسودات</p> : draftJobs.map(renderJob)}
          </TabsContent>
          <TabsContent value="closed" className="space-y-3 mt-4">
            {closedJobs.length === 0 ? <p className="text-center text-muted-foreground py-8">لا توجد وظائف مغلقة</p> : closedJobs.map(renderJob)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default OmalunaMyJobs;
