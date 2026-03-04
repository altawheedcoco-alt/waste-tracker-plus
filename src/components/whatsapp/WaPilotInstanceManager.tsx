import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw, Loader2, Power, QrCode, Smartphone, Signal, Globe, ShieldCheck, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface WaPilotInstance {
  id: string;
  name?: string;
  status?: string;
  phone?: string;
  [key: string]: any;
}

interface Props {
  instances: WaPilotInstance[];
  loading: boolean;
  onRefresh: () => void;
  selectedInstance: string;
  onSelectInstance: (id: string) => void;
}

const WaPilotInstanceManager = ({ instances, loading, onRefresh, selectedInstance, onSelectInstance }: Props) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [instanceDetails, setInstanceDetails] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const executeAction = async (action: string, instanceId: string, label: string) => {
    setActionLoading(`${action}_${instanceId}`);
    try {
      const { data, error } = await supabase.functions.invoke('wapilot-proxy', {
        body: { action, instance_id: instanceId },
      });
      if (error) throw error;
      
      if (action === 'get-qr') {
        const qr = data?.qr || data?.qrcode || data?.data?.qr;
        if (qr) {
          setQrCode(qr);
          setShowQrDialog(true);
        } else {
          toast.info('لا يوجد QR Code متاح - الجهاز متصل بالفعل');
        }
      } else if (action === 'instance-status') {
        setInstanceDetails(data);
        setShowDetailsDialog(true);
      } else {
        toast.success(`تم تنفيذ: ${label}`);
        onRefresh();
      }
    } catch (e: any) {
      toast.error(`فشل: ${e.message}`);
    }
    setActionLoading(null);
  };

  const isLoading = (action: string, id: string) => actionLoading === `${action}_${id}`;
  const isConnected = (inst: WaPilotInstance) => inst.status === 'active' || inst.status === 'connected';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              إدارة الأجهزة المتصلة (Instances)
            </CardTitle>
            <CardDescription>التحكم الكامل في أجهزة الواتساب المربوطة بالنظام</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />تحديث
          </Button>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>جاري تحميل الأجهزة...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <WifiOff className="h-8 w-8" />
                  <p>لا توجد أجهزة متصلة</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instances.map(inst => (
                <Card key={inst.id} className={`border-2 transition-colors ${selectedInstance === inst.id ? 'border-primary' : 'border-border'}`}>
                  <CardContent className="pt-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isConnected(inst) ? 'bg-green-100 dark:bg-green-950' : 'bg-destructive/10'}`}>
                          {isConnected(inst) ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-destructive" />}
                        </div>
                        <div>
                          <p className="font-semibold">{inst.name || 'جهاز WaPilot'}</p>
                          <p className="text-xs text-muted-foreground font-mono" dir="ltr">{inst.phone || inst.id}</p>
                        </div>
                      </div>
                      <Badge variant={isConnected(inst) ? 'default' : 'destructive'}>
                        {isConnected(inst) ? 'متصل' : inst.status || 'غير متصل'}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded p-2">
                        <Signal className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">الحالة</p>
                        <p className="text-xs font-medium">{isConnected(inst) ? 'نشط' : 'غير نشط'}</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <Globe className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">المعرّف</p>
                        <p className="text-xs font-medium font-mono" dir="ltr">{inst.id.slice(0, 8)}...</p>
                      </div>
                      <div className="bg-muted/50 rounded p-2">
                        <ShieldCheck className="h-3.5 w-3.5 mx-auto mb-1 text-green-600" />
                        <p className="text-xs text-muted-foreground">الأمان</p>
                        <p className="text-xs font-medium">مؤمّن</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant={selectedInstance === inst.id ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                        onClick={() => onSelectInstance(inst.id)}
                      >
                        {selectedInstance === inst.id ? '✓ مُحدد' : 'تحديد'}
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs"
                        disabled={isLoading('instance-status', inst.id)}
                        onClick={() => executeAction('instance-status', inst.id, 'عرض التفاصيل')}
                      >
                        {isLoading('instance-status', inst.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Signal className="h-3 w-3 ml-1" />}
                        التفاصيل
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs"
                        disabled={isLoading('get-qr', inst.id)}
                        onClick={() => executeAction('get-qr', inst.id, 'QR Code')}
                      >
                        {isLoading('get-qr', inst.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <QrCode className="h-3 w-3 ml-1" />}
                        QR
                      </Button>
                      <Button
                        variant="outline" size="sm" className="text-xs"
                        disabled={isLoading('restart-instance', inst.id)}
                        onClick={() => executeAction('restart-instance', inst.id, 'إعادة تشغيل')}
                      >
                        {isLoading('restart-instance', inst.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 ml-1" />}
                        إعادة تشغيل
                      </Button>
                      <Button
                        variant={isConnected(inst) ? 'destructive' : 'default'}
                        size="sm" className="text-xs"
                        disabled={isLoading('disconnect-instance', inst.id) || isLoading('connect-instance', inst.id)}
                        onClick={() => executeAction(
                          isConnected(inst) ? 'disconnect-instance' : 'connect-instance',
                          inst.id,
                          isConnected(inst) ? 'قطع الاتصال' : 'اتصال'
                        )}
                      >
                        <Power className="h-3 w-3 ml-1" />
                        {isConnected(inst) ? 'قطع' : 'اتصال'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle>مسح QR Code</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCode && (
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64" />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              افتح تطبيق واتساب على هاتفك → الإعدادات → الأجهزة المرتبطة → ربط جهاز
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instance Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تفاصيل الجهاز</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {instanceDetails && (
              <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap font-mono" dir="ltr">
                {JSON.stringify(instanceDetails, null, 2)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaPilotInstanceManager;
