import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  QrCode, ScanLine, CheckCircle2, Clock, ArrowDown,
  MapPin, Loader2, Shield, AlertTriangle
} from 'lucide-react';
import {
  generateCustodyQRPayload,
  recordCustodyEvent,
  getCustodyChain,
  verifyScannedQR,
  EVENT_TYPE_LABELS,
} from '@/lib/custodyChain';
import QRScanner from '@/components/verification/QRScanner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CustodyChainQRProps {
  shipmentId: string;
  shipmentNumber: string;
  userRole: 'generator' | 'transporter' | 'recycler';
  organizationId: string;
  organizationName: string;
  currentStatus: string;
}

const CustodyChainQR = ({
  shipmentId,
  shipmentNumber,
  userRole,
  organizationId,
  organizationName,
  currentStatus,
}: CustodyChainQRProps) => {
  const [chain, setChain] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrPayload, setQrPayload] = useState<string | null>(null);

  useEffect(() => {
    loadChain();
  }, [shipmentId]);

  const loadChain = async () => {
    try {
      const data = await getCustodyChain(shipmentId);
      setChain(data || []);
    } catch (error) {
      console.error('Failed to load custody chain:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine what action the current user can take
  const getAvailableAction = () => {
    const hasGeneratorHandover = chain.some(e => e.event_type === 'generator_handover');
    const hasTransporterPickup = chain.some(e => e.event_type === 'transporter_pickup');
    const hasTransporterDelivery = chain.some(e => e.event_type === 'transporter_delivery');
    const hasRecyclerReceipt = chain.some(e => e.event_type === 'recycler_receipt');

    if (userRole === 'generator' && !hasGeneratorHandover) {
      return { action: 'generate', eventType: 'generator_handover' as const, label: 'توليد رمز التسليم' };
    }
    if (userRole === 'transporter' && hasGeneratorHandover && !hasTransporterPickup) {
      return { action: 'scan', eventType: 'transporter_pickup' as const, label: 'مسح رمز الاستلام' };
    }
    if (userRole === 'transporter' && hasTransporterPickup && !hasTransporterDelivery) {
      return { action: 'generate', eventType: 'transporter_delivery' as const, label: 'توليد رمز التسليم' };
    }
    if (userRole === 'recycler' && hasTransporterDelivery && !hasRecyclerReceipt) {
      return { action: 'scan', eventType: 'recycler_receipt' as const, label: 'مسح رمز الاستلام' };
    }
    return null;
  };

  const handleGenerateQR = () => {
    const action = getAvailableAction();
    if (!action || action.action !== 'generate') return;

    const payload = generateCustodyQRPayload({
      shipmentId,
      shipmentNumber,
      eventType: action.eventType,
      organizationId,
      organizationName,
    });
    setQrPayload(payload);
  };

  const handleConfirmGenerate = async () => {
    if (!qrPayload) return;
    const action = getAvailableAction();
    if (!action) return;

    setScanning(true);
    try {
      // Get GPS
      let lat: number | undefined, lng: number | undefined, acc: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        acc = pos.coords.accuracy;
      } catch { /* GPS optional */ }

      const lastEvent = chain.length > 0 ? chain[chain.length - 1] : null;

      await recordCustodyEvent({
        shipmentId,
        eventType: action.eventType,
        qrCodeData: qrPayload,
        previousEventId: lastEvent?.id,
        gpsLatitude: lat,
        gpsLongitude: lng,
        gpsAccuracy: acc,
      });

      toast.success('تم تسجيل الحدث في سلسلة الحيازة');
      await loadChain();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setScanning(false);
      setQrPayload(null);
    }
  };

  const handleScan = async (scannedData: string) => {
    setShowScanner(false);
    setScanning(true);
    const action = getAvailableAction();
    if (!action) return;

    try {
      const verification = await verifyScannedQR(scannedData);

      if (!verification.valid) {
        toast.error(verification.message);
        return;
      }
      if (verification.alreadyScanned) {
        toast.warning('تم مسح هذا الرمز مسبقاً');
        return;
      }

      // Get GPS
      let lat: number | undefined, lng: number | undefined, acc: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        acc = pos.coords.accuracy;
      } catch { /* GPS optional */ }

      const lastEvent = chain.length > 0 ? chain[chain.length - 1] : null;

      await recordCustodyEvent({
        shipmentId,
        eventType: action.eventType,
        qrCodeData: scannedData,
        previousEventId: lastEvent?.id,
        gpsLatitude: lat,
        gpsLongitude: lng,
        gpsAccuracy: acc,
      });

      toast.success(`تم تأكيد ${EVENT_TYPE_LABELS[action.eventType]} بنجاح`);
      await loadChain();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setScanning(false);
    }
  };

  const availableAction = getAvailableAction();
  const isChainComplete = chain.some(e => e.event_type === 'recycler_receipt');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-primary" />
          سلسلة الحيازة الرقمية
          {isChainComplete && (
            <Badge variant="default" className="bg-green-600 mr-2">
              <CheckCircle2 className="w-3 h-3 ml-1" />
              مكتملة
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chain Timeline */}
        <div className="space-y-0">
          {[
            { type: 'generator_handover', icon: '🏭', role: 'المولد' },
            { type: 'transporter_pickup', icon: '🚛', role: 'الناقل (استلام)' },
            { type: 'transporter_delivery', icon: '🚛', role: 'الناقل (تسليم)' },
            { type: 'recycler_receipt', icon: '♻️', role: 'المدوّر (استلام)' },
          ].map((step, idx) => {
            const event = chain.find(e => e.event_type === step.type);
            const isActive = availableAction?.eventType === step.type;
            const isDone = !!event;

            return (
              <div key={step.type} className="flex gap-3 items-start">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${
                    isDone ? 'bg-green-100 border-green-500 text-green-700' :
                    isActive ? 'bg-primary/10 border-primary text-primary animate-pulse' :
                    'bg-muted border-border text-muted-foreground'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                  </div>
                  {idx < 3 && (
                    <div className={`w-0.5 h-8 ${isDone ? 'bg-green-500' : 'bg-border'}`} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className={`text-sm font-medium ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.role}
                  </p>
                  {event && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                      </p>
                      {event.gps_latitude && (
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.gps_latitude.toFixed(4)}, {event.gps_longitude?.toFixed(4)}
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-muted-foreground/60 truncate max-w-[200px]">
                        SHA: {event.qr_code_hash?.slice(0, 16)}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Area */}
        {availableAction && !showScanner && !qrPayload && (
          <div className="pt-2 border-t">
            {availableAction.action === 'generate' ? (
              <Button onClick={handleGenerateQR} className="w-full gap-2" disabled={scanning}>
                <QrCode className="w-4 h-4" />
                {availableAction.label}
              </Button>
            ) : (
              <Button onClick={() => setShowScanner(true)} className="w-full gap-2" disabled={scanning}>
                <ScanLine className="w-4 h-4" />
                {availableAction.label}
              </Button>
            )}
          </div>
        )}

        {/* QR Display for Generation */}
        {qrPayload && (
          <div className="space-y-3 pt-2 border-t">
            <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-2">
              <QRCodeSVG value={qrPayload} size={200} level="H" />
              <p className="text-xs text-muted-foreground text-center">
                اعرض هذا الرمز للطرف المستلم لمسحه
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConfirmGenerate} className="flex-1 gap-2" disabled={scanning}>
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                تأكيد وتسجيل
              </Button>
              <Button variant="outline" onClick={() => setQrPayload(null)} disabled={scanning}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Scanner */}
        {showScanner && (
          <div className="pt-2 border-t">
            <QRScanner
              onScan={handleScan}
              isScanning={scanning}
              onError={(err) => toast.error(err)}
            />
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setShowScanner(false)}
            >
              إلغاء المسح
            </Button>
          </div>
        )}

        {/* Chain integrity notice */}
        {isChainComplete && (
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
            <Shield className="w-4 h-4 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">سلسلة حيازة مكتملة وموثقة</p>
              <p className="text-green-600 text-xs">
                تم توثيق {chain.length} أحداث بتوقيعات رقمية (SHA-256) وإحداثيات GPS
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustodyChainQR;
