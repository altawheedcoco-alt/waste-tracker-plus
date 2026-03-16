import { useAuth } from '@/contexts/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, MapPin, Stamp, PenTool, FileCheck } from 'lucide-react';

export default function BrandIdentityTab() {
  const { organization } = useAuth();

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">لا توجد بيانات جهة</p>
      </div>
    );
  }

  const org = organization as any;

  const fields = [
    { icon: Building2, label: 'اسم الجهة', value: org.name },
    { icon: Mail, label: 'البريد الإلكتروني', value: org.email },
    { icon: Phone, label: 'الهاتف', value: org.phone },
    { icon: MapPin, label: 'العنوان', value: org.address },
    { icon: MapPin, label: 'المدينة', value: org.city },
    { icon: FileCheck, label: 'السجل التجاري', value: org.commercial_register },
    { icon: Building2, label: 'اسم الممثل', value: org.representative_name },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            بيانات الهوية المؤسسية
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            هذه البيانات تُدمج تلقائياً في كل مستند يتم إنشاؤه
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <f.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground min-w-[100px]">{f.label}:</span>
              <span className="font-medium">{f.value || '—'}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stamp className="w-5 h-5 text-primary" />
            الختم والتوقيع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 text-center">
              {org.stamp_url ? (
                <img src={org.stamp_url} alt="ختم" className="w-20 h-20 mx-auto object-contain" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Stamp className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">الختم الرسمي</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              {org.signature_url ? (
                <img src={org.signature_url} alt="توقيع" className="w-20 h-20 mx-auto object-contain" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">التوقيع</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            💡 يمكنك تحديث الختم والتوقيع من إعدادات الجهة
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Badge className="mt-0.5">تلميح</Badge>
            <p className="text-xs text-muted-foreground">
              عند إنشاء مستند جديد، سيتم تضمين بيانات الجهة (الاسم، العنوان، الهاتف، البريد) تلقائياً في الترويسة والتذييل.
              يمكنك طلب تعديل أي من هذه البيانات أثناء المحادثة مع المساعد الذكي.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
