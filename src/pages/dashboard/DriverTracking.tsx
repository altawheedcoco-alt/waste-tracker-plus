import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useViewerPresence } from '@/hooks/useDriverPresence';
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
  Send,
  Eye,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LeafletMultiDriverMap from '@/components/maps/LeafletMultiDriverMap';
import DriverLocationHistory from '@/components/maps/LeafletDriverHistory';
import BackButton from '@/components/ui/back-button';
import SendDriverNotificationDialog from '@/components/drivers/SendDriverNotificationDialog';

// Component to announce viewer presence when viewing a specific driver
const ViewerPresenceAnnouncer = ({ 
  driverId, 
  viewerName, 
  organizationName 
}: { 
  driverId: string; 
  viewerName: string; 
  organizationName?: string;
}) => {
  // This hook announces presence when mounted
  useViewerPresence(driverId, viewerName, organizationName);
  return null; // Invisible component
};

interface Driver {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  profile: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    user_id?: string;
  } | null;
  organization: {
    name: string;
  } | null;
  // Simulated location data
  latitude?: number;
  longitude?: number;
  last_update?: string;
}

const DriverTracking = () => {
  const { profile, organization } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [historyDriver, setHistoryDriver] = useState<Driver | null>(null);
  const [historyDate, setHistoryDate] = useState<Date>(new Date());
  const [notificationDriver, setNotificationDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
    // Real-time subscription for location updates
    const channel = supabase
      .channel(getTabChannelName('driver-locations-realtime'))
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

  const fetchDrivers = async () => {
    try {
      // Fetch drivers with their organization and user_id for notifications
      const { data: driversData, error } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          is_available,
          profile:profiles!drivers_profile_id_fkey(full_name, phone, avatar_url, user_id),
          organization:organizations!drivers_organization_id_fkey(name)
        `);

      if (error) throw error;

      // Fetch latest location for each driver
      const driverIds = (driversData || []).map(d => d.id);
      const locationsMap = new Map<string, { latitude: number; longitude: number; recorded_at: string }>();
      
      if (driverIds.length > 0) {
        // Get the latest location for each driver
        for (const driverId of driverIds) {
          const { data: locationData } = await supabase
            .from('driver_location_logs')
            .select('latitude, longitude, recorded_at')
            .eq('driver_id', driverId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (locationData) {
            locationsMap.set(driverId, locationData);
          }
        }
      }

      // Combine drivers with their locations
      const driversWithLocations = (driversData || []).map(driver => {
        const location = locationsMap.get(driver.id);
        return {
          ...driver,
          latitude: location?.latitude || undefined,
          longitude: location?.longitude || undefined,
          last_update: location?.recorded_at || undefined,
        };
      });

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

  const filteredDrivers = drivers.filter(d =>
    d.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.vehicle_plate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count drivers by status
  const activeDrivers = drivers.filter(d => d.is_available && d.latitude).length;
  const busyDrivers = drivers.filter(d => !d.is_available && d.latitude).length;
  const offlineDrivers = drivers.filter(d => !d.latitude).length;
  const driversWithLocation = drivers.filter(d => d.latitude && d.longitude);

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
        className="space-y-4 sm:space-y-6"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Button onClick={fetchDrivers} variant="outline" size="sm" className="gap-1.5 shrink-0">
            <RefreshCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          <div className="text-right min-w-0">
            <h1 className="text-lg sm:text-3xl font-bold truncate">تتبع السائقين</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">خريطة تفاعلية لمواقع السائقين</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">إجمالي السائقين</p>
                  <p className="text-lg sm:text-2xl font-bold">{drivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-3 sm:p-4 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">متاح ونشط</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{activeDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-3 sm:p-4 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">في مهمة</p>
                  <p className="text-lg sm:text-2xl font-bold text-amber-600">{busyDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-muted bg-muted/5">
            <CardContent className="p-3 sm:p-4 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">غير متصل</p>
                  <p className="text-lg sm:text-2xl font-bold text-muted-foreground">{offlineDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader className="text-right p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs shrink-0">
                  <Satellite className="w-3 h-3" />
                  تحديث تلقائي
                </Badge>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base">خريطة المواقع</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">مواقع السائقين في الوقت الفعلي</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <LeafletMultiDriverMap
                drivers={filteredDrivers.map(d => ({
                  id: d.id,
                  name: d.profile?.full_name || d.id,
                  lat: d.latitude || 30.0,
                  lng: d.longitude || 31.2,
                  isOnline: d.is_available,
                  vehiclePlate: d.vehicle_plate || undefined,
                  phone: d.profile?.phone || undefined,
                  currentShipment: null,
                }))}
                onDriverClick={(id) => {
                  const driver = filteredDrivers.find(d => d.id === id);
                  if (driver) setSelectedDriver(driver as any);
                }}
                height="400px"
                autoRefresh
                refreshInterval={30000}
              />
            </CardContent>
          </Card>

          {/* Driver List */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle>قائمة السائقين</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
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
                  {filteredDrivers.map((driver) => {
                    const hasLocation = driver.latitude && driver.longitude;
                    const isOnline = hasLocation && driver.last_update && 
                      (new Date().getTime() - new Date(driver.last_update).getTime()) < 10 * 60 * 1000; // 10 minutes
                    
                    return (
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
                              {/* Connection status badge */}
                              {!hasLocation ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <Circle className="w-2 h-2 ml-1 fill-gray-400" />
                                  غير متصل
                                </Badge>
                              ) : isOnline ? (
                                <Badge variant={driver.is_available ? 'default' : 'secondary'}>
                                  <Circle className={`w-2 h-2 ml-1 ${
                                    driver.is_available ? 'fill-green-400 animate-pulse' : 'fill-amber-400'
                                  }`} />
                                  {driver.is_available ? 'متاح' : 'في مهمة'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-600">
                                  <Circle className="w-2 h-2 ml-1 fill-amber-400" />
                                  غير نشط
                                </Badge>
                              )}
                              <span className="font-medium">{driver.profile?.full_name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {driver.organization?.name}
                            </p>
                            <div className="flex items-center gap-3 justify-end text-xs text-muted-foreground">
                              {driver.last_update && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(driver.last_update).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {driver.vehicle_plate || '-'}
                              </span>
                              <span>{getVehicleTypeLabel(driver.vehicle_type)}</span>
                            </div>
                          </div>
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={driver.profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                {driver.profile?.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Driver Details */}
        {selectedDriver && (
          <>
            {/* Announce presence when viewing this driver */}
            <ViewerPresenceAnnouncer 
              driverId={selectedDriver.id}
              viewerName={profile?.full_name || 'مستخدم'}
              organizationName={organization?.name}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-primary gap-1">
                        <Eye className="w-3 h-3" />
                        جاري المتابعة
                      </Badge>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setHistoryDriver(selectedDriver)}
                      >
                        <History className="w-4 h-4" />
                        سجل المواقع
                      </Button>
                      <Button
                        variant="default"
                        className="gap-2"
                        onClick={() => setNotificationDriver(selectedDriver)}
                      >
                        <Send className="w-4 h-4" />
                        إرسال إشعار
                      </Button>
                    </div>
                    <CardTitle>تفاصيل السائق</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-4 justify-end">
                      <div className="text-right">
                        <p className="font-medium text-lg">{selectedDriver.profile?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedDriver.organization?.name}</p>
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
                      <div className="flex items-center gap-2 justify-end">
                        <span className="font-mono text-sm">
                          {selectedDriver.latitude?.toFixed(4)}, {selectedDriver.longitude?.toFixed(4)}
                        </span>
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm">
                          {selectedDriver.last_update && new Date(selectedDriver.last_update).toLocaleTimeString('en-US')}
                        </span>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
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

        {/* Send Notification Dialog */}
        <SendDriverNotificationDialog
          driver={notificationDriver}
          open={!!notificationDriver}
          onOpenChange={(open) => !open && setNotificationDriver(null)}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default DriverTracking;
