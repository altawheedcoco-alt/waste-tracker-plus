import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentStatusTimeline from '@/components/shipments/ShipmentStatusTimeline';
import ShipmentStatusDialog from '@/components/shipments/ShipmentStatusDialog';
import ShipmentQuickPrint from '@/components/shipments/ShipmentQuickPrint';
import ShipmentTrackingMap from '@/components/maps/ShipmentTrackingMap';
import UnifiedShipmentTracker from '@/components/tracking/UnifiedShipmentTracker';
import CancelShipmentDialog from '@/components/shipments/CancelShipmentDialog';
import RouteProgressBar from '@/components/tracking/RouteProgressBar';
import QuickReceiptButton from '@/components/receipts/QuickReceiptButton';

// Lazy load the live tracking components
const LiveTrackingMapDialog = lazy(() => import('@/components/tracking/LiveTrackingMapDialog'));
const DriverRouteVisualization = lazy(() => import('@/components/tracking/DriverRouteVisualization'));

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Printer,
  MapPin,
  Calendar,
  Truck,
  Building2,
  Recycle,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Scale,
  Box,
  Loader2,
  Edit,
  Download,
  Map,
  Zap,
  Navigation,
  XCircle,
  Route,
  Activity,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getCityById } from '@/lib/egyptianCities';
import { toast } from 'sonner';

interface ShipmentDetails {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  driver_id: string | null;
  generator_id: string;
  recycler_id: string;
  generator: { 
    name: string; 
    email: string; 
    phone: string; 
    address: string; 
    city: string; 
    representative_name: string | null;
  } | null;
  recycler: { 
    name: string; 
    email: string; 
    phone: string; 
    address: string; 
    city: string; 
    representative_name: string | null;
  } | null;
  transporter: { 
    name: string; 
    email: string; 
    phone: string; 
    address: string; 
    city: string; 
    representative_name: string | null;
  } | null;
  driver: { 
    id: string;
    license_number: string; 
    vehicle_type: string | null; 
    vehicle_plate: string | null; 
    profile: { full_name: string; phone: string | null } 
  } | null;
}

