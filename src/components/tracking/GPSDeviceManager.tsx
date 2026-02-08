import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Radio, Wifi, WifiOff, Trash2, Settings, Battery, Signal, RefreshCw, Link } from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { GPSDevice, GPSDeviceType } from '@/types/gpsTracking';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface GPSDeviceManagerProps {
  onSelectDevice?: (device: GPSDevice) => void;
  selectedDeviceId?: string;
}

const GPSDeviceManager: React.FC<GPSDeviceManagerProps> = ({
  onSelectDevice,
  selectedDeviceId,
}) => {
  const {
    devices,
    deviceTypes,
    isLoading,
    addDevice,
    updateDevice,
    deleteDevice,
    testConnection,
    refreshDevices,
  } = useGPSDevices();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_serial: '',
    device_type: '',
    protocol: 'http',
    api_endpoint: '',
    api_key: '',
  });

  const handleAddDevice = async () => {
    if (!newDevice.device_name || !newDevice.device_serial || !newDevice.device_type) {
      return;
    }

    const selectedType = deviceTypes.find(t => t.name === newDevice.device_type);
    
    await addDevice({
      device_name: newDevice.device_name,
      device_serial: newDevice.device_serial,
      device_type: newDevice.device_type,
      protocol: selectedType?.protocol || 'http',
      api_endpoint: newDevice.api_endpoint || null,
      api_key: newDevice.api_key || null,
      connection_config: {},
    });

    setNewDevice({
      device_name: '',
      device_serial: '',
      device_type: '',
      protocol: 'http',
      api_endpoint: '',
      api_key: '',
    });
    setIsAddDialogOpen(false);
  };

  const getStatusBadge = (device: GPSDevice) => {
    if (!device.last_ping_at) {
      return <Badge variant="secondary">غير متصل</Badge>;
    }

    const lastPing = new Date(device.last_ping_at);
    const minutesAgo = (Date.now() - lastPing.getTime()) / 60000;

    if (minutesAgo < 5) {
      return <Badge className="bg-primary text-primary-foreground">نشط</Badge>;
    } else if (minutesAgo < 30) {
      return <Badge variant="outline">خامل</Badge>;
    }
    return <Badge variant="destructive">غير متصل</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              أجهزة GPS
            </CardTitle>
            <CardDescription>
              إدارة أجهزة تتبع GPS المربوطة بالسيارات
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshDevices}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة جهاز
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة جهاز GPS جديد</DialogTitle>
                  <DialogDescription>
                    أدخل بيانات جهاز التتبع لربطه بالنظام
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="device_name">اسم الجهاز</Label>
                    <Input
                      id="device_name"
                      placeholder="مثال: جهاز الشاحنة رقم 1"
                      value={newDevice.device_name}
                      onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device_serial">الرقم التسلسلي / IMEI</Label>
                    <Input
                      id="device_serial"
                      placeholder="مثال: 123456789012345"
                      value={newDevice.device_serial}
                      onChange={(e) => setNewDevice({ ...newDevice, device_serial: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device_type">نوع الجهاز</Label>
                    <Select
                      value={newDevice.device_type}
                      onValueChange={(value) => setNewDevice({ ...newDevice, device_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الجهاز" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map((type) => (
                          <SelectItem key={type.name} value={type.name}>
                            <div className="flex items-center gap-2">
                              <span>{type.manufacturer}</span>
                              <span className="text-muted-foreground">({type.protocol})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newDevice.device_type && deviceTypes.find(t => t.name === newDevice.device_type)?.protocol === 'http' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="api_endpoint">رابط API (اختياري)</Label>
                        <Input
                          id="api_endpoint"
                          placeholder="https://api.example.com/device"
                          value={newDevice.api_endpoint}
                          onChange={(e) => setNewDevice({ ...newDevice, api_endpoint: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_key">مفتاح API (اختياري)</Label>
                        <Input
                          id="api_key"
                          type="password"
                          placeholder="••••••••"
                          value={newDevice.api_key}
                          onChange={(e) => setNewDevice({ ...newDevice, api_key: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAddDevice}>
                    إضافة الجهاز
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد أجهزة GPS مسجلة</p>
            <p className="text-sm">أضف جهاز GPS لبدء التتبع المتقدم</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الجهاز</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>آخر اتصال</TableHead>
                  <TableHead>البطارية</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow
                    key={device.id}
                    className={selectedDeviceId === device.id ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{device.device_name}</p>
                        <p className="text-xs text-muted-foreground">{device.device_serial}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{device.device_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(device)}</TableCell>
                    <TableCell>
                      {device.last_ping_at ? (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(device.last_ping_at), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.battery_level !== null ? (
                        <div className="flex items-center gap-1">
                          <Battery className="w-4 h-4" />
                          <span>{device.battery_level}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onSelectDevice && (
                          <Button
                            variant={selectedDeviceId === device.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onSelectDevice(device)}
                          >
                            <Link className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testConnection(device.id)}
                        >
                          <Wifi className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDevice(device.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default GPSDeviceManager;
