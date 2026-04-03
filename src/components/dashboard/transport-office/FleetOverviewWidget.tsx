/**
 * ودجة نظرة عامة على الأسطول — خاص بمكتب النقل
 * يعرض ملخص حالة المركبات والسائقين
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, CheckCircle2, AlertTriangle, Wrench, Users, Fuel } from 'lucide-react';
import { useTransportOfficeData } from '@/hooks/useTransportOfficeData';

const FleetOverviewWidget = () => {
  const { data } = useTransportOfficeData();

  const vehicles = data?.vehicles || [];
  const total = vehicles.length;
  const active = vehicles.filter((v: any) => v.status === 'active').length;
  const maintenance = vehicles.filter((v: any) => v.status === 'maintenance').length;
  const inactive = total - active - maintenance;
  const utilizationRate = total > 0 ? Math.round((active / total) * 100) : 0;
  const expiring = data?.expiringVehicles?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          نظرة عامة على الأسطول
          <Badge variant="secondary" className="text-[9px] mr-auto">
            {total} مركبة
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="text-center py-4">
            <Truck className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد مركبات مسجلة</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 text-center">
              <div className="text-2xl font-bold text-primary">{utilizationRate}%</div>
              <p className="text-[10px] text-muted-foreground">معدل استخدام الأسطول</p>
              <Progress value={utilizationRate} className="h-2 mt-2" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-700 dark:text-green-300">{active}</div>
                <p className="text-[9px] text-muted-foreground">نشطة</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Wrench className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{maintenance}</div>
                <p className="text-[9px] text-muted-foreground">صيانة</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30">
                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground mx-auto mb-1" />
                <div className="text-sm font-bold">{inactive}</div>
                <p className="text-[9px] text-muted-foreground">متوقفة</p>
              </div>
            </div>

            {expiring > 0 && (
              <div className="p-2 rounded-lg bg-amber-500/10 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-[10px] text-amber-700 dark:text-amber-300">
                  {expiring} مركبة تنتهي رخصتها قريباً
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FleetOverviewWidget;
