import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  PenTool,
  ChevronLeft,
  ChevronRight,
  Lock,
  Camera,
  Check
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
import { useTermsContent } from '@/hooks/useTermsContent';
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
  
  const { data: dbTermsContent, isLoading: isLoadingTerms } = useTermsContent(organizationType);
  
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

  const termsSections = useMemo(() => {
    if (dbTermsContent?.sections?.length) return dbTermsContent.sections;
    return getTermsSections(organizationType);
  }, [dbTermsContent, organizationType]);

  const currentTermsVersion = dbTermsContent?.version || CURRENT_TERMS_VERSION;
  const termsTitle = getTermsTitle(organizationType);
  const agreementText = getAgreementText(organizationType);

  const getOrgIcon = () => {
    switch (organizationType) {
      case 'generator': return <Factory className="w-6 h-6" />;
      case 'transporter': return <Truck className="w-6 h-6" />;
      case 'recycler': return <Recycle className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getOrgColor = () => {
    switch (organizationType) {
      case 'generator': return 'from-blue-600 to-indigo-700';
      case 'transporter': return 'from-amber-600 to-orange-700';
      case 'recycler': return 'from-emerald-600 to-green-700';
      default: return 'from-primary to-primary/80';
    }
  };

  const getWarningText = () => {
    switch (organizationType) {
      case 'generator': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن تصنيف وتخزين المخلفات.';
      case 'transporter': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن عمليات نقل المخلفات.';
      case 'recycler': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن عمليات التدوير والمعالجة.';
      default: return 'بالموافقة، تقر بالتزامك الكامل بالقوانين البيئية المصرية.';
    }
  };

  const handleFileChange = (type: 'front' | 'back', file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار ملف صورة صالح'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') { setIdFrontFile(file); setIdFrontPreview(reader.result as string); }
      else { setIdBackFile(file); setIdBackPreview(reader.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const validateNationalId = (id: string) => /^\d{14}$/.test(id);

  const handleProceedToTerms = () => {
    if (!nationalId.trim()) { toast.error('يرجى إدخال الرقم القومي'); return; }
    if (!validateNationalId(nationalId)) { toast.error('الرقم القومي يجب أن يتكون من 14 رقم'); return; }
    if (!signerPhone.trim()) { toast.error('يرجى إدخال رقم الهاتف'); return; }
    if (!signerPosition.trim()) { toast.error('يرجى إدخال المسمى الوظيفي'); return; }
    if (!idFrontFile) { toast.error('يرجى رفع صورة وجه البطاقة'); return; }
    if (!idBackFile) { toast.error('يرجى رفع صورة ظهر البطاقة'); return; }
    setStep('terms');
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('id-cards').upload(fileName, file, { upsert: true });
    if (uploadError) { console.error('Upload error:', uploadError); return null; }
    const { data: { publicUrl } } = supabase.storage.from('id-cards').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleAcceptTerms = async () => {
    if (!agreed) { toast.error('يجب الموافقة على الشروط والأحكام للمتابعة'); return; }
    if (!signatureDataUrl || signaturePadRef.current?.isEmpty()) { toast.error('يرجى التوقيع في خانة التوقيع اليدوي'); return; }
    if (!user || !profile || !organization) { toast.error('حدث خطأ في بيانات المستخدم'); return; }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      const timestamp = Date.now();
      const idFrontUrl = await uploadImage(idFrontFile!, `${organization.id}/${user.id}/id-front-${timestamp}`);
      const idBackUrl = await uploadImage(idBackFile!, `${organization.id}/${user.id}/id-back-${timestamp}`);
      if (!idFrontUrl || !idBackUrl) throw new Error('فشل في رفع صور البطاقة');
      
      let signatureUrl: string | null = null;
      if (signatureDataUrl) {
        const signatureBlob = await fetch(signatureDataUrl).then(r => r.blob());
        const signatureFile = new File([signatureBlob], 'signature.png', { type: 'image/png' });
        signatureUrl = await uploadImage(signatureFile, `${organization.id}/${user.id}/signature-${timestamp}`);
      }
      
      setUploadingImages(false);
      const verifiedMatch = profile.full_name?.trim().toLowerCase() === profile.full_name?.trim().toLowerCase();

      const { error } = await supabase.from('terms_acceptances').insert({
        user_id: user.id, organization_id: organization.id, organization_type: organization.organization_type,
        organization_name: organization.name, full_name: profile.full_name, terms_version: currentTermsVersion,
        user_agent: navigator.userAgent, signer_national_id: nationalId, signer_phone: signerPhone,
        signer_position: signerPosition, signer_id_front_url: idFrontUrl, signer_id_back_url: idBackUrl,
        signer_signature_url: signatureUrl, verified_match: verifiedMatch,
      });
      if (error) throw error;

      await supabase.from('profiles').update({ national_id: nationalId, id_card_front_url: idFrontUrl, id_card_back_url: idBackUrl }).eq('id', profile.id);

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

  // Check identity form completion
  const identityComplete = nationalId.length === 14 && signerPhone.trim() && signerPosition.trim() && idFrontFile && idBackFile;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-3xl max-h-[92vh] p-0 overflow-hidden border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Compact Header */}
        <div className={`bg-gradient-to-l ${getOrgColor()} text-white px-6 py-5 relative overflow-hidden`}>
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {getOrgIcon()}
              </div>
              <DialogTitle className="text-xl font-bold">آي ريسايكل</DialogTitle>
            </div>
            <DialogDescription className="text-white/90 text-center text-sm">
              {step === 'identity' ? 'التحقق من هوية الموقّع' : termsTitle}
            </DialogDescription>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => step === 'terms' && setStep('identity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === 'identity' 
                    ? 'bg-white text-gray-800 shadow-md' 
                    : 'bg-white/20 text-white/90 hover:bg-white/30 cursor-pointer'
                }`}
              >
                {step === 'terms' && <Check className="w-3 h-3" />}
                <User className="w-3 h-3" />
                التحقق من الهوية
              </button>
              <ChevronLeft className="w-4 h-4 text-white/50" />
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                step === 'terms' 
                  ? 'bg-white text-gray-800 shadow-md' 
                  : 'bg-white/10 text-white/50'
              }`}>
                <FileText className="w-3 h-3" />
                الشروط والأحكام
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ====== IDENTITY STEP ====== */}
          {step === 'identity' && (
            <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea className="h-[52vh] px-6">
                <div className="py-5 space-y-5" dir="rtl">
                  {/* Info banner */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">التحقق من الهوية مطلوب</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        يرجى إدخال بياناتك الشخصية ورفع صورة البطاقة للتوثيق القانوني
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="national-id" className="text-xs font-medium flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                          الرقم القومي (14 رقم)
                        </Label>
                        <Input
                          id="national-id"
                          value={nationalId}
                          onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                          placeholder="أدخل الرقم القومي"
                          className={`text-left font-mono text-sm h-10 ${
                            nationalId && validateNationalId(nationalId) ? 'border-green-500 focus-visible:ring-green-500' : ''
                          }`}
                          dir="ltr"
                          maxLength={14}
                        />
                        {nationalId && !validateNationalId(nationalId) && (
                          <p className="text-[11px] text-destructive">يجب أن يتكون من 14 رقم</p>
                        )}
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="signer-phone" className="text-xs font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          رقم الهاتف
                        </Label>
                        <Input
                          id="signer-phone"
                          value={signerPhone}
                          onChange={(e) => setSignerPhone(e.target.value)}
                          placeholder="أدخل رقم الهاتف"
                          className="text-left text-sm h-10"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="signer-position" className="text-xs font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        المسمى الوظيفي
                      </Label>
                      <Input
                        id="signer-position"
                        value={signerPosition}
                        onChange={(e) => setSignerPosition(e.target.value)}
                        placeholder="مثال: المدير التنفيذي، مدير العمليات"
                        className="text-sm h-10"
                      />
                    </div>
                  </div>

                  {/* ID Card Upload - Improved */}
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5 mb-3">
                      <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                      صور البطاقة الشخصية
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Front */}
                      <div>
                        <input ref={idFrontInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)} />
                        <div
                          onClick={() => idFrontInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                            idFrontPreview 
                              ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20' 
                              : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          {idFrontPreview ? (
                            <div className="relative">
                              <img src={idFrontPreview} alt="وجه البطاقة" className="w-full h-28 object-cover" />
                              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                              <Upload className="w-6 h-6 text-muted-foreground/50" />
                              <p className="text-[11px] text-muted-foreground">وجه البطاقة</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Back */}
                      <div>
                        <input ref={idBackInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)} />
                        <div
                          onClick={() => idBackInputRef.current?.click()}
                          className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                            idBackPreview 
                              ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20' 
                              : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
                          }`}
                        >
                          {idBackPreview ? (
                            <div className="relative">
                              <img src={idBackPreview} alt="ظهر البطاقة" className="w-full h-28 object-cover" />
                              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 gap-1.5">
                              <Upload className="w-6 h-6 text-muted-foreground/50" />
                              <p className="text-[11px] text-muted-foreground">ظهر البطاقة</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered User Info - Compact */}
                  {profile && (
                    <div className="rounded-xl border bg-muted/30 p-3.5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold">بيانات المستخدم المسجل</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-muted-foreground">الاسم:</span> <span className="font-medium">{profile.full_name}</span></div>
                        <div><span className="text-muted-foreground">البريد:</span> <span className="font-medium">{user?.email}</span></div>
                      </div>
                      <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        يجب أن تتطابق بيانات الموقّع مع بيانات المستخدم المسجل
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Identity Footer */}
              <div className="border-t bg-muted/20 px-6 py-4">
                <Button
                  onClick={handleProceedToTerms}
                  className={`w-full gap-2 h-11 text-sm font-semibold bg-gradient-to-l ${getOrgColor()} hover:opacity-90 transition-opacity`}
                  disabled={!identityComplete}
                >
                  <span>متابعة للشروط والأحكام</span>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ====== TERMS STEP ====== */}
          {step === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea className="h-[48vh] px-6">
                <div className="py-5 space-y-5" dir="rtl">
                  {/* Warning banner */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed pt-1">
                      {getWarningText()}
                    </p>
                  </div>

                  {/* Terms Sections - Cleaner */}
                  <div className="space-y-4">
                    {termsSections.map((section, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group"
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
                        </div>
                        <div className="space-y-1.5 pr-8">
                          {section.content.map((paragraph, pIndex) => (
                            <p key={pIndex} className="text-xs text-muted-foreground leading-relaxed">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        {index < termsSections.length - 1 && <Separator className="mt-4" />}
                      </motion.div>
                    ))}
                  </div>

                  {/* Legal References */}
                  <div className="rounded-xl border bg-muted/30 p-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold">المراجع القانونية</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {legalReferences.map((ref, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signer Summary - Compact card */}
                  {organization && profile && (
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                      <h4 className="font-semibold text-xs text-center mb-3 flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        ملخص بيانات الموقّع
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الشركة</p>
                          <p className="text-xs font-semibold truncate">{organization.name}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الاسم</p>
                          <p className="text-xs font-semibold truncate">{profile.full_name}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">المنصب</p>
                          <p className="text-xs font-semibold truncate">{signerPosition}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الرقم القومي</p>
                          <p className="text-xs font-mono font-semibold">{nationalId}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الهاتف</p>
                          <p className="text-xs font-semibold">{signerPhone}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">التاريخ</p>
                          <p className="text-xs font-semibold">{new Date().toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      
                      {/* ID Cards mini preview */}
                      <div className="flex items-center justify-center gap-3 mt-3">
                        {idFrontPreview && <img src={idFrontPreview} alt="وجه" className="h-12 rounded border object-cover" />}
                        {idBackPreview && <img src={idBackPreview} alt="ظهر" className="h-12 rounded border object-cover" />}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Terms Footer */}
              <div className="border-t bg-muted/20 px-6 py-4 space-y-3">
                {/* Signature */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <PenTool className="w-3.5 h-3.5" />
                    التوقيع اليدوي
                  </Label>
                  <SignaturePad 
                    ref={signaturePadRef}
                    onSignatureChange={setSignatureDataUrl}
                    width={500}
                    height={100}
                  />
                </div>

                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="terms-agree"
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms-agree" className="text-[11px] cursor-pointer leading-relaxed text-muted-foreground">
                    {agreementText}
                  </label>
                </div>

                <div className="flex gap-2.5">
                  <Button variant="outline" onClick={() => setStep('identity')} className="gap-1.5 text-xs h-10">
                    <ChevronRight className="w-3.5 h-3.5" />
                    رجوع
                  </Button>
                  <Button
                    onClick={handleAcceptTerms}
                    disabled={!agreed || submitting || !signatureDataUrl}
                    className={`flex-1 gap-2 h-10 text-xs font-semibold bg-gradient-to-l ${getOrgColor()} hover:opacity-90`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {uploadingImages ? 'جاري رفع الصور...' : 'جاري التسجيل...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        الموافقة والمتابعة
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground">
                  موافقة ملزمة قانونياً وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationTermsDialog;
