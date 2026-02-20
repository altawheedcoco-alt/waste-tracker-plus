import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Keyboard, Camera, X, Loader2, SwitchCamera } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isScanning?: boolean;
}

const QRScanner = ({ onScan, onError, isScanning = false }: QRScannerProps) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scannerState, setScannerState] = useState<'idle' | 'requesting' | 'scanning' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    
    setScannerState('requesting');
    setCameraError(null);

    try {
      const scanner = new Html5Qrcode('qr-reader-custom');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(console.error);
        },
        () => {
          // Ignore frame-level scan failures
        }
      );

      setScannerState('scanning');
    } catch (err: any) {
      console.error('Camera error:', err);
      const msg = err?.toString?.() || '';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraError('تم رفض إذن الكاميرا. يرجى السماح بالوصول للكاميرا من إعدادات المتصفح.');
      } else if (msg.includes('NotFoundError') || msg.includes('no camera')) {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
      } else {
        setCameraError('فشل في تشغيل الكاميرا. تأكد من أن الكاميرا غير مستخدمة بتطبيق آخر.');
      }
      setScannerState('error');
      onError?.(cameraError || 'فشل في تهيئة الكاميرا');
    }
  }, [onScan, onError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScannerState('idle');
  }, []);

  useEffect(() => {
    if (activeTab === 'camera') {
      const timer = setTimeout(() => startScanner(), 200);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab, startScanner, stopScanner]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleTabChange = (value: string) => {
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
              {scannerState === 'error' && cameraError ? (
                <div className="text-center py-8 text-muted-foreground">
                  <X className="w-12 h-12 mx-auto mb-2 text-destructive" />
                  <p className="text-sm mb-4">{cameraError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startScanner()}
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative rounded-lg overflow-hidden bg-black" style={{ minHeight: '300px' }}>
                    <div id="qr-reader-custom" ref={containerRef} className="w-full" />
                    
                    {scannerState === 'requesting' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-sm font-medium text-foreground">جاري طلب إذن الكاميرا...</p>
                        <p className="text-xs text-muted-foreground">يرجى السماح بالوصول للكاميرا</p>
                      </div>
                    )}
                  </div>
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
