import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onSuccess?: () => void;
}

const ResetPasswordDialog = ({ 
  open, 
  onOpenChange, 
  user,
  onSuccess 
}: ResetPasswordDialogProps) => {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!user) return;

    if (newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);

    try {
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: {
          targetUserId: user.user_id,
          newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'فشل في إعادة تعيين كلمة المرور');
      }

      toast({
        title: 'تم بنجاح',
        description: `تم إعادة تعيين كلمة مرور ${user.full_name}`,
      });

      onOpenChange(false);
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في إعادة تعيين كلمة المرور',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          <DialogDescription>
            تعيين كلمة مرور جديدة لـ {user?.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              className="text-right"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isResetting}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleReset}
            disabled={isResetting || !newPassword || !confirmPassword}
          >
            {isResetting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            تعيين كلمة المرور
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
