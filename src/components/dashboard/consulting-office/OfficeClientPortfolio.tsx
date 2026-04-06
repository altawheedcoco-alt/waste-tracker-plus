/**
 * محفظة عملاء المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Building, Factory, Landmark, MapPin } from 'lucide-react';

const clients = [
  { name: 'شركة النهضة للأسمنت', type: 'generator', projects: 5, revenue: '450K', status: 'vip' },
  { name: 'هيئة المجتمعات العمرانية', type: 'government', projects: 3, revenue: '280K', status: 'active' },
  { name: 'المنطقة الحرة - العين السخنة', type: 'industrial', projects: 2, revenue: '200K', status: 'new' },
  { name: 'شركة النقل المتحدة', type: 'transporter', projects: 4, revenue: '180K', status: 'active' },
  { name: 'مصنع البلاستيك الحديث', type: 'recycler', projects: 1, revenue: '65K', status: 'active' },
];

const typeIcons: Record<string, typeof Building> = {
  generator: Factory, government: Landmark, industrial: MapPin, transporter: Building, recycler: Factory,
};

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  vip: { label: 'VIP', variant: 'default' },
  active: { label: 'نشط', variant: 'secondary' },
  new: { label: 'جديد', variant: 'outline' },
};

const OfficeClientPortfolio = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-primary" />
        محفظة العملاء
        <Badge variant="outline" className="mr-auto text-[9px]">{clients.length} عميل</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {clients.map((c, i) => {
        const Icon = typeIcons[c.type] || Building;
        const badge = statusBadge[c.status];
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.projects} مشاريع • {c.revenue} ج.م</p>
            </div>
            <Badge variant={badge.variant} className="text-[9px] shrink-0">{badge.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default OfficeClientPortfolio;
