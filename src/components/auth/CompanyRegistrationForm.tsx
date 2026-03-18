import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import RegistrationTermsAcceptance from './RegistrationTermsAcceptance';
import { companyRegistrationSchema } from './companyRegistrationSchema';
import { ZodError } from 'zod';

interface CompanyRegistrationFormProps {
  onSubmit: (data: CompanyFormData) => Promise<{ error: Error | null }>;
  onBack: () => void;
  defaultOrgType?: string;
}

export interface CompanyFormData {
  organizationType: string;
  organizationName: string;
  organizationNameEn: string;
  organizationEmail: string;
  organizationPhone: string;
  secondaryPhone: string;
  address: string;
  city: string;
  region: string;
  commercialRegister: string;
  environmentalLicense: string;
  activityType: string;
  productionCapacity: string;
  representativeName: string;
  representativePosition: string;
  representativePhone: string;
  representativeEmail: string;
  representativeNationalId: string;
  delegateName: string;
  delegatePhone: string;
  delegateEmail: string;
  delegateNationalId: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentNationalId: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

const initialFormData: CompanyFormData = {
  organizationType: '',
  organizationName: '',
  organizationNameEn: '',
  organizationEmail: '',
  organizationPhone: '',
  secondaryPhone: '',
  address: '',
  city: '',
  region: '',
  commercialRegister: '',
  environmentalLicense: '',
  activityType: '',
  productionCapacity: '',
  representativeName: '',
  representativePosition: '',
  representativePhone: '',
  representativeEmail: '',
  representativeNationalId: '',
  delegateName: '',
  delegatePhone: '',
  delegateEmail: '',
  delegateNationalId: '',
  agentName: '',
  agentPhone: '',
  agentEmail: '',
  agentNationalId: '',
  email: '',
  password: '',
  fullName: '',
  phone: '',
};

const organizationTypes = [
  { value: 'generator', label: 'الجهة المولدة' },
  { value: 'recycler', label: 'الجهة المدورة' },
  { value: 'transporter', label: 'الجهة الناقلة' },
  { value: 'transport_office', label: 'مكتب نقل' },
  { value: 'disposal', label: 'جهة التخلص الآمن' },
  { value: 'consultant', label: 'استشاري بيئي' },
  { value: 'consulting_office', label: 'مكتب استشاري' },
  { value: 'iso_body', label: 'جهة مانحة للأيزو' },
];

export const CompanyRegistrationForm = ({ onSubmit, onBack, defaultOrgType }: CompanyRegistrationFormProps) => {
  // Auto-save support
  const autoSaveKey = 'company_registration';
  const [formData, setFormData] = useState<CompanyFormData>(() => {
    try {
      const saved = localStorage.getItem(`form_autosave_${autoSaveKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialFormData, ...parsed, organizationType: defaultOrgType || parsed.organizationType || '' };
      }
    } catch {}
    return { ...initialFormData, organizationType: defaultOrgType || '' };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [regMethod, setRegMethod] = useState<'email' | 'phone'>('email');
  const [showRestoredBanner, setShowRestoredBanner] = useState(() => {
    try { return !!localStorage.getItem(`form_autosave_${autoSaveKey}`); } catch { return false; }
  });
  const { toast } = useToast();

  // Auto-save to localStorage on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const hasContent = Object.values(formData).some(v => typeof v === 'string' && v.trim().length > 0);
        if (hasContent) {
          localStorage.setItem(`form_autosave_${autoSaveKey}`, JSON.stringify(formData));
        }
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  // Beforeunload guard
  const isDirty = useMemo(() => {
    return Object.values(formData).some(v => typeof v === 'string' && v.trim().length > 0);
  }, [formData]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const clearAutoSave = () => {
    try { localStorage.removeItem(`form_autosave_${autoSaveKey}`); } catch {}
  };

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Inline validation: clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Inline validation on blur
  const handleBlur = (field: keyof CompanyFormData) => {
    const value = formData[field]?.trim();
    const newErrors = { ...errors };
    
    // Required field checks
    const requiredFields: Record<string, string> = {
      organizationName: 'يرجى إدخال اسم الشركة',
      organizationType: 'يرجى اختيار نوع الشركة',
      organizationPhone: 'يرجى إدخال رقم الهاتف',
      organizationEmail: 'يرجى إدخال البريد الإلكتروني',
      representativeName: 'يرجى إدخال اسم الشخص المسؤول',
      commercialRegister: 'يرجى إدخال رقم السجل التجاري',
      email: 'يرجى إدخال البريد الإلكتروني للدخول',
      password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      address: 'يرجى إدخال العنوان',
    };
    
    if (requiredFields[field] && !value) {
      newErrors[field] = requiredFields[field];
    } else if (field === 'password' && value && value.length < 6) {
      newErrors[field] = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    } else if ((field === 'email' || field === 'organizationEmail') && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors[field] = 'بريد إلكتروني غير صالح';
    } else if ((field === 'organizationPhone') && value && !/^[\d\s+\-()]{8,20}$/.test(value)) {
      newErrors[field] = 'رقم هاتف غير صالح';
    } else {
      delete newErrors[field];
    }
    
    setErrors(newErrors);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Trim all string fields before validation
    const trimmedData = { ...formData };
    for (const key of Object.keys(trimmedData) as (keyof CompanyFormData)[]) {
      if (typeof trimmedData[key] === 'string') {
        (trimmedData as any)[key] = trimmedData[key].trim();
      }
    }

    try {
      companyRegistrationSchema.parse({
        ...trimmedData,
        fullName: trimmedData.representativeName,
        phone: trimmedData.organizationPhone,
        city: trimmedData.address.split(',')[0]?.trim() || 'غير محدد',
      });
    } catch (err) {
      if (err instanceof ZodError) {
        for (const issue of err.issues) {
          const field = issue.path[0] as string;
          if (!newErrors[field]) {
            newErrors[field] = issue.message;
          }
        }
      }
    }

    if (!termsAccepted) newErrors.terms = 'يجب الموافقة على الشروط والأحكام';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Trim all data before submit
      const trimmedData = { ...formData };
      for (const key of Object.keys(trimmedData) as (keyof CompanyFormData)[]) {
        if (typeof trimmedData[key] === 'string') {
          (trimmedData as any)[key] = trimmedData[key].trim();
        }
      }

      const submitData = {
        ...trimmedData,
        fullName: trimmedData.representativeName,
        phone: trimmedData.organizationPhone,
        city: trimmedData.address.split(',')[0]?.trim() || 'غير محدد',
      };
      
      const { error } = await onSubmit(submitData);
      if (error) {
        toast({
          title: 'خطأ في التسجيل',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        clearAutoSave();
        toast({
          title: 'تم التسجيل بنجاح',
          description: 'سيتم مراجعة طلبك والرد عليك قريباً',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: string) => errors[field] ? (
    <p className="text-[10px] text-destructive mt-0.5">{errors[field]}</p>
  ) : null;

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      {/* Header */}
      <div className="text-center border-b pb-3">
        <h2 className="text-base font-bold flex items-center justify-center gap-2">
          <Building2 className="w-4 h-4" />
          تسجيل شركة جديدة
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          إضافة شركة تابعة (مولدة أو مدورة) مع البيانات القانونية الكاملة
        </p>
      </div>

      {/* Auto-save restored banner */}
      {showRestoredBanner && (
        <div className="flex items-center justify-between bg-muted/50 border border-border/50 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground">✨ تم استعادة البيانات المحفوظة تلقائياً</p>
          <button
            type="button"
            className="text-[10px] text-destructive hover:underline"
            onClick={() => {
              clearAutoSave();
              setFormData({ ...initialFormData, organizationType: defaultOrgType || '' });
              setShowRestoredBanner(false);
            }}
          >
            مسح وبدء من جديد
          </button>
        </div>
      )}

      {/* Form Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <div className="space-y-1">
          <Label className="text-xs">اسم الشركة *</Label>
          <Input
            placeholder="أدخل اسم الشركة"
            value={formData.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            onBlur={() => handleBlur('organizationName')}
            className={`h-8 text-xs ${errors.organizationName ? 'border-destructive' : ''}`}
            maxLength={200}
          />
          {fieldError('organizationName')}
        </div>

        {/* نوع الشركة */}
        <div className="space-y-1">
          <Label className="text-xs">نوع الشركة *</Label>
          <Select
            value={formData.organizationType}
            onValueChange={(value) => handleChange('organizationType', value)}
          >
            <SelectTrigger className={`h-8 text-xs ${errors.organizationType ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="اختر نوع الشركة" />
            </SelectTrigger>
            <SelectContent>
              {organizationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError('organizationType')}
        </div>

        {/* الهاتف */}
        <div className="space-y-1">
          <Label className="text-xs">الهاتف *</Label>
          <Input
            placeholder="رقم الهاتف"
            value={formData.organizationPhone}
            onChange={(e) => handleChange('organizationPhone', e.target.value)}
            onBlur={() => handleBlur('organizationPhone')}
            className={`h-8 text-xs ${errors.organizationPhone ? 'border-destructive' : ''}`}
            dir="ltr"
            inputMode="tel"
            maxLength={20}
          />
          {fieldError('organizationPhone')}
        </div>

        {/* البريد الإلكتروني */}
        <div className="space-y-1">
          <Label className="text-xs">البريد الإلكتروني *</Label>
          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={formData.organizationEmail}
            onChange={(e) => handleChange('organizationEmail', e.target.value)}
            onBlur={() => handleBlur('organizationEmail')}
            className={`h-8 text-xs ${errors.organizationEmail ? 'border-destructive' : ''}`}
            dir="ltr"
            maxLength={255}
          />
          {fieldError('organizationEmail')}
        </div>

        {/* الشخص المسؤول */}
        <div className="space-y-1">
          <Label className="text-xs">الشخص المسؤول *</Label>
          <Input
            placeholder="اسم الشخص المسؤول"
            value={formData.representativeName}
            onChange={(e) => handleChange('representativeName', e.target.value)}
            onBlur={() => handleBlur('representativeName')}
            className={`h-8 text-xs ${errors.representativeName ? 'border-destructive' : ''}`}
            maxLength={100}
          />
          {fieldError('representativeName')}
        </div>

        {/* البطاقة الضريبية */}
        <div className="space-y-1">
          <Label className="text-xs">البطاقة الضريبية</Label>
          <Input
            placeholder="رقم البطاقة الضريبية"
            value={formData.representativeNationalId}
            onChange={(e) => handleChange('representativeNationalId', e.target.value)}
            className="h-8 text-xs"
            dir="ltr"
            maxLength={20}
          />
        </div>

        {/* السجل التجاري */}
        <div className="space-y-1">
          <Label className="text-xs">السجل التجاري *</Label>
          <Input
            placeholder="رقم السجل التجاري"
            value={formData.commercialRegister}
            onChange={(e) => handleChange('commercialRegister', e.target.value)}
            onBlur={() => handleBlur('commercialRegister')}
            className={`h-8 text-xs ${errors.commercialRegister ? 'border-destructive' : ''}`}
            dir="ltr"
            maxLength={50}
          />
          {fieldError('commercialRegister')}
        </div>

        {/* رقم الترخيص */}
        <div className="space-y-1">
          <Label className="text-xs">رقم الترخيص</Label>
          <Input
            placeholder="رقم الترخيص"
            value={formData.environmentalLicense}
            onChange={(e) => handleChange('environmentalLicense', e.target.value)}
            className="h-8 text-xs"
            dir="ltr"
            maxLength={50}
          />
        </div>

        {/* رقم الموافقة البيئية */}
        <div className="space-y-1">
          <Label className="text-xs">رقم الموافقة البيئية</Label>
          <Input
            placeholder="رقم الموافقة البيئية"
            value={formData.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="h-8 text-xs"
            dir="ltr"
            maxLength={100}
          />
        </div>

        {/* رقم تسجيل المنشأة */}
        <div className="space-y-1">
          <Label className="text-xs">رقم تسجيل المنشأة</Label>
          <Input
            placeholder="رقم تسجيل المنشأة"
            value={formData.productionCapacity}
            onChange={(e) => handleChange('productionCapacity', e.target.value)}
            className="h-8 text-xs"
            dir="ltr"
            maxLength={100}
          />
        </div>

        {/* طريقة التسجيل */}
        <div className="col-span-2 space-y-1">
          <Label className="text-xs font-semibold">طريقة التسجيل *</Label>
          <Tabs value={regMethod} onValueChange={(v) => setRegMethod(v as 'email' | 'phone')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8 rounded-lg">
              <TabsTrigger value="email" className="rounded-md gap-1 text-xs">
                <Mail className="w-3 h-3" /> البريد الإلكتروني
              </TabsTrigger>
              <TabsTrigger value="phone" className="rounded-md gap-1 text-xs">
                <Phone className="w-3 h-3" /> رقم الهاتف
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* اسم المستخدم */}
        {regMethod === 'email' ? (
          <div className="space-y-1">
            <Label className="text-xs">البريد الإلكتروني للدخول *</Label>
            <Input
              type="email"
              placeholder="البريد الإلكتروني للدخول"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`h-8 text-xs ${errors.email ? 'border-destructive' : ''}`}
              dir="ltr"
              maxLength={255}
            />
            {fieldError('email')}
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs">رقم الهاتف للدخول *</Label>
            <Input
              placeholder="01xxxxxxxxx"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`h-8 text-xs ${errors.phone ? 'border-destructive' : ''}`}
              dir="ltr"
              inputMode="tel"
              maxLength={20}
            />
            {errors.phone && <p className="text-xs text-destructive mt-0.5">{errors.phone}</p>}
          </div>
        )}

        {/* كلمة المرور */}
        <div className="space-y-1">
          <Label className="text-xs">كلمة المرور *</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`h-8 text-xs pr-8 ${errors.password ? 'border-destructive' : ''}`}
              dir="ltr"
              maxLength={128}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {fieldError('password')}
        </div>
      </div>

      {/* العنوان - Full width */}
      <div className="space-y-1">
        <Label className="text-xs">العنوان *</Label>
        <Input
          placeholder="العنوان الكامل"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className={`h-8 text-xs ${errors.address ? 'border-destructive' : ''}`}
          maxLength={500}
        />
        {fieldError('address')}
      </div>

      {/* النشاط المسجل - Full width */}
      <div className="space-y-1">
        <Label className="text-xs">النشاط المسجل</Label>
        <Textarea
          placeholder="وصف النشاط المسجل للشركة"
          value={formData.activityType}
          onChange={(e) => handleChange('activityType', e.target.value)}
          className="text-xs min-h-[50px] resize-none"
          rows={2}
          maxLength={500}
        />
      </div>

      {/* Terms & Conditions */}
      <RegistrationTermsAcceptance
        accountType="company"
        onAcceptChange={(v) => { setTermsAccepted(v); if (errors.terms) setErrors(prev => ({ ...prev, terms: '' })); }}
      />
      {errors.terms && <p className="text-xs text-destructive text-center">{errors.terms}</p>}

      {/* Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          size="sm"
          className="flex-1"
        >
          إلغاء
        </Button>
        <Button
          type="button"
          variant="eco"
          onClick={handleSubmit}
          disabled={loading || !termsAccepted}
          size="sm"
          className="flex-1"
        >
          <Building2 className="ml-1 w-3 h-3" />
          {loading ? 'جاري الحفظ...' : 'حفظ الشركة'}
        </Button>
      </div>
    </div>
  );
};

export default CompanyRegistrationForm;
