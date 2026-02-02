import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowRight, 
  Building2, 
  Factory,
  Recycle,
  Truck,
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  MapPin,
  Package,
  Scale,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import PartnerWasteTypes from '@/components/partners/PartnerWasteTypes';

export default function PartnerAccountDetails() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { organization } = useAuth();

  // Fetch partner organization details
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner-details', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', partnerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch shipments with this partner
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['partner-shipments', partnerId, organization?.id, organization?.organization_type],
    queryFn: async () => {
      if (!partnerId || !organization?.id) return [];
      
      let query = supabase.from('shipments').select('*');
      
      // Filter based on organization type and partner relationship
      if (organization?.organization_type === 'transporter') {
        query = query.eq('transporter_id', organization.id).or(`generator_id.eq.${partnerId},recycler_id.eq.${partnerId}`);
      } else if (organization?.organization_type === 'generator') {
        query = query.eq('generator_id', organization.id).or(`transporter_id.eq.${partnerId},recycler_id.eq.${partnerId}`);
      } else if (organization?.organization_type === 'recycler') {
        query = query.eq('recycler_id', organization.id).or(`generator_id.eq.${partnerId},transporter_id.eq.${partnerId}`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!organization?.id,
  });

  // Fetch partner waste types (for pricing)
  const { data: partnerWasteTypes = [] } = useQuery({
    queryKey: ['partner-waste-types-pricing', partnerId, organization?.id],
    queryFn: async () => {
      if (!partnerId || !organization?.id) return [];
      
      const { data, error } = await supabase
        .from('partner_waste_types')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('partner_organization_id', partnerId)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!organization?.id,
  });

  // Fetch invoices for this partner
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['partner-invoices', partnerId, organization?.id],
    queryFn: async () => {
      if (!partnerId || !organization?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('partner_organization_id', partnerId)
        .order('issue_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!organization?.id,
  });

  // Calculate shipment totals with pricing
  const shipmentsWithPricing = useMemo(() => {
    return shipments.map(shipment => {
      // Find matching waste type price
      const wastePrice = partnerWasteTypes.find(wt => {
        // Match by waste_description or waste_type
        const wasteDesc = shipment.waste_description?.toLowerCase() || '';
        const wasteTypeName = wt.waste_type?.toLowerCase() || '';
        return wasteDesc.includes(wasteTypeName) || wasteTypeName.includes(wasteDesc);
      });
      
      const pricePerUnit = wastePrice?.price_per_unit || 0;
      const quantity = Number(shipment.quantity) || 0;
      const total = pricePerUnit * quantity;
      
      return {
        ...shipment,
        pricePerUnit,
        calculatedTotal: total,
        hasPrice: pricePerUnit > 0,
      };
    });
  }, [shipments, partnerWasteTypes]);

  const totalShipmentValue = shipmentsWithPricing.reduce((sum, s) => sum + s.calculatedTotal, 0);
  const totalQuantity = shipmentsWithPricing.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: ar });
  };

  const getPartnerTypeInfo = (type: string) => {
    switch (type) {
      case 'generator':
        return { label: 'مولد', icon: Factory, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
      case 'recycler':
        return { label: 'مدور', icon: Recycle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      case 'transporter':
        return { label: 'ناقل', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
      default:
        return { label: 'شريك', icon: Building2, color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700">مدفوعة</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700">مدفوعة جزئياً</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-700">معلقة</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700">متأخرة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
  const balance = totalInvoiced - totalPaid;

  if (partnerLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium">لم يتم العثور على الشريك</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const typeInfo = getPartnerTypeInfo(partner.organization_type);
  const TypeIcon = typeInfo.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/partner-accounts')}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${typeInfo.bgColor} ${typeInfo.color}`}>
                <TypeIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{partner.name}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <Badge variant="outline">{typeInfo.label}</Badge>
                  {partner.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {partner.city}
                    </span>
                  )}
                  {partner.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {partner.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-400">إجمالي الفواتير</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                {formatCurrency(totalInvoiced)} ج.م
              </p>
              <p className="text-xs text-blue-600 mt-1">{invoices.length} فاتورة</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">المدفوع</span>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-2">
                {formatCurrency(totalPaid)} ج.م
              </p>
            </CardContent>
          </Card>

          <Card className={balance >= 0 
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          }>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {balance >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-amber-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${balance >= 0 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                  الرصيد المتبقي
                </span>
              </div>
              <p className={`text-2xl font-bold mt-2 ${balance >= 0 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'}`}>
                {formatCurrency(Math.abs(balance))} ج.م
              </p>
              <p className={`text-xs mt-1 ${balance >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {balance > 0 ? 'لنا' : balance < 0 ? 'علينا' : 'مسدد'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shipments & Invoices Tabs */}
        <Card>
          <Tabs defaultValue="shipments" dir="rtl">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="shipments" className="gap-2">
                  <Package className="h-4 w-4" />
                  الشحنات
                  {shipments.length > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                      {shipments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="h-4 w-4" />
                  الفواتير
                  {invoices.length > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 px-1.5">
                      {invoices.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Shipments Tab */}
              <TabsContent value="shipments" className="mt-0">
                {shipmentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : shipments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد شحنات مع هذا الشريك</p>
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-bold">رقم الشحنة</TableHead>
                            <TableHead className="font-bold">نوع المخلف</TableHead>
                            <TableHead className="text-center font-bold">الكمية</TableHead>
                            <TableHead className="text-center font-bold">السعر/وحدة</TableHead>
                            <TableHead className="text-center font-bold">الإجمالي</TableHead>
                            <TableHead className="text-center font-bold">الحالة</TableHead>
                            <TableHead className="text-center font-bold">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shipmentsWithPricing.map((shipment) => (
                            <TableRow 
                              key={shipment.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
                            >
                              <TableCell className="font-medium font-mono">
                                {shipment.shipment_number}
                              </TableCell>
                              <TableCell>
                                {shipment.waste_description || shipment.waste_type}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-medium">{formatCurrency(Number(shipment.quantity) || 0)}</span>
                                <span className="text-muted-foreground text-xs mr-1">{shipment.unit}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                {shipment.hasPrice ? (
                                  <span className="text-green-600 font-medium">
                                    {formatCurrency(shipment.pricePerUnit)} ج.م
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">غير محدد</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {shipment.hasPrice ? (
                                  <span className="font-bold text-primary">
                                    {formatCurrency(shipment.calculatedTotal)} ج.م
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={shipment.status === 'confirmed' ? 'default' : 'outline'}>
                                  {shipment.status === 'new' && 'جديدة'}
                                  {shipment.status === 'approved' && 'موافق عليها'}
                                  {shipment.status === 'collecting' && 'قيد التجميع'}
                                  {shipment.status === 'in_transit' && 'قيد النقل'}
                                  {shipment.status === 'delivered' && 'تم التسليم'}
                                  {shipment.status === 'confirmed' && 'مؤكدة'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {formatDate(shipment.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Shipments Summary */}
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">عدد الشحنات</p>
                          <p className="text-lg font-bold">{shipments.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">إجمالي الكمية</p>
                          <p className="text-lg font-bold">{formatCurrency(totalQuantity)} <span className="text-xs font-normal">وحدة</span></p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">شحنات بسعر محدد</p>
                          <p className="text-lg font-bold">{shipmentsWithPricing.filter(s => s.hasPrice).length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
                          <p className="text-lg font-bold text-primary">{formatCurrency(totalShipmentValue)} ج.م</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="mt-0">
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد فواتير لهذا الشريك</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-bold">رقم الفاتورة</TableHead>
                          <TableHead className="text-center font-bold">التاريخ</TableHead>
                          <TableHead className="text-center font-bold">المبلغ</TableHead>
                          <TableHead className="text-center font-bold">المدفوع</TableHead>
                          <TableHead className="text-center font-bold">المتبقي</TableHead>
                          <TableHead className="text-center font-bold">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => {
                          const remaining = (Number(invoice.total_amount) || 0) - (Number(invoice.paid_amount) || 0);
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell className="text-center">{formatDate(invoice.issue_date)}</TableCell>
                              <TableCell className="text-center">{formatCurrency(Number(invoice.total_amount) || 0)} ج.م</TableCell>
                              <TableCell className="text-center text-green-600">{formatCurrency(Number(invoice.paid_amount) || 0)} ج.م</TableCell>
                              <TableCell className={`text-center ${remaining > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                {formatCurrency(remaining)} ج.م
                              </TableCell>
                              <TableCell className="text-center">
                                {getInvoiceStatusBadge(invoice.status)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Waste Types Section */}
        <PartnerWasteTypes partnerId={partnerId!} isExternal={false} />
      </div>
    </DashboardLayout>
  );
}
