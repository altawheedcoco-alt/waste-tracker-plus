import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AddCompanyDialog from '@/components/companies/AddCompanyDialog';
import {
  Building2,
  Plus,
  Search,
  Loader2,
  Factory,
  Truck,
  Recycle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCcw,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  organization_type: 'generator' | 'transporter' | 'recycler';
  email: string;
  phone: string;
  city: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

const CompanyManagement = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب بيانات الشركات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || company.organization_type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && company.is_active) ||
      (statusFilter === 'inactive' && !company.is_active) ||
      (statusFilter === 'verified' && company.is_verified) ||
      (statusFilter === 'unverified' && !company.is_verified);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'generator':
        return <Factory className="h-4 w-4" />;
      case 'transporter':
        return <Truck className="h-4 w-4" />;
      case 'recycler':
        return <Recycle className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generator':
        return 'الجهة المولدة';
      case 'transporter':
        return 'الجهة الناقلة';
      case 'recycler':
        return 'الجهة المدورة';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'generator':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'transporter':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'recycler':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: companies.length,
    generators: companies.filter((c) => c.organization_type === 'generator').length,
    transporters: companies.filter((c) => c.organization_type === 'transporter').length,
    recyclers: companies.filter((c) => c.organization_type === 'recycler').length,
    verified: companies.filter((c) => c.is_verified).length,
    active: companies.filter((c) => c.is_active).length,
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
        dir="rtl"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary" />
              إدارة الشركات
            </h1>
            <p className="text-muted-foreground mt-1">
              إضافة وإدارة الشركات المسجلة في النظام
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة شركة جديدة
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي الشركات</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.generators}</p>
              <p className="text-sm text-muted-foreground">جهات مولدة</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.transporters}</p>
              <p className="text-sm text-muted-foreground">شركات نقل</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.recyclers}</p>
              <p className="text-sm text-muted-foreground">جهات تدوير</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">موثقة</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              <p className="text-sm text-muted-foreground">نشطة</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالاسم أو البريد أو المدينة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="نوع الشركة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="generator">جهات مولدة</SelectItem>
                  <SelectItem value="transporter">شركات نقل</SelectItem>
                  <SelectItem value="recycler">جهات تدوير</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشطة</SelectItem>
                  <SelectItem value="inactive">غير نشطة</SelectItem>
                  <SelectItem value="verified">موثقة</SelectItem>
                  <SelectItem value="unverified">غير موثقة</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchCompanies} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                تحديث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              الشركات ({filteredCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد شركات مطابقة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الشركة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">التواصل</TableHead>
                      <TableHead className="text-right">المدينة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getTypeColor(company.organization_type)}`}>
                              {getTypeIcon(company.organization_type)}
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              {company.name_en && (
                                <p className="text-sm text-muted-foreground">{company.name_en}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeColor(company.organization_type)}>
                            {getTypeLabel(company.organization_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span dir="ltr">{company.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span dir="ltr">{company.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {company.city}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {company.is_verified ? (
                              <Badge variant="default" className="gap-1 bg-green-600 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                موثقة
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 w-fit">
                                <XCircle className="h-3 w-3" />
                                غير موثقة
                              </Badge>
                            )}
                            {company.is_active ? (
                              <Badge variant="outline" className="gap-1 border-green-500 text-green-600 w-fit">
                                نشطة
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 border-red-500 text-red-600 w-fit">
                                غير نشطة
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Company Dialog */}
        <AddCompanyDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSuccess={fetchCompanies}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default CompanyManagement;
