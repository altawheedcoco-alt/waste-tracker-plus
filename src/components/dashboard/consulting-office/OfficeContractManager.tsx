/**
 * إدارة عقود المكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSignature, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const contracts = [
  { client: 'شركة النهضة للأسمنت', value: '120,000 ج.م', status: 'active', remaining: '6 أشهر' },
  { client: 'هيئة المجتمعات العمرانية', value: '85,000 ج.م', status: 'active', remaining: '3 أشهر' },
  { client: 'المنطقة الحرة - العين السخنة', value: '200,000 ج.م', status: 'negotiation', remaining: 'قيد التفاوض' },
  { client: 'وزارة الكهرباء', value: '55,000 ج.م', status: 'completed', remaining: 'مكتمل' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'ساري', variant: 'default' },
  negotiation: { label: 'تفاوض', variant: 'secondary' },
  completed: { label: 'مكتمل', variant: 'outline' },
};

const OfficeContractManager = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-primary" />
        العقود النشطة
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {contracts.map((c, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded border">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{c.client}</p>
            <p className="text-[10px] text-muted-foreground">{c.value} • {c.remaining}</p>
          </div>
          <Badge variant={statusMap[c.status].variant} className="text-[9px] shrink-0">
            {statusMap[c.status].label}
          </Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default OfficeContractManager;
