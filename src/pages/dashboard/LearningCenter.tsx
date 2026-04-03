import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, Award, TrendingUp, ChevronLeft, Filter } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardSectionHeader from '@/components/dashboard/shared/DashboardSectionHeader';
import ResponsivePageContainer from '@/components/dashboard/ResponsivePageContainer';
import LMSCourseCatalog from '@/components/lms/LMSCourseCatalog';
import LMSCourseViewer from '@/components/lms/LMSCourseViewer';
import LMSMyProgress from '@/components/lms/LMSMyProgress';
import LMSMyCertificates from '@/components/lms/LMSMyCertificates';
import { useLMSMyEnrollments, useLMSMyCertificates } from '@/hooks/useLMS';

const LearningCenter = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { data: enrollments } = useLMSMyEnrollments();
  const { data: certificates } = useLMSMyCertificates();

  const inProgressCount = enrollments?.filter(e => e.status === 'in_progress' || e.status === 'enrolled').length || 0;
  const completedCount = enrollments?.filter(e => e.status === 'completed').length || 0;

  if (selectedCourseId) {
    return (
      <DashboardLayout>
        <ResponsivePageContainer>
          <Button variant="ghost" onClick={() => setSelectedCourseId(null)} className="mb-4 gap-2">
            <ChevronLeft className="w-4 h-4" />
            العودة للمركز التعليمي
          </Button>
          <LMSCourseViewer courseId={selectedCourseId} />
        </ResponsivePageContainer>
      </DashboardLayout>
    );
  }

  return (
    <ResponsivePageContainer
      title="المركز التعليمي"
      subtitle="تطوير المهارات والامتثال للمتطلبات التنظيمية"
    >
      <BackButton />
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'دورات قيد التنفيذ', value: inProgressCount, icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
          { label: 'دورات مكتملة', value: completedCount, icon: TrendingUp, color: 'text-green-500 bg-green-500/10' },
          { label: 'شهادات محصّلة', value: certificates?.length || 0, icon: Award, color: 'text-amber-500 bg-amber-500/10' },
          { label: 'ساعات تعلم', value: Math.round((enrollments || []).reduce((sum, e) => sum + ((e as any).lms_courses?.estimated_duration_minutes || 0), 0) / 60), icon: GraduationCap, color: 'text-purple-500 bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="catalog" dir="rtl">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="catalog" className="gap-2">
            <BookOpen className="w-4 h-4" />
            كتالوج الدورات
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            تقدمي
            {inProgressCount > 0 && <Badge variant="secondary" className="mr-1">{inProgressCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="w-4 h-4" />
            شهاداتي
            {(certificates?.length || 0) > 0 && <Badge variant="secondary" className="mr-1">{certificates?.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <LMSCourseCatalog onSelectCourse={setSelectedCourseId} />
        </TabsContent>
        <TabsContent value="progress">
          <LMSMyProgress onSelectCourse={setSelectedCourseId} />
        </TabsContent>
        <TabsContent value="certificates">
          <LMSMyCertificates />
        </TabsContent>
      </Tabs>
    </ResponsivePageContainer>
      </DashboardLayout>
  );
};

export default LearningCenter;
