import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Key, Eye, EyeOff, Loader2, Save, Mail, Lock } from 'lucide-react';

interface MemberCredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  memberName: string;
  currentEmail?: string;
}

export default function MemberCredentialsDialog({
  open,
  onClose,
  targetUserId,
  memberName,
  currentEmail,
}: MemberCredentialsDialogProps) {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newEmail && !newPassword) {
      toast.error('أدخل البريد الجديد أو كلمة المرور الجديدة');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('update-member-credentials', {
        body: {
          mode: 'manage',
          target_user_id: targetUserId,
          new_email: newEmail || undefined,
          new_password: newPassword || undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success(response.data?.message || 'تم تحديث بيانات الدخول بنجاح');
      setNewEmail('');
      setNewPassword('');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { if (!loading) onClose(); }}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            تعديل بيانات دخول: {memberName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {currentEmail && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              البريد الحالي: <span dir="ltr" className="font-mono">{currentEmail}</span>
            </p>
          )}

          <div>
            <Label className="flex items-center gap-1 text-sm">
              <Mail className="w-4 h-4" /> البريد الإلكتروني الجديد
            </Label>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="أدخل البريد الجديد (اختياري)"
              type="email"
              dir="ltr"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1 text-sm">
              <Lock className="w-4 h-4" /> كلمة المرور الجديدة
            </Label>
            <div className="relative mt-1">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (اختياري)"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">6 أحرف على الأقل</p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
