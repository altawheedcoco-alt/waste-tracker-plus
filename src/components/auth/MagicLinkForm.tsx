/**
 * MagicLinkForm — تسجيل دخول بدون كلمة مرور
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Wand2, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MagicLinkFormProps {
  onBack: () => void;
}

const MagicLinkForm = ({ onBack }: MagicLinkFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin + '/dashboard' },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err?.message || 'حدث خطأ أثناء إرسال الرابط', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-4"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">تم إرسال الرابط! ✉️</h3>
          <p className="text-sm text-muted-foreground mt-2">
            تم إرسال رابط الدخول إلى <span className="font-semibold text-foreground" dir="ltr">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">تحقق من بريدك الإلكتروني واضغط على الرابط للدخول</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
          <ArrowRight className="w-4 h-4" />
          العودة لتسجيل الدخول
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="text-center mb-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Wand2 className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          سنرسل لك رابط دخول مباشر — بدون الحاجة لكلمة مرور
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="magic-email" className="text-sm font-medium flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          البريد الإلكتروني
        </Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="example@company.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-colors"
          dir="ltr"
          required
        />
      </div>

      <Button type="submit" className="w-full h-11 rounded-xl text-base font-semibold gap-2" disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
        {loading ? 'جاري الإرسال...' : 'إرسال رابط الدخول'}
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="w-full gap-1.5 text-muted-foreground">
        <ArrowRight className="w-4 h-4" />
        العودة لتسجيل الدخول التقليدي
      </Button>
    </motion.form>
  );
};

export default MagicLinkForm;
