import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  MapPin,
  Calendar,
  Truck,
  Building2,
  Recycle,
  FileCheck,
  Factory,
  Link as LinkIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import QuickReceiptButton from '@/components/receipts/QuickReceiptButton';
import QuickCertificateButton from '@/components/reports/QuickCertificateButton';

interface LinkedPartner {
  id: string;
  name: string;
  type: 'generator' | 'recycler';
  shipmentsCount: number;
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
  generator_id: string;
  recycler_id: string | null;
  driver_id: string | null;
  generator: { id: string; name: string } | null;
  recycler: { id: string; name: string } | null;
  driver: { profile: { full_name: string } | null } | null;
}

const statusOptions = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'new', label: 'جديدة' },
  { value: 'approved', label: 'معتمدة' },
  { value: 'in_transit', label: 'في الطريق' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'confirmed', label: 'مؤكدة' },
];

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

const TransporterShipments = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');

  useEffect(() => {
    if (organization?.id) {
      fetchShipments();
    }
  }, [organization?.id]);

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
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
          generator_id,
          recycler_id,
          driver_id
        `)
        .eq('transporter_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch organizations for enrichment
      const orgIds = [...new Set([
        ...(data || []).map(s => s.generator_id).filter(Boolean),
        ...(data || []).map(s => s.recycler_id).filter(Boolean),
      ])] as string[];

      const orgsMap: Record<string, { id: string; name: string }> = {};
      if (orgIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        orgsData?.forEach(o => { orgsMap[o.id] = { id: o.id, name: o.name }; });
      }

      // Fetch drivers
      const driverIds = [...new Set((data || []).map(s => s.driver_id).filter(Boolean))] as string[];
      const driversMap: Record<string, { profile?: { full_name: string } }> = {};
      if (driverIds.length > 0) {
        const { data: driversData } = await supabase
          .from('drivers')
          .select('id, profile:profiles(full_name)')
          .in('id', driverIds);
        driversData?.forEach(d => {
          driversMap[d.id] = { profile: Array.isArray(d.profile) ? d.profile[0] : d.profile };
        });
      }

      const enriched = (data || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: s.driver_id ? driversMap[s.driver_id] || null : null,
      }));

      setShipments(enriched as unknown as Shipment[]);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      new: { label: 'جديدة', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: 'معتمدة', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      in_transit: { label: 'في الطريق', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      delivered: { label: 'تم التسليم', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
      confirmed: { label: 'مؤكدة', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Calculate linked partners (generators and recyclers)
  const linkedPartners = useMemo<LinkedPartner[]>(() => {
    const partnersMap = new Map<string, LinkedPartner>();
    
    shipments.forEach(shipment => {
      // Add generator as linked partner
      if (shipment.generator?.id && shipment.generator?.name) {
        const existing = partnersMap.get(shipment.generator.id);
        if (existing) {
          existing.shipmentsCount++;
        } else {
          partnersMap.set(shipment.generator.id, {
            id: shipment.generator.id,
            name: shipment.generator.name,
            type: 'generator',
            shipmentsCount: 1,
          });
        }
      }
      
      // Add recycler as linked partner
      if (shipment.recycler?.id && shipment.recycler?.name) {
        const existing = partnersMap.get(shipment.recycler.id);
        if (existing) {
          existing.shipmentsCount++;
        } else {
          partnersMap.set(shipment.recycler.id, {
            id: shipment.recycler.id,
            name: shipment.recycler.name,
            type: 'recycler',
            shipmentsCount: 1,
          });
        }
      }
    });
    
    return Array.from(partnersMap.values()).sort((a, b) => b.shipmentsCount - a.shipmentsCount);
  }, [shipments]);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.generator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.recycler?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    
    // Partner filter
    const matchesPartner = partnerFilter === 'all' || 
      shipment.generator_id === partnerFilter || 
      shipment.recycler_id === partnerFilter;

    return matchesSearch && matchesStatus && matchesPartner;
  });

  const stats = {
    total: shipments.length,
    active: shipments.filter(s => ['new', 'approved', 'in_transit'].includes(s.status)).length,
    completed: shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length,
    linkedPartners: linkedPartners.length,
  };

  return (
    <DashboardLayout>
    <div className="space-y-6">
      {/* Back Button */}
      <BackButton />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الشحنات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع شحنات النفايات</p>
        </div>
        <Button variant="eco" onClick={() => navigate('/dashboard/shipments/new')}>
          <Plus className="ml-2 h-4 w-4" />
          شحنة جديدة
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">شحنات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Recycle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-sm text-muted-foreground">مكتملة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.linkedPartners}</p>
              <p className="text-sm text-muted-foreground">جهة مرتبطة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الشحنة أو اسم الشركة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Partner Filter */}
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="الجهة المرتبطة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      جميع الجهات
                    </div>
                  </SelectItem>
                  {linkedPartners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      <div className="flex items-center gap-2">
                        {partner.type === 'generator' ? (
                          <Factory className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Recycle className="h-4 w-4 text-emerald-600" />
                        )}
                        <span>{partner.name}</span>
                        <Badge variant="secondary" className="text-[10px] mr-1">
                          {partner.shipmentsCount}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشحنات</CardTitle>
          <CardDescription>
            {filteredShipments.length} شحنة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">لا توجد شحنات</p>
              <Button
                variant="eco"
                className="mt-4"
                onClick={() => navigate('/dashboard/shipments/new')}
              >
                <Plus className="ml-2 h-4 w-4" />
                إنشاء أول شحنة
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الشحنة</TableHead>
                    <TableHead className="text-right">نوع النفايات</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">المولد</TableHead>
                    <TableHead className="text-right">المُعيد</TableHead>
                    <TableHead className="text-right">السائق</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment, index) => (
                    <motion.tr
                      key={shipment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{shipment.shipment_number}</TableCell>
                      <TableCell>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</TableCell>
                      <TableCell>{shipment.quantity} {shipment.unit}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          {shipment.generator?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Recycle className="w-3 h-3 text-muted-foreground" />
                          {shipment.recycler?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{shipment.driver?.profile?.full_name || 'غير محدد'}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(shipment.created_at), 'dd MMM yyyy', { locale: ar })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/dashboard/s/${shipment.shipment_number}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>عرض التفاصيل</TooltipContent>
                            </Tooltip>
                            
                            {/* Quick Receipt Button - Show prominently for active shipments */}
                            {['approved', 'in_transit'].includes(shipment.status) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <QuickReceiptButton 
                                      shipment={shipment} 
                                      onSuccess={fetchShipments}
                                      variant="default"
                                      size="sm"
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>إنشاء شهادة استلام</TooltipContent>
                              </Tooltip>
                            )}
                            {/* Quick Certificate Button */}
                            {['delivered', 'confirmed'].includes(shipment.status) && (
                              <QuickCertificateButton 
                                shipment={shipment} 
                                onSuccess={fetchShipments}
                                variant="ghost"
                                size="sm"
                                showLabel={false}
                              />
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
};

export default TransporterShipments;
