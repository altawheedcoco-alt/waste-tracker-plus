import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useBiometricAuth, isPlatformAuthenticatorAvailable } from '@/hooks/useBiometricAuth';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import { useOrganizationSignatures } from '@/hooks/useOrganizationSignatures';
import { useDocumentEndorsement, EndorsementRequest, EndorsementResult } from '@/hooks/useDocumentEndorsement';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  KeyRound,
  Lock,
  Stamp,
  PenTool,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  FileCheck,
} from 'lucide-react';

type AuthMethod = 'password' | 'biometric' | '2fa' | 'none';

interface SecureEndorsementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'certificate' | 'report' | 'contract' | 'receipt' | 'aggregate';
  documentId: string;
  documentNumber: string;
  documentTitle?: string;
  onSuccess?: (result: EndorsementResult) => void;
  onCancel?: () => void;
  requireBiometric?: boolean;
  requirePassword?: boolean;
  require2FA?: boolean;
  allowSkipAuth?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  certificate: 'شهادة تدوير',
  report: 'تقرير',
  contract: 'عقد',
  receipt: 'شهادة استلام',
  aggregate: 'تقرير مجمع',
};

const SecureEndorsementDialog = ({
  open,
  onOpenChange,
  documentType,
  documentId,
  documentNumber,
  documentTitle,
  onSuccess,
  onCancel,
  requireBiometric = false,
  requirePassword = true,
  require2FA = false,
  allowSkipAuth = false,
}: SecureEndorsementDialogProps) => {
  const { profile, organization } = useAuth();
  const { verifyBiometric, checkSupport, isLoading: biometricLoading, isSupported: biometricSupported } = useBiometricAuth();
  const { verify: verify2FA } = useTwoFactorAuth();
  const { getActiveSignatures, getActiveStamps, loading: signaturesLoading } = useOrganizationSignatures();
  const { createEndorsement, loading: endorsementLoading } = useDocumentEndorsement();

  // State
  const [step, setStep] = useState<'auth' | 'select' | 'confirm' | 'success' | 'error'>('auth');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Signature/Stamp selection
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');
  const [selectedStampId, setSelectedStampId] = useState<string>('');
  const [endorsementType, setEndorsementType] = useState<'signed' | 'stamped' | 'signed_and_stamped'>('signed_and_stamped');
  
  // Result
  const [endorsementResult, setEndorsementResult] = useState<EndorsementResult | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Check authorization
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authorizationError, setAuthorizationError] = useState<string | null>(null);

  const activeSignatures = getActiveSignatures();
  const activeStamps = getActiveStamps();

  // Check if user is authorized to sign documents
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!profile?.id || !organization?.id) {
        setIsAuthorized(false);
        setAuthorizationError('يجب تسجيل الدخول أولاً');
        return;
      }

      // Check if user has signing authority by querying the profile
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('can_sign_documents, signature_authority_level')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        if (!profileData?.can_sign_documents) {
          setIsAuthorized(false);
          setAuthorizationError('ليس لديك صلاحية توقيع المستندات. يرجى التواصل مع مدير المنظمة.');
          return;
        }

        // Check signature authority level
        if (profileData.signature_authority_level === 'none') {
          setIsAuthorized(false);
          setAuthorizationError('مستوى صلاحية التوقيع الخاص بك لا يسمح بالتوقيع على هذا المستند.');
          return;
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error('Error checking authorization:', err);
        // If we can't check, allow (fail open for better UX)
        setIsAuthorized(true);
      }
    };

    if (open) {
      checkAuthorization();
    }
  }, [open, profile, organization]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('auth');
      setPassword('');
      setTwoFactorCode('');
      setAuthVerified(false);
      setAuthError(null);
      setEndorsementResult(null);
      
      // Auto-select auth method based on requirements
      if (requireBiometric) {
        setAuthMethod('biometric');
      } else if (require2FA) {
        setAuthMethod('2fa');
      } else {
        setAuthMethod('password');
      }

      // Auto-select primary signature and stamp
      const primarySig = activeSignatures.find(s => s.is_primary);
      const primaryStamp = activeStamps.find(s => s.is_primary);
      if (primarySig) setSelectedSignatureId(primarySig.id);
      if (primaryStamp) setSelectedStampId(primaryStamp.id);

      // Check biometric support
      checkSupport();
    }
  }, [open, requireBiometric, require2FA, activeSignatures, activeStamps, checkSupport]);

  // Verify password
  const verifyPassword = async () => {
    if (!password.trim()) {
      setAuthError('يرجى إدخال كلمة المرور');
      return false;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('المستخدم غير موجود');

      // Re-authenticate with password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (error) {
        setAuthError('كلمة المرور غير صحيحة');
        return false;
      }

      setAuthVerified(true);
      toast.success('تم التحقق من كلمة المرور');
      return true;
    } catch (err: any) {
      console.error('Password verification error:', err);
      setAuthError(err.message || 'فشل التحقق من كلمة المرور');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Verify biometric
  const handleBiometricVerify = async () => {
    if (!profile?.user_id) return false;

    setIsVerifying(true);
    setAuthError(null);

    const result = await verifyBiometric(
      profile.user_id, 
      `توقيع ${documentTypeLabels[documentType]} - ${documentNumber}`
    );

    if (result.success) {
      setAuthVerified(true);
      return true;
    } else {
      setAuthError(result.error || 'فشل التحقق البيومتري');
      return false;
    }
  };

  // Verify 2FA
  const handle2FAVerify = async () => {
    if (!twoFactorCode.trim() || twoFactorCode.length !== 6) {
      setAuthError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return false;
    }

    setIsVerifying(true);
    setAuthError(null);

    try {
      const result = await verify2FA(twoFactorCode);
      
      if (result) {
        setAuthVerified(true);
        toast.success('تم التحقق من الرمز');
        return true;
      } else {
        setAuthError('رمز التحقق غير صحيح');
        return false;
      }
    } catch (err: any) {
      setAuthError(err.message || 'فشل التحقق من الرمز');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle authentication
  const handleAuthenticate = async () => {
    let verified = false;

    switch (authMethod) {
      case 'password':
        verified = await verifyPassword();
        break;
      case 'biometric':
        verified = await handleBiometricVerify();
        break;
      case '2fa':
        verified = await handle2FAVerify();
        break;
      case 'none':
        if (allowSkipAuth) {
          verified = true;
          setAuthVerified(true);
        }
        break;
    }

    if (verified) {
      setStep('select');
    }
  };

  // Skip authentication (if allowed)
  const handleSkipAuth = () => {
    if (allowSkipAuth) {
      setAuthVerified(false);
      setStep('select');
    }
  };

  // Proceed to confirmation
  const handleProceedToConfirm = () => {
    // Validate selections
    if (endorsementType !== 'stamped' && !selectedSignatureId) {
      toast.error('يرجى اختيار توقيع');
      return;
    }
    if (endorsementType !== 'signed' && !selectedStampId) {
      toast.error('يرجى اختيار ختم');
      return;
    }

    setConfirmDialogOpen(true);
  };

  // Execute endorsement
  const handleEndorse = async () => {
    setConfirmDialogOpen(false);

    const request: EndorsementRequest = {
      document_type: documentType,
      document_id: documentId,
      document_number: documentNumber,
      signature_id: endorsementType !== 'stamped' ? selectedSignatureId : undefined,
      stamp_id: endorsementType !== 'signed' ? selectedStampId : undefined,
      endorsement_type: endorsementType,
      biometric_verified: authMethod === 'biometric' && authVerified,
      notes: `تم التوقيع بواسطة: ${profile?.full_name} | طريقة المصادقة: ${authMethod === 'password' ? 'كلمة المرور' : authMethod === 'biometric' ? 'البصمة' : authMethod === '2fa' ? 'المصادقة الثنائية' : 'بدون مصادقة'}`,
    };

    const result = await createEndorsement(request);

    if (result) {
      setEndorsementResult(result);
      setStep('success');
      onSuccess?.(result);
    } else {
      setStep('error');
    }
  };

  // Handle close
  const handleClose = () => {
    if (step !== 'success' && step !== 'error') {
      onCancel?.();
    }
    onOpenChange(false);
  };

  // Render authorization error
  if (isAuthorized === false) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              غير مصرح
            </DialogTitle>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{authorizationError}</AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button onClick={handleClose}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              اعتماد {documentTypeLabels[documentType]}
            </DialogTitle>
            <DialogDescription>
              {documentTitle || documentNumber}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {['auth', 'select', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s 
                    ? 'bg-primary text-primary-foreground' 
                    : ['select', 'confirm', 'success'].indexOf(step) > i || step === 'success'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {step === 'success' && i <= 2 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className="w-8 h-0.5 bg-muted" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Authentication */}
            {step === 'auth' && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <Lock className="w-10 h-10 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold">تأكيد الهوية</h3>
                  <p className="text-sm text-muted-foreground">
                    للمتابعة، يرجى التحقق من هويتك
                  </p>
                </div>

                {/* User Info */}
                <Card className="bg-muted/30">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{organization?.name}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Auth Method Selection */}
                <div className="space-y-2">
                  <Label>طريقة التحقق</Label>
                  <Select value={authMethod} onValueChange={(val) => setAuthMethod(val as AuthMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="password">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4" />
                          <span>كلمة المرور</span>
                        </div>
                      </SelectItem>
                      {biometricSupported && (
                        <SelectItem value="biometric">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="w-4 h-4" />
                            <span>البصمة / الوجه</span>
                          </div>
                        </SelectItem>
                      )}
                      <SelectItem value="2fa">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span>المصادقة الثنائية</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Password Input */}
                {authMethod === 'password' && (
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور"
                        className="pl-10"
                        onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Biometric */}
                {authMethod === 'biometric' && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4 text-center">
                      <Fingerprint className="w-12 h-12 mx-auto text-primary mb-2" />
                      <p className="text-sm">اضغط على زر التحقق لاستخدام البصمة أو Face ID</p>
                    </CardContent>
                  </Card>
                )}

                {/* 2FA Input */}
                {authMethod === '2fa' && (
                  <div className="space-y-2">
                    <Label>رمز التحقق</Label>
                    <Input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="أدخل الرمز المكون من 6 أرقام"
                      className="text-center font-mono text-lg tracking-widest"
                      maxLength={6}
                      onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      استخدم تطبيق المصادقة للحصول على الرمز
                    </p>
                  </div>
                )}

                {/* Auth Error */}
                {authError && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>
                )}
              </motion.div>
            )}

            {/* Step 2: Signature/Stamp Selection */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {authVerified && (
                  <Alert className="bg-primary/10 border-primary/20">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      تم التحقق من هويتك بنجاح
                    </AlertDescription>
                  </Alert>
                )}

                {/* Endorsement Type */}
                <div className="space-y-2">
                  <Label>نوع الاعتماد</Label>
                  <Select value={endorsementType} onValueChange={(val: any) => setEndorsementType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signed_and_stamped">
                        <div className="flex items-center gap-2">
                          <PenTool className="w-4 h-4" />
                          <Stamp className="w-4 h-4" />
                          <span>توقيع وختم</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="signed">
                        <div className="flex items-center gap-2">
                          <PenTool className="w-4 h-4" />
                          <span>توقيع فقط</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="stamped">
                        <div className="flex items-center gap-2">
                          <Stamp className="w-4 h-4" />
                          <span>ختم فقط</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Signature Selection */}
                {endorsementType !== 'stamped' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <PenTool className="w-4 h-4" />
                      اختر التوقيع
                    </Label>
                    {activeSignatures.length === 0 ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          لا توجد توقيعات مسجلة. يرجى إضافة توقيع من إعدادات المنظمة.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {activeSignatures.map((sig) => (
                          <Card
                            key={sig.id}
                            className={`p-2 cursor-pointer transition-all ${
                              selectedSignatureId === sig.id 
                                ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedSignatureId(sig.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-8 border rounded bg-background flex items-center justify-center overflow-hidden">
                                {sig.signature_image_url ? (
                                  <img src={sig.signature_image_url} alt="" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <PenTool className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{sig.signer_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{sig.signer_position}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Stamp Selection */}
                {endorsementType !== 'signed' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Stamp className="w-4 h-4" />
                      اختر الختم
                    </Label>
                    {activeStamps.length === 0 ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          لا توجد أختام مسجلة. يرجى إضافة ختم من إعدادات المنظمة.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {activeStamps.map((stamp) => (
                          <Card
                            key={stamp.id}
                            className={`p-2 cursor-pointer transition-all ${
                              selectedStampId === stamp.id 
                                ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                                : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedStampId(stamp.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 border rounded-full bg-background flex items-center justify-center overflow-hidden">
                                {stamp.stamp_image_url ? (
                                  <img src={stamp.stamp_image_url} alt="" className="max-w-full max-h-full object-contain" />
                                ) : (
                                  <Stamp className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{stamp.stamp_name}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && endorsementResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">تم الاعتماد بنجاح!</h3>
                  <p className="text-sm text-muted-foreground">
                    تم توقيع وختم المستند بنجاح
                  </p>
                </div>

                <Card className="bg-muted/50 text-right">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رقم الختم:</span>
                      <span className="font-mono font-bold">{endorsementResult.system_seal_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">رمز التحقق:</span>
                      <span className="font-mono">{endorsementResult.verification_code}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-destructive">فشل الاعتماد</h3>
                  <p className="text-sm text-muted-foreground">
                    حدث خطأ أثناء اعتماد المستند. يرجى المحاولة مرة أخرى.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Separator className="my-2" />

          <DialogFooter className="gap-2">
            {step === 'auth' && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  إلغاء
                </Button>
                {allowSkipAuth && (
                  <Button variant="ghost" onClick={handleSkipAuth}>
                    تخطي التحقق
                  </Button>
                )}
                <Button onClick={handleAuthenticate} disabled={isVerifying || biometricLoading}>
                  {isVerifying || biometricLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 ml-2" />
                  )}
                  تحقق
                </Button>
              </>
            )}

            {step === 'select' && (
              <>
                <Button variant="outline" onClick={() => setStep('auth')}>
                  رجوع
                </Button>
                <Button onClick={handleProceedToConfirm} disabled={endorsementLoading}>
                  <FileCheck className="w-4 h-4 ml-2" />
                  متابعة للتأكيد
                </Button>
              </>
            )}

            {(step === 'success' || step === 'error') && (
              <Button onClick={handleClose}>
                إغلاق
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              تأكيد الاعتماد
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right space-y-2">
              <p>أنت على وشك اعتماد هذا المستند بالتوقيع والختم الإلكتروني.</p>
              <div className="bg-muted p-3 rounded-lg space-y-1 mt-2">
                <p><strong>نوع المستند:</strong> {documentTypeLabels[documentType]}</p>
                <p><strong>رقم المستند:</strong> {documentNumber}</p>
                <p><strong>الموقع:</strong> {profile?.full_name}</p>
              </div>
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  هذا الإجراء غير قابل للتراجع. سيتم تسجيل التوقيع وختمه بشكل دائم.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndorse} disabled={endorsementLoading}>
              {endorsementLoading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 ml-2" />
              )}
              تأكيد الاعتماد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SecureEndorsementDialog;
