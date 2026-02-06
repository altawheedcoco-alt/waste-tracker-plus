import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  Check,
  X,
  Eye,
  Search,
  Loader2,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

interface Organization {
  id: string;
  name: string;
  name_en: string | null;
  organization_type: 'generator' | 'transporter' | 'recycler';
  email: string;
  phone: string;
  address: string;
  city: string;
  is_verified: boolean;
  is_active: boolean;
  commercial_register: string | null;
  environmental_license: string | null;
  created_at: string;
}

const CompanyApprovals = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الشركات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_verified: true, is_active: true })
        .eq('id', id);

      if (error) throw error;

      setOrganizations(prev =>
        prev.map(org =>
          org.id === id ? { ...org, is_verified: true, is_active: true } : org
        )
      );

      toast({
        title: 'تمت الموافقة',
        description: 'تم تفعيل الشركة بنجاح',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error approving organization:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الموافقة على الشركة',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_verified: false, is_active: false })
        .eq('id', id);

      if (error) throw error;

      setOrganizations(prev =>
        prev.map(org =>
          org.id === id ? { ...org, is_verified: false, is_active: false } : org
        )
      );

      toast({
        title: 'تم الرفض',
        description: 'تم رفض طلب الشركة',
        variant: 'destructive',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting organization:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفض الشركة',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generator: 'الجهة المولدة',
      transporter: 'الجهة الناقلة',
      recycler: 'الجهة المدورة',
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      generator: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      transporter: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      recycler: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return colors[type] || '';
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = organizations.filter(o => !o.is_verified).length;
  const approvedCount = organizations.filter(o => o.is_verified && o.is_active).length;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-lg px-4 py-1">
            {pendingCount} طلب معلق
          </Badge>
          <div className="text-right">
            <h1 className="text-3xl font-bold">إدارة موافقات الشركات</h1>
            <p className="text-muted-foreground">مراجعة وقبول/رفض طلبات التسجيل</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الشركات</p>
                  <p className="text-3xl font-bold">{organizations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">شركات مفعلة</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-6 text-right">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">في انتظار المراجعة</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle>قائمة الشركات</CardTitle>
            <CardDescription>جميع الشركات المسجلة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد أو المدينة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">الإجراءات</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">المدينة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">اسم الشركة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا توجد شركات
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrganizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!org.is_verified && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleApprove(org.id)}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleReject(org.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {org.is_verified ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                مفعل
                              </Badge>
                            ) : (
                              <Badge variant="secondary">في الانتظار</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{org.city}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={getTypeBadgeColor(org.organization_type)}>
                              {getTypeLabel(org.organization_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {org.email}
                          </TableCell>
                          <TableCell className="text-right font-medium">{org.name}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              تفاصيل الشركة ومعلومات التسجيل
            </DialogDescription>
          </DialogHeader>

          {selectedOrg && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">نوع الشركة</p>
                  <Badge className={getTypeBadgeColor(selectedOrg.organization_type)}>
                    {getTypeLabel(selectedOrg.organization_type)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  {selectedOrg.is_verified ? (
                    <Badge className="bg-green-100 text-green-800">مفعل</Badge>
                  ) : (
                    <Badge variant="secondary">في الانتظار</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="font-mono">{selectedOrg.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span dir="ltr">{selectedOrg.phone}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span>{selectedOrg.address}، {selectedOrg.city}</span>
                </div>
              </div>

              {(selectedOrg.commercial_register || selectedOrg.environmental_license) && (
                <div className="space-y-3">
                  <p className="font-medium">المستندات</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOrg.commercial_register && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">السجل التجاري</p>
                        <p className="font-mono">{selectedOrg.commercial_register}</p>
                      </div>
                    )}
                    {selectedOrg.environmental_license && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground">الترخيص البيئي</p>
                        <p className="font-mono">{selectedOrg.environmental_license}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                تاريخ التسجيل: {new Date(selectedOrg.created_at).toLocaleDateString('en-US')}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedOrg && !selectedOrg.is_verified && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedOrg.id)}
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  رفض
                </Button>
                <Button
                  onClick={() => handleApprove(selectedOrg.id)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  الموافقة والتفعيل
                </Button>
              </>
            )}
            {selectedOrg?.is_verified && (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                إغلاق
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CompanyApprovals;
