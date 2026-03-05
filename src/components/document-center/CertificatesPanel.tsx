/**
 * لوحة الشهادات — شهادات التدوير والتخلص والتدريب
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ArrowRight, Recycle, Factory, GraduationCap, Trophy, Shield, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const certTypes = [
  { icon: Recycle, title: 'شهادات التدوير', desc: 'الشهادات الصادرة للمولدين', path: '/dashboard/recycling-certificates' },
  { icon: Factory, title: 'شهادات التخلص', desc: 'شهادات التخلص الآمن', path: '/dashboard/disposal/certificates' },
  { icon: Award, title: 'إصدار شهادات تدوير', desc: 'إصدار شهادات جديدة', path: '/dashboard/issue-recycling-certificates' },
  { icon: GraduationCap, title: 'شهادات التدريب', desc: 'شهادات الأكاديمية', path: '/dashboard/driver-academy' },
  { icon: Trophy, title: 'شهادات التميز', desc: 'شهادات الفخر والتميز', path: '/dashboard/pride-certificates' },
  { icon: FileCheck, title: 'إقرارات التسليم', desc: 'إقرارات استلام وتسليم', path: '/dashboard/delivery-declarations' },
];

const CertificatesPanel = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {certTypes.map((ct) => {
        const Icon = ct.icon;
        return (
          <Card key={ct.path} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(ct.path)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{ct.title}</p>
                <p className="text-xs text-muted-foreground">{ct.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CertificatesPanel;
