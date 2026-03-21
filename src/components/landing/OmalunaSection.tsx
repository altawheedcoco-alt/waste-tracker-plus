import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Briefcase, MapPin, ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { withTimeout, logNetworkError } from '@/lib/networkGuard';

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

const sectorLabels: Record<string, { ar: string; en: string }> = {
  waste_management: { ar: 'إدارة المخلفات', en: 'Waste Management' },
  recycling: { ar: 'إعادة التدوير', en: 'Recycling' },
  transportation: { ar: 'النقل', en: 'Transportation' },
  manufacturing: { ar: 'التصنيع', en: 'Manufacturing' },
  construction: { ar: 'البناء', en: 'Construction' },
  technology: { ar: 'التكنولوجيا', en: 'Technology' },
  healthcare: { ar: 'الرعاية الصحية', en: 'Healthcare' },
  education: { ar: 'التعليم', en: 'Education' },
  other: { ar: 'أخرى', en: 'Other' },
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  full_time: { ar: 'دوام كامل', en: 'Full-time' },
  part_time: { ar: 'دوام جزئي', en: 'Part-time' },
  contract: { ar: 'عقد', en: 'Contract' },
  temporary: { ar: 'مؤقت', en: 'Temporary' },
  freelance: { ar: 'حر', en: 'Freelance' },
};

const OmalunaSection = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['omaluna-featured-jobs'],
    queryFn: async () => {
      try {
        const { data, error } = await withTimeout('omaluna-featured-jobs', async () => {
          return await supabase
            .from('job_listings')
            .select('id, title, city, governorate, sector, job_type, salary_min, salary_max, created_at, organization:organizations(name)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(4);
        });
        if (error) throw error;
        return (data || []) as unknown as FeaturedJob[];
      } catch (error) {
        logNetworkError('omaluna-featured-jobs', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  const { data: stats } = useQuery({
    queryKey: ['omaluna-stats'],
    queryFn: async () => {
      try {
        const [jobCountRes, workerCountRes] = await withTimeout(
          'omaluna-stats',
          () =>
            Promise.all([
              supabase.from('job_listings').select('id', { count: 'exact' }).eq('status', 'active').limit(0),
              supabase.from('worker_profiles').select('id', { count: 'exact' }).limit(0),
            ])
        );
        return {
          totalJobs: jobCountRes.count || 0,
          totalWorkers: workerCountRes.count || 0,
        };
      } catch (error) {
        logNetworkError('omaluna-stats', error);
        return { totalJobs: 0, totalWorkers: 0 };
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) return null;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            {isAr ? 'عُمالنا' : 'Omaluna'}
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {isAr ? 'منصة التوظيف المتكاملة' : 'Integrated Recruitment Platform'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {isAr
              ? 'اعثر على الوظيفة المناسبة أو الكفاءة المطلوبة — عرض وطلب في مكان واحد'
              : 'Find the right job or the right talent — supply and demand in one place'}
          </p>
        </div>

        <div className="flex justify-center gap-8 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats?.totalJobs ?? 0}</div>
            <div className="text-sm text-muted-foreground">{isAr ? 'وظيفة متاحة' : 'Available jobs'}</div>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats?.totalWorkers ?? 0}</div>
            <div className="text-sm text-muted-foreground">{isAr ? 'عامل مسجل' : 'Registered workers'}</div>
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
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(job.organization as any)?.name || (isAr ? 'جهة غير محددة' : 'Unspecified entity')}
                    </p>
                  </div>
                  <Briefcase className="h-5 w-5 text-primary/50 shrink-0 mt-0.5" />
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {job.sector && (
                    <Badge variant="outline" className="text-[11px] bg-primary/5">
                      {sectorLabels[job.sector]?.[language] || job.sector}
                    </Badge>
                  )}
                  {job.job_type && (
                    <Badge variant="secondary" className="text-[11px]">
                      {typeLabels[job.job_type]?.[language] || job.job_type}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {(job.city || job.governorate) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[job.city, job.governorate].filter(Boolean).join(isAr ? '، ' : ', ')}
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <TrendingUp className="h-3 w-3" />
                      {job.salary_min && job.salary_max
                        ? isAr ? `${job.salary_min} - ${job.salary_max} ج.م` : `${job.salary_min} - ${job.salary_max} EGP`
                        : job.salary_min
                        ? isAr ? `من ${job.salary_min} ج.م` : `From ${job.salary_min} EGP`
                        : isAr ? `حتى ${job.salary_max} ج.م` : `Up to ${job.salary_max} EGP`}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground mb-8">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>{isAr ? 'لا توجد وظائف متاحة حالياً — كن أول من ينشر!' : 'No jobs available yet — be the first to post!'}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button onClick={() => navigate('/dashboard/omaluna')} className="gap-2">
            <Users className="h-4 w-4" />
            {isAr ? 'تصفح جميع الوظائف' : 'Browse all jobs'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/omaluna/post-job')} className="gap-2">
            {isAr ? 'أنشر وظيفة' : 'Post a job'}
            {isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OmalunaSection;
