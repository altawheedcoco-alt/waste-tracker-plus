import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Clock, CheckCircle2, Truck, AlertCircle, Bot, Eye, Printer, Users, Leaf, FileCheck, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import QuickActionsGrid, { QuickAction } from './QuickActionsGrid';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import DocumentVerificationWidget from './DocumentVerificationWidget';
import SmartRequestDialog from './SmartRequestDialog';
import ChatWidget from '@/components/chat/ChatWidget';

interface ShipmentStats {
  total: number;
  new: number;
  inTransit: number;
  completed: number;
}

interface RecentShipment {
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
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
}

const GeneratorDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    new: 0,
    inTransit: 0,
    completed: 0,
  });
  const [recentShipments, setRecentShipments] = useState<RecentShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<RecentShipment | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id]);

  const fetchDashboardData = async () => {
    try {
      const { data: shipments, error } = await supabase
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
          transporter:organizations!shipments_transporter_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          recycler:organizations!shipments_recycler_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          generator:organizations!shipments_generator_id_fkey(name, name_en, email, phone, secondary_phone, address, city, region, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, stamp_url, signature_url, logo_url),
          driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (shipments) {
        setRecentShipments(shipments as unknown as RecentShipment[]);

        const newStats: ShipmentStats = {
          total: shipments.length,
          new: shipments.filter((s) => s.status === 'new' || s.status === 'approved').length,
          inTransit: shipments.filter((s) => s.status === 'collecting' || s.status === 'in_transit').length,
          completed: shipments.filter((s) => s.status === 'delivered' || s.status === 'confirmed').length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewShipment = (shipment: RecentShipment) => {
    setSelectedShipment(shipment);
    setShowPrintDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      new: { label: 'جديدة', variant: 'default' },
      approved: { label: 'معتمدة', variant: 'secondary' },
      collecting: { label: 'قيد الجمع', variant: 'outline' },
      in_transit: { label: 'في الطريق', variant: 'outline' },
      delivered: { label: 'تم التسليم', variant: 'secondary' },
      confirmed: { label: 'مؤكدة', variant: 'default' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

  const statCards = [
    {
      title: 'إجمالي الشحنات',
      value: stats.total,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'شحنات جديدة',
      value: stats.new,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
    },
    {
      title: 'قيد النقل',
      value: stats.inTransit,
      icon: Truck,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'مكتملة',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  const quickActions: QuickAction[] = [
    { title: 'التحقق من الوثائق', subtitle: 'التحقق من صحة وثائق الشحنات', icon: FileCheck, onClick: () => setShowDocumentVerification(true), iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { title: 'أدوات الذكاء الاصطناعي', subtitle: 'استخراج البيانات وتحليلها', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600' },
    { title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'طلب تقارير بيئية', subtitle: 'إرسال طلب تقارير للإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
    { title: 'الشحنات', subtitle: 'عرض جميع الشحنات', icon: Package, path: '/dashboard/shipments' },
    { title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي المنشأة', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'التقارير', subtitle: 'تقارير الأداء', icon: TrendingUp, path: '/dashboard/reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SmartRequestDialog buttonText="طلب تقارير" buttonVariant="default" />
          <Button onClick={() => setShowDocumentVerification(true)} variant="outline" className="gap-2">
            <FileCheck className="w-4 h-4" />
            التحقق من الوثائق
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">مرحباً، {profile?.full_name}</h1>
          <p className="text-muted-foreground">
            {organization?.name} - الجهة المولدة
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid
        actions={quickActions}
        title="الإجراءات السريعة"
        subtitle="الوظائف المستخدمة بكثرة"
      />

      {/* Recent shipments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            أحدث الشحنات
          </CardTitle>
          <CardDescription>آخر 10 شحنات تم إنشاؤها</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              جاري التحميل...
            </div>
          ) : recentShipments.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لا توجد شحنات حتى الآن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentShipments.map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewShipment(shipment)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleViewShipment(shipment)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-left">
                      <p className="text-sm">
                        {shipment.transporter?.name || 'غير محدد'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(shipment.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    {getStatusBadge(shipment.status)}
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-3 justify-end">
                        <div>
                          <p className="font-medium">{shipment.shipment_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {getWasteTypeLabel(shipment.waste_type)} - {shipment.quantity} {shipment.unit || 'كجم'}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Dialog */}
      <EnhancedShipmentPrintView
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        shipment={selectedShipment as any}
      />

      {/* Document Verification Dialog */}
      <DocumentVerificationWidget
        open={showDocumentVerification}
        onOpenChange={setShowDocumentVerification}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default GeneratorDashboard;
