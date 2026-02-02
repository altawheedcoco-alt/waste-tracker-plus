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
import { Printer, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PartnerStatementTabProps {
  partnerId: string;
  partnerName: string;
}

interface LedgerEntry {
  id: string;
  serial: number;
  date: string;
  type: "invoice" | "payment";
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
          typeLabel: `فاتورة بيع رقم: ${inv.invoice_number}`,
          goods: isReceivable ? inv.total_amount : 0,
          paid: 0,
          productName: firstItem?.waste_type || 'خدمة',
          price: avgPrice,
          quantity: totalQty,
          total: inv.total_amount || 0,
        }
      });
    });

    // Add payments
    payments.forEach((pay: any) => {
      entries.push({
        date: pay.payment_date,
        data: {
          id: pay.id,
          date: pay.payment_date,
          type: "payment",
          typeLabel: `دفعة رقم: ${pay.payment_number}`,
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

  const periodLabel = dateFrom && dateTo 
    ? `عن فترة تبدأ من: ${dateFrom} إلى: ${dateTo}`
    : dateFrom 
    ? `من تاريخ: ${dateFrom}`
    : dateTo 
    ? `حتى تاريخ: ${dateTo}`
    : '';

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="print:pb-2">
        {/* Print Header */}
        <div className="text-center print:block hidden mb-4">
          <h1 className="text-xl font-bold">كشف حساب المورد: {partnerName}</h1>
          {periodLabel && <p className="text-sm text-muted-foreground">{periodLabel}</p>}
        </div>
        
        {/* Screen Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <CardTitle className="text-lg">كشف حساب: {partnerName}</CardTitle>
            {periodLabel && <p className="text-sm text-muted-foreground">{periodLabel}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 h-9"
              />
              <span className="text-muted-foreground text-sm">إلى</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 h-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Ledger Table - Excel Style */}
        {ledger.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground print:hidden">
            <p className="font-medium">لا توجد حركات في هذه الفترة</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto print:overflow-visible print:border-2 print:border-black">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 print:bg-gray-100">
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">التسلسل</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">التاريخ</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs min-w-[140px]">النوع</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">الدين الحالي</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">البضاعة</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">المدفوع</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">اسم المنتج</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">السعر</TableHead>
                  <TableHead className="text-center font-bold border-l print:border-black text-xs">الكمية</TableHead>
                  <TableHead className="text-center font-bold text-xs">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`} className="print:border-b print:border-black">
                    <TableCell className="text-center font-medium border-l print:border-black text-sm py-2">
                      {entry.serial}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      {format(new Date(entry.date), "yyyy/MM/dd")}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      <span className={entry.type === 'invoice' ? 'text-blue-600' : 'text-green-600'}>
                        {entry.typeLabel}
                      </span>
                    </TableCell>
                    <TableCell className={`text-center font-bold border-l print:border-black text-sm py-2 ${entry.currentDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(entry.currentDebt))}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      {entry.goods > 0 ? formatCurrency(entry.goods) : ''}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      {entry.paid > 0 ? formatCurrency(entry.paid) : ''}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      {entry.productName || ''}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      {entry.price > 0 ? formatCurrency(entry.price) : ''}
                    </TableCell>
                    <TableCell className="text-center border-l print:border-black text-sm py-2">
                      {entry.quantity > 0 ? formatCurrency(entry.quantity) : ''}
                    </TableCell>
                    <TableCell className="text-center font-medium text-sm py-2">
                      {formatCurrency(entry.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary - Excel Style */}
        {ledger.length > 0 && (
          <div className="flex justify-end print:mt-8">
            <div className="border rounded-lg overflow-hidden print:border-2 print:border-black w-72">
              <Table>
                <TableBody>
                  <TableRow className="print:border-b print:border-black">
                    <TableCell className="font-medium border-l print:border-black py-2 text-sm">الدين السابق</TableCell>
                    <TableCell className="text-center font-bold py-2 text-sm">0</TableCell>
                  </TableRow>
                  <TableRow className="print:border-b print:border-black">
                    <TableCell className="font-medium border-l print:border-black py-2 text-sm">إجمالي المشتريات</TableCell>
                    <TableCell className="text-center font-bold text-blue-600 py-2 text-sm">{formatCurrency(totalGoods)}</TableCell>
                  </TableRow>
                  <TableRow className="print:border-b print:border-black">
                    <TableCell className="font-medium border-l print:border-black py-2 text-sm">إجمالي المدفوعات</TableCell>
                    <TableCell className="text-center font-bold text-green-600 py-2 text-sm">{formatCurrency(totalPaid)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50 print:bg-gray-100">
                    <TableCell className="font-bold border-l print:border-black py-2 text-sm">إجمالي الدين</TableCell>
                    <TableCell className={`text-center font-bold py-2 text-sm ${finalDebt >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(Math.abs(finalDebt))}
                      <span className="text-xs mr-1 font-normal">
                        {finalDebt >= 0 ? "(لنا)" : "(علينا)"}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerStatementTab;
