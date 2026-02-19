import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Briefcase, MapPin, ArrowLeft, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeaturedJob {
  id: string;
  title: string;
  city: string | null;
  governorate: string | null;
  sector: string;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string;
  organization: { name: string } | null;
}

interface PlatformStats {
  totalJobs: number;
  totalWorkers: number;
}

const sectorLabels: Record<string, string> = {
  waste_management: 'إدارة المخلفات',
  recycling: 'إعادة التدوير',
  transportation: 'النقل',
  manufacturing: 'التصنيع',
  construction: 'البناء',
  technology: 'التكنولوجيا',
  healthcare: 'الرعاية الصحية',
  education: 'التعليم',
  other: 'أخرى',
};

const typeLabels: Record<string, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  contract: 'عقد',
  temporary: 'مؤقت',
  freelance: 'حر',
};

const OmalunaSection = () => {
  const [jobs, setJobs] = useState<FeaturedJob[]>([]);
  const [stats, setStats] = useState<PlatformStats>({ totalJobs: 0, totalWorkers: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [jobsRes, jobCountRes, workerCountRes] = await Promise.all([
          supabase
            .from('job_listings')
            .select('id, title, city, governorate, sector, job_type, salary_min, salary_max, created_at, organization:organizations(name)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(4),
          supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('worker_profiles').select('id', { count: 'exact', head: true }),
        ]);

        if (jobsRes.data) setJobs(jobsRes.data as any);
        setStats({
          totalJobs: jobCountRes.count || 0,
          totalWorkers: workerCountRes.count || 0,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            عُمالنا
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            منصة التوظيف المتكاملة
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            اعثر على الوظيفة المناسبة أو الكفاءة المطلوبة — عرض وطلب في مكان واحد
          </p>
        </div>

        <div className="flex justify-center gap-8 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalJobs}</div>
            <div className="text-sm text-muted-foreground">وظيفة متاحة</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalWorkers}</div>
            <div className="text-sm text-muted-foreground">عامل مسجل</div>
          </div>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {jobs.map((job, i) => (
              <div
                key={job.id}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={() => navigate(`/dashboard/omaluna/jobs/${job.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{(job.organization as any)?.name || 'جهة غير محددة'}</p>
                  </div>
                  <Briefcase className="h-5 w-5 text-primary/50 shrink-0 mt-0.5" />
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {job.sector && (
                    <Badge variant="outline" className="text-[11px] bg-primary/5">
                      {sectorLabels[job.sector] || job.sector}
                    </Badge>
                  )}
                  {job.job_type && (
                    <Badge variant="secondary" className="text-[11px]">
                      {typeLabels[job.job_type] || job.job_type}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {(job.city || job.governorate) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[job.city, job.governorate].filter(Boolean).join('، ')}
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <TrendingUp className="h-3 w-3" />
                      {job.salary_min && job.salary_max
                        ? `${job.salary_min} - ${job.salary_max} ج.م`
                        : job.salary_min
                        ? `من ${job.salary_min} ج.م`
                        : `حتى ${job.salary_max} ج.م`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground mb-8">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>لا توجد وظائف متاحة حالياً — كن أول من ينشر!</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button onClick={() => navigate('/dashboard/omaluna')} className="gap-2">
            <Users className="h-4 w-4" />
            تصفح جميع الوظائف
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/omaluna/post-job')} className="gap-2">
            أنشر وظيفة
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OmalunaSection;
