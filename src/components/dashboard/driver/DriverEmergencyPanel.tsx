/**
 * نظام طوارئ وبلاغات السائق
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertOctagon, Phone, MapPin, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const emergencyContacts = [
  { name: 'مركز الطوارئ البيئية', phone: '19808', available: '24/7' },
  { name: 'الدفاع المدني', phone: '180', available: '24/7' },
  { name: 'مدير العمليات', phone: '01012345678', available: '8ص - 10م' },
  { name: 'فريق الصيانة', phone: '01198765432', available: '8ص - 6م' },
];

const DriverEmergencyPanel = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <AlertOctagon className="h-4 w-4 text-red-500" />
        الطوارئ والبلاغات
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button variant="destructive" className="w-full gap-2">
        <AlertOctagon className="h-4 w-4" />
        إبلاغ عن حادث طارئ
      </Button>

      <div className="space-y-2">
        <p className="text-[10px] font-medium text-muted-foreground">أرقام الطوارئ</p>
        {emergencyContacts.map((c, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded border">
            <Phone className="h-3 w-3 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.available}</p>
            </div>
            <span className="text-xs font-mono text-primary" dir="ltr">{c.phone}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DriverEmergencyPanel;
