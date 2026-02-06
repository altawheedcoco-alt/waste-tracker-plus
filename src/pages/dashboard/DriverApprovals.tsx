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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Check,
  X,
  Eye,
  Search,
  Loader2,
  Mail,
  Phone,
  Car,
  CreditCard,
  Calendar,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

interface PendingDriver {
  id: string;
  profile_id: string;
  license_number: string;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  license_expiry: string | null;
  is_available: boolean;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
}

interface Organization {
  id: string;
  name: string;
  organization_type: 'generator' | 'transporter' | 'recycler';
}

const DriverApprovals = () => {
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [transporterOrgs, setTransporterOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingDrivers();
    fetchTransporterOrgs();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_pending_drivers');

      if (error) throw error;
      setPendingDrivers(data || []);
    } catch (error) {
      console.error('Error fetching pending drivers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات السائقين',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransporterOrgs = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('organization_type', 'transporter')
        .eq('is_verified', true)
        .eq('is_active', true);

      if (error) throw error;
      setTransporterOrgs(data || []);
    } catch (error) {
      console.error('Error fetching transporter organizations:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedDriver || !selectedOrgId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار جهة ناقلة للسائق',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      // Update driver with organization and availability
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          organization_id: selectedOrgId,
          is_available: true,
        })
        .eq('id', selectedDriver.id);

      if (driverError) throw driverError;

      // Update profile to be active and link to organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          organization_id: selectedOrgId,
        })
        .eq('id', selectedDriver.profile_id);

      if (profileError) throw profileError;

      // Refresh the list
      await fetchPendingDrivers();

      toast({
        title: 'تمت الموافقة',
        description: 'تم تفعيل السائق وربطه بالشركة بنجاح',
      });
      setDialogOpen(false);
      setSelectedOrgId('');
    } catch (error) {
      console.error('Error approving driver:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الموافقة على السائق',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (driverId: string, profileId: string) => {
    setActionLoading(true);
    try {
      // Delete driver record
      const { error: driverError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (driverError) throw driverError;

      // Update profile to mark as inactive
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', profileId);

      if (profileError) throw profileError;

      // Refresh the list
      await fetchPendingDrivers();

      toast({
        title: 'تم الرفض',
        description: 'تم رفض طلب السائق',
        variant: 'destructive',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting driver:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في رفض السائق',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDrivers = pendingDrivers.filter(driver =>
    driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.license_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {pendingDrivers.length} طلب معلق
          </Badge>
          <div className="text-right">
            <h1 className="text-3xl font-bold">إدارة موافقات السائقين</h1>
            <p className="text-muted-foreground">مراجعة وقبول/رفض طلبات تسجيل السائقين</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 text-right">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <User className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">سائقين في انتظار المراجعة</p>
                <p className="text-3xl font-bold text-amber-600">{pendingDrivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle>طلبات تسجيل السائقين</CardTitle>
            <CardDescription>السائقين الذين سجلوا وينتظرون الموافقة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم أو البريد أو رقم الرخصة..."
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
                      <TableHead className="text-right">لوحة المركبة</TableHead>
                      <TableHead className="text-right">نوع المركبة</TableHead>
                      <TableHead className="text-right">رقم الرخصة</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">اسم السائق</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا يوجد سائقين في انتظار الموافقة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  setDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  setSelectedDriver(driver);
                                  setDialogOpen(true);
                                }}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(driver.id, driver.profile_id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {driver.vehicle_plate || '-'}
                          </TableCell>
                          <TableCell className="text-right">{driver.vehicle_type || '-'}</TableCell>
                          <TableCell className="text-right font-mono">{driver.license_number}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{driver.email}</TableCell>
                          <TableCell className="text-right font-medium">{driver.full_name}</TableCell>
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

      {/* Details & Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{selectedDriver?.full_name}</DialogTitle>
            <DialogDescription>
              تفاصيل طلب تسجيل السائق
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="font-mono">{selectedDriver.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span dir="ltr">{selectedDriver.phone || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <span>رقم الرخصة: <span className="font-mono">{selectedDriver.license_number}</span></span>
                </div>
                {selectedDriver.license_expiry && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>تاريخ انتهاء الرخصة: {new Date(selectedDriver.license_expiry).toLocaleDateString('en-US')}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Car className="w-5 h-5 text-muted-foreground" />
                  <span>
                    {selectedDriver.vehicle_type || 'غير محدد'} - 
                    <span className="font-mono mr-2">{selectedDriver.vehicle_plate || 'غير محدد'}</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-medium">اختر الجهة الناقلة للسائق:</p>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجهة الناقلة" />
                  </SelectTrigger>
                  <SelectContent>
                    {transporterOrgs.length === 0 ? (
                      <SelectItem value="none" disabled>
                        لا توجد جهات ناقلة مفعلة
                      </SelectItem>
                    ) : (
                      transporterOrgs.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">
                تاريخ التسجيل: {new Date(selectedDriver.created_at).toLocaleDateString('en-US')}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => selectedDriver && handleReject(selectedDriver.id, selectedDriver.profile_id)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              رفض
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading || !selectedOrgId}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              الموافقة والتفعيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DriverApprovals;
