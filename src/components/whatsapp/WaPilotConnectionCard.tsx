import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Radio, WifiOff, RefreshCw, Copy, QrCode, RotateCcw, Power, Clock, Loader2 } from 'lucide-react';
import type { InstanceInfo } from './WaPilotTypes';
import { toast } from 'sonner';

interface Props {
  instanceStatus: 'connected' | 'disconnected' | 'loading';
  connectedPhone: string | null;
  connectedName: string | null;
  activeInstanceId: string | null;
  instances: InstanceInfo[];
  actionLoading: string | null;
  uptime: number;
  onAction: (action: string, label: string) => void;
}

const WaPilotConnectionCard = memo(({ instanceStatus, connectedPhone, connectedName, activeInstanceId, instances, actionLoading, uptime, onAction }: Props) => {
  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const copyPhone = () => {
    if (connectedPhone) { navigator.clipboard.writeText(connectedPhone); toast.success('تم نسخ الرقم'); }
  };

  return (
    <Card className={`border-2 overflow-hidden ${instanceStatus === 'connected' ? 'border-green-500/20' : 'border-destructive/20'}`}>
      <div className={`h-1 w-full ${instanceStatus === 'connected' ? 'bg-gradient-to-r from-green-500 via-green-400 to-green-500' : 'bg-gradient-to-r from-destructive via-destructive/70 to-destructive'}`} />
      <CardContent className="py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`relative p-3.5 rounded-2xl ${instanceStatus === 'connected' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-destructive/10'}`}>
              <Phone className={`h-7 w-7 ${instanceStatus === 'connected' ? 'text-green-600' : 'text-destructive'}`} />
              {instanceStatus === 'connected' && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">رقم الإرسال المربوط بالنظام</p>
              {connectedPhone ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-mono tracking-wider" dir="ltr">+{connectedPhone.replace(/^0+/, '')}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={copyPhone}><Copy className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <span className="text-lg text-muted-foreground">{instanceStatus === 'loading' ? 'جاري الكشف...' : 'لم يتم الكشف عن الرقم'}</span>
              )}
              {connectedName && <p className="text-sm text-muted-foreground">الحساب: <span className="font-medium text-foreground">{connectedName}</span></p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeInstanceId && (
              <div className="text-center bg-muted/50 rounded-lg px-3 py-2 border">
                <p className="text-[10px] text-muted-foreground">Instance</p>
                <p className="font-mono text-xs" dir="ltr">{activeInstanceId.slice(0, 12)}...</p>
              </div>
            )}
            <div className="text-center bg-muted/50 rounded-lg px-3 py-2 border">
              <p className="text-[10px] text-muted-foreground">API</p>
              <p className="font-mono text-xs" dir="ltr">v2</p>
            </div>
            <div className="text-center bg-muted/50 rounded-lg px-3 py-2 border">
              <p className="text-[10px] text-muted-foreground">الأجهزة</p>
              <p className="font-bold text-sm">{instances.length}</p>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={actionLoading === 'get-qr'} onClick={() => onAction('get-qr', 'QR Code')}>
              {actionLoading === 'get-qr' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5 ml-1" />}QR
            </Button>
            <Button variant="outline" size="sm" disabled={actionLoading === 'restart-instance'} onClick={() => onAction('restart-instance', 'إعادة تشغيل')}>
              {actionLoading === 'restart-instance' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 ml-1" />}إعادة تشغيل
            </Button>
            <Button
              variant={instanceStatus === 'connected' ? 'destructive' : 'default'} size="sm"
              disabled={actionLoading === 'connect-instance' || actionLoading === 'disconnect-instance'}
              onClick={() => onAction(instanceStatus === 'connected' ? 'disconnect-instance' : 'connect-instance', instanceStatus === 'connected' ? 'قطع' : 'اتصال')}
            >
              <Power className="h-3.5 w-3.5 ml-1" />
              {instanceStatus === 'connected' ? 'قطع' : 'اتصال'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

WaPilotConnectionCard.displayName = 'WaPilotConnectionCard';
export default WaPilotConnectionCard;
