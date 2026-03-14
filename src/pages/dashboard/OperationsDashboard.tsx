import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Package,
  Truck,
  Factory,
  Recycle,
  MapPin,
  Clock,
  Search,
  RefreshCw,
  Eye,
  Phone,
  Image as ImageIcon,
  Banknote,
  ArrowUpDown,
  Loader2,
  Play,
  CheckCircle,
  AlertCircle,
  Scale,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LiveShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  waste_description: string | null;
  quantity: number;
  unit: string;
  pickup_address: string | null;
  delivery_address: string | null;
  created_at: string;
  weighbridge_photo_url: string | null;
  weighbridge_verified: boolean;
  payment_status: string | null;
  actual_weight: number | null;
  total_value: number | null;
  generator: { id: string; name: string } | null;
  transporter: { id: string; name: string } | null;
  recycler: { id: string; name: string } | null;
  driver: { profile: { full_name: string } | null } | null;
}

interface DriverLocation {
  driver_id: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  last_update: string;
  vehicle_plate: string | null;
  current_shipment_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'جديدة', color: 'bg-blue-500', icon: Clock },
  approved: { label: 'معتمدة', color: 'bg-indigo-500', icon: CheckCircle },
  collecting: { label: 'جاري الجمع', color: 'bg-amber-500', icon: Package },
  in_transit: { label: 'في الطريق', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'تم التسليم', color: 'bg-teal-500', icon: MapPin },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-500', icon: CheckCircle },
};

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

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<LiveShipment | null>(null);
  const [activeTab, setActiveTab] = useState('live');

  // Fetch live shipments with simplified query
  const { data: shipments = [], isLoading, refetch } = useQuery({
    queryKey: ['operations-live-shipments', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // First fetch shipments
      const { data: shipmentsData, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          status,
          waste_type,
          waste_description,
          quantity,
          unit,
          pickup_address,
          delivery_address,
          created_at,
          weighbridge_photo_url,
          weighbridge_verified,
          payment_status,
          actual_weight,
          total_value,
          generator_id,
          transporter_id,
          recycler_id,
          driver_id
        `)
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
        .in('status', ['new', 'approved', 'collecting', 'in_transit', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch organizations for mapping
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name');

      const orgsMap = new Map(orgsData?.map(o => [o.id, { id: o.id, name: o.name }]) || []);

      // Enrich shipments with org data
      return (shipmentsData || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap.get(s.generator_id) || null : null,
        transporter: s.transporter_id ? orgsMap.get(s.transporter_id) || null : null,
        recycler: s.recycler_id ? orgsMap.get(s.recycler_id) || null : null,
        driver: null,
      })) as unknown as LiveShipment[];
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  // Stats
  const stats = useMemo(() => {
    const active = shipments.filter(s => ['approved', 'collecting', 'in_transit'].includes(s.status));
    const pendingVerification = shipments.filter(s => !s.weighbridge_verified && s.status !== 'new');
    const totalValue = shipments.reduce((sum, s) => sum + (s.total_value || 0), 0);

    return {
      total: shipments.length,
      active: active.length,
      pendingVerification: pendingVerification.length,
      totalValue,
      byStatus: Object.entries(statusConfig).map(([key, config]) => ({
        status: key,
        ...config,
        count: shipments.filter(s => s.status === key).length,
      })),
    };
  }, [shipments]);

  const filteredShipments = shipments.filter(s =>
    s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.generator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.recycler?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: 'bg-gray-500', icon: Clock };
    const Icon = config.icon;
    return (
      <Badge className={cn('gap-1', config.color, 'text-white')}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
  };

  return (
    <DashboardLayout>
      <BackButton />
      <div className="h-[calc(100vh-120px)] flex flex-col sm:block">
        {/* Mobile: stacked layout, Desktop: resizable panels */}
        <div className="hidden sm:block h-full">
          <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
            {/* Left Panel - Map Placeholder */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    خريطة العمليات الحية
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    تتبع الشاحنات والمصانع على الخريطة
                  </p>
                </div>

                <div className="flex-1 bg-muted/30 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      خريطة Google Maps
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/dashboard/map')}
                    >
                      فتح الخريطة الكاملة
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="p-4 border-t grid grid-cols-4 gap-2">
                  {stats.byStatus.slice(0, 4).map(item => (
                    <div key={item.status} className="text-center">
                      <div className={cn('w-3 h-3 rounded-full mx-auto mb-1', item.color)} />
                      <p className="text-lg font-bold">{item.count}</p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Operations Feed */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ArrowUpDown className="h-5 w-5 text-primary" />
                    تدفق العمليات
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث في العمليات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-2 grid grid-cols-3">
                  <TabsTrigger value="live" className="gap-1">
                    <Play className="h-3 w-3" />
                    مباشر ({stats.active})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1">
                    <Scale className="h-3 w-3" />
                    معلق ({stats.pendingVerification})
                  </TabsTrigger>
                  <TabsTrigger value="all" className="gap-1">
                    <Package className="h-3 w-3" />
                    الكل ({stats.total})
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 p-4">
                  <TabsContent value="live" className="mt-0">
                    <ShipmentsList
                      shipments={filteredShipments.filter(s =>
                        ['approved', 'collecting', 'in_transit'].includes(s.status)
                      )}
                      onSelect={setSelectedShipment}
                      selectedId={selectedShipment?.id}
                    />
                  </TabsContent>

                  <TabsContent value="pending" className="mt-0">
                    <ShipmentsList
                      shipments={filteredShipments.filter(s =>
                        !s.weighbridge_verified && s.status !== 'new'
                      )}
                      onSelect={setSelectedShipment}
                      selectedId={selectedShipment?.id}
                    />
                  </TabsContent>

                  <TabsContent value="all" className="mt-0">
                    <ShipmentsList
                      shipments={filteredShipments}
                      onSelect={setSelectedShipment}
                      selectedId={selectedShipment?.id}
                    />
                  </TabsContent>
                </ScrollArea>
              </Tabs>

              {/* Selected Shipment Details */}
              {selectedShipment && (
                <div className="p-4 border-t bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">{selectedShipment.shipment_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeAgo(selectedShipment.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(selectedShipment.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-background">
                      <Scale className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {selectedShipment.actual_weight || selectedShipment.quantity} {selectedShipment.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">الوزن</p>
                    </div>
                    <div className="p-2 rounded bg-background">
                      <Banknote className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {selectedShipment.total_value?.toLocaleString('ar-EG') || '—'} ج.م
                      </p>
                      <p className="text-[10px] text-muted-foreground">القيمة</p>
                    </div>
                    <div className="p-2 rounded bg-background">
                      {selectedShipment.weighbridge_verified ? (
                        <CheckCircle className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                      )}
                      <p className="text-sm font-medium">
                        {selectedShipment.weighbridge_verified ? 'موثق' : 'غير موثق'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">البسكول</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/dashboard/s/${selectedShipment.shipment_number}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      عرض التفاصيل
                    </Button>
                    {selectedShipment.weighbridge_photo_url && (
                      <Button size="sm" variant="outline">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}

// Shipments List Component
function ShipmentsList({
  shipments,
  onSelect,
  selectedId,
}: {
  shipments: LiveShipment[];
  onSelect: (s: LiveShipment) => void;
  selectedId?: string;
}) {
  if (shipments.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">لا توجد عمليات</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {shipments.map((shipment, index) => (
        <motion.div
          key={shipment.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedId === shipment.id && 'ring-2 ring-primary'
            )}
            onClick={() => onSelect(shipment)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {shipment.shipment_number}
                    </Badge>
                    {statusConfig[shipment.status] && (
                      <div className={cn('w-2 h-2 rounded-full', statusConfig[shipment.status].color)} />
                    )}
                  </div>

                  <p className="text-sm font-medium truncate">
                    {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                    {shipment.waste_description && ` - ${shipment.waste_description}`}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {shipment.generator && (
                      <span className="flex items-center gap-1 truncate">
                        <Factory className="h-3 w-3" />
                        {shipment.generator.name}
                      </span>
                    )}
                    {shipment.recycler && (
                      <>
                        <span>→</span>
                        <span className="flex items-center gap-1 truncate">
                          <Recycle className="h-3 w-3" />
                          {shipment.recycler.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-left flex flex-col items-end gap-1">
                  <p className="text-sm font-bold">
                    {shipment.actual_weight || shipment.quantity} {shipment.unit}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(shipment.created_at), { locale: ar })}
                  </p>
                </div>
              </div>

              {/* Visual verification indicators */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <div className={cn(
                  'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full',
                  shipment.weighbridge_photo_url
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <ImageIcon className="h-3 w-3" />
                  صورة البسكول
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full',
                  shipment.payment_status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Banknote className="h-3 w-3" />
                  إثبات الدفع
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
