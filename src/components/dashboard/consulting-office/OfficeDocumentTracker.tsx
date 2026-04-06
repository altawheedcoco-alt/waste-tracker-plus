/**
 * متتبع المستندات للمكتب الاستشاري
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle2, Clock, Eye } from 'lucide-react';

const docs = [
  { name: 'تقرير EIA - مصنع الأسمنت', status: 'review', version: 'v2.1', updatedAt: '2026-04-03' },
  { name: 'خطة إدارة مخلفات - مجمع سكني', status: 'draft', version: 'v1.0', updatedAt: '2026-04-05' },
  { name: 'تقرير تدقيق - محطة كهرباء', status: 'approved', version: 'v3.0', updatedAt: '2026-04-01' },
  { name: 'دراسة مخاطر - المنطقة الحرة', status: 'draft', version: 'v0.5', updatedAt: '2026-04-06' },
  { name: 'عرض سعر - محطة معالجة', status: 'sent', version: 'v1.0', updatedAt: '2026-04-04' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  review: { label: 'مراجعة', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  approved: { label: 'معتمد', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  sent: { label: 'مُرسل', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
};

const OfficeDocumentTracker = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        المستندات والتقارير
        <Badge variant="outline" className="mr-auto text-[9px]">{docs.length} مستند</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {docs.map((d, i) => {
        const cfg = statusConfig[d.status];
        return (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate">{d.name}</p>
              <p className="text-[10px] text-muted-foreground">{d.version} • {new Date(d.updatedAt).toLocaleDateString('ar-EG')}</p>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${cfg.color}`}>{cfg.label}</span>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default OfficeDocumentTracker;
