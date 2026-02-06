import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { wasteTypeLabels as wasteTypeLabelsImported } from '@/lib/wasteClassification';
import {
  User,
  Phone,
  Mail,
  Truck,
  Calendar,
  MapPin,
  Package,
  ArrowRight,
  CheckCircle2,
  Clock,
  Navigation,
  Loader2,
} from 'lucide-react';

interface DriverDetails {
  id: string;
  license_number: string;
  license_expiry: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  generator: { name: string } | null;
  recycler: { name: string } | null;
}

interface ShipmentLog {
  id: string;
  status: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

const DriverDetailsPage = () => {
  const { driverId } = useParams();
  const { user, organization, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [driver, setDriver] = useState<DriverDetails | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentLogs, setShipmentLogs] = useState<ShipmentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (driverId && organization?.id) {
      fetchDriverDetails();
    }
  }, [driverId, organization?.id]);

  const fetchDriverDetails = async () => {
    try {
      // Fetch driver
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          license_expiry,
          vehicle_type,
          vehicle_plate,
          is_available,
          created_at,
          profile:profiles!drivers_profile_id_fkey(
            id,
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('id', driverId)
        .eq('organization_id', organization?.id)
        .single();

      if (driverError) throw driverError;

      setDriver({
        ...driverData,
        profile: driverData.profile as DriverDetails['profile'],
      });

      // Fetch driver's shipments
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          status,
          pickup_address,
          delivery_address,
          created_at,
          generator:organizations!shipments_generator_id_fkey(name),
          recycler:organizations!shipments_recycler_id_fkey(name)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;

      setShipments(shipmentsData as unknown as Shipment[]);

      if (shipmentsData && shipmentsData.length > 0) {
        setSelectedShipment(shipmentsData[0] as unknown as Shipment);
        fetchShipmentLogs(shipmentsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching driver details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipmentLogs = async (shipmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('shipment_logs')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setShipmentLogs(data || []);
    } catch (error) {
      console.error('Error fetching shipment logs:', error);
    }
  };

  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    fetchShipmentLogs(shipment.id);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
      new: { label: 'جديدة', variant: 'default', color: 'bg-blue-500' },
      approved: { label: 'معتمدة', variant: 'secondary', color: 'bg-indigo-500' },
      in_transit: { label: 'في الطريق', variant: 'outline', color: 'bg-purple-500' },
      delivered: { label: 'تم التسليم', variant: 'secondary', color: 'bg-emerald-500' },
      confirmed: { label: 'مؤكدة', variant: 'default', color: 'bg-green-600' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const, color: 'bg-gray-500' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      approved: 'bg-indigo-500',
      in_transit: 'bg-purple-500',
      delivered: 'bg-emerald-500',
      confirmed: 'bg-green-600',
    };
    return colors[status] || 'bg-muted';
  };

  const getWasteTypeLabel = (type: string) => {
    return wasteTypeLabelsImported[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      new: 'تم إنشاء الشحنة',
      approved: 'تمت الموافقة',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      confirmed: 'تم التأكيد',
    };
    return statusLabels[status] || status;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">السائق غير موجود</h2>
              <p className="text-muted-foreground mb-4">
                لم يتم العثور على بيانات هذا السائق
              </p>
              <Button onClick={() => navigate('/dashboard/drivers')}>
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة للسائقين
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/drivers')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{driver.profile.full_name}</h1>
            <p className="text-muted-foreground">تفاصيل السائق وتتبع الرحلات</p>
          </div>
        </div>

        {/* Driver info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {driver.profile.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{driver.profile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{driver.license_number}</p>
                  <Badge
                    variant={driver.is_available ? 'default' : 'secondary'}
                    className="mt-1"
                  >
                    {driver.is_available ? 'متاح' : 'غير متاح'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span dir="ltr">{driver.profile.phone || 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="truncate" dir="ltr">{driver.profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  انضم في {new Date(driver.created_at).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <span>{driver.vehicle_type || 'نوع غير محدد'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>{driver.vehicle_plate || 'لوحة غير محددة'}</span>
              </div>
              {driver.license_expiry && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>
                    انتهاء الرخصة:{' '}
                    {new Date(driver.license_expiry).toLocaleDateString('ar-EG')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Shipments and tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipments list */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                الشحنات ({shipments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {shipments.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  لا توجد شحنات لهذا السائق
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {shipments.map((shipment) => (
                    <motion.div
                      key={shipment.id}
                      whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                      onClick={() => handleSelectShipment(shipment)}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        selectedShipment?.id === shipment.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {shipment.shipment_number}
                        </span>
                        {getStatusBadge(shipment.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getWasteTypeLabel(shipment.waste_type)} - {shipment.quantity} كجم
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(shipment.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipment details and tracking */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                تتبع الرحلة
              </CardTitle>
              {selectedShipment && (
                <CardDescription>
                  {selectedShipment.shipment_number} - {getWasteTypeLabel(selectedShipment.waste_type)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedShipment ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>اختر شحنة لعرض تفاصيل الرحلة</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Route info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        نقطة الاستلام
                      </div>
                      <p className="font-medium">{selectedShipment.generator?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedShipment.pickup_address}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        نقطة التسليم
                      </div>
                      <p className="font-medium">{selectedShipment.recycler?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedShipment.delivery_address}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      مسار الرحلة
                    </h4>
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute right-[11px] top-0 bottom-0 w-0.5 bg-border" />

                      <div className="space-y-4">
                        {shipmentLogs.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>لا توجد تحديثات للرحلة بعد</p>
                          </div>
                        ) : (
                          shipmentLogs.map((log, index) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex gap-4 relative"
                            >
                              {/* Dot */}
                              <div
                                className={`w-6 h-6 rounded-full ${getStatusColor(
                                  log.status
                                )} flex items-center justify-center z-10`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 pb-4">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {getStatusLabel(log.status)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString('ar-EG', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}
                                  </span>
                                </div>
                                {log.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {log.notes}
                                  </p>
                                )}
                                {log.latitude && log.longitude && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    <span dir="ltr">
                                      {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriverDetailsPage;
