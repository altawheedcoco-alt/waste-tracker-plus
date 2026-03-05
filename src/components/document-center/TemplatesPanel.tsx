/**
 * لوحة القوالب والنماذج
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, ArrowRight, FileSignature, FileText, Printer, PenTool, Stamp, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const templateTypes = [
  { icon: FileText, title: 'قوالب العقود', desc: 'قوالب جاهزة لإنشاء عقود سريعة', path: '/dashboard/contract-templates' },
  { icon: FileSignature, title: 'قوالب التوقيع المتعدد', desc: 'قوالب اعتماد بأنماط متعددة', path: '/dashboard/multi-sign-templates' },
  { icon: Printer, title: 'قوالب المطبوعات', desc: 'تصاميم الورق الرسمي والمطبوعات', path: '/dashboard/stationery' },
  { icon: Layout, title: 'خطط المطبوعات', desc: 'إدارة خطط وتكاليف المطبوعات', path: '/dashboard/stationery-plans' },
  { icon: PenTool, title: 'إعدادات التوقيع الآلي', desc: 'ضبط التوقيع والختم التلقائي', path: '/dashboard/signing-status' },
  { icon: Stamp, title: 'ختم المستندات', desc: 'إضافة أختام وتوقيعات على المستندات', path: '/dashboard/admin-document-stamping' },
];

const TemplatesPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templateTypes.map((t) => {
        const Icon = t.icon;
        return (
          <Card key={t.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(t.path)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default TemplatesPanel;
