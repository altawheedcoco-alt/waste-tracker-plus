/**
 * شارة بيئية رقمية - يمكن تضمينها في الموقع الإلكتروني
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Copy, ExternalLink, Leaf } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMemo } from 'react';

const EcoBadgeWidget = () => {
  const { organization } = useAuth();

  const badge = useMemo(() => {
    const name = organization?.name || 'شركتك';
    const year = new Date().getFullYear();
    return {
      html: `<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:12px;background:linear-gradient(135deg,#10b981,#059669);color:white;font-family:sans-serif;font-size:14px;"><span style="font-size:20px;">♻️</span><span><strong>${name}</strong><br/><small>شريك بيئي معتمد ${year} — iRecycle</small></span></div>`,
      text: `♻️ ${name} — شريك بيئي معتمد ${year} — iRecycle`,
    };
  }, [organization]);

  const copyHtml = () => {
    navigator.clipboard.writeText(badge.html);
    toast.success('تم نسخ كود الشارة!');
  };

  return (
    <Card className="border-green-200/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <Award className="h-4 w-4 text-green-600" />
          الشارة البيئية الرقمية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        <div className="flex items-center justify-center p-4 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <div className="text-center">
            <Leaf className="h-8 w-8 mx-auto mb-2" />
            <p className="font-bold text-sm">{organization?.name || 'شركتك'}</p>
            <p className="text-xs opacity-90">شريك بيئي معتمد {new Date().getFullYear()}</p>
            <Badge className="mt-2 bg-white/20 text-white text-[10px]">iRecycle Certified</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs" onClick={copyHtml}>
            <Copy className="h-3 w-3" />
            نسخ كود HTML
          </Button>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <ExternalLink className="h-3 w-3" />
            معاينة
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          ألصق الكود في موقعك الإلكتروني لعرض شارة الالتزام البيئي
        </p>
      </CardContent>
    </Card>
  );
};

export default EcoBadgeWidget;
