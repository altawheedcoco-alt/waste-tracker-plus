import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BiometricSignaturePad, { BiometricSignatureData } from './BiometricSignaturePad';
import { useDocumentSignature } from '@/hooks/useDocumentSignature';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { toast } from 'sonner';

interface SignDocumentButtonProps {
  documentType: 'certificate' | 'contract' | 'receipt' | 'report' | 'shipment';
  documentId: string;
  documentTitle?: string;
  onSigned?: (signatureData: BiometricSignatureData) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const documentTypeLabels = {
  certificate: 'شهادة إعادة التدوير',
  contract: 'العقد',
  receipt: 'إيصال الاستلام',
  report: 'التقرير',
  shipment: 'الشحنة',
};

const SignDocumentButton = ({
  documentType,
  documentId,
  documentTitle,
  onSigned,
  variant = 'outline',
  size = 'default',
  className,
  disabled = false,
  children,
}: SignDocumentButtonProps) => {
  const { user, profile, organization } = useAuth();
  const { signDocument, isLoading } = useDocumentSignature();
  const { hasActiveSubscription, isExempt } = useSubscriptionStatus();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signed, setSigned] = useState(false);

  const canSign = isExempt || hasActiveSubscription;

  const handleSignComplete = async (data: BiometricSignatureData) => {
    if (!user?.id || !organization?.id || !profile?.full_name) {
      return;
    }

    // Save signature to database
    const result = await signDocument({
      documentType,
      documentId,
      organizationId: organization.id,
      signerId: user.id,
      signerName: profile.full_name,
      signerRole: (profile as any)?.signature_authority_level || undefined,
      signatureData: data,
      stampApplied: true,
      stampVerifiedBiometrically: data.biometricVerified,
    });

    if (result) {
      setSigned(true);
      onSigned?.(data);
      
      // Close dialog after success
      setTimeout(() => {
        setDialogOpen(false);
      }, 1500);
    }
  };

  if (!user?.id) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={signed ? 'default' : variant}
          size={size}
          disabled={disabled || isLoading || !canSign}
          title={!canSign ? 'يلزم اشتراك نشط للتوقيع' : undefined}
          onClick={(e) => {
            if (!canSign) {
              e.preventDefault();
              toast.error('يلزم اشتراك نشط للتوقيع على المستندات. يرجى تجديد اشتراكك أولاً.');
            }
          }}
          className={cn(
            'gap-2',
            signed && 'bg-emerald-600 hover:bg-emerald-700',
            className
          )}
        >
          {signed ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              تم التوقيع
            </>
          ) : children ? (
            children
          ) : (
            <>
              <FileCheck className="h-4 w-4" />
              توقيع المستند
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            توقيع {documentTypeLabels[documentType]}
          </DialogTitle>
        </DialogHeader>

        {documentTitle && (
          <p className="text-sm text-muted-foreground text-center py-2">
            {documentTitle}
          </p>
        )}

        <BiometricSignaturePad
          userId={user.id}
          purpose={`توقيع ${documentTypeLabels[documentType]} - ${documentId}`}
          onComplete={handleSignComplete}
          requireBiometric={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SignDocumentButton;

// Also export a simple badge to show biometric verification status
export const BiometricVerifiedBadge = ({ 
  verified, 
  biometricType,
  compact = false 
}: { 
  verified: boolean; 
  biometricType?: string;
  compact?: boolean;
}) => {
  if (!verified) return null;

  return (
    <Badge
      className={cn(
        'gap-1',
        compact ? 'text-[6pt] px-1 py-0' : 'text-xs',
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
      )}
    >
      {biometricType === 'fingerprint' ? (
        <Fingerprint className={cn(compact ? 'h-2 w-2' : 'h-3 w-3')} />
      ) : (
        <Shield className={cn(compact ? 'h-2 w-2' : 'h-3 w-3')} />
      )}
      {!compact && 'موثق بيومترياً'}
    </Badge>
  );
};
