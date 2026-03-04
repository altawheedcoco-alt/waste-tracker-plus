import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Briefcase, Users, Building2, Plus, Star, MapPin, Clock, Filter, TrendingUp, Award, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const JOB_SECTORS = [
  'جمع النفايات', 'فرز المخلفات', 'إعادة التدوير', 'النقل والتوصيل',
  'الصيانة والتشغيل', 'المحاسبة والمالية', 'التسويق والمبيعات', 'تكنولوجيا المعلومات',
  'الموارد البشرية', 'الإدارة والتخطيط', 'البيئة والسلامة', 'أخرى'
];

const Omaluna = () => {
  const navigate = useNavigate();
  const { user, organization, roles } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('jobs');
  const isAdmin = roles.includes('admin');

  // Fetch active jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['omaluna-jobs', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select('*, organizations(name, logo_url, organization_type)')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,sector.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch available workers
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ['omaluna-workers', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('worker_profiles')
        .select('*')
        .eq('is_available', true)
        .order('avg_rating', { ascending: false })
        .limit(20);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,job_title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch agencies
  const { data: agencies = [] } = useQuery({
    queryKey: ['omaluna-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recruitment_agencies')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['omaluna-stats'],
    queryFn: async () => {
      const [jobsRes, workersRes, agenciesRes] = await Promise.all([
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('worker_profiles').select('id', { count: 'exact', head: true }).eq('is_available', true),
        supabase.from('recruitment_agencies').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      return {
        activeJobs: jobsRes.count || 0,
        availableWorkers: workersRes.count || 0,
        agencies: agenciesRes.count || 0,
      };
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 p-6 md:p-8 text-primary-foreground"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              <Briefcase className="h-8 w-8" />
              عُمالنا
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base mb-4">
              منصة التوظيف المتكاملة - اعثر على الكفاءات المناسبة أو الفرصة المثالية
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">{stats?.activeJobs || 0}</div>
                <div className="text-xs text-primary-foreground/70">وظيفة نشطة</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">{stats?.availableWorkers || 0}</div>
                <div className="text-xs text-primary-foreground/70">عامل متاح</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold">{stats?.agencies || 0}</div>
                <div className="text-xs text-primary-foreground/70">مكتب توظيف</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن وظائف، عمال، مهارات، مدن..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-12 text-base rounded-xl"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {organization && (
            <Button onClick={() => navigate('/dashboard/omaluna/post-job')} className="gap-2">
              <Plus className="h-4 w-4" />
              نشر وظيفة
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/dashboard/omaluna/my-profile')} className="gap-2">
            <Users className="h-4 w-4" />
            ملفي الشخصي
          </Button>
          {organization && (
            <Button variant="outline" onClick={() => navigate('/dashboard/omaluna/my-jobs')} className="gap-2">
              <Briefcase className="h-4 w-4" />
              وظائفي
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/dashboard/omaluna/my-applications')} className="gap-2">
            <Eye className="h-4 w-4" />
            طلباتي
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              الوظائف
            </TabsTrigger>
            <TabsTrigger value="workers" className="gap-2">
              <Users className="h-4 w-4" />
              العمال
            </TabsTrigger>
            <TabsTrigger value="agencies" className="gap-2">
              <Building2 className="h-4 w-4" />
              الوسطاء
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-3 mt-4">
            {/* Sector filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {JOB_SECTORS.slice(0, 6).map(sector => (
                <Badge
                  key={sector}
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSearchQuery(sector)}
                >
                  {sector}
                </Badge>
              ))}
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد وظائف متاحة حالياً</p>
                  {organization && (
                    <Button className="mt-4" onClick={() => navigate('/dashboard/omaluna/post-job')}>
                      كن أول من ينشر وظيفة
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {jobs.map((job: any, i: number) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="rounded-2xl cursor-pointer hover:shadow-md transition-shadow border-border/50"
                      onClick={() => navigate(`/dashboard/omaluna/job/${job.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {job.is_urgent && <Badge variant="destructive" className="text-xs">عاجل</Badge>}
                              {job.is_featured && <Badge className="text-xs bg-amber-500">مميز</Badge>}
                              <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {(job as any).organizations?.name || 'جهة غير محددة'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.city || 'غير محدد'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {job.job_type === 'full_time' ? 'دوام كامل' :
                                 job.job_type === 'part_time' ? 'دوام جزئي' :
                                 job.job_type === 'daily' ? 'يومي' :
                                 job.job_type === 'contract' ? 'عقد' : job.job_type}
                              </span>
                              {job.salary_min && (
                                <span className="flex items-center gap-1 text-primary font-medium">
                                  {job.salary_min.toLocaleString()}{job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : '+'} ج.م
                                </span>
                              )}
                            </div>
                            {job.skills_required?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {job.skills_required.slice(0, 3).map((skill: string) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                ))}
                                {job.skills_required.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 3}</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-left text-xs text-muted-foreground shrink-0">
                            <span>{job.applications_count || 0} متقدم</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Workers Tab */}
          <TabsContent value="workers" className="space-y-3 mt-4">
            {workersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : workers.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا يوجد عمال متاحون حالياً</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {workers.map((worker: any, i: number) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className="rounded-2xl cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/dashboard/omaluna/worker/${worker.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            {worker.photo_url ? (
                              <img src={worker.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                            ) : (
                              <Users className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{worker.full_name}</h3>
                              {worker.is_verified && (
                                <Award className="h-4 w-4 text-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{worker.job_title || 'بدون تخصص'}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {worker.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {worker.city}
                                </span>
                              )}
                              {worker.years_of_experience > 0 && (
                                <span>{worker.years_of_experience} سنة خبرة</span>
                              )}
                              {worker.avg_rating > 0 && (
                                <span className="flex items-center gap-1 text-amber-500">
                                  <Star className="h-3 w-3 fill-amber-500" />
                                  {Number(worker.avg_rating).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {worker.skills?.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {worker.skills.slice(0, 4).map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Agencies Tab */}
          <TabsContent value="agencies" className="space-y-3 mt-4">
            {agencies.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد مكاتب توظيف مسجلة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              agencies.map((agency: any, i: number) => (
                <motion.div
                  key={agency.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="rounded-2xl cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{agency.agency_name}</h3>
                          <p className="text-xs text-muted-foreground">{agency.city}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-muted-foreground">{agency.total_placements} توظيف</span>
                            {agency.avg_rating > 0 && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Star className="h-3 w-3 fill-amber-500" />
                                {Number(agency.avg_rating).toFixed(1)}
                              </span>
                            )}
                            {agency.is_verified && (
                              <Badge variant="outline" className="text-xs text-primary border-primary">موثق</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Omaluna;
