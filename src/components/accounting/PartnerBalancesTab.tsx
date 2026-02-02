import { useNavigate } from "react-router-dom";
import { useAccounting } from "@/hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ExternalLink,
  Minus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerBalancesTab() {
  const navigate = useNavigate();
  const { partnerBalances, balancesLoading } = useAccounting();
  const [searchTerm, setSearchTerm] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<string>("all");

  const filteredBalances = partnerBalances.filter(balance => {
    const matchesSearch = balance.partner_organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = balanceFilter === "all" || 
      (balanceFilter === "creditor" && (balance.balance || 0) > 0) ||
      (balanceFilter === "debtor" && (balance.balance || 0) < 0) ||
      (balanceFilter === "zero" && (balance.balance || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  const totalCreditors = partnerBalances
    .filter(b => (b.balance || 0) > 0)
    .reduce((sum, b) => sum + (b.balance || 0), 0);
  
  const totalDebtors = partnerBalances
    .filter(b => (b.balance || 0) < 0)
    .reduce((sum, b) => sum + Math.abs(b.balance || 0), 0);

  const handleViewPartnerAccount = (partnerId: string) => {
    navigate(`/dashboard/partner-account/${partnerId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (balancesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>أرصدة الشركاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              إجمالي الدائنين (لصالحنا)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCreditors)}
            </div>
            <p className="text-xs text-muted-foreground">
              {partnerBalances.filter(b => (b.balance || 0) > 0).length} شريك
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              إجمالي المدينين (علينا)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebtors)}
            </div>
            <p className="text-xs text-muted-foreground">
              {partnerBalances.filter(b => (b.balance || 0) < 0).length} شريك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              صافي الأرصدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalCreditors - totalDebtors >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalCreditors - totalDebtors)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCreditors - totalDebtors >= 0 ? 'لصالحنا' : 'علينا'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بإسم الشريك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={balanceFilter} onValueChange={setBalanceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة الأرصدة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأرصدة</SelectItem>
            <SelectItem value="creditor">دائنين فقط</SelectItem>
            <SelectItem value="debtor">مدينين فقط</SelectItem>
            <SelectItem value="zero">أرصدة صفرية</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            أرصدة الشركاء ({filteredBalances.length})
            <span className="text-sm font-normal text-muted-foreground">
              (اضغط على الشريك لعرض تفاصيل الحساب)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد أرصدة مسجلة</p>
              <p className="text-sm">ستظهر الأرصدة هنا بعد إنشاء الفواتير والمدفوعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الشريك</TableHead>
                    <TableHead>إجمالي المفوتر</TableHead>
                    <TableHead>إجمالي المدفوع</TableHead>
                    <TableHead>الرصيد</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر معاملة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBalances.map((balance) => {
                    const isCreditor = (balance.balance || 0) > 0;
                    const isZero = (balance.balance || 0) === 0;
                    return (
                      <TableRow 
                        key={balance.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleViewPartnerAccount(balance.partner_organization_id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {balance.partner_organization?.name || 'غير محدد'}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(balance.total_invoiced || 0)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(balance.total_paid || 0)}</TableCell>
                        <TableCell className={`font-bold ${isCreditor ? 'text-green-600' : isZero ? '' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(balance.balance || 0))}
                          {!isZero && (
                            <span className="text-xs mr-1">
                              {isCreditor ? "(لنا)" : "(علينا)"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isCreditor ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <TrendingUp className="h-3 w-3 ml-1" />
                              دائن
                            </Badge>
                          ) : isZero ? (
                            <Badge variant="outline">
                              <Minus className="h-3 w-3 ml-1" />
                              متوازن
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              <TrendingDown className="h-3 w-3 ml-1" />
                              مدين
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {balance.last_transaction_date 
                            ? format(new Date(balance.last_transaction_date), 'dd/MM/yyyy', { locale: ar })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPartnerAccount(balance.partner_organization_id);
                            }}
                          >
                            <ExternalLink className="h-4 w-4 ml-1" />
                            عرض الحساب
                          </Button>
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
    </div>
  );
}