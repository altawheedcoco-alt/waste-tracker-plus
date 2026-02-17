import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShieldCheck, Building2, User, Briefcase, FlaskConical, Award,
  Phone, Mail, Globe, MapPin, FileText, ArrowLeft, ArrowRight,
  Loader2, CheckCircle2, Microscope, GraduationCap, Scale,
  BookOpen, Leaf, Factory, TestTube, ClipboardCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ENTITY_TYPES = [
  { value: 'individual', label: 'استشاري فرد مستقل', icon: User, description: 'مهندس أو خبير بيئي يعمل بشكل مستقل' },
  { value: 'consulting_firm', label: 'شركة استشارات بيئية', icon: Building2, description: 'مكتب أو شركة تقدم خدمات استشارية متعددة' },
  { value: 'certification_body', label: 'جهة مانحة للشهادات', icon: Award, description: 'جهة اعتماد ISO أو شهادات بيئية' },
  { value: 'laboratory', label: 'مختبر قياسات ومعايرة', icon: Microscope, description: 'مختبر فحص الانبعاثات وجودة الهواء والمياه' },
];

const SPECIALIZATIONS = [
  { value: 'hazardous_waste', label: 'مخلفات خطرة' },
  { value: 'recycling', label: 'إعادة التدوير' },
  { value: 'environmental_impact', label: 'تقييم الأثر البيئي' },
  { value: 'industrial_waste', label: 'مخلفات صناعية' },
  { value: 'medical_waste', label: 'مخلفات طبية' },
  { value: 'air_quality', label: 'جودة الهواء والانبعاثات' },
  { value: 'water_quality', label: 'جودة المياه والصرف' },
  { value: 'soil_remediation', label: 'معالجة التربة' },
  { value: 'noise_measurement', label: 'قياسات الضوضاء' },
  { value: 'occupational_safety', label: 'السلامة والصحة المهنية' },
  { value: 'general', label: 'استشارات بيئية عامة' },
];

const SERVICE_OPTIONS = [
  { value: 'environmental_consulting', label: 'استشارات بيئية وتقارير', icon: FileText },
  { value: 'eia_studies', label: 'دراسات تقييم الأثر البيئي', icon: ClipboardCheck },
  { value: 'iso_certification', label: 'منح شهادات ISO', icon: Award },
  { value: 'iso_14001', label: 'ISO 14001 - نظام الإدارة البيئية', icon: Leaf },
  { value: 'iso_45001', label: 'ISO 45001 - السلامة والصحة المهنية', icon: ShieldCheck },
  { value: 'iso_9001', label: 'ISO 9001 - إدارة الجودة', icon: CheckCircle2 },
  { value: 'emissions_testing', label: 'قياس الانبعاثات الغازية', icon: Factory },
  { value: 'water_testing', label: 'تحليل جودة المياه', icon: TestTube },
  { value: 'air_quality_monitoring', label: 'رصد جودة الهواء المحيط', icon: FlaskConical },
  { value: 'calibration', label: 'معايرة الأجهزة البيئية', icon: Scale },
  { value: 'noise_measurement', label: 'قياسات الضوضاء البيئية', icon: Microscope },
  { value: 'training', label: 'تدريب وتأهيل بيئي', icon: GraduationCap },
  { value: 'waste_management_plans', label: 'خطط إدارة المخلفات', icon: BookOpen },
  { value: 'compliance_audits', label: 'تدقيق الامتثال البيئي', icon: ClipboardCheck },
];

const SECTORS = [
  'صناعي', 'طبي', 'غذائي', 'بترولي', 'تعديني', 'إنشائي',
  'زراعي', 'سياحي وفندقي', 'تجاري', 'حكومي', 'تعليمي',
];

const ISO_STANDARDS = [
  'ISO 14001:2015', 'ISO 45001:2018', 'ISO 9001:2015',
  'ISO 14064', 'ISO 50001', 'ISO 22000', 'OHSAS 18001',
];

