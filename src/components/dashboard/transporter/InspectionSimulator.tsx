import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Play, RotateCcw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const questions = [
  { q: 'هل جميع رخص المركبات سارية؟', category: 'أسطول' },
  { q: 'هل يوجد سجل صيانة محدث لكل مركبة؟', category: 'أسطول' },
  { q: 'هل جميع السائقين حاصلين على تدريب نقل مخلفات خطرة؟', category: 'سائقين' },
  { q: 'هل معدات السلامة (PPE) متوفرة ومحدثة؟', category: 'سلامة' },
  { q: 'هل يوجد خطة طوارئ مكتوبة للانسكابات؟', category: 'طوارئ' },
  { q: 'هل إقرارات الشحن الأخيرة موقعة ومؤرشفة؟', category: 'مستندات' },
  { q: 'هل الحاويات مُعلّمة بعلامات النوع الصحيحة؟', category: 'حاويات' },
  { q: 'هل تأمين المسؤولية المدنية ساري؟', category: 'تأمين' },
  { q: 'هل يتم تسجيل أوزان الشحنات عند التحميل والتفريغ؟', category: 'أوزان' },
  { q: 'هل يوجد نظام لتتبع المركبات يعمل حالياً؟', category: 'تتبع' },
];

export default function InspectionSimulator() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(questions.length).fill(null));

  const answer = (val: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = val;
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const answered = answers.filter(a => a !== null).length;
  const passed = answers.filter(a => a === true).length;
  const failed = answers.filter(a => a === false).length;
  const done = answered === questions.length;
  const score = done ? Math.round((passed / questions.length) * 100) : 0;

  const reset = () => { setStarted(false); setCurrentQ(0); setAnswers(Array(questions.length).fill(null)); };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          محاكي التفتيش الافتراضي
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!started ? (
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-muted-foreground">محاكاة تفتيش حقيقي بـ {questions.length} أسئلة عشوائية</p>
            <Button onClick={() => setStarted(true)} className="gap-2"><Play className="w-4 h-4" /> ابدأ المحاكاة</Button>
          </div>
        ) : done ? (
          <div className="space-y-3">
            <div className="text-center py-2">
              <div className={`text-3xl font-bold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{score}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {score >= 80 ? 'جاهز للتفتيش ✅' : score >= 50 ? 'يحتاج تحسين ⚠️' : 'غير جاهز ❌'}
              </p>
            </div>
            <div className="flex gap-4 justify-center text-sm">
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4" /> {passed} ناجح</span>
              <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> {failed} فاشل</span>
            </div>
            <div className="space-y-1.5">
              {questions.map((q, i) => answers[i] === false && (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-red-50 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{q.q}</span>
                  <Badge variant="outline" className="text-[10px] mr-auto">{q.category}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={reset} className="w-full gap-2"><RotateCcw className="w-4 h-4" /> إعادة المحاكاة</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Progress value={(answered / questions.length) * 100} />
            <p className="text-xs text-muted-foreground text-center">السؤال {currentQ + 1} من {questions.length}</p>
            <div className="p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="text-[10px] mb-2">{questions[currentQ].category}</Badge>
              <p className="text-sm font-medium">{questions[currentQ].q}</p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 gap-1" variant="default" onClick={() => answer(true)}><CheckCircle2 className="w-4 h-4" /> نعم</Button>
              <Button className="flex-1 gap-1" variant="destructive" onClick={() => answer(false)}><XCircle className="w-4 h-4" /> لا</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
