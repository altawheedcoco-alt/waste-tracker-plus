import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck, UserPlus, Building2, FileText, Award,
  Phone, Mail, Calendar, Loader2, Upload, Eye, Trash2,
  Briefcase, GraduationCap, Hash, User, CheckCircle2,
} from 'lucide-react';
import { useEnvironmentalConsultants, type ConsultantAssignment } from '@/hooks/useEnvironmentalConsultants';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import BackButton from '@/components/ui/back-button';

const SPECIALIZATIONS = [
  { value: 'hazardous_waste', label: 'مخلفات خطرة' },
  { value: 'recycling', label: 'إعادة التدوير' },
  { value: 'environmental_impact', label: 'تقييم الأثر البيئي' },
  { value: 'industrial_waste', label: 'مخلفات صناعية' },
  { value: 'medical_waste', label: 'مخلفات طبية' },
  { value: 'general', label: 'استشارات بيئية عامة' },
];

const DOC_TYPES = [
  { value: 'license', label: 'ترخيص مزاولة' },
  { value: 'certificate', label: 'شهادة تخصص' },
  { value: 'qualification', label: 'مؤهل دراسي' },
  { value: 'id_card', label: 'بطاقة هوية' },
  { value: 'other', label: 'أخرى' },
];

const EnvironmentalConsultants = () => {
  const { profile, organization } = useAuth();
  const {
    consultants, isLoading, myConsultantProfile,
    registerConsultant, assignConsultant, removeAssignment,
    uploadCredential, fetchCredentials,
  } = useEnvironmentalConsultants();

  const [showRegister, setShowRegister] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDetails, setShowDetails] = useState<ConsultantAssignment | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);

  // Register form
  const [regForm, setRegForm] = useState({
    full_name: profile?.full_name || '',
    full_name_en: '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    national_id: '',
    specialization: 'general',
    license_number: '',
    license_issuer: '',
    license_expiry: '',
    qualification: '',
    years_of_experience: 0,
    bio: '',
  });

  // Assign form
  const [assignForm, setAssignForm] = useState({
    consultant_user_id: '',
    role_title: 'استشاري بيئي',
  });

  const handleRegister = () => {
    registerConsultant.mutate(regForm as any, {
      onSuccess: () => setShowRegister(false),
    });
  };

  const handleViewDetails = async (assignment: ConsultantAssignment) => {
    setShowDetails(assignment);
    if (assignment.consultant?.id) {
      setLoadingCreds(true);
      try {
        const creds = await fetchCredentials(assignment.consultant.id);
        setCredentials(creds);
      } catch { setCredentials([]); }
      finally { setLoadingCreds(false); }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
                الاستشاريون البيئيون
              </h1>
              <p className="text-muted-foreground text-sm">إدارة الاستشاريين البيئيين المعتمدين للتوقيع على المستندات والشهادات</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!myConsultantProfile && (
              <Button onClick={() => setShowRegister(true)} className="gap-2">
                <UserPlus className="w-4 h-4" />
                تسجيل كاستشاري
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAssign(true)} className="gap-2">
              <Building2 className="w-4 h-4" />
              تعيين استشاري
            </Button>
          </div>
        </div>

        {/* My Consultant Profile Card */}
        {myConsultantProfile && (
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Award className="w-5 h-5" />
                ملفك كاستشاري بيئي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 items-start">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">الكود</p>
                    <p className="font-mono font-bold text-emerald-700">{myConsultantProfile.consultant_code}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">التخصص</p>
                    <p>{SPECIALIZATIONS.find(s => s.value === myConsultantProfile.specialization)?.label || myConsultantProfile.specialization}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">رقم الترخيص</p>
                    <p>{myConsultantProfile.license_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">الحالة</p>
                    <Badge variant={myConsultantProfile.is_active ? 'default' : 'secondary'}>
                      {myConsultantProfile.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-3 items-center">
                  <QRCodeSVG value={`EC:${myConsultantProfile.consultant_code}`} size={60} />
                  <Barcode value={myConsultantProfile.consultant_code || 'EC'} width={1} height={35} fontSize={8} displayValue={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Consultants List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              الاستشاريون المعتمدون لـ {organization?.name}
            </CardTitle>
            <CardDescription>
              الاستشاريون البيئيون المعينون لهذه الجهة للتوقيع والختم على المستندات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : consultants.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لم يتم تعيين استشاريين بيئيين بعد</p>
                <p className="text-xs mt-1">قم بتعيين استشاري بيئي لاعتماد المستندات والشهادات</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultants.map((assignment) => {
                  const c = assignment.consultant as any as import('@/hooks/useEnvironmentalConsultants').EnvironmentalConsultant | undefined;
                  if (!c) return null;
                  return (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                              <User className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{c.full_name}</p>
                              <p className="text-xs text-muted-foreground">{assignment.role_title}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs font-mono">
                            {c.consultant_code}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground mb-3">
                          {c.specialization && (
                            <p className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {SPECIALIZATIONS.find(s => s.value === c.specialization)?.label || c.specialization}
                            </p>
                          )}
                          {c.license_number && (
                            <p className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              ترخيص: {c.license_number}
                            </p>
                          )}
                          {c.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {c.phone}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {assignment.can_sign_certificates && <Badge variant="secondary" className="text-[10px]">شهادات</Badge>}
                          {assignment.can_sign_permits && <Badge variant="secondary" className="text-[10px]">تصاريح</Badge>}
                          {assignment.can_sign_shipments && <Badge variant="secondary" className="text-[10px]">شحنات</Badge>}
                          {assignment.can_sign_reports && <Badge variant="secondary" className="text-[10px]">تقارير</Badge>}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleViewDetails(assignment)}>
                            <Eye className="w-3 h-3" />
                            التفاصيل
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => removeAssignment.mutate(assignment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Register Dialog */}
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                تسجيل كاستشاري بيئي
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم بالعربية *</Label>
                    <Input value={regForm.full_name} onChange={e => setRegForm(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالإنجليزية</Label>
                    <Input value={regForm.full_name_en} onChange={e => setRegForm(p => ({ ...p, full_name_en: e.target.value }))} dir="ltr" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم الهوية</Label>
                    <Input value={regForm.national_id} onChange={e => setRegForm(p => ({ ...p, national_id: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>التخصص *</Label>
                    <Select value={regForm.specialization} onValueChange={v => setRegForm(p => ({ ...p, specialization: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رقم ترخيص المزاولة</Label>
                    <Input value={regForm.license_number} onChange={e => setRegForm(p => ({ ...p, license_number: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>جهة إصدار الترخيص</Label>
                    <Input value={regForm.license_issuer} onChange={e => setRegForm(p => ({ ...p, license_issuer: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ انتهاء الترخيص</Label>
                    <Input type="date" value={regForm.license_expiry} onChange={e => setRegForm(p => ({ ...p, license_expiry: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>سنوات الخبرة</Label>
                    <Input type="number" value={regForm.years_of_experience} onChange={e => setRegForm(p => ({ ...p, years_of_experience: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>المؤهل العلمي</Label>
                  <Input value={regForm.qualification} onChange={e => setRegForm(p => ({ ...p, qualification: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label>نبذة مختصرة</Label>
                  <Textarea value={regForm.bio} onChange={e => setRegForm(p => ({ ...p, bio: e.target.value }))} rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الهاتف</Label>
                    <Input value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegister(false)}>إلغاء</Button>
              <Button onClick={handleRegister} disabled={registerConsultant.isPending || !regForm.full_name} className="gap-2">
                {registerConsultant.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                تسجيل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Consultant Dialog */}
        <Dialog open={showAssign} onOpenChange={setShowAssign}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                تعيين استشاري بيئي
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>كود الاستشاري أو معرف المستخدم</Label>
                <Input
                  value={assignForm.consultant_user_id}
                  onChange={e => setAssignForm(p => ({ ...p, consultant_user_id: e.target.value }))}
                  placeholder="أدخل كود الاستشاري (EC-XXXX-XXXXXX)"
                />
                <p className="text-xs text-muted-foreground">يمكن للاستشاري مشاركة كوده معك من ملفه الشخصي</p>
              </div>
              <div className="space-y-2">
                <Label>المسمى الوظيفي</Label>
                <Input
                  value={assignForm.role_title}
                  onChange={e => setAssignForm(p => ({ ...p, role_title: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssign(false)}>إلغاء</Button>
              <Button
                onClick={async () => {
                  // Look up consultant by code
                  const { data } = await (await import('@/integrations/supabase/client')).supabase
                    .from('environmental_consultants')
                    .select('id')
                    .eq('consultant_code', assignForm.consultant_user_id)
                    .maybeSingle();
                  if (data) {
                    assignConsultant.mutate({ consultant_id: data.id, role_title: assignForm.role_title }, {
                      onSuccess: () => setShowAssign(false),
                    });
                  } else {
                    (await import('sonner')).toast.error('لم يتم العثور على استشاري بهذا الكود');
                  }
                }}
                disabled={assignConsultant.isPending || !assignForm.consultant_user_id}
                className="gap-2"
              >
                {assignConsultant.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                تعيين
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Consultant Details Dialog */}
        <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            {showDetails?.consultant && (() => {
              const c = showDetails.consultant as any as import('@/hooks/useEnvironmentalConsultants').EnvironmentalConsultant;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      {c.full_name}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    <Tabs defaultValue="info" className="w-full">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="info">المعلومات</TabsTrigger>
                        <TabsTrigger value="credentials">الأوراق والمستندات</TabsTrigger>
                      </TabsList>

                      <TabsContent value="info" className="space-y-4 mt-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <User className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{c.full_name}</p>
                            {c.full_name_en && <p className="text-sm text-muted-foreground" dir="ltr">{c.full_name_en}</p>}
                            <Badge variant="outline" className="font-mono mt-1">{c.consultant_code}</Badge>
                          </div>
                          <div className="mr-auto">
                            <QRCodeSVG value={`EC:${c.consultant_code}`} size={70} />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">التخصص</p>
                              <p>{SPECIALIZATIONS.find(s => s.value === c.specialization)?.label || c.specialization || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">المؤهل</p>
                              <p>{c.qualification || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">رقم الترخيص</p>
                              <p>{c.license_number || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">جهة الإصدار</p>
                              <p>{c.license_issuer || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">انتهاء الترخيص</p>
                              <p>{c.license_expiry ? format(new Date(c.license_expiry), 'PP', { locale: ar }) : '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">سنوات الخبرة</p>
                              <p>{c.years_of_experience || '-'}</p>
                            </div>
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">الهاتف</p>
                                <p>{c.phone}</p>
                              </div>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">البريد</p>
                                <p>{c.email}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {c.bio && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium mb-1">نبذة</p>
                              <p className="text-sm text-muted-foreground">{c.bio}</p>
                            </div>
                          </>
                        )}

                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-2">صلاحيات التوقيع</p>
                          <div className="flex flex-wrap gap-2">
                            {showDetails.can_sign_certificates && (
                              <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> شهادات</Badge>
                            )}
                            {showDetails.can_sign_permits && (
                              <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> تصاريح</Badge>
                            )}
                            {showDetails.can_sign_shipments && (
                              <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> شحنات</Badge>
                            )}
                            {showDetails.can_sign_reports && (
                              <Badge className="gap-1"><CheckCircle2 className="w-3 h-3" /> تقارير</Badge>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="credentials" className="mt-4">
                        {loadingCreds ? (
                          <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : credentials.length === 0 ? (
                          <div className="text-center p-8 text-muted-foreground">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>لم يتم رفع مستندات بعد</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {credentials.map((cred: any) => (
                              <Card key={cred.id}>
                                <CardContent className="p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <div>
                                      <p className="font-medium text-sm">{cred.document_name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {DOC_TYPES.find(d => d.value === cred.document_type)?.label || cred.document_type}
                                        {cred.expiry_date && ` • ينتهي: ${format(new Date(cred.expiry_date), 'PP', { locale: ar })}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {cred.is_verified && (
                                      <Badge variant="default" className="gap-1 text-xs">
                                        <CheckCircle2 className="w-3 h-3" /> موثق
                                      </Badge>
                                    )}
                                    <Button size="sm" variant="ghost" asChild>
                                      <a href={cred.document_url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </ScrollArea>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default EnvironmentalConsultants;
