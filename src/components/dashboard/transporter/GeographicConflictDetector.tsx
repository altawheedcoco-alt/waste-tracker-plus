import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

const conflicts = [
  { shipmentId: 'SH-2041', destination: 'أسوان', licensedArea: 'القاهرة الكبرى', status: 'conflict' as const },
  { shipmentId: 'SH-2038', destination: 'الجيزة', licensedArea: 'القاهرة الكبرى', status: 'ok' as const },
  { shipmentId: 'SH-2035', destination: 'الإسكندرية', licensedArea: 'القاهرة الكبرى', status: 'conflict' as const },
  { shipmentId: 'SH-2033', destination: 'القاهرة', licensedArea: 'القاهرة الكبرى', status: 'ok' as const },
];

export default function GeographicConflictDetector() {
  const conflictCount = conflicts.filter(c => c.status === 'conflict').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-5 h-5 text-primary" />
          كاشف التضارب الجغرافي
        </CardTitle>
        {conflictCount > 0 && (
          <Badge variant="destructive" className="text-xs">{conflictCount} تضارب</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {conflicts.map((c, i) => (
            <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${c.status === 'conflict' ? 'border-red-200 bg-red-50/50' : ''}`}>
              <div className="flex items-center gap-2">
                {c.status === 'conflict' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                <div>
                  <p className="text-sm font-medium">{c.shipmentId}</p>
                  <p className="text-[10px] text-muted-foreground">الوجهة: {c.destination}</p>
                </div>
              </div>
              {c.status === 'conflict' ? (
                <Badge variant="destructive" className="text-[10px]">خارج النطاق</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800">متوافق</Badge>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 p-2 rounded bg-muted/50 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">النطاق المرخص: القاهرة الكبرى (القاهرة، الجيزة، القليوبية)</span>
        </div>
      </CardContent>
    </Card>
  );
}
