/**
 * لوحة الطباعة والتصدير — روابط لمركز الطباعة والتقارير
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText, ArrowRight, BarChart3, Receipt, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const items = [
  { icon: Printer, title: 'مركز الطباعة', desc: 'طباعة الشحنات والفواتير والشهادات', path: '/dashboard/print-center' },
  { icon: BarChart3, title: 'التقارير', desc: 'تصدير تقارير PDF/Excel', path: '/dashboard/reports' },
  { icon: Receipt, title: 'الفاتورة الإلكترونية', desc: 'إصدار وطباعة الفواتير', path: '/dashboard/e-invoice' },
  { icon: FileSpreadsheet, title: 'التقرير التجميعي', desc: 'تقرير شامل لجميع الشحنات', path: '/dashboard/aggregate-report' },
  { icon: FileText, title: 'سجل النفايات', desc: 'سجل النفايات الخطرة وغير الخطرة', path: '/dashboard/non-hazardous-register' },
  { icon: Download, title: 'تصدير البيانات', desc: 'تحميل البيانات بصيغة Excel', path: '/dashboard/reports' },
];

const PrintCenterPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.path + item.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(item.path)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PrintCenterPanel;
