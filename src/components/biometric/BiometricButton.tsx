import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Fingerprint, Scan, Eye, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useBiometricAuth, BiometricVerificationResult } from '@/hooks/useBiometricAuth';

interface BiometricButtonProps {
  userId: string;
  purpose?: string;
  onVerified?: (result: BiometricVerificationResult) => void;
  onError?: (error: string) => void;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
  disabled?: boolean;
}

export default function BiometricButton({
  userId,
  purpose = 'التحقق من الهوية',
  onVerified,
  onError,
  variant = 'default',
  className,
  disabled = false,
}: BiometricButtonProps) {
  const { 
    isLoading, 
    isSupported, 
    checkSupport, 
    verifyBiometric 
  } = useBiometricAuth();
  
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSupport().then(() => setChecking(false));
  }, [checkSupport]);

  const handleVerify = async () => {
    const result = await verifyBiometric(userId, purpose);
    
    if (result.success) {
      setVerified(true);
      onVerified?.(result);
      
      // Reset after 3 seconds
      setTimeout(() => setVerified(false), 3000);
    } else {
      onError?.(result.error || 'فشل التحقق');
    }
  };

  if (checking) {
    return (
      <Button variant="outline" disabled className={cn("gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        جارٍ التحقق...
      </Button>
    );
  }

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              disabled 
              className={cn("gap-2 opacity-50", className)}
            >
              <Fingerprint className="h-4 w-4" />
              غير متاح
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>جهازك لا يدعم المصادقة البيومترية</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={verified ? 'default' : 'outline'}
              size="icon"
              onClick={handleVerify}
              disabled={disabled || isLoading}
              className={cn(
                'relative transition-all',
                verified && 'bg-emerald-500 hover:bg-emerald-600',
                className
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </motion.div>
                ) : verified ? (
                  <motion.div
                    key="verified"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="fingerprint"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Fingerprint className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{verified ? 'تم التحقق بنجاح' : 'انقر للتحقق بالبصمة'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        variant={verified ? 'default' : 'outline'}
        size="sm"
        onClick={handleVerify}
        disabled={disabled || isLoading}
        className={cn(
          'gap-2 transition-all',
          verified && 'bg-emerald-500 hover:bg-emerald-600 text-white',
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : verified ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        {verified ? 'تم التحقق' : 'بصمة'}
      </Button>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={verified ? { scale: [1, 1.02, 1] } : {}}
      className={cn('relative', className)}
    >
      <Button
        variant={verified ? 'default' : 'outline'}
        size="lg"
        onClick={handleVerify}
        disabled={disabled || isLoading}
        className={cn(
          'gap-3 min-w-[200px] transition-all duration-300',
          verified && 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500'
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 180 }}
              className="flex items-center gap-3"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>جارٍ التحقق...</span>
            </motion.div>
          ) : verified ? (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>تم التحقق بنجاح</span>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <Fingerprint className="h-6 w-6" />
                <motion.div
                  className="absolute inset-0 border-2 border-current rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              <span>التحقق بالبصمة</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {verified && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 right-0 left-0 text-center"
        >
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
            <Shield className="h-3 w-3" />
            هوية مؤكدة بيومترياً
          </Badge>
        </motion.div>
      )}
    </motion.div>
  );
}
