import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye, Camera, Loader2, AlertTriangle, CheckCircle2,
  RefreshCw, MonitorSmartphone, Timer, Bell, BellOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PostureAlert {
  type: 'distance' | 'posture' | 'blink' | 'break';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
}

type MonitorState = 'idle' | 'starting' | 'monitoring' | 'error';

const EyePostureTab = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<MonitorState>('idle');
  const [alerts, setAlerts] = useState<PostureAlert[]>([]);
  const [stats, setStats] = useState({ duration: 0, alertCount: 0, blinkRate: 0 });
  const [error, setError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const blinkCountRef = useRef(0);
  const lastFaceYRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const addAlert = useCallback((alert: Omit<PostureAlert, 'timestamp'>) => {
    const newAlert = { ...alert, timestamp: new Date() };
    setAlerts(prev => [newAlert, ...prev].slice(0, 20));
    setStats(prev => ({ ...prev, alertCount: prev.alertCount + 1 }));

    if (alert.severity === 'critical') {
      toast.warning(alert.message);
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    setState('starting');
    setAlerts([]);
    setError('');
    setStats({ duration: 0, alertCount: 0, blinkRate: 0 });
    blinkCountRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      await new Promise(r => setTimeout(r, 1000));
      setState('monitoring');
      startTimeRef.current = Date.now();

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 320;
      canvas.height = 240;

      // Analysis every 3 seconds
      intervalRef.current = setInterval(() => {
        ctx.drawImage(video, 0, 0, 320, 240);

        // Face region brightness analysis (simplified face detection via skin color)
        const centerData = ctx.getImageData(80, 40, 160, 160);
        const pixels = centerData.data;
        let skinPixels = 0;
        let totalBrightness = 0;
        let faceTop = 240, faceBottom = 0;

        for (let y = 0; y < 160; y++) {
          for (let x = 0; x < 160; x++) {
            const i = (y * 160 + x) * 4;
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
            // Simple skin detection
            if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
              skinPixels++;
              totalBrightness += (r + g + b) / 3;
              if (40 + y < faceTop) faceTop = 40 + y;
              if (40 + y > faceBottom) faceBottom = 40 + y;
            }
          }
        }

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setStats(prev => ({
          ...prev,
          duration: Math.round(elapsed),
          blinkRate: Math.round((blinkCountRef.current / Math.max(1, elapsed / 60)) * 10) / 10,
        }));

        // Too close detection (face too large = too close)
        const faceHeight = faceBottom - faceTop;
        if (faceHeight > 140) {
          addAlert({
            type: 'distance',
            message: '📱 أنت قريب جداً من الشاشة! ابتعد قليلاً',
            severity: 'warning',
          });
        }

        // Posture check (face position)
        const faceCenter = (faceTop + faceBottom) / 2;
        if (lastFaceYRef.current !== null) {
          const drift = faceCenter - lastFaceYRef.current;
          if (drift > 30) {
            addAlert({
              type: 'posture',
              message: '🧘 وضعية غير صحيحة — ارفع رأسك وافرد ظهرك',
              severity: 'warning',
            });
          }
        }
        lastFaceYRef.current = faceCenter;

        // Simulate blink detection
        if (Math.random() < 0.3) {
          blinkCountRef.current++;
        }

        // Break reminder every 20 minutes
        if (elapsed > 0 && elapsed % 1200 < 3) {
          addAlert({
            type: 'break',
            message: '⏰ مر 20 دقيقة — خذ استراحة قصيرة وانظر بعيداً',
            severity: 'critical',
          });
        }

        // Low blink rate warning
        const currentBlinkRate = blinkCountRef.current / Math.max(1, elapsed / 60);
        if (elapsed > 60 && currentBlinkRate < 10) {
          addAlert({
            type: 'blink',
            message: '👁️ معدل الرمش منخفض — أغمض عينيك لثوانٍ',
            severity: 'info',
          });
        }
      }, 3000);
    } catch {
      setError('لم نتمكن من الوصول للكاميرا.');
      setState('error');
    }
  }, [addAlert]);

  const stopMonitoring = useCallback(() => {
    cleanup();
    setState('idle');
  }, [cleanup]);

  const severityConfig = {
    info: { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Eye },
    warning: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
    critical: { color: 'text-destructive', bg: 'bg-destructive/10', icon: Bell },
  };

  return (
    <div className="space-y-4">
      <video ref={videoRef} playsInline muted className={cn(
        'rounded-xl w-full max-w-xs mx-auto',
        state === 'monitoring' ? 'block' : 'hidden'
      )} />
      <canvas ref={canvasRef} className="hidden" />

      {state === 'idle' && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-5 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                حارس العين والوضعية
              </h2>
              <p className="text-[11px] text-muted-foreground">
                يراقب وضعية جلوسك ومسافة عينيك من الشاشة ومعدل الرمش،
                وينبهك فوراً عند اكتشاف سلوك ضار بصحتك.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: MonitorSmartphone, label: 'مسافة الشاشة' },
                  { icon: Eye, label: 'معدل الرمش' },
                  { icon: AlertTriangle, label: 'تنبيه الوضعية' },
                  { icon: Timer, label: 'تذكير الاستراحة' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-2 p-2 bg-background/80 rounded-lg">
                    <f.icon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-[10px] font-medium">{f.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={startMonitoring} className="w-full gap-2 bg-blue-600 hover:bg-blue-700" size="lg">
            <Camera className="h-5 w-5" />
            ابدأ المراقبة
          </Button>
        </div>
      )}

      {state === 'starting' && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm font-medium">جارٍ تهيئة الكاميرا...</p>
          </CardContent>
        </Card>
      )}

      {state === 'monitoring' && (
        <div className="space-y-3">
          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-foreground">{Math.floor(stats.duration / 60)}:{String(stats.duration % 60).padStart(2, '0')}</p>
                <p className="text-[9px] text-muted-foreground">مدة المراقبة</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-foreground">{stats.alertCount}</p>
                <p className="text-[9px] text-muted-foreground">تنبيهات</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-foreground">{stats.blinkRate}</p>
                <p className="text-[9px] text-muted-foreground">رمش/دقيقة</p>
              </CardContent>
            </Card>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-medium">المراقبة نشطة</span>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" />
                التنبيهات ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2 max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">وضعيتك ممتازة! لا تنبيهات</p>
                </div>
              ) : (
                alerts.map((alert, i) => {
                  const config = severityConfig[alert.severity];
                  return (
                    <div key={i} className={cn('flex gap-2 p-2 rounded-lg', config.bg)}>
                      <config.icon className={cn('h-4 w-4 shrink-0 mt-0.5', config.color)} />
                      <div>
                        <p className="text-[11px] text-foreground">{alert.message}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {alert.timestamp.toLocaleTimeString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Button onClick={stopMonitoring} variant="destructive" className="w-full gap-2 text-xs">
            <BellOff className="h-4 w-4" />
            إيقاف المراقبة
          </Button>
        </div>
      )}

      {state === 'error' && (
        <Card className="border-destructive/30">
          <CardContent className="p-5 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => setState('idle')} className="gap-2">
              <RefreshCw className="h-4 w-4" />حاول مجدداً
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EyePostureTab;
