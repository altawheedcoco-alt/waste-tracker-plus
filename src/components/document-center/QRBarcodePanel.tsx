/**
 * لوحة QR وباركود — إدارة رموز التحقق المضمنة في المستندات
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, ScanLine, FileCheck, ArrowRight, Printer, Shield, Barcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: QrCode,
    title: 'رموز QR للمستندات',
    description: 'كل مستند رسمي يحتوي على رمز QR فريد للتحقق الفوري من صحته',
    action: '/dashboard/document-verification',
    actionLabel: 'التحقق من مستند',
  },
  {
    icon: ScanLine,
    title: 'الماسح الضوئي',
    description: 'امسح أي باركود أو رمز QR من المستندات المطبوعة للتحقق الفوري',
    action: '/scan',
    actionLabel: 'فتح الماسح',
  },
  {
    icon: Barcode,
    title: 'أكواد الشحنات',
    description: 'كل شحنة تحمل كود تتبع فريد يمكن مسحه ضوئياً في أي مرحلة',
    action: '/dashboard/shipments',
    actionLabel: 'عرض الشحنات',
  },
  {
    icon: Shield,
    title: 'التحقق العام',
    description: 'رابط عام يتيح لأي طرف التحقق من صحة المستندات بدون تسجيل دخول',
    action: '/verify',
    actionLabel: 'صفحة التحقق العامة',
  },
  {
    icon: Printer,
    title: 'الطباعة مع رموز الأمان',
    description: 'جميع المستندات المطبوعة تتضمن رموز QR + باركود + كود تحقق نصي',
    action: '/dashboard/print-center',
    actionLabel: 'مركز الطباعة',
  },
  {
    icon: FileCheck,
    title: 'أنماط الجيلوش الأمنية',
    description: 'خلفيات أمنية مشابهة للأوراق النقدية لحماية الشهادات من التزوير',
    action: '/dashboard/guilloche-patterns',
    actionLabel: 'إدارة الأنماط',
  },
];

const QRBarcodePanel = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map((f) => {
        const Icon = f.icon;
        return (
          <Card key={f.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-sm">{f.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-xs">{f.description}</CardDescription>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigate(f.action)}>
                {f.actionLabel}
                <ArrowRight className="w-3.5 h-3.5 mr-auto rtl:rotate-180" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QRBarcodePanel;
