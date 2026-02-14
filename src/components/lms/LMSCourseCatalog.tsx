import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, Star, Shield, AlertTriangle, Monitor, BarChart3, Recycle, Scale, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLMSCategories, useLMSCourses } from '@/hooks/useLMS';
import { Loader2 } from 'lucide-react';

const iconMap: Record<string, any> = {
  ShieldCheck: Shield, Recycle, Scale, Monitor, AlertTriangle, BarChart3, BookOpen,
};

const difficultyMap: Record<string, { label: string; color: string }> = {
  beginner: { label: 'مبتدئ', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  intermediate: { label: 'متوسط', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  advanced: { label: 'متقدم', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

const audienceMap: Record<string, string> = {
  generator: 'مولد', transporter: 'ناقل', recycler: 'مدور', disposal: 'تخلص', driver: 'سائق', admin: 'مدير',
};

interface Props { onSelectCourse: (id: string) => void; }

const LMSCourseCatalog = ({ onSelectCourse }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: categories, isLoading: catLoading } = useLMSCategories();
  const { data: courses, isLoading: courseLoading } = useLMSCourses(selectedCategory || undefined);

  if (catLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 mt-4">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          الكل
        </Button>
        {categories?.map(cat => {
          const Icon = iconMap[cat.icon] || BookOpen;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.name_ar}
            </Button>
          );
        })}
      </div>

      {/* Courses Grid */}
      {courseLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !courses?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>لا توجد دورات في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course, i) => {
            const diff = difficultyMap[course.difficulty_level || 'beginner'];
            const catData = course.lms_categories as any;
            const CatIcon = iconMap[catData?.icon] || BookOpen;
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all h-full group"
                  onClick={() => onSelectCourse(course.id)}
                >
                  <CardContent className="p-5 space-y-3 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: (catData?.color || '#3B82F6') + '20', color: catData?.color || '#3B82F6' }}
                      >
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {course.is_mandatory && <Badge variant="destructive" className="text-[10px]">إلزامي</Badge>}
                        <Badge className={`text-[10px] ${diff.color} border-0`}>{diff.label}</Badge>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                        {course.title_ar}
                      </h3>
                      {course.description_ar && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{course.description_ar}</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.estimated_duration_minutes} دقيقة</span>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {(course.target_audience || []).slice(0, 3).map(a => (
                          <span key={a} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{audienceMap[a] || a}</span>
                        ))}
                        {(course.target_audience || []).length > 3 && (
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">+{(course.target_audience || []).length - 3}</span>
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
  );
};

export default LMSCourseCatalog;
