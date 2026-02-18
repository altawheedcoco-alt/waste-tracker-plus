import { OrgMember } from '@/hooks/useOrgMembers';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, Building2, Briefcase, Calendar, Hash, IdCard, FileText, GraduationCap, ShieldCheck, Upload, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState, useRef } from 'react';
import {
  useEmployeeDocuments,
  useEmployeeCourses,
  useEmployeeInsurance,
  uploadEmployeeFile,
  DOC_TYPE_LABELS,
  INSURANCE_TYPE_LABELS,
} from '@/hooks/useEmployeeArchive';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  member: OrgMember;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  active: 'نشط', suspended: 'موقوف', terminated: 'منتهي',
  on_leave: 'إجازة', pending_invitation: 'دعوة معلقة',
};

export default function MemberProfileSheet({ member, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[95vw] sm:w-[550px] md:w-[600px] overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="text-right">الملف الشامل للموظف</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-right">
              <h3 className="text-lg font-bold">{member.profile?.full_name || member.invitation_email}</h3>
              {member.job_title_ar && <p className="text-sm text-muted-foreground">{member.job_title_ar}</p>}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{statusLabels[member.status]}</Badge>
                {member.employee_number && (
                  <Badge variant="outline" className="gap-1"><Hash className="w-3 h-3" />{member.employee_number}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-10">
              <TabsTrigger value="info" className="text-xs gap-1"><User className="w-3 h-3" />بيانات</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs gap-1"><FileText className="w-3 h-3" />مستندات</TabsTrigger>
              <TabsTrigger value="courses" className="text-xs gap-1"><GraduationCap className="w-3 h-3" />دورات</TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs gap-1"><ShieldCheck className="w-3 h-3" />تأمينات</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-3">
              <InfoTab member={member} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentsTab memberId={member.id} />
            </TabsContent>

            <TabsContent value="courses" className="mt-4">
              <CoursesTab memberId={member.id} />
            </TabsContent>

            <TabsContent value="insurance" className="mt-4">
              <InsuranceTab memberId={member.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ========== Info Tab ========== */
function InfoTab({ member }: { member: OrgMember }) {
  return (
    <div className="space-y-3">
      {member.profile?.email && <InfoRow icon={Mail} label="البريد الإلكتروني" value={member.profile.email} dir="ltr" />}
      {member.profile?.phone && <InfoRow icon={Phone} label="الجوال" value={member.profile.phone} dir="ltr" />}
      {member.department?.name_ar && <InfoRow icon={Building2} label="القسم" value={member.department.name_ar} />}
      {member.position?.title_ar && <InfoRow icon={Briefcase} label="المنصب" value={member.position.title_ar} />}
      {member.profile?.national_id && <InfoRow icon={IdCard} label="رقم الهوية" value={member.profile.national_id} />}
      {member.joined_at && <InfoRow icon={Calendar} label="تاريخ الانضمام" value={format(new Date(member.joined_at), 'PPP', { locale: ar })} />}
    </div>
  );
}

/* ========== Documents Tab ========== */
function DocumentsTab({ memberId }: { memberId: string }) {
  const { documents, isLoading, addDocument, deleteDocument } = useEmployeeDocuments(memberId);
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState('national_id');
  const [docName, setDocName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    let fileUrl: string | null = null;
    const file = fileRef.current?.files?.[0];
    if (file && profile?.organization_id) {
      setUploading(true);
      try {
        fileUrl = await uploadEmployeeFile(profile.organization_id, memberId, file);
      } catch { /* ignore */ }
      setUploading(false);
    }
    addDocument.mutate({
      member_id: memberId,
      document_type: docType,
      document_name: docName || DOC_TYPE_LABELS[docType],
      document_name_ar: docName || DOC_TYPE_LABELS[docType],
      file_url: fileUrl,
      file_type: file?.type?.includes('pdf') ? 'pdf' : 'image',
      issue_date: issueDate || null,
      expiry_date: expiryDate || null,
      notes: null,
    });
    setShowForm(false);
    setDocName('');
    setIssueDate('');
    setExpiryDate('');
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="w-full gap-1">
        <Upload className="w-4 h-4" /> إضافة مستند
      </Button>

      {showForm && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="اسم المستند (اختياري)" value={docName} onChange={e => setDocName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" placeholder="تاريخ الإصدار" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            <Input type="date" placeholder="تاريخ الانتهاء" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="text-sm w-full" />
          <Button size="sm" onClick={handleAdd} disabled={uploading || addDocument.isPending} className="w-full">
            {uploading ? 'جاري الرفع...' : 'حفظ'}
          </Button>
        </div>
      )}

      {documents.length === 0 && !showForm && (
        <p className="text-center text-sm text-muted-foreground py-6">لا توجد مستندات بعد</p>
      )}

      {documents.map(doc => {
        const isExpiring = doc.expiry_date && differenceInDays(new Date(doc.expiry_date), new Date()) <= 30 && differenceInDays(new Date(doc.expiry_date), new Date()) > 0;
        const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();

        return (
          <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.document_name_ar || doc.document_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                {doc.expiry_date && (
                  <Badge variant={isExpired ? 'destructive' : isExpiring ? 'secondary' : 'outline'} className="text-[10px] gap-0.5">
                    {isExpired && <AlertTriangle className="w-2.5 h-2.5" />}
                    {format(new Date(doc.expiry_date), 'yyyy/MM/dd')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {doc.file_url && (
                <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                  <a href={doc.file_url} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5" /></a>
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteDocument.mutate(doc.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========== Courses Tab ========== */
function CoursesTab({ memberId }: { memberId: string }) {
  const { courses, isLoading, addCourse } = useEmployeeCourses(memberId);
  const { profile } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [provider, setProvider] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    let certUrl: string | null = null;
    const file = fileRef.current?.files?.[0];
    if (file && profile?.organization_id) {
      setUploading(true);
      try {
        certUrl = await uploadEmployeeFile(profile.organization_id, memberId, file);
      } catch { /* ignore */ }
      setUploading(false);
    }
    addCourse.mutate({
      member_id: memberId,
      course_name: courseName,
      course_name_ar: courseName,
      provider: provider || null,
      certificate_url: certUrl,
      completion_date: completionDate || null,
      expiry_date: null,
      notes: null,
    });
    setShowForm(false);
    setCourseName('');
    setProvider('');
    setCompletionDate('');
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="w-full gap-1">
        <Upload className="w-4 h-4" /> إضافة دورة خارجية
      </Button>

      {showForm && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          <Input placeholder="اسم الدورة *" value={courseName} onChange={e => setCourseName(e.target.value)} />
          <Input placeholder="الجهة المانحة" value={provider} onChange={e => setProvider(e.target.value)} />
          <Input type="date" placeholder="تاريخ الإتمام" value={completionDate} onChange={e => setCompletionDate(e.target.value)} />
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="text-sm w-full" />
          <Button size="sm" onClick={handleAdd} disabled={!courseName || uploading || addCourse.isPending} className="w-full">
            {uploading ? 'جاري الرفع...' : 'حفظ'}
          </Button>
        </div>
      )}

      {courses.length === 0 && !showForm && (
        <p className="text-center text-sm text-muted-foreground py-6">لا توجد دورات مسجلة</p>
      )}

      {courses.map(c => (
        <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.course_name_ar || c.course_name}</p>
            <p className="text-xs text-muted-foreground">{c.provider}{c.completion_date ? ` • ${format(new Date(c.completion_date), 'yyyy/MM/dd')}` : ''}</p>
          </div>
          {c.certificate_url && (
            <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
              <a href={c.certificate_url} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5" /></a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ========== Insurance Tab ========== */
function InsuranceTab({ memberId }: { memberId: string }) {
  const { insurance, isLoading, addInsurance } = useEmployeeInsurance(memberId);
  const [showForm, setShowForm] = useState(false);
  const [insType, setInsType] = useState('social');
  const [insNumber, setInsNumber] = useState('');
  const [insProvider, setInsProvider] = useState('');
  const [startDate, setStartDate] = useState('');
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    let docUrl: string | null = null;
    const file = fileRef.current?.files?.[0];
    if (file && profile?.organization_id) {
      setUploading(true);
      try {
        docUrl = await uploadEmployeeFile(profile.organization_id, memberId, file);
      } catch { /* ignore */ }
      setUploading(false);
    }
    addInsurance.mutate({
      member_id: memberId,
      insurance_type: insType,
      insurance_number: insNumber || null,
      provider: insProvider || null,
      start_date: startDate || null,
      end_date: null,
      document_url: docUrl,
      notes: null,
    });
    setShowForm(false);
    setInsNumber('');
    setInsProvider('');
    setStartDate('');
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="w-full gap-1">
        <Upload className="w-4 h-4" /> إضافة تأمين
      </Button>

      {showForm && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          <Select value={insType} onValueChange={setInsType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(INSURANCE_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="رقم التأمين" value={insNumber} onChange={e => setInsNumber(e.target.value)} />
          <Input placeholder="الجهة" value={insProvider} onChange={e => setInsProvider(e.target.value)} />
          <Input type="date" placeholder="تاريخ البدء" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="text-sm w-full" />
          <Button size="sm" onClick={handleAdd} disabled={uploading || addInsurance.isPending} className="w-full">
            {uploading ? 'جاري الرفع...' : 'حفظ'}
          </Button>
        </div>
      )}

      {insurance.length === 0 && !showForm && (
        <p className="text-center text-sm text-muted-foreground py-6">لا توجد بيانات تأمين</p>
      )}

      {insurance.map(ins => (
        <div key={ins.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{INSURANCE_TYPE_LABELS[ins.insurance_type] || ins.insurance_type}</p>
            <p className="text-xs text-muted-foreground">
              {ins.insurance_number && `#${ins.insurance_number}`}
              {ins.provider && ` • ${ins.provider}`}
              {ins.start_date && ` • من ${format(new Date(ins.start_date), 'yyyy/MM/dd')}`}
            </p>
          </div>
          {ins.document_url && (
            <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
              <a href={ins.document_url} target="_blank" rel="noopener"><ExternalLink className="w-3.5 h-3.5" /></a>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ========== Shared ========== */
function InfoRow({ icon: Icon, label, value, dir }: { icon: any; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 text-right">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium" dir={dir}>{value}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
    </div>
  );
}
