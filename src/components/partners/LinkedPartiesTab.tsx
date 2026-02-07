import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Factory,
  Truck,
  Recycle,
  Package,
  FileText,
  Banknote,
  Users,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LinkedPartiesTabProps {
  organizationId: string;
  organizationType?: string;
}

interface LinkedParty {
  id: string;
  name: string;
  type: 'generator' | 'transporter' | 'recycler';
  shipmentsCount: number;
  totalValue: number;
  totalQuantity: number;
  balance: number;
  contractsCount: number;
  lastActivity?: string;
}

interface DriverLink {
  id: string;
  name: string;
  phone?: string;
  shipmentsCount: number;
  organizationName?: string;
}

export default function LinkedPartiesTab({ organizationId, organizationType }: LinkedPartiesTabProps) {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('parties');

  // Fetch all shipments involving this organization
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['linked-parties-shipments', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, generator_id, transporter_id, recycler_id, actual_weight, status, created_at, driver_id')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Array<{
        id: string;
        generator_id: string | null;
        transporter_id: string | null;
        recycler_id: string | null;
        actual_weight: number | null;
        status: string;
        created_at: string;
        driver_id: string | null;
      }>;
    },
    enabled: !!organizationId,
  });

  // Fetch organizations involved in shipments
  const relatedOrgIds = useMemo(() => {
    const ids = new Set<string>();
    shipments.forEach(s => {
      if (s.generator_id && s.generator_id !== organizationId) ids.add(s.generator_id);
      if (s.transporter_id && s.transporter_id !== organizationId) ids.add(s.transporter_id);
      if (s.recycler_id && s.recycler_id !== organizationId) ids.add(s.recycler_id);
    });
    return Array.from(ids);
  }, [shipments, organizationId]);

  const { data: relatedOrgs = [] } = useQuery({
    queryKey: ['linked-organizations', relatedOrgIds],
    queryFn: async () => {
      if (relatedOrgIds.length === 0) return [];
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', relatedOrgIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: relatedOrgIds.length > 0,
  });

  // Fetch contracts with this organization
  const { data: contracts = [] } = useQuery({
    queryKey: ['linked-contracts', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('id, partner_organization_id, organization_id, status, value')
        .or(`organization_id.eq.${organizationId},partner_organization_id.eq.${organizationId}`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch deposits
  const { data: deposits = [] } = useQuery({
    queryKey: ['linked-deposits', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposits')
        .select('id, partner_organization_id, organization_id, amount')
        .or(`organization_id.eq.${organizationId},partner_organization_id.eq.${organizationId}`);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Fetch drivers involved in shipments
  const driverIds = useMemo(() => {
    const ids = new Set<string>();
    shipments.forEach(s => {
      if (s.driver_id) ids.add(s.driver_id);
    });
    return Array.from(ids);
  }, [shipments]);

  const { data: drivers = [] } = useQuery({
    queryKey: ['linked-drivers', driverIds],
    queryFn: async () => {
      if (driverIds.length === 0) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select('id, organization_id, profile:profiles(full_name, phone)')
        .in('id', driverIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: driverIds.length > 0,
  });

  // Calculate linked parties data
  const linkedParties = useMemo<LinkedParty[]>(() => {
    const partiesMap = new Map<string, LinkedParty>();

    relatedOrgs.forEach(org => {
      const orgShipments = shipments.filter(s => 
        s.generator_id === org.id || s.transporter_id === org.id || s.recycler_id === org.id
      );
      
      const orgContracts = contracts.filter(c => 
        c.partner_organization_id === org.id || c.organization_id === org.id
      );
      
      const orgDeposits = deposits.filter(d => 
        d.partner_organization_id === org.id
      );

      const totalQuantity = orgShipments.reduce((sum, s) => sum + (Number(s.actual_weight) || 0), 0);
      // Value will be calculated from partner waste types pricing
      const totalValue = totalQuantity; // Placeholder - actual pricing from partner_waste_types
      const totalDeposits = orgDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      
      const lastShipment = orgShipments[0];

      partiesMap.set(org.id, {
        id: org.id,
        name: org.name,
        type: org.organization_type as 'generator' | 'transporter' | 'recycler',
        shipmentsCount: orgShipments.length,
        totalValue,
        totalQuantity,
        balance: totalValue - totalDeposits,
        contractsCount: orgContracts.length,
        lastActivity: lastShipment?.created_at,
      });
    });

    return Array.from(partiesMap.values()).sort((a, b) => b.shipmentsCount - a.shipmentsCount);
  }, [relatedOrgs, shipments, contracts, deposits]);

  // Calculate drivers data
  const linkedDrivers = useMemo<DriverLink[]>(() => {
    return drivers.map(driver => {
      const driverShipments = shipments.filter(s => s.driver_id === driver.id);
      const driverOrg = relatedOrgs.find(o => o.id === driver.organization_id);
      
      return {
        id: driver.id,
        name: (driver.profile as any)?.full_name || 'سائق',
        phone: (driver.profile as any)?.phone,
        shipmentsCount: driverShipments.length,
        organizationName: driverOrg?.name,
      };
    }).sort((a, b) => b.shipmentsCount - a.shipmentsCount);
  }, [drivers, shipments, relatedOrgs]);

  // Stats
  const stats = useMemo(() => ({
    totalParties: linkedParties.length,
    generators: linkedParties.filter(p => p.type === 'generator').length,
    transporters: linkedParties.filter(p => p.type === 'transporter').length,
    recyclers: linkedParties.filter(p => p.type === 'recycler').length,
    totalShipments: shipments.length,
    totalContracts: contracts.length,
    totalDrivers: linkedDrivers.length,
  }), [linkedParties, shipments, contracts, linkedDrivers]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'generator': return <Factory className="h-4 w-4" />;
      case 'transporter': return <Truck className="h-4 w-4" />;
      case 'recycler': return <Recycle className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'مولد';
      case 'transporter': return 'ناقل';
      case 'recycler': return 'مدور';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'generator': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'transporter': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'recycler': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-muted';
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('ar-EG').format(amount);

  if (shipmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <LinkIcon className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.totalParties}</p>
            <p className="text-xs text-muted-foreground">جهة مرتبطة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalShipments}</p>
            <p className="text-xs text-muted-foreground">شحنة مشتركة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold">{stats.totalContracts}</p>
            <p className="text-xs text-muted-foreground">عقد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
            <p className="text-2xl font-bold">{stats.totalDrivers}</p>
            <p className="text-xs text-muted-foreground">سائق</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parties" className="gap-2">
            <Building2 className="h-4 w-4" />
            الجهات ({stats.totalParties})
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <User className="h-4 w-4" />
            السائقون ({stats.totalDrivers})
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            التوزيع
          </TabsTrigger>
        </TabsList>

        {/* Parties Tab */}
        <TabsContent value="parties" className="mt-4">
          {linkedParties.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد جهات مرتبطة</h3>
                <p className="text-muted-foreground">لم يتم تسجيل أي شحنات مع جهات أخرى بعد</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-4">
                {linkedParties.map(party => (
                  <Card 
                    key={party.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/dashboard/partner-account/${party.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className={cn('h-12 w-12', getTypeColor(party.type))}>
                            <AvatarFallback className="bg-transparent">
                              {getTypeIcon(party.type)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              {party.name}
                              <Badge variant="secondary" className={cn('text-[10px]', getTypeColor(party.type))}>
                                {getTypeLabel(party.type)}
                              </Badge>
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {party.shipmentsCount} شحنة
                              </span>
                              {party.contractsCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {party.contractsCount} عقد
                                </span>
                              )}
                              {party.lastActivity && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(party.lastActivity), 'dd MMM yyyy', { locale: ar })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            {party.balance > 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : party.balance < 0 ? (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : null}
                            <span className={cn(
                              'text-lg font-bold',
                              party.balance > 0 ? 'text-red-600' : party.balance < 0 ? 'text-emerald-600' : ''
                            )}>
                              {formatCurrency(Math.abs(party.balance))} ج.م
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {party.balance > 0 ? 'مستحق علينا' : party.balance < 0 ? 'مستحق لنا' : 'مسدد'}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm font-semibold">{formatCurrency(party.totalQuantity)}</p>
                          <p className="text-xs text-muted-foreground">كجم</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{formatCurrency(party.totalValue)} ج.م</p>
                          <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
                        </div>
                        <div>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            عرض الحساب
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="mt-4">
          {linkedDrivers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا يوجد سائقون مرتبطون</h3>
                <p className="text-muted-foreground">لم يتم تسجيل شحنات مع سائقين بعد</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {linkedDrivers.map(driver => (
                  <Card key={driver.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-primary/10">
                            <AvatarFallback className="bg-transparent text-primary">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{driver.name}</h4>
                            {driver.organizationName && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {driver.organizationName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant="secondary" className="gap-1">
                            <Package className="h-3 w-3" />
                            {driver.shipmentsCount} شحنة
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Factory className="h-4 w-4 text-blue-600" />
                  المولدون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{stats.generators}</p>
                <p className="text-xs text-muted-foreground">جهة مولدة</p>
              </CardContent>
            </Card>
            
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-amber-600" />
                  الناقلون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600">{stats.transporters}</p>
                <p className="text-xs text-muted-foreground">جهة ناقلة</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Recycle className="h-4 w-4 text-emerald-600" />
                  المدورون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">{stats.recyclers}</p>
                <p className="text-xs text-muted-foreground">جهة مدورة</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
