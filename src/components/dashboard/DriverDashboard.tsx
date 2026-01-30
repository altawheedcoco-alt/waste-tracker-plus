import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Truck,
  MapPin,
  Eye,
  Mail,
  Phone,
  Settings,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import CreateShipmentButton from './CreateShipmentButton';
import DriverLocationTracker from './DriverLocationTracker';
import DriverSettingsDialog from './DriverSettingsDialog';

interface DriverInfo {
  id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  is_available: boolean;
  organization: {
    name: string;
    phone: string;
  } | null;
}

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
}

const DriverDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchDriverData();
    }
  }, [profile?.id]);

  const fetchDriverData = async () => {
    try {
      // Fetch driver info
      const { data: driver } = await supabase
        .from('drivers')
        .select(`
          id,
          license_number,
          vehicle_type,
          vehicle_plate,
          is_available,
          organization:organizations(name, phone)
        `)
        .eq('profile_id', profile?.id)
        .single();

      if (driver) {
        setDriverInfo(driver as unknown as DriverInfo);

        // Fetch driver's shipments
        const { data: shipmentsData } = await supabase
          .from('shipments')
          .select(`
            id,
            shipment_number,
            waste_type,
            quantity,
            unit,
            status,
            created_at,
            pickup_address,
            delivery_address
          `)
          .eq('driver_id', driver.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (shipmentsData) {
          setShipments(shipmentsData);
        }
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: 'جديدة', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'معتمدة', className: 'bg-green-100 text-green-800' },
      collecting: { label: 'قيد الجمع', className: 'bg-yellow-100 text-yellow-800' },
      in_transit: { label: 'في الطريق', className: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'تم التسليم', className: 'bg-teal-100 text-teal-800' },
      confirmed: { label: 'مؤكدة', className: 'bg-emerald-100 text-emerald-800' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getWasteTypeLabel = (type: string) => {
    const wasteTypes: Record<string, string> = {
      plastic: 'بلاستيك',
      paper: 'ورق',
      metal: 'معادن',
      glass: 'زجاج',
      electronic: 'إلكترونيات',
      organic: 'عضوية',
      chemical: 'كيميائية',
      medical: 'طبية',
      construction: 'مخلفات بناء',
      other: 'أخرى',
    };
    return wasteTypes[type] || type;
  };

  const activeShipments = shipments.filter(s => ['new', 'approved', 'collecting', 'in_transit'].includes(s.status));
  const completedShipments = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-bold">لوحة تحكم السائق</h1>
          <p className="text-primary">
            مرحباً، {profile?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateShipmentButton 
            variant="eco" 
            onSuccess={fetchDriverData}
          />
          <Button 
            variant="outline" 
            onClick={() => setShowSettingsDialog(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            إعدادات الحساب
          </Button>
        </div>
      </div>

      {/* Location Tracker - Show only if driver has organization */}
      {driverInfo?.id && (
        <DriverLocationTracker driverId={driverInfo.id} autoStart={true} />
      )}

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {profile?.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                  {driverInfo?.organization && (
                    <p className="text-muted-foreground">{driverInfo.organization.name}</p>
                  )}
                </div>
                <Badge variant={driverInfo?.is_available ? 'default' : 'secondary'} className="w-fit">
                  {driverInfo?.is_available ? 'متاح' : 'غير متاح'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span dir="ltr">{profile?.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>رخصة: {driverInfo?.license_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span>{driverInfo?.vehicle_plate || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{shipments.length}</div>
            <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-500">{activeShipments.length}</div>
            <p className="text-sm text-muted-foreground">شحنات نشطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-500">{completedShipments.length}</div>
            <p className="text-sm text-muted-foreground">شحنات مكتملة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-500">{driverInfo?.vehicle_type || '-'}</div>
            <p className="text-sm text-muted-foreground">نوع المركبة</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Tabs */}
      <Tabs defaultValue="active" className="w-full" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            نشطة ({activeShipments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            مكتملة ({completedShipments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="space-y-3">
            {activeShipments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد شحنات نشطة حالياً</p>
                </CardContent>
              </Card>
            ) : (
              activeShipments.map((shipment) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">#{shipment.shipment_number}</span>
                            {getStatusBadge(shipment.status)}
                          </div>
                          <p className="text-sm">
                            {getWasteTypeLabel(shipment.waste_type)} - {shipment.quantity} {shipment.unit || 'طن'}
                          </p>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>من: {shipment.pickup_address}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>إلى: {shipment.delivery_address}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="space-y-3">
            {completedShipments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد شحنات مكتملة</p>
                </CardContent>
              </Card>
            ) : (
              completedShipments.map((shipment) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">#{shipment.shipment_number}</span>
                            {getStatusBadge(shipment.status)}
                          </div>
                          <p className="text-sm">
                            {getWasteTypeLabel(shipment.waste_type)} - {shipment.quantity} {shipment.unit || 'طن'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(shipment.created_at), 'PPP', { locale: ar })}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <DriverSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        driverId={driverInfo?.id || ''}
        onUpdate={fetchDriverData}
      />
    </div>
  );
};

export default DriverDashboard;
