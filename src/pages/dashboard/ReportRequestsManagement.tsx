import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Building2,
  User,
  AlertCircle,
  FileCheck,
  FileClock,
  FileX,
} from 'lucide-react';
import BackButton from '@/components/ui/back-button';

interface ReportRequest {
  id: string;
  request_type: string;
  request_title: string;
  requester_user_id: string;
  requester_organization_id: string | null;
  target_resource_id: string | null;
  target_resource_data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  auto_approve_at: string;
  approved_at: string | null;
  approved_by: string | null;
  admin_notes: string | null;
  pdf_url: string | null;
  created_at: string;
  requester_profile?: { full_name: string; email: string } | null;
  requester_organization?: { name: string } | null;
}

const ReportRequestsManagement = () => {
  const { roles } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ReportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ReportRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const isAdmin = roles.includes('admin');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('report_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and organizations for each request
      const enrichedRequests = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', req.requester_user_id)
            .single();

          let organization = null;
          if (req.requester_organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', req.requester_organization_id)
              .single();
            organization = org;
          }

          return {
            ...req,
            requester_profile: profile,
            requester_organization: organization,
          };
        })
      );

      setRequests(enrichedRequests as ReportRequest[]);
    } catch (error) {
      console.error('Error fetching report requests:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل طلبات التقارير',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();

      // Subscribe to realtime updates
      const channel = supabase
        .channel('admin_report_requests')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'report_requests' },
          () => {
            fetchRequests();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      aggregate_report: 'التقرير المجمع',
      recycling_certificate: 'شهادة إعادة التدوير',
      shipment_report: 'تقرير شحنة',
      waste_register: 'سجل المخلفات',
      operational_plan: 'الخطة التشغيلية',
      reports: 'التقارير والإحصائيات',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300"><Clock className="w-3 h-3 ml-1" />قيد الانتظار</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="w-3 h-3 ml-1" />تمت الموافقة</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-3 h-3 ml-1" />مرفوض</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAction = (request: ReportRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes('');
    setActionDialogOpen(true);
  };

  const processAction = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const updateData: Record<string, unknown> = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes || null,
      };

      if (actionType === 'approve') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('report_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: actionType === 'approve' ? 'تمت الموافقة' : 'تم الرفض',
        description: actionType === 'approve' 
          ? 'تم تجهيز المستند وإشعار المستخدم'
          : 'تم رفض الطلب وإشعار المستخدم',
      });

      setActionDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في معالجة الطلب',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = !searchQuery || 
      req.request_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester_organization?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || req.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">غير مصرح</h2>
          <p className="text-muted-foreground">هذه الصفحة متاحة فقط لمديري النظام</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              إدارة طلبات المستندات
            </h1>
            <p className="text-muted-foreground">
              مراجعة وموافقة طلبات التقارير والشهادات
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <FileClock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{pendingCount}</p>
                  <p className="text-sm text-amber-600 dark:text-amber-500">طلب قيد الانتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <FileCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{approvedCount}</p>
                  <p className="text-sm text-green-600 dark:text-green-500">تمت الموافقة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50 dark:bg-red-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <FileX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{rejectedCount}</p>
                  <p className="text-sm text-red-600 dark:text-red-500">مرفوض</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالعنوان أو اسم المستخدم أو الجهة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="pending" className="gap-1">
                    <Clock className="w-4 h-4" />
                    قيد الانتظار ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    تمت الموافقة
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="gap-1">
                    <XCircle className="w-4 h-4" />
                    مرفوض
                  </TabsTrigger>
                  <TabsTrigger value="all">الكل</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نوع الطلب</TableHead>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">مقدم الطلب</TableHead>
                      <TableHead className="text-right">الجهة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الطلب</TableHead>
                      <TableHead className="text-right">الموافقة التلقائية</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredRequests.map((request, index) => (
                        <motion.tr
                          key={request.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-b hover:bg-muted/50"
                        >
                          <TableCell>
                            <Badge variant="secondary">
                              {getRequestTypeLabel(request.request_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {request.request_title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {request.requester_profile?.full_name || 'غير معروف'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {request.requester_organization?.name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' ? (
                              <span className="text-sm text-amber-600">
                                {formatDistanceToNow(new Date(request.auto_approve_at), { locale: ar, addSuffix: true })}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleAction(request, 'approve')}
                                >
                                  <CheckCircle2 className="w-4 h-4 ml-1" />
                                  موافقة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleAction(request, 'reject')}
                                >
                                  <XCircle className="w-4 h-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-sm text-muted-foreground">
                                {request.admin_notes || '-'}
                              </span>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'سيتم تجهيز المستند وإشعار المستخدم'
                  : 'سيتم رفض الطلب وإشعار المستخدم'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedRequest.request_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {getRequestTypeLabel(selectedRequest.request_type)} - {selectedRequest.requester_organization?.name}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ملاحظات (اختياري)</label>
                  <Textarea
                    placeholder="أضف ملاحظة للمستخدم..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                onClick={processAction}
                disabled={processing}
              >
                {processing && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                {actionType === 'approve' ? 'موافقة' : 'رفض'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ReportRequestsManagement;
