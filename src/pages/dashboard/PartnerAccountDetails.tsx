import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowRight,
  Building2,
  CreditCard,
  FileText,
  Package,
  TrendingUp,
  TrendingDown,
  Settings,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
} from "lucide-react";
import PartnerPriceItemsTab from "@/components/accounting/partner/PartnerPriceItemsTab";
import PartnerInvoicesTab from "@/components/accounting/partner/PartnerInvoicesTab";
import PartnerPaymentsTab from "@/components/accounting/partner/PartnerPaymentsTab";
import PartnerStatementTab from "@/components/accounting/partner/PartnerStatementTab";
import PartnerSettingsTab from "@/components/accounting/partner/PartnerSettingsTab";

const PartnerAccountDetails = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Fetch partner organization details
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ["partner-details", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", partnerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch partner balance
  const { data: balance } = useQuery({
    queryKey: ["partner-balance", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id || !partnerId) return null;
      const { data, error } = await supabase
        .from("partner_balances")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Fetch partner account settings
  const { data: accountSettings } = useQuery({
    queryKey: ["partner-account-settings", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id || !partnerId) return null;
      const { data, error } = await supabase
        .from("partner_account_settings")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Fetch invoices count
  const { data: invoicesStats } = useQuery({
    queryKey: ["partner-invoices-stats", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id || !partnerId) return { total: 0, pending: 0, totalAmount: 0 };
      
      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, total_amount, remaining_amount")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId);

      if (error) throw error;
      
      return {
        total: data?.length || 0,
        pending: data?.filter(inv => inv.status === 'pending' || inv.status === 'sent').length || 0,
        totalAmount: data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
        remainingAmount: data?.reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0) || 0,
      };
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Fetch payments count
  const { data: paymentsStats } = useQuery({
    queryKey: ["partner-payments-stats", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id || !partnerId) return { total: 0, totalAmount: 0 };
      
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, status")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .eq("status", "completed");

      if (error) throw error;
      
      return {
        total: data?.length || 0,
        totalAmount: data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      };
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Fetch price items count
  const { data: priceItemsCount } = useQuery({
    queryKey: ["partner-price-items-count", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id || !partnerId) return 0;
      
      const { count, error } = await supabase
        .from("partner_price_items")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  const getOrganizationTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      generator: { label: "مولد نفايات", variant: "default" },
      transporter: { label: "ناقل", variant: "secondary" },
      recycler: { label: "مُعيد تدوير", variant: "outline" },
    };
    return types[type] || { label: type, variant: "default" };
  };

  if (partnerLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">لم يتم العثور على الشريك</h2>
          <Button onClick={() => navigate("/dashboard/accounting")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للحسابات
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const balanceAmount = balance?.balance || 0;
  const isCreditor = balanceAmount > 0;
  const typeBadge = getOrganizationTypeBadge(partner.organization_type);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/accounting")}
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{partner.name}</h1>
                <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                {accountSettings?.account_status && (
                  <Badge 
                    variant={accountSettings.account_status === 'active' ? 'default' : 'destructive'}
                  >
                    {accountSettings.account_status === 'active' ? 'نشط' : 'موقوف'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {partner.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {partner.phone}
                  </span>
                )}
                {partner.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {partner.email}
                  </span>
                )}
                {partner.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {partner.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className={`${isCreditor ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {isCreditor ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                الرصيد الحالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${isCreditor ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(balanceAmount).toLocaleString()} ج.م
              </div>
              <p className="text-xs text-muted-foreground">
                {isCreditor ? "دائن (لصالحنا)" : "مدين (علينا)"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoicesStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {invoicesStats?.pending || 0} معلقة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                المدفوعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentsStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {(paymentsStats?.totalAmount || 0).toLocaleString()} ج.م
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                الأصناف والأسعار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{priceItemsCount || 0}</div>
              <p className="text-xs text-muted-foreground">صنف مسجل</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                إجمالي الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(invoicesStats?.totalAmount || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">ج.م</p>
            </CardContent>
          </Card>
        </div>

        {/* Account Settings Summary */}
        {accountSettings && (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">حد الائتمان:</span>
                  <span className="font-medium">{accountSettings.credit_limit?.toLocaleString() || 0} ج.م</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">مدة السداد:</span>
                  <span className="font-medium">{accountSettings.payment_terms_days || 30} يوم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">نسبة الخصم:</span>
                  <span className="font-medium">{accountSettings.discount_percentage || 0}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">نسبة الضريبة:</span>
                  <span className="font-medium">{accountSettings.tax_rate || 14}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="items" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">الأصناف</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">الفواتير</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">المدفوعات</span>
            </TabsTrigger>
            <TabsTrigger value="statement" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">كشف الحساب</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <PartnerPriceItemsTab partnerId={partnerId!} partnerName={partner.name} />
          </TabsContent>

          <TabsContent value="invoices">
            <PartnerInvoicesTab partnerId={partnerId!} partnerName={partner.name} />
          </TabsContent>

          <TabsContent value="payments">
            <PartnerPaymentsTab partnerId={partnerId!} partnerName={partner.name} />
          </TabsContent>

          <TabsContent value="statement">
            <PartnerStatementTab partnerId={partnerId!} partnerName={partner.name} />
          </TabsContent>

          <TabsContent value="settings">
            <PartnerSettingsTab 
              partnerId={partnerId!} 
              partnerName={partner.name}
              currentSettings={accountSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnerAccountDetails;
