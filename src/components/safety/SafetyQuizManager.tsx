import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useSafetyQuizQuestions, useSafetyQuizAttempts } from '@/hooks/useSafetyQuiz';
import { useSafetyTrainingCourses, useSafetyTrainingRecords } from '@/hooks/useSafetyTraining';
import { Plus, Trash2, FileQuestion, Play, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import SafetyQuizTaker from './SafetyQuizTaker';

const SafetyQuizManager = () => {
  const { courses } = useSafetyTrainingCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const { questions, isLoading, addQuestion, deleteQuestion } = useSafetyQuizQuestions(selectedCourseId || undefined);
  const { records } = useSafetyTrainingRecords(selectedCourseId || undefined);
  const { attempts } = useSafetyQuizAttempts(selectedCourseId || undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [quizTaker, setQuizTaker] = useState<{ recordId: string; traineeName: string } | null>(null);

  // Question form
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([
    { text_ar: '', is_correct: true },
    { text_ar: '', is_correct: false },
    { text_ar: '', is_correct: false },
    { text_ar: '', is_correct: false },
  ]);
  const [points, setPoints] = useState('1');

  const handleAddQuestion = () => {
    if (!questionText || !selectedCourseId) return;
    const validOptions = options.filter(o => o.text_ar.trim());
    if (validOptions.length < 2) return;
    addQuestion.mutate({
      course_id: selectedCourseId,
      question_ar: questionText,
      options: validOptions,
      points: parseInt(points) || 1,
    }, {
      onSuccess: () => {
        setAddOpen(false);
        setQuestionText('');
        setOptions([
          { text_ar: '', is_correct: true },
          { text_ar: '', is_correct: false },
          { text_ar: '', is_correct: false },
          { text_ar: '', is_correct: false },
        ]);
        setPoints('1');
      },
    });
  };

  const setCorrectOption = (index: number) => {
    setOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === index })));
  };

  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);

  // If quiz is being taken
  if (quizTaker && selectedCourseId) {
    return (
      <SafetyQuizTaker
        courseId={selectedCourseId}
        recordId={quizTaker.recordId}
        traineeName={quizTaker.traineeName}
        passingScore={selectedCourse?.passing_score || 70}
        onClose={() => setQuizTaker(null)}
      />
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Course Selector */}
      <div className="flex items-center gap-3 justify-end">
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-72"><SelectValue placeholder="اختر الدورة لإدارة الامتحان" /></SelectTrigger>
          <SelectContent>
            {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Label className="font-semibold">الدورة:</Label>
      </div>

      {!selectedCourseId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>اختر دورة تدريبية لإنشاء أو إدارة الامتحان</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {/* Questions Section */}
          <div className="flex items-center justify-between">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 ml-1" />إضافة سؤال</Button>
              </DialogTrigger>
              <DialogContent dir="rtl" className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>إضافة سؤال جديد</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-4">
                  <div>
                    <Label>نص السؤال *</Label>
                    <Input value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="ما هو الإجراء الصحيح عند اندلاع حريق؟" />
                  </div>
                  <div>
                    <Label className="mb-2 block">الخيارات (حدد الإجابة الصحيحة)</Label>
                    {options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <Switch checked={opt.is_correct} onCheckedChange={() => setCorrectOption(i)} />
                        <Input
                          value={opt.text_ar}
                          onChange={e => setOptions(prev => prev.map((o, j) => j === i ? { ...o, text_ar: e.target.value } : o))}
                          placeholder={`الخيار ${i + 1}`}
                          className="flex-1"
                        />
                        <Badge variant={opt.is_correct ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                          {opt.is_correct ? '✓ صحيح' : 'خطأ'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>الدرجة</Label>
                    <Input type="number" value={points} onChange={e => setPoints(e.target.value)} min="1" max="10" />
                  </div>
                  <Button onClick={handleAddQuestion} disabled={addQuestion.isPending} className="w-full">
                    {addQuestion.isPending ? 'جاري الحفظ...' : 'إضافة السؤال'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <h4 className="font-semibold flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-primary" />
              أسئلة الامتحان ({questions.length} سؤال)
            </h4>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : questions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <p>لا توجد أسئلة بعد - أضف أسئلة لإنشاء الامتحان</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {questions.map((q: any, idx: number) => {
                const opts = (q.options as any[]) || [];
                const correct = opts.find(o => o.is_correct);
                return (
                  <Card key={q.id}>
                    <CardContent className="p-3 text-right">
                      <div className="flex items-start justify-between">
                        <Button size="icon" variant="ghost" className="text-destructive h-7 w-7" onClick={() => deleteQuestion.mutate(q.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            <span className="text-muted-foreground ml-1">{idx + 1}.</span>
                            {q.question_ar}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {opts.map((o: any, i: number) => (
                              <Badge key={i} variant={o.is_correct ? 'default' : 'outline'} className="text-xs">
                                {o.text_ar}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Start Quiz for Trainee */}
          {questions.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-6">
                <span />
                <h4 className="font-semibold flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  بدء امتحان لمتدرب
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {records.filter((r: any) => r.attendance_status !== 'absent').map((rec: any) => {
                  const recAttempts = attempts.filter((a: any) => a.record_id === rec.id);
                  const bestAttempt = recAttempts.length > 0
                    ? recAttempts.reduce((best: any, curr: any) => curr.percentage > best.percentage ? curr : best)
                    : null;
                  return (
                    <Card key={rec.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3 text-right flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {bestAttempt ? (
                            <Badge variant={bestAttempt.passed ? 'default' : 'destructive'} className="text-xs">
                              {bestAttempt.passed ? <CheckCircle2 className="w-3 h-3 ml-1" /> : <XCircle className="w-3 h-3 ml-1" />}
                              {bestAttempt.percentage}%
                            </Badge>
                          ) : null}
                          <Button
                            size="sm" variant="outline"
                            onClick={() => setQuizTaker({ recordId: rec.id, traineeName: rec.trainee_name })}
                          >
                            <Play className="w-3 h-3 ml-1" />
                            {recAttempts.length > 0 ? 'إعادة' : 'بدء الامتحان'}
                          </Button>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{rec.trainee_name}</p>
                          <p className="text-xs text-muted-foreground">{rec.trainee_job_title || '-'} • {recAttempts.length} محاولة</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SafetyQuizManager;
