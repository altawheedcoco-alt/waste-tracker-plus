/**
 * كتالوج خدمات المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Leaf, Factory, FileSearch, Microscope, Shield, Truck } from 'lucide-react';

const services = [
  { name: 'دراسات الأثر البيئي (EIA)', icon: Leaf, activeProjects: 3, totalCompleted: 28 },
  { name: 'خطط إدارة المخلفات', icon: Factory, activeProjects: 2, totalCompleted: 15 },
  { name: 'التدقيق البيئي', icon: FileSearch, activeProjects: 1, totalCompleted: 22 },
  { name: 'تحليل المخاطر البيئية', icon: Shield, activeProjects: 1, totalCompleted: 8 },
  { name: 'فحوصات معملية', icon: Microscope, activeProjects: 0, totalCompleted: 45 },
  { name: 'استشارات نقل المخلفات الخطرة', icon: Truck, activeProjects: 1, totalCompleted: 12 },
];

const OfficeServiceCatalog = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        الخدمات المقدمة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {services.map((s, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded border">
          <s.icon className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{s.name}</p>
            <p className="text-[10px] text-muted-foreground">{s.totalCompleted} مكتمل</p>
          </div>
          {s.activeProjects > 0 && (
            <Badge variant="secondary" className="text-[9px]">{s.activeProjects} نشط</Badge>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeServiceCatalog;
