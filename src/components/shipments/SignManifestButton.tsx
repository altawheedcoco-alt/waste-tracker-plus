import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { PenTool, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SignManifestButtonProps {
  shipmentId: string;
  shipmentNumber: string;
  /** Document type to sign */
  documentType?: 'manifest' | 'shipment_tracking';
  /** Button label override */
  label?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  manifest: 'المانيفست',
  shipment_tracking: 'نموذج تتبع نقل المخلفات',
};

const SignManifestButton = ({
  shipmentId,
  shipmentNumber,
  documentType = 'manifest',
  label,
  variant = 'outline',
  size = 'sm',
  className = '',
}: SignManifestButtonProps) => {
  const { user, profile, organization } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [signing, setSigning] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkExistingSignature = useCallback(async () => {
    if (!user?.id) return;
    setChecking(true);
    try {
      const { data } = await supabase
        .from('document_signatures')
        .select('id')
        .eq('document_id', shipmentId)
        .eq('document_type', documentType)
        .eq('signed_by', user.id)
        .maybeSingle();
      setAlreadySigned(!!data);
    } catch (e) {
      console.error('Check signature error:', e);
    } finally {
      setChecking(false);
    }
  }, [shipmentId, user?.id]);

  const handleOpen = async () => {
    setShowDialog(true);
    await checkExistingSignature();
  };

  const handleSign = async () => {
    if (!user?.id || !organization?.id) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setSigning(true);
    try {
      // Generate document hash
      const docData = `${shipmentNumber}|${shipmentId}|${new Date().toISOString()}`;
      let hash = 0;
      for (let i = 0; i < docData.length; i++) {
        hash = ((hash << 5) - hash) + docData.charCodeAt(i);
        hash = hash & hash;
      }
      const documentHash = Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
      const signatureHash = `SIG-${documentHash.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

      // Get organization signature/stamp if available
      const [sigResult, stampResult] = await Promise.all([
        (supabase.from('organization_signatures') as any)
          .select('signature_url')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
        (supabase.from('organization_stamps') as any)
          .select('stamp_url')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
      ]);

      const signerRole = organization.organization_type === 'generator' ? 'generator'
        : organization.organization_type === 'transporter' ? 'transporter'
        : organization.organization_type === 'recycler' ? 'recycler'
        : 'other';

      const { error } = await supabase
        .from('document_signatures')
        .insert({
          document_id: shipmentId,
          document_type: documentType,
          signed_by: user.id,
          signer_name: profile?.full_name || user.email || 'غير معروف',
          signer_role: signerRole,
          signer_title: (profile as any)?.job_title || null,
          organization_id: organization.id,
          signature_method: 'digital',
          signature_image_url: sigResult?.data?.signature_url || null,
          stamp_image_url: stampResult?.data?.stamp_url || null,
          stamp_applied: !!stampResult?.data?.stamp_url,
          document_hash: documentHash,
          signature_hash: signatureHash,
          status: 'signed',
          device_info: navigator.userAgent.slice(0, 100),
          timestamp_signed: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success(`تم التوقيع على ${DOC_TYPE_LABELS[documentType]} بنجاح`, {
        description: `كود التوقيع: ${signatureHash}`,
      });
      setAlreadySigned(true);
      setShowDialog(false);
    } catch (error: any) {
      console.error('Signing error:', error);
      toast.error(`فشل في التوقيع على ${DOC_TYPE_LABELS[documentType]}`);
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
        onClick={handleOpen}
      >
        <PenTool className="w-4 h-4" />
        {size !== 'icon' && (label || 'توقيع')}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              التوقيع على {DOC_TYPE_LABELS[documentType]}
            </DialogTitle>
            <DialogDescription>
              مانيفست الشحنة {shipmentNumber}
            </DialogDescription>
          </DialogHeader>

          {checking ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : alreadySigned ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="w-12 h-12 text-primary" />
              <p className="text-sm font-semibold text-primary">تم التوقيع على هذا المانيفست مسبقاً</p>
              <p className="text-xs text-muted-foreground">لا يمكن التوقيع أكثر من مرة</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الموقع:</span>
                  <span className="font-medium">{profile?.full_name || user?.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الجهة:</span>
                  <span className="font-medium">{organization?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الصفة:</span>
                  <span className="font-medium">{(profile as any)?.job_title || organization?.organization_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span className="font-medium">{new Date().toLocaleString('ar-EG')}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <AlertCircle className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-accent-foreground">
                  بالتوقيع أقر بأن البيانات الواردة في هذا المانيفست صحيحة ودقيقة وأتحمل المسؤولية القانونية الكاملة.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              إلغاء
            </Button>
            {!alreadySigned && !checking && (
              <Button onClick={handleSign} disabled={signing} className="gap-2">
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                {signing ? 'جاري التوقيع...' : 'تأكيد التوقيع'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignManifestButton;
