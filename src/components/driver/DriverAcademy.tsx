import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap, BookOpen, CheckCircle2, Clock, Star,
  Shield, Flame, Award, ChevronLeft, Play, Trophy,
  Leaf, AlertTriangle, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DriverAcademyProps {
  driverId: string;
}

interface Lesson {
  id: string;
  title: string;
  category: 'safety' | 'hazmat' | 'compliance' | 'efficiency' | 'environment';
  duration: string;
  points: number;
  content: string[];
  quiz: { question: string; options: string[]; correct: number }[];
}

const categoryConfig = {
  safety: { label: 'السلامة', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  hazmat: { label: 'مخلفات خطرة', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  compliance: { label: 'الامتثال', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  efficiency: { label: 'الكفاءة', icon: Truck, color: 'text-primary', bg: 'bg-primary/10' },
  environment: { label: 'البيئة', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
};

const lessons: Lesson[] = [
  {
    id: 'safety-1',
    title: 'أساسيات السلامة المرورية',
    category: 'safety',
    duration: '2 دقيقة',
    points: 15,
    content: [
      '✅ تأكد دائماً من ربط حزام الأمان قبل بدء القيادة',
      '✅ حافظ على مسافة أمان لا تقل عن 3 ثوانٍ مع المركبة الأمامية',
      '✅ استخدم المرايا الجانبية كل 8-10 ثوانٍ أثناء القيادة',
      '✅ تجنب استخدام الهاتف أثناء القيادة نهائياً',
      '✅ خفف السرعة في المنعطفات والمناطق المأهولة',
    ],
    quiz: [
      { question: 'ما المسافة الزمنية الآمنة مع المركبة الأمامية؟', options: ['ثانية واحدة', '3 ثوانٍ', '5 ثوانٍ', '10 ثوانٍ'], correct: 1 },
    ],
  },
  {
    id: 'hazmat-1',
    title: 'التعامل مع المخلفات الخطرة',
    category: 'hazmat',
    duration: '3 دقائق',
    points: 25,
    content: [
      '⚠️ البس معدات الحماية الشخصية (PPE) دائماً قبل لمس المخلفات',
      '⚠️ لا تخلط أنواع مختلفة من المخلفات الخطرة في نفس الحاوية',
      '⚠️ تأكد من وجود ملصقات التحذير (GHS) على جميع الحاويات',
      '⚠️ في حالة الانسكاب: أوقف المركبة فوراً، ابتعد 25م، اتصل بالطوارئ',
      '⚠️ احتفظ دائماً بصحيفة بيانات السلامة (SDS) لكل مادة',
    ],
    quiz: [
      { question: 'ماذا تفعل عند انسكاب مخلفات خطرة؟', options: ['تنظفها بنفسك', 'تتجاهلها', 'توقف وتبتعد 25م وتتصل بالطوارئ', 'تغطيها بالتراب'], correct: 2 },
    ],
  },
  {
    id: 'compliance-1',
    title: 'المانيفست وسلسلة الحيازة',
    category: 'compliance',
    duration: '2 دقيقة',
    points: 20,
    content: [
      '📋 المانيفست مستند قانوني إلزامي لكل رحلة نقل مخلفات',
      '📋 يجب توقيع المانيفست عند كل نقطة تسليم واستلام',
      '📋 احتفظ بنسخة رقمية من المانيفست طوال الرحلة',
      '📋 عند التسليم، تأكد من مطابقة الكميات مع المانيفست',
      '📋 أي تناقض يجب الإبلاغ عنه فوراً للمشرف',
    ],
    quiz: [
      { question: 'هل المانيفست إلزامي لكل رحلة نقل مخلفات؟', options: ['لا، فقط للخطرة', 'نعم، لجميع الرحلات', 'فقط للرحلات الطويلة', 'فقط إذا طلبه العميل'], correct: 1 },
    ],
  },
  {
    id: 'efficiency-1',
    title: 'القيادة الاقتصادية وتوفير الوقود',
    category: 'efficiency',
    duration: '2 دقيقة',
    points: 15,
    content: [
      '⛽ القيادة بسرعة ثابتة 80-90 كم/س توفر 20% وقود',
      '⛽ تجنب التسارع والفرملة المفاجئة',
      '⛽ أطفئ المحرك عند التوقف أكثر من 30 ثانية',
      '⛽ تأكد من ضغط الإطارات الصحيح — يوفر حتى 3% وقود',
      '⛽ خطط مسارك مسبقاً لتجنب الازدحام',
    ],
    quiz: [
      { question: 'ما السرعة المثالية لتوفير الوقود؟', options: ['60 كم/س', '80-90 كم/س', '120 كم/س', '100 كم/س'], correct: 1 },
    ],
  },
  {
    id: 'environment-1',
    title: 'البصمة الكربونية للسائق',
    category: 'environment',
    duration: '2 دقيقة',
    points: 20,
    content: [
      '🌍 كل لتر ديزل ينتج 2.68 كجم CO2',
      '🌍 القيادة الاقتصادية تخفض انبعاثاتك 15-20%',
      '🌍 تقليل وقت تشغيل المحرك بدون حمولة يوفر 5% انبعاثات',
      '🌍 تجميع عدة شحنات في مسار واحد يخفض البصمة الكربونية 30%',
      '🌍 أنت جزء من الحل — كل رحلة فعالة تحمي البيئة',
    ],
    quiz: [
      { question: 'كم كجم CO2 ينتج لتر الديزل الواحد؟', options: ['1 كجم', '2.68 كجم', '5 كجم', '0.5 كجم'], correct: 1 },
    ],
  },
];

const DriverAcademy = ({ driverId }: DriverAcademyProps) => {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0=content, 1=quiz
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(`academy_${driverId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setCompletedLessons(data.completed || []);
      setTotalPoints(data.points || 0);
    }
  }, [driverId]);

  const saveProgress = (completed: string[], points: number) => {
    localStorage.setItem(`academy_${driverId}`, JSON.stringify({ completed, points }));
  };

  const handleQuizAnswer = (idx: number) => {
    if (!selectedLesson || quizAnswer !== null) return;
    setQuizAnswer(idx);
    const isCorrect = idx === selectedLesson.quiz[0].correct;
    if (isCorrect && !completedLessons.includes(selectedLesson.id)) {
      const newCompleted = [...completedLessons, selectedLesson.id];
      const newPoints = totalPoints + selectedLesson.points;
      setCompletedLessons(newCompleted);
      setTotalPoints(newPoints);
      saveProgress(newCompleted, newPoints);
    }
  };

  const overallProgress = (completedLessons.length / lessons.length) * 100;
  const todayLesson = lessons.find(l => !completedLessons.includes(l.id)) || lessons[0];

  // Lesson view
  if (selectedLesson) {
    const cat = categoryConfig[selectedLesson.category];
    const CatIcon = cat.icon;
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => { setSelectedLesson(null); setCurrentStep(0); setQuizAnswer(null); }}>
          <ChevronLeft className="w-4 h-4" />
          العودة للأكاديمية
        </Button>

        <Card className={`border ${cat.bg.replace('10', '20')}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center`}>
                <CatIcon className={`w-4 h-4 ${cat.color}`} />
              </div>
              <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>
              <Badge variant="outline" className="text-[10px] mr-auto gap-1">
                <Clock className="w-3 h-3" />
                {selectedLesson.duration}
              </Badge>
            </div>
            <CardTitle className="text-base">{selectedLesson.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {currentStep === 0 ? (
                <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-3 mb-4">
                    {selectedLesson.content.map((line, i) => (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="text-sm leading-relaxed p-3 rounded-lg bg-muted/30 border"
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>
                  <Button className="w-full gap-2" onClick={() => setCurrentStep(1)}>
                    <Play className="w-4 h-4" />
                    اختبر معلوماتك
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <p className="text-sm font-bold mb-4">{selectedLesson.quiz[0].question}</p>
                  <div className="space-y-2">
                    {selectedLesson.quiz[0].options.map((opt, i) => {
                      const isCorrect = i === selectedLesson.quiz[0].correct;
                      const isSelected = quizAnswer === i;
                      return (
                        <button
                          key={i}
                          onClick={() => handleQuizAnswer(i)}
                          disabled={quizAnswer !== null}
                          className={`w-full text-right p-3 rounded-lg border transition-all text-sm ${
                            quizAnswer !== null
                              ? isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700' : isSelected ? 'bg-destructive/10 border-destructive/30' : ''
                              : 'hover:bg-primary/5 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold">
                              {String.fromCharCode(1571 + i)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {quizAnswer !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {quizAnswer !== null && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                      {quizAnswer === selectedLesson.quiz[0].correct ? (
                        <Card className="bg-emerald-500/5 border-emerald-500/30">
                          <CardContent className="py-4 text-center">
                            <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                            <p className="font-bold text-lg">إجابة صحيحة! 🎉</p>
                            <p className="text-sm text-muted-foreground">+{selectedLesson.points} نقطة</p>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="bg-destructive/5 border-destructive/30">
                          <CardContent className="py-4 text-center">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-destructive" />
                            <p className="font-bold">إجابة خاطئة</p>
                            <p className="text-sm text-muted-foreground">راجع المحتوى وحاول مرة أخرى</p>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Academy View
  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">أكاديمية السائق</h3>
              <p className="text-xs text-muted-foreground">تعلم دقيقتين يومياً — كن سائقاً معتمداً</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{totalPoints}</p>
              <p className="text-[10px] text-muted-foreground">نقطة</p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{completedLessons.length}/{lessons.length} درس</span>
            <span>{Math.round(overallProgress)}% مكتمل</span>
          </div>
          <Progress value={overallProgress} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Today's Lesson Highlight */}
      {!completedLessons.includes(todayLesson.id) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-amber-600 font-semibold">درس اليوم</p>
                <p className="font-semibold text-sm">{todayLesson.title}</p>
              </div>
              <Button size="sm" className="gap-1" onClick={() => setSelectedLesson(todayLesson)}>
                <Play className="w-3 h-3" />
                ابدأ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Lessons */}
      <div className="space-y-2">
        {lessons.map((lesson, idx) => {
          const cat = categoryConfig[lesson.category];
          const CatIcon = cat.icon;
          const isCompleted = completedLessons.includes(lesson.id);
          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <button
                onClick={() => { setSelectedLesson(lesson); setCurrentStep(0); setQuizAnswer(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${
                  isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'hover:bg-muted/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <CatIcon className={`w-5 h-5 ${cat.color}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {lesson.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{cat.label}</Badge>
                    <span className="text-[10px] text-muted-foreground">{lesson.duration}</span>
                    <span className="text-[10px] text-primary font-bold">+{lesson.points} نقطة</span>
                  </div>
                </div>
                {isCompleted && (
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">✓</Badge>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Certificate */}
      {completedLessons.length === lessons.length && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="py-6 text-center">
            <Award className="w-16 h-16 mx-auto mb-3 text-amber-500" />
            <p className="font-bold text-lg">مبارك! 🎓</p>
            <p className="text-sm text-muted-foreground">أكملت جميع الدروس — أنت سائق معتمد</p>
            <Badge className="mt-2 text-amber-600 bg-amber-500/10 border border-amber-500/30">
              شهادة السائق الأخضر المعتمد
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverAcademy;
