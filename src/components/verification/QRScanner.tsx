import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Keyboard, Camera, X, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isScanning?: boolean;
}

const QRScanner = ({ onScan, onError, isScanning = false }: QRScannerProps) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'camera' && containerRef.current) {
      // تأخير قليل للتأكد من أن العنصر جاهز
      const timer = setTimeout(() => {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
              rememberLastUsedCamera: true,
              showTorchButtonIfSupported: true,
            },
            false
          );

          scannerRef.current.render(
            (decodedText) => {
              // تم المسح بنجاح
              onScan(decodedText);
              // إيقاف الماسح بعد المسح
              if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
              }
            },
            (error) => {
              // تجاهل أخطاء المسح العادية (عندما لا يوجد QR في الإطار)
              if (!error.includes('No MultiFormat Readers') && !error.includes('NotFoundException')) {
                console.log('QR Scan error:', error);
              }
            }
          );

          setScannerReady(true);
          setCameraError(null);
        } catch (err: any) {
          console.error('Failed to initialize scanner:', err);
          setCameraError('فشل في تهيئة الكاميرا');
          onError?.('فشل في تهيئة الكاميرا');
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
        }
      };
    }
  }, [activeTab, onScan, onError]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleTabChange = (value: string) => {
    // تنظيف الماسح قبل التبديل
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScannerReady(false);
    setActiveTab(value as 'camera' | 'manual');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="w-6 h-6 text-primary" />
          مسح رمز QR
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="w-4 h-4" />
              الكاميرا
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Keyboard className="w-4 h-4" />
              إدخال يدوي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-0">
            <div className="space-y-4">
              {cameraError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <X className="w-12 h-12 mx-auto mb-2 text-destructive" />
                  <p>{cameraError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => handleTabChange('camera')}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <>
                  <div 
                    id="qr-reader" 
                    ref={containerRef}
                    className="rounded-lg overflow-hidden bg-muted"
                    style={{ minHeight: '300px' }}
                  />
                  {!scannerReady && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="mr-2 text-muted-foreground">جاري تهيئة الكاميرا...</span>
                    </div>
                  )}
                </>
              )}
              <p className="text-sm text-muted-foreground text-center">
                وجّه الكاميرا نحو رمز QR الموجود على المستند
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">رقم المستند أو كود التحقق</label>
                <Input
                  placeholder="مثال: SHP-20260207-1234 أو CRT-20260207-5678"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  className="text-center font-mono"
                  dir="ltr"
                />
              </div>
              <Button 
                onClick={handleManualSubmit} 
                className="w-full gap-2"
                disabled={!manualCode.trim() || isScanning}
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                تحقق من المستند
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QRScanner;
