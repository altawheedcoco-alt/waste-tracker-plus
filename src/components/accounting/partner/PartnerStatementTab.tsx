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
import { FileText, Printer, Calendar, Package, CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PartnerStatementTabProps {
  partnerId: string;
  partnerName: string;
}

interface StatementEntry {
  id: string;
  date: string;
  type: "invoice" | "payment" | "shipment";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  wasteType?: string;
  quantity?: number;
  unit?: string;
}

const PartnerStatementTab = ({ partnerId, partnerName }: PartnerStatementTabProps) => {
  const { organization } = useAuth();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch invoices
  const { data: invoices = [] } = useQuery({
    queryKey: ["partner-statement-invoices", organization?.id, partnerId, dateFrom, dateTo],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("invoices")
        .select(`
          id, invoice_number, issue_date, total_amount, notes, invoice_type,
          invoice_items(shipment_id, waste_type, waste_quantity, description)
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
    queryKey: ["partner-statement-payments", organization?.id, partnerId, dateFrom, dateTo],
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

  // Fetch shipments related to this partner
  const { data: shipments = [] } = useQuery({
    queryKey: ["partner-statement-shipments", organization?.id, partnerId, dateFrom, dateTo],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("shipments")
        .select("id, shipment_number, created_at, pickup_date, waste_type, quantity, unit, waste_description, status")
        .or(`generator_id.eq.${partnerId},recycler_id.eq.${partnerId}`)
        .eq("transporter_id", organization.id);

      if (dateFrom) query = query.gte("created_at", dateFrom);
      if (dateTo) query = query.lte("created_at", dateTo);

      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id && !!partnerId,
  });

  // Build statement entries
  const buildStatement = (): StatementEntry[] => {
    const entries: StatementEntry[] = [];

    // Add invoices as debit entries (what they owe us)
    invoices.forEach((inv: any) => {
      const isReceivable = inv.invoice_type === 'sales';
      const items = inv.invoice_items || [];
      const wasteInfo = items.length > 0 ? items[0] : null;
      
      entries.push({
        id: inv.id,
        date: inv.issue_date,
        type: "invoice",
        reference: inv.invoice_number,
        description: inv.notes || `فاتورة ${isReceivable ? 'مبيعات' : 'مشتريات'}`,
        debit: isReceivable ? (inv.total_amount || 0) : 0,
        credit: isReceivable ? 0 : (inv.total_amount || 0),
        balance: 0,
        wasteType: wasteInfo?.waste_type,
        quantity: wasteInfo?.waste_quantity,
      });
    });

    // Add payments
    payments.forEach((pay: any) => {
      const isIncoming = pay.payment_type === "incoming";
      entries.push({
        id: pay.id,
        date: pay.payment_date,
        type: "payment",
        reference: pay.payment_number,
        description: `${isIncoming ? 'دفعة واردة' : 'دفعة صادرة'} - ${getPaymentMethodLabel(pay.payment_method)}`,
        debit: isIncoming ? 0 : (pay.amount || 0),
        credit: isIncoming ? (pay.amount || 0) : 0,
        balance: 0,
      });
    });

    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    entries.forEach((entry) => {
      runningBalance += entry.debit - entry.credit;
      entry.balance = runningBalance;
    });

    return entries;
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

  const statement = buildStatement();
  const totalDebit = statement.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = statement.reduce((sum, e) => sum + e.credit, 0);
  const finalBalance = totalDebit - totalCredit;

  // Calculate shipment stats
  const totalShipments = shipments.length;
  const totalQuantity = shipments.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            كشف حساب {partnerName}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">الحركات</p>
            <p className="text-xl font-bold">{statement.length}</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-4 text-center">
            <Package className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">الشحنات</p>
            <p className="text-xl font-bold text-blue-600">{totalShipments}</p>
            <p className="text-xs text-muted-foreground">{totalQuantity.toLocaleString()} كجم</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 text-center">
            <ArrowUpRight className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">مدين (لنا)</p>
            <p className="text-xl font-bold text-red-600">{totalDebit.toLocaleString()}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 text-center">
            <ArrowDownRight className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">دائن (منهم)</p>
            <p className="text-xl font-bold text-green-600">{totalCredit.toLocaleString()}</p>
          </div>
          <div className={`${finalBalance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'} rounded-lg p-4 text-center col-span-2 sm:col-span-1`}>
            {finalBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 mx-auto mb-1 text-red-500" />
            )}
            <p className="text-xs text-muted-foreground">الرصيد</p>
            <p className={`text-xl font-bold ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(finalBalance).toLocaleString()} ج.م
            </p>
            <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? "مستحق لنا" : "مستحق علينا"}
            </p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-4 text-center">
            <CreditCard className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <p className="text-xs text-muted-foreground">المدفوعات</p>
            <p className="text-xl font-bold text-purple-600">{payments.length}</p>
          </div>
        </div>

        {/* Shipments Summary */}
        {shipments.length > 0 && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                ملخص الشحنات مع هذا الشريك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {Object.entries(
                  shipments.reduce((acc: Record<string, number>, s: any) => {
                    const type = s.waste_type || 'أخرى';
                    acc[type] = (acc[type] || 0) + (s.quantity || 0);
                    return acc;
                  }, {})
                ).map(([type, qty]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-muted-foreground">{type}:</span>
                    <span className="font-medium">{(qty as number).toLocaleString()} كجم</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statement Table */}
        {statement.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد حركات في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[100px]">التاريخ</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead className="text-left">مدين (لنا)</TableHead>
                  <TableHead className="text-left">دائن (علينا)</TableHead>
                  <TableHead className="text-left">الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(new Date(entry.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.type === 'invoice' ? 'default' : entry.type === 'payment' ? 'secondary' : 'outline'}>
                        {entry.type === 'invoice' && <FileText className="h-3 w-3 ml-1" />}
                        {entry.type === 'payment' && <CreditCard className="h-3 w-3 ml-1" />}
                        {entry.type === 'shipment' && <Package className="h-3 w-3 ml-1" />}
                        {entry.type === 'invoice' ? 'فاتورة' : entry.type === 'payment' ? 'دفعة' : 'شحنة'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                    <TableCell>
                      <div>
                        {entry.description}
                        {entry.wasteType && (
                          <span className="text-xs text-muted-foreground block">
                            {entry.wasteType} {entry.quantity && `- ${entry.quantity} ${entry.unit || 'كجم'}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      {entry.debit > 0 ? (
                        <span className="text-green-600 font-medium">{entry.debit.toLocaleString()}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-left">
                      {entry.credit > 0 ? (
                        <span className="text-red-600 font-medium">{entry.credit.toLocaleString()}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className={`text-left font-bold ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(entry.balance).toLocaleString()}
                      <span className="text-xs mr-1 font-normal">
                        {entry.balance >= 0 ? "لنا" : "علينا"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={4} className="text-left">الإجمالي</TableCell>
                  <TableCell className="text-left text-green-600">
                    {totalDebit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-left text-red-600">
                    {totalCredit.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-left ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(finalBalance).toLocaleString()}
                    <span className="text-xs mr-1 font-normal">
                      {finalBalance >= 0 ? "لنا" : "علينا"}
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
