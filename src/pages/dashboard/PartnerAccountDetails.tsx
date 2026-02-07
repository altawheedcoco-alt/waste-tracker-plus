import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Package,
  FileText,
  BookOpen,
  ArrowRight,
  Settings2,
  Layers,
  Plus,
  CalendarRange,
  Link as LinkIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Import new account components
import PartnerHeader from '@/components/accounts/PartnerHeader';
import PartnerQuickStats from '@/components/accounts/PartnerQuickStats';
import ShipmentsAccountView from '@/components/accounts/ShipmentsAccountView';
import InvoicesAccountView from '@/components/accounts/InvoicesAccountView';
import AccountLedger, { LedgerEntry } from '@/components/accounts/AccountLedger';
import DetailedAccountLedger from '@/components/accounts/DetailedAccountLedger';
import WasteTypeAccountBreakdown from '@/components/accounts/WasteTypeAccountBreakdown';
import PartnerWasteTypes from '@/components/partners/PartnerWasteTypes';
import DepositButton from '@/components/deposits/DepositButton';
import CreateInvoiceDialog from '@/components/invoices/CreateInvoiceDialog';
import AccountPeriodsManager from '@/components/accounts/AccountPeriodsManager';
import LinkedPartiesTab from '@/components/partners/LinkedPartiesTab';

