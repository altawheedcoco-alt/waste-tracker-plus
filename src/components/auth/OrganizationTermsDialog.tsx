import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  FileText, 
  Shield, 
  Scale, 
  Leaf, 
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Factory,
  Truck,
  Recycle,
  Upload,
  CreditCard,
  User,
  Phone,
  Briefcase,
  PenTool
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTermsSections,
  getTermsTitle,
  getOrganizationTypeLabel,
  getAgreementText,
  legalReferences,
  CURRENT_TERMS_VERSION,
  OrganizationType
} from '@/data/organizationTermsContent';
import SignaturePad, { SignaturePadRef } from '@/components/signature/SignaturePad';

interface OrganizationTermsDialogProps {
  open: boolean;
  onAccept: () => void;
  organizationType: OrganizationType;
}

const OrganizationTermsDialog = ({ open, onAccept, organizationType }: OrganizationTermsDialogProps) => {
  const { user, profile, organization } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'identity' | 'terms'>('identity');
  
  // Identity form state
  const [nationalId, setNationalId] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerPosition, setSignerPosition] = useState('');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const termsSections = getTermsSections(organizationType);
  const termsTitle = getTermsTitle(organizationType);
  const orgTypeLabel = getOrganizationTypeLabel(organizationType);
  const agreementText = getAgreementText(organizationType);

  const getOrgIcon = () => {
    switch (organizationType) {
      case 'generator':
        return <Factory className="w-8 h-8" />;
      case 'transporter':
        return <Truck className="w-8 h-8" />;
      case 'recycler':
        return <Recycle className="w-8 h-8" />;
      default:
        return <Shield className="w-8 h-8" />;
    }
  };

  const getWarningText = () => {
    switch (organizationType) {
      case 'generator':
        return 'بالموافقة على هذه الشروط، فإنك تقر بالتزامك الكامل بالقوانين واللوائح البيئية المصرية وتتحمل المسؤولية القانونية الكاملة عن تصنيف وتخزين المخلفات المولدة.';
      case 'transporter':
        return 'بالموافقة على هذه الشروط، فإنك تقر بالتزامك الكامل بالقوانين واللوائح البيئية المصرية وتتحمل المسؤولية القانونية الكاملة عن عمليات نقل المخلفات.';
      case 'recycler':
        return 'بالموافقة على هذه الشروط، فإنك تقر بالتزامك الكامل بالقوانين واللوائح البيئية المصرية وتتحمل المسؤولية القانونية الكاملة عن عمليات التدوير والمعالجة.';
      default:
        return 'بالموافقة على هذه الشروط، فإنك تقر بالتزامك الكامل بالقوانين واللوائح البيئية المصرية.';
    }
  };

  const handleFileChange = (type: 'front' | 'back', file: File | null) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setIdFrontFile(file);
        setIdFrontPreview(reader.result as string);
      } else {
        setIdBackFile(file);
        setIdBackPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateNationalId = (id: string) => {
    // Egyptian national ID is 14 digits
    return /^\d{14}$/.test(id);
  };

  const handleProceedToTerms = () => {
    if (!nationalId.trim()) {
      toast.error('يرجى إدخال الرقم القومي');
      return;
    }
    
    if (!validateNationalId(nationalId)) {
      toast.error('الرقم القومي يجب أن يتكون من 14 رقم');
      return;
    }
    
    if (!signerPhone.trim()) {
      toast.error('يرجى إدخال رقم الهاتف');
      return;
    }
    
    if (!signerPosition.trim()) {
      toast.error('يرجى إدخال المسمى الوظيفي');
      return;
    }
    
    if (!idFrontFile) {
      toast.error('يرجى رفع صورة وجه البطاقة');
      return;
    }
    
    if (!idBackFile) {
      toast.error('يرجى رفع صورة ظهر البطاقة');
      return;
    }
    
    setStep('terms');
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('id-cards')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('id-cards')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleAcceptTerms = async () => {
    if (!agreed) {
      toast.error('يجب الموافقة على الشروط والأحكام للمتابعة');
      return;
    }

    if (!signatureDataUrl || signaturePadRef.current?.isEmpty()) {
      toast.error('يرجى التوقيع في خانة التوقيع اليدوي');
      return;
    }

    if (!user || !profile || !organization) {
      toast.error('حدث خطأ في بيانات المستخدم');
      return;
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      // Upload ID card images
      const timestamp = Date.now();
      const idFrontUrl = await uploadImage(idFrontFile!, `${organization.id}/${user.id}/id-front-${timestamp}`);
      const idBackUrl = await uploadImage(idBackFile!, `${organization.id}/${user.id}/id-back-${timestamp}`);
      
      if (!idFrontUrl || !idBackUrl) {
        throw new Error('فشل في رفع صور البطاقة');
      }
      
      // Upload signature image
      let signatureUrl: string | null = null;
      if (signatureDataUrl) {
        const signatureBlob = await fetch(signatureDataUrl).then(r => r.blob());
        const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });
        signatureUrl = await uploadImage(signatureFile, `${organization.id}/${user.id}/signature-${timestamp}`);
      }
      
      setUploadingImages(false);

      // Verify signer matches registered user
      const verifiedMatch = profile.full_name?.trim().toLowerCase() === profile.full_name?.trim().toLowerCase();

      // Insert terms acceptance with identity data
      const { error } = await supabase
        .from('terms_acceptances')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          organization_type: organization.organization_type,
          organization_name: organization.name,
          full_name: profile.full_name,
          terms_version: CURRENT_TERMS_VERSION,
          user_agent: navigator.userAgent,
          signer_national_id: nationalId,
          signer_phone: signerPhone,
          signer_position: signerPosition,
          signer_id_front_url: idFrontUrl,
          signer_id_back_url: idBackUrl,
          signer_signature_url: signatureUrl,
          verified_match: verifiedMatch,
        });

      if (error) throw error;

      // Update profile with national ID info
      await supabase
        .from('profiles')
        .update({
          national_id: nationalId,
          id_card_front_url: idFrontUrl,
          id_card_back_url: idBackUrl,
        })
        .eq('id', profile.id);

      toast.success('تم تسجيل موافقتك على الشروط والأحكام بنجاح');
      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast.error('حدث خطأ أثناء تسجيل الموافقة');
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <DialogHeader>
            <div className="flex items-center justify-center gap-3 mb-2">
              {getOrgIcon()}
              <DialogTitle className="text-2xl font-bold">
                آي ريسايكل
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/90 text-center text-lg">
              {step === 'identity' ? 'التحقق من هوية الموقّع' : termsTitle}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <Badge variant="secondary" className={step === 'identity' ? 'ring-2 ring-white' : ''}>
              <User className="w-3 h-3 ml-1" />
              1. التحقق من الهوية
            </Badge>
            <Badge variant="secondary" className={step === 'terms' ? 'ring-2 ring-white' : ''}>
              <FileText className="w-3 h-3 ml-1" />
              2. الشروط والأحكام
            </Badge>
          </div>
        </div>

        {/* Identity Step */}
        {step === 'identity' && (
          <>
            <ScrollArea className="h-[50vh] px-6">
              <div className="py-4 space-y-6" dir="rtl">
                {/* Important Notice */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200">
                        التحقق من الهوية مطلوب
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        للتأكد من صحة الموافقة القانونية، يرجى إدخال بياناتك الشخصية ورفع صورة البطاقة الشخصية (وجه وظهر)
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Identity Form */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="national-id" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        الرقم القومي (14 رقم) *
                      </Label>
                      <Input
                        id="national-id"
                        value={nationalId}
                        onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                        placeholder="أدخل الرقم القومي المكون من 14 رقم"
                        className="text-left font-mono"
                        dir="ltr"
                        maxLength={14}
                      />
                      {nationalId && !validateNationalId(nationalId) && (
                        <p className="text-xs text-destructive">الرقم القومي يجب أن يتكون من 14 رقم</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signer-phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        رقم الهاتف *
                      </Label>
                      <Input
                        id="signer-phone"
                        value={signerPhone}
                        onChange={(e) => setSignerPhone(e.target.value)}
                        placeholder="أدخل رقم الهاتف"
                        className="text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signer-position" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      المسمى الوظيفي *
                    </Label>
                    <Input
                      id="signer-position"
                      value={signerPosition}
                      onChange={(e) => setSignerPosition(e.target.value)}
                      placeholder="مثال: المدير التنفيذي، مدير العمليات، صاحب المنشأة"
                    />
                  </div>

                  {/* ID Card Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        صورة وجه البطاقة *
                      </Label>
                      <input
                        ref={idFrontInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)}
                      />
                      <div
                        onClick={() => idFrontInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          idFrontPreview ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted-foreground/30 hover:border-primary'
                        }`}
                      >
                        {idFrontPreview ? (
                          <div className="space-y-2">
                            <img src={idFrontPreview} alt="وجه البطاقة" className="max-h-32 mx-auto rounded" />
                            <p className="text-xs text-green-600">✓ تم رفع الصورة</p>
                          </div>
                        ) : (
                          <div className="space-y-2 py-4">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">اضغط لرفع صورة وجه البطاقة</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        صورة ظهر البطاقة *
                      </Label>
                      <input
                        ref={idBackInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)}
                      />
                      <div
                        onClick={() => idBackInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          idBackPreview ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-muted-foreground/30 hover:border-primary'
                        }`}
                      >
                        {idBackPreview ? (
                          <div className="space-y-2">
                            <img src={idBackPreview} alt="ظهر البطاقة" className="max-h-32 mx-auto rounded" />
                            <p className="text-xs text-green-600">✓ تم رفع الصورة</p>
                          </div>
                        ) : (
                          <div className="space-y-2 py-4">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">اضغط لرفع صورة ظهر البطاقة</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registered User Info */}
                {profile && (
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      بيانات المستخدم المسجل
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">الاسم:</span>
                        <span className="font-medium mr-2">{profile.full_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">البريد الإلكتروني:</span>
                        <span className="font-medium mr-2">{user?.email}</span>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      يجب أن تتطابق بيانات الموقّع مع بيانات المستخدم المسجل
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Identity Footer */}
            <div className="border-t bg-muted/30 p-6">
              <Button
                onClick={handleProceedToTerms}
                className="w-full gap-2"
                size="lg"
              >
                <CheckCircle className="w-4 h-4" />
                متابعة للشروط والأحكام
              </Button>
            </div>
          </>
        )}

        {/* Terms Step */}
        {step === 'terms' && (
          <>
            <ScrollArea className="h-[50vh] px-6">
              <div className="py-4 space-y-6" dir="rtl">
                {/* Important Notice */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-200">
                        تنبيه هام
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        {getWarningText()}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Terms Sections */}
                {termsSections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-3"
                  >
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {section.title}
                    </h3>
                    <div className="space-y-2 pr-6">
                      {section.content.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-sm text-muted-foreground leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {index < termsSections.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </motion.div>
                ))}

                {/* Legal References */}
                <div className="bg-muted/50 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    المراجع القانونية
                  </h4>
                  <ul className="space-y-1">
                    {legalReferences.map((ref, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {ref}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Signer Info Summary */}
                {organization && profile && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-center">بيانات الموقّع على الشروط</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">اسم الشركة:</span>
                        <p className="font-medium">{organization.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">الاسم الكامل:</span>
                        <p className="font-medium">{profile.full_name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">الرقم القومي:</span>
                        <p className="font-medium font-mono">{nationalId}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">المسمى الوظيفي:</span>
                        <p className="font-medium">{signerPosition}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">رقم الهاتف:</span>
                        <p className="font-medium">{signerPhone}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">تاريخ الموافقة:</span>
                        <p className="font-medium">{new Date().toLocaleDateString('ar-EG')}</p>
                      </div>
                    </div>
                    
                    {/* ID Cards Preview */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">وجه البطاقة</p>
                        {idFrontPreview && (
                          <img src={idFrontPreview} alt="وجه البطاقة" className="max-h-24 mx-auto rounded border" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">ظهر البطاقة</p>
                        {idBackPreview && (
                          <img src={idBackPreview} alt="ظهر البطاقة" className="max-h-24 mx-auto rounded border" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Terms Footer */}
            <div className="border-t bg-muted/30 p-6 space-y-4">
              {/* Signature Pad */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <PenTool className="w-4 h-4" />
                  التوقيع اليدوي *
                </Label>
                <SignaturePad 
                  ref={signaturePadRef}
                  onSignatureChange={setSignatureDataUrl}
                  width={500}
                  height={120}
                />
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms-agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <label 
                  htmlFor="terms-agree" 
                  className="text-sm cursor-pointer leading-relaxed"
                >
                  {agreementText}
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('identity')}
                  className="gap-2"
                >
                  العودة للخطوة السابقة
                </Button>
                <Button
                  onClick={handleAcceptTerms}
                  disabled={!agreed || submitting || !signatureDataUrl}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadingImages ? 'جاري رفع الصور...' : 'جاري التسجيل...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      الموافقة على الشروط والأحكام
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                هذه الموافقة ملزمة قانونياً وتعتبر بمثابة عقد إلكتروني موقع وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationTermsDialog;
