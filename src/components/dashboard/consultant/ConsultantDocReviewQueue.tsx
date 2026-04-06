import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const reviews = [
  { doc: 'مانيفست شحنة #5021', client: 'شركة النور', status: 'pending', urgency: 'high', submitted: '2026-04-05' },
  { doc: 'تقرير EIA — مصنع الدلتا', client: 'مصنع الدلتا', status: 'approved', urgency: 'medium', submitted: '2026-04-02' },
  { doc: 'خطة إدارة مخلفات خطرة', client: 'فندق النيل', status: 'revision', urgency: 'high', submitted: '2026-04-04' },
  { doc: 'طلب ترخيص نقل', client: 'شركة الوادي', status: 'pending', urgency: 'medium', submitted: '2026-04-06' },
];

const statusCfg = {
  pending: { label: 'بانتظار المراجعة', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  approved: { label: 'معتمد', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  revision: { label: 'يحتاج تعديل', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
};

const ConsultantDocReviewQueue = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <FileCheck className="h-5 w-5 text-primary" />
        قائمة مراجعة المستندات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {reviews.map((r, i) => {
        const cfg = statusCfg[r.status as keyof typeof statusCfg];
        return (
          <div key={i} className="flex items-center justify-between p-2 rounded border">
            <div>
              <p className="text-sm font-medium">{r.doc}</p>
              <p className="text-xs text-muted-foreground">{r.client} • {r.submitted}</p>
            </div>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default ConsultantDocReviewQueue;
