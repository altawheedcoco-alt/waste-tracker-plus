import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, Clock, CheckCircle2, XCircle, Star, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700', icon: Clock },
  reviewed: { label: 'تمت المراجعة', color: 'bg-blue-100 text-blue-700', icon: FileText },
  shortlisted: { label: 'القائمة القصيرة', color: 'bg-primary/10 text-primary', icon: Star },
  interview: { label: 'مقابلة', color: 'bg-purple-100 text-purple-700', icon: Calendar },
  accepted: { label: 'مقبول', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
  withdrawn: { label: 'تم السحب', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

const OmalunaMyApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // First get worker profile
      const { data: wp } = await supabase
        .from('worker_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!wp) return [];

      const { data, error } = await supabase
        .from('job_applications')
        .select('*, job_listings(title, city, sector, job_type, organizations(name))')
        .eq('worker_id', wp.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/omaluna')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">طلباتي</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لم تتقدم لأي وظيفة بعد</p>
              <Button className="mt-4" onClick={() => navigate('/dashboard/omaluna')}>
                تصفح الوظائف
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app: any, i: number) => {
              const status = STATUS_MAP[app.status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              const job = app.job_listings;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="rounded-2xl cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/dashboard/omaluna/job/${app.job_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{job?.title || 'وظيفة محذوفة'}</h3>
                          <p className="text-xs text-muted-foreground">{(job?.organizations as any)?.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`text-xs gap-1 ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                          {app.match_score && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs gap-1">
                                <Star className="h-3 w-3 text-amber-500" />
                                نسبة التطابق: {Number(app.match_score).toFixed(0)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
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

export default OmalunaMyApplications;
