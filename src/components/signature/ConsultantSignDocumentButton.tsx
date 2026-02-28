import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileCheck, Shield, CheckCircle2, Building2, AlertTriangle,
  Clock, Stamp, Users, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BiometricSignaturePad, { BiometricSignatureData } from './BiometricSignaturePad';
import { useConsultantCoSigning } from '@/hooks/useConsultantCoSigning';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ConsultantSignDocumentButtonProps {
  documentType: string;
  documentId: string;
  organizationId: string;
  documentTitle?: string;
  onSigned?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}

const ConsultantSignDocumentButton = memo(({
  documentType,
  documentId,
  organizationId,
  documentTitle,
  onSigned,
  variant = 'outline',
  size = 'default',
  className,
  disabled = false,
}: ConsultantSignDocumentButtonProps) => {
  const { user } = useAuth();
  const { consultantProfile, getCoSigningContext, signWithCoSigning, isInOffice } = useConsultantCoSigning();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);

  const context = getCoSigningContext(documentType);

  const handleSignComplete = async (data: BiometricSignatureData) => {
    if (!consultantProfile?.id) {
      toast.error('لم يتم العثور على ملفك كاستشاري');
      return;
    }

    setSigning(true);
    try {
      const result = await signWithCoSigning({
        consultantId: (consultantProfile as any).id,
        documentType,
        documentId,
        organizationId,
        signatureData: data.signatureDataUrl || undefined,
        stampApplied: true,
        notes: undefined,
      });

      if (result) {
        setSigned(true);
        onSigned?.();
        setTimeout(() => setDialogOpen(false), 1500);
      }
    } finally {
      setSigning(false);
    }
  };

  if (!user?.id || !consultantProfile) return null;

  // Check if excluded
  const isExcluded = context.excludedDocumentTypes.includes(documentType);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={signed ? 'default' : variant}
          size={size}
          disabled={disabled || signing || isExcluded}
          title={isExcluded ? 'ليس لديك صلاحية التوقيع على هذا النوع' : undefined}
          className={cn('gap-2', signed && 'bg-primary', className)}
        >
          {signed ? (
            <><CheckCircle2 className="h-4 w-4" />تم التوقيع</>
          ) : (
            <><FileCheck className="h-4 w-4" />توقيع استشاري</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            توقيع المستند كاستشاري بيئي
          </DialogTitle>
        </DialogHeader>

        {documentTitle && (
          <p className="text-sm text-muted-foreground text-center py-1">{documentTitle}</p>
        )}

        {/* Co-signing context card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-medium">{(consultantProfile as any)?.full_name}</span>
              {context.roleTitle && (
                <Badge variant="outline" className="text-[10px]">{context.roleTitle}</Badge>
              )}
            </div>

            {isInOffice && context.officeName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>{context.officeName}</span>
              </div>
            )}

            {/* Solidarity clause */}
            {context.solidarityStatement && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                <Users className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">{context.solidarityStatement}</p>
              </div>
            )}

            {/* Approval notice */}
            {context.requiresDirectorApproval && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">سيتم إرسال التوقيع لمدير المكتب للاعتماد</p>
              </div>
            )}

            {/* Office stamp indicator */}
            {context.officeId && !context.requiresDirectorApproval && (
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground">سيتم تطبيق ختم المكتب تلقائياً</span>
              </div>
            )}

            {/* Independent signing */}
            {!isInOffice && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">توقيع مستقل — بدون تغطية مكتب استشاري</span>
              </div>
            )}
          </CardContent>
        </Card>

        <BiometricSignaturePad
          userId={user.id}
          purpose={`توقيع استشاري - ${documentType} - ${documentId}`}
          onComplete={handleSignComplete}
          requireBiometric={false}
        />
      </DialogContent>
    </Dialog>
  );
});

ConsultantSignDocumentButton.displayName = 'ConsultantSignDocumentButton';
export default ConsultantSignDocumentButton;
