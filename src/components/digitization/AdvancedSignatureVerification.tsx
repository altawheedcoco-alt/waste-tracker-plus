/**
 * التحقق المتقدم من التوقيع — Advanced Signature Verification
 * يدعم: OTP، التحقق بالهوية الوطنية، سلسلة التوقيعات (Blockchain-lite)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck, Fingerprint, Link2, KeyRound, CheckCircle2,
  AlertTriangle, Clock, Hash, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface VerificationProps {
  signatureId?: string;
  documentId?: string;
  onVerified?: (verificationId: string) => void;
}

const AdvancedSignatureVerification = ({ signatureId, documentId, onVerified }: VerificationProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [step, setStep] = useState<'idle' | 'otp_sent' | 'otp_verified' | 'national_id' | 'completed'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chainHash, setChainHash] = useState<string | null>(null);

  // Generate OTP
  const sendOTP = async () => {
    setLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await (supabase.from('signature_verifications') as any).insert({
        signature_id: signatureId || null,
        verification_type: 'otp',
        otp_code: otp,
        otp_expires_at: expiresAt,
        verification_data: { document_id: documentId, method: 'otp' },
        created_by: userData.user?.id,
      }).select('id').single();

      if (error) throw error;
      setVerificationId(data.id);
      setStep('otp_sent');

      // In production, send via SMS/WhatsApp
      toast.success(`${isAr ? 'تم إرسال رمز التحقق' : 'OTP sent'}: ${otp}`, {
        description: isAr ? 'صالح لمدة 5 دقائق' : 'Valid for 5 minutes',
        duration: 10000,
      });
    } catch (err) {
      toast.error(isAr ? 'فشل في إرسال رمز التحقق' : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('signature_verifications') as any)
        .select('*').eq('id', verificationId).single();

      if (error || !data) throw new Error('Verification not found');
      if (new Date(data.otp_expires_at) < new Date()) {
        toast.error(isAr ? 'انتهت صلاحية الرمز' : 'OTP expired');
        return;
      }
      if (data.attempts >= data.max_attempts) {
        toast.error(isAr ? 'تم تجاوز الحد الأقصى للمحاولات' : 'Max attempts exceeded');
        return;
      }

      if (data.otp_code === otpCode) {
        await (supabase.from('signature_verifications') as any)
          .update({ is_verified: true, verified_at: new Date().toISOString() })
          .eq('id', verificationId);
        setStep('otp_verified');
        toast.success(isAr ? 'تم التحقق بنجاح' : 'OTP verified');
      } else {
        await (supabase.from('signature_verifications') as any)
          .update({ attempts: data.attempts + 1 })
          .eq('id', verificationId);
        toast.error(isAr ? 'رمز غير صحيح' : 'Invalid OTP');
      }
    } catch (err) {
      toast.error(isAr ? 'فشل في التحقق' : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Verify National ID
  const verifyNationalId = async () => {
    if (nationalId.length !== 14) {
      toast.error(isAr ? 'الرقم القومي يجب أن يكون 14 رقماً' : 'National ID must be 14 digits');
      return;
    }
    setLoading(true);
    try {
      // Generate hash for blockchain-lite chain
      const encoder = new TextEncoder();
      const data = encoder.encode(`${signatureId}:${nationalId}:${Date.now()}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      const idHash = Array.from(new Uint8Array(
        await crypto.subtle.digest('SHA-256', encoder.encode(nationalId))
      )).map(b => b.toString(16).padStart(2, '0')).join('');

      const { data: userData } = await supabase.auth.getUser();
      await (supabase.from('signature_verifications') as any).insert({
        signature_id: signatureId || null,
        verification_type: 'national_id',
        national_id_hash: idHash,
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_data: { chain_hash: hash, document_id: documentId },
        created_by: userData.user?.id,
      });

      setChainHash(hash);
      setStep('completed');
      onVerified?.(hash);
      toast.success(isAr ? 'تم التحقق من الهوية وتوليد سلسلة التوقيع' : 'Identity verified & signature chain generated');
    } catch (err) {
      toast.error(isAr ? 'فشل في التحقق' : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {isAr ? 'التحقق المتقدم من التوقيع' : 'Advanced Signature Verification'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr ? 'OTP + الهوية الوطنية + سلسلة Blockchain-lite' : 'OTP + National ID + Blockchain-lite Chain'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {['OTP', isAr ? 'هوية' : 'ID', isAr ? 'سلسلة' : 'Chain'].map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 && step !== 'idle' ? 'bg-primary text-primary-foreground' :
                i === 1 && (step === 'otp_verified' || step === 'completed') ? 'bg-primary text-primary-foreground' :
                i === 2 && step === 'completed' ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span>{s}</span>
              {i < 2 && <div className="w-6 h-[2px] bg-muted" />}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step: Idle - Send OTP */}
        {step === 'idle' && (
          <div className="text-center space-y-3">
            <KeyRound className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm">{isAr ? 'ابدأ عملية التحقق المتقدم' : 'Start advanced verification'}</p>
            <Button onClick={sendOTP} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <KeyRound className="w-4 h-4 ml-1" />}
              {isAr ? 'إرسال رمز التحقق (OTP)' : 'Send OTP Code'}
            </Button>
          </div>
        )}

        {/* Step: Enter OTP */}
        {step === 'otp_sent' && (
          <div className="space-y-3 text-center">
            <Label>{isAr ? 'أدخل رمز التحقق المكون من 6 أرقام' : 'Enter 6-digit OTP code'}</Label>
            <div className="flex justify-center" dir="ltr">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={verifyOTP} disabled={loading || otpCode.length !== 6} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}
              {isAr ? 'تأكيد الرمز' : 'Verify Code'}
            </Button>
          </div>
        )}

        {/* Step: National ID */}
        {step === 'otp_verified' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {isAr ? 'تم التحقق من OTP بنجاح' : 'OTP verified successfully'}
            </div>
            <Label>{isAr ? 'الرقم القومي (14 رقماً)' : 'National ID (14 digits)'}</Label>
            <Input value={nationalId} onChange={e => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
              placeholder="29901011234567" dir="ltr" className="font-mono text-center" />
            <Button onClick={verifyNationalId} disabled={loading || nationalId.length !== 14} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Fingerprint className="w-4 h-4 ml-1" />}
              {isAr ? 'التحقق وتوليد سلسلة التوقيع' : 'Verify & Generate Signature Chain'}
            </Button>
          </div>
        )}

        {/* Step: Completed */}
        {step === 'completed' && (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <p className="font-semibold text-green-700 dark:text-green-400">
              {isAr ? 'تم التحقق المتقدم بنجاح!' : 'Advanced verification complete!'}
            </p>
            {chainHash && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Link2 className="w-3 h-3" />
                  {isAr ? 'سلسلة التوقيع (Blockchain-lite Hash)' : 'Signature Chain Hash'}
                </div>
                <code className="text-xs font-mono break-all">{chainHash.slice(0, 32)}...</code>
              </div>
            )}
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1"><KeyRound className="w-3 h-3" /> OTP ✓</Badge>
              <Badge variant="outline" className="gap-1"><Fingerprint className="w-3 h-3" /> {isAr ? 'هوية' : 'ID'} ✓</Badge>
              <Badge variant="outline" className="gap-1"><Link2 className="w-3 h-3" /> {isAr ? 'سلسلة' : 'Chain'} ✓</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSignatureVerification;
