import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Thermometer, Wind, Droplet, AlertTriangle, CheckCircle, MapPin, Flame, Mountain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnvironmentalTabProps {
  facilityId?: string | null;
  facility?: any;
}

const EnvironmentalTab = ({ facilityId, facility }: EnvironmentalTabProps) => {
  // Fetch recent operations for emissions data
  const { data: recentOps = [] } = useQuery({
    queryKey: ['mc-env-ops', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const { data } = await supabase
        .from('disposal_operations')
        .select('id, disposal_method, incineration_temperature, landfill_cell_id, quantity, unit, status, disposal_date, emissions_reading')
        .eq('disposal_facility_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!facilityId,
  });

  const incinerationOps = recentOps.filter((o: any) => o.disposal_method === 'incineration');
  const landfillOps = recentOps.filter((o: any) => o.disposal_method === 'landfill');

  const totalCapacity = facility?.total_capacity_tons || 10000;
  const fillPercentage = facility?.current_fill_percentage || 0;
  const remainingCapacity = totalCapacity * (1 - fillPercentage / 100);

  // Simulated landfill cells
  const cells = [
    { id: 'Cell-A1', status: 'closed', capacity: 500, filled: 500 },
    { id: 'Cell-A2', status: 'closed', capacity: 500, filled: 500 },
    { id: 'Cell-B1', status: 'active', capacity: 800, filled: 320 },
    { id: 'Cell-B2', status: 'active', capacity: 800, filled: 150 },
    { id: 'Cell-C1', status: 'empty', capacity: 1000, filled: 0 },
    { id: 'Cell-C2', status: 'empty', capacity: 1000, filled: 0 },
  ];

  // Simulated real-time environmental alerts
  const alerts = [
    { id: 1, type: 'info', message: 'درجة حرارة المحرقة ضمن النطاق الآمن: 1050°C', time: '08:45' },
    { id: 2, type: 'info', message: 'انبعاثات CO₂ ضمن الحدود المسموحة: 380 ppm', time: '09:12' },
    { id: 3, type: 'warning', message: 'خلية الدفن B1 وصلت 40% من السعة', time: '10:30' },
  ];

  return (
    <div className="space-y-6">
      {/* Environmental Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'درجة حرارة المحرقة', value: '1050°C', icon: Thermometer, status: 'safe', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
          { label: 'انبعاثات CO₂', value: '380 ppm', icon: Wind, status: 'safe', color: 'text-slate-600 bg-slate-100 dark:bg-slate-900/30' },
          { label: 'مستوى الترشيح', value: 'طبيعي', icon: Droplet, status: 'safe', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'السعة المتبقية', value: `${remainingCapacity.toFixed(0)} طن`, icon: Mountain, status: fillPercentage > 80 ? 'warning' : 'safe', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((stat) => (
          <Card key={stat.label} className="p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <div className="flex items-center gap-1 justify-end">
                  {stat.status === 'safe' ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                  <p className="font-bold">{stat.value}</p>
                </div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Landfill Cells Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            خريطة خلايا الدفن
          </CardTitle>
          <CardDescription>حالة وسعة كل خلية في المنشأة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cells.map((cell) => {
              const pct = (cell.filled / cell.capacity) * 100;
              return (
                <div key={cell.id} className={`p-3 rounded-lg border ${
                  cell.status === 'closed' ? 'bg-muted/50 opacity-70' :
                  cell.status === 'active' ? 'bg-card' : 'bg-green-50/30 dark:bg-green-950/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={cell.status === 'closed' ? 'secondary' : cell.status === 'active' ? 'default' : 'outline'} className="text-xs">
                      {cell.status === 'closed' ? '🔒 مغلقة' : cell.status === 'active' ? '🟢 نشطة' : '⚪ فارغة'}
                    </Badge>
                    <span className="font-mono font-semibold text-sm">{cell.id}</span>
                  </div>
                  <Progress value={pct} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground text-right">{cell.filled} / {cell.capacity} طن ({pct.toFixed(0)}%)</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Environmental Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            التنبيهات البيئية الحية
          </CardTitle>
          <CardDescription>مراقبة آلية لمعايير الامتثال البيئي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
              alert.type === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10' : 'border-green-200 bg-green-50/50 dark:bg-green-950/10'
            }`}>
              {alert.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              )}
              <p className="text-sm flex-1 text-right">{alert.message}</p>
              <span className="text-xs text-muted-foreground shrink-0">{alert.time}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Incinerator Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-600" />
            إحصائيات المحرقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-red-600">{incinerationOps.length}</p>
              <p className="text-xs text-muted-foreground">عمليات حرق</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{incinerationOps.reduce((acc: number, o: any) => acc + (o.quantity || 0), 0).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">طن تم حرقه</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-amber-600">{landfillOps.reduce((acc: number, o: any) => acc + (o.quantity || 0), 0).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">طن تم دفنه</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentalTab;
