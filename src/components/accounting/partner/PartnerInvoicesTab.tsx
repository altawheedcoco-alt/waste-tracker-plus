import { useState, useRef } from "react";
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
import { FileText, Search, Eye, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import InvoiceDetailDialog from "./InvoiceDetailDialog";
import { usePDFExport } from "@/hooks/usePDFExport";

interface PartnerInvoicesTabProps {
  partnerId: string;
  partnerName: string;
}

const PartnerInvoicesTab = ({ partnerId, partnerName }: PartnerInvoicesTabProps) => {
  const { organization } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, isExporting } = usePDFExport({
    filename: 'invoice',
    orientation: 'portrait',
    format: 'a4',
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["partner-invoices", organization?.id, partnerId],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "مسودة", variant: "secondary" },
      pending: { label: "معلقة", variant: "outline" },
      sent: { label: "مرسلة", variant: "default" },
      paid: { label: "مدفوعة", variant: "default" },
      partial: { label: "مدفوعة جزئياً", variant: "outline" },
      overdue: { label: "متأخرة", variant: "destructive" },
      cancelled: { label: "ملغاة", variant: "secondary" },
    };
    return statuses[status] || { label: status, variant: "default" };
  };

  const getInvoiceTypeBadge = (type: string) => {
    const types: Record<string, string> = {
      sales: "مبيعات",
      purchase: "مشتريات",
      service: "خدمات",
    };
    return types[type] || type;
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const paidAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const remainingAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            فواتير {partnerName}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلقة</SelectItem>
                <SelectItem value="sent">مرسلة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="partial">مدفوعة جزئياً</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
            <p className="text-2xl font-bold">{totalAmount.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">المدفوع</p>
            <p className="text-2xl font-bold text-green-600">{paidAmount.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">المتبقي</p>
            <p className="text-2xl font-bold text-orange-600">{remainingAmount.toLocaleString()} ج.م</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد فواتير</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>المدفوع</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const statusBadge = getStatusBadge(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell>{getInvoiceTypeBadge(invoice.invoice_type)}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.issue_date), "dd MMM yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date
                          ? format(new Date(invoice.due_date), "dd MMM yyyy", { locale: ar })
                          : "-"}
                      </TableCell>
                      <TableCell className="font-bold">
                        {invoice.total_amount?.toLocaleString()} {invoice.currency}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {invoice.paid_amount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {invoice.remaining_amount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="عرض"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="تحميل PDF"
                            disabled={isExporting}
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Invoice Detail Dialog */}
        <InvoiceDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          invoice={selectedInvoice}
          partnerName={partnerName}
        />
      </CardContent>
    </Card>
  );
};

export default PartnerInvoicesTab;
