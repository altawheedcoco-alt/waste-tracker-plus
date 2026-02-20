import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Truck,
  Recycle,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const { toast } = useToast();

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.organizationName) newErrors.organizationName = 'مطلوب';
    if (!formData.organizationType) newErrors.organizationType = 'مطلوب';
    if (!formData.organizationPhone) newErrors.organizationPhone = 'مطلوب';
    if (!formData.organizationEmail) newErrors.organizationEmail = 'مطلوب';
    if (!formData.representativeName) newErrors.representativeName = 'مطلوب';
    if (!formData.commercialRegister) newErrors.commercialRegister = 'مطلوب';
    if (!formData.email) newErrors.email = 'مطلوب';
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    if (!formData.address) newErrors.address = 'مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        fullName: formData.representativeName,
        phone: formData.organizationPhone,
        city: formData.address.split(',')[0] || 'غير محدد',
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

      {/* Form Grid - Similar to reference image */}
      <div className="grid grid-cols-2 gap-3">
        {/* اسم الشركة */}
        <div className="space-y-1">
          <Label className="text-xs">اسم الشركة *</Label>
          <Input
            placeholder="أدخل اسم الشركة"
            value={formData.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            className={`h-8 text-xs ${errors.organizationName ? 'border-destructive' : ''}`}
          />
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
          />
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
          />
        </div>

        {/* الشخص المسؤول */}
        <div className="space-y-1">
          <Label className="text-xs">الشخص المسؤول *</Label>
          <Input
            placeholder="اسم الشخص المسؤول"
            value={formData.representativeName}
            onChange={(e) => handleChange('representativeName', e.target.value)}
            className={`h-8 text-xs ${errors.representativeName ? 'border-destructive' : ''}`}
          />
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
          />
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
          />
        </div>

        {/* اسم المستخدم */}
        <div className="space-y-1">
          <Label className="text-xs">اسم المستخدم *</Label>
          <Input
            type="email"
            placeholder="البريد الإلكتروني للدخول"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`h-8 text-xs ${errors.email ? 'border-destructive' : ''}`}
            dir="ltr"
          />
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
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
        />
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
        />
      </div>

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
          disabled={loading}
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
