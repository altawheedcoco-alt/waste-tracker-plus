import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Printer, Download, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PartnerStatementTabProps {
  partnerId: string;
  partnerName: string;
}

interface StatementEntry {
  id: string;
  date: string;
  type: "invoice" | "payment";
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
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
        .select("id, invoice_number, issue_date, total_amount, notes")
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
        .select("id, payment_number, payment_date, amount, payment_type, notes")
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

  // Build statement entries
  const buildStatement = (): StatementEntry[] => {
    const entries: StatementEntry[] = [];

    // Add invoices as debit entries
    invoices.forEach((inv) => {
      entries.push({
        id: inv.id,
        date: inv.issue_date,
        type: "invoice",
        reference: inv.invoice_number,
        description: inv.notes || "فاتورة",
        debit: inv.total_amount || 0,
        credit: 0,
        balance: 0,
      });
    });

    // Add payments
    payments.forEach((pay) => {
      const isIncoming = pay.payment_type === "incoming";
      entries.push({
        id: pay.id,
        date: pay.payment_date,
        type: "payment",
        reference: pay.payment_number,
        description: pay.notes || (isIncoming ? "دفعة واردة" : "دفعة صادرة"),
        debit: isIncoming ? 0 : pay.amount || 0,
        credit: isIncoming ? pay.amount || 0 : 0,
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

  const statement = buildStatement();
  const totalDebit = statement.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = statement.reduce((sum, e) => sum + e.credit, 0);
  const finalBalance = totalDebit - totalCredit;

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
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">عدد الحركات</p>
            <p className="text-2xl font-bold">{statement.length}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي المدين</p>
            <p className="text-2xl font-bold text-red-600">{totalDebit.toLocaleString()} ج.م</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
            <p className="text-2xl font-bold text-green-600">{totalCredit.toLocaleString()} ج.م</p>
          </div>
          <div className={`${finalBalance >= 0 ? 'bg-red-500/10' : 'bg-green-500/10'} rounded-lg p-4 text-center`}>
            <p className="text-sm text-muted-foreground">الرصيد النهائي</p>
            <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {Math.abs(finalBalance).toLocaleString()} ج.م
            </p>
            <p className="text-xs text-muted-foreground">
              {finalBalance >= 0 ? "(مستحق علينا)" : "(مستحق لنا)"}
            </p>
          </div>
        </div>

        {statement.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد حركات في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">التاريخ</TableHead>
                  <TableHead>المرجع</TableHead>
                  <TableHead>البيان</TableHead>
                  <TableHead className="text-left">مدين</TableHead>
                  <TableHead className="text-left">دائن</TableHead>
                  <TableHead className="text-left">الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.map((entry) => (
                  <TableRow key={`${entry.type}-${entry.id}`}>
                    <TableCell>
                      {format(new Date(entry.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{entry.reference}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-left text-red-600">
                      {entry.debit > 0 ? entry.debit.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-left text-green-600">
                      {entry.credit > 0 ? entry.credit.toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className={`text-left font-bold ${entry.balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.abs(entry.balance).toLocaleString()}
                      <span className="text-xs mr-1">
                        {entry.balance >= 0 ? "مدين" : "دائن"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-left">الإجمالي</TableCell>
                  <TableCell className="text-left text-red-600">
                    {totalDebit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-left text-green-600">
                    {totalCredit.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-left ${finalBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(finalBalance).toLocaleString()}
                    <span className="text-xs mr-1">
                      {finalBalance >= 0 ? "مدين" : "دائن"}
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
