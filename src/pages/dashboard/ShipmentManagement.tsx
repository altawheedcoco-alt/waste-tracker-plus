import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeShipments } from '@/lib/supabaseHelpers';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
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
import ShipmentRouteMap from '@/components/maps/RouteMapDialog';
import UnifiedShipmentPrint from '@/components/shipments/unified-print/UnifiedShipmentPrint';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import BatchSignatureDialog from '@/components/signatures/BatchSignatureDialog';
import type { BatchDocument } from '@/components/signatures/BatchSignatureDialog';
import { useRequireSubscription } from '@/hooks/useRequireSubscription';
import { PenTool, X } from 'lucide-react';


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

const ShipmentManagement = () => {
  const { t } = useLanguage();
  const { user, organization } = useAuth();
  const { requireSubscription } = useRequireSubscription();

  const wasteTypes = [
    { value: 'plastic', label: t('shipmentMgmt.plastic') },
    { value: 'paper', label: t('shipmentMgmt.paper') },
    { value: 'metal', label: t('shipmentMgmt.metal') },
    { value: 'glass', label: t('shipmentMgmt.glass') },
    { value: 'electronic', label: t('shipmentMgmt.electronic') },
    { value: 'organic', label: t('shipmentMgmt.organic') },
    { value: 'chemical', label: t('shipmentMgmt.chemical') },
    { value: 'medical', label: t('shipmentMgmt.medical') },
    { value: 'construction', label: t('shipmentMgmt.construction') },
    { value: 'other', label: t('shipmentMgmt.other') },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    new: { label: t('shipmentMgmt.statusNew'), color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    approved: { label: t('shipmentMgmt.statusApproved'), color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
    in_transit: { label: t('shipmentMgmt.statusInTransit'), color: 'bg-orange-100 text-orange-800', icon: MapPin },
    delivered: { label: t('shipmentMgmt.statusDelivered'), color: 'bg-green-100 text-green-800', icon: Package },
    confirmed: { label: t('shipmentMgmt.statusConfirmed'), color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  };

  const disposalMethodsLabels: Record<string, string> = {
    recycling: t('shipmentMgmt.recycling'),
    remanufacturing: t('shipmentMgmt.remanufacturing'),
    recycling_remanufacturing: t('shipmentMgmt.recyclingRemanufacturing'),
    landfill: t('shipmentMgmt.landfill'),
    incineration: t('shipmentMgmt.incineration'),
    treatment: t('shipmentMgmt.treatment'),
    reuse: t('shipmentMgmt.reuse'),
  };

  const getDisposalMethodLabel = (method: string): string => {
    return disposalMethodsLabels[method] || method;
  };

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchSignOpen, setBatchSignOpen] = useState(false);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments with simplified relations to avoid FK issues
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
          driver_id
        `)
        .order('created_at', { ascending: false });

      if (shipmentsError) {
        console.error('Shipments fetch error:', shipmentsError);
        throw shipmentsError;
      }

      // Fetch organizations separately for better performance
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, organization_type, email, phone, address, city, representative_name')
        .eq('is_active', true);

      if (orgsError) {
        console.error('Organizations fetch error:', orgsError);
        throw orgsError;
      }

      // Fetch drivers separately
      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)');

      // Map organizations and drivers to shipments
      const orgsMap = new Map(orgsData?.map(o => [o.id, o]) || []);
      const driversMap = new Map(driversData?.map(d => [d.id, {
        ...d,
        profile: Array.isArray(d.profile) ? d.profile[0] : d.profile
      }]) || []);

      const enrichedShipments = (shipmentsData || []).map(shipment => ({
        ...shipment,
        generator: shipment.generator_id ? orgsMap.get(shipment.generator_id) || null : null,
        transporter: shipment.transporter_id ? orgsMap.get(shipment.transporter_id) || null : null,
        recycler: shipment.recycler_id ? orgsMap.get(shipment.recycler_id) || null : null,
        driver: shipment.driver_id ? driversMap.get(shipment.driver_id) || null : null,
      }));

      setShipments(enrichedShipments as any);
      setOrganizations(orgsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: t('shipmentMgmt.errorLoading'),
        description: error?.message || t('shipmentMgmt.unexpectedError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(getTabChannelName('shipments-changes'))
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
    // === SUBSCRIPTION CHECK ===
    if (!requireSubscription()) return;

    if (!newShipment.generator_id || !newShipment.transporter_id || !newShipment.recycler_id) {
      toast({
        title: t('common.error'),
        description: t('shipmentMgmt.errorMissingParties'),
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

      const { data: shipmentData, error } = await supabase
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
        }).select().single();

      if (error) throw error;

      // Auto-create generator declaration on shipment creation
      if (shipmentData && newShipment.generator_id) {
        try {
          const { autoCreateGeneratorDeclaration } = await import('@/utils/autoDeclarationCreator');
          await autoCreateGeneratorDeclaration(shipmentData.id, newShipment.generator_id, profile.id);
        } catch (e) {
          console.error('Auto declaration error (non-blocking):', e);
        }
      }

      toast({
        title: t('shipmentMgmt.created'),
        description: t('shipmentMgmt.createdDesc'),
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
        title: t('common.error'),
        description: t('shipmentMgmt.createFailed'),
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

      // Auto-create declarations based on status change
      // Auto-create declarations based on status change
      const shipment = shipments.find(s => s.id === id);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (shipment && currentUser) {
        try {
          const { autoCreateGeneratorDeclaration, autoCreateRecyclerDeclaration } = await import('@/utils/autoDeclarationCreator');
          
          // When shipment is registered (approved) → auto generator declaration
          if ((newStatus === 'approved' || newStatus === 'registered') && shipment.generator?.id) {
            await autoCreateGeneratorDeclaration(id, shipment.generator.id, currentUser.id);
          }
          
          // When shipment is delivered → auto recycler declaration
          if ((newStatus === 'delivered' || newStatus === 'confirmed') && shipment.recycler?.id) {
            await autoCreateRecyclerDeclaration(id, shipment.recycler.id, currentUser.id);
          }
        } catch (declError) {
          console.error('Auto declaration error (non-blocking):', declError);
        }
      }

      toast({
        title: t('shipmentMgmt.updated'),
        description: t('shipmentMgmt.updatedDesc'),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: t('common.error'),
        description: t('shipmentMgmt.updateFailed'),
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
        className="space-y-4 sm:space-y-6 overflow-hidden"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="text-right min-w-0">
            <h1 className="text-lg sm:text-3xl font-bold truncate">{t('shipmentMgmt.title')}</h1>
            <p className="text-[11px] sm:text-sm text-muted-foreground truncate">{t('shipmentMgmt.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
              <DialogHeader className="text-right">
                <DialogTitle>{t('shipmentMgmt.createNew')}</DialogTitle>
                <DialogDescription>
                  {t('shipmentMgmt.enterDetails')}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label>{t('shipmentMgmt.generator')}</Label>
                    <Select
                      value={newShipment.generator_id}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, generator_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('shipmentMgmt.choose')} />
                      </SelectTrigger>
                      <SelectContent>
                        {generators.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('shipmentMgmt.transporter')}</Label>
                    <Select
                      value={newShipment.transporter_id}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, transporter_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('shipmentMgmt.choose')} />
                      </SelectTrigger>
                      <SelectContent>
                        {transporters.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('shipmentMgmt.recycler')}</Label>
                    <Select
                      value={newShipment.recycler_id}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, recycler_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('shipmentMgmt.choose')} />
                      </SelectTrigger>
                      <SelectContent>
                        {recyclers.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label>{t('shipmentMgmt.wasteType')}</Label>
                    <Select
                      value={newShipment.waste_type}
                      onValueChange={(v) => setNewShipment(prev => ({ ...prev, waste_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('shipmentMgmt.choose')} />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteTypes.map(w => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('shipmentMgmt.quantity')}</Label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newShipment.quantity}
                      onChange={(e) => setNewShipment(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('shipmentMgmt.pickupAddress')}</Label>
                  <Input
                    placeholder={t('shipmentMgmt.pickupPlaceholder')}
                    value={newShipment.pickup_address}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, pickup_address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('shipmentMgmt.deliveryAddress')}</Label>
                  <Input
                    placeholder={t('shipmentMgmt.deliveryPlaceholder')}
                    value={newShipment.delivery_address}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, delivery_address: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('shipmentMgmt.notes')}</Label>
                  <Textarea
                    placeholder={t('shipmentMgmt.notesPlaceholder')}
                    value={newShipment.notes}
                    onChange={(e) => setNewShipment(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateShipment} disabled={createLoading} className="w-full sm:w-auto">
                  {createLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {t('shipmentMgmt.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => fetchData()}
              disabled={loading}
              title={t('shipmentMgmt.refreshPage')}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-2.5 sm:p-6 text-right">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t('shipmentMgmt.totalShipments')}</p>
                  <p className="text-lg sm:text-3xl font-bold">{statsData.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-2.5 sm:p-6 text-right">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t('shipmentMgmt.activeShipments')}</p>
                  <p className="text-lg sm:text-3xl font-bold text-amber-600">{statsData.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-2.5 sm:p-6 text-right">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t('shipmentMgmt.completedShipments')}</p>
                  <p className="text-lg sm:text-3xl font-bold text-green-600">{statsData.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle>{t('shipmentMgmt.shipmentList')}</CardTitle>
            <CardDescription>{t('shipmentMgmt.shipmentListDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('shipmentMgmt.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('shipmentMgmt.allStatuses')}</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('shipmentMgmt.searchPlaceholder')}
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
                <p>{t('shipmentMgmt.noShipments')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center gap-3 px-2">
                  <Checkbox
                    checked={filteredShipments.length > 0 && selectedIds.size === filteredShipments.length}
                    onCheckedChange={() => {
                      if (selectedIds.size === filteredShipments.length) {
                        setSelectedIds(new Set());
                      } else {
                        setSelectedIds(new Set(filteredShipments.map(s => s.id)));
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">تحديد الكل ({filteredShipments.length})</span>
                </div>
                {filteredShipments.map((shipment) => (
                  <div key={shipment.id} className={`flex items-start gap-2 sm:gap-3 ${selectedIds.has(shipment.id) ? 'ring-1 ring-primary/30 rounded-lg' : ''}`}>
                    <div className="pt-5 pr-1 sm:pr-2 shrink-0">
                      <Checkbox
                        checked={selectedIds.has(shipment.id)}
                        onCheckedChange={() => {
                          setSelectedIds(prev => {
                            const next = new Set(prev);
                            if (next.has(shipment.id)) next.delete(shipment.id); else next.add(shipment.id);
                            return next;
                          });
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <ShipmentCard
                        shipment={shipment}
                        onStatusChange={fetchData}
                      />
                    </div>
                  </div>
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

      {/* Floating Batch Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-xl px-5 py-3 flex items-center gap-4"
            dir="rtl"
          >
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {selectedIds.size} محدد
            </Badge>
            <Button size="sm" className="gap-2" onClick={() => setBatchSignOpen(true)}>
              <PenTool className="w-4 h-4" />
              توقيع وختم جماعي
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <BatchSignatureDialog
        open={batchSignOpen}
        onOpenChange={setBatchSignOpen}
        documents={filteredShipments
          .filter(s => selectedIds.has(s.id))
          .map(s => ({
            id: s.id,
            documentType: 'shipment' as const,
            title: s.shipment_number,
            subtitle: `${s.generator?.name || ''} → ${s.recycler?.name || ''}`,
          }))}
        organizationId={organization?.id || ''}
        userId={user?.id || ''}
        onComplete={() => {
          setSelectedIds(new Set());
          fetchData();
        }}
      />
    </DashboardLayout>
  );
};

export default ShipmentManagement;
