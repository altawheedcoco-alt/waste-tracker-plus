import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Box, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

const containers = [
  { id: 'C-101', type: 'حاوية مغلقة 20م³', location: 'مصنع الحديد - حلوان', vehicle: 'V-001', lastClean: '2026-04-03', condition: 'good' as const },
  { id: 'C-102', type: 'حاوية مفتوحة 15م³', location: 'مستشفى القاهرة', vehicle: '-', lastClean: '2026-03-28', condition: 'needs_clean' as const },
  { id: 'C-103', type: 'حاوية خطرة 10م³', location: 'المخزن الرئيسي', vehicle: '-', lastClean: '2026-04-05', condition: 'good' as const },
  { id: 'C-104', type: 'حاوية مغلقة 20م³', location: 'محمّلة على V-003', vehicle: 'V-003', lastClean: '2026-04-01', condition: 'in_transit' as const },
];

const condConfig: Record<string, { label: string; color: string }> = {
  good: { label: 'جيدة', color: 'bg-green-100 text-green-800' },
  needs_clean: { label: 'تحتاج تنظيف', color: 'bg-yellow-100 text-yellow-800' },
  in_transit: { label: 'في النقل', color: 'bg-blue-100 text-blue-800' },
};

export default function ContainerTracker() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Box className="w-5 h-5 text-primary" />
          نظام إدارة الحاويات
        </CardTitle>
        <p className="text-xs text-muted-foreground">{containers.length} حاوية مسجلة</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {containers.map(c => (
          <div key={c.id} className="p-2.5 rounded-lg border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{c.id} — {c.type}</span>
              <Badge variant="outline" className={`text-[10px] ${condConfig[c.condition]?.color || ''}`}>
                {condConfig[c.condition]?.label || c.condition}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="w-3 h-3" /> {c.location}
            </div>
            <p className="text-[10px] text-muted-foreground">آخر تنظيف: {c.lastClean}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
