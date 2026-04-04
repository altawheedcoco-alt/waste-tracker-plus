import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Fuel, Calendar, Gauge, Trash2, MapPin } from 'lucide-react';
import { useFuelCalculations } from '@/hooks/useFuelCalculations';
import FuelDashboardCards from '@/components/fuel/FuelDashboardCards';
import FuelFraudDetector from '@/components/fuel/FuelFraudDetector';
import FuelConsumptionChart from '@/components/fuel/FuelConsumptionChart';
import FuelBudgetForecaster from '@/components/fuel/FuelBudgetForecaster';
import FuelRecordForm from '@/components/fuel/FuelRecordForm';
import FuelTankManager from '@/components/fuel/FuelTankManager';
import FuelMaintenanceLink from '@/components/fuel/FuelMaintenanceLink';
import FuelShipmentLinker from '@/components/fuel/FuelShipmentLinker';

const FuelManagement = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['fuel-records', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('fuel_records' as any)
        .select('*')
        .eq('organization_id', organization!.id)
        .order('fuel_date', { ascending: false })
        .limit(500) as any);
      if (error) throw error;
      const driverIds = [...new Set((data || []).map((r: any) => r.driver_id).filter(Boolean))] as string[];
      let driverMap: Record<string, string> = {};
      if (driverIds.length) {
        const { data: drvs } = await supabase.from('profiles').select('id, full_name').in('id', driverIds);
        driverMap = Object.fromEntries((drvs || []).map(d => [d.id, d.full_name]));
      }
      return (data || []).map((r: any) => ({
        ...r,
        total_cost: r.total_cost || (r.liters * r.cost_per_liter),
        _driverName: r.driver_id ? driverMap[r.driver_id] || '—' : null,
      }));
    },
    enabled: !!organization?.id,
  });

  const { summary, fraudAlerts, budgetForecast, vehicleEfficiencies } = useFuelCalculations(records);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('fuel_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-records'] });
      toast.success('تم الحذف');
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              إدارة الوقود الذكية
            </h1>
            <p className="text-xs text-muted-foreground">رقابة، تحليل، وتنبؤ بالاستهلاك</p>
          </div>
          <FuelRecordForm />
        </div>

        {/* Dashboard Cards */}
        <FuelDashboardCards
          totalLiters={summary.totalLiters}
          totalCost={summary.totalCost}
          avgCostPerLiter={summary.avgCostPerLiter}
          recordCount={summary.recordCount}
          alertCount={summary.alertCount}
          redAlerts={summary.redAlerts}
        />

        {/* Maintenance Alerts */}
        <FuelMaintenanceLink vehicles={vehicleEfficiencies} />

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="fraud">كشف التلاعب {fraudAlerts.length > 0 && <Badge variant="destructive" className="ms-1 text-[9px] h-4 w-4 p-0 flex items-center justify-center rounded-full">{fraudAlerts.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="shipments">ربط الشحنات</TabsTrigger>
            <TabsTrigger value="tanks">التانكات</TabsTrigger>
            <TabsTrigger value="records">السجلات</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FuelConsumptionChart forecast={budgetForecast} />
              <FuelBudgetForecaster forecast={budgetForecast} />
            </div>
          </TabsContent>

          <TabsContent value="fraud" className="mt-4">
            <FuelFraudDetector alerts={fraudAlerts} />
          </TabsContent>

          <TabsContent value="shipments" className="mt-4">
            <FuelShipmentLinker records={records} />
          </TabsContent>

          <TabsContent value="tanks" className="mt-4">
            <FuelTankManager />
          </TabsContent>

          <TabsContent value="records" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
            ) : records.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><Fuel className="w-12 h-12 mx-auto mb-3 opacity-30" />لا توجد سجلات وقود</CardContent></Card>
            ) : (
              <div className="grid gap-2">
                {records.map((r: any) => (
                  <Card key={r.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fuel className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <span>{r.liters}L</span>
                            <span className="text-muted-foreground">×</span>
                            <span>{r.cost_per_liter}</span>
                            <span className="text-primary">= {(r.total_cost || 0).toFixed(1)} ج.م</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{r.fuel_date}</span>
                            {r._driverName && <span>• {r._driverName}</span>}
                            {r.station_name && <span>• {r.station_name}</span>}
                            {r.odometer_reading && <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{r.odometer_reading} km</span>}
                            {r.latitude && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />GPS ✓</span>}
                            {r.vehicle_plate && <span>🚛 {r.vehicle_plate}</span>}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FuelManagement;
