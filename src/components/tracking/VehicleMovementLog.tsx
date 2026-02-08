import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  History, Car, MapPin, Clock, Search, Filter, 
  Download, Calendar as CalendarIcon, Navigation,
  Gauge, Battery, Signal, Route, ArrowUpDown
} from 'lucide-react';
import { useGPSDevices } from '@/hooks/useGPSDevices';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MovementLogEntry {
  id: string;
  device_id: string;
  device_name: string;
  device_serial: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  battery_level: number | null;
  signal_strength: number | null;
  recorded_at: string;
  event_type: string;
}

interface VehicleMovementLogProps {
  trigger?: React.ReactNode;
}

const VehicleMovementLog: React.FC<VehicleMovementLogProps> = ({ trigger }) => {
  const { profile } = useAuth();
  const { devices } = useGPSDevices();
  const [logs, setLogs] = useState<MovementLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch movement logs
  const fetchLogs = async () => {
    if (!profile?.organization_id) return;

    setIsLoading(true);

    try {
      let query = supabase
        .from('gps_location_logs')
        .select('*')
        .gte('recorded_at', dateRange.from.toISOString())
        .lte('recorded_at', dateRange.to.toISOString())
        .order('recorded_at', { ascending: sortOrder === 'asc' })
        .limit(500);

      if (selectedDeviceId !== 'all') {
        query = query.eq('device_id', selectedDeviceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        setIsLoading(false);
        return;
      }

      // Map device info to logs
      const logsWithDeviceInfo: MovementLogEntry[] = (data || []).map((log: any) => {
        const device = devices.find(d => d.id === log.device_id);
        return {
          id: log.id,
          device_id: log.device_id,
          latitude: log.latitude,
          longitude: log.longitude,
          speed: log.speed || null,
          heading: log.heading || null,
          altitude: log.altitude || null,
          battery_level: log.battery_level || null,
          signal_strength: log.signal_strength || null,
          recorded_at: log.recorded_at,
          event_type: log.event_type || 'update',
          device_name: device?.device_name || 'جهاز غير معروف',
          device_serial: device?.device_serial || 'N/A',
        };
      });

      setLogs(logsWithDeviceInfo);
    } catch (err) {
      console.error('Error:', err);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (devices.length > 0) {
      fetchLogs();
    }
  }, [devices, selectedDeviceId, dateRange, sortOrder]);

  const filteredLogs = logs.filter(log =>
    log.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.device_serial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'start':
        return <Badge className="bg-primary">بداية رحلة</Badge>;
      case 'stop':
        return <Badge variant="secondary">توقف</Badge>;
      case 'idle':
        return <Badge variant="outline">خمول</Badge>;
      case 'speeding':
        return <Badge variant="destructive">سرعة زائدة</Badge>;
      case 'geofence_enter':
        return <Badge className="bg-primary">دخول منطقة</Badge>;
      case 'geofence_exit':
        return <Badge variant="outline">خروج من منطقة</Badge>;
      default:
        return <Badge variant="outline">تحديث موقع</Badge>;
    }
  };

  const calculateStats = () => {
    if (logs.length === 0) return { totalDistance: 0, avgSpeed: 0, totalTime: 0 };

    const speeds = logs.filter(l => l.speed !== null).map(l => l.speed as number);
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    // Calculate total distance using Haversine formula
    let totalDistance = 0;
    for (let i = 1; i < logs.length; i++) {
      const lat1 = logs[i - 1].latitude;
      const lon1 = logs[i - 1].longitude;
      const lat2 = logs[i].latitude;
      const lon2 = logs[i].longitude;

      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    return { totalDistance, avgSpeed, totalTime: logs.length };
  };

  const stats = calculateStats();

  const exportToCSV = () => {
    const headers = ['التاريخ', 'الوقت', 'الجهاز', 'خط العرض', 'خط الطول', 'السرعة', 'الاتجاه', 'نوع الحدث'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.recorded_at), 'yyyy-MM-dd'),
      format(new Date(log.recorded_at), 'HH:mm:ss'),
      log.device_name,
      log.latitude.toFixed(6),
      log.longitude.toFixed(6),
      log.speed?.toString() || '0',
      log.heading?.toString() || '0',
      log.event_type,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-movements-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="lg" className="gap-2">
            <History className="w-5 h-5" />
            سجل تحركات المركبات
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <History className="w-6 h-6 text-primary" />
            سجل تحركات المركبات
          </DialogTitle>
          <DialogDescription>
            عرض سجل كامل لجميع تحركات المركبات ومواقعها وبياناتها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Route className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">المسافة الإجمالية</p>
                    <p className="text-xl font-bold">{stats.totalDistance.toFixed(1)} كم</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Gauge className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">متوسط السرعة</p>
                    <p className="text-xl font-bold">{stats.avgSpeed.toFixed(0)} كم/س</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">نقاط التتبع</p>
                    <p className="text-xl font-bold">{logs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Car className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">الأجهزة النشطة</p>
                    <p className="text-xl font-bold">{new Set(logs.map(l => l.device_id)).size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع الأجهزة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.device_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateRange.from, 'dd/MM')} - {format(dateRange.to, 'dd/MM')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>

            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير CSV
            </Button>
          </div>

          {/* Logs Table */}
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوقت</TableHead>
                      <TableHead>الجهاز</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>السرعة</TableHead>
                      <TableHead>الاتجاه</TableHead>
                      <TableHead>البطارية</TableHead>
                      <TableHead>الحدث</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            جاري التحميل...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          لا توجد سجلات في هذه الفترة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {format(new Date(log.recorded_at), 'HH:mm:ss')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.recorded_at), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{log.device_name}</p>
                                <p className="text-xs text-muted-foreground">{log.device_serial}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-mono">
                                {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-muted-foreground" />
                              <span>{log.speed || 0} كم/س</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-muted-foreground" />
                              <span>{log.heading || 0}°</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.battery_level !== null && (
                              <div className="flex items-center gap-1">
                                <Battery className={cn(
                                  'w-3 h-3',
                                  log.battery_level < 20 ? 'text-destructive' : 'text-muted-foreground'
                                )} />
                                <span>{log.battery_level}%</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {getEventBadge(log.event_type)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleMovementLog;
