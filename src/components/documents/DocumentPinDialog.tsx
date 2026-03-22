/**
 * Document PIN Verification Dialog — ديالوج التحقق من رمز الأمان
 */
import { useState, useRef, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  actionType: 'download' | 'print' | 'view';
  onSuccess: () => void;
  organizationId?: string;
}

const ACTION_LABELS: Record<string, string> = {
  download: 'تحميل',
  print: 'طباعة',
  view: 'معاينة',
};

const DocumentPinDialog = ({ open, onOpenChange, documentId, actionType, onSuccess, organizationId }: DocumentPinDialogProps) => {
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleVerify = async () => {
    if (!pin || pin.length < 4) {
      setError('أدخل رمز الأمان (4 أرقام على الأقل)');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_documents')
        .select('protection_pin, organization_id')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      const docPin = (data as any)?.protection_pin;
      const docOrgId = (data as any)?.organization_id || organizationId;

      if (docPin === pin) {
        // Log successful access
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            await supabase.from('document_access_log').insert({
              document_id: documentId,
              user_id: user.id,
              action_type: `pin_verified_${actionType}`,
              success: true,
              user_agent: navigator.userAgent?.slice(0, 200),
            } as any);
          } catch {}
        }

        toast.success(`تم التحقق — يمكنك الآن ${ACTION_LABELS[actionType]} المستند`);
        onSuccess();
        onOpenChange(false);
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        // Log failed attempt
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('document_access_log').insert({
            document_id: documentId,
            user_id: user.id,
            action_type: 'pin_attempt_failed',
            success: false,
            user_agent: navigator.userAgent?.slice(0, 200),
          } as any).catch(() => {});
        }

        if (newAttempts >= 5) {
          setError('تم تجاوز الحد الأقصى للمحاولات (5). يُرجى التواصل مع مدير الجهة.');
          toast.error('تم حظر المحاولات — تواصل مع المدير');
        } else {
          setError(`رمز خاطئ. المحاولة ${newAttempts}/5`);
        }
        setPin('');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      setError('حدث خطأ في التحقق');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            مستند محمي
          </DialogTitle>
          <DialogDescription>
            هذا المستند محمي برمز أمان. أدخل الرمز لـ{ACTION_LABELS[actionType]} المستند.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="● ● ● ●"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="text-center text-2xl tracking-[0.5em] font-mono h-12"
              dir="ltr"
              disabled={attempts >= 5}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleVerify} disabled={verifying || attempts >= 5 || pin.length < 4} className="gap-2">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            تحقق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPinDialog;
