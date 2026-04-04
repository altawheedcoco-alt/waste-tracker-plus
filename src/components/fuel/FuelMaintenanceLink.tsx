import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { VehicleEfficiency } from '@/hooks/useFuelCalculations';

interface Props {
  vehicles: VehicleEfficiency[];
}

const FuelMaintenanceLink = ({ vehicles }: Props) => {
  const navigate = useNavigate();
  const needsMaintenance = vehicles.filter(v => v.deviationPercent > 30);

  if (needsMaintenance.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          تنبيهات صيانة مرتبطة بالوقود
          <Badge variant="secondary" className="text-[10px]">{needsMaintenance.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {needsMaintenance.slice(0, 5).map(v => (
          <div key={v.vehicleId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs">مركبة {v.vehiclePlate || v.vehicleId.slice(0, 8)}</span>
              <Badge variant="destructive" className="text-[9px]">+{v.deviationPercent}% استهلاك</Badge>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate('/dashboard/preventive-maintenance')}>
          <Wrench className="h-3.5 w-3.5 me-1" />
          فتح الصيانة الوقائية
          <ArrowLeft className="h-3.5 w-3.5 ms-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default FuelMaintenanceLink;
