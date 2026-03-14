import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Scale, MapPin, FileText, Clock, CheckCircle, XCircle, Navigation, Wifi, WifiOff, Download, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
// jsPDF loaded dynamically

interface ComplianceMonitorTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
}

const ComplianceMonitorTab = ({ facilityId, organizationId }: ComplianceMonitorTabProps) => {
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [subTab, setSubTab] = useState('active');

  // Active shipments with compliance data
  const { data: shipments = [] } = useQuery({
    queryKey: ['compliance-shipments', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('shipments')
        .select(`
          id, shipment_number, status, waste_type, quantity, unit,
          weight_at_source, weight_at_destination, weight_discrepancy_pct,
          compliance_verified, gps_active_throughout, gps_signal_lost_at,
          escrow_status, pickup_location, delivery_location,
          pickup_lat, pickup_lng, delivery_lat, delivery_lng,
          weighbridge_photo_url, pickup_photo_url, delivery_photo_url,
          created_at, updated_at,
          generator:organizations!shipments_generator_id_fkey(name, license_expiry),
          transporter:organizations!shipments_transporter_id_fkey(name, license_expiry),
          recycler:organizations!shipments_recycler_id_fkey(name, license_expiry)
        `)
        .or(`recycler_id.eq.${organizationId},generator_id.eq.${organizationId},transporter_id.eq.${organizationId},organization_id.eq.${organizationId}`)
        .in('status', ['approved', 'collecting', 'in_transit', 'delivered', 'confirmed'])
        .order('updated_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organizationId,
    refetchInterval: 30000,
  });

  // Audit logs for selected shipment
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['shipment-audit', selectedShipment?.id],
    queryFn: async () => {
      if (!selectedShipment?.id) return [];
      const { data } = await supabase
        .from('shipment_logs')
        .select('id, status, notes, latitude, longitude, created_at, changed_by')
        .eq('shipment_id', selectedShipment.id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedShipment?.id,
  });

  // GPS signal loss alerts
  const { data: gpsAlerts = [] } = useQuery({
    queryKey: ['gps-alerts', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, gps_signal_lost_at, driver_id, status')
        .or(`recycler_id.eq.${organizationId},organization_id.eq.${organizationId}`)
        .eq('gps_active_throughout', false)
        .not('gps_signal_lost_at', 'is', null)
        .in('status', ['in_transit', 'collecting'])
        .order('gps_signal_lost_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!organizationId,
  });

  const isLicenseValid = (org: any) => {
    if (!org?.license_expiry) return null;
    return new Date(org.license_expiry) > new Date();
  };

  const getComplianceBadge = (org: any, label: string) => {
    const valid = isLicenseValid(org);
    if (valid === null) return <Badge variant="outline" className="text-xs gap-1">❓ {label}: غير محدد</Badge>;
    return valid
      ? <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs gap-1"><CheckCircle className="w-3 h-3" /> {label}: مرخص</Badge>
      : <Badge variant="destructive" className="text-xs gap-1"><XCircle className="w-3 h-3" /> {label}: منتهي!</Badge>;
  };

  const getWeightStatus = (shipment: any) => {
    if (!shipment.weight_at_source || !shipment.weight_at_destination) return null;
    const pct = shipment.weight_discrepancy_pct;
    if (pct > 5) return { color: 'text-orange-600 bg-orange-50 border-orange-200', label: `فرق ${pct}% ⚠️`, alert: true };
    return { color: 'text-green-600 bg-green-50 border-green-200', label: `فرق ${pct}% ✓`, alert: false };
  };

  const generateManifestPDF = (shipment: any) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(18);
    doc.text('Digital Waste Manifest', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Manifest #: ${shipment.shipment_number}`, 105, 28, { align: 'center' });
    doc.text(`Date: ${format(new Date(shipment.created_at), 'yyyy-MM-dd hh:mm a')}`, 105, 34, { align: 'center' });
    
    doc.line(20, 38, 190, 38);
    
    let y = 46;
    const addRow = (label: string, value: string) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || 'N/A', 80, y);
      y += 7;
    };

    addRow('Waste Type:', shipment.waste_type);
    addRow('Quantity:', `${shipment.quantity} ${shipment.unit || 'ton'}`);
    addRow('Generator:', shipment.generator?.name || 'N/A');
    addRow('Transporter:', shipment.transporter?.name || 'N/A');
    addRow('Recycler/Disposal:', shipment.recycler?.name || 'N/A');
    addRow('Pickup Location:', shipment.pickup_location || 'N/A');
    addRow('Delivery Location:', shipment.delivery_location || 'N/A');
    addRow('Weight at Source:', shipment.weight_at_source ? `${shipment.weight_at_source} ton` : 'Not recorded');
    addRow('Weight at Destination:', shipment.weight_at_destination ? `${shipment.weight_at_destination} ton` : 'Not recorded');
    addRow('Weight Discrepancy:', shipment.weight_discrepancy_pct ? `${shipment.weight_discrepancy_pct}%` : 'N/A');
    addRow('GPS Active Throughout:', shipment.gps_active_throughout ? 'Yes' : 'No');
    addRow('Escrow Status:', shipment.escrow_status || 'none');
    addRow('Compliance Verified:', shipment.compliance_verified ? 'Yes' : 'No');
    addRow('Status:', shipment.status);

    if (shipment.pickup_lat && shipment.pickup_lng) {
      addRow('Pickup Coordinates:', `${shipment.pickup_lat}, ${shipment.pickup_lng}`);
    }
    if (shipment.delivery_lat && shipment.delivery_lng) {
      addRow('Delivery Coordinates:', `${shipment.delivery_lat}, ${shipment.delivery_lng}`);
    }

    y += 10;
    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(8);
    doc.text('This manifest is digitally generated and verified via GPS tracking system.', 105, y, { align: 'center' });
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd hh:mm:ss a')}`, 105, y + 5, { align: 'center' });

    doc.save(`manifest-${shipment.shipment_number}.pdf`);
    toast.success('تم تحميل المانيفست الرقمي بنجاح');
  };

  const activeShipments = shipments.filter((s: any) => ['approved', 'collecting', 'in_transit'].includes(s.status));
  const completedShipments = shipments.filter((s: any) => ['delivered', 'confirmed'].includes(s.status));

  return (
    <div className="space-y-6">
      {/* GPS Signal Loss Alerts */}
      {gpsAlerts.length > 0 && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <WifiOff className="w-4 h-4 text-red-600 animate-pulse" />
              <span className="font-bold text-sm text-red-700 dark:text-red-400">⚠️ تنبيه فقدان إشارة GPS ({gpsAlerts.length})</span>
            </div>
            <div className="space-y-1">
              {gpsAlerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between text-sm p-2 rounded bg-red-100/50 dark:bg-red-900/20">
                  <Badge variant="destructive" className="text-xs animate-pulse">فقدان إشارة</Badge>
                  <span className="text-muted-foreground text-xs">
                    {alert.gps_signal_lost_at && formatDistanceToNow(new Date(alert.gps_signal_lost_at), { locale: ar, addSuffix: true })}
                  </span>
                  <span className="font-medium">شحنة {alert.shipment_number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1 gap-2">
            <Navigation className="w-4 h-4" /> نشطة ({activeShipments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 gap-2">
            <CheckCircle className="w-4 h-4" /> مكتملة ({completedShipments.length})
          </TabsTrigger>
        </TabsList>

        {['active', 'completed'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            {(tab === 'active' ? activeShipments : completedShipments).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا توجد شحنات {tab === 'active' ? 'نشطة' : 'مكتملة'}</p>
              </div>
            ) : (
              (tab === 'active' ? activeShipments : completedShipments).map((shipment: any) => {
                const weightStatus = getWeightStatus(shipment);
                return (
                  <Card key={shipment.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      {/* Header row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => generateManifestPDF(shipment)}>
                            <Download className="w-3 h-3" /> مانيفست PDF
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => { setSelectedShipment(shipment); setShowAuditDialog(true); }}>
                            <Eye className="w-3 h-3" /> سجل التدقيق
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-sm">{shipment.shipment_number}</span>
                          <Badge variant="outline" className="mr-2 text-xs">{shipment.status}</Badge>
                        </div>
                      </div>

                      {/* Compliance badges row */}
                      <div className="flex flex-wrap gap-2 mb-3 justify-end">
                        {getComplianceBadge(shipment.generator, 'المولد')}
                        {getComplianceBadge(shipment.transporter, 'الناقل')}
                        {getComplianceBadge(shipment.recycler, 'المدور')}
                        {shipment.gps_active_throughout ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs gap-1"><Wifi className="w-3 h-3" /> GPS نشط</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1 animate-pulse"><WifiOff className="w-3 h-3" /> GPS مفقود!</Badge>
                        )}
                        {shipment.escrow_status === 'held' && <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 text-xs">💰 Escrow محجوز</Badge>}
                        {shipment.escrow_status === 'released' && <Badge className="bg-green-500/10 text-green-600 border-green-200 text-xs">✅ Escrow محرر</Badge>}
                      </div>

                      {/* Dual weight verification */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-muted/50 text-right">
                          <p className="text-xs text-muted-foreground">وزن المولد</p>
                          <p className="font-bold">{shipment.weight_at_source ? `${shipment.weight_at_source} طن` : '—'}</p>
                        </div>
                        <div className={`p-2 rounded-lg text-right border ${weightStatus?.color || 'bg-muted/50'}`}>
                          <p className="text-xs text-muted-foreground">وزن المدور</p>
                          <p className="font-bold">{shipment.weight_at_destination ? `${shipment.weight_at_destination} طن` : '—'}</p>
                          {weightStatus && (
                            <p className={`text-xs font-medium ${weightStatus.alert ? 'text-orange-600' : 'text-green-600'}`}>
                              {weightStatus.label}
                            </p>
                          )}
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50 text-right">
                          <p className="text-xs text-muted-foreground">نوع المخلف</p>
                          <p className="font-bold text-xs">{shipment.waste_type}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50 text-right">
                          <p className="text-xs text-muted-foreground">الكمية</p>
                          <p className="font-bold">{shipment.quantity} {shipment.unit || 'طن'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Audit Trail Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> سجل التدقيق — {selectedShipment?.shipment_number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {auditLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">لا توجد سجلات</p>
            ) : (
              auditLogs.map((log: any, i: number) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${i === auditLogs.length - 1 ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                    {i < auditLogs.length - 1 && <div className="w-px h-full bg-border min-h-[20px]" />}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'yyyy/MM/dd hh:mm:ss a')}
                      </span>
                      <Badge variant="outline" className="text-xs">{log.status}</Badge>
                    </div>
                    <p className="text-sm mt-1">{log.notes || 'تغيير حالة'}</p>
                    {log.latitude && log.longitude && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                        <MapPin className="w-3 h-3" /> {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                        {' '}<Badge variant="outline" className="text-[10px]">GPS ✓</Badge>
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplianceMonitorTab;