const ConsultantPortal = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    entity_type: '',
    // Personal/Contact
    full_name: profile?.full_name || '',
    full_name_en: '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    national_id: '',
    // Company
    company_name: '',
    company_name_en: '',
    commercial_register: '',
    tax_id: '',
    website: '',
    address: '',
    city: '',
    region: '',
    // Professional
    specialization: 'general',
    license_number: '',
    license_issuer: '',
    license_expiry: '',
    qualification: '',
    years_of_experience: 0,
    bio: '',
    // Services
    services: [] as string[],
    sectors_served: [] as string[],
    // Certification body
    accreditation_body: '',
    accreditation_number: '',
    accreditation_expiry: '',
    iso_standards_offered: [] as string[],
    // Training
    training_programs_offered: [] as string[],
  });

  const updateField = (field: string, value: any) => {
    setForm(p => ({ ...p, [field]: value }));
  };

  const toggleArrayField = (field: string, value: string) => {
    setForm(p => {
      const arr = (p as any)[field] as string[];
      return { ...p, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const isCompanyType = ['consulting_firm', 'certification_body', 'laboratory'].includes(form.entity_type);

  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error('يرجى تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('environmental_consultants').insert({
        user_id: session.user.id,
        entity_type: form.entity_type,
        full_name: form.full_name,
        full_name_en: form.full_name_en || null,
        email: form.email || null,
        phone: form.phone || null,
        national_id: form.national_id || null,
        company_name: form.company_name || null,
        company_name_en: form.company_name_en || null,
        commercial_register: form.commercial_register || null,
        tax_id: form.tax_id || null,
        website: form.website || null,
        address: form.address || null,
        city: form.city || null,
        region: form.region || null,
        specialization: form.specialization,
        license_number: form.license_number || null,
        license_issuer: form.license_issuer || null,
        license_expiry: form.license_expiry || null,
        qualification: form.qualification || null,
        years_of_experience: form.years_of_experience || null,
        bio: form.bio || null,
        services: form.services,
        sectors_served: form.sectors_served,
        accreditation_body: form.accreditation_body || null,
        accreditation_number: form.accreditation_number || null,
        accreditation_expiry: form.accreditation_expiry || null,
        iso_standards_offered: form.iso_standards_offered,
        training_programs_offered: form.training_programs_offered,
      } as any);

      if (error) throw error;

      toast.success('تم تسجيلك بنجاح! سيتم مراجعة طلبك وتفعيله قريباً');
      navigate('/dashboard/environmental-consultants');
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ في التسجيل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: 'نوع الكيان', icon: Building2 },
    { title: 'البيانات الأساسية', icon: User },
    { title: 'المؤهلات والتراخيص', icon: Award },
    { title: 'الخدمات والقطاعات', icon: Briefcase },
    { title: 'مراجعة وتأكيد', icon: CheckCircle2 },
  ];

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.entity_type;
      case 1: return !!form.full_name && !!form.phone;
      case 2: return true;
      case 3: return form.services.length > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/20" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-emerald-600 to-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">بوابة الاستشاريين البيئيين</h1>
              <p className="text-emerald-100 text-sm mt-1">سجّل كاستشاري بيئي معتمد أو شركة استشارات أو جهة مانحة للشهادات</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    i === step
                      ? 'bg-white text-emerald-700 shadow-lg'
                      : i < step
                      ? 'bg-white/30 text-white cursor-pointer hover:bg-white/40'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.title}
                </button>
                {i < steps.length - 1 && <ArrowLeft className="w-3 h-3 text-white/30" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 0: Entity Type */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">اختر نوع الكيان</h2>
            <p className="text-muted-foreground text-sm">حدد نوع النشاط الذي تمثله للتسجيل في المنصة</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {ENTITY_TYPES.map(t => (
                <Card
                  key={t.value}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    form.entity_type === t.value ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' : ''
                  }`}
                  onClick={() => updateField('entity_type', t.value)}
                >
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      form.entity_type === t.value ? 'bg-emerald-500 text-white' : 'bg-muted'
                    }`}>
                      <t.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{t.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                    </div>
                    {form.entity_type === t.value && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> البيانات الأساسية</CardTitle>
              <CardDescription>
                {isCompanyType ? 'بيانات الشركة أو المكتب ومسؤول التواصل' : 'بياناتك الشخصية ومعلومات التواصل'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCompanyType && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الشركة/المكتب بالعربية *</Label>
                      <Input value={form.company_name} onChange={e => updateField('company_name', e.target.value)} placeholder="شركة فرست للاستشارات والمعايرة" />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الشركة بالإنجليزية</Label>
                      <Input value={form.company_name_en} onChange={e => updateField('company_name_en', e.target.value)} dir="ltr" placeholder="First Consulting & Calibration" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>السجل التجاري</Label>
                      <Input value={form.commercial_register} onChange={e => updateField('commercial_register', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>البطاقة الضريبية</Label>
                      <Input value={form.tax_id} onChange={e => updateField('tax_id', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>الموقع الإلكتروني</Label>
                    <Input value={form.website} onChange={e => updateField('website', e.target.value)} dir="ltr" placeholder="https://www.example.com" />
                  </div>
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">بيانات مسؤول التواصل</p>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isCompanyType ? 'اسم المسؤول بالعربية *' : 'الاسم بالعربية *'}</Label>
                  <Input value={form.full_name} onChange={e => updateField('full_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الاسم بالإنجليزية</Label>
                  <Input value={form.full_name_en} onChange={e => updateField('full_name_en', e.target.value)} dir="ltr" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهوية</Label>
                  <Input value={form.national_id} onChange={e => updateField('national_id', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف *</Label>
                  <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={form.email} onChange={e => updateField('email', e.target.value)} dir="ltr" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input value={form.city} onChange={e => updateField('city', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المنطقة/المحافظة</Label>
                  <Input value={form.region} onChange={e => updateField('region', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>العنوان التفصيلي</Label>
                  <Input value={form.address} onChange={e => updateField('address', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Qualifications */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5" /> المؤهلات والتراخيص</CardTitle>
              <CardDescription>أدخل بيانات التراخيص والاعتمادات والمؤهلات المهنية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>التخصص الرئيسي</Label>
                  <Select value={form.specialization} onValueChange={v => updateField('specialization', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>سنوات الخبرة</Label>
                  <Input type="number" value={form.years_of_experience} onChange={e => updateField('years_of_experience', parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>رقم ترخيص المزاولة</Label>
                  <Input value={form.license_number} onChange={e => updateField('license_number', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>جهة إصدار الترخيص</Label>
                  <Input value={form.license_issuer} onChange={e => updateField('license_issuer', e.target.value)} placeholder="جهاز شؤون البيئة" />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ انتهاء الترخيص</Label>
                  <Input type="date" value={form.license_expiry} onChange={e => updateField('license_expiry', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>المؤهل العلمي</Label>
                <Input value={form.qualification} onChange={e => updateField('qualification', e.target.value)} placeholder="بكالوريوس هندسة بيئية - جامعة القاهرة" />
              </div>

              {(form.entity_type === 'certification_body' || form.entity_type === 'laboratory') && (
                <>
                  <Separator />
                  <h3 className="font-semibold text-sm text-muted-foreground">بيانات الاعتماد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>جهة الاعتماد</Label>
                      <Input value={form.accreditation_body} onChange={e => updateField('accreditation_body', e.target.value)} placeholder="EGAC / DAkkS / UKAS" />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الاعتماد</Label>
                      <Input value={form.accreditation_number} onChange={e => updateField('accreditation_number', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ انتهاء الاعتماد</Label>
                      <Input type="date" value={form.accreditation_expiry} onChange={e => updateField('accreditation_expiry', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {form.entity_type === 'certification_body' && (
                <>
                  <Separator />
                  <h3 className="font-semibold text-sm text-muted-foreground">المواصفات المعتمد لها المنح</h3>
                  <div className="flex flex-wrap gap-2">
                    {ISO_STANDARDS.map(std => (
                      <Badge
                        key={std}
                        variant={form.iso_standards_offered.includes(std) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleArrayField('iso_standards_offered', std)}
                      >
                        {std}
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>نبذة مختصرة عن النشاط</Label>
                <Textarea value={form.bio} onChange={e => updateField('bio', e.target.value)} rows={3}
                  placeholder="وصف مختصر عن خبراتك وخدماتك والجهات التي عملت معها..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Services */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> الخدمات المقدمة *</CardTitle>
                <CardDescription>اختر الخدمات التي يمكنك تقديمها عبر المنصة (يمكنك اختيار أكثر من خدمة)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.map(svc => (
                    <div
                      key={svc.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        form.services.includes(svc.value)
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'hover:border-muted-foreground/30'
                      }`}
                      onClick={() => toggleArrayField('services', svc.value)}
                    >
                      <Checkbox checked={form.services.includes(svc.value)} />
                      <svc.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{svc.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5" /> القطاعات المخدومة</CardTitle>
                <CardDescription>حدد القطاعات التي لديك خبرة في خدمتها</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(sec => (
                    <Badge
                      key={sec}
                      variant={form.sectors_served.includes(sec) ? 'default' : 'outline'}
                      className="cursor-pointer text-sm py-1.5 px-3"
                      onClick={() => toggleArrayField('sectors_served', sec)}
                    >
                      {sec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> مراجعة البيانات</CardTitle>
              <CardDescription>تأكد من صحة جميع البيانات قبل الإرسال</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> نوع الكيان</h3>
                  <Badge variant="secondary" className="text-sm">
                    {ENTITY_TYPES.find(t => t.value === form.entity_type)?.label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4" /> البيانات</h3>
                  <div className="text-sm space-y-1">
                    {form.company_name && <p><strong>الشركة:</strong> {form.company_name}</p>}
                    <p><strong>الاسم:</strong> {form.full_name}</p>
                    <p><strong>الهاتف:</strong> {form.phone}</p>
                    {form.email && <p><strong>البريد:</strong> {form.email}</p>}
                    {form.city && <p><strong>المدينة:</strong> {form.city}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Award className="w-4 h-4" /> المؤهلات</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>التخصص:</strong> {SPECIALIZATIONS.find(s => s.value === form.specialization)?.label}</p>
                    {form.license_number && <p><strong>الترخيص:</strong> {form.license_number}</p>}
                    {form.qualification && <p><strong>المؤهل:</strong> {form.qualification}</p>}
                    {form.years_of_experience > 0 && <p><strong>الخبرة:</strong> {form.years_of_experience} سنة</p>}
                    {form.accreditation_body && <p><strong>جهة الاعتماد:</strong> {form.accreditation_body}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4" /> الخدمات</h3>
                  <div className="flex flex-wrap gap-1">
                    {form.services.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {SERVICE_OPTIONS.find(o => o.value === s)?.label}
                      </Badge>
                    ))}
                  </div>
                  {form.sectors_served.length > 0 && (
                    <>
                      <h4 className="text-xs text-muted-foreground mt-2">القطاعات</h4>
                      <div className="flex flex-wrap gap-1">
                        {form.sectors_served.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    </>
                  )}
                  {form.iso_standards_offered.length > 0 && (
                    <>
                      <h4 className="text-xs text-muted-foreground mt-2">معايير ISO</h4>
                      <div className="flex flex-wrap gap-1">
                        {form.iso_standards_offered.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {!session?.user && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                    ⚠️ يرجى تسجيل الدخول أولاً قبل إرسال الطلب
                  </p>
                  <Button variant="outline" className="mt-2" onClick={() => navigate('/auth')}>
                    تسجيل الدخول
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            {step === 0 ? 'رجوع' : 'السابق'}
          </Button>

          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !session?.user}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              إرسال الطلب
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantPortal;