const wasteTypeLabels: Record<string, string> = {
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

const hazardLevelLabels: Record<string, { label: string; className: string }> = {
  low: { label: 'منخفض', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  medium: { label: 'متوسط', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  high: { label: 'عالي', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  new: { label: 'جديدة', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  approved: { label: 'معتمدة', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  in_transit: { label: 'في الطريق', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  delivered: { label: 'تم التسليم', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
  confirmed: { label: 'مؤكدة', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' },
};

const ShipmentDetailsPage = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { roles, organization } = useAuth();
  const [shipment, setShipment] = useState<ShipmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  const [generatorLocation, setGeneratorLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [recyclerLocation, setRecyclerLocation] = useState<{ lat: number; lng: number } | null>(null);

  const isDriver = roles.includes('driver');

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetails();
    }
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    try {
      // التحقق من نوع المعرف - UUID أو رقم الشحنة
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shipmentId || '');
      
      let query = supabase
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
          delivery_address,
          pickup_date,
          expected_delivery_date,
          notes,
          generator_notes,
          recycler_notes,
          waste_description,
          hazard_level,
          packaging_method,
          disposal_method,
          approved_at,
          collection_started_at,
          in_transit_at,
          delivered_at,
          confirmed_at,
          manual_driver_name,
          manual_vehicle_plate,
          driver_id,
          generator_id,
          recycler_id,
          generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, representative_name),
          recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, representative_name),
          transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, representative_name),
          driver:drivers(id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `);
      
      // البحث بـ UUID أو رقم الشحنة
      if (isUUID) {
        query = query.eq('id', shipmentId);
      } else {
        query = query.eq('shipment_number', shipmentId);
      }
      
      const { data, error } = await query.single();

      if (error) throw error;
      const shipmentData = data as unknown as ShipmentDetails;
      setShipment(shipmentData);

      // Fetch locations for generator and recycler
      if (shipmentData.generator_id) {
        const { data: genLoc } = await supabase
          .from('organization_locations')
          .select('latitude, longitude')
          .eq('organization_id', shipmentData.generator_id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (genLoc?.latitude && genLoc?.longitude) {
          setGeneratorLocation({ lat: Number(genLoc.latitude), lng: Number(genLoc.longitude) });
        } else {
          // Default to Cairo if no location
          setGeneratorLocation({ lat: 30.0444, lng: 31.2357 });
        }
      }

      if (shipmentData.recycler_id) {
        const { data: recLoc } = await supabase
          .from('organization_locations')
          .select('latitude, longitude')
          .eq('organization_id', shipmentData.recycler_id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (recLoc?.latitude && recLoc?.longitude) {
          setRecyclerLocation({ lat: Number(recLoc.latitude), lng: Number(recLoc.longitude) });
        } else {
          // Default to Giza if no location
          setRecyclerLocation({ lat: 30.0131, lng: 31.2089 });
        }
      }
    } catch (error) {
      console.error('Error fetching shipment details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!shipment) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">الشحنة غير موجودة</h2>
          <p className="text-muted-foreground mb-4">لم يتم العثور على الشحنة المطلوبة</p>
          <Button onClick={() => navigate(-1)}>العودة</Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = statusLabels[shipment.status] || { label: shipment.status, className: 'bg-muted' };
  const hazardConfig = hazardLevelLabels[shipment.hazard_level || 'low'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-right">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              <h1 className="text-2xl font-bold font-mono">{shipment.shipment_number}</h1>
            </div>
            <p className="text-muted-foreground">
              تم الإنشاء في {format(new Date(shipment.created_at), 'PPP', { locale: ar })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Live Tracking Button - only show if driver is assigned */}
            {shipment.driver_id && (
              <Button 
                onClick={() => setShowLiveTracking(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Navigation className="ml-2 h-4 w-4" />
                التتبع المباشر
              </Button>
            )}
            {/* Quick Receipt Button - only for transporter */}
            {organization?.organization_type === 'transporter' && (
              <QuickReceiptButton
                shipment={{
                  id: shipment.id,
                  shipment_number: shipment.shipment_number,
                  waste_type: shipment.waste_type,
                  quantity: shipment.quantity,
                  unit: shipment.unit || 'كجم',
                  pickup_address: shipment.pickup_address || '',
                  generator_id: shipment.generator_id,
                  generator: shipment.generator,
                  recycler: shipment.recycler,
                  driver_id: shipment.driver_id,
                  created_at: shipment.created_at,
                }}
                onSuccess={fetchShipmentDetails}
                variant="outline"
                size="default"
              />
            )}
            <Button variant="outline" onClick={() => setShowStatusDialog(true)}>
              <Edit className="ml-2 h-4 w-4" />
              تغيير الحالة
            </Button>
            <Button variant="eco" onClick={() => setShowPrintDialog(true)}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة / تحميل PDF
            </Button>
            {/* Cancel Shipment Button */}
            <CancelShipmentDialog
              shipmentId={shipment.id}
              shipmentNumber={shipment.shipment_number}
              currentStatus={shipment.status}
              onSuccess={fetchShipmentDetails}
            />
          </div>
        </div>

        {/* Status Timeline */}
        <ShipmentStatusTimeline shipment={shipment} />

        {/* Live Tracking Section - Featured when driver is assigned */}
        {shipment.driver_id && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Navigation className="h-5 w-5 text-primary" />
                  </div>
                  التتبع المباشر للشحنة
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowLiveTracking(true)}
                  >
                    <Eye className="ml-2 h-4 w-4" />
                    تتبع كامل
                  </Button>
                </div>
              </div>
              <CardDescription className="mt-2">
                تتبع مسار السائق والمسافة المتبقية في الوقت الحقيقي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <RouteProgressBar
                status={shipment.status}
                pickupAddress={shipment.pickup_address}
                deliveryAddress={shipment.delivery_address}
                pickupDate={shipment.pickup_date}
                deliveredAt={shipment.delivered_at}
                compact
              />

              {/* Driver Route Visualization */}
              <Suspense fallback={
                <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }>
                <DriverRouteVisualization
                  shipmentId={shipment.id}
                  driverId={shipment.driver_id}
                  pickupAddress={shipment.pickup_address}
                  deliveryAddress={shipment.delivery_address}
                  status={shipment.status}
                  showStats={true}
                  height={350}
                />
              </Suspense>
            </CardContent>
          </Card>
        )}

        {/* Unified Tracker with Live Map - Show only if no driver */}
        {!shipment.driver_id && (
          <UnifiedShipmentTracker
            shipment={{
              ...shipment,
              generator: shipment.generator ? { name: shipment.generator.name, city: shipment.generator.city } : null,
              transporter: shipment.transporter ? { name: shipment.transporter.name, phone: shipment.transporter.phone } : null,
              recycler: shipment.recycler ? { name: shipment.recycler.name, city: shipment.recycler.city } : null,
            }}
            showMap={generatorLocation !== null && recyclerLocation !== null}
            onStatusUpdate={fetchShipmentDetails}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Waste Details */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <Package className="w-5 h-5 text-primary" />
                تفاصيل المخلفات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">نوع المخلفات</p>
                  <p className="font-medium">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">الكمية</p>
                  <p className="font-medium flex items-center gap-1 justify-end">
                    <Scale className="w-4 h-4 text-muted-foreground" />
                    {shipment.quantity} {shipment.unit || 'كجم'}
                  </p>
                </div>
              </div>
              
              {shipment.hazard_level && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">مستوى الخطورة</p>
                  <Badge className={hazardConfig?.className}>
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    {hazardConfig?.label}
                  </Badge>
                </div>
              )}

              {shipment.waste_description && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">وصف المخلفات</p>
                  <p className="text-sm">{shipment.waste_description}</p>
                </div>
              )}

              {shipment.packaging_method && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">طريقة التعبئة</p>
                  <p className="font-medium flex items-center gap-1 justify-end">
                    <Box className="w-4 h-4 text-muted-foreground" />
                    {shipment.packaging_method}
                  </p>
                </div>
              )}

              {shipment.disposal_method && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">طريقة التخلص</p>
                  <p className="font-medium">{shipment.disposal_method}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2 justify-end">
                <MapPin className="w-5 h-5 text-primary" />
                مواقع الشحنة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-right p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">موقع الاستلام</p>
                <p className="font-medium">{shipment.pickup_address}</p>
                {shipment.pickup_date && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(shipment.pickup_date), 'PPP', { locale: ar })}
                  </p>
                )}
              </div>

              <div className="text-right p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">موقع التسليم</p>
                <p className="font-medium">{shipment.delivery_address}</p>
                {shipment.expected_delivery_date && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(shipment.expected_delivery_date), 'PPP', { locale: ar })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generator Info */}
          {shipment.generator && (
            <Card>
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  الجهة المولدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-right">
                  <p className="font-semibold text-lg">{shipment.generator.name}</p>
                  <p className="text-sm text-muted-foreground">{shipment.generator.city}</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.generator.address}</span>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </p>
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.generator.phone}</span>
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </p>
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.generator.email}</span>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </p>
                  {shipment.generator.representative_name && (
                    <p className="flex items-center gap-2 justify-end">
                      <span>{shipment.generator.representative_name}</span>
                      <User className="w-4 h-4 text-muted-foreground" />
                    </p>
                  )}
                </div>
                {shipment.generator_notes && (
                  <>
                    <Separator />
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">ملاحظات المولد</p>
                      <p className="text-sm">{shipment.generator_notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transporter Info */}
          {shipment.transporter && (
            <Card>
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <Truck className="w-5 h-5 text-purple-500" />
                  الجهة الناقلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-right">
                  <p className="font-semibold text-lg">{shipment.transporter.name}</p>
                  <p className="text-sm text-muted-foreground">{shipment.transporter.city}</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.transporter.address}</span>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </p>
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.transporter.phone}</span>
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </p>
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.transporter.email}</span>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </p>
                </div>

                {/* Driver Info */}
                {(shipment.driver || shipment.manual_driver_name) && (
                  <>
                    <Separator />
                    <div className="text-right p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">بيانات السائق</p>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2 justify-end">
                          <span>{shipment.driver?.profile?.full_name || shipment.manual_driver_name}</span>
                          <User className="w-4 h-4 text-muted-foreground" />
                        </p>
                        {shipment.driver?.profile?.phone && (
                          <p className="flex items-center gap-2 justify-end">
                            <span>{shipment.driver.profile.phone}</span>
                            <Phone className="w-4 h-4 text-muted-foreground" />
                          </p>
                        )}
                        <p className="flex items-center gap-2 justify-end">
                          <span>{shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate || '-'}</span>
                          <Truck className="w-4 h-4 text-muted-foreground" />
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recycler Info */}
          {shipment.recycler && (
            <Card>
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <Recycle className="w-5 h-5 text-green-500" />
                  الجهة المُعيدة للتدوير
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-right">
                  <p className="font-semibold text-lg">{shipment.recycler.name}</p>
                  <p className="text-sm text-muted-foreground">{shipment.recycler.city}</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.recycler.address}</span>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </p>
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.recycler.phone}</span>
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </p>
                  <p className="flex items-center gap-2 justify-end">
                    <span>{shipment.recycler.email}</span>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </p>
                  {shipment.recycler.representative_name && (
                    <p className="flex items-center gap-2 justify-end">
                      <span>{shipment.recycler.representative_name}</span>
                      <User className="w-4 h-4 text-muted-foreground" />
                    </p>
                  )}
                </div>
                {shipment.recycler_notes && (
                  <>
                    <Separator />
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">ملاحظات المُعيد</p>
                      <p className="text-sm">{shipment.recycler_notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {shipment.notes && (
            <Card className="lg:col-span-2">
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <FileText className="w-5 h-5 text-primary" />
                  ملاحظات عامة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-right">{shipment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Print Dialog */}
        <ShipmentQuickPrint
          isOpen={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          shipmentId={shipmentId || ''}
        />

        {/* Status Change Dialog */}
        <ShipmentStatusDialog
          isOpen={showStatusDialog}
          onClose={() => setShowStatusDialog(false)}
          shipment={shipment}
          onStatusChanged={fetchShipmentDetails}
        />

        {/* Live Tracking Dialog */}
        {showLiveTracking && shipment.driver_id && (
          <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }>
            <LiveTrackingMapDialog
              isOpen={showLiveTracking}
              onClose={() => setShowLiveTracking(false)}
              driverId={shipment.driver_id}
              shipmentNumber={shipment.shipment_number}
              pickupAddress={shipment.pickup_address}
              deliveryAddress={shipment.delivery_address}
              shipmentStatus={shipment.status}
            />
          </Suspense>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ShipmentDetailsPage;
