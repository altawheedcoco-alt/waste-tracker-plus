import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [formData, setFormData] = useState<CompanyFormData>({
    ...initialFormData,
    organizationType: defaultOrgType || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
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

      {/* Form Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <div className="space-y-1">
          <Label className="text-xs">اسم الشركة *</Label>
          <Input
            placeholder="أدخل اسم الشركة"
            value={formData.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
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

        {/* اسم المستخدم */}
        <div className="space-y-1">
          <Label className="text-xs">اسم المستخدم (البريد الإلكتروني) *</Label>
          <Input
            type="email"
            placeholder="البريد الإلكتروني للدخول"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`h-8 text-xs ${errors.email ? 'border-destructive' : ''}`}
            dir="ltr"
            maxLength={255}
          />
          {fieldError('email')}
        </div>

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
