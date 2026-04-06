import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, AlertTriangle, FileText } from 'lucide-react';

const incidents = [
  { date: '2026-03-25', vehicle: 'V-002', driver: 'أحمد محمد', type: 'حادث مروري بسيط', location: 'طريق القاهرة-السويس', insured: true, severity: 'low' as const },
  { date: '2026-02-18', vehicle: 'V-001', driver: 'محمد علي', type: 'انسكاب أثناء التفريغ', location: 'مصنع التدوير - العاشر', insured: true, severity: 'medium' as const },
  { date: '2026-01-10', vehicle: 'V-003', driver: 'خالد حسن', type: 'عطل ميكانيكي', location: 'طريق الصحراوي', insured: false, severity: 'low' as const },
];

const sevConfig = {
  low: { label: 'بسيط', color: 'bg-green-100 text-green-800' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'خطير', color: 'bg-red-100 text-red-800' },
};

export default function IncidentDamageLog() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-primary" />
          سجل الحوادث والأضرار
        </CardTitle>
        <p className="text-xs text-muted-foreground">{incidents.length} حادث مسجل هذا العام</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {incidents.map((inc, i) => (
          <div key={i} className="p-2.5 rounded-lg border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{inc.type}</span>
              <Badge variant="outline" className={`text-[10px] ${sevConfig[inc.severity].color}`}>{sevConfig[inc.severity].label}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
              <span>🚛 {inc.vehicle} — {inc.driver}</span>
              <span>📅 {inc.date}</span>
              <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{inc.location}</span>
              <span>{inc.insured ? '✅ مؤمّن' : '❌ غير مؤمّن'}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
