import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Calendar, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';

interface Props {
  records: any[];
  vehicles: any[];
}

const maintenanceTypeLabels: Record<string, string> = {
  routine: 'صيانة دورية',
  repair: 'إصلاح',
  tire: 'إطارات',
  oil: 'تغيير زيت',
  brake: 'فرامل',
  inspection: 'فحص فني',
  other: 'أخرى',
};

const TransportOfficeMaintenanceTab = ({ records, vehicles }: Props) => {
  const today = new Date().toISOString().split('T')[0];
  const overdue = records.filter(m => m.next_maintenance_date && m.next_maintenance_date < today);
  const upcoming = records.filter(m => m.next_maintenance_date && m.next_maintenance_date >= today);
  const totalCost = records.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Wrench className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{vehiclesInMaintenance.length}</p>
            <p className="text-xs text-muted-foreground">في الصيانة</p>
          </CardContent>
        </Card>
        <Card className={overdue.length > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className={`w-6 h-6 mx-auto mb-1 ${overdue.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-xl font-bold">{overdue.length}</p>
            <p className="text-xs text-muted-foreground">صيانة متأخرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{upcoming.length}</p>
            <p className="text-xs text-muted-foreground">صيانة قادمة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{totalCost.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">تكاليف (ج.م)</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              صيانة متأخرة ({overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 bg-background rounded text-sm">
                <div>
                  <span className="font-medium">{m.vehicle_plate}</span>
                  <span className="text-muted-foreground mx-2">—</span>
                  <span>{maintenanceTypeLabels[m.maintenance_type] || m.maintenance_type}</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {new Date(m.next_maintenance_date).toLocaleDateString('ar-EG')}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent records */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            سجل الصيانة
          </CardTitle>
          <CardDescription>آخر عمليات الصيانة والإصلاح</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">لا توجد سجلات صيانة بعد</p>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 10).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.vehicle_plate}</span>
                      <Badge variant="outline" className="text-xs">
                        {maintenanceTypeLabels[m.maintenance_type] || m.maintenance_type}
                      </Badge>
                    </div>
                    {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                  </div>
                  <div className="text-left space-y-0.5">
                    {m.cost && <p className="text-sm font-medium">{Number(m.cost).toLocaleString()} ج.م</p>}
                    {m.performed_at && <p className="text-xs text-muted-foreground">{new Date(m.performed_at).toLocaleDateString('ar-EG')}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransportOfficeMaintenanceTab;
