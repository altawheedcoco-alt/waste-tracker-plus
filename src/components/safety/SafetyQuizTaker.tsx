import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useSafetyQuizQuestions, useSafetyQuizAttempts } from '@/hooks/useSafetyQuiz';

interface Props {
  courseId: string;
  recordId: string;
  traineeName: string;
  passingScore: number;
  onClose: () => void;
}

const SafetyQuizTaker = ({ courseId, recordId, traineeName, passingScore, onClose }: Props) => {
  const { questions, isLoading } = useSafetyQuizQuestions(courseId);
  const { submitAttempt } = useSafetyQuizAttempts(courseId);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!questions?.length) return (
    <div className="text-center py-10 text-muted-foreground">
      <p>لا توجد أسئلة متاحة</p>
      <Button variant="outline" className="mt-3" onClick={onClose}><ArrowRight className="w-4 h-4 ml-1" />رجوع</Button>
    </div>
  );

  const q = questions[currentQ];
  const options = (q.options as any[]) || [];
  const totalQuestions = questions.length;

  const handleSubmit = () => {
    let score = 0;
    const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
    const answerDetails = questions.map((q: any) => {
      const opts = (q.options as any[]) || [];
      const selected = answers[q.id];
      const correctOpt = opts.find((o: any) => o.is_correct);
      const isCorrect = selected === correctOpt?.text_ar;
      if (isCorrect) score += (q.points || 1);
      return { question_id: q.id, selected_answer: selected, is_correct: isCorrect };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percentage >= passingScore;
    setResult({ score, total: totalPoints, percentage, passed });
    setSubmitted(true);

    submitAttempt.mutate({
      record_id: recordId,
      course_id: courseId,
      answers: answerDetails,
      score,
      total_points: totalPoints,
      percentage,
      passed,
    });
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setSubmitted(false);
    setResult(null);
  };

  if (submitted && result) {
    return (
      <div dir="rtl" className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onClose}><ArrowRight className="w-4 h-4 ml-1" />رجوع للقائمة</Button>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`border-2 ${result.passed ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-red-400 bg-red-50/50 dark:bg-red-900/10'}`}>
            <CardContent className="p-8 text-center space-y-4">
              {result.passed ? (
                <Award className="w-16 h-16 mx-auto text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 mx-auto text-red-500" />
              )}
              <h2 className="text-xl font-bold">{traineeName}</h2>
              <h3 className="text-lg">{result.passed ? '🎉 مبروك! اجتاز الامتحان' : '😔 لم يجتز الامتحان'}</h3>
              <div className="text-4xl font-black">{result.percentage}%</div>
              <p className="text-muted-foreground">
                {result.score} من {result.total} نقاط | الحد الأدنى: {passingScore}%
              </p>
              {result.passed ? (
                <p className="text-green-600 dark:text-green-400 font-medium">تم تحديث سجل المتدرب تلقائياً ✅</p>
              ) : (
                <Button onClick={reset} variant="outline" className="gap-2 mt-4">
                  <RotateCcw className="w-4 h-4" /> إعادة المحاولة
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{traineeName}</Badge>
        <Button variant="ghost" size="sm" onClick={onClose}><ArrowRight className="w-4 h-4 ml-1" />رجوع</Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">السؤال {currentQ + 1} من {totalQuestions}</span>
        <Progress value={((currentQ + 1) / totalQuestions) * 100} className="h-2 flex-1" />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <h3 className="text-lg font-semibold">{q.question_ar}</h3>
          <RadioGroup
            value={answers[q.id] || ''}
            onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
            className="space-y-3"
          >
            {options.map((opt: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.text_ar} id={`sq-${q.id}-${i}`} />
                <Label htmlFor={`sq-${q.id}-${i}`} className="flex-1 cursor-pointer text-sm">{opt.text_ar}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}>
          السابق
        </Button>
        {currentQ < totalQuestions - 1 ? (
          <Button onClick={() => setCurrentQ(currentQ + 1)} disabled={!answers[q.id]}>
            التالي
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < totalQuestions || submitAttempt.isPending}
            className="gap-2"
          >
            {submitAttempt.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            إرسال الامتحان
          </Button>
        )}
      </div>
    </div>
  );
};

export default SafetyQuizTaker;
