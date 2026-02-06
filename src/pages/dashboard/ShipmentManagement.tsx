import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { normalizeShipments } from '@/lib/supabaseHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Plus,
  Search,
  Loader2,
  Truck,
  CheckCircle,
  AlertCircle,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ShipmentRouteMap from '@/components/shipments/ShipmentRouteMap';
import ShipmentPrintView from '@/components/shipments/ShipmentPrintView';
import ShipmentCard from '@/components/shipments/ShipmentCard';


interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
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
  created_at: string;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  auto_approve_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  generator: { 
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
  } | null;
  transporter: { 
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    representative_name: string | null;
  } | null;
  recycler: { 
    id: string;
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
    profile: {
      full_name: string;
      phone: string | null;
    };
  } | null;
}

interface Organization {
  id: string;
  name: string;
  organization_type: string;
}

const wasteTypes = [
  { value: 'plastic', label: 'بلاستيك' },
  { value: 'paper', label: 'ورق' },
  { value: 'metal', label: 'معادن' },
  { value: 'glass', label: 'زجاج' },
  { value: 'electronic', label: 'إلكترونيات' },
  { value: 'organic', label: 'عضوية' },
  { value: 'chemical', label: 'كيميائية' },
  { value: 'medical', label: 'طبية' },
  { value: 'construction', label: 'بناء' },
  { value: 'other', label: 'أخرى' },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'جديدة', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  approved: { label: 'معتمدة', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  in_transit: { label: 'في الطريق', color: 'bg-orange-100 text-orange-800', icon: MapPin },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-800', icon: Package },
  confirmed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
};

const disposalMethodsLabels: Record<string, string> = {
  recycling: 'إعادة تدوير',
  remanufacturing: 'إعادة تصنيع',
  recycling_remanufacturing: 'إعادة تدوير / إعادة تصنيع',
  landfill: 'دفن صحي',
  incineration: 'حرق',
  treatment: 'معالجة',
  reuse: 'إعادة استخدام',
};

const getDisposalMethodLabel = (method: string): string => {
  return disposalMethodsLabels[method] || method;
};

const ShipmentManagement = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { toast } = useToast();

  const [newShipment, setNewShipment] = useState({
    generator_id: '',
    transporter_id: '',
    recycler_id: '',
    waste_type: '',
    quantity: '',
    pickup_address: '',
    delivery_address: '',
    notes: '',
  });
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());
  const [mapShipment, setMapShipment] = useState<Shipment | null>(null);
  const [printShipment, setPrintShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch shipments with full details
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          status,
          waste_type,
          quantity,
          unit,
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
          created_at,
          approved_at,
          collection_started_at,
          in_transit_at,
          delivered_at,
          confirmed_at,
          auto_approve_at,
          manual_driver_name,
          manual_vehicle_plate,
          generator_id,
          recycler_id,
          transporter_id,
          driver_id,
          generator:organizations!shipments_generator_id_fkey(id, name, name_en, email, phone, secondary_phone, address, city, region, client_code, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, delegate_name, delegate_phone, delegate_email, delegate_national_id, agent_name, agent_phone, agent_email, agent_national_id, stamp_url, signature_url, logo_url),
          transporter:organizations!shipments_transporter_id_fkey(id, name, name_en, email, phone, secondary_phone, address, city, region, client_code, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, delegate_name, delegate_phone, delegate_email, delegate_national_id, agent_name, agent_phone, agent_email, agent_national_id, stamp_url, signature_url, logo_url),
          recycler:organizations!shipments_recycler_id_fkey(id, name, name_en, email, phone, secondary_phone, address, city, region, client_code, commercial_register, environmental_license, activity_type, production_capacity, representative_name, representative_phone, representative_email, representative_national_id, representative_position, delegate_name, delegate_phone, delegate_email, delegate_national_id, agent_name, agent_phone, agent_email, agent_national_id, stamp_url, signature_url, logo_url),
          driver:drivers(id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .order('created_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;

      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('is_active', true);

      if (orgsError) throw orgsError;

      setShipments(normalizeShipments(shipmentsData || []) as any);
      setOrganizations(orgsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('shipments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateShipment = async () => {
    if (!newShipment.generator_id || !newShipment.transporter_id || !newShipment.recycler_id) {
      toast({
        title: 'خطأ',
        description: 'يرجى تحديد جميع الأطراف',
        variant: 'destructive',
      });
      return;
    }

    setCreateLoading(true);
    try {
      // Get current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('shipments')
        .insert({
          generator_id: newShipment.generator_id,
          transporter_id: newShipment.transporter_id,
          recycler_id: newShipment.recycler_id,
          waste_type: newShipment.waste_type as any,
          quantity: parseFloat(newShipment.quantity),
          pickup_address: newShipment.pickup_address,
          delivery_address: newShipment.delivery_address,
          notes: newShipment.notes,
          created_by: profile.id,
          shipment_number: '', // Will be generated by trigger
        });

      if (error) throw error;

      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء الشحنة بنجاح',
      });

      setDialogOpen(false);
      setNewShipment({
        generator_id: '',
        transporter_id: '',
        recycler_id: '',
        waste_type: '',
        quantity: '',
        pickup_address: '',
        delivery_address: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الشحنة',
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const updateShipmentStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      // Add timestamp based on status
      const now = new Date().toISOString();
      if (newStatus === 'approved') updateData.approved_at = now;
      if (newStatus === 'in_transit') updateData.in_transit_at = now;
      if (newStatus === 'delivered') updateData.delivered_at = now;
      if (newStatus === 'confirmed') updateData.confirmed_at = now;

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الشحنة',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الحالة',
        variant: 'destructive',
      });
    }
  };

  const getWasteTypeLabel = (type: string) => {
    return wasteTypes.find(w => w.value === type)?.label || type;
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.generator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.transporter?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const generators = organizations.filter(o => o.organization_type === 'generator');
  const transporters = organizations.filter(o => o.organization_type === 'transporter');
  const recyclers = organizations.filter(o => o.organization_type === 'recycler');

  const statsData = {
    total: shipments.length,
    active: shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length,
    completed: shipments.filter(s => s.status === 'confirmed').length,
  };


  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الشحنة الجديدة
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>الجهة المولدة</Label>
                    <Select
                      value={newShipment.generator_id}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, generator_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {generators.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>شركة النقل</Label>
                    <Select
                      value={newShipment.transporter_id}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, transporter_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {transporters.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>جهة التدوير</Label>
                    <Select
                      value={newShipment.recycler_id}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, recycler_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recyclers.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع النفايات</Label>
                    <Select
                      value={newShipment.waste_type}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, waste_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر..." />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteTypes.map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>الكمية (كجم)</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newShipment.quantity}
                      onChange={(e) => setNewShipment(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>عنوان الاستلام</Label>
                  <Input
                    placeholder="المنطقة الصناعية، المبنى رقم 5"
                    value={newShipment.pickup_address}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, pickup_address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>عنوان التسليم</Label>
                  <Input
                    placeholder="مصنع التدوير، المنطقة الصناعية الثانية"
                    value={newShipment.delivery_address}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, delivery_address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Textarea
                    placeholder="أي ملاحظات إضافية..."
                    value={newShipment.notes}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateShipment} disabled={createLoading}>
                  {createLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  إنشاء الشحنة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => fetchData()}
              disabled={loading}
              title="تحديث الصفحة"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="text-right">
            <h1 className="text-3xl font-bold">إدارة الشحنات</h1>
            <p className="text-muted-foreground">إنشاء وتتبع الشحنات في الوقت الفعلي</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                  <p className="text-3xl font-bold">{statsData.total}</p>
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
                  <p className="text-sm text-muted-foreground">شحنات نشطة</p>
                  <p className="text-3xl font-bold text-amber-600">{statsData.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شحنات مكتملة</p>
                  <p className="text-3xl font-bold text-green-600">{statsData.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle>قائمة الشحنات</CardTitle>
            <CardDescription>جميع الشحنات المسجلة مع التحديث الفوري</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="فلترة بالحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشحنة أو اسم الشركة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد شحنات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredShipments.map((shipment) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                    onStatusChange={fetchData}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Route Map Dialog */}
      <ShipmentRouteMap
        isOpen={!!mapShipment}
        onClose={() => setMapShipment(null)}
        pickupAddress={mapShipment?.pickup_address || ''}
        deliveryAddress={mapShipment?.delivery_address || ''}
        shipmentNumber={mapShipment?.shipment_number || ''}
      />

      {/* Print Dialog */}
      <ShipmentPrintView
        isOpen={!!printShipment}
        onClose={() => setPrintShipment(null)}
        shipment={printShipment}
      />
    </DashboardLayout>
  );
};

export default ShipmentManagement;