export default function PartnerAccountDetails() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

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

  // Fetch shipments with this partner - BIDIRECTIONAL (works for all partners)
  const { data: shipments = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['partner-shipments', partnerId, organization?.id],
    queryFn: async () => {
      if (!partnerId || !organization?.id) return [];
      
      // Get all shipments where BOTH the current org AND the partner are involved
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
        .or(`generator_id.eq.${partnerId},transporter_id.eq.${partnerId},recycler_id.eq.${partnerId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filter to only shipments where BOTH orgs are involved
      return (data || []).filter(shipment => {
        const parties = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id];
        return parties.includes(organization.id) && parties.includes(partnerId);
      });
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

  // Fetch deposits for this partner
  const { data: deposits = [], isLoading: depositsLoading } = useQuery({
    queryKey: ['partner-deposits', partnerId, organization?.id],
    queryFn: async () => {
      if (!partnerId || !organization?.id) return [];
      const { data, error } = await supabase
        .from('deposits')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('partner_organization_id', partnerId)
        .order('deposit_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!organization?.id,
  });

  // Calculate shipment totals with pricing - exclude cancelled
  const shipmentsWithPricing = useMemo(() => {
    return shipments.map(shipment => {
      const wastePrice = partnerWasteTypes.find(wt => {
        const wasteDesc = (shipment.waste_description || '').toLowerCase();
        const wasteTypeName = (wt.waste_type || '').toLowerCase();
        return wasteDesc.includes(wasteTypeName) || wasteTypeName.includes(wasteDesc);
      });
      
      const pricePerUnit = wastePrice?.price_per_unit || 0;
      const quantity = Number(shipment.quantity) || 0;
      const isCancelled = !!(shipment as any).cancelled_at;
      const total = isCancelled ? 0 : pricePerUnit * quantity; // إذا ملغاة = 0
      
      return {
        ...shipment,
        pricePerUnit,
        calculatedTotal: total,
        hasPrice: pricePerUnit > 0,
        cancelled_at: (shipment as any).cancelled_at,
        cancellation_reason: (shipment as any).cancellation_reason,
      };
    });
  }, [shipments, partnerWasteTypes]);

  // Calculate totals - exclude cancelled shipments
  const activeShipments = shipmentsWithPricing.filter(s => !s.cancelled_at);
  const cancelledShipments = shipmentsWithPricing.filter(s => !!s.cancelled_at);

  // Calculate totals
  const totalShipmentValue = activeShipments.reduce((sum, s) => sum + s.calculatedTotal, 0);
  const cancelledShipmentsValue = cancelledShipments.reduce((sum, s) => sum + (s.pricePerUnit * (Number(s.quantity) || 0)), 0);
  const totalQuantity = activeShipments.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
  const totalPaidInvoices = invoices.reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
  const totalDeposits = deposits.reduce((sum, dep) => sum + (Number(dep.amount) || 0), 0);
  const totalPaid = totalPaidInvoices + totalDeposits;
  
  // Balance calculation depends on organization type
  // Generator: shipment value is what they should receive, deposits are what they received
  // Transporter/Recycler: shipment value is what they owe, deposits are what they paid
  const isGeneratorOrg = organization?.organization_type === 'generator';
  const balance = isGeneratorOrg 
    ? totalShipmentValue - totalPaid  // للمولد: القيمة المستحقة - المدفوع = الباقي لنا
    : totalInvoiced - totalPaid;       // للناقل/المدور: المفوتر - المدفوع = الباقي علينا

  // Refresh deposits callback
  const refreshDeposits = () => {
    queryClient.invalidateQueries({ queryKey: ['partner-deposits', partnerId, organization?.id] });
  };

  // Determine accounting direction based on organization type
  // Generator: pays for waste removal → shipment is CREDIT (لنا - they owe us), deposit is DEBIT (علينا - we received)
  // Transporter/Recycler: receives waste → shipment is DEBIT (علينا - we owe them), deposit is CREDIT (لنا - we paid)
  const isGenerator = organization?.organization_type === 'generator';

  // Generate ledger entries
  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    const entries: LedgerEntry[] = [];

    // Add shipments as entries - check if cancelled
    shipmentsWithPricing.forEach(shipment => {
      const isCancelled = !!shipment.cancelled_at;
      
      if (shipment.hasPrice && shipment.calculatedTotal > 0) {
        const amount = isCancelled ? 0 : shipment.calculatedTotal;
        
        entries.push({
          id: `shipment-${shipment.id}`,
          date: shipment.created_at,
          type: 'shipment',
          description: isCancelled 
            ? `[ملغاة] ${shipment.waste_description || shipment.waste_type || 'شحنة'}`
            : (shipment.waste_description || shipment.waste_type || 'شحنة'),
          quantity: Number(shipment.quantity) || 0,
          unit: shipment.unit || 'وحدة',
          unitPrice: shipment.pricePerUnit,
          // للمولد: الشحنة = لنا (دائن) - ننتظر الدفع من الناقل
          // للناقل/المدور: الشحنة = علينا (مدين) - مستحق للشريك
          debit: isGenerator ? 0 : amount,
          credit: isGenerator ? amount : 0,
          reference: shipment.shipment_number,
          isCancelled,
          notes: (shipment as any).account_notes || '',
          shipmentId: shipment.id,
        });
      }
    });

    // Add invoices as entries (when paid)
    invoices.forEach(invoice => {
      if (Number(invoice.paid_amount) > 0) {
        const amount = Number(invoice.paid_amount) || 0;
        entries.push({
          id: `payment-${invoice.id}`,
          date: invoice.issue_date,
          type: 'payment',
          description: `دفعة فاتورة - ${invoice.invoice_number}`,
          // للمولد: الدفعة = علينا (مدين) - تم استلام الدفع
          // للناقل/المدور: الدفعة = لنا (دائن) - تم الدفع للشريك
          debit: isGenerator ? amount : 0,
          credit: isGenerator ? 0 : amount,
          reference: invoice.invoice_number,
        });
      }
    });

    // Add deposits as entries
    deposits.forEach(deposit => {
      const amount = Number(deposit.amount) || 0;
      entries.push({
        id: `deposit-${deposit.id}`,
        date: deposit.deposit_date,
        type: 'deposit',
        description: `إيداع - ${deposit.depositor_name}`,
        // للمولد: الإيداع = علينا (مدين) - تم استلام المبلغ
        // للناقل/المدور: الإيداع = لنا (دائن) - تم الدفع للشريك
        debit: isGenerator ? amount : 0,
        credit: isGenerator ? 0 : amount,
        reference: deposit.reference_number || '-',
        depositId: deposit.id,
        receiptUrl: deposit.receipt_url || undefined,
        depositorName: deposit.depositor_name || undefined,
      });
    });

    // Sort by date
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shipmentsWithPricing, invoices, deposits, isGenerator]);

  if (partnerLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Building2 className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">لم يتم العثور على الشريك</p>
          <Button 
            variant="outline" 
            className="mt-4 gap-2" 
            onClick={() => navigate('/dashboard/partner-accounts')}
          >
            <ArrowRight className="h-4 w-4" />
            العودة لقائمة الشركاء
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PartnerHeader 
          partner={partner} 
          ledgerEntries={ledgerEntries}
          shipments={shipmentsWithPricing}
          organizationName={organization?.name}
        />

        {/* Quick Stats */}
        <PartnerQuickStats
          totalShipments={shipments.length}
          totalShipmentValue={totalShipmentValue}
          totalInvoiced={totalInvoiced}
          totalPaid={totalPaid}
          balance={balance}
          totalQuantity={totalQuantity}
          isGenerator={isGeneratorOrg}
          totalDeposits={totalDeposits}
          totalPaidInvoices={totalPaidInvoices}
          cancelledShipmentsCount={cancelledShipments.length}
          cancelledShipmentsValue={cancelledShipmentsValue}
          activeShipmentsCount={activeShipments.length}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full max-w-5xl grid-cols-7 mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <BookOpen className="h-4 w-4" />
              كشف الحساب
            </TabsTrigger>
            <TabsTrigger value="linked" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              الجهات المرتبطة
            </TabsTrigger>
            <TabsTrigger value="deferred" className="gap-2">
              <CalendarRange className="h-4 w-4" />
              الحساب الآجل
            </TabsTrigger>
            <TabsTrigger value="waste-types" className="gap-2">
              <Layers className="h-4 w-4" />
              حسب المخلف
              {shipmentsWithPricing.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">
                  {new Set(shipmentsWithPricing.map(s => s.waste_description || s.waste_type || 'غير محدد')).size}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-2">
              <Package className="h-4 w-4" />
              الشحنات
              {shipments.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">
                  {shipments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              الفواتير
              {invoices.length > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">
                  {invoices.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings2 className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Overview - Detailed Account Ledger */}
          <TabsContent value="overview" className="mt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  سجل حساب الشريك المفصل
                </h3>
                <DepositButton
                  preselectedPartnerId={partnerId}
                  preselectedPartnerType="organization"
                  onSuccess={refreshDeposits}
                />
              </div>
              <DetailedAccountLedger
                partnerName={partner.name}
                partnerType={partner.organization_type || 'guest'}
                entries={ledgerEntries}
                organizationName={organization?.name}
                isGenerator={isGeneratorOrg}
                onEntryClick={(entry) => {
                  if (entry.type === 'shipment' && entry.reference) {
                    navigate(`/dashboard/s/${entry.reference}`);
                  }
                }}
                onDepositUpdated={refreshDeposits}
              />
            </div>
          </TabsContent>

          {/* Linked Parties Tab */}
          <TabsContent value="linked" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  الجهات المرتبطة - الشحنات والعقود والأرصدة المشتركة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {partnerId && (
                  <LinkedPartiesTab
                    organizationId={partnerId}
                    organizationType={partner.organization_type}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deferred Account Tab */}
          <TabsContent value="deferred" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5" />
                  الحساب الآجل - الفترات المحاسبية
                </CardTitle>
              </CardHeader>
              <CardContent>
                {organization?.id && (
                  <AccountPeriodsManager
                    organizationId={organization.id}
                    partnerOrganizationId={partnerId}
                    partnerName={partner.name}
                    partnerType={partner.organization_type || 'guest'}
                    entries={ledgerEntries}
                    currentBalance={balance}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Waste Types Breakdown Tab */}
          <TabsContent value="waste-types" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  حسابات المخلفات حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WasteTypeAccountBreakdown
                  shipments={shipmentsWithPricing}
                  deposits={deposits}
                  isGenerator={isGeneratorOrg}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  شحنات الشريك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentsAccountView 
                  shipments={shipmentsWithPricing}
                  isLoading={shipmentsLoading}
                  onRefresh={() => {
                    queryClient.invalidateQueries({ queryKey: ['partner-shipments', partnerId] });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  فواتير الشريك
                </CardTitle>
                <Button onClick={() => setShowCreateInvoice(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  إنشاء فاتورة
                </Button>
              </CardHeader>
              <CardContent>
                <InvoicesAccountView 
                  invoices={invoices}
                  isLoading={invoicesLoading}
                  onCreateInvoice={() => setShowCreateInvoice(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Waste Types */}
          <TabsContent value="settings" className="mt-0">
            <PartnerWasteTypes partnerId={partnerId!} isExternal={false} />
          </TabsContent>
        </Tabs>

        {/* Create Invoice Dialog */}
        <CreateInvoiceDialog
          open={showCreateInvoice}
          onOpenChange={setShowCreateInvoice}
          partnerId={partnerId!}
          partnerName={partner?.name || ''}
          partnerType={partner?.organization_type}
          availableShipments={shipmentsWithPricing}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['partner-invoices', partnerId] });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
