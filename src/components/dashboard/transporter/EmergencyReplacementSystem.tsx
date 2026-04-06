import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserX, UserCheck, ArrowLeftRight, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface AbsentDriver {
  id: string;
  name: string;
  reason: string;
  since: string;
  assignedTrips: number;
  vehiclePlate: string;
}

interface AvailableDriver {
  id: string;
  name: string;
  phone: string;
  currentLoad: number;
  maxLoad: number;
  nearestLocation: string;
  rating: number;
}

const ABSENT_DRIVERS: AbsentDriver[] = [
  { id: '1', name: 'محمد أحمد', reason: 'إجازة مرضية', since: '2026-04-05', assignedTrips: 5, vehiclePlate: 'أ ب ج 1234' },
  { id: '2', name: 'حسن علي', reason: 'غياب بدون إذن', since: '2026-04-06', assignedTrips: 3, vehiclePlate: 'ز ح ط 9012' },
];

const AVAILABLE_DRIVERS: AvailableDriver[] = [
  { id: 'a1', name: 'عبدالله حسن', phone: '01012345678', currentLoad: 6, maxLoad: 10, nearestLocation: 'القاهرة', rating: 4.8 },
  { id: 'a2', name: 'أحمد سعيد', phone: '01098765432', currentLoad: 4, maxLoad: 8, nearestLocation: 'الجيزة', rating: 4.5 },
  { id: 'a3', name: 'يوسف محمد', phone: '01155667788', currentLoad: 2, maxLoad: 8, nearestLocation: 'القاهرة', rating: 4.2 },
];

export default function EmergencyReplacementSystem() {
  const [replacements, setReplacements] = useState<Record<string, string>>({});

  const handleReplace = (absentId: string) => {
    const selectedId = replacements[absentId];
    if (!selectedId) {
      toast.error('اختر سائق بديل أولاً');
      return;
    }
    const absentDriver = ABSENT_DRIVERS.find(d => d.id === absentId);
    const replacement = AVAILABLE_DRIVERS.find(d => d.id === selectedId);
    toast.success(`تم تعيين ${replacement?.name} بديلاً عن ${absentDriver?.name}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-orange-500" />
          نظام الإحلال الطارئ للسائقين
          {ABSENT_DRIVERS.length > 0 && (
            <Badge variant="destructive" className="mr-auto">{ABSENT_DRIVERS.length} غائب</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[380px]">
          <div className="space-y-4">
            {ABSENT_DRIVERS.map(driver => (
              <Card key={driver.id} className="border border-destructive/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="destructive" className="text-xs">{driver.reason}</Badge>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-sm font-semibold">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {driver.vehiclePlate} • {driver.assignedTrips} رحلات معلّقة
                        </p>
                      </div>
                      <UserX className="w-5 h-5 text-destructive" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-right">اختر سائق بديل:</p>
                    <Select value={replacements[driver.id] || ''} onValueChange={v => setReplacements(prev => ({ ...prev, [driver.id]: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر سائق متاح..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_DRIVERS.map(av => (
                          <SelectItem key={av.id} value={av.id}>
                            <span className="flex items-center gap-2">
                              {av.name} • {av.nearestLocation} • حمولة {av.currentLoad}/{av.maxLoad} • ★{av.rating}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="w-full" onClick={() => handleReplace(driver.id)}>
                      <UserCheck className="w-4 h-4 ml-1" />
                      تعيين البديل ونقل الرحلات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Available drivers summary */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-right mb-2">السائقين المتاحين</h4>
              {AVAILABLE_DRIVERS.map(av => (
                <div key={av.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{av.currentLoad}/{av.maxLoad}</Badge>
                    <span className="text-yellow-500 text-xs">★{av.rating}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{av.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">{av.nearestLocation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
