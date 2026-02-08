import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Car, Radio, Link, Unlink, CheckCircle, AlertCircle, 
  Loader2, Search, RefreshCw, User, MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { toast } from 'sonner';

interface DriverWithDevice {
  id: string;
  license_number: string;
  vehicle_plate: string | null;
  vehicle_type: string | null;
  is_available: boolean;
  profile_id: string;
  gps_device_id?: string | null;
  gps_device_name?: string | null;
  gps_device_serial?: string | null;
}

const GPSVehicleBinding: React.FC = () => {
  const { devices, linkToDriver, refreshDevices } = useGPSDevices();
  const [drivers, setDrivers] = useState<DriverWithDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithDevice | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Build driver list with GPS binding info from devices
  useEffect(() => {
    // Get drivers from devices that have driver_id set, plus create entries for unbound devices
    const driversFromDevices: DriverWithDevice[] = [];
    
    // Create driver entries from GPS devices
    devices.forEach(device => {
      if (device.driver_id) {
        // Check if we already have this driver
        const existingDriver = driversFromDevices.find(d => d.id === device.driver_id);
        if (!existingDriver) {
          driversFromDevices.push({
            id: device.driver_id,
            license_number: 'N/A',
            vehicle_plate: null,
            vehicle_type: null,
            is_available: true,
            profile_id: device.driver_id,
            gps_device_id: device.id,
            gps_device_name: device.device_name,
            gps_device_serial: device.device_serial,
          });
        }
      }
    });

    setDrivers(driversFromDevices);
    setIsLoading(false);
  }, [devices]);

  const handleBindDevice = async () => {
    if (!selectedDriver || !selectedDeviceId) return;

    setIsSaving(true);

    const success = await linkToDriver(selectedDeviceId, selectedDriver.id);

    if (success) {
      toast.success('تم ربط جهاز GPS بنجاح');
      setBindingDialogOpen(false);
      setSelectedDriver(null);
      setSelectedDeviceId('');
      refreshDevices();
    }

    setIsSaving(false);
  };

  const handleUnbindDevice = async (deviceId: string) => {
    const success = await linkToDriver(deviceId, null);
    if (success) {
      toast.success('تم فك ربط الجهاز');
      refreshDevices();
    }
  };

  const availableDevices = devices.filter(d => !d.driver_id);
  const boundDevices = devices.filter(d => d.driver_id);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأجهزة</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مرتبط</p>
                <p className="text-2xl font-bold text-primary">{boundDevices.length}</p>
              </div>
              <Link className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">غير مرتبط</p>
                <p className="text-2xl font-bold text-amber-500">{availableDevices.length}</p>
              </div>
              <Unlink className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">نسبة الربط</p>
                <p className="text-2xl font-bold">
                  {devices.length > 0 ? Math.round((boundDevices.length / devices.length) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radio className="w-5 h-5" />
                ربط أجهزة GPS بالسائقين
              </CardTitle>
              <CardDescription>
                قم بربط أجهزة GPS بالسائقين لتفعيل التتبع المباشر
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refreshDevices}>
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم الجهاز أو الرقم التسلسلي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>لا توجد أجهزة GPS</AlertTitle>
              <AlertDescription>
                لم يتم تسجيل أي أجهزة GPS. قم بإضافة أجهزة من تبويب "تسجيل جهاز".
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الجهاز</TableHead>
                    <TableHead>الرقم التسلسلي</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>السائق المرتبط</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices
                    .filter(device => 
                      device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      device.device_serial.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Radio className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{device.device_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {device.protocol.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{device.device_serial}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{device.device_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {device.last_ping_at ? (
                          <Badge className="bg-primary text-primary-foreground">
                            <MapPin className="w-3 h-3 ml-1" />
                            متصل
                          </Badge>
                        ) : (
                          <Badge variant="secondary">غير متصل</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {device.driver_id ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="text-sm">مرتبط بسائق</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">غير مرتبط</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {device.driver_id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnbindDevice(device.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="w-4 h-4 ml-1" />
                            فك الربط
                          </Button>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Link className="w-4 h-4 ml-1" />
                                ربط بسائق
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>ربط جهاز GPS بسائق</DialogTitle>
                                <DialogDescription>
                                  أدخل معرف السائق لربط الجهاز به
                                </DialogDescription>
                              </DialogHeader>

                              <div className="py-4 space-y-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-3">
                                    <Radio className="w-8 h-8 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium">{device.device_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {device.device_serial}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <Alert>
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>ملاحظة</AlertTitle>
                                  <AlertDescription>
                                    يمكنك ربط الجهاز بالسائق مباشرة عند إنشاء الشحنة من خلال إعدادات التتبع.
                                  </AlertDescription>
                                </Alert>
                              </div>

                              <DialogFooter>
                                <Button variant="outline">
                                  إغلاق
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Available Devices for Quick Binding */}
      {availableDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="w-5 h-5" />
              أجهزة جاهزة للربط
            </CardTitle>
            <CardDescription>
              الأجهزة التالية غير مرتبطة ويمكن ربطها بسائقين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {availableDevices.map((device) => (
                <div 
                  key={device.id}
                  className="p-4 rounded-lg border border-dashed flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Radio className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{device.device_name}</p>
                    <p className="text-xs text-muted-foreground">{device.device_serial}</p>
                    <Badge variant="outline" className="mt-1">{device.device_type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPSVehicleBinding;
