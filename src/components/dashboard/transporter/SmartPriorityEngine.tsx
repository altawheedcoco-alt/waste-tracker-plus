import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SortAsc, Clock, AlertTriangle, Flame, DollarSign } from 'lucide-react';

const shipments = [
  { id: 'SH-3001', client: 'مصنع الحديد', wasteType: 'خطرة', deadline: '2026-04-06 14:00', distance: 45, contractValue: 15000, priority: 1 },
  { id: 'SH-3002', client: 'مستشفى القاهرة', wasteType: 'طبية', deadline: '2026-04-06 16:00', distance: 20, contractValue: 8000, priority: 2 },
  { id: 'SH-3003', client: 'فندق النيل', wasteType: 'صلبة عادية', deadline: '2026-04-07 10:00', distance: 15, contractValue: 3000, priority: 3 },
  { id: 'SH-3004', client: 'مصنع البلاستيك', wasteType: 'صلبة عادية', deadline: '2026-04-07 12:00', distance: 60, contractValue: 5000, priority: 4 },
];

const getPriorityBadge = (p: number) => {
  if (p === 1) return { label: 'عاجل جداً', color: 'bg-red-100 text-red-800' };
  if (p === 2) return { label: 'عاجل', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'عادي', color: 'bg-green-100 text-green-800' };
};

export default function SmartPriorityEngine() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SortAsc className="w-5 h-5 text-primary" />
          نظام الأولويات الذكي
        </CardTitle>
        <p className="text-xs text-muted-foreground">ترتيب تلقائي حسب الخطورة والموعد والقيمة</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {shipments.map((s, i) => {
          const badge = getPriorityBadge(s.priority);
          return (
            <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${s.priority === 1 ? 'border-red-200 bg-red-50/50' : ''}`}>
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{s.id}</span>
                  <Badge variant="outline" className={`text-[9px] ${badge.color}`}>{badge.label}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{s.client} — {s.wasteType}</p>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{s.deadline.split(' ')[1]}</span>
                  <span>{s.distance} كم</span>
                  <span>{s.contractValue.toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
