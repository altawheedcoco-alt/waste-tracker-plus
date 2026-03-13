import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Fingerprint,
  PenTool,
  Stamp,
  CheckCircle2,
  Shield,
  Clock,
  Building2,
  FileCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import BiometricSignaturePad, { BiometricSignatureData } from './BiometricSignaturePad';

interface SignatureInfo {
  signedBy: string;
  signedAt: string;
  signatureUrl?: string;
  biometricVerified?: boolean;
  biometricType?: string;
  verificationId?: string;
}

interface DocumentSignatureSectionProps {
  organizationName: string;
  organizationType: 'generator' | 'transporter' | 'recycler';
  stampUrl?: string | null;
  signatureUrl?: string | null;
  userId?: string;
  userName?: string;
  signatures?: SignatureInfo[];
  onSign?: (data: BiometricSignatureData) => void;
  showStamp?: boolean;
  showSignature?: boolean;
  allowNewSignature?: boolean;
  compact?: boolean;
  className?: string;
}

const organizationTypeLabels = {
  generator: 'الجهة المولدة',
  transporter: 'الجهة الناقلة',
  recycler: 'الجهة المدورة',
};

const DocumentSignatureSection = ({
  organizationName,
  organizationType,
  stampUrl,
  signatureUrl,
  userId,
  signatures = [],
  onSign,
  showStamp: _showStamp = true,
  showSignature: _showSignature = true,
  allowNewSignature = false,
  compact = false,
  className,
}: DocumentSignatureSectionProps) => {
  // Digital verification identity is MANDATORY - stamp & signature always shown
  const showStamp = true;
  const showSignature = true;
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSignComplete = (data: BiometricSignatureData) => {
    onSign?.(data);
    setDialogOpen(false);
  };

  const renderStampAndSignature = () => (
    <div className={cn('flex items-center gap-4', compact ? 'flex-row' : 'flex-col')}>
      {showStamp && (
        <div className="text-center">
          <div
            className={cn(
              'mx-auto rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-background',
              compact ? 'w-16 h-16' : 'w-24 h-24'
            )}
          >
            {stampUrl ? (
              <img
                src={stampUrl}
                alt="ختم الجهة"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <Stamp className={cn('text-muted-foreground/50', compact ? 'h-6 w-6' : 'h-8 w-8')} />
            )}
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1">الختم</p>
          )}
        </div>
      )}

      {showSignature && (
        <div className="text-center">
          <div
            className={cn(
              'mx-auto border-b-2 border-muted-foreground/30 flex items-end justify-center overflow-hidden',
              compact ? 'w-20 h-8' : 'w-32 h-12'
            )}
          >
            {signatureUrl ? (
              <img
                src={signatureUrl}
                alt="توقيع الجهة"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <PenTool className={cn('text-muted-foreground/30 mb-1', compact ? 'h-4 w-4' : 'h-5 w-5')} />
            )}
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
          )}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={cn('p-3 border rounded-lg bg-muted/30', className)}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{organizationName}</span>
            <Badge variant="outline" className="text-xs">
              {organizationTypeLabels[organizationType]}
            </Badge>
          </div>
          {renderStampAndSignature()}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {organizationTypeLabels[organizationType]}
            </CardTitle>
            <CardDescription>{organizationName}</CardDescription>
          </div>
          {signatures.some((s) => s.biometricVerified) && (
            <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
              <Shield className="h-3 w-3" />
              موثق بيومترياً
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          {renderStampAndSignature()}
        </div>

        {signatures.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">التوقيعات الرقمية:</p>
              {signatures.map((sig, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      sig.biometricVerified
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-primary/10 text-primary'
                    )}>
                      {sig.biometricVerified ? (
                        <Fingerprint className="h-4 w-4" />
                      ) : (
                        <PenTool className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sig.signedBy}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(sig.signedAt), 'dd MMM yyyy - hh:mm a', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {sig.biometricVerified && (
                      <Badge variant="outline" className="text-xs gap-1 border-emerald-200 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {sig.biometricType === 'fingerprint' ? 'بصمة' : 'وجه'}
                      </Badge>
                    )}
                    {sig.signatureUrl && (
                      <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                        <PenTool className="h-3 w-3" />
                        موقع
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {allowNewSignature && userId && (
          <>
            <Separator />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <FileCheck className="h-4 w-4" />
                  إضافة توقيعي
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    توقيع المستند
                  </DialogTitle>
                </DialogHeader>
                <BiometricSignaturePad
                  userId={userId}
                  purpose={`توقيع مستند - ${organizationName}`}
                  onComplete={handleSignComplete}
                  requireBiometric={false}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSignatureSection;
