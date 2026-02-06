import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Fingerprint,
  Scan,
  PenTool,
  CheckCircle2,
  Shield,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBiometricAuth, BiometricVerificationResult } from '@/hooks/useBiometricAuth';
import SignaturePad, { SignaturePadRef } from './SignaturePad';

interface BiometricSignaturePadProps {
  userId: string;
  purpose?: string;
  onComplete?: (data: BiometricSignatureData) => void;
  onError?: (error: string) => void;
  requireBiometric?: boolean;
  className?: string;
}

export interface BiometricSignatureData {
  signatureDataUrl: string | null;
  biometricVerified: boolean;
  biometricType?: string;
  verificationId?: string;
  timestamp: string;
  deviceInfo?: string;
}

const BiometricSignaturePad = ({
  userId,
  purpose = 'توقيع المستند',
  onComplete,
  onError,
  requireBiometric = false,
  className,
}: BiometricSignaturePadProps) => {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const {
    isLoading,
    isSupported,
    checkSupport,
    verifyBiometric,
  } = useBiometricAuth();

  const [biometricVerified, setBiometricVerified] = useState(false);
  const [biometricResult, setBiometricResult] = useState<BiometricVerificationResult | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<'biometric' | 'signature' | 'complete'>('biometric');

  // Check biometric support on mount
  useEffect(() => {
    checkSupport().then(() => setChecking(false));
  }, [checkSupport]);

  const handleBiometricVerify = async () => {
    const result = await verifyBiometric(userId, purpose);

    if (result.success) {
      setBiometricVerified(true);
      setBiometricResult(result);
      setStep('signature');
    } else {
      onError?.(result.error || 'فشل التحقق البيومتري');
    }
  };

  const handleSkipBiometric = () => {
    if (!requireBiometric) {
      setStep('signature');
    }
  };

  const handleSignatureChange = (dataUrl: string | null) => {
    setHasSignature(!!dataUrl);
  };

  const handleComplete = useCallback(() => {
    const signatureDataUrl = signaturePadRef.current?.getSignatureDataUrl() || null;

    if (!signatureDataUrl && !biometricVerified) {
      onError?.('يرجى التوقيع أو التحقق بالبصمة');
      return;
    }

    const data: BiometricSignatureData = {
      signatureDataUrl,
      biometricVerified,
      biometricType: biometricResult?.biometricType,
      verificationId: biometricResult?.verificationId,
      timestamp: new Date().toISOString(),
      deviceInfo: navigator.userAgent,
    };

    setStep('complete');
    onComplete?.(data);
  }, [biometricVerified, biometricResult, onComplete, onError]);

  if (checking) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
              step === 'biometric'
                ? 'bg-primary text-primary-foreground'
                : biometricVerified
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {biometricVerified ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Fingerprint className="h-4 w-4" />
            )}
            <span>البصمة</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
              step === 'signature'
                ? 'bg-primary text-primary-foreground'
                : hasSignature
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {hasSignature ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <PenTool className="h-4 w-4" />
            )}
            <span>التوقيع</span>
          </div>
          <div className="w-8 h-px bg-border" />
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
              step === 'complete'
                ? 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Shield className="h-4 w-4" />
            <span>تأكيد</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Biometric Verification */}
          {step === 'biometric' && (
            <motion.div
              key="biometric"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6 py-8"
            >
              <div className="relative inline-flex">
                <motion.div
                  className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(var(--primary), 0.2)',
                      '0 0 0 20px rgba(var(--primary), 0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Fingerprint className="h-12 w-12 text-primary" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">التحقق البيومتري</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  استخدم بصمة إصبعك أو وجهك للتحقق من هويتك قبل التوقيع
                </p>
              </div>

              {isSupported ? (
                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={handleBiometricVerify}
                    disabled={isLoading}
                    className="gap-3 min-w-[200px]"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Fingerprint className="h-5 w-5" />
                    )}
                    {isLoading ? 'جارٍ التحقق...' : 'التحقق بالبصمة'}
                  </Button>

                  {!requireBiometric && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSkipBiometric}
                        className="text-muted-foreground"
                      >
                        تخطي والتوقيع يدوياً
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">جهازك لا يدعم البصمة</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSkipBiometric}
                    className="gap-2"
                  >
                    <PenTool className="h-4 w-4" />
                    المتابعة بالتوقيع اليدوي
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Manual Signature */}
          {step === 'signature' && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Biometric Status Badge */}
              {biometricVerified && (
                <div className="flex items-center justify-center">
                  <Badge className="gap-2 bg-emerald-100 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    تم التحقق البيومتري بنجاح
                    {biometricResult?.biometricType && (
                      <span className="text-emerald-500">
                        ({biometricResult.biometricType === 'fingerprint' ? 'بصمة' : 'وجه'})
                      </span>
                    )}
                  </Badge>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-1">التوقيع اليدوي</h3>
                <p className="text-sm text-muted-foreground">
                  {biometricVerified
                    ? 'أضف توقيعك لتأكيد الموافقة (اختياري)'
                    : 'وقّع في المربع أدناه لتأكيد موافقتك'}
                </p>
              </div>

              <SignaturePad
                ref={signaturePadRef}
                onSignatureChange={handleSignatureChange}
                width={400}
                height={150}
              />

              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('biometric')}
                  className="gap-2"
                >
                  <Fingerprint className="h-4 w-4" />
                  العودة للبصمة
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!hasSignature && !biometricVerified}
                  className="gap-2 min-w-[150px]"
                >
                  <Shield className="h-4 w-4" />
                  تأكيد التوقيع
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </motion.div>

              <div>
                <h3 className="text-lg font-semibold text-emerald-700 mb-2">
                  تم التوقيع بنجاح!
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {biometricVerified && (
                    <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-600">
                      <Fingerprint className="h-3 w-3" />
                      تحقق بيومتري
                    </Badge>
                  )}
                  {hasSignature && (
                    <Badge variant="outline" className="gap-1 border-blue-200 text-blue-600">
                      <PenTool className="h-3 w-3" />
                      توقيع يدوي
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1 border-violet-200 text-violet-600">
                    <Lock className="h-3 w-3" />
                    مؤمّن
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default BiometricSignaturePad;
