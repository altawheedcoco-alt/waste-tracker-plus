import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, CheckCircle2, Clock, DollarSign, Users, Wrench, AlertTriangle, Package } from 'lucide-react';
import type { TransportOfficeStats } from '@/hooks/useTransportOfficeData';

interface Props {
  stats: TransportOfficeStats;
}

const TransportOfficeKPIs = ({ stats }: Props) => {
  const cards = [
    { icon: Truck, label: 'إجمالي المركبات', value: stats.totalVehicles, sub: `${stats.availableVehicles} متاحة` },
    { icon: Users, label: 'السائقين', value: stats.totalDrivers, sub: `${stats.availableDrivers} متاح` },
    { icon: Clock, label: 'طلبات معلقة', value: stats.pendingBookings, alert: stats.pendingBookings > 0 },
    { icon: Package, label: 'حجوزات نشطة', value: stats.activeBookings, sub: '' },
    { icon: CheckCircle2, label: 'مكتملة', value: stats.completedBookings, sub: '' },
    { icon: DollarSign, label: 'الإيرادات', value: `${stats.totalRevenue.toLocaleString()}`, sub: 'ج.م' },
    { icon: Wrench, label: 'صيانة', value: stats.maintenanceVehicles, alert: stats.overdueMaintenance > 0, sub: stats.overdueMaintenance > 0 ? `${stats.overdueMaintenance} متأخرة` : '' },
    { icon: AlertTriangle, label: 'تنتهي قريباً', value: stats.expiringLicenses + stats.expiringInsurance, alert: (stats.expiringLicenses + stats.expiringInsurance) > 0, sub: 'رخصة/تأمين' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <Card key={i} className={`hover:shadow-md transition-shadow ${c.alert ? 'border-destructive/30' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.alert ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <c.icon className={`w-4 h-4 ${c.alert ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-lg font-bold">{c.value}</p>
            {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TransportOfficeKPIs;
