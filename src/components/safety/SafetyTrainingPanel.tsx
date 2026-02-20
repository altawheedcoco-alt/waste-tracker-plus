import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useSafetyTrainingCourses, useSafetyTrainingRecords } from '@/hooks/useSafetyTraining';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, GraduationCap, Users, CreditCard, Printer, CheckCircle2, XCircle, QrCode, Clock, FileQuestion } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import SafetyCardPrintView from './SafetyCardPrintView';
import SafetyQuizManager from './SafetyQuizManager';

const courseTypes: Record<string, string> = {
  general_safety: 'السلامة العامة',
  fire_safety: 'السلامة من الحريق',
  chemical_handling: 'التعامل مع المواد الكيميائية',
  first_aid: 'الإسعافات الأولية',
  ppe_usage: 'استخدام معدات الوقاية',
  confined_space: 'الأماكن المحصورة',
  height_work: 'العمل على ارتفاع',
  electrical_safety: 'السلامة الكهربائية',
  waste_handling: 'التعامل مع المخلفات',
};

const SafetyTrainingPanel = () => {
  const { organization } = useAuth();
  const { courses, isLoading: coursesLoading, addCourse } = useSafetyTrainingCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>();
  const { records, isLoading: recordsLoading, addRecord, issueCard } = useSafetyTrainingRecords(selectedCourseId);
  const [courseOpen, setCourseOpen] = useState(false);
  const [traineeOpen, setTraineeOpen] = useState(false);
  const [printRecord, setPrintRecord] = useState<any>(null);

  const [courseForm, setCourseForm] = useState({
    title: '', description: '', course_type: 'general_safety',
    duration_hours: '4', passing_score: '70', instructor_name: '',
    instructor_qualification: '', certificate_validity_months: '12',
  });

  const [traineeForm, setTraineeForm] = useState({
    course_id: '', trainee_name: '', trainee_national_id: '',
    trainee_phone: '', trainee_job_title: '', trainee_department: '',
    training_date: '', score: '', notes: '',
  });

  const handleAddCourse = () => {
    if (!courseForm.title) return;
    addCourse.mutate({
      title: courseForm.title,
      description: courseForm.description || null,
      course_type: courseForm.course_type,
      duration_hours: parseFloat(courseForm.duration_hours) || 4,
      passing_score: parseInt(courseForm.passing_score) || 70,
      instructor_name: courseForm.instructor_name || null,
      instructor_qualification: courseForm.instructor_qualification || null,
      certificate_validity_months: parseInt(courseForm.certificate_validity_months) || 12,
    }, {
      onSuccess: () => {
        setCourseOpen(false);
        setCourseForm({ title: '', description: '', course_type: 'general_safety', duration_hours: '4', passing_score: '70', instructor_name: '', instructor_qualification: '', certificate_validity_months: '12' });
      },
    });
  };

  const handleAddTrainee = () => {
    if (!traineeForm.trainee_name || !traineeForm.course_id || !traineeForm.training_date) return;
    const score = traineeForm.score ? parseInt(traineeForm.score) : null;
    const course = courses.find((c: any) => c.id === traineeForm.course_id);
    const passed = score !== null && course ? score >= course.passing_score : false;
    addRecord.mutate({
      course_id: traineeForm.course_id,
      trainee_name: traineeForm.trainee_name,
      trainee_national_id: traineeForm.trainee_national_id || null,
      trainee_phone: traineeForm.trainee_phone || null,
      trainee_job_title: traineeForm.trainee_job_title || null,
      trainee_department: traineeForm.trainee_department || null,
      training_date: traineeForm.training_date,
      score,
      passed,
      attendance_status: score !== null ? 'attended' : 'registered',
      notes: traineeForm.notes || null,
    }, {
      onSuccess: () => {
        setTraineeOpen(false);
        setTraineeForm({ course_id: '', trainee_name: '', trainee_national_id: '', trainee_phone: '', trainee_job_title: '', trainee_department: '', training_date: '', score: '', notes: '' });
      },
    });
  };

  const handleIssueCard = (record: any) => {
    const validity = record.safety_training_courses?.certificate_validity_months || 12;
    issueCard.mutate({ id: record.id, validityMonths: validity });
  };

  if (coursesLoading) return <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Print View */}
      {printRecord && (
        <SafetyCardPrintView
          record={printRecord}
          organizationName={organization?.name || ''}
          onClose={() => setPrintRecord(null)}
        />
      )}

      <Tabs defaultValue="courses" className="w-full" dir="rtl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 ml-1" />دورة جديدة</Button></DialogTrigger>
              <DialogContent dir="rtl" className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>إضافة دورة تدريبية</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-4">
                  <div><Label>اسم الدورة *</Label><Input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} placeholder="دورة السلامة من الحريق" /></div>
                  <div><Label>نوع الدورة</Label>
                    <Select value={courseForm.course_type} onValueChange={v => setCourseForm(f => ({ ...f, course_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(courseTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>الوصف</Label><Textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>المدة (ساعات)</Label><Input type="number" value={courseForm.duration_hours} onChange={e => setCourseForm(f => ({ ...f, duration_hours: e.target.value }))} /></div>
                    <div><Label>درجة النجاح</Label><Input type="number" value={courseForm.passing_score} onChange={e => setCourseForm(f => ({ ...f, passing_score: e.target.value }))} /></div>
                  </div>
                  <div><Label>اسم المدرب</Label><Input value={courseForm.instructor_name} onChange={e => setCourseForm(f => ({ ...f, instructor_name: e.target.value }))} /></div>
                  <div><Label>مؤهلات المدرب</Label><Input value={courseForm.instructor_qualification} onChange={e => setCourseForm(f => ({ ...f, instructor_qualification: e.target.value }))} /></div>
                  <div><Label>صلاحية الشهادة (أشهر)</Label><Input type="number" value={courseForm.certificate_validity_months} onChange={e => setCourseForm(f => ({ ...f, certificate_validity_months: e.target.value }))} /></div>
                  <Button onClick={handleAddCourse} disabled={addCourse.isPending} className="w-full">{addCourse.isPending ? 'جاري الحفظ...' : 'إضافة الدورة'}</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={traineeOpen} onOpenChange={setTraineeOpen}>
              <DialogTrigger asChild><Button size="sm" variant="outline"><Users className="w-4 h-4 ml-1" />تسجيل متدرب</Button></DialogTrigger>
              <DialogContent dir="rtl" className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader><DialogTitle>تسجيل متدرب جديد</DialogTitle></DialogHeader>
                <div className="space-y-3 mt-4">
                  <div><Label>الدورة التدريبية *</Label>
                    <Select value={traineeForm.course_id} onValueChange={v => setTraineeForm(f => ({ ...f, course_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الدورة" /></SelectTrigger>
                      <SelectContent>{courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>اسم المتدرب *</Label><Input value={traineeForm.trainee_name} onChange={e => setTraineeForm(f => ({ ...f, trainee_name: e.target.value }))} /></div>
                  <div><Label>الرقم القومي</Label><Input value={traineeForm.trainee_national_id} onChange={e => setTraineeForm(f => ({ ...f, trainee_national_id: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>الهاتف</Label><Input value={traineeForm.trainee_phone} onChange={e => setTraineeForm(f => ({ ...f, trainee_phone: e.target.value }))} /></div>
                    <div><Label>المسمى الوظيفي</Label><Input value={traineeForm.trainee_job_title} onChange={e => setTraineeForm(f => ({ ...f, trainee_job_title: e.target.value }))} /></div>
                  </div>
                  <div><Label>القسم</Label><Input value={traineeForm.trainee_department} onChange={e => setTraineeForm(f => ({ ...f, trainee_department: e.target.value }))} /></div>
                  <div><Label>تاريخ التدريب *</Label><Input type="date" value={traineeForm.training_date} onChange={e => setTraineeForm(f => ({ ...f, training_date: e.target.value }))} /></div>
                  <div><Label>الدرجة (اختياري)</Label><Input type="number" min="0" max="100" value={traineeForm.score} onChange={e => setTraineeForm(f => ({ ...f, score: e.target.value }))} placeholder="85" /></div>
                  <div><Label>ملاحظات</Label><Textarea value={traineeForm.notes} onChange={e => setTraineeForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                  <Button onClick={handleAddTrainee} disabled={addRecord.isPending} className="w-full">{addRecord.isPending ? 'جاري التسجيل...' : 'تسجيل المتدرب'}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" />الدورات التدريبية وكروت السيفتي</h3>
        </div>

        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/30 h-auto p-1 mb-4">
          <TabsTrigger value="courses" className="text-xs sm:text-sm gap-1 whitespace-nowrap"><GraduationCap className="w-3 h-3" />الدورات</TabsTrigger>
          <TabsTrigger value="trainees" className="text-xs sm:text-sm gap-1 whitespace-nowrap"><Users className="w-3 h-3" />المتدربون</TabsTrigger>
          <TabsTrigger value="cards" className="text-xs sm:text-sm gap-1 whitespace-nowrap"><CreditCard className="w-3 h-3" />الكروت الصادرة</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs sm:text-sm gap-1 whitespace-nowrap"><FileQuestion className="w-3 h-3" />الامتحانات</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-3">
          {courses.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد دورات تدريبية بعد</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {courses.map((course: any) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCourseId(course.id)}>
                  <CardContent className="p-4 text-right">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline">{courseTypes[course.course_type] || course.course_type}</Badge>
                      <h4 className="font-semibold">{course.title}</h4>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-end">
                      <span>⏱ {course.duration_hours} ساعة</span>
                      <span>📝 درجة النجاح: {course.passing_score}%</span>
                      <span>📅 صلاحية: {course.certificate_validity_months} شهر</span>
                      {course.instructor_name && <span>👤 {course.instructor_name}</span>}
                    </div>
                    {course.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{course.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trainees Tab */}
        <TabsContent value="trainees" className="space-y-3">
          <div className="flex items-center gap-2 justify-end mb-2">
            <Select value={selectedCourseId || 'all'} onValueChange={v => setSelectedCourseId(v === 'all' ? undefined : v)}>
              <SelectTrigger className="w-64"><SelectValue placeholder="كل الدورات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الدورات</SelectItem>
                {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Label>تصفية بالدورة:</Label>
          </div>

          {recordsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : records.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا يوجد متدربون مسجلون</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {records.map((rec: any) => (
                <Card key={rec.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 text-right">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        {rec.passed && !rec.card_issued && (
                          <Button size="sm" variant="outline" onClick={() => handleIssueCard(rec)} disabled={issueCard.isPending}>
                            <CreditCard className="w-3 h-3 ml-1" />إصدار كارنيه
                          </Button>
                        )}
                        {rec.card_issued && (
                          <Button size="sm" variant="ghost" onClick={() => setPrintRecord(rec)}>
                            <Printer className="w-3 h-3 ml-1" />طباعة
                          </Button>
                        )}
                        {rec.passed ? (
                          <Badge variant="default"><CheckCircle2 className="w-3 h-3 ml-1" />ناجح</Badge>
                        ) : rec.score !== null ? (
                          <Badge variant="destructive"><XCircle className="w-3 h-3 ml-1" />راسب</Badge>
                        ) : (
                          <Badge variant="secondary">مسجل</Badge>
                        )}
                        {rec.card_issued && <Badge className="bg-emerald-600"><CreditCard className="w-3 h-3 ml-1" />{rec.card_number}</Badge>}
                      </div>
                      <div>
                        <p className="font-semibold">{rec.trainee_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.safety_training_courses?.title} • {rec.training_date}
                          {rec.score !== null && ` • ${rec.score}%`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="space-y-3">
          {(() => {
            const issuedCards = records.filter((r: any) => r.card_issued);
            if (recordsLoading) return <Skeleton className="h-32 w-full rounded-xl" />;
            if (issuedCards.length === 0) return (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لم يتم إصدار كروت سيفتي بعد</p></CardContent></Card>
            );
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {issuedCards.map((rec: any) => {
                  const expired = rec.card_expires_at && new Date(rec.card_expires_at) < new Date();
                  return (
                    <Card key={rec.id} className={`hover:shadow-md transition-shadow ${expired ? 'border-destructive/50' : 'border-emerald-500/30'}`}>
                      <CardContent className="p-4 text-right">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant={expired ? 'destructive' : 'default'}>{expired ? 'منتهي' : 'ساري'}</Badge>
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-mono">{rec.card_number}</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-lg">{rec.trainee_name}</h4>
                        <p className="text-sm text-muted-foreground">{rec.trainee_job_title || 'غير محدد'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.safety_training_courses?.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 justify-end">
                          <span>صدر: {rec.card_issued_at ? format(new Date(rec.card_issued_at), 'dd/MM/yyyy') : '-'}</span>
                          {rec.card_expires_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              ينتهي: {format(new Date(rec.card_expires_at), 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => setPrintRecord(rec)}>
                          <Printer className="w-3 h-3 ml-1" />طباعة الكارنيه
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-3">
          <SafetyQuizManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafetyTrainingPanel;
