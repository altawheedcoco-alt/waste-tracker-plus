import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Circle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DriverSummary } from '@/hooks/useTransporterExtended';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TransporterDriverTrackingProps {
  drivers: DriverSummary[];
  isLoading: boolean;
}

const TransporterDriverTracking = ({ drivers, isLoading }: TransporterDriverTrackingProps) => {
  const navigate = useNavigate();

  const availableDrivers = drivers.filter(d => d.isAvailable);
  const busyDrivers = drivers.filter(d => !d.isAvailable);
  const withLocation = drivers.filter(d => d.lastLat && d.lastLng);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            تتبع السائقين
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{availableDrivers.length}</p>
            <p className="text-xs text-muted-foreground">متاح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{busyDrivers.length}</p>
            <p className="text-xs text-muted-foreground">في مهمة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{withLocation.length}</p>
            <p className="text-xs text-muted-foreground">موقع مُحدّث</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="eco" size="sm" onClick={() => navigate('/dashboard/driver-tracking')}>
              <ExternalLink className="ml-2 h-4 w-4" />
              فتح التتبع الكامل
            </Button>
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <MapPin className="w-5 h-5 text-primary" />
                السائقين ({drivers.length})
              </CardTitle>
              <CardDescription>حالة ومواقع السائقين</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لا يوجد سائقين مسجلين</p>
              <Button variant="eco" className="mt-3" size="sm" onClick={() => navigate('/dashboard/transporter-drivers')}>
                إضافة سائق
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {driver.activeShipments > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {driver.activeShipments} شحنة
                      </Badge>
                    )}
                    {driver.lastLat && (
                      <Badge variant="outline" className="text-xs text-primary">
                        <MapPin className="h-3 w-3 ml-1" />
                        موقع متاح
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium text-sm">{driver.name}</p>
                      <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
                        {driver.vehiclePlate && <span>{driver.vehiclePlate}</span>}
                        {driver.lastUpdated && (
                          <span>• {formatDistanceToNow(new Date(driver.lastUpdated), { addSuffix: true, locale: ar })}</span>
                        )}
                      </div>
                    </div>
                    <Circle
                      className={`w-3 h-3 fill-current ${driver.isAvailable ? 'text-emerald-500' : 'text-amber-500'}`}
                    />
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

export default TransporterDriverTracking;
