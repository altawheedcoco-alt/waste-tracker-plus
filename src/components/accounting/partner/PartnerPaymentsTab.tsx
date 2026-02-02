import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Search, Eye, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PartnerPaymentsTabProps {
  partnerId: string;
  partnerName: string;
}

const PartnerPaymentsTab = ({ partnerId, partnerName }: PartnerPaymentsTabProps) => {
  const { organization } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["partner-payments", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          invoice:invoices(invoice_number)
        `)
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: "نقدي",
      bank_transfer: "تحويل بنكي",
      check: "شيك",
      card: "بطاقة",
      other: "أخرى",
    };
    return methods[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "معلق", variant: "secondary" },
      completed: { label: "مكتمل", variant: "default" },
      cancelled: { label: "ملغي", variant: "destructive" },
      bounced: { label: "مرتجع", variant: "destructive" },
    };
    return statuses[status] || { label: status, variant: "default" };
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.payment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || payment.payment_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const incomingTotal = filteredPayments
    .filter((p) => p.payment_type === "incoming" && p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const outgoingTotal = filteredPayments
    .filter((p) => p.payment_type === "outgoing" && p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            مدفوعات {partnerName}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-48"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="incoming">واردة</SelectItem>
                <SelectItem value="outgoing">صادرة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-500/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ArrowDownCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-muted-foreground">المدفوعات الواردة</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{incomingTotal.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ArrowUpCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-muted-foreground">المدفوعات الصادرة</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{outgoingTotal.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">صافي الحركة</p>
            <p className={`text-2xl font-bold ${incomingTotal - outgoingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(incomingTotal - outgoingTotal).toLocaleString()} ج.م
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد مدفوعات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الدفعة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const statusBadge = getStatusBadge(payment.status);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.payment_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {payment.payment_type === "incoming" ? (
                            <ArrowDownCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span>{payment.payment_type === "incoming" ? "وارد" : "صادر"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.payment_date), "dd MMM yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                      <TableCell className={`font-bold ${payment.payment_type === "incoming" ? 'text-green-600' : 'text-red-600'}`}>
                        {payment.payment_type === "incoming" ? "+" : "-"}
                        {payment.amount?.toLocaleString()} {payment.currency}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.invoice?.invoice_number || "-"}
                      </TableCell>
                      <TableCell>{payment.reference_number || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerPaymentsTab;
