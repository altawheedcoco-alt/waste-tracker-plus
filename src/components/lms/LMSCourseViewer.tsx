import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, Circle, Clock, Award, Play, FileText, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  useLMSCourseDetail, useLMSLessons, useLMSEnrollment, useLMSLessonProgress,
  useEnrollInCourse, useMarkLessonComplete
} from '@/hooks/useLMS';
import LMSQuizView from './LMSQuizView';

interface Props { courseId: string; }

const LMSCourseViewer = ({ courseId }: Props) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  const { data: course, isLoading: courseLoading } = useLMSCourseDetail(courseId);
  const { data: lessons } = useLMSLessons(courseId);
  const { data: enrollment } = useLMSEnrollment(courseId);
  const { data: progress } = useLMSLessonProgress(courseId);
  const enrollMutation = useEnrollInCourse();
  const markCompleteMutation = useMarkLessonComplete();

  if (courseLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!course) return <div className="text-center py-20 text-muted-foreground">الدورة غير موجودة</div>;

  const completedLessons = progress?.filter(p => p.is_completed).length || 0;
  const totalLessons = lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isLessonCompleted = (lessonId: string) => progress?.some(p => p.lesson_id === lessonId && p.is_completed);
  const allLessonsCompleted = totalLessons > 0 && completedLessons === totalLessons;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Course Header */}
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
            <div className="space-y-2 flex-1">
              <h1 className="text-xl md:text-2xl font-bold">{course.title_ar}</h1>
              {course.description_ar && <p className="text-sm text-muted-foreground">{course.description_ar}</p>}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />{course.estimated_duration_minutes} دقيقة</Badge>
                <Badge variant="outline">{course.is_mandatory ? 'إلزامي' : 'اختياري'}</Badge>
                <Badge variant="outline">نسبة النجاح: {course.passing_score}%</Badge>
              </div>
            </div>

            {!enrollment ? (
              <Button onClick={() => enrollMutation.mutate(courseId)} disabled={enrollMutation.isPending} className="gap-2">
                {enrollMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                سجّل في الدورة
              </Button>
            ) : enrollment.status === 'completed' ? (
              <Badge className="bg-green-500 text-white text-sm py-1.5 px-4">✅ مكتملة</Badge>
            ) : (
              <div className="text-left min-w-[140px]">
                <p className="text-xs text-muted-foreground mb-1">التقدم</p>
                <Progress value={progressPercentage} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1">{completedLessons}/{totalLessons} دروس</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'lessons' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('lessons')}
          className="gap-2"
        >
          <BookOpen className="w-4 h-4" />
          الدروس ({totalLessons})
        </Button>
        <Button
          variant={activeTab === 'quiz' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('quiz')}
          className="gap-2"
          disabled={!enrollment}
        >
          <FileText className="w-4 h-4" />
          الاختبار
          {!allLessonsCompleted && enrollment && <Lock className="w-3 h-3 opacity-50" />}
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'lessons' ? (
          <motion.div key="lessons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {!enrollment && (
              <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
                سجّل في الدورة أولاً لبدء التعلم وتتبع تقدمك
              </div>
            )}
            {lessons?.map((lesson, i) => {
              const completed = isLessonCompleted(lesson.id);
              const isExpanded = expandedLesson === lesson.id;
              return (
                <Card key={lesson.id} className={`transition-all ${completed ? 'border-green-300 dark:border-green-700' : ''}`}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-sm font-bold border-2"
                      style={{ borderColor: completed ? 'var(--color-green-500)' : 'var(--color-border)' }}
                    >
                      {completed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <span>{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{lesson.title_ar}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {lesson.duration_minutes} دقيقة
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-4 px-4 border-t">
                          <div className="prose prose-sm dark:prose-invert max-w-none mt-3 text-right">
                            <ReactMarkdown>{lesson.content_ar || lesson.content || 'محتوى الدرس قيد الإعداد...'}</ReactMarkdown>
                          </div>
                          {enrollment && !completed && (
                            <Button
                              size="sm"
                              className="mt-4 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                markCompleteMutation.mutate({ lessonId: lesson.id, courseId });
                              }}
                              disabled={markCompleteMutation.isPending}
                            >
                              {markCompleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              تم إكمال الدرس
                            </Button>
                          )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </motion.div>
        ) : (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!allLessonsCompleted ? (
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">أكمل جميع الدروس أولاً</p>
                <p className="text-sm text-muted-foreground mt-1">
                  أكملت {completedLessons} من {totalLessons} دروس
                </p>
              </div>
            ) : (
              <LMSQuizView courseId={courseId} passingScore={course.passing_score || 70} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LMSCourseViewer;
