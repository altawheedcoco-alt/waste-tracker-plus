import { motion } from 'framer-motion';
import { Clock, BookOpen, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useLMSMyEnrollments } from '@/hooks/useLMS';

const statusMap: Record<string, { label: string; color: string }> = {
  enrolled: { label: 'مسجّل', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  failed: { label: 'لم يجتز', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

interface Props { onSelectCourse: (id: string) => void; }

const LMSMyProgress = ({ onSelectCourse }: Props) => {
  const { data: enrollments, isLoading } = useLMSMyEnrollments();

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (!enrollments?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">لم تسجّل في أي دورة بعد</p>
        <p className="text-sm">استعرض كتالوج الدورات وابدأ رحلة التعلم</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {enrollments.map((enrollment, i) => {
        const course = enrollment.lms_courses as any;
        if (!course) return null;
        const status = statusMap[enrollment.status || 'enrolled'];
        return (
          <motion.div
            key={enrollment.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
              onClick={() => onSelectCourse(enrollment.course_id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{course.title_ar}</h3>
                    <Badge className={`text-[10px] ${status.color} border-0`}>{status.label}</Badge>
                  </div>
                  <Progress value={enrollment.progress_percentage || 0} className="h-1.5" />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.estimated_duration_minutes} دقيقة</span>
                    <span>{enrollment.progress_percentage || 0}% مكتمل</span>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LMSMyProgress;
