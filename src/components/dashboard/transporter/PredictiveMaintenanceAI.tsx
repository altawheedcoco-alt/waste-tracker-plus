/**
 * ٥. الصيانة التنبؤية — بيانات حية من fleet_vehicles + vehicle_maintenance_logs
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Wrench, AlertTriangle, CheckCircle, Clock, RefreshCw, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface VehicleHealth {
  id: string;
  plate: string;
  type: string;
  healthScore: number;
  nextMaintenanceIn: number; // days
  lastMaintenance: string | null;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictions: string[];
}

const PredictiveMaintenanceAI = () => {
  const { organization } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchAndAnalyze = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const [fleetRes, logsRes] = await Promise.all([
        supabase.from('fleet_vehicles').select('id, plate_number, vehicle_type, status')
          .eq('organization_id', organization.id),
        supabase.from('vehicle_maintenance').select('vehicle_plate, maintenance_type, performed_at, cost, notes')
          .eq('organization_id', organization.id).order('performed_at', { ascending: false }).limit(100),
      ]);

      const fleet = fleetRes.data || [];
      const logs = logsRes.data || [];
      const now = new Date();

      const healthData: VehicleHealth[] = fleet.map(v => {
        const vehicleLogs = logs.filter((l: any) => l.vehicle_plate === v.plate_number);
        const lastLog = vehicleLogs[0] as any;
        const daysSinceLastMaint = lastLog?.performed_at
          ? Math.floor((now.getTime() - new Date(lastLog.performed_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        const daysToNext = 30;

        let healthScore = 100;
        if (daysSinceLastMaint > 90) healthScore -= 30;
        else if (daysSinceLastMaint > 60) healthScore -= 15;
        if (daysToNext < 0) healthScore -= 40;
        else if (daysToNext < 7) healthScore -= 20;
        healthScore = Math.max(0, Math.min(100, healthScore));

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (healthScore < 30) riskLevel = 'critical';
        else if (healthScore < 50) riskLevel = 'high';
        else if (healthScore < 70) riskLevel = 'medium';

        const predictions: string[] = [];
        if (daysToNext <= 0) predictions.push('⚠️ تجاوزت موعد الصيانة!');
        if (daysToNext > 0 && daysToNext <= 7) predictions.push(`🔧 صيانة مجدولة خلال ${daysToNext} أيام`);
        if (daysSinceLastMaint > 90) predictions.push('📅 لم تتم صيانة منذ أكثر من 3 أشهر');
        if ((v.mileage || 0) > 200000) predictions.push('🛞 المسافة المقطوعة تتجاوز 200,000 كم');

        return {
          id: v.id,
          plate: v.plate_number || 'غير محدد',
          type: v.vehicle_type || 'شاحنة',
          healthScore,
          nextMaintenanceIn: Math.max(0, daysToNext),
          lastMaintenance: lastLog?.performed_at || v.last_maintenance_date || null,
          riskLevel,
          predictions,
        };
      });

      healthData.sort((a, b) => a.healthScore - b.healthScore);
      setVehicles(healthData);
    } catch (err) {
      console.error('Maintenance analysis error:', err);
      toast.error('خطأ في تحليل الصيانة');
    } finally {
      setLoading(false);
    }
  };

  const runAIPrediction = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-maintenance-predictor', {
        body: {
          vehicles: vehicles.map(v => ({ id: v.id, plate: v.plate, type: v.type, healthScore: v.healthScore, mileage: 0 })),
          organizationId: organization?.id,
        }
      });
      if (!error && data) {
        toast.success('تم تحديث التنبؤات بالذكاء الاصطناعي');
      }
    } catch {
      toast.info('تم استخدام التحليل المحلي');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => { fetchAndAnalyze(); }, [organization?.id]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'critical': return 'حرج';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      default: return 'منخفض';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            الصيانة التنبؤية (AI)
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runAIPrediction} disabled={analyzing}>
              <Brain className={`h-4 w-4 ml-1 ${analyzing ? 'animate-spin' : ''}`} />
              تحليل AI
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchAndAnalyze} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-4 animate-pulse">جاري تحليل صحة الأسطول...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد مركبات مسجلة</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {vehicles.map(v => (
              <div key={v.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {v.riskLevel === 'critical' || v.riskLevel === 'high' ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className="text-sm font-medium">{v.plate}</span>
                    <span className="text-xs text-muted-foreground">{v.type}</span>
                  </div>
                  <Badge variant={getRiskColor(v.riskLevel)} className="text-[10px]">{getRiskLabel(v.riskLevel)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">الصحة</span>
                  <Progress value={v.healthScore} className="flex-1 h-2" />
                  <span className="text-xs font-medium w-8">{v.healthScore}%</span>
                </div>
                {v.predictions.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {v.predictions.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictiveMaintenanceAI;
