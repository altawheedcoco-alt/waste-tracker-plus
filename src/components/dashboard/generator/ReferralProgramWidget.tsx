/**
 * نظام الإحالات - اكسب مكافآت عند ترشيح عملاء جدد
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Share2, Users, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ReferralProgramWidget = () => {
  const { organization } = useAuth();
  const referralCode = `REF-${organization?.id?.slice(0, 6).toUpperCase() || 'XXXX'}`;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('تم نسخ رابط الإحالة!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: 'iRecycle - إدارة ذكية للمخلفات', text: `انضم لمنصة iRecycle واستفد من خصم خاص! كود الإحالة: ${referralCode}`, url: referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <Card className="border-purple-200/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Gift className="h-4 w-4 text-purple-600" />
          برنامج الإحالات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 text-center">
          <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
          <p className="text-sm font-medium">ادعُ شركاء جدد واحصل على مكافآت!</p>
          <p className="text-xs text-muted-foreground mt-1">خصم 10% لكل إحالة ناجحة</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">كود الإحالة الخاص بك:</p>
          <div className="flex gap-2">
            <Input value={referralCode} readOnly className="h-9 text-xs font-mono text-center" />
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-1">
              <Copy className="h-3 w-3" />
              {copied ? 'تم!' : 'نسخ'}
            </Button>
          </div>
        </div>

        <Button variant="default" className="w-full gap-2" onClick={shareLink}>
          <Share2 className="h-4 w-4" />
          مشاركة الرابط
        </Button>

        <div className="flex justify-around pt-2 border-t text-center">
          <div>
            <p className="text-lg font-bold text-purple-600">0</p>
            <p className="text-[10px] text-muted-foreground">إحالات</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">0</p>
            <p className="text-[10px] text-muted-foreground">مسجلين</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">0</p>
            <p className="text-[10px] text-muted-foreground">مكافآت</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralProgramWidget;
