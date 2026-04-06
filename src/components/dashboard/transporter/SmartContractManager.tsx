import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, CheckCircle2, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const contracts = [
  { client: 'مصنع الحديد والصلب', type: 'سنوي', minShipments: 50, usedShipments: 38, penalty: '500 ج.م/يوم تأخير', expiresIn: 45, status: 'active' as const },
  { client: 'مستشفى القاهرة الدولي', type: 'ربع سنوي', minShipments: 15, usedShipments: 14, penalty: 'لا يوجد', expiresIn: 12, status: 'expiring' as const },
  { client: 'فندق النيل', type: 'شهري', minShipments: 8, usedShipments: 8, penalty: '200 ج.م/يوم', expiresIn: 5, status: 'expiring' as const },
];

const statusConfig = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
  expiring: { label: 'ينتهي قريباً', color: 'bg-yellow-100 text-yellow-800' },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
};

export default function SmartContractManager() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-primary" />
            نظام العقود الذكية
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1 h-7"><Plus className="w-3 h-3" /> عقد جديد</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {contracts.map((c, i) => {
          const config = statusConfig[c.status];
          const shipmentUsage = Math.round((c.usedShipments / c.minShipments) * 100);
          return (
            <div key={i} className="p-2.5 rounded-lg border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{c.client}</span>
                <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                <span>النوع: {c.type}</span>
                <span>الشحنات: {c.usedShipments}/{c.minShipments} ({shipmentUsage}%)</span>
                <span>الغرامة: {c.penalty}</span>
                <span className={c.expiresIn <= 15 ? 'text-red-600 font-bold' : ''}>متبقي: {c.expiresIn} يوم</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
