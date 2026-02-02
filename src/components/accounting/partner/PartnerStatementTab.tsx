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
import { FileText, Printer, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface PartnerStatementTabProps {
  partnerId: string;
  partnerName: string;
}

interface LedgerEntry {
  id: string;
  serial: number;
  date: string;
  type: "invoice" | "payment" | "shipment";
  typeLabel: string;
  currentDebt: number;
  goods: number;
  paid: number;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

const PartnerStatementTab = ({ partnerId, partnerName }: PartnerStatementTabProps) => {
  const { organization } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["partner-ledger-invoices", organization?.id, partnerId, dateFrom, dateTo],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("invoices")
        .select(`
          id, invoice_number, issue_date, total_amount, paid_amount, remaining_amount, notes, invoice_type,
          invoice_items(shipment_id, waste_type, waste_quantity, unit_price, total_price, quantity)
        `)
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId);

      if (dateFrom) query = query.gte("issue_date", dateFrom);
      if (dateTo) query = query.lte("issue_date", dateTo);

      const { data, error } = await query.order("issue_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Fetch payments
  const { data: payments = [] } = useQuery({
    queryKey: ["partner-ledger-payments", organization?.id, partnerId, dateFrom, dateTo],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("payments")
        .select("id, payment_number, payment_date, amount, payment_type, payment_method, notes")
        .eq("organization_id", organization.id)
        .eq("partner_organization_id", partnerId)
        .eq("status", "completed");

      if (dateFrom) query = query.gte("payment_date", dateFrom);
      if (dateTo) query = query.lte("payment_date", dateTo);

      const { data, error } = await query.order("payment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Build ledger entries
  const buildLedger = (): LedgerEntry[] => {
    const entries: { date: string; data: Omit<LedgerEntry, 'serial' | 'currentDebt'> }[] = [];

    // Add invoices
    invoices.forEach((inv: any) => {
      const isReceivable = inv.invoice_type === 'sales';
      const items = inv.invoice_items || [];
      const firstItem = items.length > 0 ? items[0] : null;
      
      const totalQty = items.reduce((sum: number, item: any) => sum + (item.quantity || item.waste_quantity || 0), 0);
      const avgPrice = totalQty > 0 ? (inv.total_amount / totalQty) : 0;
      
      entries.push({
        date: inv.issue_date,
        data: {
          id: inv.id,
          date: inv.issue_date,
          type: "invoice",
          typeLabel: isReceivable ? 'فاتورة مبيعات' : 'فاتورة مشتريات',
          goods: isReceivable ? inv.total_amount : 0,
          paid: inv.paid_amount || 0,
          productName: firstItem?.waste_type || 'خدمة',
          price: avgPrice,
          quantity: totalQty,
          total: inv.total_amount || 0,
        }
      });
    });

    // Add payments
    payments.forEach((pay: any) => {
      const isIncoming = pay.payment_type === "incoming";
      entries.push({
        date: pay.payment_date,
        data: {
          id: pay.id,
          date: pay.payment_date,
          type: "payment",
          typeLabel: isIncoming ? 'دفعة واردة' : 'دفعة صادرة',
          goods: 0,
          paid: pay.amount || 0,
          productName: getPaymentMethodLabel(pay.payment_method),
          price: 0,
          quantity: 0,
          total: pay.amount || 0,
        }
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running debt and add serial numbers
    let runningDebt = 0;
    return entries.map((entry, index) => {
      // For invoices: goods increase debt, payments decrease debt
      if (entry.data.type === 'invoice') {
        runningDebt += entry.data.goods;
      }
      if (entry.data.type === 'payment') {
        runningDebt -= entry.data.paid;
      }
      
      return {
        ...entry.data,
        serial: index + 1,
        currentDebt: runningDebt,
      };
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'نقدي',
      bank_transfer: 'تحويل بنكي',
      check: 'شيك',
      card: 'بطاقة',
      other: 'أخرى',
    };
    return methods[method] || method;
  };

  const ledger = buildLedger();
  const totalGoods = ledger.reduce((sum, e) => sum + e.goods, 0);
  const totalPaid = ledger.reduce((sum, e) => sum + e.paid, 0);
  const finalDebt = ledger.length > 0 ? ledger[ledger.length - 1].currentDebt : 0;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-EG');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            دفتر حساب: {partnerName}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
                placeholder="من تاريخ"
              />
              <span className="text-muted-foreground">إلى</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
                placeholder="إلى تاريخ"
              />
            </div>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">عدد الحركات</p>
            <p className="text-xl font-bold">{ledger.length}</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">إجمالي البضاعة</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(totalGoods)} ج.م</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">إجمالي المدفوع</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)} ج.م</p>
          </div>
          <div className={`${finalDebt >= 0 ? 'bg-red-500/10' : 'bg-green-500/10'} rounded-lg p-4 text-center`}>
            {finalDebt >= 0 ? (
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 mx-auto mb-1 text-green-500" />
            )}
            <p className="text-xs text-muted-foreground">الدين الحالي</p>
            <p className={`text-xl font-bold ${finalDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(finalDebt))} ج.م
            </p>
            <p className="text-xs text-muted-foreground">
              {finalDebt >= 0 ? "مستحق لنا" : "مستحق علينا"}
            </p>
          </div>
        </div>

        {/* Ledger Table */}
        {ledger.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد حركات في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center font-bold">التسلسل</TableHead>
                  <TableHead className="text-center font-bold">التاريخ</TableHead>
                  <TableHead className="text-center font-bold">النوع</TableHead>
                  <TableHead className="text-center font-bold">الدين الحالي</TableHead>
                  <TableHead className="text-center font-bold">البضاعة</TableHead>
                  <TableHead className="text-center font-bold">المدفوع</TableHead>
                  <TableHead className="text-center font-bold">اسم المنتج</TableHead>
                  <TableHead className="text-center font-bold">السعر</TableHead>
                  <TableHead className="text-center font-bold">الكمية</TableHead>
                  <TableHead className="text-center font-bold">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`} className="hover:bg-muted/30">
                    <TableCell className="text-center font-medium">
                      {entry.serial}
                    </TableCell>
                    <TableCell className="text-center">
                      {format(new Date(entry.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={entry.type === 'invoice' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {entry.typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-center font-bold ${entry.currentDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(entry.currentDebt))}
                      <span className="text-xs mr-1 font-normal">
                        {entry.currentDebt >= 0 ? "لنا" : "علينا"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.goods > 0 ? (
                        <span className="text-blue-600">{formatCurrency(entry.goods)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.paid > 0 ? (
                        <span className="text-green-600">{formatCurrency(entry.paid)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.productName || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.price > 0 ? formatCurrency(entry.price) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.quantity > 0 ? formatCurrency(entry.quantity) : '-'}
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      {formatCurrency(entry.total)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={4} className="text-center">الإجمالي</TableCell>
                  <TableCell className="text-center text-blue-600">
                    {formatCurrency(totalGoods)}
                  </TableCell>
                  <TableCell className="text-center text-green-600">
                    {formatCurrency(totalPaid)}
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell className={`text-center ${finalDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(finalDebt))}
                    <span className="text-xs mr-1 font-normal">
                      {finalDebt >= 0 ? "لنا" : "علينا"}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerStatementTab;
