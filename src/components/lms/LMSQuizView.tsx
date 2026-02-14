import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useLMSQuizQuestions, useSubmitQuiz } from '@/hooks/useLMS';

interface Props { courseId: string; passingScore: number; }

const LMSQuizView = ({ courseId, passingScore }: Props) => {
  const { data: questions, isLoading } = useLMSQuizQuestions(courseId);
  const submitQuiz = useSubmitQuiz();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null);

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!questions?.length) return <div className="text-center py-10 text-muted-foreground">لا توجد أسئلة متاحة حالياً</div>;

  const q = questions[currentQ];
  const options = (q.options as any[]) || [];
  const totalQuestions = questions.length;

  const handleSubmit = () => {
    let score = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const answerDetails = questions.map(q => {
      const opts = (q.options as any[]) || [];
      const selected = answers[q.id];
      const correctOpt = opts.find(o => o.is_correct);
      const isCorrect = selected === correctOpt?.text_ar;
      if (isCorrect) score += (q.points || 1);
      return { question_id: q.id, selected_answer: selected, is_correct: isCorrect };
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    setResult({ score, total: totalPoints, percentage, passed: percentage >= passingScore });
    setSubmitted(true);

    submitQuiz.mutate({ courseId, answers: answerDetails, score, totalPoints });
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setSubmitted(false);
    setResult(null);
  };

  if (submitted && result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className={`border-2 ${result.passed ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-red-400 bg-red-50/50 dark:bg-red-900/10'}`}>
          <CardContent className="p-8 text-center space-y-4">
            {result.passed ? (
              <Award className="w-16 h-16 mx-auto text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto text-red-500" />
            )}
            <h2 className="text-2xl font-bold">{result.passed ? '🎉 مبروك! اجتزت الاختبار' : '😔 لم تجتز الاختبار'}</h2>
            <div className="text-4xl font-black">{result.percentage}%</div>
            <p className="text-muted-foreground">
              {result.score} من {result.total} نقاط | الحد الأدنى: {passingScore}%
            </p>
            {result.passed ? (
              <p className="text-green-600 dark:text-green-400 font-medium">تم إصدار شهادتك تلقائياً ✅</p>
            ) : (
              <Button onClick={reset} variant="outline" className="gap-2 mt-4">
                <RotateCcw className="w-4 h-4" /> إعادة المحاولة
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
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
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value={opt.text_ar} id={`q-${q.id}-${i}`} />
                <Label htmlFor={`q-${q.id}-${i}`} className="flex-1 cursor-pointer text-sm">{opt.text_ar}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
        >
          السابق
        </Button>
        {currentQ < totalQuestions - 1 ? (
          <Button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={!answers[q.id]}
          >
            التالي
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < totalQuestions || submitQuiz.isPending}
            className="gap-2"
          >
            {submitQuiz.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            إرسال الاختبار
          </Button>
        )}
      </div>
    </div>
  );
};

export default LMSQuizView;
