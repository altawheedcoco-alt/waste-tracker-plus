/**
 * نظام شكاوى المواطنين
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquareWarning, MapPin, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const complaints = [
  { id: 'CMP-1284', subject: 'رائحة كريهة من مصنع تدوير', location: 'المعادي، القاهرة', status: 'investigating', date: '2026-04-05', priority: 'high' },
  { id: 'CMP-1281', subject: 'تراكم نفايات طبية في شارع رئيسي', location: 'وسط البلد', status: 'assigned', date: '2026-04-04', priority: 'urgent' },
  { id: 'CMP-1278', subject: 'تسرب سوائل من شاحنة نقل', location: 'طريق الإسكندرية الصحراوي', status: 'resolved', date: '2026-04-01', priority: 'medium' },
  { id: 'CMP-1275', subject: 'حرق نفايات في العراء', location: 'الفيوم', status: 'investigating', date: '2026-03-30', priority: 'high' },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  investigating: { label: 'قيد التحقيق', color: 'text-amber-600' },
  assigned: { label: 'تم التوجيه', color: 'text-blue-600' },
  resolved: { label: 'تم الحل', color: 'text-green-600' },
};

const RegulatorCitizenComplaints = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <MessageSquareWarning className="h-4 w-4 text-primary" />
        شكاوى المواطنين
        <Badge variant="destructive" className="mr-auto text-[9px]">
          {complaints.filter(c => c.priority === 'urgent').length} عاجل
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {complaints.map((c, i) => {
        const s = statusLabels[c.status];
        return (
          <div key={i} className={`p-2 rounded border ${c.priority === 'urgent' ? 'border-red-300 dark:border-red-800' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-muted-foreground">{c.id}</span>
              <span className={`text-[9px] font-medium ${s.color}`}>{s.label}</span>
            </div>
            <p className="text-xs">{c.subject}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{c.location}</span>
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{new Date(c.date).toLocaleDateString('ar-EG')}</span>
            </div>
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default RegulatorCitizenComplaints;
