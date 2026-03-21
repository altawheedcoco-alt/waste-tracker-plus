import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  AlertTriangle, Shield, Eye, CheckCircle, XCircle, 
  RefreshCw, Search, TrendingUp 
} from 'lucide-react';

interface FraudAlert {
  id: string;
  shipment_id: string;
  alert_type: string;
  severity: string;
  description: string;
  evidence: any;
  status: string;
  created_at: string;
}

const alertTypeLabels: Record<string, { label: string; icon: string }> = {
  weight_anomaly: { label: 'شذوذ في الوزن', icon: '⚖️' },
  route_deviation: { label: 'انحراف عن المسار', icon: '🗺️' },
  duplicate_shipment: { label: 'شحنة مكررة', icon: '📋' },
  suspicious_timing: { label: 'توقيت مشبوه', icon: '⏰' },
  price_anomaly: { label: 'شذوذ في السعر', icon: '💰' },
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const FraudDetectionPanel = () => {
  const { organization } = useAuth();
  const [scanning, setScanning] = useState(false);

  const { data: alerts = [], isLoading: loading, refetch: fetchAlerts } = useQuery({
    queryKey: ['fraud-alerts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('fraud_alerts')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as FraudAlert[];
    },
    enabled: !!organization?.id,
    refetchInterval: 60_000,
  });

  const runScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('fraud-detection', {
        body: { organizationId: organization!.id },
      });

      if (error) throw error;
      toast.success(`تم الفحص: ${data.alerts_generated} تنبيه جديد`);
      fetchAlerts();
    } catch (e: any) {
      toast.error(e.message || 'خطأ أثناء الفحص');
    } finally {
      setScanning(false);
    }
  };

  const updateAlertStatus = async (id: string, status: string) => {
    try {
      await supabase.from('fraud_alerts').update({ 
        status,
        ...(status === 'resolved' || status === 'dismissed' ? { resolved_at: new Date().toISOString() } : {}),
      }).eq('id', id);
      toast.success('تم تحديث حالة التنبيه');
      fetchAlerts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openAlerts = alerts.filter(a => a.status === 'open');
  const criticalCount = openAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-6 h-6 mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold">{alerts.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي التنبيهات</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto text-destructive mb-1" />
          <div className="text-2xl font-bold">{openAlerts.length}</div>
          <div className="text-xs text-muted-foreground">تنبيهات مفتوحة</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto text-orange-500 mb-1" />
          <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
          <div className="text-xs text-muted-foreground">حرجة / عالية</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-1" />
          <div className="text-2xl font-bold">{alerts.filter(a => a.status === 'resolved').length}</div>
          <div className="text-xs text-muted-foreground">تم حلها</div>
        </CardContent></Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={runScan} disabled={scanning} size="sm">
          {scanning ? <RefreshCw className="w-4 h-4 ml-1 animate-spin" /> : <Search className="w-4 h-4 ml-1" />}
          {scanning ? 'جاري الفحص...' : 'فحص الآن'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fetchAlerts()}>
          <RefreshCw className="w-4 h-4 ml-1" />
          تحديث
        </Button>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            تنبيهات الاحتيال والشذوذ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد تنبيهات. اضغط "فحص الآن" لتحليل الشحنات.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-2 ${
                  alert.status === 'open' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{alertTypeLabels[alert.alert_type]?.icon || '⚠️'}</span>
                        <span className="font-semibold text-sm">{alertTypeLabels[alert.alert_type]?.label || alert.alert_type}</span>
                        <Badge className={severityColors[alert.severity] || ''} variant="outline">
                          {alert.severity === 'critical' ? 'حرج' : alert.severity === 'high' ? 'عالي' : alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <Badge variant={alert.status === 'open' ? 'destructive' : 'secondary'}>
                          {alert.status === 'open' ? 'مفتوح' : alert.status === 'investigating' ? 'قيد التحقيق' : alert.status === 'resolved' ? 'تم الحل' : 'مرفوض'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      {alert.evidence && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(alert.evidence).map(([key, val]) => (
                            <span key={key} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                              {key}: {String(val)}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString('ar')}</span>
                    </div>
                    {alert.status === 'open' && (
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm" onClick={() => updateAlertStatus(alert.id, 'investigating')}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => updateAlertStatus(alert.id, 'resolved')}>
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => updateAlertStatus(alert.id, 'dismissed')}>
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
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

export default FraudDetectionPanel;
