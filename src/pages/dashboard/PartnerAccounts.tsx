import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Search, 
  Factory,
  Recycle,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerAccounts, type PartnerBalance } from '@/hooks/usePartnerAccounts';

export default function PartnerAccounts() {
  const navigate = useNavigate();
  const { 
    partnerBalances, 
    balancesLoading, 
    partnerTypes, 
    filteredBalances,
    calculateTotals,
    organizationType 
  } = usePartnerAccounts();
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPartnerTypeInfo = (type: string) => {
    switch (type) {
      case 'generator':
        return { label: 'المولدين', singularLabel: 'مولد', icon: Factory, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
      case 'recycler':
        return { label: 'المدورين', singularLabel: 'مدور', icon: Recycle, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      case 'transporter':
        return { label: 'الناقلين', singularLabel: 'ناقل', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
      default:
        return { label: 'الشركاء', singularLabel: 'شريك', icon: Building2, color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }
  };

  const getPageTitle = () => {
    switch (organizationType) {
      case 'transporter':
        return 'حسابات المولدين والمدورين';
      case 'generator':
        return 'حسابات الناقلين والمدورين';
      case 'recycler':
        return 'حسابات الناقلين والمولدين';
      default:
        return 'حسابات الشركاء';
    }
  };

  const handleViewPartnerAccount = (partnerId: string) => {
    navigate(`/dashboard/partner-account/${partnerId}`);
  };

  const renderPartnerTable = (balances: PartnerBalance[], type: string) => {
    const typeInfo = getPartnerTypeInfo(type);
    const Icon = typeInfo.icon;
    const filtered = balances.filter(balance => 
      balance.partner_organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const { totalReceivables, totalPayables } = calculateTotals(filtered);

    if (balancesLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">لا توجد حسابات {typeInfo.label}</p>
          <p className="text-sm">ستظهر الحسابات هنا بعد إنشاء الفواتير والمعاملات</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">لنا</span>
              </div>
              <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
                {formatCurrency(totalReceivables)} ج.م
              </p>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">علينا</span>
              </div>
              <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-1">
                {formatCurrency(totalPayables)} ج.م
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center font-bold w-16">م</TableHead>
                <TableHead className="font-bold">اسم الشريك</TableHead>
                <TableHead className="text-center font-bold">المدينة</TableHead>
                <TableHead className="text-center font-bold">إجمالي الفواتير</TableHead>
                <TableHead className="text-center font-bold">المدفوع</TableHead>
                <TableHead className="text-center font-bold">الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((balance, index) => {
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
                        <div className={`p-2 rounded-lg ${typeInfo.bgColor} ${typeInfo.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">
                          {balance.partner_organization?.name || 'غير محدد'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {balance.partner_organization?.city || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatCurrency(balance.total_invoiced)} ج.م
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {formatCurrency(balance.total_paid)} ج.م
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${isCreditor ? 'text-green-600' : isZero ? 'text-muted-foreground' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(balanceAmount))} ج.م
                      </span>
                      {!isZero && (
                        <Badge variant="outline" className={`mr-2 text-xs ${isCreditor ? 'border-green-300 text-green-600' : 'border-red-300 text-red-600'}`}>
                          {isCreditor ? 'لنا' : 'علينا'}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
          <span>إجمالي {typeInfo.label}: {filtered.length}</span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground">متابعة أرصدة الشركاء والمعاملات المالية</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بإسم الشريك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs for partner types */}
        {partnerTypes.length > 0 && (
          <Tabs defaultValue={partnerTypes[0]} className="w-full">
            <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: `repeat(${partnerTypes.length}, 1fr)` }}>
              {partnerTypes.map((type) => {
                const typeInfo = getPartnerTypeInfo(type);
                const Icon = typeInfo.icon;
                return (
                  <TabsTrigger key={type} value={type} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {typeInfo.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {partnerTypes.map((type) => (
              <TabsContent key={type} value={type} className="mt-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {(() => {
                        const typeInfo = getPartnerTypeInfo(type);
                        const Icon = typeInfo.icon;
                        return (
                          <>
                            <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                            حسابات {typeInfo.label}
                          </>
                        );
                      })()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderPartnerTable(filteredBalances(type), type)}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {partnerTypes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يمكن تحديد نوع المنظمة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
