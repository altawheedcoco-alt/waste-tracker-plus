import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Clock, CheckCircle2, Truck, AlertCircle, Bot, Eye, Users, Leaf, FileCheck, Send, FolderCheck, FileSignature, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import QuickActionsGrid, { QuickAction } from './QuickActionsGrid';
import ResponsiveGrid from './ResponsiveGrid';
import EnhancedShipmentPrintView from '@/components/shipments/EnhancedShipmentPrintView';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import DocumentVerificationWidget from './DocumentVerificationWidget';
import SmartRequestDialog from './SmartRequestDialog';
import ChatWidget from '@/components/chat/ChatWidget';
import AddDepositDialog from '@/components/deposits/AddDepositDialog';

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
  driver_id: string | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
  has_report?: boolean;
}

const GeneratorDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet, getResponsiveClass } = useDisplayMode();
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

  // Responsive styles
  const titleClass = getResponsiveClass({
    mobile: 'text-lg',
    tablet: 'text-xl',
    desktop: 'text-2xl',
  });

  const statValueClass = getResponsiveClass({
    mobile: 'text-xl',
    tablet: 'text-2xl',
    desktop: 'text-3xl',
  });

  const iconContainerClass = getResponsiveClass({
    mobile: 'w-10 h-10',
    tablet: 'w-11 h-11',
    desktop: 'w-12 h-12',
  });

  const iconClass = getResponsiveClass({
    mobile: 'w-5 h-5',
    tablet: 'w-5.5 h-5.5',
    desktop: 'w-6 h-6',
  });

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id]);

  const fetchDashboardData = async () => {
    try {
      const { data: shipmentsRaw, error } = await supabase
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
          transporter_id,
          recycler_id
        `)
        .eq('generator_id', organization?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (shipmentsRaw) {
        // Fetch organizations for enrichment
        const orgIds = [...new Set([
          ...shipmentsRaw.map(s => s.transporter_id).filter(Boolean),
          ...shipmentsRaw.map(s => s.recycler_id).filter(Boolean),
          ...shipmentsRaw.map(s => s.generator_id).filter(Boolean),
        ])] as string[];
        
        const orgsMap: Record<string, any> = {};
        if (orgIds.length > 0) {
          const { data: orgsData } = await supabase.from('organizations').select('*').in('id', orgIds);
          orgsData?.forEach(o => { orgsMap[o.id] = o; });
        }

        // Fetch drivers
        const driverIds = [...new Set(shipmentsRaw.map(s => s.driver_id).filter(Boolean))] as string[];
        const driversMap: Record<string, any> = {};
        if (driverIds.length > 0) {
          const { data: driversData } = await supabase.from('drivers').select('license_number, vehicle_type, vehicle_plate, id, profile:profiles(full_name, phone)').in('id', driverIds);
          driversData?.forEach(d => { driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile }; });
        }

        const shipments = shipmentsRaw.map(s => ({
          ...s,
          generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
          transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
          recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
          driver: s.driver_id ? driversMap[s.driver_id] || null : null,
        }));

        // Fetch recycling reports to check which shipments have reports
        const shipmentIds = shipments.map(s => s.id);
        const { data: reportsData } = await supabase
          .from('recycling_reports')
          .select('shipment_id')
          .in('shipment_id', shipmentIds);

        const reportedShipmentIds = new Set(reportsData?.map(r => r.shipment_id) || []);

        const shipmentsWithReportStatus = shipments.map(s => ({
          ...s,
          has_report: reportedShipmentIds.has(s.id),
        }));

        setRecentShipments(shipmentsWithReportStatus as unknown as RecentShipment[]);

        const newStats: ShipmentStats = {
          total: shipments.length,
          new: shipments.filter((s) => s.status === 'new' || s.status === 'approved').length,
          inTransit: shipments.filter((s) => s.status === 'in_transit').length,
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

  // State for deposit dialog
  const [showDepositDialog, setShowDepositDialog] = useState(false);

  const quickActions: QuickAction[] = [
    { title: 'تسجيل إيداع', subtitle: 'تسجيل دفعة مالية لشريك', icon: Banknote, onClick: () => setShowDepositDialog(true), iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'العقود', subtitle: 'إدارة العقود والاتفاقيات', icon: FileSignature, path: '/dashboard/contracts', iconBgClass: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { title: 'شهادات استلام الشحنات', subtitle: 'إدارة شهادات استلام الشحنات من الناقلين', icon: FileCheck, path: '/dashboard/generator-receipts', iconBgClass: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { title: 'شهادات إعادة التدوير', subtitle: 'تقارير جهات التدوير المستلمة', icon: FolderCheck, path: '/dashboard/recycling-certificates', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'تحليل المخلفات بالذكاء الاصطناعي', subtitle: 'تحليلات دقيقة وتوصيات للحد من المخلفات', icon: Bot, path: '/dashboard/ai-tools', iconBgClass: 'bg-gradient-to-br from-green-500 to-emerald-600' },
    { title: 'تقارير الاستدامة البيئية', subtitle: 'تحليل شامل للأداء البيئي', icon: Leaf, path: '/dashboard/environmental-sustainability', iconBgClass: 'bg-gradient-to-br from-green-600 to-teal-600' },
    { title: 'تحليل البصمة الكربونية', subtitle: 'تقارير الانبعاثات والأثر البيئي', icon: Leaf, path: '/dashboard/carbon-footprint', iconBgClass: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { title: 'طلب تقارير بيئية', subtitle: 'إرسال طلب تقارير للإدارة', icon: Send, path: '/dashboard/my-requests', iconBgClass: 'bg-gradient-to-br from-purple-500 to-indigo-600' },
    { title: 'الشحنات', subtitle: 'عرض جميع الشحنات', icon: Package, path: '/dashboard/shipments' },
    { title: 'إدارة الموظفين', subtitle: 'إضافة وإدارة موظفي المنشأة', icon: Users, path: '/dashboard/employees', iconBgClass: 'bg-gradient-to-br from-blue-500 to-cyan-600' },
    { title: 'التقارير', subtitle: 'تقارير الأداء', icon: TrendingUp, path: '/dashboard/reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section - Responsive */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'}`}>
        <div className={`flex items-center gap-2 ${isMobile ? 'order-2' : ''}`}>
          <SmartRequestDialog buttonText={isMobile ? 'طلب' : 'طلب تقارير'} buttonVariant="default" />
          <Button onClick={() => setShowDocumentVerification(true)} variant="outline" size={isMobile ? 'sm' : 'default'} className="gap-2">
            <FileCheck className="w-4 h-4" />
            {!isMobile && 'التحقق من الوثائق'}
          </Button>
        </div>
        <div className={`text-right ${isMobile ? 'order-1' : ''}`}>
          <h1 className={`font-bold ${titleClass}`}>مرحباً، {profile?.full_name}</h1>
          <p className="text-muted-foreground text-sm">
            {organization?.name} - الجهة المولدة
          </p>
        </div>
      </div>

      {/* Stats grid - Responsive */}
      <ResponsiveGrid cols={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className={isMobile ? 'p-3' : 'p-5'}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground truncate`}>{stat.title}</p>
                    <p className={`${statValueClass} font-bold mt-1`}>{stat.value}</p>
                  </div>
                  <div
                    className={`${iconContainerClass} rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shrink-0`}
                  >
                    <stat.icon className={iconClass} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </ResponsiveGrid>

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
              {recentShipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onStatusChange={fetchDashboardData}
                />
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

      {/* Deposit Dialog */}
      <AddDepositDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
      />

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default GeneratorDashboard;
