import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Cpu, Thermometer, Weight, Droplets, AlertTriangle, Plus, Activity, Signal, BatteryMedium, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import BackButton from '@/components/ui/back-button';

const deviceTypeIcons: Record<string, React.ElementType> = {
  weight_sensor: Weight,
  temperature_sensor: Thermometer,
  humidity_sensor: Droplets,
  multi_sensor: Cpu,
};

const deviceTypeLabels: Record<string, string> = {
  weight_sensor: 'حساس وزن',
  temperature_sensor: 'حساس حرارة',
  humidity_sensor: 'حساس رطوبة',
  multi_sensor: 'حساس متعدد',
};

const IoTDashboard: React.FC = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_name: '', device_type: 'weight_sensor', device_serial: '', protocol: 'mqtt', location_name: '' });

  const { data: devices } = useQuery({
    queryKey: ['iot-devices', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: recentReadings } = useQuery({
    queryKey: ['iot-readings', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('iot_readings')
        .select('*, iot_devices(device_name, device_type)')
        .eq('organization_id', organization!.id)
        .order('recorded_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!organization,
  });

  const { data: alerts } = useQuery({
    queryKey: ['iot-alerts', organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('iot_alerts')
        .select('*, iot_devices(device_name)')
        .eq('organization_id', organization!.id)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organization,
  });

  const addDeviceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('iot_devices').insert({
        ...newDevice,
        organization_id: organization!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iot-devices'] });
      setShowAddDevice(false);
      setNewDevice({ device_name: '', device_type: 'weight_sensor', device_serial: '', protocol: 'mqtt', location_name: '' });
      toast.success('تم إضافة الجهاز بنجاح');
    },
    onError: () => toast.error('فشل في إضافة الجهاز'),
  });

  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      await supabase.from('iot_alerts').update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', alertId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['iot-alerts'] }),
  });

  const activeDevices = devices?.filter(d => d.is_active).length || 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Cpu className="w-7 h-7 text-primary" />
              أجهزة الاستشعار IoT
            </h1>
            <p className="text-muted-foreground">مراقبة الحساسات والأجهزة المتصلة</p>
          </div>
        </div>
        <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إضافة جهاز</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة جهاز استشعار جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div><Label>اسم الجهاز</Label><Input value={newDevice.device_name} onChange={e => setNewDevice(p => ({ ...p, device_name: e.target.value }))} placeholder="حساس الوزن - الميزان 1" /></div>
              <div><Label>نوع الجهاز</Label>
                <Select value={newDevice.device_type} onValueChange={v => setNewDevice(p => ({ ...p, device_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(deviceTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الرقم التسلسلي</Label><Input value={newDevice.device_serial} onChange={e => setNewDevice(p => ({ ...p, device_serial: e.target.value }))} /></div>
              <div><Label>البروتوكول</Label>
                <Select value={newDevice.protocol} onValueChange={v => setNewDevice(p => ({ ...p, protocol: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="http">HTTP API</SelectItem>
                    <SelectItem value="modbus">Modbus</SelectItem>
                    <SelectItem value="lorawan">LoRaWAN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الموقع</Label><Input value={newDevice.location_name} onChange={e => setNewDevice(p => ({ ...p, location_name: e.target.value }))} placeholder="المستودع الرئيسي" /></div>
              <Button onClick={() => addDeviceMutation.mutate()} disabled={!newDevice.device_name || addDeviceMutation.isPending} className="w-full">
                {addDeviceMutation.isPending ? 'جاري الإضافة...' : 'إضافة الجهاز'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Cpu, label: 'إجمالي الأجهزة', value: devices?.length || 0, color: 'text-blue-500' },
          { icon: Wifi, label: 'أجهزة نشطة', value: activeDevices, color: 'text-green-500' },
          { icon: Activity, label: 'قراءات اليوم', value: recentReadings?.length || 0, color: 'text-purple-500' },
          { icon: AlertTriangle, label: 'تنبيهات معلقة', value: alerts?.length || 0, color: 'text-red-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices" className="gap-2"><Cpu className="w-4 h-4" />الأجهزة</TabsTrigger>
          <TabsTrigger value="readings" className="gap-2"><Activity className="w-4 h-4" />القراءات</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2"><AlertTriangle className="w-4 h-4" />التنبيهات</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices?.map((device, i) => {
              const Icon = deviceTypeIcons[device.device_type] || Cpu;
              return (
                <motion.div key={device.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{device.device_name}</h3>
                            <p className="text-xs text-muted-foreground">{deviceTypeLabels[device.device_type]}</p>
                          </div>
                        </div>
                        <Badge variant={device.is_active ? 'default' : 'secondary'}>
                          {device.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        {device.device_serial && <div className="flex justify-between"><span>الرقم التسلسلي:</span><span className="font-mono">{device.device_serial}</span></div>}
                        {device.location_name && <div className="flex justify-between"><span>الموقع:</span><span>{device.location_name}</span></div>}
                        <div className="flex justify-between"><span>البروتوكول:</span><span className="uppercase">{device.protocol}</span></div>
                        {device.battery_level != null && (
                          <div className="flex justify-between items-center">
                            <span>البطارية:</span>
                            <div className="flex items-center gap-1">
                              <BatteryMedium className="w-3 h-3" />
                              <span>{device.battery_level}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {(!devices || devices.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Signal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد أجهزة مسجلة</p>
                <p className="text-sm">اضغط "إضافة جهاز" للبدء</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="readings">
          <Card>
            <CardContent className="p-4">
              {recentReadings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد قراءات حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReadings?.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          {r.reading_type === 'weight' ? <Weight className="w-4 h-4 text-primary" /> :
                           r.reading_type === 'temperature' ? <Thermometer className="w-4 h-4 text-red-500" /> :
                           <Droplets className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{(r as any).iot_devices?.device_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.recorded_at).toLocaleString('ar-EG')}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-bold">{r.value}</span>
                        <span className="text-xs text-muted-foreground mr-1">{r.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-4">
              {alerts?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد تنبيهات معلقة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts?.map(alert => (
                    <div key={alert.id} className={`flex items-start justify-between p-3 rounded-lg border ${alert.severity === 'critical' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'}`} />
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">{(alert as any).iot_devices?.device_name} • {new Date(alert.created_at).toLocaleString('ar-EG')}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAlert.mutate(alert.id)}>تأكيد</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IoTDashboard;
