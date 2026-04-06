/**
 * قوالب المهام — تعيين سريع
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LayoutTemplate, FileText, Truck, Receipt, ClipboardCheck, Shield } from 'lucide-react';

const templates = [
  { name: 'مراجعة وتوقيع شحنات', icon: Truck, taskCount: 4, description: 'عرض، مراجعة، توقيع، وتأكيد استلام الشحنات' },
  { name: 'إدارة الفواتير', icon: Receipt, taskCount: 3, description: 'إصدار، مراجعة، ومتابعة الفواتير' },
  { name: 'إعداد التقارير', icon: FileText, taskCount: 2, description: 'جمع البيانات وإعداد التقارير الدورية' },
  { name: 'التفتيش والامتثال', icon: Shield, taskCount: 5, description: 'فحص المستندات والتأكد من الامتثال' },
  { name: 'المراجعة الداخلية', icon: ClipboardCheck, taskCount: 3, description: 'تدقيق العمليات والبيانات' },
];

const EmployeeTaskTemplates = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <LayoutTemplate className="h-4 w-4 text-primary" />
        قوالب المهام
        <Badge variant="outline" className="mr-auto text-[9px]">{templates.length} قالب</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {templates.map((t, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/50 cursor-pointer transition-colors">
          <t.icon className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium">{t.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>
          </div>
          <Badge variant="secondary" className="text-[9px] shrink-0">{t.taskCount} مهام</Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default EmployeeTaskTemplates;
