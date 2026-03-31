import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  PenTool,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import QuickReceiptButton from '@/components/receipts/QuickReceiptButton';
import QuickCertificateButton from '@/components/reports/QuickCertificateButton';
import BatchSignatureDialog from '@/components/signatures/BatchSignatureDialog';
import type { BatchDocument } from '@/components/signatures/BatchSignatureDialog';

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

const TransporterShipments = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const { t, language } = useLanguage();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchSignOpen, setBatchSignOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: t('shipments.allStatuses') },
    { value: 'new', label: t('shipments.new') },
    { value: 'approved', label: t('shipments.approved') },
    { value: 'in_transit', label: t('shipments.inTransit') },
    { value: 'delivered', label: t('shipments.delivered') },
    { value: 'confirmed', label: t('shipments.confirmed') },
  ];

  const wasteTypeLabels: Record<string, string> = {
    plastic: t('shipments.plastic'),
    paper: t('shipments.paper'),
    metal: t('shipments.metal'),
    glass: t('shipments.glass'),
    electronic: t('shipments.electronic'),
    organic: t('shipments.organic'),
    chemical: t('shipments.chemical'),
    medical: t('shipments.medical'),
    construction: t('shipments.construction'),
    other: t('shipments.other'),
  };

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
          id, shipment_number, waste_type, quantity, unit, status,
          created_at, pickup_address, delivery_address,
          generator_id, recycler_id, driver_id
        `)
        .eq('transporter_id', organization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      new: { label: t('shipments.new'), className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: t('shipments.approved'), className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      in_transit: { label: t('shipments.inTransit'), className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      delivered: { label: t('shipments.delivered'), className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' },
      confirmed: { label: t('shipments.confirmed'), className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300' },
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredShipments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShipments.map(s => s.id)));
    }
  };

  const batchDocuments: BatchDocument[] = filteredShipments
    .filter(s => selectedIds.has(s.id))
    .map(s => ({
      id: s.id,
      documentType: 'shipment' as const,
      title: s.shipment_number,
      subtitle: `${s.generator?.name || ''} → ${s.recycler?.name || ''}`,
    }));

  const { user } = useAuth();

  return (
    <DashboardLayout>
    <div className="space-y-4 sm:space-y-6 pb-20">
      {/* Back Button */}
      <BackButton />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">{t('shipments.management')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t('shipments.managementDesc')}</p>
        </div>
        <Button variant="eco" size="sm" className="w-full sm:w-auto" onClick={() => navigate('/dashboard/shipments/new')}>
          <Plus className="ml-2 h-4 w-4" />
          {t('shipments.newShipment')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">{t('shipments.totalShipments')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.active}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">{t('shipments.activeShipments')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Recycle className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.completed}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">{t('shipments.completed')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <LinkIcon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold">{stats.linkedPartners}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground">{t('shipments.linkedEntities')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('shipments.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] text-xs sm:text-sm">
                    <SelectValue placeholder={t('common.status')} />
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
              
              {/* Partner Filter - visible on all screens */}
              <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] text-xs sm:text-sm">
                    <SelectValue placeholder={t('shipments.allEntities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {t('shipments.allEntities')}
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
                          <span className="truncate">{partner.name}</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Shipments - Mobile Cards + Desktop Table */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base">{t('shipments.shipmentList')}</CardTitle>
          <CardDescription className="text-xs">
            {filteredShipments.length} {t('shipments.title')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-6">
              <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t('shipments.noShipments')}</p>
              <Button
                variant="eco"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/dashboard/shipments/new')}
              >
                <Plus className="ml-2 h-4 w-4" />
                {t('shipments.createFirst')}
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3">
                {filteredShipments.map((shipment) => (
                  <Card key={shipment.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(shipment.status)}
                          <QuickReceiptButton 
                            shipment={shipment} 
                            onSuccess={fetchShipments}
                            variant="ghost"
                            size="sm"
                          />
                        </div>
                        <span className="font-mono text-xs font-medium">{shipment.shipment_number}</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</span>
                          <span className="font-medium">{shipment.quantity} {shipment.unit}</span>
                        </div>
                        {shipment.generator?.name && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{shipment.generator.name}</span>
                          </div>
                        )}
                        {shipment.recycler?.name && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Recycle className="w-3 h-3" />
                            <span className="truncate">{shipment.recycler.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(shipment.created_at), 'dd MMM yyyy', { locale: language === 'ar' ? arLocale : undefined })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => navigate(`/dashboard/s/${shipment.shipment_number}`)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t('shipments.viewDetails')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center">
                      <Checkbox
                        checked={filteredShipments.length > 0 && selectedIds.size === filteredShipments.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-right">{t('shipments.shipmentNumber')}</TableHead>
                    <TableHead className="text-right">{t('shipments.wasteType')}</TableHead>
                    <TableHead className="text-right">{t('shipments.quantity')}</TableHead>
                    <TableHead className="text-right">{t('shipments.generator')}</TableHead>
                    <TableHead className="text-right">{t('shipments.recycler')}</TableHead>
                    <TableHead className="text-right">{t('shipments.driver')}</TableHead>
                    <TableHead className="text-right">{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.date')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment, index) => (
                    <motion.tr
                      key={shipment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`border-b hover:bg-muted/50 ${selectedIds.has(shipment.id) ? 'bg-primary/5' : ''}`}
                    >
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.has(shipment.id)}
                          onCheckedChange={() => toggleSelect(shipment.id)}
                        />
                      </TableCell>
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
                      <TableCell>{shipment.driver?.profile?.full_name || t('shipments.notAssigned')}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(shipment.created_at), 'dd MMM yyyy', { locale: language === 'ar' ? arLocale : undefined })}
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
                              <TooltipContent>{t('shipments.viewDetails')}</TooltipContent>
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
                                <TooltipContent>{t('shipments.createReceipt')}</TooltipContent>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>

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
      documents={batchDocuments}
      organizationId={organization?.id || ''}
      userId={user?.id || ''}
      onComplete={() => {
        setSelectedIds(new Set());
        fetchShipments();
      }}
    />
    </DashboardLayout>
  );
};

export default TransporterShipments;
