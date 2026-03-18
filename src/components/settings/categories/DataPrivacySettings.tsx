import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Download, Trash2, Eye, FileWarning, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const DataPrivacySettings = () => {
  const [shareAnalytics, setShareAnalytics] = useState(false);
  const [activityLog, setActivityLog] = useState(true);
  const [dataRetention, setDataRetention] = useState(true);

  return (
    <div className="space-y-4">
      {/* Privacy Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-l from-primary/5 to-background">
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">الخصوصية وحماية البيانات</h3>
              <p className="text-sm text-muted-foreground">تحكم في كيفية تخزين واستخدام بياناتك</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Toggles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />إعدادات الخصوصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">مشاركة بيانات التحليلات</p>
              <p className="text-xs text-muted-foreground">المساعدة في تحسين المنصة عبر مشاركة بيانات الاستخدام المجهولة</p>
            </div>
            <Switch checked={shareAnalytics} onCheckedChange={setShareAnalytics} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">سجل النشاط</p>
              <p className="text-xs text-muted-foreground">تسجيل جميع الإجراءات التي تقوم بها لأغراض التدقيق</p>
            </div>
            <Switch checked={activityLog} onCheckedChange={setActivityLog} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">الاحتفاظ بالبيانات المحذوفة</p>
              <p className="text-xs text-muted-foreground">الاحتفاظ بنسخة من البيانات المحذوفة لمدة 90 يوماً</p>
            </div>
            <Switch checked={dataRetention} onCheckedChange={setDataRetention} />
          </div>
        </CardContent>
      </Card>

      {/* Data Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-primary" />إدارة البيانات
          </CardTitle>
          <CardDescription className="text-xs">تصدير أو حذف بياناتك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full gap-2 justify-start" size="sm">
            <Download className="h-4 w-4" />
            تصدير جميع البيانات (CSV/JSON)
          </Button>
          <Button variant="outline" className="w-full gap-2 justify-start" size="sm">
            <Clock className="h-4 w-4" />
            عرض سجل النشاط الكامل
          </Button>
          <Separator />
          <Button variant="outline" className="w-full gap-2 justify-start text-destructive hover:text-destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            طلب حذف الحساب نهائياً
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            سيتم معالجة طلب الحذف خلال 30 يوماً وفقاً لسياسة حماية البيانات
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataPrivacySettings;
