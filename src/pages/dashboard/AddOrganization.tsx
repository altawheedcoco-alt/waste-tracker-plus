import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Factory, Truck, Recycle, Loader2, ArrowRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const AddOrganization = () => {
  const { user, refreshProfile, userOrganizations } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Redirect if user already has an organization
  useEffect(() => {
    if (userOrganizations && userOrganizations.length > 0) {
      toast.error('لديك منظمة مسجلة بالفعل. لا يمكنك إضافة منظمات جديدة.');
      navigate('/dashboard');
    }
  }, [userOrganizations, navigate]);
  
  const [formData, setFormData] = useState({
    organizationType: '' as 'generator' | 'transporter' | 'recycler' | '',
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!formData.organizationType || !formData.organizationName || !formData.organizationEmail || 
        !formData.organizationPhone || !formData.address || !formData.city) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('add-organization', {
        body: formData,
      });

      if (error) {
        // Try to extract the error message from the response
        const errorMessage = error.message || 'حدث خطأ أثناء إضافة المنظمة';
        toast.error(errorMessage);
        return;
      }
      
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('تم إضافة المنظمة بنجاح! ستتم مراجعتها من قبل الإدارة.');
      await refreshProfile();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error adding organization:', error);
      // Try to parse error message from response body
      let errorMessage = 'حدث خطأ أثناء إضافة المنظمة';
      if (error?.context?.body) {
        try {
          const body = JSON.parse(error.context.body);
          errorMessage = body.error || errorMessage;
        } catch {}
      } else if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const organizationTypes = [
    { value: 'generator', label: 'جهة مولّدة', icon: Factory, description: 'المنشآت التي تولّد النفايات' },
    { value: 'transporter', label: 'جهة ناقلة', icon: Truck, description: 'شركات نقل النفايات المرخصة' },
    { value: 'recycler', label: 'جهة معالجة', icon: Recycle, description: 'مصانع ومرافق إعادة التدوير' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">إضافة منظمة جديدة</h1>
              <p className="text-muted-foreground">أضف منظمة إضافية لحسابك للتبديل بينها</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Organization Type */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>نوع المنظمة</CardTitle>
                    <CardDescription>اختر نوع المنظمة التي تريد إضافتها</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    {organizationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, organizationType: type.value as any });
                            setStep(2);
                          }}
                          className={`p-6 rounded-xl border-2 text-center transition-all hover:border-primary hover:bg-primary/5 ${
                            formData.organizationType === type.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border'
                          }`}
                        >
                          <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                          <h3 className="font-semibold text-lg mb-2">{type.label}</h3>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>البيانات الأساسية</CardTitle>
                    <CardDescription>أدخل بيانات المنظمة الأساسية</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">اسم المنظمة (عربي) *</Label>
                        <Input
                          id="organizationName"
                          value={formData.organizationName}
                          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                          placeholder="اسم الشركة بالعربية"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationNameEn">اسم المنظمة (إنجليزي)</Label>
                        <Input
                          id="organizationNameEn"
                          value={formData.organizationNameEn}
                          onChange={(e) => setFormData({ ...formData, organizationNameEn: e.target.value })}
                          placeholder="Company name in English"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="organizationEmail">البريد الإلكتروني *</Label>
                        <Input
                          id="organizationEmail"
                          type="email"
                          value={formData.organizationEmail}
                          onChange={(e) => setFormData({ ...formData, organizationEmail: e.target.value })}
                          placeholder="info@company.com"
                          dir="ltr"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationPhone">رقم الهاتف *</Label>
                        <Input
                          id="organizationPhone"
                          value={formData.organizationPhone}
                          onChange={(e) => setFormData({ ...formData, organizationPhone: e.target.value })}
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">المدينة *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="الرياض"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">المنطقة</Label>
                        <Input
                          id="region"
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          placeholder="المنطقة الوسطى"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">العنوان التفصيلي *</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="العنوان بالتفصيل"
                        required
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="commercialRegister">رقم السجل التجاري</Label>
                        <Input
                          id="commercialRegister"
                          value={formData.commercialRegister}
                          onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                          placeholder="رقم السجل التجاري"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="environmentalLicense">رقم الترخيص البيئي</Label>
                        <Input
                          id="environmentalLicense"
                          value={formData.environmentalLicense}
                          onChange={(e) => setFormData({ ...formData, environmentalLicense: e.target.value })}
                          placeholder="رقم الترخيص البيئي"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        السابق
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setStep(3)}
                        disabled={!formData.organizationName || !formData.organizationEmail || !formData.organizationPhone || !formData.address || !formData.city}
                      >
                        التالي
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Representative Info */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>بيانات الممثل القانوني</CardTitle>
                    <CardDescription>بيانات المفوض بالتوقيع (اختياري)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="representativeName">اسم الممثل القانوني</Label>
                        <Input
                          id="representativeName"
                          value={formData.representativeName}
                          onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                          placeholder="الاسم الكامل"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="representativePosition">المنصب</Label>
                        <Input
                          id="representativePosition"
                          value={formData.representativePosition}
                          onChange={(e) => setFormData({ ...formData, representativePosition: e.target.value })}
                          placeholder="المدير العام"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="representativePhone">رقم الهاتف</Label>
                        <Input
                          id="representativePhone"
                          value={formData.representativePhone}
                          onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
                          placeholder="05xxxxxxxx"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="representativeNationalId">رقم الهوية</Label>
                        <Input
                          id="representativeNationalId"
                          value={formData.representativeNationalId}
                          onChange={(e) => setFormData({ ...formData, representativeNationalId: e.target.value })}
                          placeholder="رقم الهوية الوطنية"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        السابق
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            جاري الإضافة...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 ml-2" />
                            إضافة المنظمة
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AddOrganization;
