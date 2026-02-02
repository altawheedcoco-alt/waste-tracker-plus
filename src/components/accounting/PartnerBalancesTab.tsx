import { useNavigate } from "react-router-dom";
import { useAccounting } from "@/hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Building2, 
  Search, 
  ChevronLeft,
  Factory,
  Recycle,
  Truck,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerBalancesTab() {
  const navigate = useNavigate();
  const { partnerBalances, balancesLoading } = useAccounting();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBalances = partnerBalances.filter(balance => 
    balance.partner_organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPartnerAccount = (partnerId: string) => {
    navigate(`/dashboard/partner-account/${partnerId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPartnerTypeInfo = (type: string) => {
    switch (type) {
      case 'generator':
        return { label: 'مولد', icon: Factory, color: 'text-blue-600' };
      case 'recycler':
        return { label: 'مدور', icon: Recycle, color: 'text-green-600' };
      case 'transporter':
        return { label: 'ناقل', icon: Truck, color: 'text-orange-600' };
      default:
        return { label: 'شريك', icon: Building2, color: 'text-muted-foreground' };
    }
  };

  if (balancesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>دفتر حسابات الشركاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          دفتر حسابات الشركاء
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          اختر الشريك لعرض كشف حسابه التفصيلي
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بإسم الشريك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Partners List */}
        {filteredBalances.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">لا توجد حسابات شركاء</p>
            <p className="text-sm">ستظهر الحسابات هنا بعد إنشاء الفواتير والمدفوعات</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center font-bold w-16">م</TableHead>
                  <TableHead className="font-bold">اسم الشريك</TableHead>
                  <TableHead className="text-center font-bold w-24">النوع</TableHead>
                  <TableHead className="text-center font-bold">الرصيد الحالي</TableHead>
                  <TableHead className="text-center font-bold w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.map((balance, index) => {
                  const orgType = balance.partner_organization?.organization_type || '';
                  const typeInfo = getPartnerTypeInfo(orgType);
                  const Icon = typeInfo.icon;
                  const balanceAmount = balance.balance || 0;
                  const isCreditor = balanceAmount > 0;
                  const isZero = balanceAmount === 0;
                  
                  return (
                    <TableRow 
                      key={balance.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleViewPartnerAccount(balance.partner_organization_id)}
                    >
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${typeInfo.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">
                            {balance.partner_organization?.name || 'غير محدد'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${isCreditor ? 'text-green-600' : isZero ? 'text-muted-foreground' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(balanceAmount))} ج.م
                        </span>
                        {!isZero && (
                          <span className={`text-xs mr-1 ${isCreditor ? 'text-green-600' : 'text-red-600'}`}>
                            ({isCreditor ? "لنا" : "علينا"})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        {filteredBalances.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t text-sm">
            <span className="text-muted-foreground">إجمالي الشركاء: {filteredBalances.length}</span>
            <div className="flex gap-4">
              <span className="text-green-600">
                لنا: {formatCurrency(filteredBalances.filter(b => (b.balance || 0) > 0).reduce((sum, b) => sum + (b.balance || 0), 0))} ج.م
              </span>
              <span className="text-red-600">
                علينا: {formatCurrency(Math.abs(filteredBalances.filter(b => (b.balance || 0) < 0).reduce((sum, b) => sum + (b.balance || 0), 0)))} ج.م
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
