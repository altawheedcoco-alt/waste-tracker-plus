import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Key, Eye, EyeOff, Loader2, Save, Mail, Lock, ChevronDown, ChevronUp } from 'lucide-react';

export default function MyCredentialsCard() {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
          mode: 'self',
          new_email: newEmail || undefined,
          new_password: newPassword || undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast.success('تم تحديث بيانات الدخول بنجاح');
      setNewEmail('');
      setNewPassword('');
      setExpanded(false);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            تعديل بيانات الدخول الخاصة بك
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="gap-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'إغلاق' : 'تعديل'}
          </Button>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-3 pt-0">
          <div>
            <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> البريد الإلكتروني الجديد</Label>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="أدخل البريد الجديد"
              type="email"
              dir="ltr"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> كلمة المرور الجديدة</Label>
            <div className="relative mt-1">
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
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
          </div>
          <Button size="sm" className="w-full gap-2" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
