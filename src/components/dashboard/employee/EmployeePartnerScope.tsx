/**
 * نطاق الشركاء المسموح للموظف
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Lock, Unlock, Eye } from 'lucide-react';

const assignedPartners = [
  { name: 'شركة النهضة للأسمنت', type: 'مولّد', permissions: ['عرض الشحنات', 'توقيع استلام'], active: true },
  { name: 'مصنع البلاستيك الحديث', type: 'مدوّر', permissions: ['عرض الشحنات', 'إصدار فواتير'], active: true },
  { name: 'المنطقة الحرة - العين السخنة', type: 'مولّد', permissions: ['عرض فقط'], active: true },
  { name: 'شركة النقل السريع', type: 'ناقل', permissions: ['عرض الشحنات'], active: false },
];

const EmployeePartnerScope = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        الجهات المسندة إليّ
        <Badge variant="outline" className="mr-auto text-[9px]">{assignedPartners.filter(p => p.active).length} نشط</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {assignedPartners.map((p, i) => (
        <div key={i} className={`p-2 rounded border ${!p.active ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {p.active ? <Unlock className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
              <p className="text-xs font-medium">{p.name}</p>
            </div>
            <Badge variant="outline" className="text-[9px]">{p.type}</Badge>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {p.permissions.map((perm, j) => (
              <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{perm}</span>
            ))}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default EmployeePartnerScope;
