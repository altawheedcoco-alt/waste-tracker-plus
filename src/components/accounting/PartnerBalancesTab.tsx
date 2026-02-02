import { useNavigate } from "react-router-dom";
import { useAccounting } from "@/hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Factory,
  Recycle,
  Truck,
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
  const [partnerTypeTab, setPartnerTypeTab] = useState<string>("all");

  // Filter by partner type
  const getPartnersByType = (type: string) => {
    if (type === "all") return partnerBalances;
    return partnerBalances.filter(balance => 
      balance.partner_organization?.organization_type === type
    );
  };

  const filteredBalances = getPartnersByType(partnerTypeTab).filter(balance => {
    const matchesSearch = balance.partner_organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = balanceFilter === "all" || 
      (balanceFilter === "creditor" && (balance.balance || 0) > 0) ||
      (balanceFilter === "debtor" && (balance.balance || 0) < 0) ||
      (balanceFilter === "zero" && (balance.balance || 0) === 0);
    return matchesSearch && matchesFilter;
  });

  // Stats by type
  const generatorBalances = partnerBalances.filter(b => b.partner_organization?.organization_type === 'generator');
  const recyclerBalances = partnerBalances.filter(b => b.partner_organization?.organization_type === 'recycler');
  const transporterBalances = partnerBalances.filter(b => b.partner_organization?.organization_type === 'transporter');

  const calculateStats = (balances: typeof partnerBalances) => {
    const creditors = balances.filter(b => (b.balance || 0) > 0);
    const debtors = balances.filter(b => (b.balance || 0) < 0);
    return {
      totalCreditors: creditors.reduce((sum, b) => sum + (b.balance || 0), 0),
      totalDebtors: debtors.reduce((sum, b) => sum + Math.abs(b.balance || 0), 0),
      creditorsCount: creditors.length,
      debtorsCount: debtors.length,
      total: balances.length,
    };
  };

  const allStats = calculateStats(partnerBalances);
  const generatorStats = calculateStats(generatorBalances);
  const recyclerStats = calculateStats(recyclerBalances);

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

  const renderBalanceTable = (balances: typeof filteredBalances, emptyMessage: string) => {
    if (balances.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
          <p className="text-sm">ستظهر الأرصدة هنا بعد إنشاء الفواتير والمدفوعات</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-bold">التسلسل</TableHead>
              <TableHead className="text-center font-bold">الشريك</TableHead>
              <TableHead className="text-center font-bold">النوع</TableHead>
              <TableHead className="text-center font-bold">إجمالي المفوتر</TableHead>
              <TableHead className="text-center font-bold">إجمالي المدفوع</TableHead>
              <TableHead className="text-center font-bold">الرصيد</TableHead>
              <TableHead className="text-center font-bold">الحالة</TableHead>
              <TableHead className="text-center font-bold">آخر معاملة</TableHead>
              <TableHead className="text-center font-bold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {balances.map((balance, index) => {
              const isCreditor = (balance.balance || 0) > 0;
              const isZero = (balance.balance || 0) === 0;
              const orgType = balance.partner_organization?.organization_type;
              
              return (
                <TableRow 
                  key={balance.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewPartnerAccount(balance.partner_organization_id)}
                >
                  <TableCell className="text-center font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <div className="flex items-center justify-center gap-2">
                      {orgType === 'generator' ? (
                        <Factory className="h-4 w-4 text-blue-500" />
                      ) : orgType === 'recycler' ? (
                        <Recycle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Truck className="h-4 w-4 text-orange-500" />
                      )}
                      {balance.partner_organization?.name || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={orgType === 'generator' ? 'default' : orgType === 'recycler' ? 'secondary' : 'outline'}>
                      {orgType === 'generator' ? 'مولد' : orgType === 'recycler' ? 'مدور' : 'ناقل'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{formatCurrency(balance.total_invoiced || 0)}</TableCell>
                  <TableCell className="text-center text-green-600">{formatCurrency(balance.total_paid || 0)}</TableCell>
                  <TableCell className={`text-center font-bold ${isCreditor ? 'text-green-600' : isZero ? '' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(balance.balance || 0))}
                    {!isZero && (
                      <span className="text-xs mr-1">
                        {isCreditor ? "(لنا)" : "(علينا)"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
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
                  <TableCell className="text-center">
                    {balance.last_transaction_date 
                      ? format(new Date(balance.last_transaction_date), 'dd/MM/yyyy', { locale: ar })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-center">
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
    );
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
      {/* Summary Cards by Type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Factory className="h-4 w-4 text-blue-500" />
              حسابات المولدين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {generatorStats.total}
            </div>
            <div className="flex gap-4 text-xs mt-2">
              <span className="text-green-600">لنا: {formatCurrency(generatorStats.totalCreditors)}</span>
              <span className="text-red-600">علينا: {formatCurrency(generatorStats.totalDebtors)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Recycle className="h-4 w-4 text-green-500" />
              حسابات المدورين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recyclerStats.total}
            </div>
            <div className="flex gap-4 text-xs mt-2">
              <span className="text-green-600">لنا: {formatCurrency(recyclerStats.totalCreditors)}</span>
              <span className="text-red-600">علينا: {formatCurrency(recyclerStats.totalDebtors)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              صافي الأرصدة الكلي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${allStats.totalCreditors - allStats.totalDebtors >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(allStats.totalCreditors - allStats.totalDebtors)}
            </div>
            <p className="text-xs text-muted-foreground">
              {allStats.totalCreditors - allStats.totalDebtors >= 0 ? 'لصالحنا' : 'علينا'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Partner Types */}
      <Tabs value={partnerTypeTab} onValueChange={setPartnerTypeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all" className="gap-2">
            <Users className="h-4 w-4" />
            الكل ({partnerBalances.length})
          </TabsTrigger>
          <TabsTrigger value="generator" className="gap-2">
            <Factory className="h-4 w-4" />
            المولدين ({generatorBalances.length})
          </TabsTrigger>
          <TabsTrigger value="recycler" className="gap-2">
            <Recycle className="h-4 w-4" />
            المدورين ({recyclerBalances.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
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

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                جميع الحسابات ({filteredBalances.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderBalanceTable(filteredBalances, "لا توجد أرصدة مسجلة")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="mt-4">
          <Card className="border-blue-500/30">
            <CardHeader className="bg-blue-500/5">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Factory className="h-5 w-5" />
                دفتر حسابات المولدين ({filteredBalances.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderBalanceTable(filteredBalances, "لا توجد حسابات مولدين")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recycler" className="mt-4">
          <Card className="border-green-500/30">
            <CardHeader className="bg-green-500/5">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Recycle className="h-5 w-5" />
                دفتر حسابات المدورين ({filteredBalances.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderBalanceTable(filteredBalances, "لا توجد حسابات مدورين")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}