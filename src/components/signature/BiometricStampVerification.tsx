import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Fingerprint,
  Stamp,
  Shield,
  CheckCircle2,
  Loader2,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

interface BiometricStampVerificationProps {
  userId: string;
  stampUrl?: string | null;
  organizationName: string;
  documentType: string;
  onVerified?: (verificationData: StampVerificationData) => void;
  onCancel?: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export interface StampVerificationData {
  verified: boolean;
  verificationId: string;
  biometricType: string;
  timestamp: string;
  stampApplied: boolean;
  deviceInfo: string;
}

const BiometricStampVerification = ({
  userId,
  stampUrl,
  organizationName,
  documentType,
  onVerified,
  onCancel,
  isOpen,
  setIsOpen,
}: BiometricStampVerificationProps) => {
  const {
    isLoading,
    isSupported,
    checkSupport,
    verifyBiometric,
  } = useBiometricAuth();

  const [step, setStep] = useState<'intro' | 'verifying' | 'success' | 'error'>('intro');
  const [verificationData, setVerificationData] = useState<StampVerificationData | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkSupport().then(() => setChecking(false));
      setStep('intro');
      setVerificationData(null);
    }
  }, [isOpen, checkSupport]);

  const handleVerify = async () => {
    setStep('verifying');

    const result = await verifyBiometric(
      userId,
      `ختم ${documentType} - ${organizationName}`
    );

    if (result.success) {
      const data: StampVerificationData = {
        verified: true,
        verificationId: result.verificationId!,
        biometricType: result.biometricType || 'unknown',
        timestamp: new Date().toISOString(),
        stampApplied: true,
        deviceInfo: navigator.userAgent,
      };

      setVerificationData(data);
      setStep('success');
      
      // Delay to show success animation
      setTimeout(() => {
        onVerified?.(data);
        setIsOpen(false);
      }, 2000);
    } else {
      setStep('error');
      toast.error(result.error || 'فشل التحقق البيومتري');
    }
  };

  const handleClose = () => {
    onCancel?.();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Shield className="h-5 w-5 text-primary" />
            تأكيد الختم الإلكتروني
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {/* Intro Step */}
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                {/* Stamp Preview */}
                <div className="relative inline-flex">
                  <motion.div
                    className="w-28 h-28 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center bg-white overflow-hidden"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {stampUrl ? (
                      <img
                        src={stampUrl}
                        alt="ختم الجهة"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Stamp className="h-12 w-12 text-primary/50" />
                    )}
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Unlock className="h-5 w-5 text-amber-600" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">تأكيد هويتك لتطبيق الختم</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    للتأكد من صحة الختم الإلكتروني، يرجى التحقق باستخدام بصمتك أو وجهك
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">نوع المستند:</span>
                    <span className="font-medium">{documentType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">الجهة:</span>
                    <span className="font-medium">{organizationName}</span>
                  </div>
                </div>

                {checking ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">جارٍ التحقق من دعم البصمة...</span>
                  </div>
                ) : isSupported ? (
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" onClick={handleClose}>
                      إلغاء
                    </Button>
                    <Button onClick={handleVerify} className="gap-2 min-w-[150px]">
                      <Fingerprint className="h-4 w-4" />
                      التحقق وتطبيق الختم
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">جهازك لا يدعم البصمة</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      يمكنك تطبيق الختم بدون التحقق البيومتري
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" onClick={handleClose}>
                        إلغاء
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const data: StampVerificationData = {
                            verified: false,
                            verificationId: `manual-${Date.now()}`,
                            biometricType: 'none',
                            timestamp: new Date().toISOString(),
                            stampApplied: true,
                            deviceInfo: navigator.userAgent,
                          };
                          onVerified?.(data);
                          setIsOpen(false);
                        }}
                      >
                        تطبيق الختم بدون تحقق
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Verifying Step */}
            {step === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6 py-8"
              >
                <motion.div
                  className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(var(--primary), 0.4)',
                      '0 0 0 30px rgba(var(--primary), 0)',
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Fingerprint className="h-12 w-12 text-primary" />
                </motion.div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">جارٍ التحقق...</h3>
                  <p className="text-sm text-muted-foreground">
                    يرجى استخدام بصمتك أو وجهك للتأكيد
                  </p>
                </div>
              </motion.div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="relative inline-flex">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-28 h-28 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-white overflow-hidden"
                  >
                    {stampUrl ? (
                      <img
                        src={stampUrl}
                        alt="ختم الجهة"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Stamp className="h-12 w-12 text-emerald-600" />
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white"
                  >
                    <Lock className="h-5 w-5 text-white" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold text-emerald-600">
                      تم تطبيق الختم بنجاح!
                    </h3>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      هوية مؤكدة
                    </Badge>
                    <Badge className="gap-1 bg-violet-100 text-violet-700 border-violet-200">
                      <Shield className="h-3 w-3" />
                      ختم موثق
                    </Badge>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    فشل التحقق
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    تعذر التحقق من هويتك. يرجى المحاولة مرة أخرى.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    إلغاء
                  </Button>
                  <Button onClick={() => setStep('intro')} className="gap-2">
                    <Fingerprint className="h-4 w-4" />
                    إعادة المحاولة
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricStampVerification;
