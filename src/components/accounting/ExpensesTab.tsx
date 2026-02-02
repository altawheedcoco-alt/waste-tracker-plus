import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAccounting } from '@/hooks/useAccounting';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Search, 
  Wallet,
  Filter,
  Fuel,
  Wrench,
  Users,
  Home,
  Zap,
  Package,
  MoreHorizontal
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fuel: { label: 'وقود', icon: <Fuel className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800' },
  maintenance: { label: 'صيانة', icon: <Wrench className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  salaries: { label: 'رواتب', icon: <Users className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  rent: { label: 'إيجار', icon: <Home className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  utilities: { label: 'مرافق', icon: <Zap className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  equipment: { label: 'معدات', icon: <Package className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  other: { label: 'أخرى', icon: <MoreHorizontal className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'معتمد', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export default function ExpensesTab() {
  const { expenses, expensesLoading } = useAccounting();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.expense_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate totals by category
  const categoryTotals = Object.keys(categoryConfig).reduce((acc, cat) => {
    acc[cat] = expenses
      .filter(e => e.category === cat && e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  if (expensesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المصروفات</CardTitle>
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
      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(categoryConfig).map(([key, { label, icon, color }]) => (
          <Card 
            key={key} 
            className={`cursor-pointer transition-all hover:scale-105 ${
              categoryFilter === key ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
          >
            <CardContent className="p-3">
              <div className={`inline-flex items-center justify-center p-2 rounded-lg ${color} mb-2`}>
                {icon}
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-bold">{formatCurrency(categoryTotals[key] || 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">إجمالي المصروفات</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <Wallet className="h-10 w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              سجل المصروفات ({filteredExpenses.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-full sm:w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {Object.entries(categoryConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مصروفات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم المصروف</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الشحنة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => {
                    const catConfig = categoryConfig[expense.category] || categoryConfig.other;
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-sm">
                          {expense.expense_number}
                        </TableCell>
                        <TableCell>
                          <Badge className={catConfig.color}>
                            <span className="ml-1">{catConfig.icon}</span>
                            {catConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {expense.shipment?.shipment_number || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusLabels[expense.status]?.color || ''}>
                            {statusLabels[expense.status]?.label || expense.status}
                          </Badge>
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
