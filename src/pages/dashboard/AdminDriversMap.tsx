import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Search,
  Loader2,
  Truck,
  User,
  Phone,
  Clock,
  Navigation,
  RefreshCcw,
  Circle,
  Satellite,
  History,
  Calendar,
  Building2,
  Filter,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DriverTrackingMap from '@/components/maps/DriverTrackingMap';
import DriverLocationHistory from '@/components/maps/DriverLocationHistory';
import BackButton from '@/components/ui/back-button';

interface DriverProfile {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

interface DriverOrganization {
  name: string;
}

interface AdminDriver {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  organization_id: string | null;
  profile: DriverProfile | null;
  organization: DriverOrganization | null;
  latitude?: number;
  longitude?: number;
  last_update?: string;
}

// Adapter type for DriverTrackingMap compatibility
interface MapDriver {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  profile: DriverProfile | null;
  organization: DriverOrganization | null;
  latitude?: number;
  longitude?: number;
  last_update?: string;
}

const AdminDriversMap = () => {
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  const [historyDriver, setHistoryDriver] = useState<AdminDriver | null>(null);
  const [historyDate, setHistoryDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy'>('all');
  const [filterOrganization, setFilterOrganization] = useState<string>('all');
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
    fetchOrganizations();
    
    // Subscribe to real-time location updates
    const channel = supabase
      .channel('driver-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_location_logs',
        },
        (payload) => {
          const newLocation = payload.new as any;
          setDrivers(prev => prev.map(driver => 
            driver.id === newLocation.driver_id
              ? {
                  ...driver,
                  latitude: newLocation.latitude,
                  longitude: newLocation.longitude,
                  last_update: newLocation.recorded_at,
                }
              : driver
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('organization_type', 'transporter')
        .eq('is_verified', true);

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      // Fetch drivers with their latest locations
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          is_available,
          organization_id,
          profile:profiles!drivers_profile_id_fkey(full_name, phone, avatar_url),
          organization:organizations!drivers_organization_id_fkey(name)
        `);

      if (driversError) throw driversError;

      // Fetch latest location for each driver
      const driversWithLocations = await Promise.all(
        (driversData || []).map(async (driver) => {
          const { data: locationData } = await supabase
            .from('driver_location_logs')
            .select('latitude, longitude, recorded_at')
            .eq('driver_id', driver.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...driver,
            latitude: locationData?.latitude || undefined,
            longitude: locationData?.longitude || undefined,
            last_update: locationData?.recorded_at || undefined,
          };
        })
      );

      setDrivers(driversWithLocations);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات السائقين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'available' && d.is_available) ||
      (filterStatus === 'busy' && !d.is_available);

    const matchesOrg = 
      filterOrganization === 'all' || 
      d.organization_id === filterOrganization;

    return matchesSearch && matchesStatus && matchesOrg;
  });

  const driversWithLocation = filteredDrivers.filter(d => d.latitude && d.longitude);
  const activeDrivers = drivers.filter(d => d.is_available).length;
  const trackingDrivers = drivers.filter(d => d.latitude && d.longitude).length;

  const getVehicleTypeLabel = (type: string | null) => {
    const labels: Record<string, string> = {
      truck: 'شاحنة',
      van: 'فان',
      pickup: 'بيك أب',
    };
    return type ? labels[type] || type : 'غير محدد';
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between">
          <Button onClick={fetchDrivers} variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            تحديث
          </Button>
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-2 justify-end">
              <MapPin className="w-8 h-8 text-primary" />
              خريطة جميع السائقين
            </h1>
            <p className="text-muted-foreground">مراقبة مواقع السائقين في الوقت الفعلي</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي السائقين</p>
                  <p className="text-3xl font-bold">{drivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">متاحون</p>
                  <p className="text-3xl font-bold text-green-600">{activeDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">في مهمة</p>
                  <p className="text-3xl font-bold text-amber-600">{drivers.length - activeDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Satellite className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيد التتبع</p>
                  <p className="text-3xl font-bold text-blue-600">{trackingDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center justify-end">
              <div className="flex items-center gap-2">
                <Select value={filterOrganization} onValueChange={setFilterOrganization}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="كل الشركات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الشركات</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Building2 className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="available">متاح</SelectItem>
                    <SelectItem value="busy">في مهمة</SelectItem>
                  </SelectContent>
                </Select>
                <Filter className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو رقم اللوحة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-right">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  تحديث مباشر
                </Badge>
                <div>
                  <CardTitle>خريطة السائقين</CardTitle>
                  <CardDescription>{driversWithLocation.length} سائق على الخريطة</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[500px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <DriverTrackingMap
                  drivers={driversWithLocation as MapDriver[]}
                  selectedDriver={selectedDriver as MapDriver | null}
                  onSelectDriver={(driver) => setSelectedDriver(driver as unknown as AdminDriver)}
                  center={{ lat: 30.0444, lng: 31.2357 }}
                />
              )}
            </CardContent>
          </Card>

          {/* Driver List */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle>قائمة السائقين ({filteredDrivers.length})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[550px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا يوجد سائقون</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDrivers.map((driver) => (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedDriver?.id === driver.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <Badge variant={driver.is_available ? 'default' : 'secondary'} className="text-xs">
                              <Circle className={`w-2 h-2 ml-1 ${
                                driver.is_available ? 'fill-green-400' : 'fill-amber-400'
                              }`} />
                              {driver.is_available ? 'متاح' : 'في مهمة'}
                            </Badge>
                            {driver.latitude && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Navigation className="w-2 h-2" />
                                متصل
                              </Badge>
                            )}
                            <span className="font-medium text-sm">{driver.profile?.full_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {driver.organization?.name || 'غير مسجل'}
                          </p>
                          <div className="flex items-center gap-3 justify-end text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              {driver.vehicle_plate || '-'}
                            </span>
                            <span>{getVehicleTypeLabel(driver.vehicle_type)}</span>
                          </div>
                          {driver.last_update && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {new Date(driver.last_update).toLocaleTimeString('en-US')}
                            </p>
                          )}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {driver.profile?.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Driver Details */}
        {selectedDriver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-right">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setHistoryDriver(selectedDriver)}
                  >
                    <History className="w-4 h-4" />
                    سجل المواقع
                  </Button>
                  <CardTitle>تفاصيل السائق</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-4 justify-end">
                    <div className="text-right">
                      <p className="font-medium text-lg">{selectedDriver.profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedDriver.organization?.name || 'غير مسجل'}</p>
                    </div>
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedDriver.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xl">
                        {selectedDriver.profile?.full_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="space-y-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span>{selectedDriver.license_number}</span>
                      <Badge variant="outline">رقم الرخصة</Badge>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span>{selectedDriver.vehicle_plate || '-'}</span>
                      <Badge variant="outline">لوحة المركبة</Badge>
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span dir="ltr">{selectedDriver.profile?.phone || '-'}</span>
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span>{getVehicleTypeLabel(selectedDriver.vehicle_type)}</span>
                      <Truck className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-3 text-right">
                    {selectedDriver.latitude && selectedDriver.longitude ? (
                      <>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-mono text-sm">
                            {selectedDriver.latitude.toFixed(4)}, {selectedDriver.longitude.toFixed(4)}
                          </span>
                          <MapPin className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm">
                            {selectedDriver.last_update && new Date(selectedDriver.last_update).toLocaleTimeString('ar-SA')}
                          </span>
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 justify-end text-muted-foreground">
                        <span>لا يوجد موقع مسجل</span>
                        <MapPin className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Location History Dialog */}
        <Dialog open={!!historyDriver} onOpenChange={(open) => !open && setHistoryDriver(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-right">
              <DialogTitle className="flex items-center gap-2 justify-end">
                <span>سجل مواقع السائق</span>
                <History className="w-5 h-5" />
              </DialogTitle>
            </DialogHeader>
            {historyDriver && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 justify-end">
                  <Input
                    type="date"
                    value={historyDate.toISOString().split('T')[0]}
                    onChange={(e) => setHistoryDate(new Date(e.target.value))}
                    className="w-auto"
                  />
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">اختر التاريخ:</span>
                </div>
                <DriverLocationHistory
                  driverId={historyDriver.id}
                  driverName={historyDriver.profile?.full_name || 'السائق'}
                  date={historyDate}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDriversMap;
