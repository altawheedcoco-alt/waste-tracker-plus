import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, MapPin } from 'lucide-react';
import { getTabChannelName } from '@/lib/tabSession';

interface DriverSignal {
  id: string;
  driver_id: string;
  is_online: boolean;
  last_seen_at: string;
  last_latitude: number | null;
  last_longitude: number | null;
  signal_lost_at: string | null;
  battery_level: number | null;
  tracking_mode: string;
  drivers?: { full_name: string } | null;
}

const SignalMonitorWidget: React.FC = () => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<DriverSignal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    if (!user?.id) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) return;

    const { data } = await supabase
      .from('driver_signal_status')
      .select('*, drivers:driver_id(full_name)')
      .eq('organization_id', profile.organization_id)
      .order('last_seen_at', { ascending: false });

    if (data) setSignals(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchSignals();

    const channel = supabase
      .channel(getTabChannelName('signal-monitor'))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_signal_status',
      }, () => fetchSignals())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const getTimeSince = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
    if (diff < 1) return 'الآن';
    if (diff < 60) return `${Math.round(diff)} دقيقة`;
    return `${Math.round(diff / 60)} ساعة`;
  };

  const onlineCount = signals.filter(s => s.is_online).length;
  const offlineCount = signals.filter(s => !s.is_online).length;

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wifi className="h-5 w-5 text-primary" />
          مراقبة إشارة السائقين
          <div className="flex gap-2 mr-auto">
            <Badge variant="default" className="bg-emerald-500">{onlineCount} متصل</Badge>
            {offlineCount > 0 && (
              <Badge variant="destructive">{offlineCount} غير متصل</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            لا يوجد سائقين يتم تتبعهم حالياً
          </p>
        ) : (
          <div className="space-y-2">
            {signals.map(signal => {
              const driverName = (signal as any).drivers?.full_name || 'سائق غير معروف';
              return (
                <div
                  key={signal.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    signal.is_online
                      ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'
                      : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {signal.is_online ? (
                      <Wifi className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{driverName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        آخر اتصال: {getTimeSince(signal.last_seen_at)}
                        {signal.battery_level != null && (
                          <span>🔋 {signal.battery_level}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {signal.last_latitude && (
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Badge variant={signal.is_online ? 'default' : 'destructive'} className="text-xs">
                      {signal.is_online ? 'متصل' : 'منقطع'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalMonitorWidget;
