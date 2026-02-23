import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  drivers: any[];
}

const TransportOfficeDriversTab = ({ drivers }: Props) => {
  const navigate = useNavigate();

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">لا يوجد سائقين مسجلين</h3>
          <p className="text-sm text-muted-foreground mb-4">أضف سائقين لإدارة توزيع المهام والرحلات</p>
          <Button onClick={() => navigate('/dashboard/fleet')}>إدارة الأسطول والسائقين</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">السائقين ({drivers.length})</h3>
        <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/fleet')}>
          إدارة الأسطول
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drivers.map(d => {
          const isExpired = d.license_expiry && new Date(d.license_expiry) < new Date();
          return (
            <Card key={d.id} className={`hover:shadow-md transition-shadow ${isExpired ? 'border-destructive/30' : ''}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(d.profile?.full_name || 'س')[0]}
                    </div>
                    <div>
                      <p className="font-medium">{d.profile?.full_name || 'سائق'}</p>
                      <p className="text-xs text-muted-foreground">{d.vehicle_plate || 'بدون مركبة'}</p>
                    </div>
                  </div>
                  {d.is_available ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> متاح
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="w-3 h-3" /> مشغول
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {d.license_number && <p>الرخصة: {d.license_number}</p>}
                  {d.license_expiry && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className={isExpired ? 'text-destructive font-medium' : ''}>
                        انتهاء: {new Date(d.license_expiry).toLocaleDateString('ar-EG')}
                        {isExpired && ' (منتهية!)'}
                      </span>
                    </div>
                  )}
                  {d.vehicle_type && <p>نوع المركبة: {d.vehicle_type}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TransportOfficeDriversTab;
